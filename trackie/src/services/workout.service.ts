import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
    CreateProgramRoutineDto,
    CreateWorkoutBlockTemplateDto,
    CreateWorkoutRoutineDto,
    CreateWorkoutTemplateDto,
    RegisterWorkoutExecutionDto,
    UpdateWorkoutBlockTemplateDto,
    UpdateWorkoutRoutineDto,
    UpdateWorkoutTemplateDto,
    WorkoutBlockExecutionInputDto,
} from '../dtos/workout.dto';
import { WorkoutRoutine } from '../entities/workout-routine.entity';
import { WorkoutTemplate } from '../entities/workout-template.entity';
import { WorkoutBlockTemplate } from '../entities/workout-block-template.entity';
import { WorkoutExecution } from '../entities/workout-execution.entity';
import { WorkoutBlockExecution } from '../entities/workout-block-execution.entity';
import { ProgramRoutine } from '../entities/program-routine.entity';
import { Program } from '../entities/program.entity';
import { DailyLog } from '../entities/dailylog.entity';
import { ProgramService } from './program.service';

interface BlockDefinition {
    templateId: string | null;
    kindSnapshot: string;
    nameSnapshot: string;
    metricTypeSnapshot: WorkoutBlockTemplate['metricType'];
    plannedRounds: number;
    actualRounds: number;
    targetDistanceMeters: number | null;
    actualDistanceMeters: number | null;
    targetDurationSeconds: number | null;
    actualDurationSeconds: number | null;
    targetReps: number | null;
    actualReps: number | null;
    completed: boolean;
}

@Injectable()
export class WorkoutService {
    private readonly logger = new Logger(WorkoutService.name);

    constructor(
        @InjectRepository(WorkoutRoutine)
        private readonly routineRepo: Repository<WorkoutRoutine>,
        @InjectRepository(WorkoutTemplate)
        private readonly templateRepo: Repository<WorkoutTemplate>,
        @InjectRepository(WorkoutBlockTemplate)
        private readonly blockTemplateRepo: Repository<WorkoutBlockTemplate>,
        @InjectRepository(WorkoutExecution)
        private readonly executionRepo: Repository<WorkoutExecution>,
        @InjectRepository(WorkoutBlockExecution)
        private readonly blockExecutionRepo: Repository<WorkoutBlockExecution>,
        @InjectRepository(ProgramRoutine)
        private readonly programRoutineRepo: Repository<ProgramRoutine>,
        @InjectRepository(Program)
        private readonly programRepo: Repository<Program>,
        private readonly dataSource: DataSource,
        private readonly programService: ProgramService,
    ) { }

    // ==================================================================
    // Routines (catálogo)
    // ==================================================================

    async createRoutine(dto: CreateWorkoutRoutineDto): Promise<WorkoutRoutine> {
        const routine = this.routineRepo.create({
            name: dto.name,
            isActive: dto.isActive ?? true,
        });
        return this.routineRepo.save(routine);
    }

    async findAllRoutines(): Promise<WorkoutRoutine[]> {
        return this.routineRepo.find({ order: { name: 'ASC' } });
    }

    async findRoutineById(id: string): Promise<WorkoutRoutine> {
        const routine = await this.routineRepo.findOne({
            where: { id },
            relations: { templates: { blockTemplates: true } },
        });
        if (!routine) {
            throw new NotFoundException(`Rutina ${id} no encontrada`);
        }
        return routine;
    }

    async updateRoutine(id: string, dto: UpdateWorkoutRoutineDto): Promise<WorkoutRoutine> {
        const routine = await this.findRoutineById(id);
        if (dto.name !== undefined) routine.name = dto.name;
        if (dto.isActive !== undefined) routine.isActive = dto.isActive;
        return this.routineRepo.save(routine);
    }

    async removeRoutine(id: string): Promise<void> {
        // CASCADE: templates y block templates. Las ejecuciones guardan SET NULL.
        const routine = await this.routineRepo.findOne({ where: { id } });
        if (!routine) {
            throw new NotFoundException(`Rutina ${id} no encontrada`);
        }
        await this.routineRepo.remove(routine);
    }

