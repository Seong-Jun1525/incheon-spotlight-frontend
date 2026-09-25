/**
 * travelPrompt.js — 말로 요청하기용 프롬프트 양식 생성기
 * - 목적·날짜·인원·예산 등 10개 항목을 번호 목록으로 채운 요청문을 만든다
 * - 값이 없는 항목은 []로 남겨 사용자가 직접 채우게 한다
 */

/** Shared request form. Only supplied values replace the blank fields. */
export function fillPromptDraft(values = {}) {
  return `아래 조건에 맞춰 실행 가능한 여행 일정 초안을 작성해 주세요.

1. 여행 목적·선호 활동: ${values.purpose || '[]'}
2. 여행 날짜·시작/종료 시각: ${values.dates || '[]'}
3. 동행 인원·연령대: ${values.party || '[]'}
4. 출발 장소 / 여행 종료 장소: ${values.endpoints || '[] / []'}
5. 방문 희망 지역·장소: ${values.places || '[]'}
6. 이동 수단·일정 여유·걷기 한도: ${values.transport || '[]'}
7. 예산 기준(전체/1인)·금액·포함 항목: ${values.budget || '[]'}
8. 숙박 여부·예약 상태: ${values.lodging || '[]'}
9. 꼭 포함할 일정·시각·소요 시간: ${values.schedule || '[]'}
10. 피할 활동·음식·이동 제약: ${values.constraints || '[]'}

작성 기준
- 가까운 장소를 묶고 이동·식사·휴식 시간을 확보해 주세요.
- 날짜별로 시작 시각, 체류 시간, 장소, 활동을 간결하게 정리해 주세요.
- 확인되지 않은 요금·영업시간은 확정하지 말고 확인 필요로 표시해 주세요.
- 선택 조건이 미정이면 추천하되, 적용한 가정과 우천 대안을 짧게 알려 주세요.`;
}
