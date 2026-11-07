import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { WeightLog } from "./weightlog.entity";
import { BodyMetricType } from "./body-metric-type.entity";

@Entity('weight_log_metrics')
@Unique(['weightLogId', 'bodyMetricTypeId'])
@Index(['weightLogId'])
export class WeightLogMetric {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    weightLogId: string;

    @Column({ type: 'uuid' })
    bodyMetricTypeId: string;

    @Column({ type: 'float' })
    value: number;

    @ManyToOne(() => WeightLog, (log) => log.metrics, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'weightLogId' })
    weightLog: WeightLog;

    @ManyToOne(() => BodyMetricType)
    @JoinColumn({ name: 'bodyMetricTypeId' })
    bodyMetricType: BodyMetricType;
}
