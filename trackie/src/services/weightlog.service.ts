import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWeightLogDto, UpdateWeightLogDto } from '../dtos/weightlog.dto';
import { Repository, Between } from 'typeorm';
import { WeightLog } from '../entities/weightlog.entity';
import { WeightLogMetric } from '../entities/weight-log-metric.entity';
import { BodyMetricType } from '../entities/body-metric-type.entity';
import { UploadService } from './upload.service';
import { ProgramService } from './program.service';

export interface WeightStats {
    max: {
        weight: number;
        bodyfat: number;
        hips: number;
        waist: number;
        date: string;
    };
    min: {
        weight: number;
        bodyfat: number;
        hips: number;
        waist: number;
        date: string;
    };
    average: {
        weight: number;
        bodyfat: number;
        hips: number;
        waist: number;
    };
    total: {
        weight: number;
        bodyfat: number;
        hips: number;
        waist: number;
    };
    count: number;
    startDate: string;
    endDate: string;
}

export interface WeightTrend {
    weight: {
        start: number;
        end: number;
        change: number;
        percentage: number;
        direction: 'up' | 'down' | 'stable';
    };
    bodyfat: {
        start: number;
        end: number;
        change: number;
        percentage: number;
        direction: 'up' | 'down' | 'stable';
    };
    hips: {
        start: number;
        end: number;
        change: number;
        percentage: number;
        direction: 'up' | 'down' | 'stable';
    };
    waist: {
        start: number;
        end: number;
        change: number;
        percentage: number;
        direction: 'up' | 'down' | 'stable';
    };
}

@Injectable()
export class WeightLogService {
    private readonly logger = new Logger(WeightLogService.name);

    constructor(
        @InjectRepository(WeightLog)
        private readonly weightLogRepo: Repository<WeightLog>,
        @InjectRepository(WeightLogMetric)
        private readonly weightLogMetricRepo: Repository<WeightLogMetric>,
        @InjectRepository(BodyMetricType)
        private readonly bodyMetricTypeRepo: Repository<BodyMetricType>,
        private readonly uploadService: UploadService,
        private readonly programService: ProgramService,
    ) { }

    private readonly relations = { metrics: { bodyMetricType: true } } as const;

    /**
     * Valida las métricas contra el catálogo body_metric_types:
     * - key inexistente o inactiva -> 400
     * - valor no finito o negativo -> 400
     * Devuelve filas listas para upsert.
     */
    validateAndNormalize(
        metrics: Record<string, unknown> | undefined,
        catalog: BodyMetricType[],
    ): Array<{ bodyMetricTypeId: string; value: number }> {
        const byKey = new Map(catalog.map((m) => [m.key, m]));
        const unknown: string[] = [];
        const inactive: string[] = [];
        const normalized: Array<{ bodyMetricTypeId: string; value: number }> = [];

        for (const [rawKey, rawValue] of Object.entries(metrics ?? {})) {
            const key = rawKey.trim().toLowerCase();
            const metric = byKey.get(key);
            if (!metric) {
                unknown.push(rawKey);
                continue;
            }
            if (!metric.isActive) {
                inactive.push(key);
                continue;
            }

            const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
            if (!Number.isFinite(value) || value < 0) {
                throw new BadRequestException(`La métrica "${key}" debe ser un número finito >= 0`);
            }
            normalized.push({ bodyMetricTypeId: metric.id, value });
        }

        if (unknown.length) {
            throw new BadRequestException(`Métricas corporales desconocidas: ${unknown.join(', ')}`);
        }
        if (inactive.length) {
            throw new BadRequestException(`Métricas corporales inactivas: ${inactive.join(', ')}`);
        }

        return normalized;
    }

