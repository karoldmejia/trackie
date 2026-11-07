import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DailyLog } from "./dailylog.entity";
import { WorkoutRoutine } from "./workout-routine.entity";
import { WorkoutTemplate } from "./workout-template.entity";
import { WorkoutBlockExecution } from "./workout-block-execution.entity";

@Entity('workout_executions')
@Index(['dailyLogId'])
export class WorkoutExecution {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    dailyLogId: string;

    @Column({ type: 'uuid', nullable: true })
    routineId: string | null;

    @Column({ type: 'uuid', nullable: true })
    workoutId: string | null;

    @Column({ type: 'varchar', length: 255 })
    workoutNameSnapshot: string;

    @Column({ type: 'varchar', length: 50 })
    workoutTypeSnapshot: string;

    @Column({ type: 'float', default: 0 })
    totalDistanceMeters: number;

    @Column({ type: 'int', default: 0 })
    totalDurationSeconds: number;

    @Column({ type: 'int', default: 0 })
    totalRounds: number;

    @Column({ type: 'boolean', default: false })
    completed: boolean;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @ManyToOne(() => DailyLog, (log) => log.workoutExecutions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'dailyLogId' })
    dailyLog: DailyLog;

    @ManyToOne(() => WorkoutRoutine, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'routineId' })
    routine: WorkoutRoutine | null;

    @ManyToOne(() => WorkoutTemplate, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'workoutId' })
    workout: WorkoutTemplate | null;

    @OneToMany(() => WorkoutBlockExecution, (b) => b.execution, { cascade: true })
    blocks: WorkoutBlockExecution[];
}
