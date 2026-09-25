/**
 * useAiCourseStore.js — AI 추천 코스 생성 상태 스토어(zustand)
 * - 상태: response, courseMessage, exploreCourse, isPlanning, errorMessage
 * - plan()에서 postAiCourse 호출 후 toExploreCourse로 변환하고 AI_COURSE_PLAN 통계 전송
 * - requestSeq와 AbortController로 이전 요청 취소 및 늦게 도착한 응답 무시
 */
import { create } from 'zustand';
import { getAiCourseErrorMessage, postAiCourse } from '../api/aiCourseApi';
import { toExploreCourse } from '../utils/aiCourseAdapter';
import { STAT_EVENTS } from '../constants/statEvents';
import { trackStat } from '../utils/trackStat';

let requestSeq = 0;
let abortController = null;

function abortInFlight() {
  abortController?.abort();
  abortController = null;
}

/**
 * Ollama 추천 코스. 서버 세션 없이 이 탭에서만 유지한다.
 * 이후 Apache POI 엑셀 내보내기는 course.stops 스냅샷을 그대로 쓰면 된다.
 */
export const useAiCourseStore = create((set, get) => ({
  response: null,
  courseMessage: '',
  exploreCourse: null,
  isPlanning: false,
  errorMessage: null,

  cancel: () => {
    requestSeq += 1;
    abortInFlight();
    set({ isPlanning: false });
  },

  clear: () => {
    requestSeq += 1;
    abortInFlight();
    set({ response: null, courseMessage: '', exploreCourse: null, isPlanning: false, errorMessage: null });
  },

  plan: async (filters) => {
    if (get().isPlanning) return null;
    const reqId = (requestSeq += 1);
    set({ isPlanning: true, errorMessage: null });
    const controller = new AbortController();
    abortController = controller;

    try {
      const data = await postAiCourse(
        {
          districtId: filters?.districtId || null,
          theme: filters?.theme || null,
          durationHours: filters?.durationHours || null,
          partyType: filters?.partyType || null,
          startContentId: filters?.startContentId || null,
          message: filters?.message || null,
        },
        { signal: controller.signal },
      );
      if (requestSeq !== reqId) return null;
      const exploreCourse = toExploreCourse(data);
      trackStat({
        eventType: STAT_EVENTS.AI_COURSE_PLAN,
        districtId: filters?.districtId || exploreCourse?.districtId || null,
        courseId: exploreCourse?.id || null,
        theme: filters?.theme || exploreCourse?.theme || null,
      });
      set({
        response: data,
        courseMessage: filters?.message || '',
        exploreCourse,
        errorMessage: null,
      });
      return exploreCourse;
    } catch (error) {
      if (requestSeq !== reqId) return null;
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        return null;
      }
      set({ errorMessage: getAiCourseErrorMessage(error) });
      return null;
    } finally {
      if (requestSeq === reqId) {
        abortController = null;
        set({ isPlanning: false });
      }
    }
  },
}));
