import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { WorkoutService } from '../services/workout.service';
import { CreateProgramRoutineDto } from '../dtos/workout.dto';

@Controller('programs/:programId/routines')
export class ProgramRoutineController {
    constructor(private readonly workoutService: WorkoutService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async assign(@Param('programId') programId: string, @Body() dto: CreateProgramRoutineDto) {
        return this.workoutService.assignRoutineToProgram(programId, dto);
    }

    @Get()
    async list(@Param('programId') programId: string) {
        return this.workoutService.listProgramRoutines(programId);
    }

    @Delete(':routineId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('programId') programId: string,
        @Param('routineId') routineId: string,
    ): Promise<void> {
        await this.workoutService.removeRoutineFromProgram(programId, routineId);
    }
}
