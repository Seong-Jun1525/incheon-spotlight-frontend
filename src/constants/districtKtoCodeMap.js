/**
 * districtKtoCodeMap.js — 2026 인천 11개 구·군 ID → 표시명·백엔드 지역 ID 매핑
 * - 프론트 districtId를 TourAPI 조회용 백엔드 districtId로 연결
 * - 실제 OpenAPI 지역 코드 변환은 백엔드가 담당하며 여기서는 참고 메모만 보관
 */

export const DISTRICT_KTO_CODE_MAP = {
  jemulpo: {
    label: '제물포구',
    backendDistrictId: 'jemulpo',
    note: '2026 중·동 통합. DB가 중구·동구일 수 있음',
  },
  yeongjong: {
    label: '영종구',
    backendDistrictId: 'yeongjong',
    note: '구 중구 영종권',
  },
  geomdan: {
    label: '검단구',
    backendDistrictId: 'geomdan',
    note: '서구 분구. DB 미반영 시 서구 폴백',
  },
  seohae: {
    label: '서해구',
    backendDistrictId: 'seohae',
    note: '구 서구 잔여 권역',
  },
  yeonsu: {
    label: '연수구',
    backendDistrictId: 'yeonsu',
    note: '실제 OpenAPI 지역 코드 매핑은 백엔드에서 처리',
  },
  ganghwa: {
    label: '강화군',
    backendDistrictId: 'ganghwa',
    note: '실제 OpenAPI 지역 코드 매핑은 백엔드에서 처리',
  },
  namdong: {
    label: '남동구',
    backendDistrictId: 'namdong',
    note: '실제 OpenAPI 지역 코드 매핑은 백엔드에서 처리',
  },
  gyeyang: {
    label: '계양구',
    backendDistrictId: 'gyeyang',
    note: '실제 OpenAPI 지역 코드 매핑은 백엔드에서 처리',
  },
  bupyeong: {
    label: '부평구',
    backendDistrictId: 'bupyeong',
    note: '실제 OpenAPI 지역 코드 매핑은 백엔드에서 처리',
  },
  michuhol: {
    label: '미추홀구',
    backendDistrictId: 'michuhol',
    note: '실제 OpenAPI 지역 코드 매핑은 백엔드에서 처리',
  },
  ongjin: {
    label: '옹진군',
    backendDistrictId: 'ongjin',
    note: '실제 OpenAPI 지역 코드 매핑은 백엔드에서 처리',
  },
};
