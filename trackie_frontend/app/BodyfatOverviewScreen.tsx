import { MetricOverviewScreen } from './MetricOverviewScreen';

export default function BodyfatOverviewScreen() {
    return (
        <MetricOverviewScreen
            metricKey="bodyfat"
            title="Body Fat"
            unit="%"
            iconColor="#FFB347"
            iconName="Activity"
        />
    );
}