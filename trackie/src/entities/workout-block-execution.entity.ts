import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MetricBlockType } from "../enums/metric-block-type.enum";
import { WorkoutExecution } from "./workout-execution.entity";
import { WorkoutBlockTemplate } from "./workout-block-template.entity";

@Entity('workout_block_executions')
@Index(['executionId'])
export class WorkoutBlockExecution {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    executionId: string;

    @Column({ type: 'uuid', nullable: true })
    templateId: string | null;

    @Column({ type: 'varchar', length: 50 })
    kindSnapshot: string;

    @Column({ type: 'varchar', length: 255 })
    nameSnapshot: string;

    @Column({ type: 'enum', enum: MetricBlockType })
    metricTypeSnapshot: MetricBlockType;

    @Column({ type: 'int', default: 0 })
    plannedRounds: number;

    @Column({ type: 'int', default: 0 })
    actualRounds: number;

    @Column({ type: 'float', nullable: true })
    targetDistanceMeters: number | null;

    @Column({ type: 'float', nullable: true })
    actualDistanceMeters: number | null;

    @Column({ type: 'int', nullable: true })
    targetDurationSeconds: number | null;

    @Column({ type: 'int', nullable: true })
    actualDurationSeconds: number | null;

    @Column({ type: 'int', nullable: true })
    targetReps: number | null;

    @Column({ type: 'int', nullable: true })
    actualReps: number | null;

    @Column({ type: 'boolean', default: false })
    completed: boolean;

    @ManyToOne(() => WorkoutExecution, (e) => e.blocks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'executionId' })
    execution: WorkoutExecution;

    @ManyToOne(() => WorkoutBlockTemplate, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'templateId' })
    template: WorkoutBlockTemplate | null;
}
