import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { MetricTypeUnit } from '../enums/metric-type-unit.enum';
import { MetricValueType } from '../enums/metric-value-type.enum';

/**
 * Upsert de una métrica del catálogo (metric_types).
 * - Con `id`: update parcial (se omite `key`; la key de MetricType es inmutable).
 * - Sin `id`: insert; la key se deriva del label y se valida colisión.
 */
export class UpsertMetricDto {
    @IsOptional()
    @IsUUID()
    id?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    label?: string;

    @IsOptional()
    @IsEnum(MetricValueType)
    type?: MetricValueType;

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
