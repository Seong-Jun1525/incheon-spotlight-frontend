/**
 * LanguageSelect.jsx — 화면 언어(ko/en/ja/zh-CN) 선택 드롭다운
 * - i18n 현재 언어를 트리거로 보여주고, 메뉴는 portal로 뷰포트에 맞춰 위·아래 배치
 * - 키보드(Esc·화살표)와 바깥 클릭으로 닫히며 선택 시 i18n.changeLanguage 호출
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, normalizeLanguage } from '../../i18n/languages';
import styles from './LanguageSelect.module.scss';

const LANGUAGE_CODES = { ko: 'KO', en: 'EN', ja: 'JA', 'zh-CN': 'ZH' };

export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const id = useId();
  const selectedCode = normalizeLanguage(i18n.resolvedLanguage);
  const selected = LANGUAGES.find(({ code }) => code === selectedCode);

  useLayoutEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!menu || !trigger) return;

    // The portal keeps the menu visible inside scrollable map sidebars.
    const anchor = trigger.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const { width, height } = menu.getBoundingClientRect();
    const below = viewportHeight - anchor.bottom - 20;
    const above = anchor.top - 20;
    const placeAbove = below < height && above > below;
    const availableHeight = Math.max(0, placeAbove ? above : below);
    const visibleHeight = Math.min(height, availableHeight);

    menu.style.left = `${Math.max(12, Math.min(anchor.right - width, viewportWidth - width - 12))}px`;
    menu.style.top = `${Math.max(12, placeAbove ? anchor.top - visibleHeight - 8 : anchor.bottom + 8)}px`;
    menu.style.maxHeight = `${availableHeight}px`;
    menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const dismissOutside = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const dismissOnViewportChange = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('focusin', dismissOutside);
    window.addEventListener('resize', dismissOnViewportChange);
    document.addEventListener('scroll', dismissOnViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('focusin', dismissOutside);
      window.removeEventListener('resize', dismissOnViewportChange);
      document.removeEventListener('scroll', dismissOnViewportChange, true);
    };
  }, [open]);

  const closeAndFocus = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  const handleMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeAndFocus();
      return;
    }
    if (event.key === 'Tab') {
      // Let the browser continue from the trigger's original place in the page.
      closeAndFocus();
      return;
    }

    const options = Array.from(menuRef.current.querySelectorAll('[role="menuitemradio"]'));
    const index = options.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % options.length;
    if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      options[next].focus();
    }
  };

  return (
    <span className={styles.root}>
      <button
        ref={triggerRef}
        type='button'
        className={styles.trigger}
        aria-label={`${t('language.select')}: ${selected.label}`}
        aria-haspopup='menu'
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Globe2 size={16} strokeWidth={1.8} aria-hidden='true' />
        <span className={styles.current} lang={selected.code}>{selected.label}</span>
        <ChevronDown size={13} className={styles.chevron} aria-hidden='true' />
      </button>
      {open && createPortal(
        <div ref={menuRef} className={styles.menu} onKeyDown={handleMenuKeyDown}>
          <div id={`${id}-label`} className={styles.heading}>{t('language.select')}</div>
          <div id={`${id}-menu`} role='menu' aria-labelledby={`${id}-label`}>
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                type='button'
                role='menuitemradio'
                aria-checked={selectedCode === code}
                tabIndex={-1}
                className={styles.option}
                onClick={() => {
                  void i18n.changeLanguage(code);
                  closeAndFocus();
                }}
              >
                <span className={styles.code} aria-hidden='true'>{LANGUAGE_CODES[code]}</span>
                <span className={styles.label} lang={code}>{label}</span>
                {selectedCode === code && <Check size={16} strokeWidth={2.5} aria-hidden='true' />}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
