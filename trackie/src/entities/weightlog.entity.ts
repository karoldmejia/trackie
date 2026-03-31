import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('weight_logs')
export class WeightLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'float' })
    weight: number; // en kg

    @Column({ type: 'float', nullable: true })
    bodyfat: number; // porcentaje de grasa corporal

    @Column({ type: 'float', nullable: true })
    skeletalMuscle: number; // masa muscular esquelética en porcentaje

    @Column({ type: 'float', nullable: true })
    waist: number; // en cm

    @Column({ type: 'json', nullable: true })
    photos: string[];
}