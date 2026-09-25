/**
 * EmailAddressFields.jsx — 로컬파트 + 도메인 선택으로 이메일을 입력하는 필드
 * - 주요 포털 도메인 목록과 '직접 입력'을 지원하고 composeEmail로 완성 주소를 부모에 전달
 * - 인증 완료(verified)면 필드를 잠가 재입력을 막음
 */
import { useEffect, useState } from 'react';
import {
  CUSTOM_DOMAIN,
  DEFAULT_DOMAIN,
  EMAIL_DOMAINS,
  composeEmail,
  parseEmailAddress,
} from '../../utils/emailAddress';

function selectedDomain(parsed) {
  if (!parsed.domain) {
    return DEFAULT_DOMAIN;
  }
  return parsed.custom ? CUSTOM_DOMAIN : parsed.domain;
}

export function EmailAddressFields({
  id,
  styles,
  email,
  onEmailChange,
  verified = false,
  disabled = false,
}) {
  const parsed = parseEmailAddress(email);
  const [localPart, setLocalPart] = useState(parsed.localPart);
  const [domainOption, setDomainOption] = useState(selectedDomain(parsed));
  const [customDomain, setCustomDomain] = useState(parsed.custom ? parsed.domain : '');

  useEffect(() => {
    const next = parseEmailAddress(email);
    setLocalPart(next.localPart);
    if (next.domain) {
      setDomainOption(selectedDomain(next));
      setCustomDomain(next.custom ? next.domain : '');
    }
  }, [email]);

  function emit(nextLocal, nextOption, nextCustom) {
    const host = nextOption === CUSTOM_DOMAIN ? nextCustom : nextOption;
    onEmailChange(composeEmail(nextLocal, host));
  }

  function handleLocalChange(value) {
    if (value.includes('@')) {
      const pasted = parseEmailAddress(value);
      const option = selectedDomain(pasted);
      const custom = pasted.custom ? pasted.domain : '';
      setLocalPart(pasted.localPart);
      if (pasted.domain) {
        setDomainOption(option);
        setCustomDomain(custom);
      }
      emit(pasted.localPart, pasted.domain ? option : domainOption, pasted.domain ? custom : customDomain);
      return;
    }
    setLocalPart(value);
    emit(value, domainOption, customDomain);
  }

  function handleDomainChange(value) {
    setDomainOption(value);
    emit(localPart, value, customDomain);
  }

  function handleCustomDomainChange(value) {
    const host = value.replace(/@/g, '').trim();
    setCustomDomain(host);
    emit(localPart, CUSTOM_DOMAIN, host);
  }

  const locked = verified || disabled;

  return (
    <div className={styles.emailCompose}>
      <input
        id={id}
        type='text'
        autoComplete='username'
        inputMode='email'
        value={localPart}
        onChange={(e) => handleLocalChange(e.target.value)}
        required
        readOnly={verified}
        disabled={locked && !verified}
        aria-label='이메일 아이디'
        placeholder='아이디'
      />
      <span className={styles.emailAt} aria-hidden='true'>
        @
      </span>
      <select
        className={styles.emailDomain}
        aria-label='이메일 도메인'
        value={domainOption}
        onChange={(e) => handleDomainChange(e.target.value)}
        disabled={locked}
      >
        {EMAIL_DOMAINS.map((domain) => (
          <option key={domain.value} value={domain.value}>
            {domain.label}
          </option>
        ))}
        <option value={CUSTOM_DOMAIN}>직접입력</option>
      </select>
      {domainOption === CUSTOM_DOMAIN ? (
        <input
          type='text'
          autoComplete='off'
          inputMode='url'
          value={customDomain}
          onChange={(e) => handleCustomDomainChange(e.target.value)}
          required
          readOnly={verified}
          disabled={locked && !verified}
          aria-label='이메일 도메인 직접입력'
          placeholder='예: example.com'
        />
      ) : null}
    </div>
  );
}
