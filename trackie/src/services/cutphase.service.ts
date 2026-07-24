import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CutPhase } from '../entities/cutphase.entity';
import { CutPhaseDay } from '../entities/cutphaseday.entity';
import { DailyLogService } from './dailylog.service';
import { WeightLogService } from './weightlog.service';
import { CreateCutPhaseDto, UpdateCutPhaseDto } from '../enums/cutday.dto';
import { DailyLog } from '../entities/dailylog.entity';
import { WorkoutType } from '../enums/workouttype.enum';
import { WeeklySummary } from '../interfaces/weekly-summary.interface';
import { TrendsData, WeeklyTrend } from '../interfaces/weekly-trend.interface';

@Injectable()
export class CutPhaseService {
    private readonly logger = new Logger(CutPhaseService.name);

    constructor(
        @InjectRepository(CutPhase)
        private readonly cutPhaseRepo: Repository<CutPhase>,
        @InjectRepository(CutPhaseDay)
        private readonly cutPhaseDayRepo: Repository<CutPhaseDay>,
        private readonly dailyLogService: DailyLogService,
        private readonly weightLogService: WeightLogService,
    ) { }

    // Crear un nuevo Cut Phase
    async create(dto: CreateCutPhaseDto): Promise<CutPhase> {
        if (new Date(dto.startDate) >= new Date(dto.endDate)) {
            throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
        }

        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const totalWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

        await this.cutPhaseRepo.update({ isActive: true }, { isActive: false });

        const cutPhase = this.cutPhaseRepo.create({
            ...dto,
            totalWeeks,
            isActive: true,
        });

        const savedCutPhase = await this.cutPhaseRepo.save(cutPhase);

        await this.generateCutPhaseDays(savedCutPhase);

        await this.syncAllDays(savedCutPhase.id);

        this.logger.log(`Cut phase creado con ID: ${savedCutPhase.id}`);
        return savedCutPhase;
    }

    // Generar los días del cut phase
    private async generateCutPhaseDays(cutPhase: CutPhase): Promise<void> {
        const startDate = new Date(cutPhase.startDate);
        const endDate = new Date(cutPhase.endDate);
        const days: CutPhaseDay[] = [];

        let currentDate = new Date(startDate);
        let dayCount = 0;

        while (currentDate <= endDate) {
            const dateStr = this.getLocalDate(currentDate);
            const weekNumber = Math.floor(dayCount / 7) + 1;

            const day = this.cutPhaseDayRepo.create({
                date: dateStr,
                weekNumber,
                cutPhaseId: cutPhase.id,
            });

            days.push(day);

            currentDate.setDate(currentDate.getDate() + 1);
            dayCount++;
        }

        await this.cutPhaseDayRepo.save(days);
        this.logger.log(`Generados ${days.length} días para el cut phase ${cutPhase.id}`);
    }

    // Calcular el cumplimiento de un día
    private calculateDayCompliance(dailyLog: DailyLog, cutPhase: CutPhase): Omit<CutPhaseDay, 'id' | 'cutPhase' | 'cutPhaseId'> {
        const caloriesMet = dailyLog.calories <= cutPhase.targetCalories;
        const proteinMet = dailyLog.proteinGrams >= cutPhase.targetProtein;
        const stepsMet = dailyLog.steps >= cutPhase.targetSteps;
        const waterMet = dailyLog.waterLiters >= cutPhase.targetWater;
        const workoutMet = dailyLog.workout !== WorkoutType.NONE && dailyLog.workout !== undefined && dailyLog.workout !== null;

        // Calcular score con pesos
        const weights = {
            calories: 0.30,
            protein: 0.30,
            steps: 0.15,
            workout: 0.15,
            water: 0.10,
        };

        let score = 0;
        if (caloriesMet) score += weights.calories * 100;
        if (proteinMet) score += weights.protein * 100;
        if (stepsMet) score += weights.steps * 100;
        if (workoutMet) score += weights.workout * 100;
        if (waterMet) score += weights.water * 100;

        return {
            date: dailyLog.date,
            weekNumber: this.calculateWeekNumber(dailyLog.date, cutPhase.startDate),
            caloriesMet,
            proteinMet,
            stepsMet,
            waterMet,
            workoutMet,
            dailyScore: Math.round(score),
            allMet: caloriesMet && proteinMet && stepsMet && waterMet && workoutMet,
        };
    }

