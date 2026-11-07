import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWeightLogDto, UpdateWeightLogDto } from '../dtos/weightlog.dto';
import { Repository, Between, DeepPartial } from 'typeorm';
import { WeightLog } from '../entities/weightlog.entity';
import { WeightLogMetric } from '../entities/weight-log-metric.entity';
import { BodyMetricType } from '../entities/body-metric-type.entity';
import { UploadService } from './upload.service';

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
    ) { }

    // ------------------------------------------------------------------
    // INTERIM (Fase 1 → Fase 5): puente entre el DTO legado (weight, bodyfat,
    // waist, hips) y el nuevo modelo basado en weight_log_metrics.
    // ------------------------------------------------------------------
    private readonly relations = { metrics: { bodyMetricType: true } } as const;

    private async applyLegacyMetrics(log: WeightLog, dto: Partial<CreateWeightLogDto>): Promise<void> {
        const keyByField: Record<string, string> = {
            weight: 'weight',
            bodyfat: 'bodyfat',
            waist: 'waist',
            hips: 'hips',
        };

        const pending: Array<{ key: string; value: number }> = [];
        for (const [field, key] of Object.entries(keyByField)) {
            const raw = (dto as Record<string, unknown>)[field];
            if (raw !== undefined && raw !== null && !Number.isNaN(Number(raw))) {
                pending.push({ key, value: Number(raw) });
            }
        }
        if (!pending.length) return;

        const types = await this.bodyMetricTypeRepo.find();
        const typeByKey = new Map(types.map((t) => [t.key, t]));

        for (const { key, value } of pending) {
            const bodyMetricType = typeByKey.get(key);
            if (!bodyMetricType) {
                this.logger.warn(`BodyMetricType con key "${key}" no existe; se omite el valor ${value}`);
                continue;
            }
            await this.weightLogMetricRepo.query(
                `INSERT INTO weight_log_metrics ("weightLogId", "bodyMetricTypeId", "value")
                 VALUES ($1, $2, $3)
                 ON CONFLICT ("weightLogId", "bodyMetricTypeId") DO UPDATE SET value = EXCLUDED.value`,
                [log.id, bodyMetricType.id, value],
            );
        }
    }

    /** Adjunta como props propias enumerables los campos legados (shadowing de los getters). */
    private decorateLegacy<T extends WeightLog | null>(log: T): T {
        if (!log) return log;
        Object.defineProperties(log, {
            weight: { value: log.weight, enumerable: true, configurable: true },
            bodyfat: { value: log.bodyfat, enumerable: true, configurable: true },
            waist: { value: log.waist, enumerable: true, configurable: true },
            hips: { value: log.hips, enumerable: true, configurable: true },
        });
        return log;
    }

    /** Elimina los campos legados del DTO (ya no son columnas). */
    private stripLegacy<T extends Partial<CreateWeightLogDto> | Partial<UpdateWeightLogDto>>(dto: T): T {
        const rest: any = { ...(dto as any) };
        delete rest.weight;
        delete rest.bodyfat;
        delete rest.waist;
        delete rest.hips;
        return rest;
    }

    private async finishLegacySave(saved: WeightLog, dto: Partial<CreateWeightLogDto & UpdateWeightLogDto>): Promise<WeightLog> {
        await this.applyLegacyMetrics(saved, dto as CreateWeightLogDto);
        return (await this.findByDate(saved.date)) as WeightLog;
    }

    async create(dto: CreateWeightLogDto, photos?: Express.Multer.File[]): Promise<WeightLog> {
        let existing = await this.weightLogRepo.findOne({ where: { date: dto.date } });

        const logData: any = this.stripLegacy(dto);

        // Validar datos numéricos

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
            return this.finishLegacySave(result, dto);
        } else {
            const log = this.weightLogRepo.create(logData as DeepPartial<WeightLog>);
            const result = await this.weightLogRepo.save(log);
            return this.finishLegacySave(result, dto);
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
            Object.assign(existing, this.stripLegacy(dto));
            this.logger.log(`Actualizando registro existente`);
            const saved = await this.weightLogRepo.save(existing);
            return this.finishLegacySave(saved, dto);
        } else {
            const log = this.weightLogRepo.create(this.stripLegacy(dto));
            this.logger.log(`Creando nuevo registro`);
            const saved = await this.weightLogRepo.save(log);
            return this.finishLegacySave(saved, dto);
        }
    }

    async findLast(): Promise<WeightLog | null> {
        const result = await this.weightLogRepo.findOne({
            where: {},
            order: { date: 'DESC' },
            relations: this.relations,
        });
        return this.decorateLegacy(result);
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

        Object.assign(log, this.stripLegacy(dto));
        const saved = await this.weightLogRepo.save(log);
        return this.finishLegacySave(saved, dto);
    }

    /**
     * Obtener todos los registros
     */
    async findAll(): Promise<WeightLog[]> {
        const logs = await this.weightLogRepo.find({ order: { date: 'ASC' }, relations: this.relations });
        return logs.map((log) => this.decorateLegacy(log));
    }

    /**
     * Obtener registros por rango de fechas
     */
    async findByDateRange(start: string, end: string): Promise<WeightLog[]> {
        const logs = await this.weightLogRepo.find({
            where: { date: Between(start, end) },
            order: { date: 'ASC' },
            relations: this.relations,
        });
        return logs.map((log) => this.decorateLegacy(log));
    }

    /**
     * Obtener registro por fecha específica
     */
    async findByDate(date: string): Promise<WeightLog | null> {
        const log = await this.weightLogRepo.findOne({ where: { date }, relations: this.relations });
        return this.decorateLegacy(log);
    }

    /**
     * Obtener estadísticas completas (máximo, mínimo, promedio) por rango de fechas
     */
    async getStats(start: string, end: string): Promise<WeightStats> {
        const logs = await this.findByDateRange(start, end);

        if (logs.length === 0) {
            return {
                max: {
                    weight: 0,
                    bodyfat: 0,
                    hips: 0,
                    waist: 0,
                    date: '',
                },
                min: {
                    weight: 0,
                    bodyfat: 0,
                    hips: 0,
                    waist: 0,
                    date: '',
                },
                average: {
                    weight: 0,
                    bodyfat: 0,
                    hips: 0,
                    waist: 0,
                },
                total: {
                    weight: 0,
                    bodyfat: 0,
                    hips: 0,
                    waist: 0,
                },
                count: 0,
                startDate: start,
                endDate: end,
            };
        }

        // Inicializar valores máximos y mínimos
        let maxWeight = { value: -Infinity, date: '' };
        let minWeight = { value: Infinity, date: '' };
        let maxBodyfat = { value: -Infinity, date: '' };
        let minBodyfat = { value: Infinity, date: '' };
        let maxHips = { value: -Infinity, date: '' };
        let minHips = { value: Infinity, date: '' };
        let maxWaist = { value: -Infinity, date: '' };
        let minWaist = { value: Infinity, date: '' };

        let totalWeight = 0;
        let totalBodyfat = 0;
        let totalHips = 0;
        let totalWaist = 0;
        let weightCount = 0;
        let bodyfatCount = 0;
        let hipsCount = 0;
        let waistCount = 0;

        for (const log of logs) {
            // Peso
            if (log.weight !== undefined && log.weight !== null) {
                totalWeight += log.weight;
                weightCount++;

                if (log.weight > maxWeight.value) {
                    maxWeight = { value: log.weight, date: log.date };
                }
                if (log.weight < minWeight.value) {
                    minWeight = { value: log.weight, date: log.date };
                }
            }

            // Bodyfat
            if (log.bodyfat !== undefined && log.bodyfat !== null) {
                totalBodyfat += log.bodyfat;
                bodyfatCount++;

                if (log.bodyfat > maxBodyfat.value) {
                    maxBodyfat = { value: log.bodyfat, date: log.date };
                }
                if (log.bodyfat < minBodyfat.value) {
                    minBodyfat = { value: log.bodyfat, date: log.date };
                }
            }

            // Músculo esquelético
            if (log.hips !== undefined && log.hips !== null) {
                totalHips += log.hips;
                hipsCount++;

                if (log.hips > maxHips.value) {
                    maxHips = { value: log.hips, date: log.date };
                }
                if (log.hips < minHips.value) {
                    minHips = { value: log.hips, date: log.date };
                }
            }

            // Waist (cintura)
            if (log.waist !== undefined && log.waist !== null) {
                totalWaist += log.waist;
                waistCount++;

                if (log.waist > maxWaist.value) {
                    maxWaist = { value: log.waist, date: log.date };
                }
                if (log.waist < minWaist.value) {
                    minWaist = { value: log.waist, date: log.date };
                }
            }
        }

        return {
            max: {
                weight: maxWeight.value === -Infinity ? 0 : maxWeight.value,
                bodyfat: maxBodyfat.value === -Infinity ? 0 : maxBodyfat.value,
                hips: maxHips.value === -Infinity ? 0 : maxHips.value,
                waist: maxWaist.value === -Infinity ? 0 : maxWaist.value,
                date: maxWeight.date || maxBodyfat.date || maxHips.date || maxWaist.date || '',
            },
            min: {
                weight: minWeight.value === Infinity ? 0 : minWeight.value,
                bodyfat: minBodyfat.value === Infinity ? 0 : minBodyfat.value,
                hips: minHips.value === Infinity ? 0 : minHips.value,
                waist: minWaist.value === Infinity ? 0 : minWaist.value,
                date: minWeight.date || minBodyfat.date || minHips.date || minWaist.date || '',
            },
            average: {
                weight: weightCount > 0 ? Number((totalWeight / weightCount).toFixed(2)) : 0,
                bodyfat: bodyfatCount > 0 ? Number((totalBodyfat / bodyfatCount).toFixed(2)) : 0,
                hips: hipsCount > 0 ? Number((totalHips / hipsCount).toFixed(2)) : 0,
                waist: waistCount > 0 ? Number((totalWaist / waistCount).toFixed(2)) : 0,
            },
            total: {
                weight: Number(totalWeight.toFixed(2)),
                bodyfat: Number(totalBodyfat.toFixed(2)),
                hips: Number(totalHips.toFixed(2)),
                waist: Number(totalWaist.toFixed(2)),
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
        }
    }
}