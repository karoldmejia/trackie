import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { UpsertMetricDto } from "../dtos/metric.dto";
import { MetricType } from "../entities/metric-type.entity";
import { MetricTypeUnit } from "../enums/metric-type-unit.enum";
import { MetricValueType } from "../enums/metric-value-type.enum";
import { Program } from "../entities/program.entity";
import { ProgramMetricTarget } from "../entities/program-metric-target.entity";

export interface FormSchema {
    metrics: MetricType[];
    availableToAdd: MetricType[];
}

@Injectable()
export class MetricService {
    private readonly logger = new Logger(MetricService.name);

    constructor(
        @InjectRepository(MetricType)
        private readonly metricRepo: Repository<MetricType>,
        @InjectRepository(Program)
        private readonly programRepo: Repository<Program>,
        @InjectRepository(ProgramMetricTarget)
        private readonly targetRepo: Repository<ProgramMetricTarget>,
    ) { }

    /**
     * upsert:
     * - Con `id`: update parcial (omitUndefined). La `key` es inmutable: nunca se toca.
     * - Sin `id`: insert; la `key` se deriva del label y se valida que no colisione.
     */
    async upsert(dto: UpsertMetricDto): Promise<MetricType> {
        if (dto.id) {
            const existent = await this.metricRepo.findOne({ where: { id: dto.id } });
            if (!existent) {
                throw new NotFoundException(`Métrica ${dto.id} no encontrada`);
            }
            // omitUndefined: solo se asignan los campos presentes; `key` nunca se toca
            const { id, ...rest } = dto;
            for (const [field, value] of Object.entries(rest)) {
                if (value !== undefined) {
                    (existent as any)[field] = value;
                }
            }
            return this.metricRepo.save(existent);
        }

        if (!dto.label || !dto.type || !dto.unit) {
            throw new BadRequestException('label, type y unit son requeridos para crear una métrica');
        }

        const key = this.toSlugKey(dto.label);
        if (!key) {
            throw new BadRequestException(`No se pudo derivar una key válida desde el label "${dto.label}"`);
        }
        const collision = await this.metricRepo.findOne({ where: { key } });
        if (collision) {
            throw new ConflictException(`Ya existe una métrica con key "${key}"`);
        }

        const metric = this.metricRepo.create({
            key,
            label: dto.label,
            type: dto.type,
            unit: dto.unit,
            isUniversal: dto.isUniversal ?? false,
            isDerived: dto.isDerived ?? false,
            isActive: dto.isActive ?? true,
        });
        return this.metricRepo.save(metric);
    }

    async findAllActive(): Promise<MetricType[]> {
        return this.metricRepo.find({ where: { isActive: true }, order: { label: 'ASC' } });
    }

    async findByKeys(keys: string[]): Promise<MetricType[]> {
        if (keys.length === 0) return [];
        return this.metricRepo.find({ where: { key: In(keys) } });
    }

    /**
     * Esquema del formulario de DailyLog:
     * - metrics = universales + las de los targets del programa (el indicado por `programId`,
     *   o el activo si no se pasa ninguno).
     * - availableToAdd = activas, no derivadas y no incluidas en metrics.
     */
    async getFormSchema(programId?: string): Promise<FormSchema> {
        const universals = await this.metricRepo.find({
            where: { isActive: true, isUniversal: true },
            order: { label: 'ASC' },
        });

        let programMetrics: MetricType[] = [];
        if (programId) {
            programMetrics = await this.getProgramTargetMetrics(programId);
        } else {
            const activeProgram = await this.findActiveProgram();
            if (activeProgram) {
                programMetrics = await this.getProgramTargetMetrics(activeProgram.id);
            }
        }

        const seen = new Set<string>();
        const metrics: MetricType[] = [];
        for (const metric of [...universals, ...programMetrics]) {
            if (!seen.has(metric.id)) {
                seen.add(metric.id);
                metrics.push(metric);
            }
        }

        const included = new Set(metrics.map((m) => m.id));
        const availableToAdd = await this.metricRepo.find({
            where: { isActive: true, isDerived: false },
            order: { label: 'ASC' },
        }).then((rows) => rows.filter((m) => !included.has(m.id)));

        return { metrics, availableToAdd };
    }

    /** Siembra las métricas universales básicas (idempotente). */
    async seedUniversalMetrics(): Promise<void> {
        const seeds: Array<Pick<MetricType, 'key' | 'label' | 'type' | 'unit' | 'isUniversal' | 'isDerived' | 'isActive'>> = [
            { key: 'calories', label: 'Calorías', type: MetricValueType.NUMBER, unit: MetricTypeUnit.KCAL, isUniversal: true, isDerived: false, isActive: true },
            { key: 'protein', label: 'Proteína', type: MetricValueType.NUMBER, unit: MetricTypeUnit.GRAMS, isUniversal: true, isDerived: false, isActive: true },
            { key: 'steps', label: 'Pasos', type: MetricValueType.NUMBER, unit: MetricTypeUnit.STEPS, isUniversal: true, isDerived: false, isActive: true },
            { key: 'water', label: 'Agua', type: MetricValueType.NUMBER, unit: MetricTypeUnit.LITERS, isUniversal: true, isDerived: false, isActive: true },
            { key: 'workout_count', label: 'Entrenamientos', type: MetricValueType.NUMBER, unit: MetricTypeUnit.UNIT, isUniversal: true, isDerived: true, isActive: true },
        ];

        for (const seed of seeds) {
            await this.metricRepo.query(
                `INSERT INTO metric_types ("key", "label", "type", "unit", "isUniversal", "isDerived", "isActive")
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT ("key") DO NOTHING`,
                [seed.key, seed.label, seed.type, seed.unit, seed.isUniversal, seed.isDerived, seed.isActive],
            );
        }
        this.logger.log('Métricas universales sembradas (idempotente)');
    }

    private async getProgramTargetMetrics(programId: string): Promise<MetricType[]> {
        const exists = await this.programRepo.findOne({ where: { id: programId } });
        if (!exists) {
            throw new NotFoundException(`Programa ${programId} no encontrado`);
        }
        const targets = await this.targetRepo.find({
            where: { programId },
            relations: { metricType: true },
        });
        return targets.map((t) => t.metricType);
    }

    private async findActiveProgram(): Promise<Program | null> {
        // Misma regla que ProgramService.findActive(): isActive y hoy dentro del rango
        const today = this.getLocalDate();
        return this.programRepo
            .createQueryBuilder('program')
            .where('program.isActive = :isActive', { isActive: true })
            .andWhere('program.startDate <= :today', { today })
            .andWhere('program.endDate >= :today', { today })
            .getOne();
    }

    private getLocalDate(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // helpers

    toSlugKey(input: string): string {
        return input
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }
}
