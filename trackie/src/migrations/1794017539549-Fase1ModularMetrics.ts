import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 1 — Modelo modular basado en metric types.
 *
 * 1. Si la BD está vacía (no existe `daily_logs`), crea el baseline del schema
 *    antiguo para que un deploy desde cero funcione.
 * 2. Crea las nuevas tablas/enums/uniques/índices:
 *    metric_types, daily_log_metrics, programs, program_metric_targets,
 *    program_days, body_metric_types, weight_log_metrics, program_measurements.
 * 3. Seedea métricas universales y body metric types.
 * 4. Migra datos:
 *    - daily_logs(calories, steps, proteinGrams, waterLiters, workout)
 *      -> daily_log_metrics
 *    - weight_logs(weight, bodyfat, waist, hips) -> weight_log_metrics
 *    - cut_phases -> programs (mismo id, kind='cut') + program_metric_targets
 *      (calories .30 at_most, protein .30 at_least, steps .25 at_least,
 *       water .10 at_least, workout_count .05 at_least target 1)
 *    - cut_phase_days -> program_days (solo fechas con daily_log)
 *    - backfill program_measurements (first/last por programa y body metric)
 * 5. Elimina las columnas migradas. `cut_phases`/`cut_phase_days` se conservan
 *    hasta la Fase 6.
 */
export class Fase1ModularMetrics1794017539549 implements MigrationInterface {
    name = 'Fase1ModularMetrics1794017539549';

    private async hasTable(queryRunner: QueryRunner, table: string): Promise<boolean> {
        const rows = await queryRunner.query(`SELECT to_regclass($1) AS t`, [`public.${table}`]);
        return rows[0]?.t !== null && rows[0]?.t !== undefined;
    }

