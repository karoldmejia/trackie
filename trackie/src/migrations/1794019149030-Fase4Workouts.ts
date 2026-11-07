import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 4 — Workouts.
 * Crea: enum metric_block_type ('distance' | 'duration' | 'reps'),
 * workout_routines, workout_templates, workout_block_templates,
 * workout_executions, workout_block_executions, program_routines.
 *
 * Decisiones de diseño:
 * - WorkoutTemplate.type y WorkoutBlockTemplate.kind son varchar(50) libres.
 * - metricType / metricTypeSnapshot usan el enum metric_block_type.
 * - FKs: workouts -> logs CASCADE; block executions -> execution CASCADE;
 *   routine/workout/template opcionales en ejecuciones SET NULL;
 *   program_routines es tabla de enlace CASCADE en ambos lados + UNIQUE(programId, routineId).
 * - Los executions guardan snapshots (workoutNameSnapshot, etc.) para que el
 *   histórico no cambie si se renombra un template.
 */
export class Fase4Workouts1794019149030 implements MigrationInterface {
    name = 'Fase4Workouts1794019149030';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "metric_block_type" AS ENUM ('distance', 'duration', 'reps')`);

        await queryRunner.query(`
            CREATE TABLE "workout_routines" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "name" varchar(255) NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_workout_routines" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "workout_templates" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "routineId" uuid NOT NULL,
                "name" varchar(255) NOT NULL,
                "type" varchar(50) NOT NULL,
                "order" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_workout_templates" PRIMARY KEY ("id"),
                CONSTRAINT "FK_workout_templates_routine" FOREIGN KEY ("routineId") REFERENCES "workout_routines" ("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_workout_templates_routineId" ON "workout_templates" ("routineId")`);

        await queryRunner.query(`
            CREATE TABLE "workout_block_templates" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "workoutId" uuid NOT NULL,
                "kind" varchar(50) NOT NULL,
                "name" varchar(255) NOT NULL,
                "rounds" integer NOT NULL DEFAULT 1,
                "metricType" "metric_block_type" NOT NULL,
                "targetDistanceMeters" double precision,
                "targetDurationSeconds" integer,
                "targetReps" integer,
                "order" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_workout_block_templates" PRIMARY KEY ("id"),
                CONSTRAINT "FK_workout_block_templates_workout" FOREIGN KEY ("workoutId") REFERENCES "workout_templates" ("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_workout_block_templates_workoutId" ON "workout_block_templates" ("workoutId")`);

        await queryRunner.query(`
            CREATE TABLE "workout_executions" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "dailyLogId" uuid NOT NULL,
                "routineId" uuid,
                "workoutId" uuid,
                "workoutNameSnapshot" varchar(255) NOT NULL,
                "workoutTypeSnapshot" varchar(50) NOT NULL,
                "totalDistanceMeters" double precision NOT NULL DEFAULT 0,
                "totalDurationSeconds" integer NOT NULL DEFAULT 0,
                "totalRounds" integer NOT NULL DEFAULT 0,
                "completed" boolean NOT NULL DEFAULT false,
                "notes" text,
                CONSTRAINT "PK_workout_executions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_workout_executions_daily_log" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_workout_executions_routine" FOREIGN KEY ("routineId") REFERENCES "workout_routines" ("id") ON DELETE SET NULL,
                CONSTRAINT "FK_workout_executions_workout" FOREIGN KEY ("workoutId") REFERENCES "workout_templates" ("id") ON DELETE SET NULL
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_workout_executions_dailyLogId" ON "workout_executions" ("dailyLogId")`);

        await queryRunner.query(`
            CREATE TABLE "workout_block_executions" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "executionId" uuid NOT NULL,
                "templateId" uuid,
                "kindSnapshot" varchar(50) NOT NULL,
                "nameSnapshot" varchar(255) NOT NULL,
                "metricTypeSnapshot" "metric_block_type" NOT NULL,
                "plannedRounds" integer NOT NULL DEFAULT 0,
                "actualRounds" integer NOT NULL DEFAULT 0,
                "targetDistanceMeters" double precision,
                "actualDistanceMeters" double precision,
                "targetDurationSeconds" integer,
                "actualDurationSeconds" integer,
                "targetReps" integer,
                "actualReps" integer,
                "completed" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_workout_block_executions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_workout_block_executions_execution" FOREIGN KEY ("executionId") REFERENCES "workout_executions" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_workout_block_executions_template" FOREIGN KEY ("templateId") REFERENCES "workout_block_templates" ("id") ON DELETE SET NULL
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_workout_block_executions_executionId" ON "workout_block_executions" ("executionId")`);

        await queryRunner.query(`
            CREATE TABLE "program_routines" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "programId" uuid NOT NULL,
                "routineId" uuid NOT NULL,
                "order" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_program_routines" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_program_routines_program_routine" UNIQUE ("programId", "routineId"),
                CONSTRAINT "FK_program_routines_program" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_program_routines_routine" FOREIGN KEY ("routineId") REFERENCES "workout_routines" ("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_program_routines_programId" ON "program_routines" ("programId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "program_routines"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workout_block_executions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workout_executions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workout_block_templates"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workout_templates"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workout_routines"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "metric_block_type"`);
    }
}
