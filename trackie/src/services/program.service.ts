import { Injectable, Logger, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Program } from '../entities/program.entity';
import { ProgramDay } from '../entities/program-day.entity';
import { DailyLog } from '../entities/dailylog.entity';
import { DailyLogService } from './dailylog.service';
import { TargetDirection } from '../enums/target-direction.enum';

/**
 * FASE 2 — subconjunto mínimo de ProgramService.
 * Solo los métodos que DailyLogService necesita (sync de ProgramDay).
 * El resto del servicio (create, update, dashboard, streaks, carryovers,
 * measurements, getStreaks…) se implementa en la Fase 3.
 */
@Injectable()
export class ProgramService {
    private readonly logger = new Logger(ProgramService.name);

    constructor(
        @InjectRepository(Program)
        private readonly programRepo: Repository<Program>,
        @InjectRepository(ProgramDay)
        private readonly programDayRepo: Repository<ProgramDay>,
        @Inject(forwardRef(() => DailyLogService))
        private readonly dailyLogService: DailyLogService,
    ) { }

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
            const existing = await this.programDayRepo.findOne({
                where: { programId: program.id, date },
            });
            if (existing) {
                Object.assign(existing, compliance);
                await this.programDayRepo.save(existing);
            } else {
                await this.programDayRepo.save(
                    this.programDayRepo.create({ ...compliance, programId: program.id, date, dailyLogId: dailyLog.id }),
                );
            }
            this.logger.log(`ProgramDay synced for ${date} (program ${program.id})`);
            return;
        }

        const result = await this.programDayRepo.delete({ programId: program.id, date });
        if ((result.affected ?? 0) > 0) {
            this.logger.log(`ProgramDay removed for ${date} (no DailyLog)`);
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
        const existing = await this.programDayRepo.findOne({ where: { programId, date } });
        if (existing) {
            Object.assign(existing, compliance);
            return this.programDayRepo.save(existing);
        }
        return this.programDayRepo.save(
            this.programDayRepo.create({ ...compliance, programId, date, dailyLogId: dailyLog.id }),
        );
    }

    /** Borra los ProgramDay de `date` en todos los programas que la contengan. */
    async removeProgramDayByDate(date: string): Promise<void> {
        const programs = await this.programRepo.find({
            where: [
                { startDate: LessThanOrEqual(date), endDate: MoreThanOrEqual(date) },
            ],
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

    /**
     * Compliance genérico de un día: iterar sobre los targets del programa.
     * Prohibido comparar campos hardcodeados.
     */
    private calculateDayCompliance(
        dailyLog: DailyLog,
        program: Program,
    ): Omit<ProgramDay, 'id' | 'program' | 'programId' | 'dailyLog' | 'dailyLogId'> {
        // valuesByKey desde dailyLog.metrics + métricas derivadas
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

    private getLocalDate(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
