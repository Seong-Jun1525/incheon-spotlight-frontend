/**
 * 구·군별 추천 코스 데이터.
 * contentIds는 TourAPI / TC_CURATED_LANDMARK 와 매칭됩니다.
 */
export const recommendedCourses = [
  {
    id: 'course-yeonsu-waterfront',
    districtId: 'yeonsu',
    courseName: '송도 수변 산책',
    routeLabel: '센트럴파크 → 트라이볼 → G타워',
    themeLabel: '야경 · 데이트',
    theme: '데이트',
    duration: '예상 소요시간 3시간',
    placeCount: '장소 3곳',
    summary: '수변 공원과 건축 명소, 전망대를 잇는 송도 반나절 코스입니다.',
    stops: [
      { contentId: '2752974', name: '송도센트럴파크', order: 1, mapX: '126.6374', mapY: '37.3925' },
      { contentId: '126510', name: '트라이볼', order: 2, mapX: '126.6576', mapY: '37.3828' },
      { contentId: '250571', name: 'G타워 전망대', order: 3, mapX: '126.6412', mapY: '37.3908' },
    ],
  },
  {
    id: 'course-jung-history',
    districtId: 'jemulpo',
    courseName: '개항장 역사 산책',
    routeLabel: '월미도 → 차이나타운 → 개항장 거리',
    themeLabel: '역사 · 산책',
    theme: '역사',
    duration: '예상 소요시간 3시간',
    placeCount: '장소 3곳',
    summary: '인천 개항의 흔적을 따라가는 중구 내륙권 대표 코스입니다.',
    stops: [
      { contentId: '2752976', name: '월미도', order: 1, mapX: '126.5967', mapY: '37.4661' },
      { contentId: '2752978', name: '차이나타운', order: 2, mapX: '126.6164', mapY: '37.4756' },
      { contentId: '2752975', name: '개항장 거리', order: 3, mapX: '126.6162', mapY: '37.4566' },
    ],
  },
  {
    id: 'course-ganghwa-heritage',
    districtId: 'ganghwa',
    courseName: '강화 역사·자연 코스',
    routeLabel: '전등사 → 고인돌 → 마니산',
    themeLabel: '역사 · 가족',
    theme: '역사',
    duration: '예상 소요시간 4시간',
    placeCount: '장소 3곳',
    summary: '고찰·유네스코 유적·산행을 묶은 강화 하루 코스입니다.',
    stops: [
      { contentId: '125419', name: '전등사', order: 1, mapX: '126.4867', mapY: '37.6331' },
      { contentId: '125418', name: '강화 고인돌 유적', order: 2, mapX: '126.4367', mapY: '37.5667' },
      { contentId: '125420', name: '마니산', order: 3, mapX: '126.4633', mapY: '37.5500' },
    ],
  },
  {
    id: 'course-namdong-eco',
    districtId: 'namdong',
    courseName: '남동 생태·포구 코스',
    routeLabel: '소래습지 → 소래포구 → 인천대공원',
    themeLabel: '가족 · 바다',
    theme: '가족',
    duration: '예상 소요시간 3시간',
    placeCount: '장소 3곳',
    summary: '습지 산책과 포구 먹거리, 공원 나들이를 잇는 가족 코스입니다.',
    stops: [
      { contentId: '127014', name: '소래습지생태공원', order: 1, mapX: '126.5683', mapY: '37.4017' },
      { contentId: '127015', name: '소래포구', order: 2, mapX: '126.5572', mapY: '37.3903' },
      { contentId: '127013', name: '인천대공원', order: 3, mapX: '126.7550', mapY: '37.4483' },
    ],
  },
];

export function getCourseByDistrictId(districtId) {
  if (!districtId) {
    return null;
  }

  return recommendedCourses.find((course) => course.districtId === districtId) ?? null;
}

export function getCourseById(courseId) {
  return recommendedCourses.find((course) => course.id === courseId) ?? null;
}
