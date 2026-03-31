import { IsInt, Min, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { WorkoutType } from '../enums/workouttype.enum';

export class CreateDailyLogDto {
    @IsDateString()
    date: string; // YYYY-MM-DD

    @IsInt()
    @Min(0)
    calories: number;

    @IsInt()
    @Min(0)
    steps: number;

    @IsEnum(WorkoutType)
    @IsOptional()
    workout?: WorkoutType;

    @IsInt()
    @Min(0)
    @IsOptional()
    energyDrinks?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    waterLiters?: number;
}

export class UpdateDailyLogDto {

    @IsDateString()
    @IsOptional()
    date: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    calories?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    steps?: number;

    @IsEnum(WorkoutType)
    @IsOptional()
    workout?: WorkoutType;

    @IsInt()
    @Min(0)
    @IsOptional()
    energyDrinks?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    waterLiters?: number;
}