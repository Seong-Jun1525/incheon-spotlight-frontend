/**
 * authApi.js — 인증·회원 계정 API
 * - /api/auth/* : CSRF 발급, 세션 조회(me), 로그인·로그아웃·회원가입
 * - 이메일 인증코드 발송·확인과 비밀번호 재설정
 * - /api/members/me/* : 닉네임·프로필·비밀번호 변경
 */
import { api } from './http';

export async function fetchCsrf() {
  await api.get('/api/auth/csrf', { skipAuthRedirect: true });
}

export async function fetchMe() {
  const { data } = await api.get('/api/auth/me', { skipAuthRedirect: true });
  return data;
}

export async function sendEmailCode(payload) {
  const { data } = await api.post('/api/auth/email-code', payload, {
    skipAuthRedirect: true,
    timeout: 20000,
  });
  return data;
}

export async function confirmEmailCode(payload) {
  const { data } = await api.post('/api/auth/email-code/confirm', payload, { skipAuthRedirect: true });
  return data;
}

export async function resetPassword(payload) {
  const { data } = await api.post('/api/auth/password-reset', payload, { skipAuthRedirect: true });
  return data;
}

export async function signup(payload) {
  const { data } = await api.post('/api/auth/signup', payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post('/api/auth/login', payload, { skipAuthRedirect: true });
  return data;
}

export async function logout() {
  const { data } = await api.post('/api/auth/logout');
  return data;
}

export async function changeNickname(nickname) {
  const { data } = await api.patch('/api/members/me/nickname', { nickname });
  return data;
}

export async function changeProfile(payload) {
  const { data } = await api.patch('/api/members/me/profile', payload);
  return data;
}

export async function changePassword(payload) {
  const { data } = await api.post('/api/members/me/password', payload);
  return data;
}
