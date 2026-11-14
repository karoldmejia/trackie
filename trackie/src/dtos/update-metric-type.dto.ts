import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { MetricTypeUnit } from '../enums/metric-type-unit.enum';

export class UpdateMetricTypeDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    label?: string;

    @IsOptional()
    @IsEnum(MetricTypeUnit)
    unit?: MetricTypeUnit;

    @IsOptional()
    @IsBoolean()
    isUniversal?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}