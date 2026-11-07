import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { TargetDirection } from "../enums/target-direction.enum";
import { Program } from "./program.entity";
import { MetricType } from "./metric-type.entity";

@Entity('program_metric_targets')
@Unique(['programId', 'metricTypeId'])
export class ProgramMetricTarget {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    programId: string;

    @Column({ type: 'uuid' })
    metricTypeId: string;

    @Column({ type: 'float' })
    target: number;

    @Column({ type: 'enum', enum: TargetDirection })
    direction: TargetDirection;

    @Column({ type: 'float' })
    weight: number;

    @Column({ type: 'boolean', default: false })
    isOptional: boolean;

    @ManyToOne(() => Program, (p) => p.metricTargets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'programId' })
    program: Program;

    @ManyToOne(() => MetricType)
    @JoinColumn({ name: 'metricTypeId' })
    metricType: MetricType;
}
