/**
 * SignupPage.jsx — 회원가입 화면
 * - 라우트: `/signup` (공개)
 * - 약관 동의 → 이메일 인증(EmailCodeFields) → 회원 정보 입력 3단계를 한 폼에서 진행
 * - memberRules 검증을 통과하면 signup API 를 호출하고 안내 문구와 함께 `/login` 으로 이동
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCsrf, signup } from '../api/authApi';
import { getApiErrorMessage, isSchemaNotReady } from '../api/http';
import { AuthPageShell } from '../components/auth/AuthPageShell';
import { EmailCodeFields } from '../components/auth/EmailCodeFields';
import { LegalDocModal } from '../components/auth/LegalDocModal';
import { SchemaNotice } from '../components/stamp/NicknameAvatar';
import {
  PASSWORD_HINT,
  formatPhone,
  nameError,
  passwordConfirmError,
  passwordError,
  phoneError,
} from '../utils/memberRules';
import styles from '../components/auth/AuthPage.module.scss';

function signupSteps(agreed) {
  return [
    { n: '01', label: '약관 동의', caption: '이용안내 확인', state: agreed ? 'done' : 'current' },
    { n: '02', label: '정보 입력', caption: '이메일 인증·회원 정보', state: agreed ? 'current' : 'wait' },
    { n: '03', label: '가입 완료', caption: '로그인 후 이용', state: 'wait' },
  ];
}


export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
    agreeTerms: false,
    agreePrivacy: false,
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [legalKind, setLegalKind] = useState('');
  const [error, setError] = useState('');
  const [schema, setSchema] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetchCsrf().catch(() => {});
  }, []);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const agreeAll = form.agreeTerms && form.agreePrivacy;

  async function onSubmit(event) {
    event.preventDefault();
    const invalid =
      nameError(form.name) ||
      phoneError(form.phone) ||
      passwordError(form.password) ||
      passwordConfirmError(form.password, form.passwordConfirm);
    if (!emailVerified) {
      setError('이메일 인증을 완료해 주세요.');
      return;
    }
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError('');
    setSchema(false);
    try {
      await signup({
        ...form,
        phone: form.phone.replace(/\D/g, ''),
      });
      navigate('/login', {
        replace: true,
        state: { notice: '회원가입이 완료되었습니다. 로그인해 주세요.' },
      });
    } catch (err) {
      setSchema(isSchemaNotReady(err));
      setError(getApiErrorMessage(err, '회원가입에 실패했습니다.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPageShell
      current='회원가입'
      title='회원가입'
      description='방문 인증과 지역 스탬프를 이용하려면 회원 정보를 등록해 주세요.'
      steps={signupSteps(agreeAll)}
      aside={
        <>
          <h2>가입 시 안내</h2>
          <ul>
            <li>관리자 권한은 회원가입으로 부여되지 않습니다.</li>
            <li>이메일 인증번호는 숫자 6자리이며, 원문은 저장하지 않습니다.</li>
            <li>비밀번호는 암호화하여 저장하며, 조회 응답에 포함하지 않습니다.</li>
            <li>방문 인증 사진은 방문 확인 자료로 보관될 수 있습니다.</li>
          </ul>
          <p>이용약관과 개인정보 처리 안내는 법률 검토 전 초안입니다.</p>
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
        <section className={styles.section} aria-labelledby='signup-agree-title'>
          <h2 id='signup-agree-title'>약관 동의</h2>
          <div className={styles.agreeBox}>
            <label className={styles.agreeAll}>
              <input
                type='checkbox'
                checked={agreeAll}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    agreeTerms: e.target.checked,
                    agreePrivacy: e.target.checked,
                  }));
                }}
              />
              이용약관 및 개인정보 처리 안내에 모두 동의합니다.
            </label>
            <div className={styles.agreeItem}>
              <label className={styles.agreeLabel}>
                <input
                  type='checkbox'
                  checked={form.agreeTerms}
                  onChange={(e) => setField('agreeTerms', e.target.checked)}
                  required
                />
                <span>
                  <span className={styles.required} aria-hidden='true'>
                    [필수]
                  </span>{' '}
                  이용약관 동의
                </span>
              </label>
              <button className={styles.agreeLink} type='button' onClick={() => setLegalKind('terms')}>
                내용 보기
              </button>
            </div>
            <div className={styles.agreeItem}>
              <label className={styles.agreeLabel}>
                <input
                  type='checkbox'
                  checked={form.agreePrivacy}
                  onChange={(e) => setField('agreePrivacy', e.target.checked)}
                  required
                />
                <span>
                  <span className={styles.required} aria-hidden='true'>
                    [필수]
                  </span>{' '}
                  개인정보 처리 안내 동의
                </span>
              </label>
              <button className={styles.agreeLink} type='button' onClick={() => setLegalKind('privacy')}>
                내용 보기
              </button>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby='signup-info-title'>
          <h2 id='signup-info-title'>회원 정보</h2>
          <div className={styles.table}>
            <div className={styles.row}>
              <label className={styles.label} htmlFor='signup-name'>
                이름
                <span className={styles.required} aria-hidden='true'>
                  *
                </span>
              </label>
              <div className={styles.control}>
                <input
                  id='signup-name'
                  type='text'
                  autoComplete='name'
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  required
                  minLength={2}
                  maxLength={20}
                />
                <p className={styles.hint}>한글 또는 영문 2~20자.</p>
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.label} htmlFor='signup-phone'>
                휴대전화
                <span className={styles.required} aria-hidden='true'>
                  *
                </span>
              </label>
              <div className={styles.control}>
                <input
                  id='signup-phone'
                  type='tel'
                  autoComplete='tel'
                  inputMode='numeric'
                  value={form.phone}
                  onChange={(e) => setField('phone', formatPhone(e.target.value))}
                  required
                />
                <p className={styles.hint}>숫자만 입력하면 됩니다. 예: 010-1234-5678</p>
              </div>
            </div>
            <EmailCodeFields
              purpose='SIGNUP'
              styles={styles}
              email={form.email}
              onEmailChange={(value) => setField('email', value)}
              verified={emailVerified}
              onVerifiedChange={setEmailVerified}
              onSchema={setSchema}
              disabled={pending}
              emailHint='로그인 아이디로 사용합니다. 도메인을 고르거나 직접 입력할 수 있습니다.'
            />
            <div className={styles.row}>
              <label className={styles.label} htmlFor='signup-nickname'>
                닉네임
                <span className={styles.required} aria-hidden='true'>
                  *
                </span>
              </label>
              <div className={styles.control}>
                <input
                  id='signup-nickname'
                  type='text'
                  autoComplete='nickname'
                  value={form.nickname}
                  onChange={(e) => setField('nickname', e.target.value)}
                  required
                  minLength={2}
                  maxLength={20}
                />
                <p className={styles.hint}>2~20자. 공개 방문 기록에 표시됩니다.</p>
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.label} htmlFor='signup-password'>
                비밀번호
                <span className={styles.required} aria-hidden='true'>
                  *
                </span>
              </label>
              <div className={styles.control}>
                <input
                  id='signup-password'
                  type='password'
                  autoComplete='new-password'
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  required
                  minLength={8}
                  maxLength={72}
                />
                <p className={styles.hint}>{PASSWORD_HINT}</p>
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.label} htmlFor='signup-password2'>
                비밀번호 확인
                <span className={styles.required} aria-hidden='true'>
                  *
                </span>
              </label>
              <div className={styles.control}>
                <input
                  id='signup-password2'
                  type='password'
                  autoComplete='new-password'
                  value={form.passwordConfirm}
                  onChange={(e) => setField('passwordConfirm', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <p className={styles.reqNote}>
            <span className={styles.required}>*</span> 표시는 필수 입력 항목입니다.
          </p>
        </section>

        <p className={styles.footerNote}>
          이미 등록한 계정이 있으면 <Link to='/login'>로그인</Link>해 주세요.
        </p>
        <div className={styles.actions}>
          <Link className={styles.ghost} to='/login'>
            취소
          </Link>
          <button className={styles.submit} type='submit' disabled={pending || !agreeAll || !emailVerified}>
            {pending ? '등록 중' : '회원가입'}
          </button>
        </div>
      </form>
      <LegalDocModal kind={legalKind} onClose={() => setLegalKind('')} />
    </AuthPageShell>
  );
}
