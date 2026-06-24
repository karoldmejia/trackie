import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinTable, ManyToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DayPlan } from './day-plan.entity';
import { Dish } from './dish.entity';
import { MealType } from '../enums/meal-type.enum';

@Entity('planned_meals')
export class PlannedMeal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: MealType })
    mealType: MealType;

    @Column({ type: 'time' })
    time: string;

    @ManyToOne(() => DayPlan, (dayPlan) => dayPlan.plannedMeals, { onDelete: 'CASCADE' })
    dayPlan: DayPlan;

    @ManyToMany(() => Dish, { eager: true })
    @JoinTable({
        name: 'planned_meal_dishes',
        joinColumn: { name: 'planned_meal_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'dish_id', referencedColumnName: 'id' }
    })
    dishes: Dish[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}