
import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsNumber, IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class CreateCutDayDto {
    @IsDateString()
    date: string;

    @IsNumber()
    @Min(0)
    calories: number;

    @IsNumber()
    @Min(0)
    protein: number;

    @IsInt()
    @Min(0)
    steps: number;

    @IsNumber()
    @Min(0)
    water: number;

    @IsBoolean()
    workoutDone: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    weight?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    waist?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    hips?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    bodyfat?: number;

    @IsOptional()
    cutPhaseId?: string;
}

export class UpdateCutDayDto extends PartialType(CreateCutDayDto) {}