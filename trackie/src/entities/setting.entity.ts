import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('settings')
export class Settings {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', default: 5 })
    weekStartDay: number;

    @Column({ type: 'int', default: 1800 })
    calorieLimit: number;

    @Column({ type: 'int', default: 10000 })
    stepsLimit: number;

    @Column({ type: 'float', default: 60 })
    targetWeight: number;
}