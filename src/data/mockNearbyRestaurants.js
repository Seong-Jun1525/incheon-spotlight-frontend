/**
 * 백엔드 TourAPI(locationBasedList2) 미연동 시 시연용 주변 맛집 폴백 데이터.
 * landmarkId 또는 contentId 키로 조회합니다.
 */
const nearbyByLandmarkId = {
  'lm-wolmido': [
    {
      contentId: 'mock-food-wolmido-1',
      contentTypeId: '39',
      title: '월미도 해물칼국수',
      addr1: '인천광역시 중구 월미로 264',
      mapX: '126.5972',
      mapY: '37.4658',
      dist: 180,
    },
    {
      contentId: 'mock-food-wolmido-2',
      contentTypeId: '39',
      title: '월미공원 닭강정',
      addr1: '인천광역시 중구 월미로 248',
      mapX: '126.5958',
      mapY: '37.4665',
      dist: 320,
    },
    {
      contentId: 'mock-food-wolmido-3',
      contentTypeId: '39',
      title: '바다뷰 카페 월미',
      addr1: '인천광역시 중구 월미로 270',
      mapX: '126.5981',
      mapY: '37.4652',
      dist: 410,
    },
  ],
  'lm-chinatown': [
    {
      contentId: 'mock-food-chinatown-1',
      contentTypeId: '39',
      title: '차이나타운 짜장면거리',
      addr1: '인천광역시 중구 차이나타운로 59',
      mapX: '126.6168',
      mapY: '37.4754',
      dist: 120,
    },
    {
      contentId: 'mock-food-chinatown-2',
      contentTypeId: '39',
      title: '공차 차이나타운점',
      addr1: '인천광역시 중구 차이나타운로 62',
      mapX: '126.6172',
      mapY: '37.4758',
      dist: 250,
    },
  ],
  'lm-openport': [
    {
      contentId: 'mock-food-openport-1',
      contentTypeId: '39',
      title: '개항장 감성 카페',
      addr1: '인천광역시 중구 제물량로 218',
      mapX: '126.6165',
      mapY: '37.4568',
      dist: 200,
    },
  ],
  'lm-songdo-park': [
    {
      contentId: 'mock-food-songdo-1',
      contentTypeId: '39',
      title: '송도센트럴파크 브런치',
      addr1: '인천광역시 연수구 컨벤시아대로 165',
      mapX: '126.6380',
      mapY: '37.3928',
      dist: 150,
      localCurrency: {
        available: true,
        name: '인천e음',
        badgeText: '인천e음 사용 가능',
        notice: '정확한 캐시백률은 인천e음 앱에서 최종 확인하세요.',
      },
    },
    {
      contentId: 'mock-food-songdo-2',
      contentTypeId: '39',
      title: '트리플스트리트 연수점',
      addr1: '인천광역시 연수구 송도과학로 16',
      mapX: '126.6402',
      mapY: '37.3915',
      dist: 480,
      localCurrency: {
        available: true,
        name: '인천e음',
        badgeText: '인천e음 사용 가능',
        notice: '정확한 캐시백률은 인천e음 앱에서 최종 확인하세요.',
      },
    },
    {
      contentId: 'mock-food-songdo-3',
      contentTypeId: '39',
      title: '송도 해산물찜',
      addr1: '인천광역시 연수구 센트럴로 123',
      mapX: '126.6365',
      mapY: '37.3935',
      dist: 620,
    },
  ],
  'lm-tribowl': [
    {
      contentId: 'mock-food-tribowl-1',
      contentTypeId: '39',
      title: '트라이볼 카페',
      addr1: '인천광역시 연수구 인천타워대로 250',
      mapX: '126.6578',
      mapY: '37.3826',
      dist: 90,
      localCurrency: {
        available: true,
        name: '인천e음',
        badgeText: '인천e음 사용 가능',
        notice: '정확한 캐시백률은 인천e음 앱에서 최종 확인하세요.',
      },
    },
  ],
  'lm-sorae-port': [
    {
      contentId: 'mock-food-sorae-1',
      contentTypeId: '39',
      title: '소래포구 횟집',
      addr1: '인천광역시 남동구 소래로 45',
      mapX: '126.5578',
      mapY: '37.3908',
      dist: 220,
      localCurrency: {
        available: true,
        name: '인천e음',
        badgeText: '인천e음 사용 가능',
        notice: '정확한 캐시백률은 인천e음 앱에서 최종 확인하세요.',
      },
    },
    {
      contentId: 'mock-food-sorae-2',
      contentTypeId: '39',
      title: '소래포구 조개구이',
      addr1: '인천광역시 남동구 소래로 52',
      mapX: '126.5585',
      mapY: '37.3912',
      dist: 350,
    },
  ],
};

const nearbyByContentId = Object.fromEntries(
  Object.values(nearbyByLandmarkId).flatMap((items) =>
    items.map((item) => [item.contentId, item]),
  ),
);

// contentId → landmarkId 역매핑 (송도 등 contentId로 조회 시)
const contentIdToLandmarkId = {
  '2752976': 'lm-wolmido',
  '2752978': 'lm-chinatown',
  '2752975': 'lm-openport',
  '2752974': 'lm-songdo-park',
  '126510': 'lm-tribowl',
  '250571': 'lm-gtower',
  '125419': 'lm-jeondeungsa',
  '125418': 'lm-goryeo',
  '125420': 'lm-manisan',
  '127014': 'lm-sorae-wetland',
  '127015': 'lm-sorae-port',
  '127013': 'lm-grand-park',
};

export function getMockNearbyRestaurants(landmarkIdOrContentId, { limit = 3 } = {}) {
  if (!landmarkIdOrContentId) return [];

  const byLandmark = nearbyByLandmarkId[landmarkIdOrContentId];
  if (byLandmark) return byLandmark.slice(0, limit);

  const mappedLandmarkId = contentIdToLandmarkId[landmarkIdOrContentId];
  if (mappedLandmarkId && nearbyByLandmarkId[mappedLandmarkId]) {
    return nearbyByLandmarkId[mappedLandmarkId].slice(0, limit);
  }

  const byContent = nearbyByContentId[landmarkIdOrContentId];
  if (byContent) return [byContent].slice(0, limit);

  return [];
}
