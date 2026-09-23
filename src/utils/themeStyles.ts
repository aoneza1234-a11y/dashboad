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
    name: 'สว่าง (Clean Light)',
    isDark: false,
    canvasBg: '#f1f5f9', // slate-100
    canvasText: '#0f172a',
    topBarBg: '#ffffff',
    topBarBorder: '#e2e8f0',
    topBarText: '#1e293b',
    sideBarBg: '#f8fafc',
    sideBarBorder: '#e2e8f0',
    sideBarText: '#334155',
    sideBarActiveBg: '#e2e8f0',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    cardText: '#0f172a',
    cardSubtext: '#64748b',
    accent: '#7c3aed',
    chartPalettes: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'],
  },
  midnight: {
    id: 'midnight',
    name: 'มิดไนท์ (Midnight Navy)',
    isDark: true,
    canvasBg: '#090d16',
    canvasText: '#f8fafc',
    topBarBg: '#0b1120',
    topBarBorder: '#1e293b',
    topBarText: '#f8fafc',
    sideBarBg: '#070b14',
    sideBarBorder: '#172033',
    sideBarText: '#94a3b8',
    sideBarActiveBg: '#1e293b',
    cardBg: '#0f172a',
    cardBorder: '#1e293b',
    cardText: '#f8fafc',
    cardSubtext: '#94a3b8',
    accent: '#38bdf8',
    chartPalettes: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6', '#22d3ee'],
  },
  ocean: {
    id: 'ocean',
    name: 'โอเชียน (Deep Ocean)',
    isDark: true,
    canvasBg: '#061325',
    canvasText: '#e0f2fe',
    topBarBg: '#091c36',
    topBarBorder: '#153e66',
    topBarText: '#f0f9ff',
    sideBarBg: '#05101f',
    sideBarBorder: '#113254',
    sideBarText: '#7dd3fc',
    sideBarActiveBg: '#0f2f52',
    cardBg: '#0c2340',
    cardBorder: '#153e66',
    cardText: '#e0f2fe',
    cardSubtext: '#7dd3fc',
    accent: '#06b6d4',
    chartPalettes: ['#06b6d4', '#0284c7', '#10b981', '#38bdf8', '#6366f1', '#14b8a6'],
  },
  violet: {
    id: 'violet',
    name: 'ไวโอเล็ต (Royal Violet)',
    isDark: true,
    canvasBg: '#120f24',
    canvasText: '#f5f3ff',
    topBarBg: '#18142f',
    topBarBorder: '#2d2454',
    topBarText: '#f5f3ff',
    sideBarBg: '#110d22',
    sideBarBorder: '#271f49',
    sideBarText: '#c4b5fd',
    sideBarActiveBg: '#2a2052',
    cardBg: '#1e183b',
    cardBorder: '#32275f',
    cardText: '#f5f3ff',
    cardSubtext: '#a78bfa',
    accent: '#a855f7',
    chartPalettes: ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
  },
  forest: {
    id: 'forest',
    name: 'ฟอเรสต์ (Emerald Forest)',
    isDark: true,
    canvasBg: '#081711',
    canvasText: '#ecfdf5',
    topBarBg: '#0d221a',
    topBarBorder: '#194434',
    topBarText: '#ecfdf5',
    sideBarBg: '#06120d',
    sideBarBorder: '#133528',
    sideBarText: '#a7f3d0',
    sideBarActiveBg: '#143b2d',
    cardBg: '#102a20',
    cardBorder: '#1d4d3b',
    cardText: '#ecfdf5',
    cardSubtext: '#6ee7b7',
    accent: '#10b981',
    chartPalettes: ['#10b981', '#34d399', '#059669', '#14b8a6', '#84cc16', '#eab308'],
  },
  sunset: {
    id: 'sunset',
    name: 'ซันเซ็ต (Twilight Sunset)',
    isDark: true,
    canvasBg: '#170c14',
    canvasText: '#fff1f2',
    topBarBg: '#22111d',
    topBarBorder: '#422038',
    topBarText: '#fff1f2',
    sideBarBg: '#140911',
    sideBarBorder: '#36182c',
    sideBarText: '#fda4af',
    sideBarActiveBg: '#3b1831',
    cardBg: '#281322',
    cardBorder: '#4a213e',
    cardText: '#fff1f2',
    cardSubtext: '#fb7185',
    accent: '#f43f5e',
    chartPalettes: ['#f43f5e', '#fb923c', '#f59e0b', '#ec4899', '#e11d48', '#d946ef'],
  },
};

export function getThemeStyles(preset: ThemePreset = 'violet'): ThemeStyles {
  return THEME_STYLES[preset] || THEME_STYLES.violet;
}