    /** Upsert masivo de las métricas del log (ON CONFLICT weightLogId, bodyMetricTypeId). */
    private async upsertMetrics(logId: string, metrics: Record<string, unknown> | undefined): Promise<void> {
        if (!metrics) return;

        const catalog = await this.bodyMetricTypeRepo.find();
        const rows = this.validateAndNormalize(metrics, catalog);
        if (rows.length === 0) return;

        const valuesSql: string[] = [];
        const params: unknown[] = [logId];
        rows.forEach((row, i) => {
            const base = params.length + 1;
            valuesSql.push(`($1, $${base}, $${base + 1})`);
            params.push(row.bodyMetricTypeId, row.value);
        });
        await this.weightLogMetricRepo.query(
            `INSERT INTO weight_log_metrics ("weightLogId", "bodyMetricTypeId", "value")
             VALUES ${valuesSql.join(', ')}
             ON CONFLICT ("weightLogId", "bodyMetricTypeId") DO UPDATE SET value = EXCLUDED.value`,
            params,
        );
    }

    /** Recalcula las snapshots first/last del programa activo. No fatal. */
    private async recalculateProgramMeasurements(): Promise<void> {
        try {
            const active = await this.programService.findActive();
            if (!active) {
                this.logger.log('No hay programa activo; no se recalculan measurements');
                return;
            }
            await this.programService.recalculateMeasurementsForProgram(active.id);
        } catch (error) {
            this.logger.error(`Error recalculando measurements del programa activo: ${error}`);
        }
    }

    private async finishSave(saved: WeightLog, dto: Partial<CreateWeightLogDto & UpdateWeightLogDto>): Promise<WeightLog> {
        await this.upsertMetrics(saved.id, dto.metrics as Record<string, number> | undefined);
        // Fase 5: mantener las snapshots first/last del programa activo
        await this.recalculateProgramMeasurements();
        return (await this.findByDate(saved.date)) as WeightLog;
    }

    /** Mapa { key: value } de las métricas del log (vacío si no están cargadas). */
    private metricValuesOf(log: WeightLog): Record<string, number> {
        const out: Record<string, number> = {};
        for (const m of log.metrics ?? []) {
            const key = m.bodyMetricType?.key;
            if (key && m.value !== null && m.value !== undefined) {
                out[key] = m.value;
            }
        }
        return out;
    }

    async create(dto: CreateWeightLogDto, photos?: Express.Multer.File[]): Promise<WeightLog> {
        let existing = await this.weightLogRepo.findOne({ where: { date: dto.date } });

        const logData: Partial<WeightLog> = {};

        if (photos && photos.length > 0) {
            const photoUrls = await this.uploadService.savePhotos(photos);

            if (existing && existing.photos && existing.photos.length > 0) {
                logData.photos = [...new Set([...existing.photos, ...photoUrls])];
            } else {
                logData.photos = photoUrls;
            }
        } else if (existing && existing.photos) {
            logData.photos = existing.photos;
        }

        if (existing) {
            Object.assign(existing, logData);
            const result = await this.weightLogRepo.save(existing);
            return this.finishSave(result, dto);
        } else {
            const log = this.weightLogRepo.create({ ...logData, date: dto.date });
            const result = await this.weightLogRepo.save(log);
            return this.finishSave(result, dto);
        }
    }

    private isBase64Photo(photo: any): boolean {
        if (typeof photo === 'string' && photo.startsWith('data:image')) {
            return true;
        }
        return false;
    }

