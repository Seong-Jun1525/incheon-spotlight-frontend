/**
 * LeftExplorePanel.jsx — 지도 좌측 탐색 패널(검색·필터·추천·구군 목록)
 * - 검색 입력과 자동완성 리스트박스(키보드 방향키/Enter/Esc 조작)를 제공하고 실시간 검색어를 노출
 * - 장소 유형 칩(KTO 콘텐츠 타입)·여행 테마 칩·축제 섹션·군구 퀵내비를 렌더링
 * - Hero 상태에서는 오늘의 추천(SpotlightRecommend), 구·군 선택 시에는 장소 목록을 보여줌
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { Skeleton } from '../atoms/Skeleton';
import { useTranslation } from 'react-i18next';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Check,
  ChevronRight,
  Cloud,
  CloudRain,
  CloudSnow,
  Landmark,
  MapPinned,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { formatRecommendationTemperature } from '../../utils/todayRecommendations';
import {
  KTO_PLACE_TYPE_CHIPS,
  getKtoPlaceTypeLabel,
} from '../../constants/ktoContentTypes';
import { formatFestivalPeriod, getFestivalBadge } from '../../utils/festival';
import { getThemeColor } from '../../constants/themeColors';
import { isLandmarkSelected } from '../../utils/landmarkExplore';
import {
  translateDistrictIntro,
  translatePlaceName,
} from '../../i18n/placeLabel';
import { resolveAssetUrl } from '../../utils/resolveAssetUrl';
import { cardImageUrl } from '../../utils/cardImageUrl';
import { containElementScroll } from '../../utils/containElementScroll';
import { RealtimeSearchRanks } from './RealtimeSearchRanks';
import styles from './LeftExplorePanel.module.scss';

const themes = ['데이트', '야경', '바다', '역사', '가족'];

function WeatherMiniIcon({ condition, label }) {
  useUiLanguage();
  const iconProps = { size: 16, strokeWidth: 1.8 };
  const text = String(label || '');
  if (condition === 'SNOW' || /눈|적설/.test(text)) {
    return <CloudSnow {...iconProps} />;
  }
  if (condition === 'RAIN' || /비|소나기|강수/.test(text)) {
    return <CloudRain {...iconProps} />;
  }
  if (condition === 'CLOUDY' || /흐림|구름/.test(text)) {
    return <Cloud {...iconProps} />;
  }
  return <Sun {...iconProps} />;
}

function RecommendThumb({ place, className }) {
  useUiLanguage();
  const [failedUrls, setFailedUrls] = useState([]);
  const original = resolveAssetUrl(place.imageUrl || '');
  const thumbnail = cardImageUrl(original);
  const src = failedUrls.includes(thumbnail) ? original : thumbnail;

  if (!src || failedUrls.includes(src)) {
    return (
      <span
        className={clsx(styles.thumbFallback, className)}
        aria-hidden
      >
        {(place.name || '?').slice(0, 1)}
      </span>
    );
  }

  return (
    <img
      className={clsx(styles.thumb, className)}
      src={src}
      alt=''
      loading='lazy'
      onError={() => setFailedUrls((urls) => [...urls, src])}
    />
  );
}

function SpotlightRecommend({
  places,
  weather,
  fromServer,
  selectedLandmarkId,
  onSelect,
  compact = false,
}) {
  useUiLanguage();
  const { t } = useTranslation();
  const [hero, ...rest] = places;
  const temp = formatRecommendationTemperature(weather?.temperature);
  const weatherLine = [temp, weather?.label].filter(Boolean).join(' · ');
  const reasons = Array.isArray(hero.reasons) ? hero.reasons : [];
  const kicker = fromServer ? t('hero.weatherPick') : t('hero.localPick');

  return (
    <div className={styles.spotlight}>
      {weatherLine ? (
        <p className={styles.spotlightWeather}>
          <span
            className={styles.spotlightWeatherIcon}
            aria-hidden
          >
            <WeatherMiniIcon
              condition={weather?.condition}
              label={uiText(weather?.label)}
            />
          </span>
          {uiText(weatherLine)}
        </p>
      ) : null}

      <article className={styles.spotlightHero}>
        <RecommendThumb
          place={hero}
          className={styles.spotlightCover}
        />
        <p className={styles.spotlightKicker}>{uiText(kicker)}</p>
        <h3 className={styles.spotlightTitle}>
          {translatePlaceName(t, hero, hero.name)}
        </h3>
        <p className={styles.spotlightReason}>
          {uiText(hero.reason || hero.shortDescription)}
        </p>
        {(hero.heroTags ?? []).length > 0 && (
          <span className={styles.recommendTags}>
            {hero.heroTags.slice(0, 3).map((tag) => {
              const tone = getThemeColor(tag);
              return (
                <span
                  key={tag}
                  className={styles.tag}
                  style={{ color: tone.color, background: tone.background }}
                >
                  {t(`theme.${tag}`, { defaultValue: tag })}
                </span>
              );
            })}
          </span>
        )}
        <button
          type='button'
          className={styles.spotlightCta}
          onClick={() => onSelect?.(hero)}
        >
          {t(compact ? 'hero.viewDetail' : 'hero.view3d')}
        </button>
        {reasons.length > 0 && (
          <div className={styles.spotlightWhy}>
            <p>{t('hero.why')}</p>
            <ul>
              {reasons.map((reason) => (
                <li key={reason}>
                  <Check
                    size={12}
                    aria-hidden
                  />
                  {uiText(reason)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>

      {rest.length > 0 && (
        <div className={styles.spotlightMore}>
          <p className={styles.recommendLabel}>{t('explore.alsoVisit')}</p>
          <ul className={styles.recommendList}>
            {rest.map((place) => (
              <li key={place.id || place.contentId}>
                <button
                  type='button'
                  className={clsx(
                    styles.recommendBtn,
                    isLandmarkSelected(place, selectedLandmarkId) &&
                      styles.recommendActive,
                  )}
                  onClick={() => onSelect?.(place)}
                >
                  <RecommendThumb place={place} />
                  <span className={styles.recommendBody}>
                    <span className={styles.recommendName}>
                      {translatePlaceName(t, place, place.name)}
                    </span>
                    <span className={styles.recommendMeta}>
                      {[
                        place.districtId
                          ? t(`district.${place.districtId}`, {
                              defaultValue: place.districtName,
                            })
                          : place.districtName,
                        place.placeType === '관광지'
                          ? t('type.tour')
                          : place.placeType
                            ? t(`type.${place.placeType}`, {
                                defaultValue: place.placeType,
                              })
                            : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span className={styles.recommendDesc}>
                      {uiText(place.reason || place.shortDescription)}
                    </span>
                    <span className={styles.recommendTags}>
                      {(place.heroTags ?? []).slice(0, 3).map((tag) => {
                        const tone = getThemeColor(tag);
                        return (
                          <span
                            key={tag}
                            className={styles.tag}
                            style={{
                              color: tone.color,
                              background: tone.background,
                            }}
                          >
                            {t(`theme.${tag}`, { defaultValue: tag })}
                          </span>
                        );
                      })}
                    </span>
                    <span className={styles.recommendAction}>
                      {t(compact ? 'hero.viewDetail' : 'hero.view3d')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function suggestTypeLabel(t, item) {
  if (item.type === 'district') return t('suggest.district');
  if (item.metaKey) return t(item.metaKey, { defaultValue: item.meta });
  if (item.districtId) {
    return t(`district.${item.districtId}`, { defaultValue: item.meta });
  }
  if (item.meta) return item.meta;
  return t('type.tour');
}

/**
 * 축제·행사 섹션 — 검색 없이 바로 눈에 띄도록 목록 위에 배치합니다.
 * 하단 타임라인이 숨겨지는 모바일에서는 이 섹션이 유일한 행사 진입점입니다.
 */
