import { IsDateString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePlannedMealDto } from './planned-meal.dto';

export class CreateDayPlanDto {
    @IsDateString()
    date: string; // YYYY-MM-DD

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePlannedMealDto)
    plannedMeals?: CreatePlannedMealDto[];
}