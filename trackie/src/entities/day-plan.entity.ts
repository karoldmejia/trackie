import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, OneToMany } from 'typeorm';
import { PlannedMeal } from './planned-meal.entity';

@Entity('day_plans')
@Unique(['date'])
export class DayPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    date: string;

    @OneToMany(() => PlannedMeal, (plannedMeal) => plannedMeal.dayPlan, { cascade: true, eager: true })
    plannedMeals: PlannedMeal[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}