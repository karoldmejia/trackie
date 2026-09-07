import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CutPhase } from '../entities/cutphase.entity';
import { CutPhaseDay } from '../entities/cutphaseday.entity';
import { DailyLogService } from './dailylog.service';
import { WeightLogService } from './weightlog.service';
import { CreateCutPhaseDto, UpdateCutPhaseDto } from '../dtos/cutday.dto';
import { DailyLog } from '../entities/dailylog.entity';
import { WorkoutType } from '../enums/workouttype.enum';
import { WeeklySummary } from '../interfaces/weekly-summary.interface';
import { TrendsData, WeeklyTrend } from '../interfaces/weekly-trend.interface';
import { WeightLog } from 'src/entities/weightlog.entity';

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

        const requiredFields = ['startDate', 'endDate', 'targetCalories', 'targetProtein', 'targetSteps', 'targetWater', 'workoutsPerWeek', 'weeklyTargetSteps'];
        for (const field of requiredFields) {
            if (!dto[field] && dto[field] !== 0) {
                this.logger.error(`Missing required field: ${field}`);
                throw new BadRequestException(`El campo ${field} es requerido`);
            }
        }

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

        const weeklyTargetSteps = dto.weeklyTargetSteps * 7;

        // Crear la fase
        const cutPhaseData = {
            ...dto,
            weeklyTargetSteps: weeklyTargetSteps,
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

        const weeklyWeightAvg = this.calculateWeeklyWeightAverage(allWeightLogs);
        const lastMeasurements = this.getLastMeasurementWithValue(allWeightLogs);
        const firstMeasurements = this.getFirstMeasurementWithValue(allWeightLogs);
        const lastWeight = this.getLastWeightMeasurement(allWeightLogs);

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

        const caloriesCarryover = this.calculateWeeklyCarryover(
            dailyLogs,
            cutPhase.targetCalories,
            new Date(),
            cutPhase.startDate
        );

        const stepsCarryover = this.calculateStepCarryover(
            dailyLogs,
            cutPhase.weeklyTargetSteps,
            new Date(),
            cutPhase.startDate
        );

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
                // Peso
                weight: {
                    average: weeklyWeightAvg,
                    initial: firstMeasurements.weight.value || null,
                    current: lastWeight?.weight || null,
                    difference: firstMeasurements.weight.value && lastWeight?.weight
                        ? Number((lastWeight.weight - firstMeasurements.weight.value).toFixed(2))
                        : null
                },
                // Bodyfat
                bodyfat: {
                    initial: firstMeasurements.bodyfat.value || null,
                    initialDate: firstMeasurements.bodyfat.date || null,
                    current: lastMeasurements.bodyfat.value,
                    currentDate: lastMeasurements.bodyfat.date,
                    difference: firstMeasurements.bodyfat.value && lastMeasurements.bodyfat.value
                        ? Number((lastMeasurements.bodyfat.value - firstMeasurements.bodyfat.value).toFixed(2))
                        : null
                },
                // Waist
                waist: {
                    initial: firstMeasurements.waist.value || null,
                    initialDate: firstMeasurements.waist.date || null,
                    current: lastMeasurements.waist.value,
                    currentDate: lastMeasurements.waist.date,
                    difference: firstMeasurements.waist.value && lastMeasurements.waist.value
                        ? Number((lastMeasurements.waist.value - firstMeasurements.waist.value).toFixed(2))
                        : null
                },
                // Hips
                hips: {
                    initial: firstMeasurements.hips.value || null,
                    initialDate: firstMeasurements.hips.date || null,
                    current: lastMeasurements.hips.value,
                    currentDate: lastMeasurements.hips.date,
                    difference: firstMeasurements.hips.value && lastMeasurements.hips.value
                        ? Number((lastMeasurements.hips.value - firstMeasurements.hips.value).toFixed(2))
                        : null
                },
            },
            days: daysWithData,
            weeklySummary: this.calculateWeeklySummary(daysWithData, cutPhase.totalWeeks),
            trends: this.calculateTrends(daysWithData),
            streaks: streaks,
            caloriesCarryover,
            stepsCarryover,

            weeklyAverages: this.calculateWeeklyAverages(daysWithData, cutPhase.totalWeeks),

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

    /**
     * Calcula los promedios semanales de calorías, proteínas, pasos y agua
     */
    private calculateWeeklyAverages(daysWithData: any[], totalWeeks: number): Array<{
        weekNumber: number;
        averages: { calories: number; protein: number; steps: number; water: number };
        daysWithData: number;
    }> {
        const weeklyAverages: Array<{
            weekNumber: number;
            averages: { calories: number; protein: number; steps: number; water: number };
            daysWithData: number;
        }> = [];

        for (let week = 1; week <= totalWeeks; week++) {
            const weekDays = daysWithData.filter(d => d.weekNumber === week);
            const daysWithLogs = weekDays.filter(d => d.dailyScore > 0);
            const count = daysWithLogs.length;

            if (count === 0) {
                weeklyAverages.push({
                    weekNumber: week,
                    averages: { calories: 0, protein: 0, steps: 0, water: 0 },
                    daysWithData: 0,
                });
                continue;
            }

            let totalCalories = 0, totalProtein = 0, totalSteps = 0, totalWater = 0;

            for (const day of daysWithLogs) {
                totalCalories += day.calories || 0;
                totalProtein += day.protein || 0;
                totalSteps += day.steps || 0;
                totalWater += day.water || 0;
            }

            weeklyAverages.push({
                weekNumber: week,
                averages: {
                    calories: Number((totalCalories / count).toFixed(1)),
                    protein: Number((totalProtein / count).toFixed(1)),
                    steps: Math.round(totalSteps / count),
                    water: Number((totalWater / count).toFixed(1)),
                },
                daysWithData: count,
            });
        }

        return weeklyAverages;
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

    private calculateWeeklyCarryover(logs: DailyLog[], targetCalories: number, currentDate: Date, phaseStartDate: string) {
        // Obtener el inicio de la semana basado en la fase
        const localDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const weekStart = this.getWeekStartFromPhase(localDate, phaseStartDate);
        const weekLogs = logs.filter(log => log.date >= weekStart);

        if (weekLogs.length === 0) {
            return { runningBalance: 0, adjustedBudget: targetCalories };
        }

        const totalConsumed = weekLogs.reduce((sum, log) => sum + log.calories, 0);
        const targetForElapsed = weekLogs.length * targetCalories;
        const runningBalance = totalConsumed - targetForElapsed; // Positivo = ahorro

        const daysRemaining = 7 - weekLogs.length;
        const adjustedBudget = targetCalories + runningBalance;

        return {
            runningBalance,
            adjustedBudget: Math.round(adjustedBudget),
            daysRemaining,
            averagePerDay: daysRemaining > 0
                ? Math.round((adjustedBudget) / daysRemaining)
                : 0,
        };
    }

    private calculateStepCarryover(logs: DailyLog[], targetSteps: number, currentDate: Date, phaseStartDate: string) {
        const localDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const weekStart = this.getWeekStartFromPhase(localDate, phaseStartDate);
        // ✅ LOG PARA DEBUG
        console.log('📅 Fecha actual:', this.getLocalDate(currentDate));
        console.log('📅 Inicio de semana (weekStart):', weekStart);
        console.log('📅 Fecha de inicio de la fase:', phaseStartDate);

        const weekLogs = logs.filter(log => log.date >= weekStart);

        // ✅ LOG PARA DEBUG
        console.log('📊 Total de logs:', logs.length);
        console.log('📊 Logs de esta semana:', weekLogs.length);
        console.log('📊 Logs de esta semana (fechas):', weekLogs.map(l => l.date));


        if (weekLogs.length === 0) {
            return {
                totalSteps: 0,
                averageNeeded: targetSteps,
                daysRemaining: 7
            };
        }

        const totalSteps = weekLogs.reduce((sum, log) => sum + log.steps, 0);
        const targetForElapsed = weekLogs.length * targetSteps;
        const stepBalance = totalSteps - targetForElapsed; // Positivo = adelantado

        const daysRemaining = 7 - weekLogs.length;
        const stepsRemaining = (7 * targetSteps) - totalSteps;
        const averageNeeded = daysRemaining > 0
            ? Math.ceil(stepsRemaining / daysRemaining)
            : 0;

        return {
            totalSteps,
            stepBalance,
            daysRemaining,
            stepsRemaining: Math.max(0, stepsRemaining),
            averageNeeded,
            isAhead: stepBalance > 0,
            isBehind: stepBalance < 0,
        };
    }

private getWeekStartFromPhase(date: Date, phaseStartDate: string): string {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const start = new Date(phaseStartDate);
    const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());

    const diffDays = Math.floor((d.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24));
    
    const weekNumber = Math.floor(diffDays / 7);
    const weekStart = new Date(startLocal);
    weekStart.setDate(startLocal.getDate() + (weekNumber * 7));

    console.log('🔍 getWeekStartFromPhase:', {
        date: this.getLocalDate(d),
        phaseStart: phaseStartDate,
        diffDays,
        weekNumber,
        weekStart: this.getLocalDate(weekStart)
    });

    return this.getLocalDate(weekStart);
}

    /**
 * Calcula el promedio de peso de la semana actual
 */
    private calculateWeeklyWeightAverage(weightLogs: WeightLog[]): number | null {
        if (weightLogs.length === 0) return null;

        // Obtener logs con peso válido
        const logsWithWeight = weightLogs.filter(log =>
            log.weight !== undefined &&
            log.weight !== null &&
            log.weight > 0
        );

        if (logsWithWeight.length === 0) return null;

        // Calcular promedio
        const total = logsWithWeight.reduce((sum, log) => sum + log.weight, 0);
        const average = total / logsWithWeight.length;

        return Number(average.toFixed(2));
    }

    /**
     * Obtiene la última medición que tenga un valor específico
     * Para cada medida  busca el registro más reciente que tenga un valor válido (no null, no undefined, no 0)
     */
    private getLastMeasurementWithValue(weightLogs: WeightLog[]): {
        bodyfat: { value: number | null; date: string | null };
        waist: { value: number | null; date: string | null };
        hips: { value: number | null; date: string | null };
    } {
        // Ordenar de más reciente a más antiguo
        const sortedLogs = [...weightLogs].sort((a, b) =>
            b.date.localeCompare(a.date)
        );

        let bodyfatValue: number | null = null;
        let bodyfatDate: string | null = null;
        let waistValue: number | null = null;
        let waistDate: string | null = null;
        let hipsValue: number | null = null;
        let hipsDate: string | null = null;

        for (const log of sortedLogs) {
            if (bodyfatValue === null && log.bodyfat !== undefined && log.bodyfat !== null && log.bodyfat > 0) {
                bodyfatValue = log.bodyfat;
                bodyfatDate = log.date;
            }

            if (waistValue === null && log.waist !== undefined && log.waist !== null && log.waist > 0) {
                waistValue = log.waist;
                waistDate = log.date;
            }

            if (hipsValue === null && log.hips !== undefined && log.hips !== null && log.hips > 0) {
                hipsValue = log.hips;
                hipsDate = log.date;
            }
            if (bodyfatValue !== null && waistValue !== null && hipsValue !== null) {
                break;
            }
        }

        return {
            bodyfat: { value: bodyfatValue, date: bodyfatDate },
            waist: { value: waistValue, date: waistDate },
            hips: { value: hipsValue, date: hipsDate },
        };
    }

    /**
     * Obtiene la última medición de peso (para el valor "current" del peso)
     */
    private getLastWeightMeasurement(weightLogs: WeightLog[]): WeightLog | null {
        const logsWithWeight = weightLogs
            .filter(log => log.weight !== undefined && log.weight !== null && log.weight > 0)
            .sort((a, b) => a.date.localeCompare(b.date));

        return logsWithWeight.length > 0 ? logsWithWeight[logsWithWeight.length - 1] : null;
    }

    /**
     * Obtiene el primer registro (más antiguo) del rango que tenga valor para cada medida
     */
    private getFirstMeasurementWithValue(weightLogs: WeightLog[]): {
        weight: { value: number | null; date: string | null };
        bodyfat: { value: number | null; date: string | null };
        waist: { value: number | null; date: string | null };
        hips: { value: number | null; date: string | null };
    } {
        // Ordenar de más antiguo a más reciente
        const sortedLogs = [...weightLogs].sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        let weightValue: number | null = null;
        let weightDate: string | null = null;
        let bodyfatValue: number | null = null;
        let bodyfatDate: string | null = null;
        let waistValue: number | null = null;
        let waistDate: string | null = null;
        let hipsValue: number | null = null;
        let hipsDate: string | null = null;

        for (const log of sortedLogs) {
            // Peso
            if (weightValue === null && log.weight !== undefined && log.weight !== null && log.weight > 0) {
                weightValue = log.weight;
                weightDate = log.date;
            }

            // Bodyfat
            if (bodyfatValue === null && log.bodyfat !== undefined && log.bodyfat !== null && log.bodyfat > 0) {
                bodyfatValue = log.bodyfat;
                bodyfatDate = log.date;
            }

            // Waist
            if (waistValue === null && log.waist !== undefined && log.waist !== null && log.waist > 0) {
                waistValue = log.waist;
                waistDate = log.date;
            }

            // Hips
            if (hipsValue === null && log.hips !== undefined && log.hips !== null && log.hips > 0) {
                hipsValue = log.hips;
                hipsDate = log.date;
            }

            // Si encontramos todas, salimos
            if (weightValue !== null && bodyfatValue !== null && waistValue !== null && hipsValue !== null) {
                break;
            }
        }

        return {
            weight: { value: weightValue, date: weightDate },
            bodyfat: { value: bodyfatValue, date: bodyfatDate },
            waist: { value: waistValue, date: waistDate },
            hips: { value: hipsValue, date: hipsDate },
        };
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

        const today = this.getLocalDate(new Date());

        // Buscar fase activa dentro del rango de fechas
        const result = await this.cutPhaseRepo
            .createQueryBuilder('cutPhase')
            .where('cutPhase.isActive = :isActive', { isActive: true })
            .andWhere('cutPhase.startDate <= :today', { today })
            .andWhere('cutPhase.endDate >= :today', { today })
            .getOne();

        if (result) {
            this.logger.log(`Active cut phase found: ${result.id}`);
            return result;
        }

        // Desactivar fases que ya no están en rango
        await this.cutPhaseRepo
            .createQueryBuilder()
            .update(CutPhase)
            .set({ isActive: false })
            .where('isActive = :isActive', { isActive: true })
            .andWhere('endDate < :today OR startDate > :today', { today })
            .execute();

        this.logger.log('No active cut phase found');
        return null;
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
        // Usar el método toISOString pero ajustando la zona horaria
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}