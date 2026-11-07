import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Program } from "./program.entity";
import { WorkoutRoutine } from "./workout-routine.entity";

@Entity('program_routines')
@Unique(['programId', 'routineId'])
export class ProgramRoutine {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    programId: string;

    @Column({ type: 'uuid' })
    routineId: string;

    @Column({ type: 'int', default: 0 })
    order: number;

    @ManyToOne(() => Program, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'programId' })
    program: Program;

    @ManyToOne(() => WorkoutRoutine, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'routineId' })
    routine: WorkoutRoutine;
}
