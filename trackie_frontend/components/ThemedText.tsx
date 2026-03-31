import { theme } from '@/theme';
import React from 'react';
import { Text as RNText, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
    variant?: 'regular' | 'medium' | 'semiBold' | 'bold';
    color?: string;
    size?: number;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
    style,
    variant = 'regular',
    color = theme.colors.text,
    size = theme.typography.sizes.md,
    ...props
}) => {
    const fontFamily = {
        regular: theme.typography.fonts.regular,
        medium: theme.typography.fonts.medium,
        semiBold: theme.typography.fonts.semiBold,
        bold: theme.typography.fonts.bold,
    }[variant];

    return (
        <RNText
            style={[
                {
                    fontFamily,
                    color,
                    fontSize: size,
                },
                style,
            ]}
            {...props}
        />
    );
};