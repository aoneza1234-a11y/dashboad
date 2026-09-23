import { ThemePreset } from '../types';

export interface ThemeStyles {
  id: ThemePreset;
  name: string;
  isDark: boolean;
  canvasBg: string;
  canvasText: string;
  topBarBg: string;
  topBarBorder: string;
  topBarText: string;
  sideBarBg: string;
  sideBarBorder: string;
  sideBarText: string;
  sideBarActiveBg: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  cardSubtext: string;
  accent: string;
  chartPalettes: string[];
}

export const THEME_STYLES: Record<ThemePreset, ThemeStyles> = {
  light: {
    id: 'light',
    name: 'สว่าง คมชัด (High Contrast Light)',
    isDark: false,
    canvasBg: '#f8fafc', // slate-50
    canvasText: '#0f172a', // slate-900 (ultra readable)
    topBarBg: '#ffffff',
    topBarBorder: '#cbd5e1', // slate-300
    topBarText: '#0f172a',
    sideBarBg: '#ffffff',
    sideBarBorder: '#cbd5e1',
    sideBarText: '#1e293b',
    sideBarActiveBg: '#e2e8f0',
    cardBg: '#ffffff',
    cardBorder: '#cbd5e1',
    cardText: '#0f172a',
    cardSubtext: '#334155', // slate-700 for high readability
    accent: '#7c3aed',
    chartPalettes: ['#7c3aed', '#2563eb', '#059669', '#d97706', '#db2777', '#0891b2'],
  },
  midnight: {
    id: 'midnight',
    name: 'มิดไนท์ (Midnight Navy)',
    isDark: true,
    canvasBg: '#090d16',
    canvasText: '#ffffff',
    topBarBg: '#0b1120',
    topBarBorder: '#1e293b',
    topBarText: '#ffffff',
    sideBarBg: '#070b14',
    sideBarBorder: '#172033',
    sideBarText: '#cbd5e1',
    sideBarActiveBg: '#1e293b',
    cardBg: '#0f172a',
    cardBorder: '#1e293b',
    cardText: '#ffffff',
    cardSubtext: '#cbd5e1',
    accent: '#38bdf8',
    chartPalettes: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6', '#22d3ee'],
  },
  ocean: {
    id: 'ocean',
    name: 'โอเชียน (Deep Ocean)',
    isDark: true,
    canvasBg: '#061325',
    canvasText: '#ffffff',
    topBarBg: '#091c36',
    topBarBorder: '#153e66',
    topBarText: '#ffffff',
    sideBarBg: '#05101f',
    sideBarBorder: '#113254',
    sideBarText: '#bae6fd',
    sideBarActiveBg: '#0f2f52',
    cardBg: '#0c2340',
    cardBorder: '#153e66',
    cardText: '#ffffff',
    cardSubtext: '#bae6fd',
    accent: '#06b6d4',
    chartPalettes: ['#06b6d4', '#0284c7', '#10b981', '#38bdf8', '#6366f1', '#14b8a6'],
  },
  violet: {
    id: 'violet',
    name: 'ไวโอเล็ต (Royal Violet)',
    isDark: true,
    canvasBg: '#120f24',
    canvasText: '#ffffff',
    topBarBg: '#18142f',
    topBarBorder: '#2d2454',
    topBarText: '#ffffff',
    sideBarBg: '#110d22',
    sideBarBorder: '#271f49',
    sideBarText: '#ddd6fe',
    sideBarActiveBg: '#2a2052',
    cardBg: '#1e183b',
    cardBorder: '#32275f',
    cardText: '#ffffff',
    cardSubtext: '#ddd6fe',
    accent: '#a855f7',
    chartPalettes: ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
  },
  forest: {
    id: 'forest',
    name: 'ฟอเรสต์ (Emerald Forest)',
    isDark: true,
    canvasBg: '#081711',
    canvasText: '#ffffff',
    topBarBg: '#0d221a',
    topBarBorder: '#194434',
    topBarText: '#ffffff',
    sideBarBg: '#06120d',
    sideBarBorder: '#133528',
    sideBarText: '#a7f3d0',
    sideBarActiveBg: '#143b2d',
    cardBg: '#102a20',
    cardBorder: '#1d4d3b',
    cardText: '#ffffff',
    cardSubtext: '#a7f3d0',
    accent: '#10b981',
    chartPalettes: ['#10b981', '#34d399', '#059669', '#14b8a6', '#84cc16', '#eab308'],
  },
  sunset: {
    id: 'sunset',
    name: 'ซันเซ็ต (Twilight Sunset)',
    isDark: true,
    canvasBg: '#170c14',
    canvasText: '#ffffff',
    topBarBg: '#22111d',
    topBarBorder: '#422038',
    topBarText: '#ffffff',
    sideBarBg: '#140911',
    sideBarBorder: '#36182c',
    sideBarText: '#fecdd3',
    sideBarActiveBg: '#3b1831',
    cardBg: '#281322',
    cardBorder: '#4a213e',
    cardText: '#ffffff',
    cardSubtext: '#fecdd3',
    accent: '#f43f5e',
    chartPalettes: ['#f43f5e', '#fb923c', '#f59e0b', '#ec4899', '#e11d48', '#d946ef'],
  },
};

export function getThemeStyles(preset: ThemePreset = 'violet'): ThemeStyles {
  return THEME_STYLES[preset] || THEME_STYLES.violet;
}
