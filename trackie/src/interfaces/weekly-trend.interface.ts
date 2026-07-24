export interface WeeklyTrend {
    weekNumber: number;
    compliancePercentage: number;
}

export interface AttributeTrend {
    attribute: string;
    weeks: WeeklyTrend[];
    overallCompliance: number;
}

export interface TrendsData {
    [key: string]: AttributeTrend;
}