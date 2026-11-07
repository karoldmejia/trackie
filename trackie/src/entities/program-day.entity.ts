import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Program } from "./program.entity";
import { DailyLog } from "./dailylog.entity";

@Entity('program_days')
@Unique(['programId', 'date'])
export class ProgramDay {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    programId: string;

    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'int' })
    weekNumber: number;

    @Column({ type: 'uuid' })
    dailyLogId: string;

    @Column({ type: 'int', default: 0 })
    dailyScore: number;

    @Column({ type: 'boolean', default: false })
    allMet: boolean;

    @Column({ type: 'jsonb', default: {} })
    metricResults: Record<string, boolean>;

    @ManyToOne(() => Program, (p) => p.days, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'programId' })
    program: Program;

    @ManyToOne(() => DailyLog, (log) => log.programDays, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'dailyLogId' })
    dailyLog: DailyLog;
}
