import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, OneToMany } from 'typeorm';
import { DailyLogMetric } from './daily-log-metric.entity';
import { ProgramDay } from './program-day.entity';
import { WorkoutExecution } from './workout-execution.entity';

@Entity('daily_logs')
@Unique(['date'])
export class DailyLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    date: string;

    @OneToMany(() => DailyLogMetric, (m) => m.dailyLog, { cascade: true })
    metrics: DailyLogMetric[];

    @OneToMany(() => ProgramDay, (d) => d.dailyLog)
    programDays: ProgramDay[];

    @OneToMany(() => WorkoutExecution, (e) => e.dailyLog)
    workoutExecutions: WorkoutExecution[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
