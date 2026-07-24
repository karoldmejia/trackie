import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, NotFoundException, BadRequestException, Logger, } from '@nestjs/common';
import { CutPhaseService } from '../services/cutphase.service';
import { CutPhase } from '../entities/cutphase.entity';
import { CutPhaseDay } from '../entities/cutphaseday.entity';
import { CreateCutPhaseDto, UpdateCutPhaseDto } from '../enums/cutday.dto';

@Controller('cut-phases')
export class CutPhaseController {
    private readonly logger = new Logger(CutPhaseController.name);

    constructor(private readonly cutPhaseService: CutPhaseService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateCutPhaseDto): Promise<CutPhase> {
        try {
            this.logger.log(`Creando nueva cut phase con fechas: ${dto.startDate} - ${dto.endDate}`);
            return await this.cutPhaseService.create(dto);
        } catch (error) {
            this.handleError(error, `Error al crear cut phase`);

        }
    }

    @Get()
    async findAll(): Promise<CutPhase[]> {
        this.logger.log('Obteniendo todas las cut phases');
        return await this.cutPhaseService.findAll();
    }

    @Get('active')
    async findActive(): Promise<CutPhase | null> {
        this.logger.log('Obteniendo cut phase activa');
        return await this.cutPhaseService.findActive();
    }

