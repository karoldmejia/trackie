import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
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
        @Inject(forwardRef(() => DailyLogService))
        private readonly dailyLogService: DailyLogService,
        private readonly weightLogService: WeightLogService,
    ) { }

    async create(dto: CreateCutPhaseDto): Promise<CutPhase> {
        this.logger.log('Received create request with DTO:');
        this.logger.log(JSON.stringify(dto, null, 2));

        const requiredFields = ['startDate', 'endDate', 'targetCalories', 'targetProtein', 'targetSteps', 'targetWater', 'workoutsPerWeek'];
        for (const field of requiredFields) {
            if (!dto[field] && dto[field] !== 0) {
                this.logger.error(`Missing required field: ${field}`);
                throw new BadRequestException(`El campo ${field} es requerido`);
            }
        }

        // Validar tipos
        this.logger.log(`startDate: ${dto.startDate}, type: ${typeof dto.startDate}`);
        this.logger.log(`endDate: ${dto.endDate}, type: ${typeof dto.endDate}`);
        this.logger.log(`targetCalories: ${dto.targetCalories}, type: ${typeof dto.targetCalories}`);
        this.logger.log(`targetProtein: ${dto.targetProtein}, type: ${typeof dto.targetProtein}`);
        this.logger.log(`targetSteps: ${dto.targetSteps}, type: ${typeof dto.targetSteps}`);
        this.logger.log(`targetWater: ${dto.targetWater}, type: ${typeof dto.targetWater}`);
        this.logger.log(`workoutsPerWeek: ${dto.workoutsPerWeek}, type: ${typeof dto.workoutsPerWeek}`);

        // Validar fechas
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        this.logger.log(`Parsed startDate: ${startDate.toISOString()}`);
        this.logger.log(`Parsed endDate: ${endDate.toISOString()}`);

        if (isNaN(startDate.getTime())) {
            this.logger.error(`Invalid startDate: ${dto.startDate}`);
            throw new BadRequestException('La fecha de inicio no es válida');
        }

        if (isNaN(endDate.getTime())) {
            this.logger.error(`Invalid endDate: ${dto.endDate}`);
            throw new BadRequestException('La fecha de fin no es válida');
        }

        if (startDate >= endDate) {
            this.logger.error(`startDate ${startDate.toISOString()} is after or equal to endDate ${endDate.toISOString()}`);
            throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
        }

        // Calcular semanas
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const totalWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        this.logger.log(`Calculated totalWeeks: ${totalWeeks}`);

        // Desactivar otras fases activas
        this.logger.log('Desactivando otras fases activas...');
        await this.cutPhaseRepo.update({ isActive: true }, { isActive: false });

        // Crear la fase
        const cutPhaseData = {
            ...dto,
            totalWeeks,
            isActive: true,
        };

        this.logger.log('Creating cut phase with data:');
        this.logger.log(JSON.stringify(cutPhaseData, null, 2));

        const cutPhase = this.cutPhaseRepo.create(cutPhaseData);

        this.logger.log('Attempting to save cut phase...');
        const savedCutPhase = await this.cutPhaseRepo.save(cutPhase);
        this.logger.log(`Cut phase saved with ID: ${savedCutPhase.id}`);

        // Generar días
        this.logger.log(`Generating days for cut phase ${savedCutPhase.id}...`);
        await this.generateCutPhaseDays(savedCutPhase);
        this.logger.log(`Days generated for cut phase ${savedCutPhase.id}`);

        // Sincronizar días
        this.logger.log(`Syncing days for cut phase ${savedCutPhase.id}...`);
        await this.syncAllDays(savedCutPhase.id);
        this.logger.log(`Days synced for cut phase ${savedCutPhase.id}`);

        this.logger.log(`Cut phase created successfully with ID: ${savedCutPhase.id}`);
        return savedCutPhase;
    }

    async getCutDays(cutPhaseId: string): Promise<CutPhaseDay[]> {
        this.logger.log(`Getting cut days for phase ${cutPhaseId}`);
        const days = await this.cutPhaseDayRepo.find({
            where: { cutPhaseId },
            order: { date: 'ASC' }
        });
        this.logger.log(`Found ${days.length} cut days for phase ${cutPhaseId}`);
        return days;
    }

    // Generar los días del cut phase
    private async generateCutPhaseDays(cutPhase: CutPhase): Promise<void> {
        this.logger.log(`Generating days for cut phase ${cutPhase.id}`);
        this.logger.log(`Start date: ${cutPhase.startDate}, End date: ${cutPhase.endDate}`);

        const startDate = new Date(cutPhase.startDate);
        const endDate = new Date(cutPhase.endDate);
        const days: CutPhaseDay[] = [];

        let currentDate = new Date(startDate);
        let dayCount = 0;

        this.logger.log(`Starting day generation from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        while (currentDate <= endDate) {
            const dateStr = this.getLocalDate(currentDate);
            const weekNumber = Math.floor(dayCount / 7) + 1;

            this.logger.log(`Creating day: date=${dateStr}, weekNumber=${weekNumber}, dayCount=${dayCount}`);

            const day = this.cutPhaseDayRepo.create({
                date: dateStr,
                weekNumber,
                cutPhaseId: cutPhase.id,
            });

            days.push(day);

            currentDate.setDate(currentDate.getDate() + 1);
            dayCount++;
        }

        this.logger.log(`Saving ${days.length} days for cut phase ${cutPhase.id}`);
        await this.cutPhaseDayRepo.save(days);
        this.logger.log(`Generated ${days.length} days for cut phase ${cutPhase.id}`);
    }

    async syncAllExistingDays(cutPhaseId: string): Promise<number> {
        this.logger.log(`Syncing all existing days for cut phase ${cutPhaseId}`);

        const cutPhase = await this.cutPhaseRepo.findOne({
            where: { id: cutPhaseId }
        });

        if (!cutPhase) {
            this.logger.error(`Cut phase ${cutPhaseId} not found`);
            throw new NotFoundException('Cut phase no encontrado');
        }

        // Obtener todos los DailyLogs en el rango de fechas
        const dailyLogs = await this.dailyLogService.findByDateRange(
            cutPhase.startDate,
            cutPhase.endDate
        );

        this.logger.log(`Found ${dailyLogs.length} daily logs to sync`);

        let syncedCount = 0;
        for (const log of dailyLogs) {
            try {
                await this.updateDayCompliance(cutPhaseId, log.date);
                syncedCount++;
            } catch (error) {
                if (error instanceof Error) {
                    this.logger.error(`Error syncing day ${log.date}: ${error.message}`);
                } else {
                    this.logger.error(`Error syncing day ${log.date}: Unknown error`);
                }
            }
        }

        this.logger.log(`Synced ${syncedCount} days for cut phase ${cutPhaseId}`);
        return syncedCount;
    }
    // Calcular el cumplimiento de un día
    private calculateDayCompliance(dailyLog: DailyLog, cutPhase: CutPhase): Omit<CutPhaseDay, 'id' | 'cutPhase' | 'cutPhaseId'> {
        this.logger.log(`Calculating compliance for date ${dailyLog.date}`);

        const caloriesMet = dailyLog.calories <= cutPhase.targetCalories;
        const proteinMet = dailyLog.proteinGrams >= cutPhase.targetProtein;
        const stepsMet = dailyLog.steps >= cutPhase.targetSteps;
        const waterMet = dailyLog.waterLiters >= cutPhase.targetWater;
        const workoutMet = dailyLog.workout !== WorkoutType.NONE && dailyLog.workout !== undefined && dailyLog.workout !== null;

        this.logger.log(`caloriesMet: ${caloriesMet}, proteinMet: ${proteinMet}, stepsMet: ${stepsMet}, waterMet: ${waterMet}, workoutMet: ${workoutMet}`);

        // Calcular score con pesos
        const weights = {
            calories: 0.30,
            protein: 0.30,
            steps: 0.25,
            workout: 0.05,
            water: 0.10,
        };

        let score = 0;
        if (caloriesMet) score += weights.calories * 100;
        if (proteinMet) score += weights.protein * 100;
        if (stepsMet) score += weights.steps * 100;
        if (workoutMet) score += weights.workout * 100;
        if (waterMet) score += weights.water * 100;

        const result = {
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

        this.logger.log(`Compliance result for ${dailyLog.date}: score=${result.dailyScore}, allMet=${result.allMet}`);
        return result;
    }

    // Calcular número de semana
    private calculateWeekNumber(date: string, startDate: string): number {
        const d = new Date(date);
        const start = new Date(startDate);
        const diffDays = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const weekNumber = Math.floor(diffDays / 7) + 1;
        this.logger.log(`Week number for ${date}: ${weekNumber} (diffDays: ${diffDays})`);
        return weekNumber;
    }

    // Sincronizar todos los días del cut phase
    async syncAllDays(cutPhaseId: string): Promise<void> {
        this.logger.log(`Syncing all days for cut phase ${cutPhaseId}`);

        const cutPhase = await this.cutPhaseRepo.findOne({
            where: { id: cutPhaseId }
        });

        if (!cutPhase) {
            this.logger.error(`Cut phase ${cutPhaseId} not found`);
            throw new NotFoundException('Cut phase no encontrado');
        }

        this.logger.log(`Cut phase found: ${cutPhase.id}, startDate: ${cutPhase.startDate}, endDate: ${cutPhase.endDate}`);

        this.logger.log(`Fetching daily logs from ${cutPhase.startDate} to ${cutPhase.endDate}`);
        const dailyLogs = await this.dailyLogService.findByDateRange(
            cutPhase.startDate,
            cutPhase.endDate
        );
        this.logger.log(`Found ${dailyLogs.length} daily logs`);

        this.logger.log(`Deleting existing days for cut phase ${cutPhaseId}`);
        await this.cutPhaseDayRepo.delete({ cutPhaseId });

        this.logger.log(`Creating ${dailyLogs.length} days for cut phase ${cutPhaseId}`);
        const days = dailyLogs.map(log => {
            const compliance = this.calculateDayCompliance(log, cutPhase);
            return this.cutPhaseDayRepo.create({
                ...compliance,
                cutPhaseId,
            });
        });

        if (days.length > 0) {
            this.logger.log(`Saving ${days.length} days for cut phase ${cutPhaseId}`);
            await this.cutPhaseDayRepo.save(days);
            this.logger.log(`Synced ${days.length} days for cut phase ${cutPhaseId}`);
        } else {
            this.logger.log(`No days to sync for cut phase ${cutPhaseId}`);
        }
    }

    // Actualizar un día específico
    async updateDayCompliance(cutPhaseId: string, date: string): Promise<CutPhaseDay> {
        this.logger.log(`Updating day compliance for cut phase ${cutPhaseId}, date ${date}`);

        const cutPhase = await this.cutPhaseRepo.findOne({
            where: { id: cutPhaseId }
        });

        if (!cutPhase) {
            this.logger.error(`Cut phase ${cutPhaseId} not found`);
            throw new NotFoundException('Cut phase no encontrado');
        }

        this.logger.log(`Fetching daily log for date ${date}`);
        const dailyLog = await this.dailyLogService.findByDate(date);
        if (!dailyLog) {
            this.logger.error(`No daily log found for date ${date}`);
            throw new NotFoundException(`No hay datos para la fecha ${date}`);
        }

        this.logger.log(`Finding existing cut phase day for date ${date}`);
        let cutPhaseDay = await this.cutPhaseDayRepo.findOne({
            where: { cutPhaseId, date }
        });

        const compliance = this.calculateDayCompliance(dailyLog, cutPhase);

        if (cutPhaseDay) {
            this.logger.log(`Updating existing day for ${date}`);
            Object.assign(cutPhaseDay, compliance);
        } else {
            this.logger.log(`Creating new day for ${date}`);
            cutPhaseDay = this.cutPhaseDayRepo.create({
                ...compliance,
                cutPhaseId,
            });
        }

        this.logger.log(`Saving day for ${date}`);
        return this.cutPhaseDayRepo.save(cutPhaseDay);
    }

    async getDashboard(cutPhaseId: string): Promise<any> {
        this.logger.log(`Getting dashboard for cut phase ${cutPhaseId}`);

        const cutPhase = await this.cutPhaseRepo.findOne({
            where: { id: cutPhaseId }
        });

        if (!cutPhase) {
            this.logger.error(`Cut phase ${cutPhaseId} not found`);
            throw new NotFoundException('Cut phase no encontrado');
        }

        this.logger.log(`Cut phase found: ${cutPhase.id}`);
        this.logger.log(`Start date: ${cutPhase.startDate}, End date: ${cutPhase.endDate}`);
        this.logger.log(`Targets: calories=${cutPhase.targetCalories}, protein=${cutPhase.targetProtein}, steps=${cutPhase.targetSteps}, water=${cutPhase.targetWater}, workoutsPerWeek=${cutPhase.workoutsPerWeek}`);

        // Obtener días del cut phase
        this.logger.log(`Fetching cut phase days for phase ${cutPhaseId}`);
        const cutPhaseDays = await this.cutPhaseDayRepo.find({
            where: { cutPhaseId },
            order: { date: 'ASC' }
        });
        this.logger.log(`Found ${cutPhaseDays.length} cut phase days`);

        // Obtener DailyLogs para mostrar valores reales
        this.logger.log(`Fetching daily logs from ${cutPhase.startDate} to ${cutPhase.endDate}`);
        const dailyLogs = await this.dailyLogService.findByDateRange(
            cutPhase.startDate,
            cutPhase.endDate
        );
        this.logger.log(`Found ${dailyLogs.length} daily logs`);

        const dailyLogsMap = new Map<string, DailyLog>();
        dailyLogs.forEach(log => {
            dailyLogsMap.set(log.date, log);
        });

        // Combinar datos
        this.logger.log('Combining cut phase days with daily logs');
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

        // Obtener weight logs
        this.logger.log(`Fetching weight logs from ${cutPhase.startDate} to ${cutPhase.endDate}`);
        const allWeightLogs = await this.weightLogService.findByDateRange(
            cutPhase.startDate,
            cutPhase.endDate
        );
        this.logger.log(`Found ${allWeightLogs.length} weight logs`);

        const sortedWeightLogs = allWeightLogs.sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        const initialMeasurement = sortedWeightLogs.length > 0 ? sortedWeightLogs[0] : null;
        const currentMeasurement = sortedWeightLogs.length > 0
            ? sortedWeightLogs[sortedWeightLogs.length - 1]
            : null;

        this.logger.log(`Initial measurement: ${JSON.stringify(initialMeasurement)}`);
        this.logger.log(`Current measurement: ${JSON.stringify(currentMeasurement)}`);

        // Calcular estadísticas
        const totalDays = daysWithData.length;
        const daysWithAllMet = daysWithData.filter(d => d.allMet);
        const totalScore = daysWithData.reduce((sum, d) => sum + d.dailyScore, 0);
        const avgScore = totalDays > 0 ? totalScore / totalDays : 0;

        this.logger.log(`Total days: ${totalDays}, days with all met: ${daysWithAllMet.length}, average score: ${avgScore}`);

        // Calcular semana actual
        const today = new Date();
        const startDate = new Date(cutPhase.startDate);
        const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, cutPhase.totalWeeks);

        this.logger.log(`Current week: ${currentWeek}, total weeks: ${cutPhase.totalWeeks}`);
        const streaks = await this.getStreaks(cutPhaseId);

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

            days: daysWithData,
            weeklySummary: this.calculateWeeklySummary(daysWithData, cutPhase.totalWeeks),
            trends: this.calculateTrends(daysWithData),
            streaks: streaks,
        };
    }

    private calculateWeeklySummary(days: any[], totalWeeks: number): WeeklySummary[] {
        this.logger.log(`Calculating weekly summary for ${totalWeeks} weeks`);
        const weeklySummary: WeeklySummary[] = [];

        for (let week = 1; week <= totalWeeks; week++) {
            const weekDays = days.filter(d => d.weekNumber === week);

            if (weekDays.length === 0) {
                this.logger.log(`Week ${week}: no days found`);
                continue;
            }

            const daysWithData = weekDays.filter(d => d.dailyScore > 0);
            const daysWithAllMet = weekDays.filter(d => d.allMet);

            this.logger.log(`Week ${week}: ${weekDays.length} days, ${daysWithData.length} with data, ${daysWithAllMet.length} all met`);

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

    async getStreaks(cutPhaseId: string): Promise<{ currentStreak: number; bestStreak: number; lastFailedDate: string | null }> {
        const days = await this.cutPhaseDayRepo.find({
            where: { cutPhaseId },
            order: { date: 'DESC' }
        });

        if (days.length === 0) {
            return { currentStreak: 0, bestStreak: 0, lastFailedDate: null };
        }

        const threshold = 90;
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        let lastFailedDate: string | null = null;

        // Calcular racha actual (desde el más reciente)
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
                if (i === 0) {
                    currentStreak = 0;
                    lastFailedDate = days[i].date;
                    break;
                } else {
                    lastFailedDate = days[i].date;
                    break;
                }
            }
        }

        // Calcular mejor racha (histórica)
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

    private calculateAttributeCompliance(days: any[], attribute: string): number {
        const relevantDays = days.filter(d => d.dailyScore > 0);
        if (relevantDays.length === 0) return 0;

        const metCount = relevantDays.filter(d => d[attribute] === true).length;
        const result = (metCount / relevantDays.length) * 100;
        this.logger.log(`Attribute ${attribute}: ${metCount}/${relevantDays.length} = ${result}%`);
        return result;
    }

    // Calcular tendencias
    private calculateTrends(days: any[]): TrendsData {
        this.logger.log('Calculating trends');
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

            const overallCompliance = overallCount > 0 ? overallSum / overallCount : 0;
            this.logger.log(`Trend for ${attributeNames[index]}: overall compliance = ${overallCompliance}%`);

            trends[attributeNames[index]] = {
                attribute: attributeNames[index],
                weeks,
                overallCompliance: overallCompliance,
            };
        });

        return trends;
    }

    // Métodos CRUD básicos
    async findAll(): Promise<CutPhase[]> {
        this.logger.log('Finding all cut phases');
        const result = await this.cutPhaseRepo.find({
            order: { createdAt: 'DESC' }
        });
        this.logger.log(`Found ${result.length} cut phases`);
        return result;
    }

    async findActive(): Promise<CutPhase | null> {
        this.logger.log('Finding active cut phase');
        const result = await this.cutPhaseRepo.findOne({
            where: { isActive: true }
        });
        this.logger.log(`Active cut phase found: ${result?.id || 'none'}`);
        return result;
    }

    async findById(id: string): Promise<CutPhase> {
        this.logger.log(`Finding cut phase by ID: ${id}`);
        const cutPhase = await this.cutPhaseRepo.findOne({
            where: { id }
        });

        if (!cutPhase) {
            this.logger.error(`Cut phase ${id} not found`);
            throw new NotFoundException('Cut phase no encontrado');
        }

        this.logger.log(`Cut phase found: ${cutPhase.id}`);
        return cutPhase;
    }

    async update(id: string, dto: UpdateCutPhaseDto): Promise<CutPhase> {
        this.logger.log(`Updating cut phase ${id}`);
        this.logger.log(`Update DTO: ${JSON.stringify(dto)}`);

        const cutPhase = await this.findById(id);

        if (dto.startDate && dto.endDate) {
            this.logger.log(`Checking dates: start=${dto.startDate}, end=${dto.endDate}`);
            if (new Date(dto.startDate) >= new Date(dto.endDate)) {
                this.logger.error(`Invalid date range: start ${dto.startDate} >= end ${dto.endDate}`);
                throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
            }

            const start = new Date(dto.startDate);
            const end = new Date(dto.endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            dto['totalWeeks'] = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
            this.logger.log(`Recalculated totalWeeks: ${dto['totalWeeks']}`);
        }

        Object.assign(cutPhase, dto);
        this.logger.log('Saving updated cut phase');
        const updated = await this.cutPhaseRepo.save(cutPhase);
        this.logger.log(`Cut phase ${id} updated`);

        // Regenerar días si cambiaron las fechas
        if (dto.startDate || dto.endDate) {
            this.logger.log(`Regenerating days for cut phase ${id} due to date change`);
            await this.cutPhaseDayRepo.delete({ cutPhaseId: id });
            await this.generateCutPhaseDays(updated);
            await this.syncAllDays(id);
        }

        return updated;
    }

    async remove(id: string): Promise<void> {
        this.logger.log(`Removing cut phase ${id}`);
        const cutPhase = await this.findById(id);

        this.logger.log(`Deleting days for cut phase ${id}`);
        await this.cutPhaseDayRepo.delete({ cutPhaseId: id });

        this.logger.log(`Removing cut phase ${id}`);
        await this.cutPhaseRepo.remove(cutPhase);
        this.logger.log(`Cut phase ${id} removed`);
    }

    // Función auxiliar
    private getLocalDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const result = `${year}-${month}-${day}`;
        this.logger.log(`Formatting date ${date.toISOString()} -> ${result}`);
        return result;
    }
}