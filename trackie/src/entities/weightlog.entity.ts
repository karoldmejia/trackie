import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany } from 'typeorm';
import { WeightLogMetric } from './weight-log-metric.entity';
import { ProgramMeasurement } from './program-measurement.entity';

@Entity('weight_logs')
@Unique(['date'])
export class WeightLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'json', nullable: true })
    photos: string[];

    @OneToMany(() => WeightLogMetric, (m) => m.weightLog, { cascade: true })
    metrics: WeightLogMetric[];

    @OneToMany(() => ProgramMeasurement, (m) => m.weightLog)
    programMeasurements: ProgramMeasurement[];
}
