import { Icon } from '@/components/icon';
import { theme } from '@/theme';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';

type LucideIconName = keyof typeof import('lucide-react-native');

interface FormInputProps {
    icon: LucideIconName;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: 'default' | 'numeric' | 'email-address';
    containerStyle?: ViewStyle;
    rounded?: boolean;
    autoFocus?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
    icon,
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
    containerStyle,
    rounded = true,
    autoFocus = false,
}) => {
    const [isFocused, setIsFocused] = useState(autoFocus);

    const showTextInput = isFocused || value.length > 0;

    const handleContainerPress = () => {
        setIsFocused(true);
    };

    return (
        <TouchableWithoutFeedback onPress={handleContainerPress}>
            <View style={[styles.container, !rounded && styles.noRounded, containerStyle]}>
                <View style={styles.iconContainer}>
                    <Icon
                        name={icon}
                        size={18}
                        color={theme.colors.placeholder}
                        backgroundColor="transparent"
                        padding={0}
                    />
                </View>

                <TextInput
                    style={[
                        styles.input,
                        {
                            fontFamily: theme.typography.fonts.regular,
                            fontSize: 14,
                            fontWeight: '500',
                            color: theme.colors.text,
                            textAlign: 'left',
                        }
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        if (value.length === 0) {
                            setIsFocused(false);
                        }
                    }}
                    autoFocus={autoFocus}
                />

            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 52,
    },
    noRounded: {
        borderRadius: 0,
    },
    iconContainer: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 8,
    },
    placeholderText: {
        flex: 1,
        paddingVertical: 8,
    },
});