    // ==================================================================
    // Workout templates (catálogo)
    // ==================================================================

    async createTemplate(dto: CreateWorkoutTemplateDto): Promise<WorkoutTemplate> {
        const routine = await this.routineRepo.findOne({ where: { id: dto.routineId } });
        if (!routine) {
            throw new NotFoundException(`Rutina ${dto.routineId} no encontrada`);
        }
        const template = this.templateRepo.create({
            routineId: dto.routineId,
            name: dto.name,
            type: dto.type,
            order: dto.order ?? 0,
        });
        return this.templateRepo.save(template);
    }

    async findAllTemplates(routineId?: string): Promise<WorkoutTemplate[]> {
        return this.templateRepo.find({
            where: routineId ? { routineId } : {},
            order: { order: 'ASC', name: 'ASC' },
        });
    }

    async findTemplateById(id: string): Promise<WorkoutTemplate> {
        const template = await this.templateRepo.findOne({
            where: { id },
            relations: { blockTemplates: true },
            order: { blockTemplates: { order: 'ASC' } },
        });
        if (!template) {
            throw new NotFoundException(`Workout template ${id} no encontrado`);
        }
        return template;
    }

    async updateTemplate(id: string, dto: UpdateWorkoutTemplateDto): Promise<WorkoutTemplate> {
        const template = await this.findTemplateById(id);
        if (dto.routineId !== undefined) {
            const routine = await this.routineRepo.findOne({ where: { id: dto.routineId } });
            if (!routine) {
                throw new NotFoundException(`Rutina ${dto.routineId} no encontrada`);
            }
            template.routineId = dto.routineId;
        }
        if (dto.name !== undefined) template.name = dto.name;
        if (dto.type !== undefined) template.type = dto.type;
        if (dto.order !== undefined) template.order = dto.order;
        return this.templateRepo.save(template);
    }

    async removeTemplate(id: string): Promise<void> {
        const template = await this.templateRepo.findOne({ where: { id } });
        if (!template) {
            throw new NotFoundException(`Workout template ${id} no encontrado`);
        }
        await this.templateRepo.remove(template); // CASCADE sobre block_templates
    }

    // ==================================================================
    // Block templates (catálogo)
    // ==================================================================

    async createBlockTemplate(dto: CreateWorkoutBlockTemplateDto): Promise<WorkoutBlockTemplate> {
        const template = await this.templateRepo.findOne({ where: { id: dto.workoutId } });
        if (!template) {
            throw new NotFoundException(`Workout template ${dto.workoutId} no encontrado`);
        }
        const block = this.blockTemplateRepo.create({
            workoutId: dto.workoutId,
            kind: dto.kind,
            name: dto.name,
            rounds: dto.rounds ?? 1,
            metricType: dto.metricType,
            targetDistanceMeters: dto.targetDistanceMeters ?? null,
            targetDurationSeconds: dto.targetDurationSeconds ?? null,
            targetReps: dto.targetReps ?? null,
            order: dto.order ?? 0,
        });
        return this.blockTemplateRepo.save(block);
    }

    async findAllBlockTemplates(workoutId?: string): Promise<WorkoutBlockTemplate[]> {
        return this.blockTemplateRepo.find({
            where: workoutId ? { workoutId } : {},
            order: { order: 'ASC', name: 'ASC' },
        });
    }

    async findBlockTemplateById(id: string): Promise<WorkoutBlockTemplate> {
        const block = await this.blockTemplateRepo.findOne({ where: { id } });
        if (!block) {
            throw new NotFoundException(`Block template ${id} no encontrado`);
        }
        return block;
    }

    async updateBlockTemplate(id: string, dto: UpdateWorkoutBlockTemplateDto): Promise<WorkoutBlockTemplate> {
        const block = await this.findBlockTemplateById(id);
        if (dto.workoutId !== undefined) {
            const template = await this.templateRepo.findOne({ where: { id: dto.workoutId } });
            if (!template) {
                throw new NotFoundException(`Workout template ${dto.workoutId} no encontrado`);
            }
            block.workoutId = dto.workoutId;
        }
        if (dto.kind !== undefined) block.kind = dto.kind;
        if (dto.name !== undefined) block.name = dto.name;
        if (dto.rounds !== undefined) block.rounds = dto.rounds;
        if (dto.metricType !== undefined) block.metricType = dto.metricType;
        if (dto.targetDistanceMeters !== undefined) block.targetDistanceMeters = dto.targetDistanceMeters;
        if (dto.targetDurationSeconds !== undefined) block.targetDurationSeconds = dto.targetDurationSeconds;
        if (dto.targetReps !== undefined) block.targetReps = dto.targetReps;
        if (dto.order !== undefined) block.order = dto.order;
        return this.blockTemplateRepo.save(block);
    }

