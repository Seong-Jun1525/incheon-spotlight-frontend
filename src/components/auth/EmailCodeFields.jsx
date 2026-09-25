/**
 * EmailCodeFields.jsx — 이메일 입력과 6자리 인증번호 발송·확인 UI
 * - sendEmailCode / confirmEmailCode를 호출하고 재발송 쿨다운을 초 단위로 표시
 * - purpose(가입·비밀번호 재설정 등)에 따라 API를 구분하며 인증 성공 시 onVerifiedChange(true)
 */
import { useEffect, useState } from 'react';
import { confirmEmailCode, sendEmailCode } from '../../api/authApi';
import { getApiErrorMessage, isSchemaNotReady } from '../../api/http';
import { emailCodeError, emailError } from '../../utils/memberRules';
import { EmailAddressFields } from './EmailAddressFields';

export function EmailCodeFields({
  purpose,
  styles,
  email,
  onEmailChange,
  verified,
  onVerifiedChange,
  onSchema,
  disabled = false,
  emailHint = '로그인 아이디로 사용합니다. 소문자로 저장됩니다.',
}) {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    if (!cooldownUntil) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setCooldownLeft(Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  function handleEmailChange(value) {
    onEmailChange(value);
    if (verified) {
      onVerifiedChange(false);
    }
    setCode('');
    setLocalError('');
    setStatus('');
    setCooldownUntil(0);
    setCooldownLeft(0);
  }

  async function onSend() {
    const invalidEmail = emailError(email);
    if (invalidEmail) {
      setLocalError(invalidEmail);
      return;
    }
    setLocalError('');
    setStatus('');
    onSchema?.(false);
    setSending(true);
    try {
      const result = await sendEmailCode({ email, purpose });
      const wait = result.cooldownSeconds || 60;
      setCooldownUntil(Date.now() + wait * 1000);
      setCooldownLeft(wait);
      const minutes = Math.max(1, Math.round((result.expiresInSeconds || 300) / 60));
      if (result.delivery === 'local-inbox' && result.hint) {
        setStatus(result.hint);
      } else if (result.delivery === 'smtp') {
        setStatus(`인증번호를 이메일로 보냈습니다. ${minutes}분 안에 입력해 주세요.`);
      } else {
        const hint = result.hint ? ` ${result.hint}` : '';
        setStatus(`인증번호를 보냈습니다. ${minutes}분 안에 입력해 주세요.${hint}`);
      }
    } catch (err) {
      if (isSchemaNotReady(err)) {
        onSchema?.(true);
      } else {
        onSchema?.(false);
        setLocalError(getApiErrorMessage(err, '인증번호를 보내지 못했습니다.'));
      }
    } finally {
      setSending(false);
    }
  }

  async function onConfirm() {
    const invalid = emailCodeError(code);
    if (invalid) {
      setLocalError(invalid);
      return;
    }
    setLocalError('');
    onSchema?.(false);
    setConfirming(true);
    try {
      await confirmEmailCode({ email, purpose, code: code.trim() });
      onVerifiedChange(true);
      setStatus('이메일 인증이 완료되었습니다.');
    } catch (err) {
      if (isSchemaNotReady(err)) {
        onSchema?.(true);
      } else {
        onSchema?.(false);
        setLocalError(getApiErrorMessage(err, '인증번호가 올바르지 않습니다.'));
      }
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <div className={styles.row}>
        <label className={styles.label} htmlFor={`email-${purpose}`}>
          이메일
          <span className={styles.required} aria-hidden='true'>
            *
          </span>
        </label>
        <div className={styles.control}>
          <div className={styles.inlineField}>
            <EmailAddressFields
              id={`email-${purpose}`}
              styles={styles}
              email={email}
              onEmailChange={handleEmailChange}
              verified={verified}
              disabled={disabled}
            />
            {verified ? (
              <span className={styles.badgeOk}>인증 완료</span>
            ) : (
              <button
                className={styles.smallBtn}
                type='button'
                onClick={onSend}
                disabled={disabled || sending || Boolean(emailError(email)) || cooldownLeft > 0}
              >
                {sending ? '발송 중' : cooldownLeft > 0 ? `재발송 ${cooldownLeft}초` : '인증번호 발송'}
              </button>
            )}
          </div>
          <p className={styles.hint}>{emailHint}</p>
        </div>
      </div>
      {verified ? null : (
        <div className={styles.row}>
          <label className={styles.label} htmlFor={`code-${purpose}`}>
            인증번호
            <span className={styles.required} aria-hidden='true'>
              *
            </span>
          </label>
          <div className={styles.control}>
            <div className={styles.inlineField}>
              <input
                id={`code-${purpose}`}
                type='text'
                inputMode='numeric'
                autoComplete='one-time-code'
                maxLength={6}
                pattern='[0-9]{6}'
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={disabled}
              />
              <button
                className={styles.smallBtn}
                type='button'
                onClick={onConfirm}
                disabled={disabled || confirming || code.length !== 6}
              >
                {confirming ? '확인 중' : '확인'}
              </button>
            </div>
            <p className={styles.hint}>이메일로 받은 숫자 6자리를 입력한 뒤 확인해 주세요.</p>
          </div>
        </div>
      )}
      {status ? (
        <p className={styles.notice} role='status'>
          {status}
        </p>
      ) : null}
      {localError ? (
        <p className={styles.alert} role='alert'>
          {localError}
        </p>
      ) : null}
    </>
  );
}
