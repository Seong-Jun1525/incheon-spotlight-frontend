/**
 * ProfilePage.jsx — 내 정보 관리 화면
 * - 라우트: `/mypage/profile` (로그인 필요)
 * - 이름·휴대전화·닉네임을 memberRules 로 검증한 뒤 changeProfile·changeNickname 으로 저장
 * - 비밀번호 변경은 changePassword 후 로그아웃하고 안내 문구와 함께 `/login` 으로 이동
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeNickname, changePassword, changeProfile } from '../../api/authApi';
import { getApiErrorMessage } from '../../api/http';
import { MypageLayout } from '../../components/layout/SiteChrome';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  PASSWORD_HINT,
  formatPhone,
  nameError,
  passwordConfirmError,
  passwordError,
  phoneError,
} from '../../utils/memberRules';
import styles from '../../components/layout/MemberShell.module.scss';

function nicknameError(value) {
  const nickname = String(value || '').trim();
  if (nickname.length < 2 || nickname.length > 20) {
    return '닉네임은 2~20자로 입력해 주세요.';
  }
  return '';
}

export default function ProfilePage() {
  useUiLanguage();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(formatPhone(user?.phone || ''));
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [passwordErrorText, setPasswordErrorText] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveAccount(event) {
    event.preventDefault();
    const invalid = nameError(name) || phoneError(phone) || nicknameError(nickname);
    if (invalid) {
      setAccountError(invalid);
      setAccountMessage('');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    const profileChanged =
      name.trim() !== String(user?.name || '').trim()
      || phoneDigits !== String(user?.phone || '').replace(/\D/g, '');
    const nickChanged = nickname.trim() !== String(user?.nickname || '').trim();
    if (!profileChanged && !nickChanged) {
      setAccountError('');
      setAccountMessage('변경된 내용이 없습니다.');
      return;
    }
    setSavingAccount(true);
    setAccountError('');
    setAccountMessage('');
    try {
      let next = user;
      if (profileChanged) {
        next = await changeProfile({ name, phone: phoneDigits });
        setUser(next);
      }
      if (nickChanged) {
        next = await changeNickname(nickname.trim());
        setUser(next);
      }
      setAccountMessage('계정 정보를 저장했습니다.');
    } catch (err) {
      setAccountError(getApiErrorMessage(err));
    } finally {
      setSavingAccount(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    const pwError = passwordError(newPassword) || passwordConfirmError(newPassword, newPasswordConfirm);
    if (pwError) {
      setPasswordErrorText(pwError);
      return;
    }
    setSavingPassword(true);
    setPasswordErrorText('');
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      });
      await logout();
      navigate('/login', { replace: true, state: { notice: result.message } });
    } catch (err) {
      setPasswordErrorText(getApiErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <MypageLayout
      title={uiText("내 정보 관리")}
      description={uiText("로그인 계정에 등록된 이름, 연락처, 표시 이름과 비밀번호를 관리합니다.")}
    >
      <form className={styles.profileCard} onSubmit={saveAccount}>
        <div className={styles.profileHead}>
          <div>
            <h2>{uiText("계정 정보")}</h2>
            <p>{uiText("방문 기록과 안내에 쓰이는 이름입니다.")}</p>
          </div>
        </div>
        <div className={styles.profileBody}>
          {accountMessage ? <p className={styles.notice} role='status'>{uiText(accountMessage)}</p> : null}
          {accountError ? <p className={styles.alert} role='alert'>{uiText(accountError)}</p> : null}
          <div className={styles.profileRow}>
            <label htmlFor='member-email'>{uiText("이메일")}</label>
            <div className={styles.profileControl}>
              <div className={styles.field}>
                <input
                  id='member-email'
                  value={user?.email || ''}
                  readOnly
                  autoComplete='username'
                />
              </div>
              <p className={styles.fieldHint}>{uiText("로그인 아이디이며 변경할 수 없습니다.")}</p>
            </div>
          </div>
          <div className={styles.profileRow}>
            <label htmlFor='member-name'>{uiText("이름")}</label>
            <div className={styles.profileControl}>
              <div className={styles.field}>
                <input
                  id='member-name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={20}
                  autoComplete='name'
                  required
                />
              </div>
            </div>
          </div>
          <div className={styles.profileRow}>
            <label htmlFor='member-phone'>{uiText("휴대전화")}</label>
            <div className={styles.profileControl}>
              <div className={styles.field}>
                <input
                  id='member-phone'
                  type='tel'
                  inputMode='numeric'
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  autoComplete='tel'
                  required
                />
              </div>
            </div>
          </div>
          <div className={styles.profileRow}>
            <label htmlFor='nick'>{uiText("닉네임")}</label>
            <div className={styles.profileControl}>
              <div className={styles.field}>
                <input
                  id='nick'
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  minLength={2}
                  maxLength={20}
                  autoComplete='nickname'
                  required
                />
              </div>
              <p className={styles.fieldHint}>{uiText("2~20자. 공개 방문 기록에 표시됩니다.")}</p>
            </div>
          </div>
        </div>
        <div className={styles.profileActions}>
          <button className={styles.primary} type='submit' disabled={savingAccount}>
            {uiText(savingAccount ? '저장 중' : '저장')}
          </button>
        </div>
      </form>

      <form className={styles.profileCard} onSubmit={savePassword}>
        <div className={styles.profileHead}>
          <div>
            <h2>{uiText("비밀번호")}</h2>
            <p>{uiText("변경이 끝나면 다시 로그인합니다.")}</p>
          </div>
        </div>
        <div className={styles.profileBody}>
          {passwordErrorText ? <p className={styles.alert} role='alert'>{uiText(passwordErrorText)}</p> : null}
          <div className={styles.profileRow}>
            <label htmlFor='cur-pw'>{uiText("현재 비밀번호")}</label>
            <div className={styles.profileControl}>
              <div className={styles.field}>
                <input
                  id='cur-pw'
                  type='password'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete='current-password'
                  required
                />
              </div>
            </div>
          </div>
          <div className={styles.profileRow}>
            <label htmlFor='new-pw'>{uiText("새 비밀번호")}</label>
            <div className={styles.profileControl}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <input
                    id='new-pw'
                    type='password'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    maxLength={72}
                    autoComplete='new-password'
                    required
                    aria-label={uiText("새 비밀번호")}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.visuallyHidden} htmlFor='new-pw2'>{uiText("새 비밀번호 확인")}</label>
                  <input
                    id='new-pw2'
                    type='password'
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    autoComplete='new-password'
                    required
                    aria-label={uiText("새 비밀번호 확인")}
                  />
                </div>
              </div>
              <p className={styles.fieldHint}>{uiText(PASSWORD_HINT)}</p>
            </div>
          </div>
        </div>
        <div className={styles.profileActions}>
          <button className={styles.primary} type='submit' disabled={savingPassword}>
            {uiText(savingPassword ? '변경 중' : '비밀번호 변경')}
          </button>
        </div>
      </form>
    </MypageLayout>
  );
}
