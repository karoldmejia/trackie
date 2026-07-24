
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CutPhase } from './cutphase.entity';

@Entity('cut_phase_days')
export class CutPhaseDay {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Referencia a la fecha (clave para vincular con DailyLog)
    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'int', default: 0 })
    weekNumber: number;

    @Column({ type: 'boolean', default: false })
    caloriesMet: boolean;

    @Column({ type: 'boolean', default: false })
    proteinMet: boolean;

    @Column({ type: 'boolean', default: false })
    stepsMet: boolean;

    @Column({ type: 'boolean', default: false })
    waterMet: boolean;

    @Column({ type: 'boolean', default: false })
    workoutMet: boolean;

    // Score del día (0-100) - cálculo derivado
    @Column({ type: 'int', default: 0 })
    dailyScore: number;

    @Column({ type: 'boolean', default: false })
    allMet: boolean;

    @ManyToOne(() => CutPhase, (cutPhase) => cutPhase.days)
    @JoinColumn({ name: 'cutPhaseId' })
    cutPhase: CutPhase;

    @Column()
    cutPhaseId: string;
}