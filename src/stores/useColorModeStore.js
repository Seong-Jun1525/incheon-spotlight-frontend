/**
 * useColorModeStore.js — 라이트·다크 컬러 모드 상태(zustand)
 * - 상태: preference('light'·'dark'·'system')와 실제 적용값 resolved
 * - setPreference에서 선택값을 저장하고 applyResolvedColorMode로 DOM에 반영
 * - syncFromSystem으로 OS 테마 변경 시 resolved만 재계산
 */
import { create } from 'zustand';
import {
  applyResolvedColorMode,
  persistColorModePreference,
  readStoredColorModePreference,
  resolveColorMode,
  systemPrefersDark,
} from '../constants/colorMode';

function initialPreference() {
  if (typeof window === 'undefined') return 'system';
  return readStoredColorModePreference();
}

function initialResolved(preference) {
  if (typeof window === 'undefined') return 'light';
  return resolveColorMode(preference, systemPrefersDark());
}

const startPreference = initialPreference();

export const useColorModeStore = create((set) => ({
  preference: startPreference,
  resolved: initialResolved(startPreference),

  setPreference: (preference) => {
    persistColorModePreference(preference);
    const resolved = resolveColorMode(preference, systemPrefersDark());
    applyResolvedColorMode(resolved);
    set({ preference, resolved });
  },

  syncFromSystem: () => {
    set((state) => {
      const resolved = resolveColorMode(state.preference, systemPrefersDark());
      applyResolvedColorMode(resolved);
      if (resolved === state.resolved) return state;
      return { resolved };
    });
  },
}));
