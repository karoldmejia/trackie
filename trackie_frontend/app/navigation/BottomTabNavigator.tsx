import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import HomeScreen from '../tabs/index';
import SettingsScreen from '../tabs/SettingsScreen';
import WeightScreen from '../tabs/WeightScreen';

export type TabParamList = {
  Home: undefined;
  Weight: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,              // quita el header arriba de cada pantalla
        tabBarActiveTintColor: '#FFB6C1', // rosa pastel activo
        tabBarInactiveTintColor: '#aaa',  // gris inactivo
        tabBarStyle: { height: 60 },      // altura de la barra inferior
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Weight" component={WeightScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}