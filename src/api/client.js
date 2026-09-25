/**
 * client.js — JSON 전용 경량 axios 인스턴스(apiClient)
 * - apiBaseUrl 기준 10초 타임아웃, Content-Type: application/json 고정
 * - 인증·CSRF 인터셉터가 없으므로 인증이 필요한 요청은 http.js의 api를 사용
 */
import axios from 'axios';
import { apiBaseUrl } from '../config/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
