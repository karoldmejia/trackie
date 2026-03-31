import { Icon } from '@/components/icon';
import { NavBar } from '@/components/navbar';
import { SettingsButton } from '@/components/settings/SettingsButton';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { WeekDaySelectModal } from '@/components/settings/WeekDaySelectModal';
import { Settings as SettingsType, settingsService } from '@/services/settingsService';
import { theme } from '@/theme';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

const logo = require('@/assets/home_logo.png');

const SettingsScreen: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<SettingsType | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [weekDayModalVisible, setWeekDayModalVisible] = useState(false);
    const [editingField, setEditingField] = useState<{
        key: keyof SettingsType;
        title: string;
        icon: string;
        unit: string;
        min: number;
        max: number;
        isWeekDay?: boolean;
    } | null>(null);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsService.getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

const handleSave = async (value: number) => {
    if (!settings || !editingField) return;

    const updateData: Partial<SettingsType> = {
        [editingField.key]: value,
    };

    try {
        const updated = await settingsService.update(updateData);
        setSettings(updated);
    } catch (error) {
        console.error('Error updating setting:', error);
    }
};

    const settingsButtons = [
        {
            key: 'calorieLimit' as keyof SettingsType,
            title: 'Límite de calorías',
            icon: 'Flame',
            unit: 'kcal',
            min: 0,
            max: 5000,
            isWeekDay: false,
        },
        {
            key: 'stepsLimit' as keyof SettingsType,
            title: 'Objetivo de pasos',
            icon: 'Footprints',
            unit: 'pasos',
            min: 0,
            max: 50000,
            isWeekDay: false,
        },
        {
            key: 'weekStartDay' as keyof SettingsType,
            title: 'Inicio de semana',
            icon: 'Calendar',
            unit: '',
            min: 0,
            max: 6,
            isWeekDay: true,
        },
        {
            key: 'targetWeight' as keyof SettingsType,
            title: 'Peso objetivo',
            icon: 'Weight',
            unit: 'kg',
            min: 30,
            max: 300,
            isWeekDay: false,
        },
    ];

    const getWeekDayName = (day: number): string => {
        const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return weekDays[day] || 'Domingo';
    };

    const getDisplayValue = (button: typeof settingsButtons[0]): number | string => {
        if (!settings) return 0;
        const value = settings[button.key];
        if (button.key === 'weekStartDay') {
            return getWeekDayName(value as number);
        }
        return value as number;
    };

    const handleButtonPress = (button: typeof settingsButtons[0]) => {
        setEditingField(button);
        if (button.isWeekDay) {
            setWeekDayModalVisible(true);
        } else {
            setModalVisible(true);
        }
    };

    return (
        <View style={styles.container}>
            <NavBar
                logo={logo}
                title="¡Hola Karold!"
                showLogoAndTitle={true}
                height={70}
                                                    rightComponent={
                                        <View style={styles.rightIcons}>
                                            <Icon
                                                name="Search"
                                                color={theme.colors.text}
                                                backgroundColor={theme.colors.white}
                                            />
                                        </View>
                                    }
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.buttonsContainer}>
                    {settingsButtons.map((button) => (
                        <SettingsButton
                            key={button.key}
                            onPress={() => handleButtonPress(button)}
                            icon={button.icon}
                            title={button.title}
                            value={getDisplayValue(button)}
                            unit={button.key === 'weekStartDay' ? '' : button.unit}
                        />
                    ))}
                </View>
            </ScrollView>

            {/* Modal para campos numéricos */}
            <SettingsModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setEditingField(null);
                }}
                onSave={handleSave}
                title={editingField?.title || ''}
                currentValue={settings?.[editingField?.key as keyof SettingsType] as number || 0}
                unit={editingField?.unit || ''}
                iconName={editingField?.icon || 'Settings'}
                minValue={editingField?.min || 0}
                maxValue={editingField?.max || 10000}
            />

            {/* Modal para selector de día de semana */}
            <WeekDaySelectModal
                visible={weekDayModalVisible}
                onClose={() => {
                    setWeekDayModalVisible(false);
                    setEditingField(null);
                }}
                onSave={handleSave}
                currentValue={settings?.weekStartDay || 0}
            />
        </View>
    );
};

export default SettingsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 100,
        paddingTop: 16,
    },
    buttonsContainer: {
        gap: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightIcons: {
        flexDirection: 'row',
        gap: 12,
    },
});