    async upsert(dto: CreateWeightLogDto, photos?: Express.Multer.File[], photosToDelete?: string[]): Promise<WeightLog> {
        this.logger.log(`Upsert para fecha: ${dto.date}`);

        let existing = await this.weightLogRepo.findOne({ where: { date: dto.date } });

        // Procesar fotos para eliminar
        if (photosToDelete && photosToDelete.length > 0 && existing && existing.photos) {
            const remainingPhotos = existing.photos.filter(photo => !photosToDelete.includes(photo));
            existing.photos = remainingPhotos;
            await this.uploadService.deleteMultiplePhotos(photosToDelete);
            this.logger.log(`Eliminadas ${photosToDelete.length} fotos`);
        }

        // Procesar fotos nuevas
        if (photos && photos.length > 0) {
            // Separar fotos normales de base64
            const normalFiles: Express.Multer.File[] = [];
            const base64Files: string[] = [];

            for (const photo of photos) {
                if (this.isBase64Photo(photo)) {
                    base64Files.push(photo as any);
                } else {
                    normalFiles.push(photo);
                }
            }

            let newPhotoUrls: string[] = [];

            // Procesar archivos normales
            if (normalFiles.length > 0) {
                const normalUrls = await this.uploadService.savePhotos(normalFiles);
                newPhotoUrls.push(...normalUrls);
                this.logger.log(`Guardadas ${normalFiles.length} fotos normales`);
            }

            // Procesar base64
            if (base64Files.length > 0) {
                const base64Urls = await this.uploadService.savePhotosFromBase64(base64Files);
                newPhotoUrls.push(...base64Urls);
                this.logger.log(`Guardadas ${base64Files.length} fotos desde base64`);
            }

            if (existing) {
                dto.photos = [...(existing.photos || []), ...newPhotoUrls];
            } else {
                dto.photos = newPhotoUrls;
            }
        }

        if (existing) {
            if (dto.photos !== undefined) {
                existing.photos = dto.photos;
            }
            this.logger.log(`Actualizando registro existente`);
            const saved = await this.weightLogRepo.save(existing);
            return this.finishSave(saved, dto);
        } else {
            const log = this.weightLogRepo.create({ date: dto.date, photos: dto.photos });
            this.logger.log(`Creando nuevo registro`);
            const saved = await this.weightLogRepo.save(log);
            return this.finishSave(saved, dto);
        }
    }

    async findLast(): Promise<WeightLog | null> {
        const result = await this.weightLogRepo.findOne({
            where: {},
            order: { date: 'DESC' },
            relations: this.relations,
        });
        return result;
    }

    /**
     * Actualizar registro existente por ID
     */
    async update(id: string, dto: UpdateWeightLogDto, newPhotos?: Express.Multer.File[], photosToDelete?: string[]): Promise<WeightLog> {
        const log = await this.weightLogRepo.findOne({ where: { id } });
        if (!log) throw new Error('Registro no encontrado');

        if (photosToDelete && photosToDelete.length > 0) {
            await this.uploadService.deleteMultiplePhotos(photosToDelete);

            const currentPhotos = log.photos || [];
            log.photos = currentPhotos.filter(photo => !photosToDelete.includes(photo));
        }

        if (newPhotos && newPhotos.length > 0) {
            const newPhotoUrls = await this.uploadService.savePhotos(newPhotos);
            log.photos = [...(log.photos || []), ...newPhotoUrls];
        }

        if (dto.photos !== undefined) {
            log.photos = dto.photos;
        }
        const saved = await this.weightLogRepo.save(log);
        return this.finishSave(saved, dto);
    }

    /**
     * Obtener todos los registros
     */
    async findAll(): Promise<WeightLog[]> {
        const logs = await this.weightLogRepo.find({ order: { date: 'ASC' }, relations: this.relations });
        return logs;
    }

    /**
     * Obtener registros por rango de fechas
     */
    async findByDateRange(start: string, end: string): Promise<WeightLog[]> {
        return this.weightLogRepo.find({
            where: { date: Between(start, end) },
            order: { date: 'ASC' },
            relations: this.relations,
        });
    }

    /**
     * Obtener registro por fecha específica
     */
    async findByDate(date: string): Promise<WeightLog | null> {
        return this.weightLogRepo.findOne({ where: { date }, relations: this.relations });
    }

