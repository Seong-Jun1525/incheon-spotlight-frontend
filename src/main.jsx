/**
 * main.jsx — 앱 진입점. React 루트를 생성해 App을 마운트
 * - React Query 클라이언트를 만들어 캐시·재시도 기본 옵션을 설정
 * - 다국어(i18n) 설정과 전역 스타일을 최초로 불러옴
 */

import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './i18n/index.js';
import './index.scss';
import App from './App.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// 운영 Nginx가 index.html을 내리기 전에 백엔드 상태를 확인한다. 브라우저에서
// 다시 선행 확인하면 모바일 망 복구 지연까지 서버 장애로 오인하므로 앱은 즉시
// 마운트하고, 실행 중 장애 판정은 BackendHealthWatcher에 맡긴다.
createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
