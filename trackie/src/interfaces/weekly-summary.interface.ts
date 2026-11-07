/**
 * Resumen semanal genérico: el compliance por métrica vive en
 * `targetCompliance` ({ metricKey: porcentaje }). No hay keys hardcodeadas.
 */
export interface WeeklySummary {
    weekNumber: number;
    startDate: string | null;
    endDate: string | null;
    daysCount: number;
    daysWithAllMet: number;
    compliancePercentage: number;
    targetCompliance: Record<string, number>;
}
