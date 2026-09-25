/**
 * App.jsx — 앱 전체 라우팅과 전역 프로바이더를 구성하는 루트 컴포넌트
 * - 모든 페이지 경로를 정의하고 메인 외 페이지는 지연 로딩으로 분리
 * - 로그인·관리자 권한이 필요한 경로를 접근 제어 래퍼로 보호
 * - 색상 모드·언어·백엔드 상태·인증 세션 동기화와 법정동 코드 선로딩 수행
 */

import { Skeleton } from './components/atoms/Skeleton';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSync } from './components/system/LanguageSync';
import { LanguageSelect } from './components/atoms/LanguageSelect';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import MainPage from './pages/MainPage';
import { ColorModeSync } from './components/system/ColorModeSync';
import { AuthSessionHost } from './components/auth/AuthSessionHost';
import { BackendHealthWatcher } from './components/system/BackendHealthWatcher';
import { RequireAdmin, RequireAuth } from './components/auth/RequireAuth';
import { useDistrictLegalCodeMap } from './hooks/useDistrictLegalCodeMap';
import './App.scss';

function lazyNamed(importer, exportName = 'default') {
  return lazy(() =>
    importer().then((mod) => ({
      default: exportName === 'default' ? mod.default : mod[exportName],
    })),
  );
}

const LoginPage = lazy(() => import('./pages/LoginPage'));
const TermsPage = lazyNamed(() => import('./pages/LoginPage'), 'TermsPage');
const PrivacyPage = lazyNamed(() => import('./pages/LoginPage'), 'PrivacyPage');
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VisitFeedPage = lazy(() => import('./pages/VisitFeedPage'));
const VisitDetailPage = lazy(() => import('./pages/VisitDetailPage'));
const VisitComposePage = lazyNamed(() => import('./pages/VisitDetailPage'), 'VisitComposePage');
const MypageOverviewPage = lazy(() => import('./pages/mypage/MypageOverviewPage'));
const PassportPage = lazy(() => import('./pages/mypage/PassportPage'));
const PassportRegionPage = lazyNamed(() => import('./pages/mypage/PassportPage'), 'PassportRegionPage');
const MyVerificationsPage = lazy(() => import('./pages/mypage/MyVerificationsPage'));
const MyVerificationManagePage = lazyNamed(
  () => import('./pages/mypage/MyVerificationsPage'),
  'MyVerificationManagePage',
);
const SavedPlacesPage = lazy(() => import('./pages/mypage/SavedPlacesPage'));
const ProfilePage = lazy(() => import('./pages/mypage/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/mypage/NotificationsPage'));
const AdminReviewPage = lazy(() => import('./pages/admin/AdminReviewPage'));
const AdminReviewDetailPage = lazyNamed(
  () => import('./pages/admin/AdminReviewPage'),
  'AdminReviewDetailPage',
);
const AboutLayout = lazyNamed(() => import('./pages/AboutLayout'), 'AboutLayout');
const AboutIncheonPage = lazy(() => import('./pages/AboutIncheonPage'));
const AboutServicePage = lazy(() => import('./pages/AboutServicePage'));
const TravelPlannerPage = lazy(() => import('./pages/TravelPlannerPage'));
const TravelPlannerNewPage = lazyNamed(
  () => import('./pages/TravelPlannerPage'),
  'TravelPlannerNewPage',
);
const TravelPlansPage = lazy(() => import('./pages/TravelPlansPage'));
const TravelPlanDetailPage = lazy(() => import('./pages/TravelPlanDetailPage'));
const CesiumMapPage = lazy(() => import('./pages/CesiumMapPage'));
const CesiumCoursePage = lazy(() => import('./pages/CesiumCoursePage'));

function RouteLoading() {
  const { t } = useTranslation();
  return (
    <main id='main-content'><Skeleton variant='page' label={t('route.loading')} /></main>
  );
}

function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <main className='route-state' id='main-content'>
      <LanguageSelect />
      <strong>{t('route.notFound')}</strong>
      <p>{t('route.checkAddress')}</p>
      <Link to='/'>{t('route.home')}</Link>
    </main>
  );
}

function CommonCodePrefetch() {
  useDistrictLegalCodeMap();
  return null;
}

function App() {
  const { t } = useTranslation();
  return (
    <BrowserRouter>
      <ColorModeSync />
      <LanguageSync />
      <BackendHealthWatcher />
      <AuthSessionHost />
      <a className='skip-link' href='#main-content'>
        {t('common.skipContent')}
      </a>
      <CommonCodePrefetch />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path='/' element={<MainPage />} />
          <Route path='/map/:contentId' element={<CesiumMapPage />} />
          <Route path='/course/:courseId/map' element={<CesiumCoursePage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/signup' element={<SignupPage />} />
          <Route path='/reset-password' element={<ResetPasswordPage />} />
          <Route path='/terms' element={<TermsPage />} />
          <Route path='/privacy' element={<PrivacyPage />} />
          <Route path='/visits' element={<VisitFeedPage />} />
          <Route path='/travel-planner' element={<TravelPlannerPage />} />
          <Route path='/travel-planner/new' element={<TravelPlannerNewPage />} />
          <Route path='/travel-plans' element={<RequireAuth><TravelPlansPage /></RequireAuth>} />
          <Route path='/travel-plans/:planId' element={<RequireAuth><TravelPlanDetailPage /></RequireAuth>} />
          <Route path='/about' element={<AboutLayout />}>
            <Route index element={<AboutIncheonPage />} />
            <Route path='service' element={<AboutServicePage />} />
          </Route>
          <Route
            path='/visits/new'
            element={
              <RequireAuth>
                <VisitComposePage />
              </RequireAuth>
            }
          />
          <Route path='/visits/:verifyId' element={<VisitDetailPage />} />
          <Route
            path='/mypage'
            element={
              <RequireAuth>
                <MypageOverviewPage />
              </RequireAuth>
            }
          />
          <Route
            path='/mypage/passport'
            element={
              <RequireAuth>
                <PassportPage />
              </RequireAuth>
            }
          />
          <Route
            path='/mypage/passport/:regionId'
            element={
              <RequireAuth>
                <PassportRegionPage />
              </RequireAuth>
            }
          />
          <Route
            path='/mypage/verifications'
            element={
              <RequireAuth>
                <MyVerificationsPage />
              </RequireAuth>
            }
          />
          <Route
            path='/mypage/verifications/:verifyId'
            element={
              <RequireAuth>
                <MyVerificationManagePage />
              </RequireAuth>
            }
          />
          <Route
            path='/mypage/favorites'
            element={
              <RequireAuth>
                <SavedPlacesPage />
              </RequireAuth>
            }
          />
          <Route
            path='/mypage/profile'
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path='/mypage/notifications'
            element={
              <RequireAuth>
                <NotificationsPage />
              </RequireAuth>
            }
          />
          <Route
            path='/admin/reviews'
            element={
              <RequireAdmin>
                <AdminReviewPage />
              </RequireAdmin>
            }
          />
          <Route
            path='/admin/reviews/:verifyId'
            element={
              <RequireAdmin>
                <AdminReviewDetailPage />
              </RequireAdmin>
            }
          />
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
