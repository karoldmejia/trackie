import { BadRequestException, Injectable, Logger, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between, DataSource } from 'typeorm';
import { Program } from '../entities/program.entity';
import { ProgramDay } from '../entities/program-day.entity';
import { ProgramMetricTarget } from '../entities/program-metric-target.entity';
import { ProgramMeasurement } from '../entities/program-measurement.entity';
import { DailyLog } from '../entities/dailylog.entity';
import { MetricType } from '../entities/metric-type.entity';
import { WeightLogMetric } from '../entities/weight-log-metric.entity';
import { DailyLogService } from './dailylog.service';
import { CreateProgramDto, ProgramMetricTargetDto, UpdateProgramDto } from '../dtos/program.dto';
import { TargetDirection } from '../enums/target-direction.enum';
import { WeeklySummary } from '../interfaces/weekly-summary.interface';
import { TrendsData, WeeklyTrend } from '../interfaces/weekly-trend.interface';
import { ProgramMeasurementKind } from '../enums/program-measurement-kind.enum';

@Injectable()
export class ProgramService {
    private readonly logger = new Logger(ProgramService.name);

    constructor(
        @InjectRepository(Program)
        private readonly programRepo: Repository<Program>,
        @InjectRepository(ProgramDay)
        private readonly programDayRepo: Repository<ProgramDay>,
        @InjectRepository(ProgramMetricTarget)
        private readonly targetRepo: Repository<ProgramMetricTarget>,
        @InjectRepository(ProgramMeasurement)
        private readonly measurementRepo: Repository<ProgramMeasurement>,
        @InjectRepository(WeightLogMetric)
        private readonly weightLogMetricRepo: Repository<WeightLogMetric>,
        @InjectRepository(MetricType)
        private readonly metricTypeRepo: Repository<MetricType>,
        @Inject(forwardRef(() => DailyLogService))
        private readonly dailyLogService: DailyLogService,
        private readonly dataSource: DataSource,
    ) { }

    // ==================================================================
    // CRUD
    // ==================================================================

    async create(dto: CreateProgramDto): Promise<Program> {
        const { startDate, endDate } = this.validateDates(dto.startDate, dto.endDate);
        const totalWeeks = this.computeTotalWeeks(startDate, endDate);
        const isActive = dto.isActive ?? true;

        if (isActive) {
            // overlap → 400 antes de tocar nada; si no solapa, un solo activo a la vez
            await this.assertNoOverlap(startDate, endDate);
        }

        // Validar claves del catálogo antes de tocar nada
        const metricTypeByKey = await this.resolveTargetMetricTypes(dto.targets);

        const saved = await this.dataSource.transaction(async (manager) => {
            if (isActive) {
                await manager
                    .createQueryBuilder()
                    .update(Program)
                    .set({ isActive: false })
                    .where('isActive = :isActive', { isActive: true })
                    .execute();
            }
            const program = await manager.save(
                manager.create(Program, {
                    name: dto.name,
                    kind: dto.kind,
                    startDate,
                    endDate,
                    totalWeeks,
                    workoutsPerWeek: dto.workoutsPerWeek ?? 0,
                    isActive,
                }),
            );

            const targets = dto.targets.map((t) =>
                manager.create(ProgramMetricTarget, {
                    programId: program.id,
                    metricTypeId: metricTypeByKey.get(t.key)!.id,
                    target: t.target,
                    direction: t.direction,
                    weight: t.weight,
                    isOptional: t.isOptional ?? false,
                }),
            );
            await manager.save(targets);
            return program;
        });

        this.logger.log(`Program ${saved.id} created; syncing days…`);
        await this.syncProgramDaysForProgram(saved.id);
        await this.recalculateMeasurementsForProgram(saved.id);

        return this.findById(saved.id);
    }

    async findAll(): Promise<Program[]> {
        return this.programRepo.find({ order: { createdAt: 'DESC' } });
    }

