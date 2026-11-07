import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { WorkoutService } from '../services/workout.service';
import { CreateWorkoutRoutineDto, UpdateWorkoutRoutineDto } from '../dtos/workout.dto';

@Controller('workout-routines')
export class WorkoutRoutineController {
    constructor(private readonly workoutService: WorkoutService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateWorkoutRoutineDto) {
        return this.workoutService.createRoutine(dto);
    }

    @Get()
    async findAll() {
        return this.workoutService.findAllRoutines();
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.workoutService.findRoutineById(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateWorkoutRoutineDto) {
        return this.workoutService.updateRoutine(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        await this.workoutService.removeRoutine(id);
    }
}