    @Get(':id')
    async findById(@Param('id') id: string): Promise<CutPhase> {
        this.logger.log(`Obteniendo cut phase con ID: ${id}`);
        return await this.cutPhaseService.findById(id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCutPhaseDto,
    ): Promise<CutPhase> {
        try {
            this.logger.log(`Actualizando cut phase con ID: ${id}`);
            return await this.cutPhaseService.update(id, dto);
        } catch (error) {
            this.handleError(error, `Error al actualizar cut phase`);

        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        try {
            this.logger.log(`Eliminando cut phase con ID: ${id}`);
            await this.cutPhaseService.remove(id);
        } catch (error) {
            this.handleError(error, `Error al eliminar cut phase`);

        }
    }

    @Get(':id/dashboard')
    async getDashboard(@Param('id') id: string): Promise<any> {
        this.logger.log(`Obteniendo dashboard para cut phase: ${id}`);
        return await this.cutPhaseService.getDashboard(id);
    }

    @Get(':id/weekly-summary')
    async getWeeklySummary(@Param('id') id: string): Promise<any> {
        this.logger.log(`Obteniendo resumen semanal para cut phase: ${id}`);
        const dashboard = await this.cutPhaseService.getDashboard(id);
        return dashboard.weeklySummary;
    }

    @Get(':id/trends')
    async getTrends(@Param('id') id: string): Promise<any> {
        this.logger.log(`Obteniendo tendencias para cut phase: ${id}`);
        const dashboard = await this.cutPhaseService.getDashboard(id);
        return dashboard.trends;
    }

    @Get(':id/measurements')
    async getMeasurements(@Param('id') id: string): Promise<any> {
        this.logger.log(`Obteniendo mediciones para cut phase: ${id}`);
        const dashboard = await this.cutPhaseService.getDashboard(id);
        return dashboard.measurements;
    }

    @Get(':id/summary')
    async getSummary(@Param('id') id: string): Promise<any> {
        this.logger.log(`Obteniendo resumen para cut phase: ${id}`);
        const dashboard = await this.cutPhaseService.getDashboard(id);
        return {
            cutPhaseId: dashboard.cutPhaseId,
            startDate: dashboard.startDate,
            endDate: dashboard.endDate,
            totalWeeks: dashboard.totalWeeks,
            currentWeek: dashboard.currentWeek,
            targets: dashboard.targets,
            summary: dashboard.summary,
        };
    }

    @Post(':id/sync')
    @HttpCode(HttpStatus.OK)
    async syncAllDays(@Param('id') id: string): Promise<{ message: string }> {
        try {
            this.logger.log(`Sincronizando días para cut phase: ${id}`);
            await this.cutPhaseService.syncAllDays(id);
            return { message: `Días sincronizados exitosamente para la fase ${id}` };
        } catch (error) {
            this.handleError(error, `Error al sincronizar días`);

        }
    }

    @Put(':id/days/:date')
    async updateDayCompliance(
        @Param('id') id: string,
        @Param('date') date: string,
    ): Promise<CutPhaseDay> {
        try {
            this.logger.log(`Actualizando cumplimiento para fecha ${date} en fase ${id}`);
            return await this.cutPhaseService.updateDayCompliance(id, date);
        } catch (error) {
            this.handleError(error, `Error al actualizar día`);

        }
    }

    @Get(':id/days')
    async getDays(@Param('id') id: string): Promise<any[]> {
        this.logger.log(`Obteniendo días para cut phase: ${id}`);
        const dashboard = await this.cutPhaseService.getDashboard(id);
        return dashboard.days;
    }

    @Get(':id/calendar')
    async getCalendar(@Param('id') id: string): Promise<any> {
        this.logger.log(`Obteniendo calendario para cut phase: ${id}`);
        const dashboard = await this.cutPhaseService.getDashboard(id);
        return {
            days: dashboard.days.map((day: any) => ({
                date: day.date,
                weekNumber: day.weekNumber,
                dailyScore: day.dailyScore,
                allMet: day.allMet,
                caloriesMet: day.caloriesMet,
                proteinMet: day.proteinMet,
                stepsMet: day.stepsMet,
                waterMet: day.waterMet,
                workoutMet: day.workoutMet,
                // Datos reales para mostrar
                calories: day.calories,
                protein: day.protein,
                steps: day.steps,
                water: day.water,
                workout: day.workout,
            })),
        };
    }

    @Get(':id/stats')
    async getStats(@Param('id') id: string): Promise<any> {
        this.logger.log(`Obteniendo estadísticas para cut phase: ${id}`);
        const dashboard = await this.cutPhaseService.getDashboard(id);
        const daysWithData = dashboard.days.filter((d: any) => d.dailyScore > 0);
        const scores = daysWithData.map((d: any) => d.dailyScore);

        return {
            totalDays: dashboard.summary.totalDays,
            daysWithData: daysWithData.length,
            daysWithAllMet: dashboard.summary.daysWithAllMet,
            compliancePercentage: dashboard.summary.compliancePercentage,
            averageScore: dashboard.summary.averageScore,
            bestScore: scores.length > 0 ? Math.max(...scores) : 0,
            worstScore: scores.length > 0 ? Math.min(...scores) : 0,
            currentWeek: dashboard.currentWeek,
            totalWeeks: dashboard.totalWeeks,
        };
    }

    @Put(':id/deactivate')
    async deactivate(@Param('id') id: string): Promise<CutPhase> {
        try {
            this.logger.log(`Desactivando cut phase: ${id}`);
            const cutPhase = await this.cutPhaseService.findById(id);
            cutPhase.isActive = false;
            return await this.cutPhaseService.update(id, { isActive: false } as any);
        } catch (error) {
            this.handleError(error, `Error al desactivar cut phase`);
        }
    }

    @Put(':id/activate')
    async activate(@Param('id') id: string): Promise<CutPhase> {
        try {
            this.logger.log(`Activando cut phase: ${id}`);
            // Primero desactivamos todas
            const allPhases = await this.cutPhaseService.findAll();
            for (const phase of allPhases) {
                if (phase.isActive) {
                    await this.cutPhaseService.update(phase.id, { isActive: false } as any);
                }
            }
            // Luego activamos la seleccionada
            const cutPhase = await this.cutPhaseService.findById(id);
            cutPhase.isActive = true;
            return await this.cutPhaseService.update(id, { isActive: true } as any);
        } catch (error) {
            this.handleError(error, `Error al activar cut phase`);
        }
    }

    private handleError(error: unknown, context: string): never {
        if (error instanceof Error) {
            this.logger.error(`${context}: ${error.message}`);
            throw error;
        }

        if (typeof error === 'string') {
            this.logger.error(`${context}: ${error}`);
            throw new Error(error);
        }

        this.logger.error(`${context}: Error desconocido`, error);
        throw new Error('Error desconocido');
    }
}