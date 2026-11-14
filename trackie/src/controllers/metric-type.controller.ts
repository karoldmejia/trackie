import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MetricService } from '../services/metric.service';
import { MetricType } from '../entities/metric-type.entity';
import { CreateMetricTypeDto } from '../dtos/create-metric-type.dto';
import { UpdateMetricTypeDto } from '../dtos/update-metric-type.dto';

@Controller('metrics')
export class MetricTypeController {
    constructor(
        private readonly metricService: MetricService,
        @InjectRepository(MetricType)
        private readonly metricRepo: Repository<MetricType>,
    ) { }

    /**
     * GET /metrics
     * Query params opcionales: ?active=true (default), ?includeDerived=false
     * - Si active=true (default), filtra isActive = true.
     * - Si includeDerived=false (default), filtra isDerived = false.
     * - Ordenado por: isUniversal DESC, label ASC.
     */
    @Get()
    async findAll(
        @Query('active') active?: boolean,
        @Query('includeDerived') includeDerived?: boolean,
    ): Promise<MetricType[]> {
        return this.metricService.findAll(active, includeDerived);
    }

    /**
     * POST /metrics
     * Crea una nueva métrica.
     * Validaciones:
     *   - key único (409 Conflict si ya existe)
     *   - key formato /^[a-z][a-z0-9_]*$/
     *   - label 1-100 caracteres
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateMetricTypeDto): Promise<MetricType> {
        // Validar formato de key: /^[a-z][a-z0-9_]*$/
        const keyRegex = /^[a-z][a-z0-9_]*$/;
        if (!keyRegex.test(dto.key)) {
            throw new BadRequestException(
                `Formato de key inválido. Debe coincidir con /^[a-z][a-z0-9_]*$/. Recibido: "${dto.key}"`,
            );
        }

        // Verificar colisión de key usando el servicio
        const collision = await this.metricService.findByKeys([dto.key]);
        if (collision.length > 0) {
            throw new ConflictException(
                `Ya existe una métrica con key "${dto.key}"`,
            );
        }

        // Validar longitud de label (1-100 caracteres)
        if (dto.label.length < 1 || dto.label.length > 100) {
            throw new BadRequestException(
                `El label debe tener entre 1 y 100 caracteres`,
            );
        }

        const metric = this.metricRepo.create({
            key: dto.key,
            label: dto.label,
            type: dto.valueType,
            unit: dto.unit,
            isUniversal: dto.isUniversal ?? false,
            isDerived: dto.isDerived ?? false,
            isActive: dto.isActive ?? true,
        });

        return this.metricRepo.save(metric);
    }

    /**
     * PATCH /metrics/:id
     * Actualización parcial: label?, unit?, isUniversal?, isActive?
     * NO permite cambiar key ni valueType (son inmutables).
     */
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateMetricTypeDto,
    ): Promise<MetricType> {
        const existent = await this.metricService.findById(id);
        if (!existent) {
            throw new NotFoundException(`Métrica ${id} no encontrada`);
        }

        // Nunca permitir cambiar key o valueType
        // (aunque vengan en el DTO, los omitimos explícitamente)
        if (dto.label !== undefined) {
            existent.label = dto.label;
        }
        if (dto.unit !== undefined) {
            existent.unit = dto.unit;
        }
        if (dto.isUniversal !== undefined) {
            existent.isUniversal = dto.isUniversal;
        }
        if (dto.isActive !== undefined) {
            existent.isActive = dto.isActive;
        }

        return this.metricRepo.save(existent);
    }

    /**
     * DELETE /metrics/:id
     * Soft delete: marca isActive = false.
     * Si la métrica está en uso (tiene filas en daily_log_metrics o
     * program_metric_targets), solo desactiva. Si no está en uso,
     * también puede borrar la fila físicamente (opcional, pero más limpio).
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string): Promise<{ ok: boolean }> {
        const existent = await this.metricService.findById(id);
        if (!existent) {
            throw new NotFoundException(`Métrica ${id} no encontrada`);
        }

        // Verificar si la métrica está en uso
        const { inDailyLogs, inProgramTargets } = await this.metricService.isMetricInUse(id);

        // Soft delete: siempre marcamos isActive = false
        existent.isActive = false;
        await this.metricRepo.save(existent);

        return { ok: true };
    }
}