/**
 * aiChatApi.js — AI 채팅 요청과 오류 메시지 변환
 * - runAiJob('chat')으로 비동기 잡 실행 (메시지 2000자, 히스토리 최근 6건·각 500자 제한)
 * - districtId·contentId·travelDate 컨텍스트를 함께 전송
 * - getAiChatErrorMessage: 타임아웃·502·503·429 등을 i18n ai.error.* 문구로 매핑
 */
import { runAiJob } from './aiJobApi';
import i18n from '../i18n';

/**
 * 인천 관광 AI 채팅.
 * 응답은 최대 약 5.5분(Ollama + Tool 조회)까지 걸릴 수 있습니다.
 */
export async function postAiChat({ message, context, history, signal } = {}) {
  return runAiJob(
    'chat',
    {
      sessionId: null,
      message: String(message ?? '').slice(0, 2000),
      context: context
        ? {
            districtId: context.districtId || null,
            contentId: context.contentId || null,
            travelDate: context.travelDate || null,
          }
        : null,
      history: Array.isArray(history)
        ? history
            .filter((item) => item?.role === 'user' || item?.role === 'assistant')
            .slice(-6)
            .map((item) => ({
              role: item.role,
              content: String(item.content ?? '').slice(0, 500),
            }))
        : [],
    },
    {
      signal,
    },
  );
}

export function getAiChatErrorMessage(error) {
  const status = error?.response?.status;
  const payload = error?.response?.data;
  const code =
    typeof payload?.error === 'string' ? payload.error.trim() : String(error?.message || '').trim();
  const serverMessage =
    typeof payload?.message === 'string' ? payload.message.trim() : '';

  if (error?.code === 'ERR_CANCELED') {
    return i18n.t('ai.error.canceled');
  }
  if (error?.code === 'ECONNABORTED' || status === 504 || code === 'AI_JOB_TIMEOUT' || code === 'AI_PROVIDER_TIMEOUT') {
    return i18n.t('ai.error.timeout');
  }
  if (code === 'AI_PROVIDER_INVALID_RESPONSE' || status === 502 || code === 'AI_FAILED') {
    return i18n.t('ai.error.failed');
  }
  if (status === 503 || code === 'AI_PROVIDER_UNAVAILABLE') {
    return i18n.t('ai.error.unavailable');
  }
  if (status === 400) {
    return serverMessage || i18n.t('ai.error.empty');
  }
  if (status === 429 || code === 'AI_BUSY') {
    return serverMessage || i18n.t('ai.error.busy');
  }
  if (serverMessage) {
    return serverMessage;
  }
  return i18n.t('ai.error.connect');
}
