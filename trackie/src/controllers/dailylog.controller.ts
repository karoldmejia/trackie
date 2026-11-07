import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CreateDailyLogDto } from '../dtos/dailylog.dto';
import { DailyLogService, DailyLogResponse } from '../services/dailylog.service';
import { MetricService } from '../services/metric.service';
import { MetricType } from '../entities/metric-type.entity';

@Controller('daily-logs')
export class DailyLogController {
    constructor(
        private readonly dailyLogService: DailyLogService,
        private readonly metricService: MetricService,
    ) { }

    // Crear/actualizar un registro diario (upsert)
    @Post()
    async create(@Body() dto: CreateDailyLogDto) {
        return this.dailyLogService.create(dto);
    }

    // Upsert: actualizar o crear
    @Put()
    async upsert(@Body() dto: CreateDailyLogDto) {
        return this.dailyLogService.upsert(dto);
    }

    // Esquema del formulario: métricas universales + las del programa activo (o ?programId=)
    @Get('form-schema')
    async getFormSchema(@Query('programId') programId?: string) {
        const { metrics, availableToAdd } = await this.metricService.getFormSchema(programId);
        return {
            metrics: metrics.map((m: MetricType) => this.toMetricResponse(m)),
            availableToAdd: availableToAdd.map((m: MetricType) => this.toMetricResponse(m)),
        };
    }

    @Get()
    async findAll(
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        if (limit === undefined && offset === undefined) {
            const logs = await this.dailyLogService.findAll();
            return logs.map((log) => this.dailyLogService.toResponse(log));
        }

        const take = Math.min(parseInt(limit ?? '15', 10) || 15, 100);
        const skip = Math.max(parseInt(offset ?? '0', 10) || 0, 0);
        const { items, total, hasMore } = await this.dailyLogService.findPaginated(skip, take);
        return {
            items: items.map((log) => this.dailyLogService.toResponse(log)),
            total,
            hasMore,
        };
    }

    // Obtener registro por fecha
    @Get('date/:date')
    async findByDate(@Param('date') date: string) {
        const log = await this.dailyLogService.findByDate(date);
        return log ? this.dailyLogService.toResponse(log) : null;
    }

    // Obtener registros por rango de fechas
    @Get('range')
    async findByDateRange(@Query('start') start: string, @Query('end') end: string) {
        const logs = await this.dailyLogService.findByDateRange(start, end);
        return logs.map((log) => this.dailyLogService.toResponse(log));
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
        await this.dailyLogService.delete(id);
        return { deleted: true };
    }

    // Eliminar una métrica concreta del registro y recalcular el ProgramDay
    @Delete(':id/metrics/:metricTypeId')
    async deleteMetric(@Param('id') id: string, @Param('metricTypeId') metricTypeId: string): Promise<{ deleted: boolean }> {
        await this.dailyLogService.deleteMetric(id, metricTypeId);
        return { deleted: true };
    }

    private toMetricResponse(m: MetricType) {
        return {
            key: m.key,
            label: m.label,
            type: m.type,
            unit: m.unit,
            isUniversal: m.isUniversal,
            isDerived: m.isDerived,
            isActive: m.isActive,
        };
    }
}