    async findById(id: string): Promise<Program> {
        const program = await this.programRepo.findOne({ where: { id } });
        if (!program) {
            throw new NotFoundException('Program no encontrado');
        }
        return program;
    }

    async update(id: string, dto: UpdateProgramDto): Promise<Program> {
        const program = await this.programRepo.findOne({ where: { id } });
        if (!program) {
            throw new NotFoundException('Program no encontrado');
        }

        const newStart = dto.startDate ?? program.startDate;
        const newEnd = dto.endDate ?? program.endDate;
        this.validateDates(newStart, newEnd);

        const datesChanged = newStart !== program.startDate || newEnd !== program.endDate;
        const activating = dto.isActive === true && !program.isActive;

        // Solapamiento con otros programas activos (excluyéndose a sí mismo)
        if ((datesChanged || activating) && (dto.isActive ?? program.isActive)) {
            await this.assertNoOverlap(newStart, newEnd, id);
        }

        // Al activar: desactivar los demás activos (un solo activo a la vez).
        // El overlap check de arriba ya garantiza que no se desactiva nada si va a 400.
        if (activating) {
            await this.programRepo
                .createQueryBuilder()
                .update(Program)
                .set({ isActive: false })
                .where('isActive = :isActive', { isActive: true })
                .andWhere('id != :id', { id })
                .execute();
        }

        // Borrar los ProgramDay que ya no aplican por el cambio de rango
        if (datesChanged) {
            await this.programDayRepo
                .createQueryBuilder()
                .delete()
                .from(ProgramDay)
                .where('programId = :id', { id })
                .andWhere('(date < :start OR date > :end)', { start: newStart, end: newEnd })
                .execute();
        }

        // Campos simples (omitUndefined)
        if (dto.name !== undefined) program.name = dto.name;
        if (dto.kind !== undefined) program.kind = dto.kind;
        if (dto.workoutsPerWeek !== undefined) program.workoutsPerWeek = dto.workoutsPerWeek;
        if (dto.isActive !== undefined) program.isActive = dto.isActive;
        if (datesChanged) {
            program.startDate = newStart;
            program.endDate = newEnd;
            program.totalWeeks = this.computeTotalWeeks(newStart, newEnd);
        }
        await this.programRepo.save(program);

        // Targets (si vienen, replace-all)
        if (dto.targets !== undefined) {
            const metricTypeByKey = await this.resolveTargetMetricTypes(dto.targets);
            await this.dataSource.transaction(async (manager) => {
                await manager.delete(ProgramMetricTarget, { programId: id });
                const targets = dto.targets!.map((t) =>
                    manager.create(ProgramMetricTarget, {
                        programId: id,
                        metricTypeId: metricTypeByKey.get(t.key)!.id,
                        target: t.target,
                        direction: t.direction,
                        weight: t.weight,
                        isOptional: t.isOptional ?? false,
                    }),
                );
                await manager.save(targets);
            });
        }

        // Re-sincronizar days y measurements
        if (datesChanged || dto.targets !== undefined) {
            await this.syncProgramDaysForProgram(id);
            if (datesChanged) {
                await this.recalculateMeasurementsForProgram(id);
            }
        }

        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        const program = await this.findById(id);
        // CASCADE en ProgramDay y ProgramMeasurement borra los hijos;
        // lo hacemos explícito por paridad con el flujo anterior.
        await this.programDayRepo.delete({ programId: program.id });
        await this.measurementRepo.delete({ programId: program.id });
        await this.programRepo.remove(program);
        this.logger.log(`Program ${program.id} removed`);
    }

    // ==================================================================
    // Program activo
    // ==================================================================

