/**
 * AiChatPanel.jsx — AI 챗봇 플로팅 패널과 실행 버튼(AiChatLauncher)
 * - useAiChatStore로 '질문'/'코스' 탭을 전환하고, useAiChat 훅으로 메시지 전송·취소·초기화
 * - 답변에 사용 출처 요약, 추천 장소 카드, 주변 맛집 선택기를 함께 붙여 렌더링
 * - Escape 닫기, 입력 자동 포커스, 스레드 자동 스크롤, 패널 밖 스크롤 전파 차단을 처리
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPinned, Send, MessageCircle, Square, X } from 'lucide-react';
import { AI_TOOL_LABELS, buildAiSuggestions, useAiChat } from '../../hooks/useAiChat';
import { districtLabels } from '../../data/incheonDistricts';
import { formatAiAnswer } from '../../utils/formatAiAnswer';
import { AiCourseStudio } from './AiCourseStudio';
import {
  AiThinkingTrace,
  AiThoughtSummary,
} from './AiThinkingTrace';
import { NearbyFoodPicker, groupsFromVerifiedPlaces } from './NearbyFoodPicker';
import { useAiChatStore } from '../../stores/useAiChatStore';
import styles from './AiChatPanel.module.scss';

function isVerticallyScrollable(el) {
  if (!(el instanceof HTMLElement)) return false;
  const overflowY = window.getComputedStyle(el).overflowY;
  if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
    return false;
  }
  return el.scrollHeight - el.clientHeight > 1;
}

function findScrollableAncestor(start, root) {
  let el = start instanceof Element ? start : root;
  while (el && root.contains(el)) {
    if (isVerticallyScrollable(el)) return el;
    if (el === root) break;
    el = el.parentElement;
  }
  return null;
}

function shouldBlockOverscroll(scrollable, deltaY) {
  if (!scrollable || deltaY === 0) return true;
  const atTop = scrollable.scrollTop <= 0;
  const atBottom =
    scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
  return (deltaY < 0 && atTop) || (deltaY > 0 && atBottom);
}

function containPanelScroll(node) {
  let touchY = null;

  const onWheel = (event) => {
    const scrollable = findScrollableAncestor(event.target, node);
    if (shouldBlockOverscroll(scrollable, event.deltaY)) {
      event.preventDefault();
    }
  };

  const onTouchStart = (event) => {
    touchY = event.touches[0]?.clientY ?? null;
  };

  const onTouchMove = (event) => {
    if (touchY == null || event.touches.length !== 1) return;
    const currentY = event.touches[0].clientY;
    const deltaY = touchY - currentY;
    touchY = currentY;
    const scrollable = findScrollableAncestor(event.target, node);
    if (shouldBlockOverscroll(scrollable, deltaY)) {
      event.preventDefault();
    }
  };

  const onTouchEnd = () => {
    touchY = null;
  };

  const wheelOpts = { passive: false, capture: true };
  const touchMoveOpts = { passive: false, capture: true };
  node.addEventListener('wheel', onWheel, wheelOpts);
  node.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
  node.addEventListener('touchmove', onTouchMove, touchMoveOpts);
  node.addEventListener('touchend', onTouchEnd, { capture: true });
  node.addEventListener('touchcancel', onTouchEnd, { capture: true });

  return () => {
    node.removeEventListener('wheel', onWheel, wheelOpts);
    node.removeEventListener('touchstart', onTouchStart, { capture: true });
    node.removeEventListener('touchmove', onTouchMove, touchMoveOpts);
    node.removeEventListener('touchend', onTouchEnd, { capture: true });
    node.removeEventListener('touchcancel', onTouchEnd, { capture: true });
  };
}

function ContextHint({ districtId, placeTitle }) {
  const { t } = useTranslation();
  const districtName = districtId
    ? t(`district.${districtId}`, { defaultValue: districtLabels[districtId] })
    : '';
  if (!districtName && !placeTitle) {
    return <p className={styles.context}>{t('ai.contextEmpty')}</p>;
  }

  return (
    <p className={styles.context}>
      {districtName ? <span>{t('ai.viewingDistrict', { name: districtName })}</span> : null}
      {placeTitle ? <span>{t('ai.selectedPlace', { name: placeTitle })}</span> : null}
    </p>
  );
}

function AssistantBody({ message, onSelectPlace }) {
  const tools = (message.toolCalls ?? [])
    .map((name) => AI_TOOL_LABELS[name] || null)
    .filter(Boolean);
  const uniqueTools = [...new Set(tools)];
  const places = (message.places ?? []).filter((place) => place?.contentId);
  const foodGroups = groupsFromVerifiedPlaces(places);
  const otherPlaces = foodGroups.length
    ? places.filter((place) => !place.cuisineLabel)
    : places;

  return (
    <div className={styles.assistantBody}>
      <AiThoughtSummary tools={uniqueTools} />
      <div
        className={styles.answer}
        dangerouslySetInnerHTML={{ __html: formatAiAnswer(message.content) }}
      />
      {otherPlaces.length > 0 ? (
        <ul className={styles.places}>
          {otherPlaces.map((place) => (
            <li key={place.contentId}>
              <button
                type='button'
                className={styles.placeCard}
                onClick={() => onSelectPlace?.(place)}
              >
                <MapPinned size={16} aria-hidden />
                <span>
                  <strong>{place.title}</strong>
                  {place.address ? <small>{place.address}</small> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <NearbyFoodPicker
        groups={foodGroups}
        onSelect={onSelectPlace}
        compact
      />
    </div>
  );
}

export function AiChatPanel({
  isOpen,
  onClose,
  districtId,
  contentId,
  placeTitle,
  onSelectPlace,
  onViewCourseRoute,
}) {
  const { t } = useTranslation();
  const tab = useAiChatStore((state) => state.tab);
  const setTab = useAiChatStore((state) => state.setTab);
  const { messages, isSending, send, cancel, clear } = useAiChat({
    districtId,
    contentId,
  });
  const [draft, setDraft] = useState('');
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const suggestions = useMemo(
    () => buildAiSuggestions({ districtId, contentId, placeTitle, t }),
    [districtId, contentId, placeTitle, t],
  );

  useEffect(() => {
    if (!isOpen || tab !== 'chat') return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, tab]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const node = panelRef.current;
    if (!node) return undefined;
    return containPanelScroll(node);
  }, [isOpen]);

  useEffect(() => {
    const node = listRef.current;
    if (!node || messages.length === 0) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, isSending]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft('');
    send(text);
  };

  return (
    <aside
      ref={panelRef}
      className={styles.panel}
      aria-label={t('ai.panelLabel')}
      aria-busy={isSending}
    >
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>{t('ai.eyebrow')}</p>
          <h2>
            <MessageCircle size={18} aria-hidden />
            {t('nav.ai')}
          </h2>
          <ContextHint districtId={districtId} placeTitle={placeTitle} />
        </div>
        <div className={styles.headActions}>
          {tab === 'chat' && messages.length > 0 ? (
            <button type='button' className={styles.textBtn} onClick={clear}>
              {t('ai.newChat')}
            </button>
          ) : null}
          <button type='button' className={styles.close} onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>
      </header>

      <div className={styles.tabs} role='tablist' aria-label={t('ai.menu')}>
        <button
          type='button'
          role='tab'
          aria-selected={tab === 'chat'}
          onClick={() => setTab('chat')}
        >
          {t('ai.ask')}
        </button>
        <button
          type='button'
          role='tab'
          aria-selected={tab === 'course'}
          onClick={() => setTab('course')}
        >
          {t('ai.courseTab')}
        </button>
      </div>

      {tab === 'course' ? (
        <AiCourseStudio
          districtId={districtId}
          contentId={contentId}
          placeTitle={placeTitle}
          onViewRoute={onViewCourseRoute}
          onSelectStop={onSelectPlace}
        />
      ) : (
        <div className={styles.chat}>
          <div className={styles.thread} ref={listRef}>
            {messages.length === 0 ? (
              <ul className={`${styles.messages} ${styles.intro}`}>
                <li className={styles.assistant}>
                  <p>{t('ai.intro')}</p>
                </li>
                {suggestions.map((item) => (
                  <li key={item.id} className={styles.exampleItem}>
                    <button
                      type='button'
                      className={styles.exampleChat}
                      onClick={() => send(item.message)}
                      disabled={isSending}
                      aria-label={t('ai.exampleAria', { label: item.label })}
                    >
                      <span className={styles.exampleLabel}>{item.label}</span>
                      <span>{item.message}</span>
                      <span className={styles.exampleHint}>{t('ai.exampleHint')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className={styles.messages}>
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className={
                      message.role === 'user'
                        ? styles.user
                        : message.role === 'error'
                          ? styles.error
                          : styles.assistant
                    }
                  >
                    {message.role === 'assistant' ? (
                      <AssistantBody message={message} onSelectPlace={onSelectPlace} />
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {isSending ? (
              <AiThinkingTrace title={t('ai.preparing')} />
            ) : null}
          </div>

          <form className={styles.composer} onSubmit={handleSubmit}>
            <label className={styles.srOnly} htmlFor='ai-chat-input'>
              {t('ai.inputLabel')}
            </label>
            <textarea
              id='ai-chat-input'
              ref={inputRef}
              rows={2}
              value={draft}
              disabled={isSending}
              placeholder={t('ai.placeholder')}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
            />
            {isSending ? (
              <button type='button' className={styles.send} onClick={cancel} aria-label={t('ai.cancelResponse')}>
                <Square size={16} />
                {t('course.cancel')}
              </button>
            ) : (
              <button
                type='submit'
                className={styles.send}
                disabled={!draft.trim()}
                aria-label={t('ai.send')}
              >
                <Send size={16} />
                {t('ai.send')}
              </button>
            )}
            <p className={styles.composerHint}>
              {t('ai.composerHint')}
            </p>
          </form>
        </div>
      )}
    </aside>
  );
}

export function AiChatLauncher({ onClick, hidden }) {
  const { t } = useTranslation();
  if (hidden) return null;

  return (
    <button
      type='button'
      className={styles.launcher}
      onClick={onClick}
      aria-label={t('ai.open')}
    >
      <MessageCircle size={20} aria-hidden />
      <span>{t('nav.ai')}</span>
    </button>
  );
}
