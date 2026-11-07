import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { CreateDailyLogDto } from "../dtos/dailylog.dto";
import { DailyLog } from "../entities/dailylog.entity";
import { DailyLogMetric } from "../entities/daily-log-metric.entity";
import { MetricType } from "../entities/metric-type.entity";
import { Between, DeepPartial, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CutPhaseService } from "./cutphase.service";


export interface PaginatedDailyLogs {
    items: DailyLog[];
    total: number;
    hasMore: boolean;
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
        @Inject(forwardRef(() => CutPhaseService))
        private readonly cutPhaseService: CutPhaseService,
    ) { }

    // ------------------------------------------------------------------
    // INTERIM (Fase 1 → Fase 2): puente entre el DTO legado (calories, steps…)
    // y el nuevo modelo basado en metric_types. Elimina esta sección junto
    // con los getters de DailyLog en la Fase 2/6.
    // ------------------------------------------------------------------
    private readonly relations = { metrics: { metricType: true } } as const;

    private async applyLegacyMetrics(log: DailyLog, dto: Partial<CreateDailyLogDto>): Promise<void> {
        const keyByField: Record<string, string | undefined> = {
            calories: 'calories',
            steps: 'steps',
            proteinGrams: 'protein',
            waterLiters: 'water',
        };

        const pending: Array<{ key: string; value: number }> = [];
        for (const [field, key] of Object.entries(keyByField)) {
            const raw = (dto as Record<string, unknown>)[field];
            if (raw !== undefined && raw !== null && key) {
                pending.push({ key, value: Number(raw) });
            }
        }
        if (dto.workout !== undefined && dto.workout !== null) {
            pending.push({ key: 'workout_count', value: dto.workout === 'none' ? 0 : 1 });
        }

        if (!pending.length) return;

        const types = await this.metricTypeRepo.find();
        const typeByKey = new Map(types.map((t) => [t.key, t]));

        for (const { key, value } of pending) {
            const metricType = typeByKey.get(key);
            if (!metricType) {
                this.logger.warn(`MetricType con key "${key}" no existe; se omite el valor ${value}`);
                continue;
            }
            await this.dailyLogMetricRepo.query(
                `INSERT INTO daily_log_metrics ("dailyLogId", "metricTypeId", "value")
                 VALUES ($1, $2, $3)
                 ON CONFLICT ("dailyLogId", "metricTypeId") DO UPDATE SET value = EXCLUDED.value`,
                [log.id, metricType.id, value],
            );
        }
    }

    /** Adjunta como props propias enumerables los campos legados (shadowing de los getters). */
    private decorateLegacy<T extends DailyLog | null>(log: T): T {
        if (!log) return log;
        Object.defineProperties(log, {
            calories: { value: log.calories, enumerable: true, configurable: true },
            steps: { value: log.steps, enumerable: true, configurable: true },
            proteinGrams: { value: log.proteinGrams, enumerable: true, configurable: true },
            waterLiters: { value: log.waterLiters, enumerable: true, configurable: true },
            workout: { value: log.workout, enumerable: true, configurable: true },
        });
        return log;
    }

    // Función auxiliar para obtener la fecha local en formato YYYY-MM-DD
    private getLocalDate(date?: Date): string {
        const targetDate = date || new Date();
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }


    // Crear o actualizar (upsert)
    async create(dto: CreateDailyLogDto): Promise<DailyLog> {
        const date = dto.date || this.getLocalDate();
        let existing = await this.dailyLogRepo.findOne({ where: { date } });

        let savedLog: DailyLog;
        if (existing) {
            const { calories, steps, proteinGrams, waterLiters, workout, ...rest } = dto as any;
            Object.assign(existing, rest);
            savedLog = await this.dailyLogRepo.save(existing);
        } else {
            const { calories, steps, proteinGrams, waterLiters, workout, ...rest } = dto as any;
            const log = this.dailyLogRepo.create({
                ...rest,
                date,
            } as DeepPartial<DailyLog>);
            savedLog = await this.dailyLogRepo.save(log);
        }

        await this.applyLegacyMetrics(savedLog, dto);
        savedLog = (await this.findByDate(savedLog.date)) as DailyLog;

        await this.syncWithCutPhase(savedLog);

        return savedLog;
    }

    async upsert(dto: CreateDailyLogDto): Promise<DailyLog> {
        let log = await this.dailyLogRepo.findOne({ where: { date: dto.date } });
        let savedLog: DailyLog;

        // INTERIM: no persistir los campos legados como columnas (ya no existen);
        // viajan a daily_log_metrics vía applyLegacyMetrics.
        const { calories, steps, proteinGrams, waterLiters, workout, ...rest } = dto as any;
        if (!log) {
            log = this.dailyLogRepo.create(rest as DeepPartial<DailyLog>);
            savedLog = await this.dailyLogRepo.save(log);
        } else {
            Object.assign(log, rest);
            savedLog = await this.dailyLogRepo.save(log);
        }

        await this.applyLegacyMetrics(savedLog, dto);
        savedLog = (await this.findByDate(savedLog.date)) as DailyLog;

        await this.syncWithCutPhase(savedLog);

        return savedLog;
    }

    // Método específico para actualizar solo algunos campos
    async updateByDate(date: string, dto: Partial<CreateDailyLogDto>): Promise<DailyLog> {
        let log = await this.dailyLogRepo.findOne({ where: { date } });
        let savedLog: DailyLog;

        const { calories, steps, proteinGrams, waterLiters, workout, ...rest } = dto as any;
        if (!log) {
            log = this.dailyLogRepo.create({
                ...rest,
                date,
            } as DeepPartial<DailyLog>);
            savedLog = await this.dailyLogRepo.save(log);
        } else {
            Object.assign(log, rest);
            savedLog = await this.dailyLogRepo.save(log);
        }

        await this.applyLegacyMetrics(savedLog, dto);
        savedLog = (await this.findByDate(savedLog.date)) as DailyLog;

        await this.syncWithCutPhase(savedLog);

        return savedLog;
    }

    private async syncWithCutPhase(dailyLog: DailyLog): Promise<void> {
        try {
            this.logger?.log(`Syncing daily log ${dailyLog.date} with cut phase`);

            const activePhase = await this.cutPhaseService.findActive();

            if (!activePhase) {
                this.logger?.log(`No active phase found for date ${dailyLog.date}`);
                return;
            }

            if (dailyLog.date < activePhase.startDate || dailyLog.date > activePhase.endDate) {
                this.logger?.log(`Date ${dailyLog.date} outside phase range (${activePhase.startDate} - ${activePhase.endDate})`);
                return;
            }

            this.logger?.log(`Updating day compliance for phase ${activePhase.id}, date ${dailyLog.date}`);
            await this.cutPhaseService.updateDayCompliance(activePhase.id, dailyLog.date);
            this.logger?.log(`Successfully synced date ${dailyLog.date}`);

        } catch (error) {
            console.error(`Error syncing daily log ${dailyLog.date} with cut phase:`, error);
        }
    }

    // Obtener todos los registros
    async findAll(): Promise<DailyLog[]> {
        const logs = await this.dailyLogRepo.find({ order: { date: 'DESC' }, relations: this.relations });
        return logs.map((log) => this.decorateLegacy(log));
    }

    async findPaginated(skip: number, take: number): Promise<PaginatedDailyLogs> {
        const [items, total] = await this.dailyLogRepo.findAndCount({
            order: { date: 'DESC' },
            relations: this.relations,
            skip,
            take,
        });

        return {
            items: items.map((log) => this.decorateLegacy(log)),
            total,
            hasMore: skip + items.length < total,
        };
    }

    // Buscar por fecha exacta
    async findByDate(date: string): Promise<DailyLog | null> {
        const log = await this.dailyLogRepo.findOne({ where: { date }, relations: this.relations });
        return this.decorateLegacy(log);
    }

    // Buscar rango de fechas (para dashboards y promedio semanal)
    async findByDateRange(start: string, end: string): Promise<DailyLog[]> {
        const logs = await this.dailyLogRepo.find({
            where: { date: Between(start, end) },
            order: { date: 'ASC' },
            relations: this.relations,
        });
        return logs.map((log) => this.decorateLegacy(log));
    }

async remove(id: string): Promise<void> {
    const log = await this.dailyLogRepo.findOne({ where: { id } });

    if (!log) {
        this.logger?.log(`DailyLog ${id} not found, nothing to delete`);
        return;
    }

    const date = log.date;

    await this.dailyLogRepo.delete(id);

    try {
        await this.cutPhaseService.removeDayByDate(date);
    } catch (error) {
        this.logger?.error(`Error removing CutPhaseDay for ${date}: ${error}`);
    }
}
    // Promedio de calorías de un rango de fechas
    async getWeeklyAverage(start: string, end: string): Promise<number> {
        const logs = await this.findByDateRange(start, end);
        if (!logs.length) return 0;
        const total = logs.reduce((acc, log) => acc + log.calories, 0);
        return total / logs.length;
    }
}