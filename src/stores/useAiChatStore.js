/**
 * useAiChatStore.js — AI 채팅 패널 상태 스토어(zustand)
 * - 상태: isOpen, tab('chat'·'course'), messages, isSending
 * - send()가 최근 6건 히스토리와 함께 postAiChat 호출 후 assistant·error 메시지를 추가
 * - 패널 오픈·전송 시 AI_OPEN·AI_CHAT 통계 전송, 취소하면 방금 보낸 user 메시지를 제거
 */
import { create } from 'zustand';
import { getAiChatErrorMessage, postAiChat } from '../api/aiChatApi';
import { STAT_EVENTS } from '../constants/statEvents';
import { trackStat } from '../utils/trackStat';

let messageSeq = 0;
let requestSeq = 0;
let abortController = null;

function nextId(prefix) {
  messageSeq += 1;
  return `${prefix}-${Date.now()}-${messageSeq}`;
}

function abortInFlight() {
  abortController?.abort();
  abortController = null;
}

/**
 * AI 채팅 화면 상태. 서버 세션은 없고, 이 브라우저 탭에서만 유지됩니다.
 */
export const useAiChatStore = create((set, get) => ({
  isOpen: false,
  tab: 'chat',
  messages: [],
  isSending: false,

  open: () => {
    if (!get().isOpen) {
      trackStat({ eventType: STAT_EVENTS.AI_OPEN, menuId: 'ai' });
    }
    set({ isOpen: true });
  },
  openChatTab: () => {
    if (!get().isOpen) {
      trackStat({ eventType: STAT_EVENTS.AI_OPEN, menuId: 'ai' });
    }
    set({ isOpen: true, tab: 'chat' });
  },
  openCourseTab: () => {
    if (!get().isOpen) {
      trackStat({ eventType: STAT_EVENTS.AI_OPEN, menuId: 'ai' });
    }
    set({ isOpen: true, tab: 'course' });
  },
  close: () => set({ isOpen: false }),
  toggle: () => {
    const next = !get().isOpen;
    if (next) {
      trackStat({ eventType: STAT_EVENTS.AI_OPEN, menuId: 'ai' });
    }
    set({ isOpen: next });
  },
  setTab: (tab) => set({ tab }),

  cancel: () => {
    const { messages, isSending } = get();
    const last = messages[messages.length - 1];
    requestSeq += 1;
    abortInFlight();
    set({
      isSending: false,
      messages:
        isSending && last?.role === 'user'
          ? messages.slice(0, -1)
          : messages,
    });
  },

  clear: () => {
    requestSeq += 1;
    abortInFlight();
    set({ messages: [], isSending: false });
  },

  send: async (rawMessage, context = {}) => {
    const message = String(rawMessage ?? '').trim();
    if (!message || get().isSending) return;

    trackStat({
      eventType: STAT_EVENTS.AI_CHAT,
      districtId: context.districtId || null,
      contentId: context.contentId || null,
    });

    const prior = get()
      .messages.filter((item) => item.role === 'user' || item.role === 'assistant')
      .slice(-6)
      .map((item) => ({
        role: item.role,
        content: String(item.content ?? '').slice(0, 500),
      }));

    const userId = nextId('user');
    const reqId = (requestSeq += 1);
    set({
      isOpen: true,
      isSending: true,
      messages: [
        ...get().messages,
        { id: userId, role: 'user', content: message },
      ],
    });

    const controller = new AbortController();
    abortController = controller;

    try {
      const data = await postAiChat({
        message,
        context: {
          districtId: context.districtId || null,
          contentId: context.contentId || null,
          travelDate: context.travelDate || null,
        },
        history: prior,
        signal: controller.signal,
      });

      if (requestSeq !== reqId) return;

      set({
        messages: [
          ...get().messages,
          {
            id: nextId('assistant'),
            role: 'assistant',
            content: data?.answer || '답변을 받지 못했습니다.',
            places: Array.isArray(data?.places) ? data.places : [],
            toolCalls: Array.isArray(data?.toolCalls) ? data.toolCalls : [],
          },
        ],
      });
    } catch (error) {
      if (requestSeq !== reqId) return;

      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        set({
          messages: get().messages.filter((item) => item.id !== userId),
        });
        return;
      }

      set({
        messages: [
          ...get().messages,
          {
            id: nextId('error'),
            role: 'error',
            content: getAiChatErrorMessage(error),
          },
        ],
      });
    } finally {
      if (requestSeq === reqId) {
        abortController = null;
        set({ isSending: false });
      }
    }
  },
}));