    /**
     * Program activo (isActive=true y hoy dentro del rango).
     * Conserva la lógica de desactivar programas cuyo rango ya no incluye hoy.
     */
    async findActive(): Promise<Program | null> {
        this.logger.log('Finding active program');
        const today = this.getLocalDate();

        const result = await this.programRepo
            .createQueryBuilder('program')
            .leftJoinAndSelect('program.metricTargets', 'metricTargets')
            .leftJoinAndSelect('metricTargets.metricType', 'metricType')
            .where('program.isActive = :isActive', { isActive: true })
            .andWhere('program.startDate <= :today', { today })
            .andWhere('program.endDate >= :today', { today })
            .getOne();

        if (result) {
            return result;
        }

        // Desactivar programas fuera de rango
        await this.programRepo
            .createQueryBuilder()
            .update(Program)
            .set({ isActive: false })
            .where('isActive = :isActive', { isActive: true })
            .andWhere('(endDate < :today OR startDate > :today)', { today })
            .execute();

        return null;
    }

    private async findActiveProgramForDate(date: string): Promise<Program | null> {
        return this.programRepo
            .createQueryBuilder('program')
            .leftJoinAndSelect('program.metricTargets', 'metricTargets')
            .leftJoinAndSelect('metricTargets.metricType', 'metricType')
            .where('program.isActive = :isActive', { isActive: true })
            .andWhere('program.startDate <= :date', { date })
            .andWhere('program.endDate >= :date', { date })
            .getOne();
    }

    // ==================================================================
    // Sincronización de ProgramDay
    // ==================================================================

    /**
     * Sincroniza el ProgramDay de `date` con el estado actual.
     * - Si hay DailyLog: upsert del ProgramDay (compliance calculada).
     * - Si no hay DailyLog: borra el ProgramDay si existía.
     */
    async syncProgramDayForDate(date: string): Promise<void> {
        const program = await this.findActiveProgramForDate(date);
        if (!program) {
            this.logger.log(`No active program for date ${date}; nothing to sync`);
            return;
        }

        const dailyLog = await this.dailyLogService.findByDate(date);
        if (dailyLog) {
            const compliance = this.calculateDayCompliance(dailyLog, program);
            await this.upsertProgramDay(program.id, dailyLog.id, date, compliance);
            return;
        }

        const result = await this.programDayRepo.delete({ programId: program.id, date });
        if ((result.affected ?? 0) > 0) {
            this.logger.log(`ProgramDay removed for ${date} (no DailyLog)`);
        }
    }

    /**
     * Recorre todos los DailyLogs del rango del programa y sincroniza su ProgramDay.
     * Borra también los ProgramDay sin log o fuera de rango.
     */
    async syncProgramDaysForProgram(programId: string): Promise<void> {
        const program = await this.programRepo.findOne({
            where: { id: programId },
            relations: { metricTargets: { metricType: true } },
        });
        if (!program) {
            throw new NotFoundException('Program no encontrado');
        }

        const logs = await this.dailyLogService.findByDateRange(program.startDate, program.endDate);
        const logDates = new Set(logs.map((log) => log.date));

        for (const log of logs) {
            await this.syncProgramDayForDate(log.date);
        }

        // Borrar days huérfanos (sin DailyLog o fuera de rango)
        const existingDays = await this.programDayRepo.find({ where: { programId } });
        const orphans = existingDays.filter(
            (day) => day.date < program.startDate || day.date > program.endDate || !logDates.has(day.date),
        );
        if (orphans.length > 0) {
            await this.programDayRepo.delete(orphans.map((o) => o.id));
            this.logger.log(`Removed ${orphans.length} orphan ProgramDay(s) for program ${programId}`);
        }
    }

    /** Alias de compatibilidad para updateDayCompliance(programId, date). */
    async updateDayCompliance(programId: string, date: string): Promise<ProgramDay> {
        const program = await this.programRepo.findOne({
            where: { id: programId },
            relations: { metricTargets: { metricType: true } },
        });
        if (!program) {
            throw new NotFoundException('Program no encontrado');
        }

        const dailyLog = await this.dailyLogService.findByDate(date);
        if (!dailyLog) {
            throw new NotFoundException(`No hay datos para la fecha ${date}`);
        }

        const compliance = this.calculateDayCompliance(dailyLog, program);
        return this.upsertProgramDay(programId, dailyLog.id, date, compliance);
    }

