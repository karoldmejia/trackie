import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { WorkoutService } from '../services/workout.service';
import { RegisterWorkoutExecutionDto } from '../dtos/workout.dto';

@Controller('workout-executions')
export class WorkoutExecutionController {
    constructor(private readonly workoutService: WorkoutService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterWorkoutExecutionDto) {
        const execution = await this.workoutService.registerExecution(dto);
        return this.workoutService.toExecutionResponse(execution);
    }

    @Get()
    async findAll(
        @Query('date') date?: string,
        @Query('start') start?: string,
        @Query('end') end?: string,
    ) {
        const executions = await this.workoutService.findExecutions(date, start, end);
        return executions.map((execution) => this.workoutService.toExecutionResponse(execution));
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        const execution = await this.workoutService.findExecutionById(id);
        return this.workoutService.toExecutionResponse(execution);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        await this.workoutService.removeExecution(id);
    }
}
