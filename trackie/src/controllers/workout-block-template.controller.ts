import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { WorkoutService } from '../services/workout.service';
import { CreateWorkoutBlockTemplateDto, UpdateWorkoutBlockTemplateDto } from '../dtos/workout.dto';

@Controller('workout-block-templates')
export class WorkoutBlockTemplateController {
    constructor(private readonly workoutService: WorkoutService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateWorkoutBlockTemplateDto) {
        return this.workoutService.createBlockTemplate(dto);
    }

    @Get()
    async findAll(@Query('workoutId') workoutId?: string) {
        return this.workoutService.findAllBlockTemplates(workoutId);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.workoutService.findBlockTemplateById(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateWorkoutBlockTemplateDto) {
        return this.workoutService.updateBlockTemplate(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        await this.workoutService.removeBlockTemplate(id);
    }
}
