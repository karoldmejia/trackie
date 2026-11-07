import { IsDateString, IsObject, IsOptional, IsString, IsArray } from 'class-validator';

/**
 * DTO de escritura de un WeightLog.
 * Las mediciones corporales viajan como un mapa { bodyMetricKey: valor }
 * validado contra el catálogo body_metric_types en el servicio.
 */
export class CreateWeightLogDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsObject()
  metrics?: Record<string, number>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

export class UpdateWeightLogDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsObject()
  metrics?: Record<string, number>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsArray()
  photosToDelete?: string[];
}
