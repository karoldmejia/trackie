import { Icon } from '@/components/icon';
import { theme } from '@/theme';
import React, { useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

export interface SwipeableCardProps {
    children: React.ReactNode;
    onEdit?: () => void;
    onDelete?: () => void;
}

const RightActions: React.FC<{
    drag: SharedValue<number>;
    onEdit?: () => void;
    onDelete?: () => void;
}> = ({ drag, onEdit, onDelete }) => {
    const buttonCount = (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
    const rightWidth = buttonCount * 60;

    const styleAnimation = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + rightWidth }],
    }));

    return (
        <Reanimated.View style={[styleAnimation, styles.actionElevation, styles.rightActionsRow]}>
            {onEdit && (
                <Pressable
                    onPress={onEdit}
                    onStartShouldSetResponder={() => true}
                    pointerEvents="auto"
                    style={styles.actionButton}
                    android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                    accessibilityRole="button"
                    accessibilityLabel="Editar"
                >
                    <Icon
                        name="Pencil"
                        size={20}
                        color={theme.colors.placeholder}
                        backgroundColor="transparent"
                        padding={0}
                    />
                </Pressable>
            )}
            {onDelete && (
                <Pressable
                    onPress={onDelete}
                    onStartShouldSetResponder={() => true}
                    pointerEvents="auto"
                    style={styles.actionButton}
                    android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar"
                >
                    <Icon
                        name="Trash2"
                        size={20}
                        color={theme.colors.placeholder}
                        backgroundColor="transparent"
                        padding={0}
                    />
                </Pressable>
            )}
        </Reanimated.View>
    );
};

export const SwipeableCard: React.FC<SwipeableCardProps> = ({ children, onEdit, onDelete }) => {
    const swipeableRef = useRef<SwipeableMethods>(null);

    if (!onEdit && !onDelete) {
        return <>{children}</>;
    }

    const handleEdit = () => {
        swipeableRef.current?.close();
        onEdit?.();
    };

    const handleDelete = () => {
        swipeableRef.current?.close();
        onDelete?.();
    };

    return (
        <ReanimatedSwipeable
            ref={swipeableRef}
            friction={2}
            rightThreshold={40}
            overshootRight={false}
            renderRightActions={(_progress, drag) => (
                <RightActions drag={drag} onEdit={onEdit ? handleEdit : undefined} onDelete={onDelete ? handleDelete : undefined} />
            )}
        >
            {children}
        </ReanimatedSwipeable>
    );
};

const styles = StyleSheet.create({
    actionElevation: {
        zIndex: 10,
        elevation: 10,
    },
    rightActionsRow: {
        flexDirection: 'row',
    },
    actionButton: {
        width: 60,
        height: '100%',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
});
