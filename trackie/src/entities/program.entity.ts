import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ProgramKind } from "../enums/program-kind.enum";
import { ProgramMetricTarget } from "./program-metric-target.entity";
import { ProgramDay } from "./program-day.entity";
import { ProgramMeasurement } from "./program-measurement.entity";

@Entity('programs')
export class Program {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'enum', enum: ProgramKind })
    kind: ProgramKind;

    @Column({ type: 'date' })
    startDate: string;

    @Column({ type: 'date' })
    endDate: string;

    @Column({ type: 'int' })
    totalWeeks: number;

    @Column({ type: 'int', default: 0 })
    workoutsPerWeek: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => ProgramMetricTarget, (t) => t.program, { cascade: true })
    metricTargets: ProgramMetricTarget[];

    @OneToMany(() => ProgramDay, (d) => d.program)
    days: ProgramDay[];

    @OneToMany(() => ProgramMeasurement, (m) => m.program)
    measurements: ProgramMeasurement[];
}
