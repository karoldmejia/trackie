import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MetricBlockType } from "../enums/metric-block-type.enum";
import { WorkoutTemplate } from "./workout-template.entity";

@Entity('workout_block_templates')
export class WorkoutBlockTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    workoutId: string;

    @Column({ type: 'varchar', length: 50 })
    kind: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'int', default: 1 })
    rounds: number;

    @Column({ type: 'enum', enum: MetricBlockType })
    metricType: MetricBlockType;

    @Column({ type: 'float', nullable: true })
    targetDistanceMeters: number | null;

    @Column({ type: 'int', nullable: true })
    targetDurationSeconds: number | null;

    @Column({ type: 'int', nullable: true })
    targetReps: number | null;

    @Column({ type: 'int', default: 0 })
    order: number;

    @ManyToOne(() => WorkoutTemplate, (t) => t.blockTemplates, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workoutId' })
    workout: WorkoutTemplate;
}
