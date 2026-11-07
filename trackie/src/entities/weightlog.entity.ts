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

    // INTERIM (Fase 1 → Fase 5): getters de compatibilidad para los services
    // que aún leen columnas eliminadas. Requieren `metrics.bodyMetricType` cargado.
    // Eliminar en Fase 6.
    private metricValue(key: string): number | null {
        const metric = (this.metrics ?? []).find((m) => m.bodyMetricType?.key === key);
        return metric?.value ?? null;
    }

    /** @deprecated INTERIM: leer weightLog.metrics */
    get weight(): number | null {
        return this.metricValue('weight');
    }

    /** @deprecated INTERIM: leer weightLog.metrics */
    get bodyfat(): number | null {
        return this.metricValue('bodyfat');
    }

    /** @deprecated INTERIM: leer weightLog.metrics */
    get waist(): number | null {
        return this.metricValue('waist');
    }

    /** @deprecated INTERIM: leer weightLog.metrics */
    get hips(): number | null {
        return this.metricValue('hips');
    }
}
