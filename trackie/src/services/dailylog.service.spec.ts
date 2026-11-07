import { BadRequestException } from '@nestjs/common';
import { DailyLogService } from './dailylog.service';
import { MetricType } from '../entities/metric-type.entity';
import { DailyLog } from '../entities/dailylog.entity';
import { DailyLogMetric } from '../entities/daily-log-metric.entity';
import { MetricValueType } from '../enums/metric-value-type.enum';
import { MetricTypeUnit } from '../enums/metric-type-unit.enum';

const metric = (partial: Partial<MetricType>): MetricType =>
    ({
        id: partial.id ?? partial.key,
        key: partial.key,
        label: partial.label ?? partial.key,
        type: partial.type ?? MetricValueType.NUMBER,
        unit: partial.unit ?? MetricTypeUnit.UNIT,
        isUniversal: partial.isUniversal ?? false,
        isDerived: partial.isDerived ?? false,
        isActive: partial.isActive ?? true,
        dailyLogMetrics: [],
        programMetricTargets: [],
    } as MetricType);

const catalog = [
    metric({ id: 'mt-calories', key: 'calories', label: 'Calorías', type: MetricValueType.NUMBER, unit: MetricTypeUnit.KCAL, isUniversal: true }),
    metric({ id: 'mt-meditation', key: 'meditation', label: 'Meditación', type: MetricValueType.DURATION, unit: MetricTypeUnit.MIN }),
    metric({ id: 'mt-workout', key: 'workout_count', label: 'Entrenamientos', type: MetricValueType.BOOLEAN, unit: MetricTypeUnit.UNIT }),
    metric({ id: 'mt-inactive', key: 'old_metric', label: 'Vieja', type: MetricValueType.NUMBER, unit: MetricTypeUnit.UNIT, isActive: false }),
];

describe('DailyLogService.validateAndNormalize', () => {
    const service = new DailyLogService(null as any, null as any, null as any, null as any);

    it('normaliza métricas válidas mixtas', () => {
        const rows = service.validateAndNormalize({ calories: 2100, meditation: 12, workout_count: true }, catalog);

        expect(rows).toHaveLength(3);
        expect(rows).toContainEqual({ metricTypeId: 'mt-calories', value: 2100 });
        expect(rows).toContainEqual({ metricTypeId: 'mt-meditation', value: 12 });
        expect(rows).toContainEqual({ metricTypeId: 'mt-workout', value: 1 });
    });

    it('guarda 2 filas para { calories: 2100, meditation: 12 }', () => {
        const rows = service.validateAndNormalize({ calories: 2100, meditation: 12 }, catalog);
        expect(rows).toHaveLength(2);
    });

    it('rechaza key inexistente con 400', () => {
        expect(() => service.validateAndNormalize({ pepino: 1 }, catalog)).toThrow(BadRequestException);
        expect(() => service.validateAndNormalize({ pepino: 1 }, catalog)).toThrow(/pepino/);
    });

    it('rechaza métrica inactiva con 400', () => {
        expect(() => service.validateAndNormalize({ old_metric: 5 }, catalog)).toThrow(BadRequestException);
    });

    it('rechaza valores negativos en number y duration', () => {
        expect(() => service.validateAndNormalize({ calories: -1 }, catalog)).toThrow(BadRequestException);
        expect(() => service.validateAndNormalize({ meditation: -5 }, catalog)).toThrow(BadRequestException);
    });

    it('rechaza boolean inválido', () => {
        expect(() => service.validateAndNormalize({ workout_count: 'yes' }, catalog)).toThrow(BadRequestException);
        expect(() => service.validateAndNormalize({ workout_count: 2 }, catalog)).toThrow(BadRequestException);
    });

    it('acepta 0/1 para boolean', () => {
        expect(service.validateAndNormalize({ workout_count: 1 }, catalog)).toEqual([
            { metricTypeId: 'mt-workout', value: 1 },
        ]);
        expect(service.validateAndNormalize({ workout_count: false }, catalog)).toEqual([
            { metricTypeId: 'mt-workout', value: 0 },
        ]);
    });

    it('acepta cero en number/duration', () => {
        expect(service.validateAndNormalize({ calories: 0 }, catalog)).toEqual([
            { metricTypeId: 'mt-calories', value: 0 },
        ]);
    });
});

describe('DailyLogService.toResponse', () => {
    const service = new DailyLogService(null as any, null as any, null as any, null as any);

    const buildLog = (): DailyLog => {
        const log = new DailyLog();
        log.id = 'log-1';
        log.date = '2026-11-06';
        log.createdAt = new Date('2026-11-06T00:00:00Z');
        log.updatedAt = new Date('2026-11-06T01:00:00Z');

        const calorieRow = new DailyLogMetric();
        calorieRow.dailyLogId = log.id;
        calorieRow.metricTypeId = 'mt-calories';
        calorieRow.value = 2100;
        calorieRow.metricType = metric({ id: 'mt-calories', key: 'calories', label: 'Calorías', unit: MetricTypeUnit.KCAL, isUniversal: true });

        const meditationRow = new DailyLogMetric();
        meditationRow.dailyLogId = log.id;
        meditationRow.metricTypeId = 'mt-meditation';
        meditationRow.value = 12;
        meditationRow.metricType = metric({ id: 'mt-meditation', key: 'meditation', label: 'Meditación', type: MetricValueType.DURATION, unit: MetricTypeUnit.MIN });

        log.metrics = [calorieRow, meditationRow];
        return log;
    };

    it('devuelve shape plano con metrics[], extraMetrics{} y workouts[]', () => {
        const dto = service.toResponse(buildLog());

        expect(dto.id).toBe('log-1');
        expect(dto.date).toBe('2026-11-06');
        expect(dto.metrics).toHaveLength(2);
        expect(dto.metrics.map((m) => m.key)).toEqual(['calories', 'meditation']);
        expect(dto.metrics.find((m) => m.key === 'calories')?.value).toBe(2100);
        expect(dto.metrics.find((m) => m.key === 'calories')?.isUniversal).toBe(true);

        expect(dto.extraMetrics).toEqual({ calories: 2100, meditation: 12 });
        expect(dto.workouts).toEqual([]);
    });

    it('tolera un log sin métricas cargadas', () => {
        const log = new DailyLog();
        log.id = 'log-2';
        log.date = '2026-11-07';
        log.metrics = undefined as any;
        const dto = service.toResponse(log);
        expect(dto.metrics).toEqual([]);
        expect(dto.extraMetrics).toEqual({});
    });
});
