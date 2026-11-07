import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { WorkoutService } from '../services/workout.service';
import { CreateWorkoutTemplateDto, UpdateWorkoutTemplateDto } from '../dtos/workout.dto';

@Controller('workout-templates')
export class WorkoutTemplateController {
    constructor(private readonly workoutService: WorkoutService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateWorkoutTemplateDto) {
        return this.workoutService.createTemplate(dto);
    }

    @Get()
    async findAll(@Query('routineId') routineId?: string) {
        return this.workoutService.findAllTemplates(routineId);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.workoutService.findTemplateById(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateWorkoutTemplateDto) {
        return this.workoutService.updateTemplate(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        await this.workoutService.removeTemplate(id);
    }
}
