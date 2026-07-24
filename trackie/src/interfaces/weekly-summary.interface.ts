export interface WeeklySummary {
    weekNumber: number;
    startDate: string;
    endDate: string;
    daysCount: number;
    daysWithAllMet: number;
    compliancePercentage: number;
    caloriesCompliance: number;
    proteinCompliance: number;
    stepsCompliance: number;
    waterCompliance: number;
    workoutCompliance: number;
}