import { Theme } from '@react-navigation/native';

export const pastelTheme: Theme = {
  dark: false,
  colors: {
    background: '#FFF5F8', // rosa muy claro
    card: '#E0F7FA',       // azul pastel
    primary: '#FFDDA0',    // amarillo pastel
    text: '#333333',        // gris oscuro
    border: '#FFB6C1',     // rosa suave
    notification: '#FFDDA0',
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};