import { IsEnum, IsString, IsArray, IsUUID, IsOptional, ArrayMinSize, IsDateString } from 'class-validator';
import { MealType } from '../enums/meal-type.enum';

export class CreatePlannedMealDto {
    @IsEnum( MealType )
    mealType: MealType;

    @IsString()
    time: string; // Formato HH:mm

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    dishIds?: string[];
}

export class UpdatePlannedMealDto {
    @IsOptional()
    @IsEnum(MealType)
    mealType?: MealType;

    @IsOptional()
    @IsString()
    time?: string; // Formato HH:mm
}
export class AddDishesToPlannedMealDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    dishIds: string[];
}

export class CreatePlannedMealRangeDto {
    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsString()
    time: string;

    @IsEnum(MealType)
    mealType: MealType;

    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    dishIds: string[];
}