    /** Borra los ProgramDay de `date` en todos los programas que la contengan. */
    async removeProgramDayByDate(date: string): Promise<void> {
        const programs = await this.programRepo.find({
            where: [{ startDate: LessThanOrEqual(date), endDate: MoreThanOrEqual(date) }],
        });
        if (programs.length === 0) return;

        const ids = programs.map((p) => p.id);
        const result = await this.programDayRepo
            .createQueryBuilder()
            .delete()
            .from(ProgramDay)
            .where('date = :date', { date })
            .andWhere('programId IN (:...ids)', { ids })
            .execute();
        this.logger.log(`Removed ${result.affected ?? 0} ProgramDay(s) for ${date}`);
    }

    private async upsertProgramDay(
        programId: string,
        dailyLogId: string,
        date: string,
        compliance: Omit<ProgramDay, 'id' | 'program' | 'programId' | 'dailyLog' | 'dailyLogId'>,
    ): Promise<ProgramDay> {
        const existing = await this.programDayRepo.findOne({ where: { programId, date } });
        if (existing) {
            Object.assign(existing, compliance, { dailyLogId });
            return this.programDayRepo.save(existing);
        }
        return this.programDayRepo.save(
            this.programDayRepo.create({ ...compliance, programId, date, dailyLogId }),
        );
    }

    /**
     * Compliance genérico de un día: iterar sobre los targets del programa.
     * Prohibido comparar campos hardcodeados.
     */
    private calculateDayCompliance(
        dailyLog: DailyLog,
        program: Program,
    ): Omit<ProgramDay, 'id' | 'program' | 'programId' | 'dailyLog' | 'dailyLogId'> {
        const values: Record<string, number> = {};
        for (const metric of dailyLog.metrics ?? []) {
            if (metric.metricType?.key && metric.value !== null && metric.value !== undefined) {
                values[metric.metricType.key] = Number(metric.value);
            }
        }
        Object.assign(values, this.dailyLogService.computeDerivedMetrics(dailyLog));

        let score = 0;
        let allRequiredMet = true;
        const metricResults: Record<string, boolean> = {};

        for (const target of program.metricTargets ?? []) {
            const key = target.metricType?.key;
            if (!key) continue;

            const value = values[key] ?? 0;
            let met = false;
            switch (target.direction) {
                case TargetDirection.AT_LEAST:
                    met = value >= target.target;
                    break;
                case TargetDirection.AT_MOST:
                    met = value <= target.target;
                    break;
                case TargetDirection.EXACT:
                    met = value === target.target;
                    break;
            }

            metricResults[key] = met;
            // Un target opcional suma a la nota solo si se cumple; en ningún
            // caso cuenta para allMet (que exige las requeridas).
            if (met) score += target.weight * 100;
            if (!met && !target.isOptional) allRequiredMet = false;
        }

        return {
            date: dailyLog.date,
            weekNumber: this.calculateWeekNumber(dailyLog.date, program.startDate),
            dailyScore: Math.round(score),
            allMet: allRequiredMet,
            metricResults,
        };
    }

