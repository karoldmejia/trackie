import { theme } from '@/theme';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { ThemedText } from '../ThemedText';

const { width: screenWidth } = Dimensions.get('window');

const workoutTranslations: Record<string, string> = {
    'none': 'Ninguno',
    'upper': 'Superior',
    'lower': 'Glúteos y pierna',
    'full': 'Full body',
    'cardio': 'Cardio',
};

interface WorkoutVideoProps {
    workout?: string;
    videoSource: any;
}

export const WorkoutVideo: React.FC<WorkoutVideoProps> = ({ 
    workout, 
    videoSource 
}) => {
    const videoRef = useRef<VideoRef>(null);
    const [isWeb, setIsWeb] = useState(false);
    
    const getTranslatedWorkout = (workoutValue?: string): string => {
        if (!workoutValue || workoutValue.trim() === '') {
            return 'Ninguno';
        }
        const translated = workoutTranslations[workoutValue.toLowerCase()];
        if (translated) {
            return translated;
        }
        return workoutValue.charAt(0).toUpperCase() + workoutValue.slice(1);
    };
    
    const workoutText = getTranslatedWorkout(workout);
    const hasWorkout = workout && workout.trim() !== '' && workout !== 'none';

    const availableWidth = screenWidth;
    const videoHeight = 220;

    useEffect(() => {
        setIsWeb(Platform.OS === 'web');
    }, []);

    // Para web: usar elemento video nativo en lugar de react-native-video
    if (isWeb) {
        return (
            <View style={styles.container}>
                <View style={styles.videoContainer}>
                    <video
                        src={typeof videoSource === 'object' && videoSource.uri ? videoSource.uri : videoSource}
                        style={{
                            width: availableWidth,
                            height: videoHeight,
                            objectFit: 'contain',
                        }}
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </View>
                
                <View style={styles.textContainer}>
                    <ThemedText 
                        variant="medium" 
                        size={10} 
                        color={theme.colors.textLight || '#999'}
                        style={styles.subtitle}
                    >
                        Entrenamiento del día
                    </ThemedText>
                    <ThemedText 
                        variant="semiBold" 
                        size={16} 
                        color={hasWorkout ? theme.colors.text : theme.colors.textLight}
                        style={styles.workoutText}
                    >
                        {workoutText}
                    </ThemedText>
                </View>
            </View>
        );
    }

    // Para nativo (Android/iOS)
    return (
        <View style={styles.container}>
            <View style={styles.videoContainer}>
                <Video
                    ref={videoRef}
                    source={videoSource}
                    style={[styles.video, { width: availableWidth, height: videoHeight }]}
                    resizeMode="contain"
                    repeat={true}
                    paused={false}
                    muted={true}
                    controls={false}
                    playInBackground={false}
                    playWhenInactive={false}
                    ignoreSilentSwitch="ignore"
                />
            </View>
            
            <View style={styles.textContainer}>
                <ThemedText 
                    variant="medium" 
                    size={12} 
                    color={theme.colors.textLight || '#999'}
                    style={styles.subtitle}
                >
                    Entrenamiento del día
                </ThemedText>
                <ThemedText 
                    variant="semiBold" 
                    size={16} 
                    color={hasWorkout ? theme.colors.text : theme.colors.textLight}
                    style={styles.workoutText}
                >
                    {workoutText}
                </ThemedText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.0035)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        height: '100%',
    },
    videoContainer: {
        width: '100%',
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 20,
        position: 'relative',
    },
    video: {
        backgroundColor: '#000',
    },
    textContainer: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtitle: {
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
        textAlign: 'center',
    },
    workoutText: {
        textAlign: 'center',
        marginBottom: 1,
    },
});