    /**
     * Obtener estadísticas completas (máximo, mínimo, promedio) por rango de fechas
     */
    async getStats(start: string, end: string): Promise<WeightStats> {
        const logs = await this.findByDateRange(start, end);

        const emptyStats: WeightStats = {
            max: { weight: 0, bodyfat: 0, hips: 0, waist: 0, date: '' },
            min: { weight: 0, bodyfat: 0, hips: 0, waist: 0, date: '' },
            average: { weight: 0, bodyfat: 0, hips: 0, waist: 0 },
            total: { weight: 0, bodyfat: 0, hips: 0, waist: 0 },
            count: 0,
            startDate: start,
            endDate: end,
        };

        if (logs.length === 0) {
            return emptyStats;
        }

        const keys = ['weight', 'bodyfat', 'hips', 'waist'] as const;
        type StatKey = typeof keys[number];

        const stats: Record<StatKey, { max: number; maxDate: string; min: number; minDate: string; total: number; count: number }> = {
            weight: { max: -Infinity, maxDate: '', min: Infinity, minDate: '', total: 0, count: 0 },
            bodyfat: { max: -Infinity, maxDate: '', min: Infinity, minDate: '', total: 0, count: 0 },
            hips: { max: -Infinity, maxDate: '', min: Infinity, minDate: '', total: 0, count: 0 },
            waist: { max: -Infinity, maxDate: '', min: Infinity, minDate: '', total: 0, count: 0 },
        };

        for (const log of logs) {
            const values = this.metricValuesOf(log);
            for (const key of keys) {
                const value = values[key];
                if (value === undefined || value === null) continue;

                const s = stats[key];
                s.total += value;
                s.count++;
                if (value > s.max) {
                    s.max = value;
                    s.maxDate = log.date;
                }
                if (value < s.min) {
                    s.min = value;
                    s.minDate = log.date;
                }
            }
        }

        const maxVal = (key: StatKey) => (stats[key].count > 0 ? stats[key].max : 0);
        const minVal = (key: StatKey) => (stats[key].count > 0 ? stats[key].min : 0);
        const maxDate = (key: StatKey) => (stats[key].count > 0 ? stats[key].maxDate : '');
        const minDate = (key: StatKey) => (stats[key].count > 0 ? stats[key].minDate : '');
        const total = (key: StatKey) => Number(stats[key].total.toFixed(2));
        const average = (key: StatKey) => (stats[key].count > 0 ? Number((stats[key].total / stats[key].count).toFixed(2)) : 0);

        return {
            max: {
                weight: maxVal('weight'),
                bodyfat: maxVal('bodyfat'),
                hips: maxVal('hips'),
                waist: maxVal('waist'),
                date: stats.weight.maxDate || stats.bodyfat.maxDate || stats.hips.maxDate || stats.waist.maxDate || '',
            },
            min: {
                weight: minVal('weight'),
                bodyfat: minVal('bodyfat'),
                hips: minVal('hips'),
                waist: minVal('waist'),
                date: stats.weight.minDate || stats.bodyfat.minDate || stats.hips.minDate || stats.waist.minDate || '',
            },
            average: {
                weight: average('weight'),
                bodyfat: average('bodyfat'),
                hips: average('hips'),
                waist: average('waist'),
            },
            total: {
                weight: total('weight'),
                bodyfat: total('bodyfat'),
                hips: total('hips'),
                waist: total('waist'),
            },
            count: logs.length,
            startDate: start,
            endDate: end,
        };
    }

    /**
     * Eliminar registro por ID
     */
    async remove(id: string): Promise<void> {
        const log = await this.weightLogRepo.findOne({ where: { id } });
        if (log && log.photos && log.photos.length > 0) {
            await this.uploadService.deleteMultiplePhotos(log.photos);
        }
        await this.weightLogRepo.delete(id);
        // Fase 5: mantener las snapshots first/last del programa activo
        await this.recalculateProgramMeasurements();
    }

    /**
     * Eliminar registro por fecha
     */
    async removeByDate(date: string): Promise<void> {
        const log = await this.weightLogRepo.findOne({ where: { date } });
        if (log) {
            if (log.photos && log.photos.length > 0) {
                await this.uploadService.deleteMultiplePhotos(log.photos);
            }
            await this.weightLogRepo.delete(log.id);
            // Fase 5: mantener las snapshots first/last del programa activo
            await this.recalculateProgramMeasurements();
        }
    }
}
