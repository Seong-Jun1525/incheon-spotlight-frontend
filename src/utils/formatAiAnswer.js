/**
 * formatAiAnswer.js — AI 답변 텍스트를 화면에 넣어도 안전한 HTML 문자열로 변환
 * - formatAiAnswer(text): &, <, > 를 이스케이프한 뒤 줄바꿈을 <br />로 바꾼다
 * - 모델이 쓰는 **강조** 표기만 <strong>으로 허용하고 나머지 마크다운은 그대로 둔다
 */
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/** 모델이 쓰는 **강조**만 안전하게 표시합니다. */
export function formatAiAnswer(text) {
  if (!text) return '';
  const escaped = escapeHtml(text).replaceAll('\n', '<br />');
  return escaped.replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