    private calculateWeekNumber(date: string, startDate: string): number {
        const d = new Date(date);
        const start = new Date(startDate);
        const diffDays = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 7) + 1;
    }

    // ==================================================================
    // ProgramMeasurement (first/last por body metric type y programa)
    // ==================================================================

    /**
     * Recalcula las filas first/last de program_measurements para el programa.
     * Para cada body metric type presente en los WeightLogs del rango:
     * - first = el WeightLog con fecha mínima (upsert kind='first').
     * - last  = el WeightLog con fecha máxima (upsert kind='last').
     * Si mínimo y máximo son el mismo log, se escriben las dos filas con los
     * mismos value/date/weightLogId. Si ya no hay logs de esa métrica en el
     * rango, se borran sus filas first/last.
     */
    async recalculateMeasurementsForProgram(programId: string): Promise<void> {
        const program = await this.programRepo.findOne({ where: { id: programId } });
        if (!program) {
            throw new NotFoundException('Program no encontrado');
        }

        const rows = await this.weightLogMetricRepo
            .createQueryBuilder('wlm')
            .innerJoin('wlm.weightLog', 'wl')
            .select('wlm."bodyMetricTypeId"', 'bodyMetricTypeId')
            .addSelect('wlm.value', 'value')
            .addSelect('wlm."weightLogId"', 'weightLogId')
            .addSelect('wl.date', 'date')
            .where('wl.date BETWEEN :start AND :end', { start: program.startDate, end: program.endDate })
            .getRawMany<{ bodyMetricTypeId: string; value: number; weightLogId: string; date: string }>();

        const rowsByType = new Map<string, Array<{ bodyMetricTypeId: string; value: number; weightLogId: string; date: string }>>();
        for (const row of rows) {
            const key = row.bodyMetricTypeId;
            if (!rowsByType.has(key)) rowsByType.set(key, []);
            rowsByType.get(key)!.push(row);
        }

        // Borrar filas first/last de métricas sin logs en el rango
        const metricTypeIds = [...rowsByType.keys()];
        const existing = await this.measurementRepo.find({ where: { programId } });
        const stale = existing.filter((m) => !metricTypeIds.includes(m.bodyMetricTypeId));
        if (stale.length > 0) {
            await this.measurementRepo.delete(stale.map((m) => m.id));
            this.logger.log(`Removed ${stale.length} stale ProgramMeasurement(s) for program ${programId}`);
        }

        for (const [bodyMetricTypeId, typeRows] of rowsByType) {
            const withDates = [...typeRows].sort(
                (a, b) => a.date.localeCompare(b.date) || a.weightLogId.localeCompare(b.weightLogId),
            );
            const first = withDates[0];
            const last = withDates[withDates.length - 1];

            for (const [kind, row] of [
                [ProgramMeasurementKind.FIRST, first],
                [ProgramMeasurementKind.LAST, last],
            ] as const) {
                const existing = await this.measurementRepo.findOne({
                    where: { programId, bodyMetricTypeId, kind },
                });
                if (existing) {
                    existing.value = row.value;
                    existing.date = row.date;
                    existing.weightLogId = row.weightLogId;
                    await this.measurementRepo.save(existing);
                } else {
                    await this.measurementRepo.save(
                        this.measurementRepo.create({
                            programId,
                            bodyMetricTypeId,
                            weightLogId: row.weightLogId,
                            kind,
                            value: row.value,
                            date: row.date,
                        }),
                    );
                }
            }
        }
    }

    // ==================================================================
    // Dashboard
    // ==================================================================

    /**
     * Dashboard del programa.
     * measurements se lee de ProgramMeasurement (NO se iteran WeightLogs).
     * streaks se calcula sobre los ProgramDay existentes.
     */
    async getDashboard(programId: string): Promise<any> {
        const program = await this.programRepo.findOne({
            where: { id: programId },
            relations: { metricTargets: { metricType: true } },
        });
        if (!program) {
            throw new NotFoundException('Program no encontrado');
        }

        const days = await this.programDayRepo.find({
            where: { programId },
            order: { date: 'ASC' },
        });

        const dailyLogs = await this.dailyLogService.findByDateRange(program.startDate, program.endDate);

        // Mapa fecha -> values por métrica (para weeklyAverages / carryover)
        const valuesByDate = new Map<string, Record<string, number>>();
        for (const log of dailyLogs) {
            const values: Record<string, number> = {};
            for (const metric of log.metrics ?? []) {
                if (metric.metricType?.key && metric.value !== null && metric.value !== undefined) {
                    values[metric.metricType.key] = Number(metric.value);
                }
            }
            Object.assign(values, this.dailyLogService.computeDerivedMetrics(log));
            valuesByDate.set(log.date, values);
        }
        const daysWithValues = days.map((day) => ({
            weekNumber: day.weekNumber,
            date: day.date,
            values: valuesByDate.get(day.date) ?? {},
        }));

        const sortedTargets = [...(program.metricTargets ?? [])].sort(
            (a, b) => b.weight - a.weight || a.metricType.key.localeCompare(b.metricType.key),
        );
        const targetKeys = sortedTargets.map((t) => t.metricType.key);

        // Targets (semilla del front)
        const targets = sortedTargets.map((t) => ({
            key: t.metricType.key,
            label: t.metricType.label,
            target: t.target,
            direction: t.direction,
            weight: t.weight,
            isOptional: t.isOptional,
        }));

        // currentWeek acotada a [1, totalWeeks]
        const today = new Date();
        const start = new Date(program.startDate);
        const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.max(1, Math.min(Math.floor(diffDays / 7) + 1, program.totalWeeks));

        // measurements desde ProgramMeasurement (sin tocar WeightLogs)
        const measurementRows = await this.measurementRepo.find({
            where: { programId },
            relations: { bodyMetricType: true },
        });
        const measurements: Record<string, {
            first: { value: number; date: string } | null;
            last: { value: number; date: string } | null;
            difference: number | null;
        }> = {};
        for (const row of measurementRows) {
            const key = row.bodyMetricType?.key;
            if (!key) continue;
            measurements[key] ??= { first: null, last: null, difference: null };
            const point = { value: row.value, date: row.date };
            if (row.kind === ProgramMeasurementKind.FIRST) measurements[key].first = point;
            if (row.kind === ProgramMeasurementKind.LAST) measurements[key].last = point;
        }
        for (const key of Object.keys(measurements)) {
            const m = measurements[key];
            m.difference = m.first && m.last ? Number((m.last.value - m.first.value).toFixed(2)) : null;
        }

        // summary
        const totalDays = days.length;
        const daysWithAllMet = days.filter((d) => d.allMet).length;
        const compliancePercentage = totalDays > 0 ? (daysWithAllMet / totalDays) * 100 : 0;
        const averageScore = totalDays > 0
            ? Math.round(days.reduce((sum, d) => sum + d.dailyScore, 0) / totalDays)
            : 0;

        // caloriesCarryover solo si el programa tiene target de calorías
        const caloriesTarget = sortedTargets.find((t) => t.metricType.key === 'calories')?.target;
        const caloriesCarryover = caloriesTarget !== undefined
            ? this.calculateWeeklyCarryover(daysWithValues, caloriesTarget, new Date(), program.startDate)
            : undefined;

        const streaks = await this.getStreaks(programId);

        return {
            program: {
                id: program.id,
                name: program.name,
                kind: program.kind,
                startDate: program.startDate,
                endDate: program.endDate,
                totalWeeks: program.totalWeeks,
                currentWeek,
            },
            targets,
            summary: {
                totalDays,
                daysWithAllMet,
                compliancePercentage,
                averageScore,
            },
            days: days.map((day) => ({
                date: day.date,
                weekNumber: day.weekNumber,
                dailyScore: day.dailyScore,
                allMet: day.allMet,
                metricResults: day.metricResults,
            })),
            measurements,
            weeklySummary: this.calculateWeeklySummary(days, program.totalWeeks, targetKeys),
            weeklyAverages: this.calculateWeeklyAverages(daysWithValues, program.totalWeeks, targetKeys),
            trends: this.calculateTrends(days, program.totalWeeks, targetKeys),
            streaks,
            caloriesCarryover,
        };
    }

    private calculateWeeklySummary(days: ProgramDay[], totalWeeks: number, targetKeys: string[]): WeeklySummary[] {
        const weeklySummary: WeeklySummary[] = [];

        for (let week = 1; week <= totalWeeks; week++) {
            const weekDays = days.filter((d) => d.weekNumber === week);
            if (weekDays.length === 0) continue;

            const daysWithAllMet = weekDays.filter((d) => d.allMet).length;
            const targetCompliance: Record<string, number> = {};
            for (const key of targetKeys) {
                targetCompliance[key] = this.calculateAttributeCompliance(weekDays, key);
            }

            weeklySummary.push({
                weekNumber: week,
                startDate: weekDays[0].date,
                endDate: weekDays[weekDays.length - 1].date,
                daysCount: weekDays.length,
                daysWithAllMet,
                compliancePercentage: (daysWithAllMet / weekDays.length) * 100,
                targetCompliance,
            });
        }

        return weeklySummary;
    }

    private calculateWeeklyAverages(
        daysWithValues: Array<{ weekNumber: number; values: Record<string, number> }>,
        totalWeeks: number,
        targetKeys: string[],
    ): Array<{ weekNumber: number; averages: Record<string, number>; daysWithData: number }> {
        const weeklyAverages: Array<{ weekNumber: number; averages: Record<string, number>; daysWithData: number }> = [];

        for (let week = 1; week <= totalWeeks; week++) {
            const weekDays = daysWithValues.filter((d) => d.weekNumber === week);
            if (weekDays.length === 0) {
                weeklyAverages.push({
                    weekNumber: week,
                    averages: Object.fromEntries(targetKeys.map((key) => [key, 0])),
                    daysWithData: 0,
                });
                continue;
            }

            const averages: Record<string, number> = {};
            for (const key of targetKeys) {
                const total = weekDays.reduce((sum, day) => sum + (day.values[key] ?? 0), 0);
                averages[key] = Number((total / weekDays.length).toFixed(1));
            }

            weeklyAverages.push({
                weekNumber: week,
                averages,
                daysWithData: weekDays.length,
            });
        }

        return weeklyAverages;
    }

    private calculateAttributeCompliance(days: ProgramDay[], metricKey: string): number {
        if (days.length === 0) return 0;
        const metCount = days.filter((d) => d.metricResults?.[metricKey] === true).length;
        return (metCount / days.length) * 100;
    }

    private calculateTrends(days: ProgramDay[], totalWeeks: number, targetKeys: string[]): TrendsData {
        const trends: TrendsData = {};

        for (const key of targetKeys) {
            const weeks: WeeklyTrend[] = [];
            let overallSum = 0;
            let overallCount = 0;

            for (let week = 1; week <= totalWeeks; week++) {
                const weekDays = days.filter((d) => d.weekNumber === week);
                const compliance = this.calculateAttributeCompliance(weekDays, key);

                weeks.push({ weekNumber: week, compliancePercentage: compliance });

                if (weekDays.length > 0) {
                    overallSum += compliance;
                    overallCount++;
                }
            }

            trends[key] = {
                attribute: key,
                weeks,
                overallCompliance: overallCount > 0 ? overallSum / overallCount : 0,
            };
        }

        return trends;
    }

    private calculateWeeklyCarryover(
        daysWithValues: Array<{ date: string; values: Record<string, number> }>,
        targetCalories: number,
        currentDate: Date,
        programStartDate: string,
    ) {
        const localDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const weekStart = this.getWeekStartFromProgram(localDate, programStartDate);
        const weekDays = daysWithValues.filter((d) => d.date >= weekStart);

        if (weekDays.length === 0) {
            return { runningBalance: 0, adjustedBudget: targetCalories, daysRemaining: 7, averagePerDay: targetCalories };
        }

        const totalConsumed = weekDays.reduce((sum, d) => sum + (d.values['calories'] ?? 0), 0);
        const targetForElapsed = weekDays.length * targetCalories;
        const runningBalance = targetForElapsed - totalConsumed;

        const daysRemaining = 7 - weekDays.length;
        const adjustedBudget = targetCalories + runningBalance;

        return {
            runningBalance,
            adjustedBudget: Math.round(adjustedBudget),
            daysRemaining,
            averagePerDay: daysRemaining > 0 ? Math.round(adjustedBudget / daysRemaining) : 0,
        };
    }

    private getWeekStartFromProgram(date: Date, programStartDate: string): string {
        const dateStr = this.getLocalDate(date);
        const d = new Date(dateStr + 'T12:00:00');
        const start = new Date(programStartDate + 'T12:00:00');

        const diffDays = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const daysIntoWeek = diffDays % 7;
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() + (diffDays - daysIntoWeek));

        return this.getLocalDate(weekStart);
    }

    // ==================================================================
    // Streaks
    // ==================================================================

    async getStreaks(programId: string): Promise<{ currentStreak: number; bestStreak: number; lastFailedDate: string | null }> {
        const days = await this.programDayRepo.find({
            where: { programId },
            order: { date: 'DESC' },
        });

        if (days.length === 0) {
            return { currentStreak: 0, bestStreak: 0, lastFailedDate: null };
        }

        const threshold = 90;
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        let lastFailedDate: string | null = null;

        // Racha actual (desde el más reciente, días consecutivos)
        for (let i = 0; i < days.length; i++) {
            if (days[i].dailyScore >= threshold) {
                if (i === 0) {
                    currentStreak = 1;
                } else {
                    const prevDate = new Date(days[i - 1].date);
                    const currDate = new Date(days[i].date);
                    const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            } else {
                lastFailedDate = days[i].date;
                break;
            }
        }

        // Mejor racha (histórica)
        for (const day of days) {
            if (day.dailyScore >= threshold) {
                tempStreak++;
                bestStreak = Math.max(bestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        return { currentStreak, bestStreak, lastFailedDate };
    }

    // ==================================================================
    // Helpers
    // ==================================================================

    private validateDates(startDate: string, endDate: string): { startDate: string; endDate: string } {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime())) {
            throw new BadRequestException('La fecha de inicio no es válida');
        }
        if (isNaN(end.getTime())) {
            throw new BadRequestException('La fecha de fin no es válida');
        }
        if (start >= end) {
            throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
        }
        return { startDate, endDate };
    }

    private computeTotalWeeks(startDate: string, endDate: string): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    }

    private async assertNoOverlap(startDate: string, endDate: string, excludeProgramId?: string): Promise<void> {
        const qb = this.programRepo
            .createQueryBuilder('program')
            .where('program.isActive = :isActive', { isActive: true })
            .andWhere('program.startDate <= :end', { end: endDate })
            .andWhere('program.endDate >= :start', { start: startDate });

        if (excludeProgramId) {
            qb.andWhere('program.id != :excludeId', { excludeId: excludeProgramId });
        }

        const overlapping = await qb.getMany();
        if (overlapping.length > 0) {
            const p = overlapping[0];
            throw new BadRequestException(
                `El programa se solapa con "${p.name}" (${p.startDate} → ${p.endDate})`,
            );
        }
    }

    private async resolveTargetMetricTypes(
        targets: ProgramMetricTargetDto[],
    ): Promise<Map<string, MetricType>> {
        const keys = targets.map((t) => t.key);
        const uniqueKeys = [...new Set(keys)];
        if (uniqueKeys.length !== keys.length) {
            const duplicated = keys.filter((k, i) => keys.indexOf(k) !== i);
            throw new BadRequestException(`Targets duplicados: ${[...new Set(duplicated)].join(', ')}`);
        }

        const found = await this.metricTypeRepo.findBy(keys.map((key) => ({ key })));
        const byKey = new Map(found.map((m) => [m.key, m]));
        const missing = uniqueKeys.filter((key) => !byKey.has(key));
        if (missing.length > 0) {
            throw new BadRequestException(`Métricas desconocidas en targets: ${missing.join(', ')}`);
        }
        return byKey;
    }

    private getLocalDate(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
