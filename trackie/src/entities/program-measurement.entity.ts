import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { ProgramMeasurementKind } from "../enums/program-measurement-kind.enum";
import { Program } from "./program.entity";
import { BodyMetricType } from "./body-metric-type.entity";
import { WeightLog } from "./weightlog.entity";

@Entity('program_measurements')
@Unique(['programId', 'bodyMetricTypeId', 'kind'])
export class ProgramMeasurement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    programId: string;

    @Column({ type: 'uuid' })
    bodyMetricTypeId: string;

    @Column({ type: 'uuid' })
    weightLogId: string;

    @Column({ type: 'enum', enum: ProgramMeasurementKind })
    kind: ProgramMeasurementKind;

    @Column({ type: 'float' })
    value: number;

    // Fecha del WeightLog original
    @Column({ type: 'date' })
    date: string;

    @ManyToOne(() => Program, (p) => p.measurements, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'programId' })
    program: Program;

    @ManyToOne(() => BodyMetricType)
    @JoinColumn({ name: 'bodyMetricTypeId' })
    bodyMetricType: BodyMetricType;

    @ManyToOne(() => WeightLog, (log) => log.programMeasurements, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'weightLogId' })
    weightLog: WeightLog;
}
