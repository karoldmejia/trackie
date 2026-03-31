import { Injectable } from "@nestjs/common";
import { CreateDailyLogDto } from "../dtos/dailylog.dto";
import { DailyLog } from "../entities/dailylog.entity";
import { Between, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

export interface GoodBadDaysResult {
    goodDays: number;
    badDays: number;
    totalDays: number;
    goodDaysPercentage: number;
    badDaysPercentage: number;
    averageCalories: number;
    averageSteps: number;
    goodDaysList: DailyLog[];
    badDaysList: DailyLog[];
}

export interface DayClassification {
    date: string;
    calories: number;
    steps: number;
    isGood: boolean;
    isBad: boolean;
    reason?: string;
}

export interface FullStatsResult {
    period: { start: string; end: string };
    summary: {
        totalDays: number;
        totalCalories: number;
        totalSteps: number;
        averageCalories: number;
        averageSteps: number;
        bestDay: DailyLog | null;
        bestDayCalories: number;
        bestDaySteps: number;
        worstDayCalories: number;
        worstDaySteps: number;
    };
    goodBadStats: GoodBadDaysResult;
    classifications: DayClassification[];
    trend: {
        percentage: number;
        direction: 'up' | 'down' | 'stable';
        previousAverage: number;
        currentAverage: number;
    };
}

@Injectable()
export class DailyLogService {
    constructor(
        @InjectRepository(DailyLog)
        private readonly dailyLogRepo: Repository<DailyLog>,
    ) { }

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

        if (existing) {
            Object.assign(existing, dto);
            return this.dailyLogRepo.save(existing);
        } else {
            const log = this.dailyLogRepo.create({
                ...dto,
                date,
            });
            return this.dailyLogRepo.save(log);
        }
    }

    // Actualizar o crear (versión explícita)
    async upsert(dto: CreateDailyLogDto): Promise<DailyLog> {
        let log = await this.dailyLogRepo.findOne({ where: { date: dto.date } });
        if (!log) {
            log = this.dailyLogRepo.create(dto);
        } else {
            Object.assign(log, dto);
        }
        return this.dailyLogRepo.save(log);
    }

    // Obtener todos los registros
    async findAll(): Promise<DailyLog[]> {
        return this.dailyLogRepo.find({ order: { date: 'DESC' } });
    }

    // Buscar por fecha exacta
    async findByDate(date: string): Promise<DailyLog | null> {
        return this.dailyLogRepo.findOne({ where: { date } });
    }

    // Buscar rango de fechas (para dashboards y promedio semanal)
    async findByDateRange(start: string, end: string): Promise<DailyLog[]> {
        return this.dailyLogRepo.find({
            where: { date: Between(start, end) },
            order: { date: 'ASC' },
        });
    }

    // Eliminar un registro
    async remove(id: string): Promise<void> {
        await this.dailyLogRepo.delete(id);
    }

    // Promedio de calorías de un rango de fechas
    async getWeeklyAverage(start: string, end: string): Promise<number> {
        const logs = await this.findByDateRange(start, end);
        if (!logs.length) return 0;
        const total = logs.reduce((acc, log) => acc + log.calories, 0);
        return total / logs.length;
    }

    // Método específico para actualizar solo algunos campos
    async updateByDate(date: string, dto: Partial<CreateDailyLogDto>): Promise<DailyLog> {
        let log = await this.dailyLogRepo.findOne({ where: { date } });
        if (!log) {
            log = this.dailyLogRepo.create({
                ...dto,
                date,
            });
        } else {
            Object.assign(log, dto);
        }
        return this.dailyLogRepo.save(log);
    }

    /**
     * Calcular días buenos y malos basado en límite de calorías y objetivo de pasos
     * @param start Fecha inicio (YYYY-MM-DD)
     * @param end Fecha fin (YYYY-MM-DD)
     * @param calorieLimit Límite de calorías diarias (ej: 2000)
     * @param stepGoal Objetivo de pasos diarios (ej: 8000)
     */
    async getGoodBadDays(
        start: string,
        end: string,
        calorieLimit: number,
        stepGoal: number
    ): Promise<GoodBadDaysResult> {
        const logs = await this.findByDateRange(start, end);
        
        if (!logs.length) {
            return {
                goodDays: 0,
                badDays: 0,
                totalDays: 0,
                goodDaysPercentage: 0,
                badDaysPercentage: 0,
                averageCalories: 0,
                averageSteps: 0,
                goodDaysList: [],
                badDaysList: [],
            };
        }

        // Calcular promedio de calorías y pasos
        const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
        const totalSteps = logs.reduce((sum, log) => sum + log.steps, 0);
        const averageCalories = totalCalories / logs.length;
        const averageSteps = totalSteps / logs.length;

        const goodDaysList: DailyLog[] = [];
        const badDaysList: DailyLog[] = [];

        logs.forEach(log => {
            const isGood = log.calories <= calorieLimit && log.steps >= stepGoal;
            const isBad = log.calories > calorieLimit || log.steps < stepGoal;
            
            if (isGood) {
                goodDaysList.push(log);
            } else if (isBad) {
                badDaysList.push(log);
            }
        });

        const totalDays = logs.length;
        const goodDays = goodDaysList.length;
        const badDays = badDaysList.length;

        return {
            goodDays,
            badDays,
            totalDays,
            goodDaysPercentage: (goodDays / totalDays) * 100,
            badDaysPercentage: (badDays / totalDays) * 100,
            averageCalories: Math.round(averageCalories),
            averageSteps: Math.round(averageSteps),  // NUEVO
            goodDaysList,
            badDaysList,
        };
    }

    /**
     * Clasificar cada día como bueno o malo con razón
     */
    async classifyDays(
        start: string,
        end: string,
        calorieLimit: number,
        stepGoal: number
    ): Promise<DayClassification[]> {
        const logs = await this.findByDateRange(start, end);
        
        return logs.map(log => {
            const isCaloriesOk = log.calories <= calorieLimit;
            const isStepsOk = log.steps >= stepGoal;
            const isGood = isCaloriesOk && isStepsOk;
            const isBad = !isCaloriesOk || !isStepsOk;
            
            let reason = '';
            if (!isCaloriesOk && !isStepsOk) {
                reason = `Excediste el límite de calorías (${log.calories}/${calorieLimit} kcal) y no alcanzaste el objetivo de pasos (${log.steps}/${stepGoal})`;
            } else if (!isCaloriesOk) {
                reason = `Excediste el límite de calorías: ${log.calories}/${calorieLimit} kcal`;
            } else if (!isStepsOk) {
                reason = `No alcanzaste el objetivo de pasos: ${log.steps}/${stepGoal}`;
            }
            
            return {
                date: log.date,
                calories: log.calories,
                steps: log.steps,
                isGood,
                isBad,
                reason: reason || '¡Excelente día!',
            };
        });
    }

    /**
     * Obtener estadísticas completas para un rango de fechas
     */
    async getFullStats(
        start: string,
        end: string,
        calorieLimit: number,
        stepGoal: number
    ): Promise<FullStatsResult> {
        const logs = await this.findByDateRange(start, end);
        const goodBadStats = await this.getGoodBadDays(start, end, calorieLimit, stepGoal);
        const classifications = await this.classifyDays(start, end, calorieLimit, stepGoal);
        
        // Calcular totales
        const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
        const totalSteps = logs.reduce((sum, log) => sum + log.steps, 0);
        
        // Encontrar mejor y peor día en calorías y pasos
        const bestDayCalories = logs.length ? Math.max(...logs.map(l => l.calories)) : 0;
        const worstDayCalories = logs.length ? Math.min(...logs.map(l => l.calories)) : 0;
        const bestDaySteps = logs.length ? Math.max(...logs.map(l => l.steps)) : 0;
        const worstDaySteps = logs.length ? Math.min(...logs.map(l => l.steps)) : 0;
        
        const bestDay = logs.length ? [...logs].sort((a, b) => b.calories - a.calories)[0] : null;
        
        // Calcular tendencia (comparación con período anterior)
        const daysCount = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 3600 * 24));
        const previousStart = new Date(start);
        previousStart.setDate(previousStart.getDate() - daysCount);
        const previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);
        
        const previousLogs = await this.findByDateRange(
            this.getLocalDate(previousStart),
            this.getLocalDate(previousEnd)
        );
        
        const previousAvg = previousLogs.length 
            ? previousLogs.reduce((sum, log) => sum + log.calories, 0) / previousLogs.length 
            : 0;
        
        const currentAvg = goodBadStats.averageCalories;
        const trend = previousAvg ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;

        return {
            period: { start, end },
            summary: {
                totalDays: logs.length,
                totalCalories: totalCalories,
                totalSteps: totalSteps,
                averageCalories: goodBadStats.averageCalories,
                averageSteps: goodBadStats.averageSteps,
                bestDay: bestDay,
                bestDayCalories: bestDayCalories,
                bestDaySteps: bestDaySteps,
                worstDayCalories: worstDayCalories,
                worstDaySteps: worstDaySteps,
            },
            goodBadStats,
            classifications,
            trend: {
                percentage: trend,
                direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
                previousAverage: Math.round(previousAvg),
                currentAverage: currentAvg,
            },
        };
    }
}