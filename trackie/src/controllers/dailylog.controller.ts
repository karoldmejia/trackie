import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CreateDailyLogDto } from '../dtos/dailylog.dto';
import { DailyLogService, GoodBadDaysResult, DayClassification } from '../services/dailylog.service';
import { DailyLog } from '../entities/dailylog.entity';

@Controller('daily-logs')
export class DailyLogController {
    constructor(private readonly dailyLogService: DailyLogService) { }

    // Crear registro diario
    @Post()
    async create(@Body() dto: CreateDailyLogDto): Promise<DailyLog> {
        return this.dailyLogService.create(dto);
    }

    // Upsert: actualizar o crear
    @Put()
    async upsert(@Body() dto: CreateDailyLogDto): Promise<DailyLog> {
        return this.dailyLogService.upsert(dto);
    }

    // Obtener todos los registros
    @Get()
    async findAll(): Promise<DailyLog[]> {
        return this.dailyLogService.findAll();
    }

    // Obtener registro por fecha
    @Get('date/:date')
    async findByDate(@Param('date') date: string): Promise<DailyLog | null> {
        return this.dailyLogService.findByDate(date);
    }

    // Obtener registros por rango de fechas
    @Get('range')
    async findByDateRange(@Query('start') start: string, @Query('end') end: string): Promise<DailyLog[]> {
        return this.dailyLogService.findByDateRange(start, end);
    }

    // Obtener promedio de calorías en un rango
    @Get('average')
    async getAverage(@Query('start') start: string, @Query('end') end: string): Promise<{ averageCalories: number }> {
        const avg = await this.dailyLogService.getWeeklyAverage(start, end);
        return { averageCalories: avg };
    }

    // Eliminar registro por id
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
        await this.dailyLogService.remove(id);
        return { deleted: true };
    }

    // Obtener días buenos y malos
    @Get('good-bad-days')
    async getGoodBadDays(
        @Query('start') start: string,
        @Query('end') end: string,
        @Query('calorieLimit') calorieLimit: string,
        @Query('stepGoal') stepGoal: string,
    ): Promise<GoodBadDaysResult> {
        return this.dailyLogService.getGoodBadDays(
            start,
            end,
            parseInt(calorieLimit) || 2000,
            parseInt(stepGoal) || 8000
        );
    }

    // Obtener clasificación de días con razones
    @Get('classify')
    async classifyDays(
        @Query('start') start: string,
        @Query('end') end: string,
        @Query('calorieLimit') calorieLimit: string,
        @Query('stepGoal') stepGoal: string,
    ): Promise<DayClassification[]> {
        return this.dailyLogService.classifyDays(
            start,
            end,
            parseInt(calorieLimit) || 2000,
            parseInt(stepGoal) || 8000
        );
    }

    // Obtener estadísticas completas
    @Get('full-stats')
    async getFullStats(
        @Query('start') start: string,
        @Query('end') end: string,
        @Query('calorieLimit') calorieLimit: string,
        @Query('stepGoal') stepGoal: string,
    ) {
        return this.dailyLogService.getFullStats(
            start,
            end,
            parseInt(calorieLimit) || 2000,
            parseInt(stepGoal) || 8000
        );
    }
}