    async removeBlockTemplate(id: string): Promise<void> {
        const block = await this.blockTemplateRepo.findOne({ where: { id } });
        if (!block) {
            throw new NotFoundException(`Block template ${id} no encontrado`);
        }
        await this.blockTemplateRepo.remove(block);
    }

    // ==================================================================
    // Program ↔ Routine
    // ==================================================================

    async assignRoutineToProgram(programId: string, dto: CreateProgramRoutineDto): Promise<ProgramRoutine> {
        const program = await this.programRepo.findOne({ where: { id: programId } });
        if (!program) {
            throw new NotFoundException(`Program ${programId} no encontrado`);
        }
        const routine = await this.routineRepo.findOne({ where: { id: dto.routineId } });
        if (!routine) {
            throw new NotFoundException(`Rutina ${dto.routineId} no encontrada`);
        }
        const existing = await this.programRoutineRepo.findOne({
            where: { programId, routineId: dto.routineId },
        });
        if (existing) {
            throw new ConflictException('La rutina ya está asignada al programa');
        }
        const link = this.programRoutineRepo.create({
            programId,
            routineId: dto.routineId,
            order: dto.order ?? 0,
        });
        return this.programRoutineRepo.save(link);
    }

    async listProgramRoutines(programId: string): Promise<ProgramRoutine[]> {
        return this.programRoutineRepo.find({
            where: { programId },
            relations: { routine: true },
            order: { order: 'ASC' },
        });
    }

    async removeRoutineFromProgram(programId: string, routineId: string): Promise<void> {
        const link = await this.programRoutineRepo.findOne({ where: { programId, routineId } });
        if (!link) {
            throw new NotFoundException('La rutina no está asignada al programa');
        }
        await this.programRoutineRepo.remove(link);
    }

    // ==================================================================
    // Workout executions
    // ==================================================================

    async findExecutionById(id: string): Promise<WorkoutExecution> {
        const execution = await this.executionRepo.findOne({
            where: { id },
            relations: { blocks: true, dailyLog: true },
        });
        if (!execution) {
            throw new NotFoundException(`Workout execution ${id} no encontrada`);
        }
        return execution;
    }

    async findExecutions(date?: string, start?: string, end?: string): Promise<WorkoutExecution[]> {
        const qb = this.executionRepo
            .createQueryBuilder('execution')
            .leftJoinAndSelect('execution.blocks', 'blocks')
            .leftJoinAndSelect('execution.dailyLog', 'dailyLog')
            .orderBy('dailyLog.date', 'DESC');

        if (date) {
            qb.where('dailyLog.date = :date', { date });
        } else if (start && end) {
            qb.where('dailyLog.date BETWEEN :start AND :end', { start, end });
        } else if (start) {
            qb.where('dailyLog.date >= :start', { start });
        } else if (end) {
            qb.where('dailyLog.date <= :end', { end });
        }

        return qb.getMany();
    }

    async removeExecution(id: string): Promise<void> {
        const execution = await this.executionRepo.findOne({
            where: { id },
            relations: { dailyLog: true },
        });
        if (!execution) {
            throw new NotFoundException(`Workout execution ${id} no encontrada`);
        }
        const date = execution.dailyLog?.date;
        await this.executionRepo.remove(execution); // CASCADE sobre blocks
        if (date) {
            await this.programService.syncProgramDayForDate(date);
        }
    }

