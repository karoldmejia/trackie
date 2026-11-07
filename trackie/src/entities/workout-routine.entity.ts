import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { WorkoutTemplate } from "./workout-template.entity";

@Entity('workout_routines')
export class WorkoutRoutine {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @OneToMany(() => WorkoutTemplate, (t) => t.routine)
    templates: WorkoutTemplate[];
}
