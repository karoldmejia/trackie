import { IsBoolean, IsEnum, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { MetricTypeUnit } from '../enums/metric-type-unit.enum';
import { MetricValueType } from '../enums/metric-value-type.enum';

export class CreateMetricTypeDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    key: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    label: string;

    @IsEnum(MetricValueType)
    valueType: MetricValueType;

    @IsOptional()
    @IsEnum(MetricTypeUnit)
    unit?: MetricTypeUnit;

    @IsOptional()
    @IsBoolean()
    isUniversal?: boolean;

    @IsOptional()
    @IsBoolean()
    isDerived?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}