import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MetricValueType } from "../enums/metric-value-type.enum";
import { MetricTypeUnit } from "../enums/metric-type-unit.enum";
import { WeightLogMetric } from "./weight-log-metric.entity";
import { ProgramMeasurement } from "./program-measurement.entity";

@Entity('body_metric_types')
export class BodyMetricType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    key: string;

    @Column({ type: 'varchar', length: 100 })
    label: string;

    @Column({ type: 'enum', enum: MetricValueType })
    type: MetricValueType;

    @Column({ type: 'enum', enum: MetricTypeUnit })
    unit: MetricTypeUnit;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @OneToMany(() => WeightLogMetric, (m) => m.bodyMetricType)
    weightLogMetrics: WeightLogMetric[];

    @OneToMany(() => ProgramMeasurement, (m) => m.bodyMetricType)
    programMeasurements: ProgramMeasurement[];
}
