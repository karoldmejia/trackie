import { theme } from '@/theme';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Icon } from './icon';
import { ThemedText } from './ThemedText';

interface NavBarProps {
    title?: string;
    logo?: any;
    showSearch?: boolean;
    onSearchPress?: () => void;
    onLogoPress?: () => void;
    backgroundColor?: string;
    height?: number;
    titleColor?: string;
    titleSize?: number;
    titleVariant?: 'regular' | 'medium' | 'semiBold' | 'bold';
    iconSize?: number;
    iconColor?: string;
    iconBackgroundColor?: string;
    iconBorderRadius?: number;
    iconPadding?: number;
    rightComponent?: React.ReactNode;
    leftComponent?: React.ReactNode;
    style?: ViewStyle;
    showLogoAndTitle?: boolean;
    logoAndTitleGap?: number;
}

export const NavBar: React.FC<NavBarProps> = ({
    title,
    logo,
    showSearch = true,
    onSearchPress,
    onLogoPress,
    backgroundColor = 'transparent',
    height = 60,
    titleColor = theme.colors.text,
    titleSize = 16,
    titleVariant = 'medium',
    iconSize = 24,
    iconColor = theme.colors.text,
    iconBackgroundColor = 'transparent',
    iconBorderRadius = 8,
    iconPadding = 8,
    rightComponent,
    leftComponent,
    style,
    showLogoAndTitle = false,
    logoAndTitleGap = 12,
}) => {
    return (
        <View style={[styles.container, { backgroundColor, height }, style]}>
            <View style={styles.leftSection}>
                {leftComponent ? (
                    leftComponent
                ) : (
                    <>
                        {logo && (
                            <TouchableOpacity onPress={onLogoPress} activeOpacity={0.7}>
                                <Image source={logo} style={styles.logo} resizeMode="contain" />
                            </TouchableOpacity>
                        )}
                        
                        {title && (
                            <ThemedText
                                variant={titleVariant}
                                color={titleColor}
                                size={titleSize}
                                style={[
                                    styles.title,
                                    logo && showLogoAndTitle && { marginLeft: logoAndTitleGap }
                                ]}
                            >
                                {title}
                            </ThemedText>
                        )}
                    </>
                )}
            </View>

            <View style={styles.rightSection}>
                {rightComponent ? (
                    rightComponent
                ) : showSearch ? (
                    <Icon
                        name="Search"
                        size={iconSize}
                        color={iconColor}
                        backgroundColor={iconBackgroundColor}
                        borderRadius={iconBorderRadius}
                        padding={iconPadding}
                        onPress={onSearchPress}
                    />
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        elevation: 2,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 35,
        height: 35,
    },
    title: {
    },
});