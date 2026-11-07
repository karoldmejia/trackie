import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, OneToMany } from 'typeorm';
import { DailyLogMetric } from './daily-log-metric.entity';
import { ProgramDay } from './program-day.entity';
import { WorkoutExecution } from './workout-execution.entity';
import { WorkoutType } from '../enums/workouttype.enum';

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

    // INTERIM (Fase 1 → Fase 3): getters de compatibilidad para los services
    // que aún leen las columnas eliminadas (cutphase.service hasta que se
    // reemplace en la Fase 3). Requieren `metrics.metricType` cargado.
    // Eliminar en Fase 6.
    private metricValue(key: string): number {
        const metric = (this.metrics ?? []).find((m) => m.metricType?.key === key);
        return metric?.value ?? 0;
    }

    /** @deprecated INTERIM: leer dailyLog.metrics */
    get calories(): number {
        return this.metricValue('calories');
    }

    /** @deprecated INTERIM: leer dailyLog.metrics */
    get steps(): number {
        return this.metricValue('steps');
    }

    /** @deprecated INTERIM: leer dailyLog.metrics */
    get proteinGrams(): number {
        return this.metricValue('protein');
    }

    /** @deprecated INTERIM: leer dailyLog.metrics */
    get waterLiters(): number {
        return this.metricValue('water');
    }

    /** @deprecated INTERIM: leer dailyLog.metrics */
    get workout(): WorkoutType {
        return this.metricValue('workout_count') > 0 ? WorkoutType.FULL : WorkoutType.NONE;
    }
}
