import { theme } from '@/theme';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: 'tabs',
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              paddingTop: 44,
              paddingBottom: 44,
            },
          }}
        >
          <Stack.Screen name="tabs" />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Agregar / Editar Registro',
            }}
          />
          <Stack.Screen
            name="CaloriesOverviewScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="StepsOverviewScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WeightOverviewScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WaistOverviewScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BodyfatOverviewScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SkeletalMuscleOverviewScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PhotoGallery"
            options={{ headerShown: false }}
          />
        </Stack>
        <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});