import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 6 — Limpieza final.
 * Elimina las tablas legacy cut_phase_days y cut_phases.
 * Sus datos fueron migrados en la Fase 1 a programs, program_days,
 * program_metric_targets y program_measurements (mismos ids para programs).
 *
 * Fase 1 migró:
 *   cut_phases      -> programs (mismo id) + program_metric_targets + program_days
 *   cut_phase_days  -> program_days
 *   weight_logs     -> weight_log_metrics
 *   daily_logs      -> daily_log_metrics
 * por lo que estas tablas ya no son necesarias.
 */
export class Fase6DropCutPhases1794026636747 implements MigrationInterface {
    name = 'Fase6DropCutPhases1794026636747';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "cut_phase_days"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cut_phases"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recrea las tablas vacías (los datos migrados viven en programs).
        // Los valores por defecto replican el schema del baseline.
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cut_phases" (
            "id" uuid NOT NULL DEFAULT gen_random_uuid(),
            "startDate" date NOT NULL,
            "endDate" date NOT NULL,
            "totalWeeks" integer NOT NULL,
            "targetCalories" double precision NOT NULL,
            "targetProtein" double precision NOT NULL,
            "targetSteps" integer NOT NULL,
            "targetWater" double precision NOT NULL,
            "workoutsPerWeek" integer NOT NULL,
            "initialWeight" double precision,
            "initialWaist" double precision,
            "initialHips" double precision,
            "initialBodyfat" double precision,
            "isActive" boolean NOT NULL DEFAULT true,
            "createdAt" timestamp NOT NULL DEFAULT now(),
            "updatedAt" timestamp NOT NULL DEFAULT now(),
            "weeklyTargetSteps" integer,
            CONSTRAINT "PK_cut_phases" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cut_phase_days" (
            "id" uuid NOT NULL DEFAULT gen_random_uuid(),
            "date" date NOT NULL,
            "weekNumber" integer NOT NULL DEFAULT 0,
            "caloriesMet" boolean NOT NULL DEFAULT false,
            "proteinMet" boolean NOT NULL DEFAULT false,
            "stepsMet" boolean NOT NULL DEFAULT false,
            "waterMet" boolean NOT NULL DEFAULT false,
            "workoutMet" boolean NOT NULL DEFAULT false,
            "dailyScore" integer NOT NULL DEFAULT 0,
            "allMet" boolean NOT NULL DEFAULT false,
            "cutPhaseId" uuid NOT NULL,
            CONSTRAINT "PK_cut_phase_days" PRIMARY KEY ("id"),
            CONSTRAINT "FK_cut_phase_days_cut_phases" FOREIGN KEY ("cutPhaseId") REFERENCES "cut_phases" ("id")
        )`);
    }
}
