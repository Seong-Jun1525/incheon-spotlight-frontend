/**
 * LoginPage.jsx — 이메일·비밀번호 로그인 화면과 약관·개인정보 안내 문서 화면
 * - 라우트: `/login` (공개), 같은 파일의 TermsPage 는 `/terms`, PrivacyPage 는 `/privacy`
 * - CSRF 토큰을 미리 받아 두고 useAuthStore.login 으로 인증한 뒤 location.state.from 경로로 복귀
 * - AuthPageShell 위에 폼을 올리고 스키마 미준비 안내와 로그인 실패 메시지를 구분해 표시
 */
import { uiText, useUiLanguage } from '../i18n/uiText';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchCsrf } from '../api/authApi';
import { getApiErrorMessage, isSchemaNotReady } from '../api/http';
import { AuthPageShell } from '../components/auth/AuthPageShell';
import { PrivacyArticle, TermsArticle } from '../components/auth/legalDocuments';
import { SchemaNotice } from '../components/stamp/NicknameAvatar';
import { useAuthStore } from '../stores/useAuthStore';
import { safeInternalPath } from '../utils/safeUrl';
import styles from '../components/auth/AuthPage.module.scss';


export default function LoginPage() {
  useUiLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [schema, setSchema] = useState(false);
  const [pending, setPending] = useState(false);
  const from = safeInternalPath(location.state?.from, '/mypage');
  const notice = location.state?.notice;

  useEffect(() => {
    fetchCsrf().catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.authenticated) navigate(from, { replace: true });
  }, [user, from, navigate]);

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError('');
    setSchema(false);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setSchema(isSchemaNotReady(err));
      setError(getApiErrorMessage(err, t('auth.loginFailed')));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPageShell
      current={t('nav.login')}
      title={t('nav.login')}
      description={t('auth.loginDescription')}
      aside={
        <>
          <h2>{t('auth.loginGuide')}</h2>
          <ul>
            <li>{t('auth.credentials')}</li>
            <li>{t('auth.noSocial')}</li>
            <li>{t('auth.session')}</li>
          </ul>
        </>
      }
    >
      {notice ? (
        <p className={styles.notice} role='status'>
          {uiText(notice)}
        </p>
      ) : null}
      {schema ? <SchemaNotice compact /> : null}
      {error && !schema ? (
        <p className={styles.alert} role='alert'>
          {uiText(error)}
        </p>
      ) : null}
      <form onSubmit={onSubmit}>
        <div className={styles.table}>
          <div className={styles.row}>
            <label className={styles.label} htmlFor='login-email'>{t('auth.email')}<span className={styles.required} aria-hidden='true'>
                *
              </span>
            </label>
            <div className={styles.control}>
              <input
                id='login-email'
                type='email'
                autoComplete='username'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.row}>
            <label className={styles.label} htmlFor='login-password'>{t('auth.password')}<span className={styles.required} aria-hidden='true'>
                *
              </span>
            </label>
            <div className={styles.control}>
              <input
                id='login-password'
                type='password'
                autoComplete='current-password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <p className={styles.reqNote}>
          <span className={styles.required}>*</span>{t('auth.required')}</p>
        <p className={styles.footerNote}>{t('auth.forgot')}<Link to='/reset-password'>{t('auth.reset')}</Link>
        </p>
        <div className={styles.actions}>
          <Link className={styles.ghost} to='/signup'>{t('nav.signup')}</Link>
          <button className={styles.submit} type='submit' disabled={pending}>
            {uiText(pending ? t('auth.loggingIn') : t('nav.login'))}
          </button>
        </div>
      </form>
    </AuthPageShell>
  );
}

export function TermsPage() {
  useUiLanguage();
  return (
    <AuthPageShell
      current={uiText("이용약관")}
      title={uiText("이용약관")}
      description={uiText("인천 관광정보 서비스 이용에 관한 안내입니다.")}
      disclaimer='이 문서는 법률 검토를 거치지 않은 검토용 초안이며, 실제 서비스 약관으로 확정되지 않았습니다.'
    >
      <TermsArticle className={styles.doc} />
    </AuthPageShell>
  );
}

export function PrivacyPage() {
  useUiLanguage();
  return (
    <AuthPageShell
      current={uiText("개인정보 처리 안내")}
      title={uiText("개인정보 처리 안내")}
      description={uiText("회원 가입 및 방문 인증 과정에서 처리하는 개인정보 항목을 안내합니다.")}
      disclaimer='이 문서는 법률 검토를 거치지 않은 검토용 초안이며, 실제 개인정보 처리방침으로 확정되지 않았습니다.'
    >
      <PrivacyArticle className={styles.doc} />
    </AuthPageShell>
  );
}
