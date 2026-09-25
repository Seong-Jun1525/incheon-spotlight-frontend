/**
 * DistrictHoverTooltip.jsx — 구·군 호버 시 뜨는 지역 정보 카드
 * - 소개글·테마 태그·대표 명소·축제 기간을 공공 안내문 형식으로 보여 줌
 * - 매 프레임 구 메시를 화면 좌표로 투영해 카드가 해당 구를 가리지 않게 좌/우에 배치
 * - 상단 날씨 바와 하단 UI를 피하도록 화면 여백을 보정
 */
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { formatFestivalPeriod } from '../../../utils/festival';
import { translateDistrictIntro, translatePlaceName } from '../../../i18n/placeLabel';
import styles from './DistrictHoverTooltip.module.scss';

const TOOLTIP_SIDE = {
  ganghwa: 'left',
  yeongjong: 'left',
  ongjin: 'left',
  seohae: 'left',
  jemulpo: 'right',
  michuhol: 'right',
  yeonsu: 'right',
  namdong: 'right',
  bupyeong: 'right',
  gyeyang: 'right',
  geomdan: 'right',
};

const GAP = 20;
const EDGE = 12;
const BOTTOM_UI = 92;
/** 좌측 구는 상단 날씨·월 선택 한 줄 아래로 내린다. */
const TOP_UI_BY_DISTRICT = {
  ganghwa: 80,
  yeongjong: 80,
  ongjin: 80,
};

const _box = new Box3();
const _world = new Vector3();
const _ndc = new Vector3();

function projectToCanvas(vec3, camera, width, height, out = { x: 0, y: 0 }) {
  _ndc.copy(vec3).project(camera);
  out.x = (_ndc.x * 0.5 + 0.5) * width;
  out.y = (-_ndc.y * 0.5 + 0.5) * height;
  return out;
}

function districtScreenRect(mesh, camera, width, height) {
  _box.setFromObject(mesh);
  const { min, max } = _box;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const pt = { x: 0, y: 0 };

  for (let ix = 0; ix < 2; ix += 1) {
    for (let iy = 0; iy < 2; iy += 1) {
      for (let iz = 0; iz < 2; iz += 1) {
        _world.set(
          ix ? max.x : min.x,
          iy ? max.y : min.y,
          iz ? max.z : min.z,
        );
        projectToCanvas(_world, camera, width, height, pt);
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      }
    }
  }

  return { minX, minY, maxX, maxY };
}

function placeCard(card, origin, rect, side, width, height, districtId) {
  const w = card.offsetWidth || 268;
  const h = card.offsetHeight || 220;
  const topMin = TOP_UI_BY_DISTRICT[districtId] ?? EDGE;
  let left =
    side === 'right' ? rect.maxX + GAP : rect.minX - GAP - w;
  let top = (rect.minY + rect.maxY) / 2 - h / 2;

  left = Math.min(Math.max(left, EDGE), width - w - EDGE);
  top = Math.min(Math.max(top, topMin), height - h - BOTTOM_UI);

  card.style.transform = `translate(${left - origin.x}px, ${top - origin.y}px)`;
  if (card.dataset.placed !== '1') {
    card.dataset.placed = '1';
    card.classList.add(styles.ready);
  }
  card.style.visibility = 'visible';
}

function useOutsideDistrictPlacement(meshRef, originRef, cardRef, side, districtId) {
  const originPt = useRef({ x: 0, y: 0 });

  useFrame(({ camera, size }) => {
    const mesh = meshRef?.current;
    const origin = originRef.current;
    const card = cardRef.current;
    if (!mesh || !origin || !card) return;

    origin.getWorldPosition(_world);
    projectToCanvas(_world, camera, size.width, size.height, originPt.current);
    const rect = districtScreenRect(mesh, camera, size.width, size.height);
    placeCard(
      card,
      originPt.current,
      rect,
      side,
      size.width,
      size.height,
      districtId,
    );
  });
}

/** 구·군 호버 시 공공 안내 형식의 지역 정보 카드. 해당 구 메시 바깥에 붙인다. */
export function DistrictHoverTooltip({
  districtId,
  districtDetails,
  meshRef,
  position = [0, 0, 0.2],
}) {
  const cardRef = useRef(null);
  const originRef = useRef(null);

  if (!districtId) return null;

  const info = districtDetails?.[districtId];
  if (!info) return null;

  const festivals = info.festivals ?? [];
  const festival = festivals[0];
  const themeTags = info.themeTags ?? [];
  const landmarks = (info.previewLandmarks ?? []).slice(0, 3);
  const intro = info.detailDescription || info.description || '';
  const side = TOOLTIP_SIDE[districtId] ?? 'left';

  return (
    <HoverCard
      side={side}
      districtId={districtId}
      meshRef={meshRef}
      originRef={originRef}
      cardRef={cardRef}
      position={position}
      info={info}
      intro={intro}
      themeTags={themeTags}
      landmarks={landmarks}
      festivals={festivals}
      festival={festival}
    />
  );
}

function HoverCard({
  districtId,
  side,
  meshRef,
  originRef,
  cardRef,
  position,
  info,
  intro,
  themeTags,
  landmarks,
  festivals,
  festival,
}) {
  const { t } = useTranslation();
  useOutsideDistrictPlacement(meshRef, originRef, cardRef, side, districtId);

  return (
    <>
      <group ref={originRef} position={position} />
      <Html
        position={position}
        style={{ pointerEvents: 'none' }}
        zIndexRange={[48, 0]}
      >
        <div ref={cardRef} className={styles.anchor}>
          <article className={styles.root} data-side={side}>
            <p className={styles.kicker}>{t('logo.title')}</p>
            <h2 className={styles.title}>{t(`district.${districtId}`, { defaultValue: info.name })}</h2>

            {intro ? (
              <section className={styles.intro}>
                <h3 className={styles.sectionLabel}>{t('explore.intro')}</h3>
                <p className={styles.body}>
                  {translateDistrictIntro(t, districtId, intro)}
                </p>
              </section>
            ) : null}

            {themeTags.length > 0 ? (
              <ul className={styles.tags}>
                {themeTags.map((tag) => (
                  <li key={tag}>{t(`theme.${tag}`, { defaultValue: tag })}</li>
                ))}
              </ul>
            ) : null}

            {landmarks.length > 0 ? (
              <p className={styles.meta}>
                <span>{t('hover.highlights')}</span>
                {landmarks
                  .map((item) =>
                    typeof item === 'string'
                      ? item
                      : translatePlaceName(t, item, item.name || item.title || ''),
                  )
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : null}

            {festival ? (
              <section className={styles.event}>
                <h3 className={styles.sectionLabel}>
                  {t('explore.festivalCount', { count: festivals.length })}
                </h3>
                <p className={styles.eventName}>{festival.name || festival.title}</p>
                <p className={styles.eventPeriod}>{formatFestivalPeriod(festival)}</p>
              </section>
            ) : null}

            <p className={styles.foot}>{t('hover.hint')}</p>
          </article>
        </div>
      </Html>
    </>
  );
}
