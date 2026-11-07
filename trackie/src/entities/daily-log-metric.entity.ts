import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { DailyLog } from "./dailylog.entity";
import { MetricType } from "./metric-type.entity";

@Entity('daily_log_metrics')
@Unique(['dailyLogId', 'metricTypeId'])
@Index(['dailyLogId'])
export class DailyLogMetric {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    dailyLogId: string;

    @Column({ type: 'uuid' })
    metricTypeId: string;

    @Column({ type: 'float', nullable: true })
    value: number | null;

    @ManyToOne(() => DailyLog, (log) => log.metrics, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'dailyLogId' })
    dailyLog: DailyLog;

    @ManyToOne(() => MetricType, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'metricTypeId' })
    metricType: MetricType;
}
