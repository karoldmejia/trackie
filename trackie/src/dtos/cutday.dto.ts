import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsNumber, IsInt, Min, Max, IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreateCutPhaseDto {
    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsInt()
    @Min(1)
    totalWeeks: number;

    @IsNumber()
    @Min(0)
    targetCalories: number;

    @IsNumber()
    @Min(0)
    targetProtein: number;

    @IsInt()
    @Min(0)
    targetSteps: number;

    @IsInt()
    @Min(0)
    weeklyTargetSteps: number;

    @IsNumber()
    @Min(0)
    targetWater: number;

    @IsInt()
    @Min(0)
    workoutsPerWeek: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    initialWeight?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    initialWaist?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    initialHips?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    initialBodyfat?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateCutPhaseDto extends PartialType(CreateCutPhaseDto) {}