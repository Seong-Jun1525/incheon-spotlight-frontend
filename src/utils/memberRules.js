/**
 * memberRules.js — 회원 가입·정보 수정 입력값 검증 규칙과 한국어 오류 메시지
 * - passwordError·passwordConfirmError: 8~72자와 영문+숫자 조합, 확인값 일치 검사
 * - emailError·nameError·phoneError·emailCodeError: 이메일 형식(254자 이내), 한글/영문 2~20자 이름, 01X 휴대전화, 인증번호 6자리
 * - digitsOnlyPhone·formatPhone: 숫자만 남긴 뒤 000-0000-0000 형태로 표기
 */
export const PASSWORD_HINT = '8~72자, 영문과 숫자를 함께 입력해 주세요.';

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const NAME_PATTERN = /^[가-힣a-zA-Z][가-힣a-zA-Z·\s]{1,19}$/;
const PHONE_PATTERN = /^01[016789][0-9]{7,8}$/;

export function passwordError(password) {
  if (!password || password.length < 8 || password.length > 72) {
    return '비밀번호는 8~72자로 입력해 주세요.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return '비밀번호에 영문과 숫자를 함께 넣어 주세요.';
  }
  return '';
}

export function passwordConfirmError(password, confirm) {
  if (password !== confirm) {
    return '비밀번호 확인이 일치하지 않습니다.';
  }
  return '';
}

export function emailError(email) {
  const value = String(email || '').trim();
  if (!value) {
    return '이메일을 입력해 주세요.';
  }
  if (value.length > 254 || !EMAIL_PATTERN.test(value.toLowerCase())) {
    return '이메일 형식이 올바르지 않습니다.';
  }
  return '';
}

export function nameError(name) {
  const value = String(name || '').trim().replace(/\s+/g, ' ');
  if (value.length < 2 || value.length > 20 || !NAME_PATTERN.test(value)) {
    return '이름은 한글 또는 영문 2~20자로 입력해 주세요.';
  }
  return '';
}

export function digitsOnlyPhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(0, 11);
}

export function formatPhone(phone) {
  const digits = digitsOnlyPhone(phone);
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function phoneError(phone) {
  const digits = digitsOnlyPhone(phone);
  if (!PHONE_PATTERN.test(digits)) {
    return '휴대전화번호 형식이 올바르지 않습니다.';
  }
  return '';
}

export function emailCodeError(code) {
  if (!/^[0-9]{6}$/.test(String(code || '').trim())) {
    return '인증번호 6자리를 입력해 주세요.';
  }
  return '';
}
