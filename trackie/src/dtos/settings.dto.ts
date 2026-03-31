import { IsInt, Min, IsOptional, IsNumber } from 'class-validator';

export class UpdateSettingsDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  weekStartDay?: number; // 0=domingo .. 6=sábado

  @IsInt()
  @Min(0)
  @IsOptional()
  calorieLimit?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stepsLimit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  targetWeight?: number;
}