function FestivalSection({
  festivals,
  title,
  districtNameById,
  showDistrictName,
  selectedLandmarkId,
  onSelectFestival,
  emptyMessage = '',
}) {
  useUiLanguage();
  const { t } = useTranslation();
  if (festivals.length === 0 && !emptyMessage) return null;

  return (
    <section
      className={styles.festivalBox}
      aria-label={uiText(title)}
    >
      <div className={styles.festivalHead}>
        <strong>{uiText(title)}</strong>
        {festivals.length > 0 && (
          <span className={styles.festivalCount}>
            {t('explore.eventCount', { count: festivals.length })}
          </span>
        )}
      </div>
      {festivals.length === 0 ? (
        <p className={styles.empty}>{uiText(emptyMessage)}</p>
      ) : (
        <ul className={styles.festivalList}>
          {festivals.map((festival) => {
            const badge = getFestivalBadge(festival);
            const period = formatFestivalPeriod(festival);
            const districtName = showDistrictName
              ? districtNameById[festival.districtId] ?? ''
              : '';
            const active =
              selectedLandmarkId != null &&
              String(festival.contentId) === String(selectedLandmarkId);

            return (
              <li key={festival.contentId || festival.name}>
                <button
                  type='button'
                  className={clsx(
                    styles.festivalBtn,
                    active && styles.activeLandmark,
                  )}
                  onClick={() => onSelectFestival?.(festival)}
                >
                  <span className={styles.festivalTitleRow}>
                    <em
                      className={clsx(styles.festivalBadge, styles[badge.tone])}
                    >
                      {uiText(badge.label)}
                    </em>
                    <span className={styles.festivalName}>
                      {festival.name || festival.title}
                    </span>
                  </span>
                  <small>
                    {[districtName, period].filter(Boolean).join(' · ')}
                  </small>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * 좌측 탐색 패널 — 공공 관광 서비스형 Hero / 구·군 선택 상태
 *
 * 검색: TourAPI searchKeyword2 제안(우선) + 로컬 폴백
 * 장소 유형 칩: 전체 / 관광지 / 문화시설 / 숙박 / 음식 (구·군 목록 + 검색에 함께 적용)
 * 여행 테마 칩: 데이트 / 야경 / 바다 / 역사 / 가족 (장소 유형과 독립)
 */
export function LeftExplorePanel({
  compact = false,
  searchValue,
  onSearchChange,
  searchSuggestions = [],
  onSelectSearchSuggestion,
  onSearchSubmit,
  onSelectRealtimeKeyword,
  placeTypeId = null,
  onPlaceTypeChange,
  isSearchLoading = false,
  activeTheme,
  onThemeChange,
  selectedDistrict,
  landmarks,
  selectedLandmarkId,
  onSelectLandmark,
  onViewAll,
  onExploreMap,
  onTodayRecommend,
  heroRecommendations = [],
  spotlightWeather = null,
  isSpotlightLoading = false,
  isSpotlightFromServer = false,
  onSelectRecommendation,
  districts = [],
  onSelectDistrict,
  festivals = [],
  festivalCountByDistrict = {},
  onSelectFestival,
  festivalTitle = '',
  festivalEmptyMessage = '',
  festivalMonth = null,
  isLoading = false,
  isError = false,
  isUsingFallback = false,
}) {
  useUiLanguage();
  const { t } = useTranslation();
  const listboxId = useId();
  const searchInputId = useId();
  const panelRef = useRef(null);
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const typeChip = KTO_PLACE_TYPE_CHIPS.find(
    (chip) => chip.contentTypeId === String(placeTypeId),
  );
  const placeTypeLabel = placeTypeId
    ? t(`type.${typeChip?.id}`, {
        defaultValue: getKtoPlaceTypeLabel(placeTypeId),
      })
    : '';
  const districtName = selectedDistrict
    ? t(`district.${selectedDistrict.id}`, {
        defaultValue: selectedDistrict.name,
      })
    : t('explore.allIncheon');

  const districtNameById = useMemo(
    () =>
      Object.fromEntries(
        districts.map((item) => [
          item.id,
          t(`district.${item.id}`, { defaultValue: item.name }),
        ]),
      ),
    [districts, t],
  );

  const statusMessage = isLoading
    ? ''
    : isError
      ? placeTypeLabel
        ? t('explore.loadError', { type: placeTypeLabel })
        : t('explore.fallbackError')
      : isUsingFallback
        ? t('explore.fallback')
        : '';

  const isHero = !selectedDistrict;
  const query = searchValue.trim();
  const showSuggestions =
    isSuggestOpen && query.length > 0 && searchSuggestions.length > 0;
  const showEmptySuggest =
    isSuggestOpen &&
    query.length > 0 &&
    searchSuggestions.length === 0 &&
    !isSearchLoading;

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!searchWrapRef.current?.contains(event.target)) {
        setIsSuggestOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (compact) return undefined;
    const node = panelRef.current;
    if (!node) return undefined;
    return containElementScroll(node);
  }, [compact]);

  const commitSuggestion = (suggestion) => {
    if (!suggestion) return;
    onSelectSearchSuggestion?.(suggestion);
    setIsSuggestOpen(false);
    setActiveIndex(-1);
  };

  const handleSearchKeyDown = (event) => {
    if (!query) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsSuggestOpen(true);
      setActiveIndex((prev) =>
        Math.min(prev + 1, Math.max(searchSuggestions.length - 1, 0)),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
      return;
    }

    if (event.key === 'Enter') {
      if (activeIndex >= 0 && searchSuggestions[activeIndex]) {
        event.preventDefault();
        commitSuggestion(searchSuggestions[activeIndex]);
      }
      return;
    }

    if (event.key === 'Escape') {
      setIsSuggestOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (query && searchSuggestions[0]) {
      commitSuggestion(searchSuggestions[0]);
      return;
    }
    if (query) {
      onSearchSubmit?.(query);
    }
    setIsSuggestOpen(true);
    searchInputRef.current?.focus();
  };

  return (
    <aside
      ref={panelRef}
      className={clsx(styles.panel, !isHero && styles.expanded)}
      data-compact={compact ? 'true' : undefined}
      aria-label={uiText(
        isHero
          ? t('explore.guide')
          : t('explore.district', { name: districtName }),
      )}
    >
      {isHero ? (
        <section
          className={styles.landmarkBuilder}
          aria-labelledby='landmark-builder-title'
        >
          <div className={styles.landmarkBuilderHead}>
            <span
              className={styles.landmarkBuilderIcon}
              aria-hidden='true'
            >
              <Landmark
                size={24}
                strokeWidth={2.1}
              />
            </span>
            <div>
              <p>{uiText('VISIT & BUILD')}</p>
              <h2 id='landmark-builder-title'>
                {uiText('방문인증해서 랜드마크를 건설해요!')}
              </h2>
            </div>
          </div>
          <p className={styles.landmarkBuilderCopy}>
            {uiText(
              '현장 사진을 인증하고 스탬프를 받으면 3D 지도 속 공사현장이 실제 랜드마크로 완성됩니다.',
            )}
          </p>
          <div
            className={styles.landmarkBuilderFlow}
            aria-label={uiText('방문 인증부터 랜드마크 건설까지')}
          >
            <span>{uiText('방문 인증')}</span>
            <ChevronRight
              size={14}
              aria-hidden='true'
            />
            <span>{uiText('스탬프 획득')}</span>
            <ChevronRight
              size={14}
              aria-hidden='true'
            />
            <strong>{uiText('랜드마크 건설')}</strong>
          </div>
          <Link
            className={styles.landmarkBuilderCta}
            to='/visits/new'
          >
            {uiText('첫 랜드마크 건설하기')}
            <ChevronRight
              size={16}
              aria-hidden='true'
            />
          </Link>
        </section>
      ) : null}
      <section
        className={styles.searchSection}
        aria-labelledby={`${searchInputId}-title`}
      >
        <div className={styles.searchHeading}>
          <div>
            <span>{t('explore.info')}</span>
            <h2 id={`${searchInputId}-title`}>{t('explore.searchTitle')}</h2>
          </div>
          <em>{uiText(districtName)}</em>
        </div>

        <form
          className={styles.searchForm}
          ref={searchWrapRef}
          onSubmit={handleSearchSubmit}
          role='search'
        >
          <label
            className={styles.visuallyHidden}
            htmlFor='tour-search'
          >
            {t('explore.searchLabel')}
          </label>
          <div className={styles.searchControl}>
            <Search
              className={styles.searchIcon}
              size={18}
              strokeWidth={2.1}
              aria-hidden
            />
            <input
              ref={searchInputRef}
              id='tour-search'
              className={styles.search}
              value={searchValue}
              onChange={(event) => {
                onSearchChange(event);
                setIsSuggestOpen(true);
                setActiveIndex(-1);
              }}
              onFocus={() => setIsSuggestOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('explore.searchPlaceholder')}
              aria-describedby={`${searchInputId}-help`}
              role='combobox'
              aria-autocomplete='list'
              aria-expanded={
                showSuggestions || showEmptySuggest || isSearchLoading
              }
              aria-controls={listboxId}
              aria-activedescendant={
                activeIndex >= 0
                  ? `${listboxId}-option-${activeIndex}`
                  : undefined
              }
              autoComplete='off'
              type='search'
              enterKeyHint='search'
            />
            {query ? (
              <button
                type='button'
                className={styles.searchClear}
                onClick={() => {
                  onSearchChange({ target: { value: '' } });
                  setIsSuggestOpen(false);
                  setActiveIndex(-1);
                  searchInputRef.current?.focus();
                }}
                aria-label={t('explore.clearSearch')}
              >
                <X
                  size={14}
                  strokeWidth={2.4}
                />
              </button>
            ) : null}
            <button
              type='submit'
              className={styles.searchSubmit}
            >
              {t('explore.searchSubmit')}
            </button>

            {(showSuggestions ||
              showEmptySuggest ||
              (isSuggestOpen && isSearchLoading && query)) && (
              <ul
                id={listboxId}
                className={styles.suggestList}
                role='listbox'
                aria-label={t('explore.searchTitle')}
              >
                {isSearchLoading && searchSuggestions.length === 0 ? (
                  <li
                    className={styles.suggestEmpty}
                    role='presentation'
                  >
                    {t('explore.searching')}
                  </li>
                ) : showEmptySuggest ? (
                  <li
                    className={styles.suggestEmpty}
                    role='presentation'
                  >
                    {t('explore.noSuggestions')}
                  </li>
                ) : (
                  searchSuggestions.map((item, index) => (
                    <li
                      key={item.id}
                      role='presentation'
                    >
                      <button
                        id={`${listboxId}-option-${index}`}
                        type='button'
                        role='option'
                        aria-selected={activeIndex === index}
                        className={clsx(
                          styles.suggestOption,
                          activeIndex === index && styles.suggestActive,
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => commitSuggestion(item)}
                      >
                        <span
                          className={styles.suggestIcon}
                          aria-hidden
                        >
                          <MapPinned size={14} />
                        </span>
                        <span className={styles.suggestText}>
                          <span className={styles.suggestLabel}>
                            {uiText(
                              item.type === 'district'
                                ? t(`district.${item.districtId}`, {
                                    defaultValue: item.label,
                                  })
                                : translatePlaceName(
                                    t,
                                    item.landmark,
                                    item.label,
                                  ),
                            )}
                          </span>
                          <span className={styles.suggestMeta}>
                            {uiText(
                              item.type === 'district'
                                ? t('explore.areaType')
                                : t(`district.${item.districtId}`, {
                                    defaultValue: item.meta,
                                  }),
                            )}
                          </span>
                        </span>
                        <span className={styles.suggestType}>
                          {suggestTypeLabel(t, item)}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </form>
        <p
          id={`${searchInputId}-help`}
          className={styles.searchHelp}
        >
          {t('explore.searchLabel')}
        </p>
        <RealtimeSearchRanks
          layout='pills'
          onSelectKeyword={onSelectRealtimeKeyword}
        />
      </section>

      <div className={styles.filterGroup}>
        <strong>{t('explore.placeType')}</strong>
        <div
          className={styles.typeChips}
          role='group'
          aria-label={t('explore.placeType')}
        >
          {KTO_PLACE_TYPE_CHIPS.map((chip) => {
            const active = placeTypeId === chip.contentTypeId;
            return (
              <button
                key={chip.id ?? 'all'}
                type='button'
                className={clsx(
                  styles.typeChip,
                  active && styles.activeTypeChip,
                )}
                onClick={() => {
                  setActiveIndex(-1);
                  onPlaceTypeChange?.(chip.contentTypeId);
                }}
                aria-pressed={active}
              >
                {t(`type.${chip.id ?? 'all'}`, { defaultValue: chip.label })}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.themeGroup}>
        <strong>{t('explore.tripTopic')}</strong>
        <div
          className={styles.chips}
          role='group'
          aria-label={t('explore.themes')}
        >
          {themes.map((theme) => {
            const active = activeTheme === theme;
            const themeColor = getThemeColor(theme);
            return (
              <button
                key={theme}
                type='button'
                className={clsx(styles.chip, active && styles.activeChip)}
                onClick={() => onThemeChange(active ? null : theme)}
                aria-pressed={active}
              >
                <span
                  className={styles.chipDot}
                  style={{ background: themeColor.accent }}
                  aria-hidden
                />
                {active && (
                  <Check
                    size={12}
                    aria-hidden
                  />
                )}
                {t(`theme.${theme}`, { defaultValue: theme })}
              </button>
            );
          })}
        </div>
      </div>

      <FestivalSection
        festivals={festivals}
        title={uiText(
          festivalTitle ||
            (festivalMonth
              ? isHero
                ? t('explore.monthEvents', { month: festivalMonth })
                : t('explore.districtMonthEvents', {
                    name: districtName,
                    month: festivalMonth,
                  })
              : isHero
                ? t('explore.events')
                : t('explore.districtEvents', { name: districtName })),
        )}
        districtNameById={districtNameById}
        showDistrictName={isHero}
        selectedLandmarkId={selectedLandmarkId}
        onSelectFestival={onSelectFestival}
        emptyMessage={uiText(
          festivalEmptyMessage ||
            (isHero
              ? ''
              : festivalMonth
                ? t('explore.noMonthEvents', {
                    name: districtName,
                    month: festivalMonth,
                  })
                : t('explore.noEvents', { name: districtName })),
        )}
      />

      {isHero ? (
        <div className={styles.hero}>
          <p className={styles.eyebrow}>{t('hero.eyebrow')}</p>
          <h2 className={styles.heroTitle}>
            {t('hero.title')
              .split('\n')
              .map((line) => (
                <span
                  key={line}
                  className={styles.heroLine}
                >
                  {uiText(line)}
                </span>
              ))}
          </h2>
          <p className={styles.heroSubtitle}>
            {t('hero.subtitle')
              .split('\n')
              .map((line) => (
                <span key={line}>
                  {uiText(line)}
                  <br />
                </span>
              ))}
          </p>
          <p className={styles.mood}>{t('hero.mood')}</p>

          {/* <div className={styles.ctaRow}>
            <button type='button' className={styles.ctaPrimary} onClick={onExploreMap}>{t('hero.explore')}</button>
            <button
              type='button'
              className={styles.ctaSecondary}
              onClick={onTodayRecommend}
            >{t('hero.themes')}</button>
          </div> */}

          <nav
            className={styles.districtQuickNav}
            aria-labelledby='district-quick-title'
          >
            <h3 id='district-quick-title'>{t('hero.districts')}</h3>
            <p>{t('hero.districtHint')}</p>
            <ul>
              {districts.map((district) => {
                const festivalCount = festivalCountByDistrict[district.id] ?? 0;
                return (
                  <li key={district.id}>
                    <button
                      type='button'
                      onClick={() => onSelectDistrict?.(district.id)}
                    >
                      <span>
                        {t(`district.${district.id}`, {
                          defaultValue: district.name,
                        })}
                        {festivalCount > 0 && (
                          <em className={styles.districtFestivalHint}>
                            {t('explore.festivalCount', {
                              count: festivalCount,
                            })}
                          </em>
                        )}
                      </span>
                      {compact ? (
                        <ChevronRight
                          size={16}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.recommendBox}>
            <div className={styles.recommendHead}>
              <p className={styles.recommendLabel}>{t('hero.spotlight')}</p>
            </div>
            {isSpotlightLoading && heroRecommendations.length === 0 ? (
              <Skeleton
                variant='cards'
                count={1}
                label={t('hero.loading')}
              />
            ) : heroRecommendations.length === 0 ? (
              <p className={styles.spotlightStatus}>{t('hero.empty')}</p>
            ) : (
              <SpotlightRecommend
                places={heroRecommendations}
                weather={spotlightWeather}
                fromServer={isSpotlightFromServer}
                selectedLandmarkId={selectedLandmarkId}
                onSelect={onSelectRecommendation}
                compact={compact}
              />
            )}
          </div>
        </div>
      ) : (
        <>
          <section
            className={styles.districtBox}
            aria-live='polite'
            aria-atomic='true'
          >
            <button
              type='button'
              className={styles.backRegions}
              onClick={onViewAll}
            >
              ← {t('explore.backRegions')}
            </button>
            <p className={styles.label}>{t('explore.details')}</p>
            <h3 className={styles.districtName}>{uiText(districtName)}</h3>
            <div className={styles.descriptionGroup}>
              <strong className={styles.descriptionTitle}>
                {t('explore.intro')}
              </strong>
              <p className={styles.desc}>
                {translateDistrictIntro(t, selectedDistrict)}
              </p>
            </div>
            {selectedDistrict.themeTags?.length > 0 && (
              <div className={styles.themeBadges}>
                {selectedDistrict.themeTags.map((tag) => (
                  <span
                    key={tag}
                    className={styles.themeBadge}
                  >
                    {t(`theme.${tag}`, { defaultValue: tag })}
                  </span>
                ))}
              </div>
            )}
            {selectedDistrict.placeholderNotice && (
              <p className={styles.notice}>
                {uiText(selectedDistrict.placeholderNotice)}
              </p>
            )}
          </section>

          <div className={styles.listBox}>
            <div className={styles.listHead}>
              <strong>
                {uiText(
                  placeTypeLabel
                    ? `${placeTypeLabel}`
                    : t('explore.highlights'),
                )}
              </strong>
            </div>
            {statusMessage && (
              <p className={clsx(styles.status, isError && styles.errorStatus)}>
                {uiText(statusMessage)}
              </p>
            )}
            {isLoading ? (
              <Skeleton
                count={3}
                label={t('explore.loading')}
              />
            ) : landmarks.length === 0 ? (
              <p className={styles.empty}>
                {uiText(
                  searchValue.trim()
                    ? t('explore.noResults')
                    : t('explore.noPlaces', {
                        type: placeTypeLabel || t('type.tour'),
                      }),
                )}
              </p>
            ) : (
              <div className={styles.placeGrid}>
                {landmarks.map((landmark) => (
                  <button
                    key={landmark.id}
                    type='button'
                    className={clsx(
                      styles.placeCard,
                      isLandmarkSelected(landmark, selectedLandmarkId) &&
                        styles.activeLandmark,
                    )}
                    onClick={() => onSelectLandmark(landmark)}
                  >
                    <RecommendThumb
                      place={landmark}
                      className={styles.placeCover}
                    />
                    <span className={styles.placeBody}>
                      <span>
                        {translatePlaceName(t, landmark, landmark.name)}
                      </span>
                      <small>{uiText(landmark.shortDescription)}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
