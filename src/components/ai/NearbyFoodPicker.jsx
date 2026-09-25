/**
 * NearbyFoodPicker.jsx — 주변 맛집 후보를 음식 종류 탭으로 골라보는 컴포넌트
 * - groupsFromVerifiedPlaces로 검증된 장소를 cuisine별로 묶고 정해진 순서로 정렬
 * - 선택한 종류의 식당을 누르면 좌표·주소를 담아 onSelect로 상위에 전달
 * - 거리를 m/km로 포맷하며, compact 변형으로 채팅 답변 안에서도 사용
 */
import { useEffect, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import styles from './AiCourseStudio.module.scss';

function formatDistance(meters) {
  if (!Number.isFinite(Number(meters))) return '';
  const value = Number(meters);
  return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${Math.round(value)}m`;
}

export function groupsFromVerifiedPlaces(places) {
  const food = (places ?? []).filter((place) => place?.contentId && place?.cuisineLabel);
  if (!food.length) return [];

  const order = ['korean', 'chinese', 'japanese', 'western', 'cafe', 'asian', 'other'];
  const byCuisine = new Map();
  for (const place of food) {
    const cuisine = place.cuisine || place.cuisineLabel;
    if (!byCuisine.has(cuisine)) {
      byCuisine.set(cuisine, {
        cuisine,
        label: place.cuisineLabel,
        restaurants: [],
      });
    }
    byCuisine.get(cuisine).restaurants.push({
      contentId: place.contentId,
      title: place.title,
      address: place.address,
      mapX: place.mapX,
      mapY: place.mapY,
      cuisineLabel: place.cuisineLabel,
    });
  }

  return [...byCuisine.values()].sort(
    (a, b) => order.indexOf(a.cuisine) - order.indexOf(b.cuisine),
  );
}

export function NearbyFoodPicker({ groups, onSelect, compact = false }) {
  const visible = (groups ?? []).filter((group) => group?.restaurants?.length);
  const signature = visible.map((group) => group.cuisine).join('|');
  const [cuisine, setCuisine] = useState(visible[0]?.cuisine ?? null);

  useEffect(() => {
    setCuisine(visible[0]?.cuisine ?? null);
  }, [signature]);

  if (!visible.length) return null;

  const active = visible.find((group) => group.cuisine === cuisine) ?? visible[0];

  return (
    <div className={compact ? styles.nearbyFoodCompact : styles.nearbyFood}>
      <p>
        <UtensilsCrossed size={12} aria-hidden />
        이 근처 맛집 후보
      </p>
      <div className={styles.cuisineChips} role='tablist' aria-label='음식 종류'>
        {visible.map((group) => (
          <button
            key={group.cuisine}
            type='button'
            role='tab'
            aria-selected={active.cuisine === group.cuisine}
            onClick={(event) => {
              event.stopPropagation();
              setCuisine(group.cuisine);
            }}
          >
            {group.label}
            <small>{group.restaurants.length}</small>
          </button>
        ))}
      </div>
      <ul>
        {active.restaurants.map((restaurant) => (
          <li key={restaurant.contentId}>
            <button
              type='button'
              onClick={(event) => {
                event.stopPropagation();
                onSelect?.({
                  contentId: restaurant.contentId,
                  name: restaurant.title,
                  title: restaurant.title,
                  mapX: restaurant.mapX,
                  mapY: restaurant.mapY,
                  address: restaurant.address,
                });
              }}
            >
              <strong>{restaurant.title}</strong>
              <small>
                {[
                  restaurant.cuisineLabel || active.label,
                  formatDistance(restaurant.distanceM),
                  restaurant.address,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
