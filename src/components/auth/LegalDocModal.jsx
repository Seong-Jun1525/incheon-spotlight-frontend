/**
 * LegalDocModal.jsx — 이용약관·개인정보 처리 안내를 보여주는 모달
 * - kind에 따라 legalDocuments의 TermsArticle/PrivacyArticle을 렌더
 * - 포커스 트랩, Escape 닫기, body 스크롤 잠금을 처리
 */
import { useEffect, useId, useRef } from 'react';
import { LEGAL_DOCS, PrivacyArticle, TermsArticle } from './legalDocuments';
import styles from './AuthPage.module.scss';

export function LegalDocModal({ kind, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();
  const doc = kind ? LEGAL_DOCS[kind] : null;

  useEffect(() => {
    if (!doc) {
      return undefined;
    }
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function onKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }
      const focusable = dialogRef.current.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [doc, onClose]);

  if (!doc) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.modal}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <h2 id={titleId}>{doc.title}</h2>
          <p>{doc.description}</p>
        </div>
        <div className={styles.modalBody}>
          {kind === 'privacy' ? (
            <PrivacyArticle className={styles.doc} />
          ) : (
            <TermsArticle className={styles.doc} />
          )}
        </div>
        <div className={styles.modalActions}>
          <button ref={closeRef} className={styles.submit} type='button' onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
