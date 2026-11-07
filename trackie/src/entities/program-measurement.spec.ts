import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { Fase1ModularMetrics1794017539549 } from '../migrations/1794017539549-Fase1ModularMetrics';
import { MetricType } from './metric-type.entity';
import { DailyLogMetric } from './daily-log-metric.entity';
import { DailyLog } from './dailylog.entity';
import { Program } from './program.entity';
import { ProgramMetricTarget } from './program-metric-target.entity';
import { ProgramDay } from './program-day.entity';
import { BodyMetricType } from './body-metric-type.entity';
import { WeightLogMetric } from './weight-log-metric.entity';
import { WeightLog } from './weightlog.entity';
import { ProgramMeasurement } from './program-measurement.entity';
import { ProgramMeasurementKind } from '../enums/program-measurement-kind.enum';
import { ProgramKind } from '../enums/program-kind.enum';

/**
 * Verifica que el UNIQUE(programId, bodyMetricTypeId, kind) de program_measurements
 * rechaza una tercera fila para el mismo (programId, bodyMetricTypeId).
 *
 * Requiere un Postgres disponible (por defecto el contenedor local de desarrollo):
 *   TEST_ADMIN_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres
 */
const ADMIN_URL = process.env.TEST_ADMIN_DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:5433/postgres';
const TEST_DB = 'trackie_test_program_measurements';
const TEST_URL = ADMIN_URL.replace(/\/[^/]+$/, `/${TEST_DB}`);

describe('ProgramMeasurement unique constraint', () => {
    let dataSource: DataSource;
    let admin: Client;

    beforeAll(async () => {
        admin = new Client({ connectionString: ADMIN_URL, connectionTimeoutMillis: 5000 });
        try {
            await admin.connect();
        } catch (error) {
            throw new Error(
                `No se pudo conectar a Postgres en ${ADMIN_URL}. ` +
                `Levanta el contenedor de desarrollo (docker start trackie_fase1_pg) ` +
                `o define TEST_ADMIN_DATABASE_URL. Causa: ${(error as Error).message}`,
            );
        }
        await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
        await admin.query(`CREATE DATABASE ${TEST_DB}`);

        dataSource = new DataSource({
            type: 'postgres',
            url: TEST_URL,
            entities: [MetricType, DailyLogMetric, DailyLog, Program, ProgramMetricTarget, ProgramDay, BodyMetricType, WeightLogMetric, WeightLog, ProgramMeasurement],
            migrations: [Fase1ModularMetrics1794017539549],
            synchronize: false,
        });
        await dataSource.initialize();
        await dataSource.runMigrations();
    }, 60000);

    afterAll(async () => {
        if (dataSource?.isInitialized) await dataSource.destroy();
        if (admin) {
            await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
            await admin.end();
        }
    }, 60000);

    it('rechaza una tercera fila para el mismo (programId, bodyMetricTypeId)', async () => {
        const programRepo = dataSource.getRepository(Program);
        const weightLogRepo = dataSource.getRepository(WeightLog);
        const bodyMetricTypeRepo = dataSource.getRepository(BodyMetricType);
        const measurementRepo = dataSource.getRepository(ProgramMeasurement);

        const weightType = await bodyMetricTypeRepo.findOneByOrFail({ key: 'weight' });

        const program = await programRepo.save(
            programRepo.create({
                name: 'Test Program',
                kind: ProgramKind.CUT,
                startDate: '2026-01-01',
                endDate: '2026-03-01',
                totalWeeks: 8,
                workoutsPerWeek: 4,
                isActive: true,
            }),
        );

        const firstLog = await weightLogRepo.save(weightLogRepo.create({ date: '2026-01-05' }));
        const lastLog = await weightLogRepo.save(weightLogRepo.create({ date: '2026-02-20' }));
        const thirdLog = await weightLogRepo.save(weightLogRepo.create({ date: '2026-02-25' }));

        // first + last: las dos filas permitidas
        await measurementRepo.save(
            measurementRepo.create({
                programId: program.id,
                bodyMetricTypeId: weightType.id,
                weightLogId: firstLog.id,
                kind: ProgramMeasurementKind.FIRST,
                value: 80,
                date: '2026-01-05',
            }),
        );
        await measurementRepo.save(
            measurementRepo.create({
                programId: program.id,
                bodyMetricTypeId: weightType.id,
                weightLogId: lastLog.id,
                kind: ProgramMeasurementKind.LAST,
                value: 78,
                date: '2026-02-20',
            }),
        );

        // Tercera fila (mismo kind='first'): debe fallar por el UNIQUE
        await expect(
            measurementRepo.save(
                measurementRepo.create({
                    programId: program.id,
                    bodyMetricTypeId: weightType.id,
                    weightLogId: thirdLog.id,
                    kind: ProgramMeasurementKind.FIRST,
                    value: 85,
                    date: '2026-02-25',
                }),
            ),
        ).rejects.toThrow(/UQ_program_measurements_program_metric_kind|duplicate key|23505/);

        const count = await measurementRepo.count({
            where: { programId: program.id, bodyMetricTypeId: weightType.id },
        });
        expect(count).toBe(2);
    });
});
