/**
 * mockDistricts.js — 구·군별 소개 문구와 대표 랜드마크 목록의 목업 데이터
 * - 지역 탐색 화면의 구·군 설명·상세 설명·테마 태그 제공
 * - landmarkIds로 mockLandmarks의 랜드마크와 연결
 */

import { DISTRICT_DISPLAY_NAME } from '../components/three/mapVisualConstants';

export const mockDistricts = [
  {
    id: 'jemulpo',
    name: DISTRICT_DISPLAY_NAME.jemulpo,
    description: '개항의 역사와 미식 골목이 공존하는 원도심 여행지',
    detailDescription:
      '개항장 거리의 근대문화유산과 차이나타운, 전통시장의 먹거리를 한 동선에서 둘러보기 좋은 원도심 권역입니다. 역사 산책부터 바다 전망과 미식 여행까지 취향에 맞춰 코스를 구성할 수 있습니다.',
    themeTags: ['역사', '가족'],
    landmarkIds: [
      'lm-wolmido',
      'lm-chinatown',
      'lm-openport',
      'lm-hwadojin',
      'lm-songhyeon',
      'lm-dong-museum',
    ],
  },
  {
    id: 'yeonsu',
    name: DISTRICT_DISPLAY_NAME.yeonsu,
    description: '송도의 현대적인 스카이라인과 야경 산책 코스',
    detailDescription:
      '송도 센트럴파크를 중심으로 수변 산책과 현대적인 건축 경관을 함께 즐길 수 있습니다. 낮에는 공원과 문화공간을 둘러보고, 저녁에는 도심 야경을 감상하는 일정으로 이어가기 좋습니다.',
    themeTags: ['데이트', '야경', '바다'],
    landmarkIds: ['lm-songdo-park', 'lm-tribowl', 'lm-gtower'],
  },
  {
    id: 'ganghwa',
    name: DISTRICT_DISPLAY_NAME.ganghwa,
    description: '고찰과 산, 유적이 이어지는 역사 자연 여행지',
    detailDescription:
      '전등사와 고려시대 유적, 마니산 등 강화의 역사와 자연을 함께 만날 수 있는 권역입니다. 유적 답사와 숲길 산책을 여유 있게 연결하는 가족 여행이나 당일 역사 코스에 잘 어울립니다.',
    themeTags: ['역사', '가족'],
    landmarkIds: ['lm-jeondeungsa', 'lm-goryeo', 'lm-manisan'],
  },
  {
    id: 'namdong',
    name: DISTRICT_DISPLAY_NAME.namdong,
    description: '도심 속 생태공원과 포구 감성이 어우러진 지역',
    detailDescription:
      '소래포구의 활기와 습지 생태공원의 차분한 풍경을 한 번에 경험할 수 있습니다. 도심에서 멀리 이동하지 않고도 산책, 생태 관찰, 제철 먹거리를 함께 즐기기 좋은 지역입니다.',
    themeTags: ['가족', '바다'],
    landmarkIds: ['lm-sorae-wetland', 'lm-sorae-port', 'lm-grand-park'],
  },
  {
    id: 'seohae',
    name: DISTRICT_DISPLAY_NAME.seohae,
    description: '청라·문화공간이 이어지는 서부 생활권',
    detailDescription:
      '청라의 수변 공간과 문화시설, 서해 낙조를 감상할 수 있는 장소가 이어지는 권역입니다. 가벼운 산책과 전시 관람, 일몰 감상을 묶어 반나절 코스로 둘러보기 좋습니다.',
    themeTags: ['데이트', '가족'],
    landmarkIds: ['lm-cheongna', 'lm-jeongseojin', 'lm-aramnuri'],
  },
  {
    id: 'geomdan',
    name: DISTRICT_DISPLAY_NAME.geomdan,
    description: '신도시와 자연이 맞닿은 북부 생활·여행 거점',
    detailDescription:
      '새로운 생활권의 편의성과 주변 자연 공간을 함께 이용할 수 있는 인천 북부의 여행 거점입니다. 복잡한 일정 대신 공원과 산책길을 중심으로 여유로운 생활형 나들이를 계획하기 좋습니다.',
    themeTags: ['가족', '데이트'],
    landmarkIds: [],
  },
  {
    id: 'gyeyang',
    name: DISTRICT_DISPLAY_NAME.gyeyang,
    description: '산책과 전망이 좋은 생활형 자연 여행지',
    detailDescription:
      '계양산과 주변 녹지에서 가벼운 산책부터 전망을 즐기는 등산까지 선택할 수 있습니다. 가까운 문화·생활 시설을 함께 둘러볼 수 있어 가족 나들이와 주말 휴식 코스로 활용하기 좋습니다.',
    themeTags: ['가족', '역사'],
    landmarkIds: ['lm-gyeyangsan', 'lm-gyeyang-library', 'lm-gyulsan'],
  },
  {
    id: 'bupyeong',
    name: DISTRICT_DISPLAY_NAME.bupyeong,
    description: '로컬 상권과 공원이 공존하는 활기 있는 지역',
    detailDescription:
      '지역 상권과 문화 공간, 도심 공원이 가까이 모여 있어 걷는 여행에 잘 맞습니다. 쇼핑과 먹거리 탐방 사이에 공원 산책을 더해 활기차면서도 부담 없는 하루 코스를 만들 수 있습니다.',
    themeTags: ['데이트', '가족'],
    landmarkIds: ['lm-bupyeong-park', 'lm-bupyeong-street', 'lm-sipjeong'],
  },
  {
    id: 'michuhol',
    name: DISTRICT_DISPLAY_NAME.michuhol,
    description: '생활권 중심에서 만나는 인천 대표 명소 접근지',
    detailDescription:
      '인천 도심의 생활문화와 공원, 역사 자원을 편리한 동선으로 둘러볼 수 있는 권역입니다. 대중교통을 이용한 짧은 나들이부터 주변 원도심을 연계한 여행까지 다양하게 구성할 수 있습니다.',
    themeTags: ['가족', '역사'],
    landmarkIds: ['lm-subong', 'lm-jayu-park', 'lm-incheon-station'],
  },
  {
    id: 'yeongjong',
    name: DISTRICT_DISPLAY_NAME.yeongjong,
    description: '공항과 해안 드라이브를 동시에 즐기는 섬 여행',
    detailDescription:
      '인천국제공항의 현대적인 풍경과 을왕리·용유도의 해안 경관을 함께 즐길 수 있습니다. 바다 산책과 카페, 일몰 감상을 연결한 드라이브 코스로 방문하기 좋은 섬 여행지입니다.',
    themeTags: ['바다', '야경'],
    landmarkIds: ['lm-eurwangni', 'lm-yongyu', 'lm-paran'],
  },
  {
    id: 'ongjin',
    name: DISTRICT_DISPLAY_NAME.ongjin,
    description: '섬 여행의 관문, 해양 감성을 느끼는 코스',
    detailDescription:
      '각기 다른 풍경을 지닌 섬과 해변을 따라 인천의 해양 문화를 깊이 경험할 수 있습니다. 배편과 이동 시간을 미리 확인해 한 섬을 여유롭게 둘러보는 일정으로 계획하는 것이 좋습니다.',
    themeTags: ['바다', '가족'],
    landmarkIds: ['lm-yeongheung', 'lm-deokjeok', 'lm-muui'],
  },
];
