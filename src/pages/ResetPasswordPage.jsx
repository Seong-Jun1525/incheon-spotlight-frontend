/**
 * ResetPasswordPage.jsx — 비밀번호 재설정 화면
 * - 라우트: `/reset-password` (공개)
 * - EmailCodeFields 로 가입 이메일을 인증한 뒤 새 비밀번호를 받아 resetPassword API 호출
 * - 성공하면 안내 문구를 담아 `/login` 으로 이동시킴
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCsrf, resetPassword } from '../api/authApi';
import { getApiErrorMessage, isSchemaNotReady } from '../api/http';
import { AuthPageShell } from '../components/auth/AuthPageShell';
import { EmailCodeFields } from '../components/auth/EmailCodeFields';
import { SchemaNotice } from '../components/stamp/NicknameAvatar';
import { PASSWORD_HINT, passwordConfirmError, passwordError } from '../utils/memberRules';
import styles from '../components/auth/AuthPage.module.scss';


export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [verified, setVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [schema, setSchema] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetchCsrf().catch(() => {});
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    const pwError = passwordError(newPassword) || passwordConfirmError(newPassword, newPasswordConfirm);
    if (!verified) {
      setError('이메일 인증을 완료해 주세요.');
      return;
    }
    if (pwError) {
      setError(pwError);
      return;
    }
    setPending(true);
    setError('');
    setSchema(false);
    try {
      const result = await resetPassword({ email, newPassword, newPasswordConfirm });
      navigate('/login', {
        replace: true,
        state: { notice: result.message || '비밀번호를 바꿨습니다. 새 비밀번호로 로그인해 주세요.' },
      });
    } catch (err) {
      setSchema(isSchemaNotReady(err));
      setError(getApiErrorMessage(err, '비밀번호를 바꾸지 못했습니다.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPageShell
      current='비밀번호 재설정'
      title='비밀번호 재설정'
      description='가입한 이메일로 인증한 뒤 새 비밀번호를 등록합니다.'
      aside={
        <>
          <h2>재설정 안내</h2>
          <ul>
            <li>인증번호는 숫자 6자리이며 일정 시간 후 만료됩니다.</li>
            <li>가입되지 않은 이메일이어도 동일한 안내를 보여 계정 존재 여부를 알려 주지 않습니다.</li>
            <li>재설정이 끝나면 기존 로그인 세션은 사용할 수 없습니다.</li>
          </ul>
        </>
      }
    >
      {schema ? <SchemaNotice compact /> : null}
      {error && !schema ? (
        <p className={styles.alert} role='alert'>
          {error}
        </p>
      ) : null}
      <form onSubmit={onSubmit}>
        <div className={styles.table}>
          <EmailCodeFields
            purpose='RESET'
            styles={styles}
            email={email}
            onEmailChange={setEmail}
            verified={verified}
            onVerifiedChange={setVerified}
            onSchema={setSchema}
            disabled={pending}
            emailHint='가입한 이메일로 인증번호를 받습니다.'
          />
          <div className={styles.row}>
            <label className={styles.label} htmlFor='reset-password'>
              새 비밀번호
              <span className={styles.required} aria-hidden='true'>
                *
              </span>
            </label>
            <div className={styles.control}>
              <input
                id='reset-password'
                type='password'
                autoComplete='new-password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                maxLength={72}
              />
              <p className={styles.hint}>{PASSWORD_HINT}</p>
            </div>
          </div>
          <div className={styles.row}>
            <label className={styles.label} htmlFor='reset-password2'>
              새 비밀번호 확인
              <span className={styles.required} aria-hidden='true'>
                *
              </span>
            </label>
            <div className={styles.control}>
              <input
                id='reset-password2'
                type='password'
                autoComplete='new-password'
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <p className={styles.reqNote}>
          <span className={styles.required}>*</span> 표시는 필수 입력 항목입니다.
        </p>
        <div className={styles.actions}>
          <Link className={styles.ghost} to='/login'>
            취소
          </Link>
          <button className={styles.submit} type='submit' disabled={pending || !verified}>
            {pending ? '변경 중' : '비밀번호 변경'}
          </button>
        </div>
      </form>
    </AuthPageShell>
  );
}
