/**
 * 메인 화면용 목 데이터 (향후 KTO OpenAPI: contentid, contenttypeid, mapx, mapy, firstimage)
 */

export const categoryOptions = [
  { value: 'all', label: '전체 카테고리' },
  { value: '12', label: '관광지' },
  { value: '14', label: '문화시설' },
  { value: '39', label: '음식점' },
  { value: '32', label: '숙박' },
  { value: 'walk', label: '산책' },
  { value: 'night', label: '야경' },
];

const basePlaces = [
  {
    id: 1,
    contentid: '2752974',
    contenttypeid: 12,
    title: '송도 센트럴파크',
    name: '송도 센트럴파크',
    districtId: 'yeonsu',
    mapx: 126.639,
    mapy: 37.388,
    firstimage: '/images/place-songdo.jpg',
    category: '자연/공원',
    rating: 4.8,
    summary: '해안 산책로와 보트, 야경까지 즐기는 송도 대표 공원입니다.',
    address: '인천 연수구 컨벤시아대로 160',
    recommendReason: '바다·공원·야경을 한 번에 즐기기 좋습니다.',
    nearbyFood: ['송도 국제음식점거리', '트리플스트리트 카페거리'],
  },
  {
    id: 2,
    contentid: '2752975',
    contenttypeid: 12,
    title: '개항장 거리',
    name: '개항장 거리',
    districtId: 'jemulpo',
    mapx: 126.63,
    mapy: 37.47,
    firstimage: '/images/place-openport.jpg',
    category: '역사/문화',
    rating: 4.6,
    summary: '근대 건축과 개항역사를 거닐 수 있는 인천 원도심 명소입니다.',
    address: '인천 중구 월미로 1',
    recommendReason: '역사·사진·카페 투어를 한 코스로 연결하기 좋습니다.',
    nearbyFood: ['차이나타운 짜장·짬뽕', '개항장 일대 디저트 카페'],
  },
  {
    id: 3,
    contentid: '2752976',
    contenttypeid: 12,
    title: '월미도',
    name: '월미도',
    districtId: 'michuhol',
    mapx: 126.6,
    mapy: 37.45,
    firstimage: '/images/place-wolmido.jpg',
    category: '관광/체험',
    rating: 4.5,
    summary: '놀이공원·산책로·해안이 어우러진 대표 관광지입니다.',
    address: '인천 중구 월미로 262',
    recommendReason: '가족·데이트 코스로 이동 동선이 단순합니다.',
    nearbyFood: ['월미도 횟집거리', '해안 산책로 카페'],
  },
  {
    id: 4,
    contentid: '2752977',
    contenttypeid: 12,
    title: '인천 차이나타운',
    name: '인천 차이나타운',
    districtId: 'jemulpo',
    mapx: 126.62,
    mapy: 37.47,
    firstimage: '/images/place-chinatown.jpg',
    category: '문화/체험',
    rating: 4.7,
    summary: '이국적인 분위기와 먹거리·문화 체험이 밀집한 골목입니다.',
    address: '인천 중구 차이나타운로 56',
    recommendReason: '개항장과 연계해 반나절 코스로 구성하기 좋습니다.',
    nearbyFood: ['공화춘', '마늘빵·꿔바로우 맛집'],
  },
  {
    id: 5,
    contentid: '2752978',
    contenttypeid: 12,
    title: '인천대교',
    name: '인천대교',
    districtId: 'yeongjong',
    mapx: 126.57,
    mapy: 37.41,
    firstimage: '/images/place-bridge.jpg',
    category: '명소/전망',
    rating: 4.9,
    summary: '바다 위를 가로지르는 장대한 전망과 드라이브 명소입니다.',
    address: '인천 중구 영종대로',
    recommendReason: '일몰·야경 포인트로 드라이브 코스에 어울립니다.',
    nearbyFood: ['영종도 해산물 식당', '을왕리 바닷가 횟집'],
  },
];

export const recommendedPlaces = basePlaces.map((p) => ({
  ...p,
  imageUrl: p.firstimage,
}));

export const navLinks = [
  { id: 'explore', label: '지역 탐색' },
  { id: 'travel', label: '여행계획' },
  { id: 'about', label: '인천소개' },
  { id: 'visits', label: '여행자들의 한 장' },
];

export const tourismNews = {
  id: 'news-2026',
  title: '2026 인천 방문의 해',
  desc: '다양한 이벤트와 혜택을 만나보세요!',
  imageUrl: '/images/tourism-news-2026.jpg',
};

export const noticeItems = [
  {
    id: 'n1',
    text: '2026 인천 관광 데이터 활용 공모전 안내',
    date: '2026.04.20',
  },
  {
    id: 'n2',
    text: '인천 주요 관광지 운영 시간 변경 안내',
    date: '2026.04.18',
  },
  {
    id: 'n3',
    text: '송도 센트럴파크 이벤트 안내',
    date: '2026.04.15',
  },
];

export const staticWeather = {
  temp: '20°C',
  label: '테스트',
  fineDust: '보통',
};
