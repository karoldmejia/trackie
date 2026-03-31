import { pastelTheme } from '@/theme/colors';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
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
    <ThemeProvider value={pastelTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
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
      </Stack>

      <StatusBar style="dark" />
    </ThemeProvider>
  );
}