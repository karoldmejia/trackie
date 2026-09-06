import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CutPhaseDay } from './cutphaseday.entity';

@Entity('cut_phases')
export class CutPhase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    startDate: string;

    @Column({ type: 'date' })
    endDate: string;

    @Column({ type: 'int' })
    totalWeeks: number;

    @Column({ type: 'float' })
    targetCalories: number;

    @Column({ type: 'float' })
    targetProtein: number;

    @Column({ type: 'int' })
    targetSteps: number;

    @Column({ type: 'float' })
    targetWater: number;

    @Column({ type: 'int' })
    workoutsPerWeek: number;

    @Column({ type: 'float', nullable: true })
    initialWeight?: number;

    @Column({ type: 'float', nullable: true })
    initialWaist?: number;

    @Column({ type: 'float', nullable: true })
    initialHips?: number;

    @Column({ type: 'float', nullable: true })
    initialBodyfat?: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => CutPhaseDay, (cutPhaseDay) => cutPhaseDay.cutPhase)
    days: CutPhaseDay[];

    get isActuallyActive(): boolean {
        const today = new Date();
        const end = new Date(this.endDate);
        return this.isActive && end >= today;
    }

}