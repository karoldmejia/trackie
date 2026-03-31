import { WorkoutType } from '../enums/workouttype.enum';
import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique} from 'typeorm';

@Entity('daily_logs')
@Unique(['date'])
export class DailyLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'int', default: 0 })
    calories: number;

    @Column({ type: 'int', default: 0 })
    steps: number;

    @Column({type: 'enum', enum: WorkoutType, default: WorkoutType.NONE})
    workout: WorkoutType;

    @Column({ type: 'int', default: 0 })
    energyDrinks: number;

    @Column({ type: 'int', default: 0 })
    waterLiters: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}