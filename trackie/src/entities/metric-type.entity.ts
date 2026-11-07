import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MetricTypeUnit } from "../enums/metric-type-unit.enum";
import { MetricValueType } from "../enums/metric-value-type.enum";
import { DailyLogMetric } from "./daily-log-metric.entity";
import { ProgramMetricTarget } from "./program-metric-target.entity";

@Entity('metric_types')
export class MetricType {
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

    @Column({ type: 'boolean', default: false })
    isUniversal: boolean;

    @Column({ type: 'boolean', default: false })
    isDerived: boolean;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @OneToMany(() => DailyLogMetric, (m) => m.metricType)
    dailyLogMetrics: DailyLogMetric[];

    @OneToMany(() => ProgramMetricTarget, (t) => t.metricType)
    programMetricTargets: ProgramMetricTarget[];
}
