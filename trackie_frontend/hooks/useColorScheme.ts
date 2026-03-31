import { useColorScheme as _useColorScheme } from 'react-native';

export type ThemeType = 'light' | 'dark';

export const useColorScheme = (): ThemeType => {
  const system = _useColorScheme();
  return 'light';
};