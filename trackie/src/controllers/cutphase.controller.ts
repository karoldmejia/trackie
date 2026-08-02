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
        this.logger.log('POST /cut-phases - Request received');
        this.logger.log(`Request body: ${JSON.stringify(dto, null, 2)}`);

        try {
            this.logger.log(`Creating cut phase with dates: ${dto.startDate} - ${dto.endDate}`);
            const result = await this.cutPhaseService.create(dto);
            this.logger.log(`Cut phase created successfully with ID: ${result.id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error creating cut phase: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (error instanceof Error) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            this.handleError(error, 'Error al crear cut phase');
        }
    }

    @Get()
    async findAll(): Promise<CutPhase[]> {
        this.logger.log('GET /cut-phases - Request received');
        try {
            const result = await this.cutPhaseService.findAll();
            this.logger.log(`GET /cut-phases - Returning ${result.length} phases`);
            return result;
        } catch (error) {
            this.logger.error(`Error fetching all phases: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    @Get('active')
    async findActive(): Promise<CutPhase | null> {
        this.logger.log('GET /cut-phases/active - Request received');
        try {
            const result = await this.cutPhaseService.findActive();
            this.logger.log(`Active phase found: ${result ? result.id : 'none'}`);
            return result;
        } catch (error) {
            this.logger.error(`Error fetching active phase: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    @Get(':id')
    async findById(@Param('id') id: string): Promise<CutPhase> {
        this.logger.log(`GET /cut-phases/${id} - Request received`);
        try {
            const result = await this.cutPhaseService.findById(id);
            this.logger.log(`Phase found: ${result.id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error fetching phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCutPhaseDto,
    ): Promise<CutPhase> {
        this.logger.log(`PUT /cut-phases/${id} - Request received`);
        this.logger.log(`Update data: ${JSON.stringify(dto)}`);

        try {
            this.logger.log(`Updating cut phase ${id}`);
            const result = await this.cutPhaseService.update(id, dto);
            this.logger.log(`Cut phase ${id} updated successfully`);
            return result;
        } catch (error) {
            this.logger.error(`Error updating phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (error instanceof Error) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            this.handleError(error, `Error al actualizar cut phase`);
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        this.logger.log(`DELETE /cut-phases/${id} - Request received`);
        try {
            this.logger.log(`Removing cut phase ${id}`);
            await this.cutPhaseService.remove(id);
            this.logger.log(`Cut phase ${id} removed successfully`);
        } catch (error) {
            this.logger.error(`Error removing phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (error instanceof Error) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            this.handleError(error, `Error al eliminar cut phase`);
        }
    }

    @Get(':id/dashboard')
    async getDashboard(@Param('id') id: string): Promise<any> {
        this.logger.log(`GET /cut-phases/${id}/dashboard - Request received`);
        try {
            this.logger.log(`Fetching dashboard for phase ${id}`);
            const result = await this.cutPhaseService.getDashboard(id);
            this.logger.log(`Dashboard for phase ${id} fetched successfully`);
            return result;
        } catch (error) {
            this.logger.error(`Error fetching dashboard for phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (error instanceof Error) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            throw error;
        }
    }

    @Get(':id/weekly-summary')
    async getWeeklySummary(@Param('id') id: string): Promise<any> {
        this.logger.log(`GET /cut-phases/${id}/weekly-summary - Request received`);
        try {
            const dashboard = await this.cutPhaseService.getDashboard(id);
            this.logger.log(`Weekly summary for phase ${id} fetched successfully`);
            return dashboard.weeklySummary;
        } catch (error) {
            this.logger.error(`Error fetching weekly summary for phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    @Get(':id/trends')
    async getTrends(@Param('id') id: string): Promise<any> {
        this.logger.log(`GET /cut-phases/${id}/trends - Request received`);
        try {
            const dashboard = await this.cutPhaseService.getDashboard(id);
            this.logger.log(`Trends for phase ${id} fetched successfully`);
            return dashboard.trends;
        } catch (error) {
            this.logger.error(`Error fetching trends for phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    @Get(':id/measurements')
    async getMeasurements(@Param('id') id: string): Promise<any> {
        this.logger.log(`GET /cut-phases/${id}/measurements - Request received`);
        try {
            const dashboard = await this.cutPhaseService.getDashboard(id);
            this.logger.log(`Measurements for phase ${id} fetched successfully`);
            return dashboard.measurements;
        } catch (error) {
            this.logger.error(`Error fetching measurements for phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    @Get(':id/summary')
    async getSummary(@Param('id') id: string): Promise<any> {
        this.logger.log(`GET /cut-phases/${id}/summary - Request received`);
        try {
            const dashboard = await this.cutPhaseService.getDashboard(id);
            this.logger.log(`Summary for phase ${id} fetched successfully`);
            return {
                cutPhaseId: dashboard.cutPhaseId,
                startDate: dashboard.startDate,
                endDate: dashboard.endDate,
                totalWeeks: dashboard.totalWeeks,
                currentWeek: dashboard.currentWeek,
                targets: dashboard.targets,
                summary: dashboard.summary,
            };
        } catch (error) {
            this.logger.error(`Error fetching summary for phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    @Post(':id/sync')
    @HttpCode(HttpStatus.OK)
    async syncAllDays(@Param('id') id: string): Promise<{ message: string }> {
        this.logger.log(`POST /cut-phases/${id}/sync - Request received`);
        try {
            this.logger.log(`Syncing all days for phase ${id}`);
            await this.cutPhaseService.syncAllDays(id);
            this.logger.log(`Days synced successfully for phase ${id}`);
            return { message: `Días sincronizados exitosamente para la fase ${id}` };
        } catch (error) {
            this.logger.error(`Error syncing days for phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (error instanceof Error) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            this.handleError(error, `Error al sincronizar días`);
        }
    }

    @Put(':id/days/:date')
    async updateDayCompliance(
        @Param('id') id: string,
        @Param('date') date: string,
    ): Promise<CutPhaseDay> {
        this.logger.log(`PUT /cut-phases/${id}/days/${date} - Request received`);
        try {
            this.logger.log(`Updating day compliance for phase ${id}, date ${date}`);
            const result = await this.cutPhaseService.updateDayCompliance(id, date);
            this.logger.log(`Day compliance updated for phase ${id}, date ${date}`);
            return result;
        } catch (error) {
            this.logger.error(`Error updating day compliance for phase ${id}, date ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (error instanceof Error) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            this.handleError(error, `Error al actualizar día`);
        }
    }

    @Get(':id/days')
    async getDays(@Param('id') id: string): Promise<any[]> {
        this.logger.log(`GET /cut-phases/${id}/days - Request received`);
        try {
            const dashboard = await this.cutPhaseService.getDashboard(id);
            this.logger.log(`Days for phase ${id} fetched successfully`);
            return dashboard.days;
        } catch (error) {
            this.logger.error(`Error fetching days for phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    @Get(':id/calendar')
    async getCalendar(@Param('id') id: string): Promise<any> {
        this.logger.log(`GET /cut-phases/${id}/calendar - Request received`);
        try {
            const dashboard = await this.cutPhaseService.getDashboard(id);
            this.logger.log(`Calendar for phase ${id} fetched successfully`);
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
                    calories: day.calories,
                    protein: day.protein,
                    steps: day.steps,
                    water: day.water,
                    workout: day.workout,
                })),
            };
        } catch (error) {
            this.logger.error(`Error fetching calendar for phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    @Get(':id/stats')
    async getStats(@Param('id') id: string): Promise<any> {
        this.logger.log(`GET /cut-phases/${id}/stats - Request received`);
        try {
            const dashboard = await this.cutPhaseService.getDashboard(id);
            const daysWithData = dashboard.days.filter((d: any) => d.dailyScore > 0);
            const scores = daysWithData.map((d: any) => d.dailyScore);

            const result = {
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

            this.logger.log(`Stats for phase ${id} fetched successfully`);
            return result;
        } catch (error) {
            this.logger.error(`Error fetching stats for phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    @Put(':id/deactivate')
    async deactivate(@Param('id') id: string): Promise<CutPhase> {
        this.logger.log(`PUT /cut-phases/${id}/deactivate - Request received`);
        try {
            this.logger.log(`Deactivating phase ${id}`);
            const cutPhase = await this.cutPhaseService.findById(id);
            cutPhase.isActive = false;
            const result = await this.cutPhaseService.update(id, { isActive: false } as any);
            this.logger.log(`Phase ${id} deactivated successfully`);
            return result;
        } catch (error) {
            this.logger.error(`Error deactivating phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (error instanceof Error) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            this.handleError(error, `Error al desactivar cut phase`);
        }
    }

    @Put(':id/activate')
    async activate(@Param('id') id: string): Promise<CutPhase> {
        this.logger.log(`PUT /cut-phases/${id}/activate - Request received`);
        try {
            this.logger.log(`Activating phase ${id}`);

            // Desactivar todas las fases
            this.logger.log('Finding all phases to deactivate active ones');
            const allPhases = await this.cutPhaseService.findAll();
            for (const phase of allPhases) {
                if (phase.isActive) {
                    this.logger.log(`Deactivating phase ${phase.id}`);
                    await this.cutPhaseService.update(phase.id, { isActive: false } as any);
                }
            }

            // Activar la seleccionada
            this.logger.log(`Activating phase ${id}`);
            const cutPhase = await this.cutPhaseService.findById(id);
            cutPhase.isActive = true;
            const result = await this.cutPhaseService.update(id, { isActive: true } as any);

            this.logger.log(`Phase ${id} activated successfully`);
            return result;
        } catch (error) {
            this.logger.error(`Error activating phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (error instanceof Error) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            this.handleError(error, `Error al activar cut phase`);
        }
    }

@Get(':id/streaks')
async getStreaks(@Param('id') id: string): Promise<any> {
    this.logger.log(`GET /cut-phases/${id}/streaks - Request received`);
    try {
        const result = await this.cutPhaseService.getStreaks(id);
        this.logger.log(`Streaks for phase ${id}: current=${result.currentStreak}, best=${result.bestStreak}`);
        return result;
    } catch (error) {
        this.logger.error(`Error fetching streaks for phase ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
}
    private handleError(error: unknown, context: string): never {
        if (error instanceof Error) {
            this.logger.error(`${context}: ${error.message}`);
            this.logger.error(`Stack trace: ${error.stack}`);
            throw error;
        }

        if (typeof error === 'string') {
            this.logger.error(`${context}: ${error}`);
            throw new Error(error);
        }

        this.logger.error(`${context}: Unknown error`);
        this.logger.error(`Error object: ${JSON.stringify(error)}`);
        throw new Error('Error desconocido');
    }
}