    /**
     * Transacción: busca o crea el DailyLog de la fecha, crea el WorkoutExecution
     * y sus WorkoutBlockExecution, calcula agregados (suma actual * actualRounds)
     * y, tras la transacción, sincroniza el ProgramDay.
     */
    async registerExecution(dto: RegisterWorkoutExecutionDto): Promise<WorkoutExecution> {
        let execution: WorkoutExecution;
        execution = await this.dataSource.transaction(async (manager) => {
                // 1. Buscar o crear el DailyLog
                let log = await manager.findOne(DailyLog, { where: { date: dto.date } });
                if (!log) {
                    log = await manager.save(manager.create(DailyLog, { date: dto.date }));
                }

                // 2. Resolver el template (opcional)
                let template: WorkoutTemplate | null = null;
                if (dto.workoutId) {
                    template = await manager.findOne(WorkoutTemplate, {
                        where: { id: dto.workoutId },
                        relations: { blockTemplates: true },
                    });
                    if (!template) {
                        throw new NotFoundException(`Workout template ${dto.workoutId} no encontrado`);
                    }
                }

                const workoutNameSnapshot = dto.workoutNameSnapshot ?? template?.name;
                const workoutTypeSnapshot = dto.workoutTypeSnapshot ?? template?.type;
                if (!workoutNameSnapshot || !workoutTypeSnapshot) {
                    throw new BadRequestException(
                        'workoutNameSnapshot y workoutTypeSnapshot son requeridos si no se pasa workoutId',
                    );
                }

                if (dto.routineId) {
                    const routine = await manager.findOne(WorkoutRoutine, { where: { id: dto.routineId } });
                    if (!routine) {
                        throw new NotFoundException(`Rutina ${dto.routineId} no encontrada`);
                    }
                }

                // 3. Construir las definiciones de block executions
                const blockDefs = await this.buildBlockDefinitions(dto, template, manager);

                // 4. Agregados: suma(actual * actualRounds)
                const totalDistanceMeters = blockDefs.reduce(
                    (sum, b) => sum + (b.actualDistanceMeters ?? 0) * b.actualRounds, 0,
                );
                const totalDurationSeconds = blockDefs.reduce(
                    (sum, b) => sum + (b.actualDurationSeconds ?? 0) * b.actualRounds, 0,
                );
                const totalRounds = blockDefs.reduce((sum, b) => sum + b.actualRounds, 0);
                const completed = blockDefs.every((b) => b.completed); // sin bloques -> true

                const created = await manager.save(
                    manager.create(WorkoutExecution, {
                        dailyLogId: log.id,
                        routineId: dto.routineId ?? null,
                        workoutId: template?.id ?? null,
                        workoutNameSnapshot,
                        workoutTypeSnapshot,
                        totalDistanceMeters,
                        totalDurationSeconds,
                        totalRounds,
                        completed,
                        notes: dto.notes ?? null,
                    }),
                );

                if (blockDefs.length > 0) {
                    const blocks = blockDefs.map((b) =>
                        manager.create(WorkoutBlockExecution, { ...b, executionId: created.id }),
                    );
                    await manager.save(blocks);
                }

                return created;
            });

        // Tras la transacción: sincronizar el ProgramDay (derived metrics)
        await this.programService.syncProgramDayForDate(dto.date);

        return this.findExecutionById(execution.id);
    }

    private async buildBlockDefinitions(
        dto: RegisterWorkoutExecutionDto,
        template: WorkoutTemplate | null,
        manager: EntityManager,
    ): Promise<BlockDefinition[]> {
        const inputBlocks = dto.blocks;

        // Sin bloques en el DTO: heredar los del template como ejecución planificada completada
        if (!inputBlocks || inputBlocks.length === 0) {
            if (template) {
                return (template.blockTemplates ?? []).map((tpl) => ({
                    templateId: tpl.id,
                    kindSnapshot: tpl.kind,
                    nameSnapshot: tpl.name,
                    metricTypeSnapshot: tpl.metricType,
                    plannedRounds: tpl.rounds,
                    actualRounds: tpl.rounds,
                    targetDistanceMeters: tpl.targetDistanceMeters,
                    actualDistanceMeters: tpl.targetDistanceMeters,
                    targetDurationSeconds: tpl.targetDurationSeconds,
                    actualDurationSeconds: tpl.targetDurationSeconds,
                    targetReps: tpl.targetReps,
                    actualReps: tpl.targetReps,
                    completed: true,
                }));
            }
            return [];
        }

        const defs: BlockDefinition[] = [];
        for (const input of inputBlocks) {
            defs.push(await this.buildBlockDefinition(input, template, manager));
        }
        return defs;
    }

