import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { MetricBlockType } from '../enums/metric-block-type.enum';

// ---------------------------------------------------------------------------
// Routines (catálogo)
// ---------------------------------------------------------------------------
export class CreateWorkoutRoutineDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateWorkoutRoutineDto extends PartialType(CreateWorkoutRoutineDto) {}

// ---------------------------------------------------------------------------
// Workout templates (catálogo)
// ---------------------------------------------------------------------------
export class CreateWorkoutTemplateDto {
    @IsUUID()
    routineId: string;

    @IsString()
    @MaxLength(255)
    name: string;

    @IsString()
    @MaxLength(50)
    type: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;
}

export class UpdateWorkoutTemplateDto extends PartialType(CreateWorkoutTemplateDto) {}

// ---------------------------------------------------------------------------
// Block templates (catálogo)
// ---------------------------------------------------------------------------
export class CreateWorkoutBlockTemplateDto {
    @IsUUID()
    workoutId: string;

    @IsString()
    @MaxLength(50)
    kind: string;

    @IsString()
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    rounds?: number;

    @IsEnum(MetricBlockType)
    metricType: MetricBlockType;

    @IsOptional()
    @IsNumber()
    @Min(0)
    targetDistanceMeters?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    targetDurationSeconds?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    targetReps?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;
}

export class UpdateWorkoutBlockTemplateDto extends PartialType(CreateWorkoutBlockTemplateDto) {}

// ---------------------------------------------------------------------------
// Program ↔ Routine
// ---------------------------------------------------------------------------
export class CreateProgramRoutineDto {
    @IsUUID()
    routineId: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;
}

// ---------------------------------------------------------------------------
// Registrar ejecución de un workout
// ---------------------------------------------------------------------------
export class WorkoutBlockExecutionInputDto {
    /** Si viene, se toman los snapshots/targets del block template. */
    @IsOptional()
    @IsUUID()
    templateId?: string;

    /** Block ad-hoc: kind/name/metricType requeridos si no viene templateId. */
    @IsOptional()
    @IsString()
    @MaxLength(50)
    kind?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsEnum(MetricBlockType)
    metricType?: MetricBlockType;

    @IsOptional()
    @IsInt()
    @Min(0)
    plannedRounds?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    actualRounds?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    targetDistanceMeters?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    actualDistanceMeters?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    targetDurationSeconds?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    actualDurationSeconds?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    targetReps?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    actualReps?: number;

    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}

export class RegisterWorkoutExecutionDto {
    @IsDateString()
    date: string; // YYYY-MM-DD

    @IsOptional()
    @IsUUID()
    routineId?: string;

    @IsOptional()
    @IsUUID()
    workoutId?: string;

    /** Requerido si no viene workoutId (snapshots históricos). */
    @IsOptional()
    @IsString()
    @MaxLength(255)
    workoutNameSnapshot?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    workoutTypeSnapshot?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkoutBlockExecutionInputDto)
    blocks?: WorkoutBlockExecutionInputDto[];
}
