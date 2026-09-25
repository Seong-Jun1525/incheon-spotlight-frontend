/**
 * AiCourseStudio.jsx — AI 추천 코스를 만드는 패널 UI
 * - 테마·소요 시간·동행 유형·요청 메모를 골라 useAiCourseStore의 plan()으로 코스 생성 요청
 * - 테마에 따라 동행 유형을 자동 보정(가족은 고정, 데이트는 혼자 선택 차단)
 * - 결과를 정차지 타임라인·날씨·도보 요약으로 보여주고, 경로 보기와 상세 일정 만들기로 이어줌
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  ClipboardList,
  Footprints,
  Heart,
  Landmark,
  Moon,
  Route,
  Square,
  Trees,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { districtLabels } from '../../data/incheonDistricts';
import { useAiCourseStore } from '../../stores/useAiCourseStore';
import { createCourseTravelDraft } from '../../utils/courseTravelDraft';
import {
  formatCourseWalk,
  formatPlaceCount,
  formatStayMinutes,
  slotLabel,
} from '../../utils/aiCourseAdapter';
import { AiThinkingTrace } from './AiThinkingTrace';
import { NearbyFoodPicker } from './NearbyFoodPicker';
import { uiText } from '../../i18n/uiText';
import styles from './AiCourseStudio.module.scss';

const THEMES = [
  { id: 'night', theme: '야경', hintKey: 'course.themeNightHint', Icon: Moon },
  { id: 'date', theme: '데이트', hintKey: 'course.themeDateHint', Icon: Heart },
  { id: 'family', theme: '가족', hintKey: 'course.themeFamilyHint', Icon: Users },
  { id: 'history', theme: '역사', hintKey: 'course.themeHistoryHint', Icon: Landmark },
  { id: 'nature', theme: '자연', hintKey: 'course.themeNatureHint', Icon: Trees },
  { id: 'food', theme: '맛집', hintKey: 'course.themeFoodHint', Icon: UtensilsCrossed },
];

const DURATIONS = [
  { hours: 3, labelKey: 'course.halfDay' },
  { hours: 4, labelKey: 'course.easyHalf' },
  { hours: 6, labelKey: 'course.fullDay' },
];

const PARTIES = [
  { id: 'couple', labelKey: 'party.couple' },
  { id: 'family', labelKey: 'party.family' },
  { id: 'solo', labelKey: 'party.solo' },
  { id: 'friends', labelKey: 'party.friends' },
];

export function AiCourseStudio({
  districtId,
  contentId,
  placeTitle,
  onViewRoute,
  onSelectStop,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const exploreCourse = useAiCourseStore((state) => state.exploreCourse);
  const response = useAiCourseStore((state) => state.response);
  const courseMessage = useAiCourseStore((state) => state.courseMessage);
  const isPlanning = useAiCourseStore((state) => state.isPlanning);
  const errorMessage = useAiCourseStore((state) => state.errorMessage);
  const plan = useAiCourseStore((state) => state.plan);
  const cancel = useAiCourseStore((state) => state.cancel);

  const [theme, setTheme] = useState('night');
  const [durationHours, setDurationHours] = useState(4);
  const [partyType, setPartyType] = useState('couple');
  const [message, setMessage] = useState('');
  const [handoffError, setHandoffError] = useState(false);
  const partyLocked = theme === 'family';

  const districtName = districtId
    ? t(`district.${districtId}`, { defaultValue: districtLabels[districtId] || t('explore.allIncheon') })
    : t('explore.allIncheon');
  const walkLabel = formatCourseWalk(exploreCourse?.route || response?.route, t);

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    if (nextTheme === 'family') {
      setPartyType('family');
      return;
    }
    if (nextTheme === 'date') {
      setPartyType((current) => (current === 'solo' ? 'couple' : current));
    }
  };

  const handlePartyChange = (nextParty) => {
    if (theme === 'family') return;
    if (theme === 'date' && nextParty === 'solo') return;
    setPartyType(nextParty);
  };

  const handlePlan = async () => {
    setHandoffError(false);
    await plan({
      districtId: districtId || null,
      theme,
      durationHours,
      partyType,
      startContentId: contentId || null,
      message: message.trim() || null,
    });
  };

  const handleDetailedPlan = () => {
    const courseDraft = createCourseTravelDraft(response?.course, courseMessage);
    if (!courseDraft) {
      setHandoffError(true);
      return;
    }
    navigate('/travel-planner/new?mode=prompt', { state: { courseDraft } });
  };

  const weatherLabel = useMemo(() => {
    const weather = exploreCourse?.weather || response?.weather;
    if (!weather) return null;
    return [weather.region, weather.temperature, weather.condition]
      .filter(Boolean)
      .join(' · ');
  }, [exploreCourse, response]);

  return (
    <div className={styles.studio}>
      <section className={styles.hero}>
        <p>{t('course.studioLead')}</p>
        <h3>
          {t('course.studioTitle', { name: districtName })}
          <em> {t('course.studioTitleEm')}</em>
        </h3>
        {placeTitle ? (
          <span>{t('course.startHint', { name: placeTitle })}</span>
        ) : (
          <span>{t('course.districtHint')}</span>
        )}
      </section>

      <fieldset className={styles.fieldset}>
        <legend>{t('course.themeLegend')}</legend>
        <div className={styles.themes}>
          {THEMES.map(({ id, theme: themeName, hintKey, Icon }) => (
            <button
              key={id}
              type='button'
              className={theme === id ? styles.themeOn : styles.theme}
              aria-pressed={theme === id}
              onClick={() => handleThemeChange(id)}
            >
              <Icon size={18} aria-hidden />
              <strong>{t(`theme.${themeName}`, { defaultValue: themeName })}</strong>
              <small>{t(hintKey)}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <div className={styles.row}>
        <fieldset className={styles.fieldset}>
          <legend>{t('course.timeLegend')}</legend>
          <div className={styles.pills} role='group' aria-label={t('course.timeLegend')}>
            {DURATIONS.map((item) => (
              <button
                key={item.hours}
                type='button'
                aria-pressed={durationHours === item.hours}
                onClick={() => setDurationHours(item.hours)}
              >
                {t(item.labelKey)}
                <small>{t('duration.hours', { count: item.hours })}</small>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.fieldset} disabled={partyLocked}>
          <legend>{t('course.partyLegend')}</legend>
          <div className={styles.pills} role='group' aria-label={t('course.partyLegend')}>
            {PARTIES.map((item) => {
              const blockedByDate = theme === 'date' && item.id === 'solo';
              const disabled = partyLocked || blockedByDate;
              return (
                <button
                  key={item.id}
                  type='button'
                  aria-pressed={partyType === item.id}
                  disabled={disabled}
                  title={
                    partyLocked
                      ? t('course.partyLocked')
                      : blockedByDate
                        ? t('course.dateNoSolo')
                        : undefined
                  }
                  onClick={() => handlePartyChange(item.id)}
                >
                  {t(item.labelKey)}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <label className={styles.note}>
        <span>{t('course.note')}</span>
        <input
          value={message}
          maxLength={500}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t('course.notePlaceholder')}
        />
      </label>

      <div className={styles.actions}>
        {isPlanning ? (
          <button type='button' className={styles.primary} onClick={cancel}>
            <Square size={16} />
            {t('course.cancel')}
          </button>
        ) : (
          <button type='button' className={styles.primary} onClick={handlePlan}>
            <Route size={16} />
            {t('course.create')}
          </button>
        )}
        <p>{isPlanning ? t('course.planning') : t('course.planHint')}</p>
      </div>

      {errorMessage ? <p className={styles.error}>{uiText(errorMessage)}</p> : null}

      {isPlanning ? (
        <AiThinkingTrace title={t('course.making')} />
      ) : null}

      {exploreCourse ? (
        <article className={styles.result}>
          <header>
            <p>{t('course.recommended')}</p>
            <h4>{exploreCourse.courseName}</h4>
            <p className={styles.summary}>{exploreCourse.summary}</p>
            <ul className={styles.meta}>
              <li>{uiText(exploreCourse.themeLabel)}</li>
              <li>{uiText(exploreCourse.duration)}</li>
              <li>{formatPlaceCount(exploreCourse.stopCount ?? exploreCourse.placeCount, t)}</li>
              {weatherLabel ? <li>{uiText(weatherLabel)}</li> : null}
              {walkLabel ? (
                <li>
                  <Footprints size={12} aria-hidden /> {walkLabel}
                </li>
              ) : null}
            </ul>
          </header>

          <ol className={styles.timeline}>
            {exploreCourse.stops.map((stop, index) => (
              <li key={`${stop.contentId}-${stop.order}`}>
                <button type='button' onClick={() => onSelectStop?.(stop)}>
                  <b>{stop.order}</b>
                  <span>
                    <strong>{stop.name}</strong>
                    <small>
                      {[
                        slotLabel(stop.slot, stop.slotLabel, t),
                        formatStayMinutes(stop.stayMinutes, t),
                        stop.address,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </small>
                    {stop.reason ? <em>{stop.reason}</em> : null}
                  </span>
                </button>
                <NearbyFoodPicker
                  groups={stop.nearbyFood}
                  onSelect={onSelectStop}
                />
                {index < exploreCourse.stops.length - 1 ? (
                  <i className={styles.rail} aria-hidden />
                ) : null}
              </li>
            ))}
          </ol>

          {exploreCourse.answer ? (
            <p className={styles.narrative}>{exploreCourse.answer}</p>
          ) : null}

          <div className={styles.resultActions}>
            <button
              type='button'
              className={styles.secondary}
              onClick={() => onViewRoute?.(exploreCourse)}
            >
              <Route size={16} />
              {t('course.viewRoute')}
            </button>
            <button type='button' className={`${styles.primary} ${styles.planAction}`} onClick={handleDetailedPlan}
              aria-describedby='course-plan-hint'>
              <ClipboardList size={18} aria-hidden />
              {t('course.makePlan')}
              <ArrowRight size={17} aria-hidden />
            </button>
            <p id='course-plan-hint' className={styles.planHint}>{t('course.makePlanHint')}</p>
            {handoffError && <p className={styles.error} role='alert'>{t('course.makePlanError')}</p>}
          </div>
        </article>
      ) : null}
    </div>
  );
}