    private async buildBlockDefinition(
        input: WorkoutBlockExecutionInputDto,
        template: WorkoutTemplate | null,
        manager: EntityManager,
    ): Promise<BlockDefinition> {
        if (input.templateId) {
            const tpl = await manager.findOne(WorkoutBlockTemplate, { where: { id: input.templateId } });
            if (!tpl) {
                throw new NotFoundException(`Block template ${input.templateId} no encontrado`);
            }
            if (template && tpl.workoutId !== template.id) {
                throw new BadRequestException(
                    `El block template ${input.templateId} no pertenece al workout ${template.id}`,
                );
            }
            return {
                templateId: tpl.id,
                kindSnapshot: input.kind ?? tpl.kind,
                nameSnapshot: input.name ?? tpl.name,
                metricTypeSnapshot: input.metricType ?? tpl.metricType,
                plannedRounds: input.plannedRounds ?? tpl.rounds,
                actualRounds: input.actualRounds ?? tpl.rounds,
                targetDistanceMeters: input.targetDistanceMeters ?? tpl.targetDistanceMeters,
                actualDistanceMeters: input.actualDistanceMeters ?? null,
                targetDurationSeconds: input.targetDurationSeconds ?? tpl.targetDurationSeconds,
                actualDurationSeconds: input.actualDurationSeconds ?? null,
                targetReps: input.targetReps ?? tpl.targetReps,
                actualReps: input.actualReps ?? null,
                completed: input.completed ?? true,
            };
        }

        // Block ad-hoc: kind, name y metricType son requeridos
        if (!input.kind || !input.name || !input.metricType) {
            throw new BadRequestException('Un block ad-hoc requiere kind, name y metricType');
        }
        const plannedRounds = input.plannedRounds ?? 0;
        return {
            templateId: null,
            kindSnapshot: input.kind,
            nameSnapshot: input.name,
            metricTypeSnapshot: input.metricType,
            plannedRounds,
            actualRounds: input.actualRounds ?? plannedRounds,
            targetDistanceMeters: input.targetDistanceMeters ?? null,
            actualDistanceMeters: input.actualDistanceMeters ?? null,
            targetDurationSeconds: input.targetDurationSeconds ?? null,
            actualDurationSeconds: input.actualDurationSeconds ?? null,
            targetReps: input.targetReps ?? null,
            actualReps: input.actualReps ?? null,
            completed: input.completed ?? true,
        };
    }

    // ==================================================================
    // Shape plano para el front
    // ==================================================================

    toExecutionResponse(execution: WorkoutExecution) {
        return {
            id: execution.id,
            dailyLogId: execution.dailyLogId,
            date: execution.dailyLog?.date,
            routineId: execution.routineId,
            workoutId: execution.workoutId,
            workoutNameSnapshot: execution.workoutNameSnapshot,
            workoutTypeSnapshot: execution.workoutTypeSnapshot,
            totalDistanceMeters: execution.totalDistanceMeters,
            totalDurationSeconds: execution.totalDurationSeconds,
            totalRounds: execution.totalRounds,
            completed: execution.completed,
            notes: execution.notes,
            blocks: (execution.blocks ?? []).map((b) => ({
                id: b.id,
                templateId: b.templateId,
                kindSnapshot: b.kindSnapshot,
                nameSnapshot: b.nameSnapshot,
                metricTypeSnapshot: b.metricTypeSnapshot,
                plannedRounds: b.plannedRounds,
                actualRounds: b.actualRounds,
                targetDistanceMeters: b.targetDistanceMeters,
                actualDistanceMeters: b.actualDistanceMeters,
                targetDurationSeconds: b.targetDurationSeconds,
                actualDurationSeconds: b.actualDurationSeconds,
                targetReps: b.targetReps,
                actualReps: b.actualReps,
                completed: b.completed,
            })),
        };
    }
}
