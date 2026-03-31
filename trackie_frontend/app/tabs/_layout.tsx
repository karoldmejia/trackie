import { Tabs } from 'expo-router';
import { Dumbbell, Settings, UserRound } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

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
          left: '25%',
          right: '25%',

          height: 60,

          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3},
          shadowOpacity: 0.02,
          borderRadius: 20,
          elevation: 10,

          flexDirection: 'row',
          alignItems: 'center',
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
  },
  iconBackgroundActive: {
    backgroundColor: '#F7C8E4',
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});