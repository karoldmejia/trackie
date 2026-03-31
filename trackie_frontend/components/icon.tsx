import { theme } from '@/theme';
import * as LucideIcons from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

type LucideIconName = keyof typeof LucideIcons;

interface IconProps {
    name: LucideIconName;
    size?: number;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    onPress?: () => void;
    disabled?: boolean;
    style?: ViewStyle;
    strokeWidth?: number;
    fill?: string;
}

export const Icon: React.FC<IconProps> = ({
    name,
    size = 20,
    color = '#252525',
    backgroundColor = theme.colors.white,
    borderRadius = 20,
    padding = 8,
    onPress,
    disabled = false,
    style,
    strokeWidth = 2.5,
    fill = 'none',
}) => {
    // Obtener el componente del ícono de Lucide
    const LucideIcon = LucideIcons[name] as any;
    
    if (!LucideIcon) {
        console.warn(`Icon "${name}" not found in Lucide`);
        return null;
    }

    const iconElement = (
        <View
            style={[
                styles.iconContainer,
                {
                    backgroundColor,
                    borderRadius,
                    padding,
                },
                style,
            ]}
        >
            <LucideIcon 
                size={size} 
                color={color}
                strokeWidth={strokeWidth}
                fill={fill}
            />
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
                {iconElement}
            </TouchableOpacity>
        );
    }

    return iconElement;
};

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});