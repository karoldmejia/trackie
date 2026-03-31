import { MetricOverviewScreen } from './MetricOverviewScreen';

export default function WeightOverviewScreen() {
    return (
        <MetricOverviewScreen
            metricKey="weight"
            title="Peso"
            unit="kg"
            iconColor="#f34570"
            iconName="Weight"
        />
    );
}