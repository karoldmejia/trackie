import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CreateDailyLogDto } from "../dtos/dailylog.dto";
import { DailyLog } from "../entities/dailylog.entity";
import { DailyLogMetric } from "../entities/daily-log-metric.entity";
import { MetricType } from "../entities/metric-type.entity";
import { WorkoutExecution } from "../entities/workout-execution.entity";import { Between, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { MetricValueType } from "../enums/metric-value-type.enum";
import { ProgramService } from "./program.service";

export interface PaginatedDailyLogs {
    items: DailyLog[];
    total: number;
    hasMore: boolean;
}

export interface DailyLogMetricResponse {
    key: string;
    label: string;
    unit: MetricType['unit'];
    type: MetricType['type'];
    value: number | null;
    isUniversal: boolean;
    isDerived: boolean;
}

export interface WorkoutBlockExecutionResponse {
    id: string;
    templateId: string | null;
    kindSnapshot: string;
    nameSnapshot: string;
    metricTypeSnapshot: string;
    plannedRounds: number;
    actualRounds: number;
    targetDistanceMeters: number | null;
    actualDistanceMeters: number | null;
    targetDurationSeconds: number | null;
    actualDurationSeconds: number | null;
    targetReps: number | null;
    actualReps: number | null;
    completed: boolean;
}

export interface WorkoutExecutionResponse {
    id: string;
    routineId: string | null;
    workoutId: string | null;
    workoutNameSnapshot: string;
    workoutTypeSnapshot: string;
    totalDistanceMeters: number;
    totalDurationSeconds: number;
    totalRounds: number;
    completed: boolean;
    notes: string | null;
    blocks: WorkoutBlockExecutionResponse[];
}

export interface DailyLogResponse {
    id: string;
    date: string;
    createdAt: Date;
    updatedAt: Date;
    /** Métricas del log con metadatos del catálogo. */
    metrics: DailyLogMetricResponse[];
    /** Mapa plano { metricKey: value } para el front. */
    extraMetrics: Record<string, number | null>;
    /** Ejecuciones de workouts del log. */
    workouts: WorkoutExecutionResponse[];
}

@Injectable()
export class DailyLogService {
    private readonly logger = new Logger(DailyLogService.name);

    constructor(
        @InjectRepository(DailyLog)
        private readonly dailyLogRepo: Repository<DailyLog>,
        @InjectRepository(DailyLogMetric)
        private readonly dailyLogMetricRepo: Repository<DailyLogMetric>,
        @InjectRepository(MetricType)
        private readonly metricTypeRepo: Repository<MetricType>,
        @Inject(forwardRef(() => ProgramService))
        private readonly programService: ProgramService,
    ) { }

    private readonly relations = { metrics: { metricType: true }, workoutExecutions: { blocks: true } } as const;

    /** Función auxiliar para obtener la fecha local en formato YYYY-MM-DD */
    private getLocalDate(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Valida las claves contra el catálogo y normaliza por tipo de métrica.
     * Pura (no toca la BD) para poder testearla.
     * - Key inexistente o inactiva -> 400.
     * - Valor negativo en number/duration -> 400.
     * - boolean: true/false o 0/1. number/duration: number finito >= 0.
     * Devuelve filas listas para upsert.
     */
    validateAndNormalize(
        metrics: Record<string, unknown>,
        catalog: MetricType[],
    ): Array<{ metricTypeId: string; value: number }> {
        const byKey = new Map(catalog.map((m) => [m.key, m]));
        const unknown: string[] = [];
        const inactive: string[] = [];
        const normalized: Array<{ metricTypeId: string; value: number }> = [];

        for (const [rawKey, rawValue] of Object.entries(metrics ?? {})) {
            const key = rawKey.trim().toLowerCase();
            const metric = byKey.get(key);
            if (!metric) {
                unknown.push(rawKey);
                continue;
            }
            if (!metric.isActive) {
                inactive.push(key);
                continue;
            }

            switch (metric.type) {
                case MetricValueType.BOOLEAN: {
                    if (typeof rawValue === 'boolean') {
                        normalized.push({ metricTypeId: metric.id, value: rawValue ? 1 : 0 });
                    } else if (typeof rawValue === 'number' && (rawValue === 0 || rawValue === 1)) {
                        normalized.push({ metricTypeId: metric.id, value: rawValue });
                    } else {
                        throw new BadRequestException(`La métrica "${key}" es boolean; se esperaba true/false o 0/1`);
                    }
                    break;
                }
                case MetricValueType.NUMBER:
                case MetricValueType.DURATION: {
                    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
                    if (typeof rawValue !== 'number' && Number.isNaN(value)) {
                        throw new BadRequestException(`La métrica "${key}" debe ser numérica`);
                    }
                    if (!Number.isFinite(value)) {
                        throw new BadRequestException(`La métrica "${key}" debe ser un número finito`);
                    }
                    if (value < 0) {
                        throw new BadRequestException(`La métrica "${key}" no puede ser negativa`);
                    }
                    normalized.push({ metricTypeId: metric.id, value });
                    break;
                }
            }
        }

        if (unknown.length) {
            throw new BadRequestException(`Métricas desconocidas: ${unknown.join(', ')}`);
        }
        if (inactive.length) {
            throw new BadRequestException(`Métricas inactivas: ${inactive.join(', ')}`);
        }

        return normalized;
    }

    /**
     * Upsert masivo de las métricas del log: ON CONFLICT (dailyLogId, metricTypeId).
     * Valida el catálogo, normaliza por valueType, sincroniza el ProgramDay.
     */
    async upsert(dto: CreateDailyLogDto): Promise<DailyLogResponse> {
        const date = dto.date;
        const catalog = await this.metricTypeRepo.find();
        const rows = this.validateAndNormalize(dto.metrics ?? {}, catalog);

        let log = await this.dailyLogRepo.findOne({ where: { date } });
        if (!log) {
            log = this.dailyLogRepo.create({ date });
            log = await this.dailyLogRepo.save(log);
        }

        if (rows.length > 0) {
            const valuesSql: string[] = [];
            const params: unknown[] = [log.id];
            rows.forEach((row, i) => {
                const base = params.length + 1;
                valuesSql.push(`($1, $${base}, $${base + 1})`);
                params.push(row.metricTypeId, row.value);
            });
            await this.dailyLogMetricRepo.query(
                `INSERT INTO daily_log_metrics ("dailyLogId", "metricTypeId", "value")
                 VALUES ${valuesSql.join(', ')}
                 ON CONFLICT ("dailyLogId", "metricTypeId") DO UPDATE SET value = EXCLUDED.value`,
                params,
            );
        }

        const saved = await this.findByDate(date);
        await this.programService.syncProgramDayForDate(date);

        return this.toResponse(saved as DailyLog);
    }

    // Crear (alias de upsert, POST /daily-logs)
    async create(dto: CreateDailyLogDto): Promise<DailyLogResponse> {
        return this.upsert(dto);
    }

    async findById(id: string): Promise<DailyLog | null> {
        return this.dailyLogRepo.findOne({ where: { id }, relations: this.relations });
    }

    async findByDate(date: string): Promise<DailyLog | null> {
        return this.dailyLogRepo.findOne({ where: { date }, relations: this.relations });
    }

    async findAll(): Promise<DailyLog[]> {
        return this.dailyLogRepo.find({ order: { date: 'DESC' }, relations: this.relations });
    }

    async findByDateRange(start: string, end: string): Promise<DailyLog[]> {
        return this.dailyLogRepo.find({
            where: { date: Between(start, end) },
            order: { date: 'ASC' },
            relations: this.relations,
        });
    }

    async findPaginated(skip: number, take: number): Promise<PaginatedDailyLogs> {
        const [items, total] = await this.dailyLogRepo.findAndCount({
            order: { date: 'DESC' },
            relations: this.relations,
            skip,
            take,
        });

        return {
            items,
            total,
            hasMore: skip + items.length < total,
        };
    }

    async delete(id: string): Promise<void> {
        const log = await this.dailyLogRepo.findOne({ where: { id } });
        if (!log) {
            return;
        }

        const date = log.date;
        // Las métricas y los ProgramDay se borran por CASCADE (FKs)
        await this.dailyLogRepo.delete(id);

        try {
            await this.programService.removeProgramDayByDate(date);
        } catch (error) {
            this.logger.error(`Error removing ProgramDay for ${date}: ${error}`);
        }
    }

    // Alias de compatibilidad (Fase 6 lo eliminará)
    async remove(id: string): Promise<void> {
        return this.delete(id);
    }

    /** Borra una métrica concreta del log y recalcula el ProgramDay del día. */
    async deleteMetric(dailyLogId: string, metricTypeId: string): Promise<void> {
        const log = await this.dailyLogRepo.findOne({ where: { id: dailyLogId } });
        if (!log) {
            throw new NotFoundException(`DailyLog ${dailyLogId} no encontrado`);
        }
        await this.dailyLogMetricRepo.delete({ dailyLogId, metricTypeId });
        await this.programService.syncProgramDayForDate(log.date);
    }

    /**
     * Métricas derivadas desde las workoutExecutions del log:
     * - workout_count: número de ejecuciones
     * - workout_total_km: suma de totalDistanceMeters / 1000
     * - workout_total_minutes: suma de totalDurationSeconds / 60
     * Usa las relaciones cargadas (workoutExecutions).
     */
    computeDerivedMetrics(dailyLog: DailyLog): Record<string, number> {
        const executions = dailyLog.workoutExecutions ?? [];
        if (executions.length === 0) {
            return {};
        }
        let meters = 0;
        let seconds = 0;
        for (const execution of executions) {
            meters += execution.totalDistanceMeters ?? 0;
            seconds += execution.totalDurationSeconds ?? 0;
        }
        return {
            workout_count: executions.length,
            workout_total_km: Number((meters / 1000).toFixed(2)),
            workout_total_minutes: Number((seconds / 60).toFixed(2)),
        };
    }

    /** Shape plano del DailyLog para el front. */
    toResponse(log: DailyLog): DailyLogResponse {
        const metrics: DailyLogMetricResponse[] = (log.metrics ?? []).map((m) => ({
            key: m.metricType?.key ?? '',
            label: m.metricType?.label ?? '',
            unit: m.metricType?.unit as MetricType['unit'],
            type: m.metricType?.type as MetricType['type'],
            value: m.value ?? null,
            isUniversal: m.metricType?.isUniversal ?? false,
            isDerived: m.metricType?.isDerived ?? false,
        }));

        const extraMetrics: Record<string, number | null> = {};
        for (const m of metrics) {
            extraMetrics[m.key] = m.value;
        }

        return {
            id: log.id,
            date: log.date,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
            metrics,
            extraMetrics,
            workouts: (log.workoutExecutions ?? []).map((execution) => this.workoutToResponse(execution)),
        };
    }

    private workoutToResponse(execution: WorkoutExecution) {
        return {
            id: execution.id,
            routineId: execution.routineId,
            workoutId: execution.workoutId,
            workoutNameSnapshot: execution.workoutNameSnapshot,
            workoutTypeSnapshot: execution.workoutTypeSnapshot,
            totalDistanceMeters: execution.totalDistanceMeters,
            totalDurationSeconds: execution.totalDurationSeconds,
            totalRounds: execution.totalRounds,
            completed: execution.completed,
            notes: execution.notes,
            blocks: (execution.blocks ?? []).map((b) => ({
                id: b.id,
                templateId: b.templateId,
                kindSnapshot: b.kindSnapshot,
                nameSnapshot: b.nameSnapshot,
                metricTypeSnapshot: b.metricTypeSnapshot,
                plannedRounds: b.plannedRounds,
                actualRounds: b.actualRounds,
                targetDistanceMeters: b.targetDistanceMeters,
                actualDistanceMeters: b.actualDistanceMeters,
                targetDurationSeconds: b.targetDurationSeconds,
                actualDurationSeconds: b.actualDurationSeconds,
                targetReps: b.targetReps,
                actualReps: b.actualReps,
                completed: b.completed,
            })),
        };
    }

    // Promedio de calorías de un rango de fechas
    async getWeeklyAverage(start: string, end: string): Promise<number> {
        const logs = await this.findByDateRange(start, end);
        if (!logs.length) return 0;
        const total = logs.reduce((acc, log) => {
            const calories = (log.metrics ?? []).find((m) => m.metricType?.key === 'calories');
            return acc + (calories?.value ?? 0);
        }, 0);
        return total / logs.length;
    }
}
