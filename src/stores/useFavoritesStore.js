/**
 * useFavoritesStore.js — 즐겨찾기 상태 스토어(zustand + persist)
 * - 상태: items, guestItems, owner, loading, pending, error
 * - 비로그인은 guestItems에 로컬 보관, bindSession(owner)에서 서버 목록과 병합 업로드
 * - toggle·remove·clear가 /api/favorites와 동기화, persist 키 'incheon-spotlight-favorites'(v2)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addAccountFavorite, listAccountFavorites, removeAccountFavorite } from '../api/favoriteApi';
import { getApiErrorMessage } from '../api/http';

export function favoriteKey(place) {
  return place?.contentId ? `c:${place.contentId}` : place?.id ? `i:${place.id}` : null;
}
function snapshot(place) {
  return {
    id: place.id, contentId: place.contentId ? String(place.contentId) : null,
    name: place.name || place.title || '', title: place.title || place.name || '',
    address: place.address || '', imageUrl: place.imageUrl || '', districtId: place.districtId || null,
    shortDescription: place.shortDescription || place.overview || '',
    mapX: place.mapX == null ? null : String(place.mapX), mapY: place.mapY == null ? null : String(place.mapY),
  };
}
let generation = 0;
export const useFavoritesStore = create(persist((set, get) => ({
  items: [], guestItems: [], owner: null, loading: true, pending: false, error: '',
  isFavorite: (place) => Boolean(favoriteKey(place)) && get().items.some((p) => favoriteKey(p) === favoriteKey(place)),
  async bindSession(owner) {
    const ticket = ++generation;
    set({ owner: owner ?? null, items: owner == null ? get().guestItems : [], loading: owner != null, pending: false, error: '' });
    if (owner == null) return;
    try {
      const account = await listAccountFavorites();
      if (ticket !== generation) return;
      set({ items: account });
      for (const item of [...get().guestItems]) {
        if (ticket !== generation) return;
        if (!item.contentId) continue;
        if (!account.some((p) => favoriteKey(p) === favoriteKey(item))) {
          const saved = await addAccountFavorite(snapshot(item));
          if (ticket !== generation) return;
          account.push(saved);
        }
        set({ items: [...account], guestItems: get().guestItems.filter((p) => favoriteKey(p) !== favoriteKey(item)) });
      }
    } catch (error) {
      if (ticket === generation) set({ error: getApiErrorMessage(error) });
    } finally {
      if (ticket === generation) set({ loading: false });
    }
  },
  retrySync: () => get().bindSession(get().owner),
  async toggleFavorite(place) {
    if (!favoriteKey(place) || get().loading || get().pending) return;
    if (get().isFavorite(place)) return get().removeFavorite(place);
    const item = snapshot(place);
    if (get().owner == null) {
      const items = [item, ...get().guestItems];
      set({ items, guestItems: items, error: '' }); return;
    }
    if (!item.contentId) { set({ error: 'feedback.favoriteLocalOnly' }); return; }
    const ticket = generation;
    set({ pending: true, error: '' });
    try {
      const saved = await addAccountFavorite(item);
      if (ticket === generation) set({ items: [saved, ...get().items.filter((p) => favoriteKey(p) !== favoriteKey(saved))] });
    } catch (error) {
      if (ticket === generation) set({ error: getApiErrorMessage(error) });
    } finally { if (ticket === generation) set({ pending: false }); }
  },
  async removeFavorite(place) {
    if (get().loading || get().pending) return;
    const key = favoriteKey(place);
    if (get().owner == null) {
      const items = get().guestItems.filter((p) => favoriteKey(p) !== key);
      set({ items, guestItems: items }); return;
    }
    const ticket = generation;
    set({ pending: true, error: '' });
    try {
      await removeAccountFavorite(place.contentId);
      if (ticket === generation) set({ items: get().items.filter((p) => favoriteKey(p) !== key) });
    } catch (error) { if (ticket === generation) set({ error: getApiErrorMessage(error) }); }
    finally { if (ticket === generation) set({ pending: false }); }
  },
  async clearFavorites() {
    for (const item of [...get().items]) {
      const ticket = generation;
      await get().removeFavorite(item);
      if (ticket !== generation || get().error) break;
    }
  },
}), {
  name: 'incheon-spotlight-favorites', version: 2,
  migrate: (old) => ({ guestItems: old.guestItems || old.items || [] }),
  partialize: (state) => ({ guestItems: state.guestItems }),
}));

