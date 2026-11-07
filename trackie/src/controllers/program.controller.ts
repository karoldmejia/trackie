import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, HttpCode, Logger } from '@nestjs/common';
import { ProgramService } from '../services/program.service';
import { Program } from '../entities/program.entity';
import { ProgramDay } from '../entities/program-day.entity';
import { CreateProgramDto, UpdateProgramDto } from '../dtos/program.dto';

@Controller('programs')
export class ProgramController {
    private readonly logger = new Logger(ProgramController.name);

    constructor(private readonly programService: ProgramService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateProgramDto): Promise<Program> {
        this.logger.log(`POST /programs - Creating program: ${dto.name}`);
        return this.programService.create(dto);
    }

    @Get()
    async findAll(): Promise<Program[]> {
        return this.programService.findAll();
    }

    @Get('active')
    async findActive(): Promise<Program | null> {
        return this.programService.findActive();
    }

    @Get(':id')
    async findById(@Param('id') id: string): Promise<Program> {
        return this.programService.findById(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateProgramDto): Promise<Program> {
        return this.programService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        await this.programService.remove(id);
    }

    @Put(':id/activate')
    async activate(@Param('id') id: string): Promise<Program> {
        // Desactivar todos y activar el seleccionado (misma semántica que antes)
        const all = await this.programService.findAll();
        for (const program of all) {
            if (program.isActive) {
                await this.programService.update(program.id, { isActive: false } as UpdateProgramDto);
            }
        }
        return this.programService.update(id, { isActive: true } as UpdateProgramDto);
    }

    @Put(':id/deactivate')
    async deactivate(@Param('id') id: string): Promise<Program> {
        return this.programService.update(id, { isActive: false } as UpdateProgramDto);
    }

    @Get(':id/dashboard')
    async getDashboard(@Param('id') id: string): Promise<any> {
        return this.programService.getDashboard(id);
    }

    @Get(':id/weekly-summary')
    async getWeeklySummary(@Param('id') id: string): Promise<any> {
        const dashboard = await this.programService.getDashboard(id);
        return dashboard.weeklySummary;
    }

    @Get(':id/trends')
    async getTrends(@Param('id') id: string): Promise<any> {
        const dashboard = await this.programService.getDashboard(id);
        return dashboard.trends;
    }

    @Get(':id/measurements')
    async getMeasurements(@Param('id') id: string): Promise<any> {
        const dashboard = await this.programService.getDashboard(id);
        return dashboard.measurements;
    }

    @Get(':id/summary')
    async getSummary(@Param('id') id: string): Promise<any> {
        const dashboard = await this.programService.getDashboard(id);
        return {
            program: dashboard.program,
            targets: dashboard.targets,
            summary: dashboard.summary,
        };
    }

    @Post(':id/sync')
    @HttpCode(HttpStatus.OK)
    async syncAllDays(@Param('id') id: string): Promise<{ message: string }> {
        await this.programService.syncProgramDaysForProgram(id);
        return { message: `Días sincronizados exitosamente para el programa ${id}` };
    }

    @Put(':id/days/:date')
    async updateDayCompliance(
        @Param('id') id: string,
        @Param('date') date: string,
    ): Promise<ProgramDay> {
        return this.programService.updateDayCompliance(id, date);
    }

    @Get(':id/days')
    async getDays(@Param('id') id: string): Promise<any[]> {
        const dashboard = await this.programService.getDashboard(id);
        return dashboard.days;
    }

    @Get(':id/calendar')
    async getCalendar(@Param('id') id: string): Promise<any> {
        const dashboard = await this.programService.getDashboard(id);
        return {
            days: dashboard.days.map((day: any) => ({
                date: day.date,
                weekNumber: day.weekNumber,
                dailyScore: day.dailyScore,
                allMet: day.allMet,
                metricResults: day.metricResults,
            })),
        };
    }

    @Get(':id/stats')
    async getStats(@Param('id') id: string): Promise<any> {
        const dashboard = await this.programService.getDashboard(id);
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
            currentWeek: dashboard.program.currentWeek,
            totalWeeks: dashboard.program.totalWeeks,
        };
    }

    @Get(':id/streaks')
    async getStreaks(@Param('id') id: string): Promise<any> {
        return this.programService.getStreaks(id);
    }
}
