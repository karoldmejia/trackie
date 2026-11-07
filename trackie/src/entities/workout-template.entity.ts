import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { WorkoutRoutine } from "./workout-routine.entity";
import { WorkoutBlockTemplate } from "./workout-block-template.entity";

@Entity('workout_templates')
export class WorkoutTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    routineId: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 50 })
    type: string;

    @Column({ type: 'int', default: 0 })
    order: number;

    @ManyToOne(() => WorkoutRoutine, (r) => r.templates, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'routineId' })
    routine: WorkoutRoutine;

    @OneToMany(() => WorkoutBlockTemplate, (b) => b.workout, { cascade: true })
    blockTemplates: WorkoutBlockTemplate[];
}
