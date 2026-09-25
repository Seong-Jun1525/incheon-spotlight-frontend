/**
 * useAiChat.js — AI 여행 상담 대화 상태와 추천 질문을 제공하는 훅
 * - AI 채팅 스토어를 감싸 메시지 목록·전송 중 여부와 전송·취소·초기화 함수를 반환
 * - 현재 보고 있는 구·군/장소를 전송 시 문맥으로 함께 전달
 * - 화면 상황에 맞는 추천 질문 목록과 AI 도구별 표시 라벨 제공
 */

import { useCallback } from 'react';
import i18n from '../i18n';
import { useAiChatStore } from '../stores/useAiChatStore';
import { districtLabels } from '../data/incheonDistricts';

export const AI_TOOL_LABELS = {
  searchTouristPlaces: 'ai.tool.search',
  searchTouristPois: 'ai.tool.search',
  getDistrictAttractions: 'ai.tool.district',
  getPlaceDetail: 'ai.tool.detail',
  getPoiDetail: 'ai.tool.detail',
  getNearbyRestaurants: 'ai.tool.food',
  getNearbyLodgings: 'ai.tool.stay',
  getWeather: 'ai.tool.weather',
  calculateRoute: 'ai.tool.route',
};

export function buildAiSuggestions({ districtId, contentId, placeTitle, t } = {}) {
  const tr = t || ((key, options) => i18n.t(key, options));
  const districtName = districtId
    ? tr(`district.${districtId}`, { defaultValue: districtLabels[districtId] })
    : null;
  const suggestions = [];

  if (contentId) {
    suggestions.push({
      id: 'nearby-food',
      label: tr('ai.suggest.nearbyFood'),
      message: placeTitle
        ? tr('ai.suggest.nearbyFoodMsgPlace', { name: placeTitle })
        : tr('ai.suggest.nearbyFoodMsg'),
    });
  }

  suggestions.push({
    id: 'night',
    label: tr('ai.suggest.night'),
    message: districtName
      ? tr('ai.suggest.nightMsgDistrict', { name: districtName })
      : tr('ai.suggest.nightMsg'),
  });

  suggestions.push({
    id: 'family',
    label: tr('ai.suggest.family'),
    message: districtName
      ? tr('ai.suggest.familyMsgDistrict', { name: districtName })
      : tr('ai.suggest.familyMsg'),
  });

  suggestions.push({
    id: 'weather',
    label: tr('ai.suggest.weather'),
    message: districtName
      ? tr('ai.suggest.weatherMsgDistrict', { name: districtName })
      : tr('ai.suggest.weatherMsg'),
  });

  return suggestions;
}

export function useAiChat({ districtId, contentId } = {}) {
  const messages = useAiChatStore((state) => state.messages);
  const isSending = useAiChatStore((state) => state.isSending);
  const sendMessage = useAiChatStore((state) => state.send);
  const cancel = useAiChatStore((state) => state.cancel);
  const clear = useAiChatStore((state) => state.clear);

  const send = useCallback(
    (rawMessage) =>
      sendMessage(rawMessage, {
        districtId: districtId || null,
        contentId: contentId || null,
      }),
    [sendMessage, districtId, contentId],
  );

  return { messages, isSending, send, cancel, clear };
}
