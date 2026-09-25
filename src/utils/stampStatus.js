/**
 * stampStatus.js — 스탬프·방문 인증 상태 코드를 화면용 한국어 라벨로 변환
 * - stampStatusLabel(status): ACQUIRED/APPROVED는 '획득', PENDING은 '확인 중', 알 수 없는 값은 '미획득'
 * - visitStatusLabel(status): 방문 인증 심사 단계(확인 중·보완 필요·확인 완료·인증 불가) 표기
 */
export function stampStatusLabel(status) {
  switch (status) {
    case 'ACQUIRED':
    case 'APPROVED':
      return '획득';
    case 'PENDING':
      return '확인 중';
    case 'NEEDS_REVISION':
      return '보완 필요';
    case 'REJECTED':
      return '인증 불가';
    default:
      return '미획득';
  }
}

export function visitStatusLabel(status) {
  switch (status) {
    case 'PENDING':
      return '확인 중';
    case 'NEEDS_REVISION':
      return '보완 필요';
    case 'APPROVED':
      return '확인 완료';
    case 'REJECTED':
      return '인증 불가';
    default:
      return status || '';
  }
}
