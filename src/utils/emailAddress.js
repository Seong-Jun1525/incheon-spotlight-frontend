/**
 * emailAddress.js — 회원 화면의 이메일 도메인 선택 입력을 위한 목록과 분해·조립 함수
 * - EMAIL_DOMAINS·CUSTOM_DOMAIN·DEFAULT_DOMAIN: 셀렉트에 노출할 주요 도메인과 직접 입력 값
 * - parseEmailAddress(email): 마지막 @ 기준으로 로컬/도메인 분리, 목록에 없는 도메인은 custom=true
 * - composeEmail(localPart, domain): 공백과 앞쪽 @를 제거하고 소문자 도메인으로 주소 조립
 */
export const EMAIL_DOMAINS = [
  { value: 'naver.com', label: 'naver.com' },
  { value: 'daum.net', label: 'daum.net' },
  { value: 'hanmail.net', label: 'hanmail.net' },
  { value: 'gmail.com', label: 'gmail.com (Google)' },
  { value: 'nate.com', label: 'nate.com' },
  { value: 'kakao.com', label: 'kakao.com' },
  { value: 'hotmail.com', label: 'hotmail.com' },
  { value: 'outlook.com', label: 'outlook.com' },
  { value: 'icloud.com', label: 'icloud.com' },
  { value: 'yahoo.com', label: 'yahoo.com' },
];

export const EMAIL_DOMAIN_VALUES = EMAIL_DOMAINS.map((item) => item.value);

export const CUSTOM_DOMAIN = '__custom__';
export const DEFAULT_DOMAIN = 'naver.com';

export function parseEmailAddress(email) {
  const value = String(email || '').trim();
  const at = value.lastIndexOf('@');
  if (at <= 0) {
    return {
      localPart: value.replace(/@/g, ''),
      domain: '',
      custom: false,
    };
  }
  const localPart = value.slice(0, at);
  const domain = value.slice(at + 1).trim().toLowerCase();
  return {
    localPart,
    domain,
    custom: Boolean(domain) && !EMAIL_DOMAIN_VALUES.includes(domain),
  };
}

export function composeEmail(localPart, domain) {
  const local = String(localPart || '').trim();
  const host = String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^@+/, '');
  if (!local || !host) {
    return '';
  }
  return `${local}@${host}`;
}