    // Calcular número de semana
    private calculateWeekNumber(date: string, startDate: string): number {
        const d = new Date(date);
        const start = new Date(startDate);
        const diffDays = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 7) + 1;
    }

    // Sincronizar todos los días del cut phase
    async syncAllDays(cutPhaseId: string): Promise<void> {
        const cutPhase = await this.cutPhaseRepo.findOne({
            where: { id: cutPhaseId }
        });

        if (!cutPhase) {
            throw new NotFoundException('Cut phase no encontrado');
        }

        const dailyLogs = await this.dailyLogService.findByDateRange(
            cutPhase.startDate,
            cutPhase.endDate
        );

        await this.cutPhaseDayRepo.delete({ cutPhaseId });

        const days = dailyLogs.map(log => {
            const compliance = this.calculateDayCompliance(log, cutPhase);
            return this.cutPhaseDayRepo.create({
                ...compliance,
                cutPhaseId,
            });
        });

        if (days.length > 0) {
            await this.cutPhaseDayRepo.save(days);
            this.logger.log(`Sincronizados ${days.length} días para cut phase ${cutPhaseId}`);
        }
    }

    // Actualizar un día específico
    async updateDayCompliance(cutPhaseId: string, date: string): Promise<CutPhaseDay> {
        const cutPhase = await this.cutPhaseRepo.findOne({
            where: { id: cutPhaseId }
        });

        if (!cutPhase) {
            throw new NotFoundException('Cut phase no encontrado');
        }

        const dailyLog = await this.dailyLogService.findByDate(date);
        if (!dailyLog) {
            throw new NotFoundException(`No hay datos para la fecha ${date}`);
        }

        let cutPhaseDay = await this.cutPhaseDayRepo.findOne({
            where: { cutPhaseId, date }
        });

        const compliance = this.calculateDayCompliance(dailyLog, cutPhase);

        if (cutPhaseDay) {
            Object.assign(cutPhaseDay, compliance);
        } else {
            cutPhaseDay = this.cutPhaseDayRepo.create({
                ...compliance,
                cutPhaseId,
            });
        }

        return this.cutPhaseDayRepo.save(cutPhaseDay);
    }

    async getDashboard(cutPhaseId: string): Promise<any> {
        const cutPhase = await this.cutPhaseRepo.findOne({
            where: { id: cutPhaseId }
        });

        if (!cutPhase) {
            throw new NotFoundException('Cut phase no encontrado');
        }

        // Obtener días del cut phase
        const cutPhaseDays = await this.cutPhaseDayRepo.find({
            where: { cutPhaseId },
            order: { date: 'ASC' }
        });

        // Obtener DailyLogs para mostrar valores reales
        const dailyLogs = await this.dailyLogService.findByDateRange(
            cutPhase.startDate,
            cutPhase.endDate
        );

        const dailyLogsMap = new Map<string, DailyLog>();
        dailyLogs.forEach(log => {
            dailyLogsMap.set(log.date, log);
        });

        // Combinar datos
        const daysWithData = cutPhaseDays.map(day => {
            const dailyLog = dailyLogsMap.get(day.date);
            return {
                ...day,
                calories: dailyLog?.calories || 0,
                protein: dailyLog?.proteinGrams || 0,
                steps: dailyLog?.steps || 0,
                water: dailyLog?.waterLiters || 0,
                workout: dailyLog?.workout || WorkoutType.NONE,
            };
        });

        const allWeightLogs = await this.weightLogService.findByDateRange(
            cutPhase.startDate,
            cutPhase.endDate
        );

        const sortedWeightLogs = allWeightLogs.sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        const initialMeasurement = sortedWeightLogs.length > 0 ? sortedWeightLogs[0] : null;

        const currentMeasurement = sortedWeightLogs.length > 0
            ? sortedWeightLogs[sortedWeightLogs.length - 1]
            : null;

        // Calcular estadísticas
        const totalDays = daysWithData.length;
        const daysWithAllMet = daysWithData.filter(d => d.allMet);
        const totalScore = daysWithData.reduce((sum, d) => sum + d.dailyScore, 0);
        const avgScore = totalDays > 0 ? totalScore / totalDays : 0;

        // Calcular semana actual
        const today = new Date();
        const startDate = new Date(cutPhase.startDate);
        const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, cutPhase.totalWeeks);

        return {
            cutPhaseId: cutPhase.id,
            startDate: cutPhase.startDate,
            endDate: cutPhase.endDate,
            totalWeeks: cutPhase.totalWeeks,
            currentWeek: Math.max(1, Math.min(currentWeek, cutPhase.totalWeeks)),

            targets: {
                calories: cutPhase.targetCalories,
                protein: cutPhase.targetProtein,
                steps: cutPhase.targetSteps,
                water: cutPhase.targetWater,
                workoutsPerWeek: cutPhase.workoutsPerWeek,
            },

            summary: {
                totalDays,
                daysWithAllMet: daysWithAllMet.length,
                compliancePercentage: totalDays > 0
                    ? (daysWithAllMet.length / totalDays) * 100
                    : 0,
                averageScore: Math.round(avgScore),
            },

            measurements: {
                weight: {
                    initial: initialMeasurement?.weight || null,
                    current: currentMeasurement?.weight || null,
                    difference: initialMeasurement && currentMeasurement
                        ? currentMeasurement.weight - initialMeasurement.weight
                        : null
                },
                bodyfat: {
                    initial: initialMeasurement?.bodyfat || null,
                    current: currentMeasurement?.bodyfat || null,
                    difference: initialMeasurement && currentMeasurement && initialMeasurement.bodyfat && currentMeasurement.bodyfat
                        ? currentMeasurement.bodyfat - initialMeasurement.bodyfat
                        : null
                },
                waist: {
                    initial: initialMeasurement?.waist || null,
                    current: currentMeasurement?.waist || null,
                    difference: initialMeasurement && currentMeasurement && initialMeasurement.waist && currentMeasurement.waist
                        ? currentMeasurement.waist - initialMeasurement.waist
                        : null
                },
                hips: {
                    initial: initialMeasurement?.hips || null,
                    current: currentMeasurement?.hips || null,
                    difference: initialMeasurement && currentMeasurement && initialMeasurement.hips && currentMeasurement.hips
                        ? currentMeasurement.hips - initialMeasurement.hips
                        : null
                },
            },

            // Calendario
            days: daysWithData,

            // Resumen semanal (opcional, se puede calcular)
            weeklySummary: this.calculateWeeklySummary(daysWithData, cutPhase.totalWeeks),

            // Tendencias (opcional)
            trends: this.calculateTrends(daysWithData),
        };
    }

    private calculateWeeklySummary(days: any[], totalWeeks: number): WeeklySummary[] {
        const weeklySummary: WeeklySummary[] = [];

        for (let week = 1; week <= totalWeeks; week++) {
            const weekDays = days.filter(d => d.weekNumber === week);

            if (weekDays.length === 0) continue;

            const daysWithData = weekDays.filter(d => d.dailyScore > 0);
            const daysWithAllMet = weekDays.filter(d => d.allMet);

            weeklySummary.push({
                weekNumber: week,
                startDate: weekDays[0].date,
                endDate: weekDays[weekDays.length - 1].date,
                daysCount: weekDays.length,
                daysWithAllMet: daysWithAllMet.length,
                compliancePercentage: daysWithData.length > 0
                    ? (daysWithAllMet.length / daysWithData.length) * 100
                    : 0,
                caloriesCompliance: this.calculateAttributeCompliance(weekDays, 'caloriesMet'),
                proteinCompliance: this.calculateAttributeCompliance(weekDays, 'proteinMet'),
                stepsCompliance: this.calculateAttributeCompliance(weekDays, 'stepsMet'),
                waterCompliance: this.calculateAttributeCompliance(weekDays, 'waterMet'),
                workoutCompliance: this.calculateAttributeCompliance(weekDays, 'workoutMet'),
            });
        }

        return weeklySummary;
    }

    private calculateAttributeCompliance(days: any[], attribute: string): number {
        const relevantDays = days.filter(d => d.dailyScore > 0);
        if (relevantDays.length === 0) return 0;

        const metCount = relevantDays.filter(d => d[attribute] === true).length;
        return (metCount / relevantDays.length) * 100;
    }

    // Calcular tendencias
    private calculateTrends(days: any[]): TrendsData {
        const totalWeeks = Math.max(...days.map(d => d.weekNumber));
        const attributes = ['caloriesMet', 'proteinMet', 'stepsMet', 'waterMet', 'workoutMet'];
        const attributeNames = ['calories', 'protein', 'steps', 'water', 'workout'];

        const trends: TrendsData = {};

        attributes.forEach((attr, index) => {
            const weeks: WeeklyTrend[] = [];
            let overallSum = 0;
            let overallCount = 0;

            for (let week = 1; week <= totalWeeks; week++) {
                const weekDays = days.filter(d => d.weekNumber === week);
                const compliance = this.calculateAttributeCompliance(weekDays, attr);

                weeks.push({
                    weekNumber: week,
                    compliancePercentage: compliance,
                });

                if (weekDays.filter(d => d.dailyScore > 0).length > 0) {
                    overallSum += compliance;
                    overallCount++;
                }
            }

            trends[attributeNames[index]] = {
                attribute: attributeNames[index],
                weeks,
                overallCompliance: overallCount > 0 ? overallSum / overallCount : 0,
            };
        });

        return trends;
    }


    // Métodos CRUD básicos
    async findAll(): Promise<CutPhase[]> {
        return this.cutPhaseRepo.find({
            order: { createdAt: 'DESC' }
        });
    }

    async findActive(): Promise<CutPhase | null> {
        return this.cutPhaseRepo.findOne({
            where: { isActive: true }
        });
    }

    async findById(id: string): Promise<CutPhase> {
        const cutPhase = await this.cutPhaseRepo.findOne({
            where: { id }
        });

        if (!cutPhase) {
            throw new NotFoundException('Cut phase no encontrado');
        }

        return cutPhase;
    }

    async update(id: string, dto: UpdateCutPhaseDto): Promise<CutPhase> {
        const cutPhase = await this.findById(id);

        if (dto.startDate && dto.endDate) {
            if (new Date(dto.startDate) >= new Date(dto.endDate)) {
                throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
            }

            const start = new Date(dto.startDate);
            const end = new Date(dto.endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            dto['totalWeeks'] = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        }

        Object.assign(cutPhase, dto);
        const updated = await this.cutPhaseRepo.save(cutPhase);

        // Regenerar días si cambiaron las fechas
        if (dto.startDate || dto.endDate) {
            await this.cutPhaseDayRepo.delete({ cutPhaseId: id });
            await this.generateCutPhaseDays(updated);
            await this.syncAllDays(id);
        }

        return updated;
    }

    async remove(id: string): Promise<void> {
        const cutPhase = await this.findById(id);
        await this.cutPhaseDayRepo.delete({ cutPhaseId: id });
        await this.cutPhaseRepo.remove(cutPhase);
    }

    // Función auxiliar
    private getLocalDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}