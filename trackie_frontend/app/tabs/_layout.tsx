import { theme } from '@/theme';
import { Tabs } from 'expo-router';
import { Dumbbell, Settings, UserRound } from 'lucide-react-native';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const tabBarWidth = screenWidth * 0.50;
const marginHorizontal = (screenWidth - tabBarWidth) / 2;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#252525',
        tabBarInactiveTintColor: '#494949',
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          marginHorizontal: marginHorizontal,
          width: tabBarWidth,
          height: 60,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-evenly', // Distribuir uniformemente los íconos
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <View style={[
              styles.iconBackground,
              focused && styles.iconBackgroundActive
            ]}>
              <Dumbbell 
                size={focused ? 28 : 26} 
                color={color} 
                strokeWidth={focused ? 3 : 2.5}
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="WeightScreen"
        options={{
          title: 'user',
          tabBarIcon: ({ focused, color }) => (
            <View style={[
              styles.iconBackground,
              focused && styles.iconBackgroundActive
            ]}>
              <UserRound
                size={focused ? 28 : 26} 
                color={color} 
                strokeWidth={focused ? 3 : 2.5}
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="SettingsScreen"
        options={{
          title: 'settings',
          tabBarIcon: ({ focused, color }) => (
            <View style={[
              styles.iconBackground,
              focused && styles.iconBackgroundActive
            ]}>
              <Settings
                size={focused ? 28 : 26} 
                color={color} 
                strokeWidth={focused ? 3 : 2.5}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconBackground: {
    width: 50,
    height: 45,
    borderRadius: 16,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'row',
    // marginBottom: 30,
    marginTop: 20,
  },
  iconBackgroundActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});