    private async hasColumn(queryRunner: QueryRunner, table: string, column: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
            [table, column],
        );
        return rows.length > 0;
    }

    private async hasUniqueConstraintOn(queryRunner: QueryRunner, table: string, expression: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT 1
               FROM pg_constraint c
               JOIN pg_class t ON t.oid = c.conrelid
              WHERE t.relname = $1
                AND c.contype = 'u'
                AND pg_get_constraintdef(c.oid) LIKE $2`,
            [table, `%${expression}%`],
        );
        return rows.length > 0;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ------------------------------------------------------------------
        // 0. Baseline del schema antiguo si la BD está vacía
        // ------------------------------------------------------------------
        const dailyLogsExist = await this.hasTable(queryRunner, 'daily_logs');
        if (!dailyLogsExist) {
            await this.createBaselineSchema(queryRunner);
        }

        // ------------------------------------------------------------------
        // 1. Enums nuevos
        // ------------------------------------------------------------------
        await queryRunner.query(`CREATE TYPE "metric_types_type_enum" AS ENUM ('boolean', 'number', 'duration')`);
        await queryRunner.query(`CREATE TYPE "metric_types_unit_enum" AS ENUM ('kcal', 'min', 'pasos', 'litros', 'gramos', 'kg', 'cm', 'percent', 'km', 'unidad')`);
        await queryRunner.query(`CREATE TYPE "body_metric_types_type_enum" AS ENUM ('boolean', 'number', 'duration')`);
        await queryRunner.query(`CREATE TYPE "body_metric_types_unit_enum" AS ENUM ('kcal', 'min', 'pasos', 'litros', 'gramos', 'kg', 'cm', 'percent', 'km', 'unidad')`);
        await queryRunner.query(`CREATE TYPE "programs_kind_enum" AS ENUM ('cut', 'bulk', 'maintain')`);
        await queryRunner.query(`CREATE TYPE "program_metric_targets_direction_enum" AS ENUM ('at_least', 'at_most', 'exact')`);
        await queryRunner.query(`CREATE TYPE "program_measurements_kind_enum" AS ENUM ('first', 'last')`);

        // ------------------------------------------------------------------
        // 2. Tablas nuevas
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE "metric_types" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "key" varchar(50) NOT NULL,
                "label" varchar(100) NOT NULL,
                "type" "metric_types_type_enum" NOT NULL,
                "unit" "metric_types_unit_enum" NOT NULL,
                "isUniversal" boolean NOT NULL DEFAULT false,
                "isDerived" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_metric_types" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_metric_types_key" UNIQUE ("key")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "daily_log_metrics" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "dailyLogId" uuid NOT NULL,
                "metricTypeId" uuid NOT NULL,
                "value" double precision,
                CONSTRAINT "PK_daily_log_metrics" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_daily_log_metrics_log_metric" UNIQUE ("dailyLogId", "metricTypeId"),
                CONSTRAINT "FK_daily_log_metrics_log" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_daily_log_metrics_metric" FOREIGN KEY ("metricTypeId") REFERENCES "metric_types" ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_daily_log_metrics_dailyLogId" ON "daily_log_metrics" ("dailyLogId")`);

        await queryRunner.query(`
            CREATE TABLE "programs" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "name" character varying NOT NULL,
                "kind" "programs_kind_enum" NOT NULL,
                "startDate" date NOT NULL,
                "endDate" date NOT NULL,
                "totalWeeks" integer NOT NULL,
                "workoutsPerWeek" integer NOT NULL DEFAULT 0,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_programs" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "program_metric_targets" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "programId" uuid NOT NULL,
                "metricTypeId" uuid NOT NULL,
                "target" double precision NOT NULL,
                "direction" "program_metric_targets_direction_enum" NOT NULL,
                "weight" double precision NOT NULL,
                "isOptional" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_program_metric_targets" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_program_metric_targets_program_metric" UNIQUE ("programId", "metricTypeId"),
                CONSTRAINT "FK_program_metric_targets_program" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_program_metric_targets_metric" FOREIGN KEY ("metricTypeId") REFERENCES "metric_types" ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "program_days" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "programId" uuid NOT NULL,
                "date" date NOT NULL,
                "weekNumber" integer NOT NULL,
                "dailyLogId" uuid NOT NULL,
                "dailyScore" integer NOT NULL DEFAULT 0,
                "allMet" boolean NOT NULL DEFAULT false,
                "metricResults" jsonb NOT NULL DEFAULT '{}',
                CONSTRAINT "PK_program_days" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_program_days_program_date" UNIQUE ("programId", "date"),
                CONSTRAINT "FK_program_days_program" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_program_days_daily_log" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs" ("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "body_metric_types" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "key" varchar(50) NOT NULL,
                "label" varchar(100) NOT NULL,
                "type" "body_metric_types_type_enum" NOT NULL,
                "unit" "body_metric_types_unit_enum" NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_body_metric_types" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_body_metric_types_key" UNIQUE ("key")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "weight_log_metrics" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "weightLogId" uuid NOT NULL,
                "bodyMetricTypeId" uuid NOT NULL,
                "value" double precision NOT NULL,
                CONSTRAINT "PK_weight_log_metrics" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_weight_log_metrics_log_metric" UNIQUE ("weightLogId", "bodyMetricTypeId"),
                CONSTRAINT "FK_weight_log_metrics_log" FOREIGN KEY ("weightLogId") REFERENCES "weight_logs" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_weight_log_metrics_metric" FOREIGN KEY ("bodyMetricTypeId") REFERENCES "body_metric_types" ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_weight_log_metrics_weightLogId" ON "weight_log_metrics" ("weightLogId")`);

        await queryRunner.query(`
            CREATE TABLE "program_measurements" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "programId" uuid NOT NULL,
                "bodyMetricTypeId" uuid NOT NULL,
                "weightLogId" uuid NOT NULL,
                "kind" "program_measurements_kind_enum" NOT NULL,
                "value" double precision NOT NULL,
                "date" date NOT NULL,
                CONSTRAINT "PK_program_measurements" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_program_measurements_program_metric_kind" UNIQUE ("programId", "bodyMetricTypeId", "kind"),
                CONSTRAINT "FK_program_measurements_program" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_program_measurements_metric" FOREIGN KEY ("bodyMetricTypeId") REFERENCES "body_metric_types" ("id"),
                CONSTRAINT "FK_program_measurements_weight_log" FOREIGN KEY ("weightLogId") REFERENCES "weight_logs" ("id") ON DELETE CASCADE
            )
        `);

        // ------------------------------------------------------------------
        // 3. Seed: métricas universales y body metric types
        // ------------------------------------------------------------------
        await queryRunner.query(`
            INSERT INTO "metric_types" ("key", "label", "type", "unit", "isUniversal", "isDerived", "isActive") VALUES
                ('calories',              'Calorías',                    'number',   'kcal',   true, false, true),
                ('protein',               'Proteína',                    'number',   'gramos', true, false, true),
                ('steps',                 'Pasos',                       'number',   'pasos',  true, false, true),
                ('water',                 'Agua',                        'number',   'litros', true, false, true),
                ('workout_count',         'Entrenamientos',              'number',   'unidad', true, true,  true),
                ('workout_total_km',      'Distancia total (km)',        'number',   'km',     true, true,  true),
                ('workout_total_minutes', 'Tiempo de entrenamiento',     'duration', 'min',    true, true,  true)
            ON CONFLICT ("key") DO NOTHING
        `);

        await queryRunner.query(`
            INSERT INTO "body_metric_types" ("key", "label", "type", "unit", "isActive") VALUES
                ('weight',  'Peso',            'number', 'kg',      true),
                ('bodyfat', 'Grasa corporal',  'number', 'percent', true),
                ('waist',   'Cintura',         'number', 'cm',      true),
                ('hips',    'Cadera',          'number', 'cm',      true)
            ON CONFLICT ("key") DO NOTHING
        `);

        // ------------------------------------------------------------------
        // 4. Migración de datos
        // ------------------------------------------------------------------
        // 4a. daily_logs -> daily_log_metrics
        if (await this.hasColumn(queryRunner, 'daily_logs', 'calories')) {
            const migrations: Array<[string, string]> = [
                ['calories', 'calories'],
                ['protein', '"proteinGrams"'],
                ['steps', '"steps"'],
                ['water', '"waterLiters"'],
            ];
            for (const [key, column] of migrations) {
                await queryRunner.query(`
                    INSERT INTO "daily_log_metrics" ("dailyLogId", "metricTypeId", "value")
                    SELECT d."id", m."id", d.${column}::double precision
                      FROM "daily_logs" d
                      JOIN "metric_types" m ON m."key" = '${key}'
                    ON CONFLICT ("dailyLogId", "metricTypeId") DO NOTHING
                `);
            }
            // workout: cualquier valor != 'none' cuenta como 1 entrenamiento
            await queryRunner.query(`
                INSERT INTO "daily_log_metrics" ("dailyLogId", "metricTypeId", "value")
                SELECT d."id", m."id", CASE WHEN d."workout"::text = 'none' THEN 0 ELSE 1 END::double precision
                  FROM "daily_logs" d
                  JOIN "metric_types" m ON m."key" = 'workout_count'
                ON CONFLICT ("dailyLogId", "metricTypeId") DO NOTHING
            `);
            await queryRunner.query(`ALTER TABLE "daily_logs" DROP COLUMN "calories", DROP COLUMN "steps", DROP COLUMN "proteinGrams", DROP COLUMN "waterLiters", DROP COLUMN "workout"`);
            await queryRunner.query(`DROP TYPE IF EXISTS "daily_logs_workout_enum"`);
        }

        // 4b. weight_logs.date UNIQUE
        if (!(await this.hasUniqueConstraintOn(queryRunner, 'weight_logs', '(date)'))) {
            await queryRunner.query(`ALTER TABLE "weight_logs" ADD CONSTRAINT "UQ_weight_logs_date" UNIQUE ("date")`);
        }

        // 4c. weight_logs -> weight_log_metrics
        if (await this.hasColumn(queryRunner, 'weight_logs', 'weight')) {
            // weight es NOT NULL: siempre se migra
            await queryRunner.query(`
                INSERT INTO "weight_log_metrics" ("weightLogId", "bodyMetricTypeId", "value")
                SELECT w."id", bmt."id", w."weight"::double precision
                  FROM "weight_logs" w
                  JOIN "body_metric_types" bmt ON bmt."key" = 'weight'
                ON CONFLICT ("weightLogId", "bodyMetricTypeId") DO NOTHING
            `);
            const optionalMetrics: Array<[string, string]> = [
                ['bodyfat', 'bodyfat'],
                ['waist', 'waist'],
                ['hips', 'hips'],
            ];
            for (const [key, column] of optionalMetrics) {
                await queryRunner.query(`
                    INSERT INTO "weight_log_metrics" ("weightLogId", "bodyMetricTypeId", "value")
                    SELECT w."id", bmt."id", w."${column}"::double precision
                      FROM "weight_logs" w
                      JOIN "body_metric_types" bmt ON bmt."key" = '${key}'
                     WHERE w."${column}" IS NOT NULL
                    ON CONFLICT ("weightLogId", "bodyMetricTypeId") DO NOTHING
                `);
            }
            await queryRunner.query(`ALTER TABLE "weight_logs" DROP COLUMN "weight", DROP COLUMN "bodyfat", DROP COLUMN "waist", DROP COLUMN "hips"`);
        }

        // 4d. cut_phases -> programs (+ targets y days). Se conservan las tablas cut_* hasta Fase 6.
        if (await this.hasTable(queryRunner, 'cut_phases')) {
            // Mismos ids para simplificar la trazabilidad
            await queryRunner.query(`
                INSERT INTO "programs" ("id", "name", "kind", "startDate", "endDate", "totalWeeks", "workoutsPerWeek", "isActive", "createdAt", "updatedAt")
                SELECT c."id",
                       'Cut Phase ' || c."startDate"::text || ' - ' || c."endDate"::text,
                       'cut',
                       c."startDate",
                       c."endDate",
                       c."totalWeeks",
                       c."workoutsPerWeek",
                       c."isActive",
                       c."createdAt",
                       c."updatedAt"
                  FROM "cut_phases" c
                ON CONFLICT ("id") DO NOTHING
            `);

            await queryRunner.query(`
                INSERT INTO "program_metric_targets" ("programId", "metricTypeId", "target", "direction", "weight", "isOptional")
                SELECT p."id", m."id", t."target", t."direction"::"program_metric_targets_direction_enum", t."weight", false
                  FROM "programs" p
                  JOIN "cut_phases" c ON c."id" = p."id"
                  CROSS JOIN LATERAL (VALUES
                      ('calories',      c."targetCalories"::double precision, 'at_most',  0.30),
                      ('protein',       c."targetProtein"::double precision,  'at_least', 0.30),
                      ('steps',         c."targetSteps"::double precision,    'at_least', 0.25),
                      ('water',         c."targetWater"::double precision,    'at_least', 0.10),
                      ('workout_count', 1::double precision,                  'at_least', 0.05)
                  ) AS t("key", "target", "direction", "weight")
                  JOIN "metric_types" m ON m."key" = t."key"
                ON CONFLICT ("programId", "metricTypeId") DO NOTHING
            `);

            // Solo fechas con daily_log (los cut_phase_days sin log se descartan)
            await queryRunner.query(`
                INSERT INTO "program_days" ("programId", "date", "weekNumber", "dailyLogId", "dailyScore", "allMet", "metricResults")
                SELECT d."cutPhaseId",
                       d."date",
                       d."weekNumber",
                       l."id",
                       d."dailyScore",
                       d."allMet",
                       jsonb_build_object(
                           'calories', d."caloriesMet",
                           'protein', d."proteinMet",
                           'steps', d."stepsMet",
                           'water', d."waterMet",
                           'workout_count', d."workoutMet"
                       )
                  FROM "cut_phase_days" d
                  JOIN "daily_logs" l ON l."date" = d."date"
                ON CONFLICT ("programId", "date") DO NOTHING
            `);

            // Backfill program_measurements (first/last) por programa y body metric type
            await queryRunner.query(`
                INSERT INTO "program_measurements" ("programId", "bodyMetricTypeId", "weightLogId", "kind", "value", "date")
                SELECT p."id", bmt."id", first_log."weightLogId", 'first', first_log."value", first_log."date"
                  FROM "programs" p
                  JOIN "body_metric_types" bmt
                    ON EXISTS (
                        SELECT 1
                          FROM "weight_log_metrics" wlm
                          JOIN "weight_logs" wl ON wl."id" = wlm."weightLogId"
                         WHERE wlm."bodyMetricTypeId" = bmt."id"
                           AND wl."date" BETWEEN p."startDate" AND p."endDate"
                    )
                  CROSS JOIN LATERAL (
                        SELECT wlm."weightLogId", wlm."value", wl."date"
                          FROM "weight_log_metrics" wlm
                          JOIN "weight_logs" wl ON wl."id" = wlm."weightLogId"
                         WHERE wlm."bodyMetricTypeId" = bmt."id"
                           AND wl."date" BETWEEN p."startDate" AND p."endDate"
                         ORDER BY wl."date" ASC, wlm."weightLogId" ASC
                         LIMIT 1
                  ) AS first_log
                ON CONFLICT ("programId", "bodyMetricTypeId", "kind") DO NOTHING
            `);

            await queryRunner.query(`
                INSERT INTO "program_measurements" ("programId", "bodyMetricTypeId", "weightLogId", "kind", "value", "date")
                SELECT p."id", bmt."id", last_log."weightLogId", 'last', last_log."value", last_log."date"
                  FROM "programs" p
                  JOIN "body_metric_types" bmt
                    ON EXISTS (
                        SELECT 1
                          FROM "weight_log_metrics" wlm
                          JOIN "weight_logs" wl ON wl."id" = wlm."weightLogId"
                         WHERE wlm."bodyMetricTypeId" = bmt."id"
                           AND wl."date" BETWEEN p."startDate" AND p."endDate"
                    )
                  CROSS JOIN LATERAL (
                        SELECT wlm."weightLogId", wlm."value", wl."date"
                          FROM "weight_log_metrics" wlm
                          JOIN "weight_logs" wl ON wl."id" = wlm."weightLogId"
                         WHERE wlm."bodyMetricTypeId" = bmt."id"
                           AND wl."date" BETWEEN p."startDate" AND p."endDate"
                         ORDER BY wl."date" DESC, wlm."weightLogId" DESC
                         LIMIT 1
                  ) AS last_log
                ON CONFLICT ("programId", "bodyMetricTypeId", "kind") DO NOTHING
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restaura las columnas antiguas de daily_logs y weight_logs a partir de las métricas
        if (!(await this.hasColumn(queryRunner, 'daily_logs', 'calories'))) {
            await queryRunner.query(`CREATE TYPE "daily_logs_workout_enum" AS ENUM ('none', 'upper', 'lower', 'full', 'cardio')`);
            await queryRunner.query(`
                ALTER TABLE "daily_logs"
                  ADD COLUMN "calories" integer NOT NULL DEFAULT 0,
                  ADD COLUMN "steps" integer NOT NULL DEFAULT 0,
                  ADD COLUMN "proteinGrams" double precision NOT NULL DEFAULT 0,
                  ADD COLUMN "waterLiters" double precision NOT NULL DEFAULT 0,
                  ADD COLUMN "workout" "daily_logs_workout_enum" NOT NULL DEFAULT 'none'
            `);
            await queryRunner.query(`
                UPDATE "daily_logs" d SET
                    "calories" = COALESCE((SELECT m."value" FROM "daily_log_metrics" m JOIN "metric_types" mt ON mt."id" = m."metricTypeId" WHERE m."dailyLogId" = d."id" AND mt."key" = 'calories'), 0)::integer,
                    "steps" = COALESCE((SELECT m."value" FROM "daily_log_metrics" m JOIN "metric_types" mt ON mt."id" = m."metricTypeId" WHERE m."dailyLogId" = d."id" AND mt."key" = 'steps'), 0)::integer,
                    "proteinGrams" = COALESCE((SELECT m."value" FROM "daily_log_metrics" m JOIN "metric_types" mt ON mt."id" = m."metricTypeId" WHERE m."dailyLogId" = d."id" AND mt."key" = 'protein'), 0),
                    "waterLiters" = COALESCE((SELECT m."value" FROM "daily_log_metrics" m JOIN "metric_types" mt ON mt."id" = m."metricTypeId" WHERE m."dailyLogId" = d."id" AND mt."key" = 'water'), 0),
                    "workout" = CASE WHEN COALESCE((SELECT m."value" FROM "daily_log_metrics" m JOIN "metric_types" mt ON mt."id" = m."metricTypeId" WHERE m."dailyLogId" = d."id" AND mt."key" = 'workout_count'), 0) > 0 THEN 'full'::"daily_logs_workout_enum" ELSE 'none'::"daily_logs_workout_enum" END
            `);
        }

        if (!(await this.hasColumn(queryRunner, 'weight_logs', 'weight'))) {
            await queryRunner.query(`
                ALTER TABLE "weight_logs"
                  ADD COLUMN "weight" double precision,
                  ADD COLUMN "bodyfat" double precision,
                  ADD COLUMN "waist" double precision,
                  ADD COLUMN "hips" double precision
            `);
            await queryRunner.query(`
                UPDATE "weight_logs" w SET
                    "weight" = (SELECT m."value" FROM "weight_log_metrics" m JOIN "body_metric_types" bmt ON bmt."id" = m."bodyMetricTypeId" WHERE m."weightLogId" = w."id" AND bmt."key" = 'weight'),
                    "bodyfat" = (SELECT m."value" FROM "weight_log_metrics" m JOIN "body_metric_types" bmt ON bmt."id" = m."bodyMetricTypeId" WHERE m."weightLogId" = w."id" AND bmt."key" = 'bodyfat'),
                    "waist" = (SELECT m."value" FROM "weight_log_metrics" m JOIN "body_metric_types" bmt ON bmt."id" = m."bodyMetricTypeId" WHERE m."weightLogId" = w."id" AND bmt."key" = 'waist'),
                    "hips" = (SELECT m."value" FROM "weight_log_metrics" m JOIN "body_metric_types" bmt ON bmt."id" = m."bodyMetricTypeId" WHERE m."weightLogId" = w."id" AND bmt."key" = 'hips')
            `);
            await queryRunner.query(`ALTER TABLE "weight_logs" ALTER COLUMN "weight" SET NOT NULL`);
        }

        // Eliminar las tablas/enums nuevos. Los datos de programs/program_days NO se
        // vuelcan a cut_phases (cut_phases sigue intacta tras la Fase 1).
        await queryRunner.query(`DROP TABLE IF EXISTS "program_measurements"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "program_days"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "program_metric_targets"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "programs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "weight_log_metrics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "daily_log_metrics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "metric_types"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "body_metric_types"`);

        await queryRunner.query(`DROP TYPE IF EXISTS "program_measurements_kind_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "program_metric_targets_direction_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "programs_kind_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "body_metric_types_unit_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "body_metric_types_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "metric_types_unit_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "metric_types_type_enum"`);

        await queryRunner.query(`ALTER TABLE "weight_logs" DROP CONSTRAINT IF EXISTS "UQ_weight_logs_date"`);
    }

    /**
     * Schema completo del estado anterior a la Fase 1 (el que gestionaba
     * synchronize). Solo se ejecuta si la BD no tiene `daily_logs`.
     */
    private async createBaselineSchema(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "daily_logs_workout_enum" AS ENUM ('none', 'upper', 'lower', 'full', 'cardio')`);
        await queryRunner.query(`CREATE TYPE "planned_meals_mealtype_enum" AS ENUM ('desayuno', 'almuerzo', 'cena', 'snack')`);
        await queryRunner.query(`CREATE TYPE "shopping_items_status_enum" AS ENUM ('pendiente', 'comprado')`);
        await queryRunner.query(`CREATE TYPE "shopping_items_unitofmeasure_enum" AS ENUM ('kg', 'g', 'mg', 'lb', 'L', 'mL', 'unidad', 'docena')`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "settings" (
                "id" integer NOT NULL,
                "weekStartDay" integer NOT NULL DEFAULT 5,
                "calorieLimit" integer NOT NULL DEFAULT 1800,
                "stepsLimit" integer NOT NULL DEFAULT 10000,
                "targetWeight" double precision NOT NULL DEFAULT '60',
                "startWeight" double precision NOT NULL DEFAULT '70',
                CONSTRAINT "PK_settings" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "settings_id_seq" AS integer START WITH 1 INCREMENT BY 1`);
        await queryRunner.query(`ALTER SEQUENCE "settings_id_seq" OWNED BY "settings"."id"`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "id" SET DEFAULT nextval('"settings_id_seq"')`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "dishes" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "name" varchar(255) NOT NULL,
                "description" text,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_dishes" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "day_plans" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "date" date NOT NULL,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_day_plans" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_day_plans_date" UNIQUE ("date")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "planned_meals" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "mealType" "planned_meals_mealtype_enum" NOT NULL,
                "time" time without time zone NOT NULL,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                "dayPlanId" uuid,
                CONSTRAINT "PK_planned_meals" PRIMARY KEY ("id"),
                CONSTRAINT "FK_planned_meals_dayPlan" FOREIGN KEY ("dayPlanId") REFERENCES "day_plans" ("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "planned_meal_dishes" (
                "planned_meal_id" uuid NOT NULL,
                "dish_id" uuid NOT NULL,
                CONSTRAINT "PK_planned_meal_dishes" PRIMARY KEY ("planned_meal_id", "dish_id"),
                CONSTRAINT "FK_planned_meal_dishes_meal" FOREIGN KEY ("planned_meal_id") REFERENCES "planned_meals" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
                CONSTRAINT "FK_planned_meal_dishes_dish" FOREIGN KEY ("dish_id") REFERENCES "dishes" ("id") ON UPDATE CASCADE ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_planned_meal_dishes_planned_meal_id" ON "planned_meal_dishes" ("planned_meal_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_planned_meal_dishes_dish_id" ON "planned_meal_dishes" ("dish_id")`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "shopping_lists" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "startDate" date NOT NULL,
                "endDate" date NOT NULL,
                "totalCost" double precision NOT NULL DEFAULT '0',
                "totalItems" integer NOT NULL DEFAULT 0,
                "completionPercentage" double precision NOT NULL DEFAULT '0',
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_shopping_lists" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "shopping_items" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "name" varchar(255) NOT NULL,
                "unitOfMeasure" "shopping_items_unitofmeasure_enum" NOT NULL DEFAULT 'unidad',
                "quantity" double precision NOT NULL,
                "unitPrice" double precision NOT NULL,
                "totalPrice" double precision NOT NULL DEFAULT '0',
                "status" "shopping_items_status_enum" NOT NULL DEFAULT 'pendiente',
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                "shoppingListId" uuid,
                CONSTRAINT "PK_shopping_items" PRIMARY KEY ("id"),
                CONSTRAINT "FK_shopping_items_shopping_lists" FOREIGN KEY ("shoppingListId") REFERENCES "shopping_lists" ("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cut_phases" (
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
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cut_phase_days" (
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
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "daily_logs" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "date" date NOT NULL,
                "calories" integer NOT NULL DEFAULT 0,
                "steps" integer NOT NULL DEFAULT 0,
                "workout" "daily_logs_workout_enum" NOT NULL DEFAULT 'none',
                "proteinGrams" double precision NOT NULL DEFAULT '0',
                "waterLiters" double precision NOT NULL DEFAULT '0',
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_daily_logs" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_daily_logs_date" UNIQUE ("date")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "weight_logs" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "date" date NOT NULL,
                "weight" double precision NOT NULL,
                "bodyfat" double precision,
                "hips" double precision,
                "waist" double precision,
                "photos" json,
                CONSTRAINT "PK_weight_logs" PRIMARY KEY ("id")
            )
        `);
    }
}
