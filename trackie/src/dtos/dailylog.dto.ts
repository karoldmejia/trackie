import { IsDateString, IsObject } from 'class-validator';

/**
 * DTO de escritura de un DailyLog.
 * El modelo es dinámico: las métricas viajan como un mapa { metricKey: valor }.
 * Las claves se validan contra el catálogo (metric_types) en el servicio.
 */
export class CreateDailyLogDto {
    @IsDateString()
    date: string; // YYYY-MM-DD

    @IsObject()
    metrics: Record<string, number | boolean>;
}
