import { MetricOverviewScreen } from './MetricOverviewScreen';

export default function SkeletalMuscleOverviewScreen() {
    return (
        <MetricOverviewScreen
            metricKey="skeletalMuscle"
            title="Músculo"
            unit="%"
            iconColor="#7B68EE"
            iconName="BicepsFlexed"
        />
    );
}