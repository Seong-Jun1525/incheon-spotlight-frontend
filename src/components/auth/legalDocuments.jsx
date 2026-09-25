/**
 * legalDocuments.jsx — 회원가입/푸터에서 쓰는 이용약관·개인정보 안내 본문
 * - TermsArticle / PrivacyArticle: 서비스 목적, 회원 의무, 수집 항목을 조항 형태로 표시
 * - LEGAL_DOCS: 모달 제목·설명 메타데이터
 */
export function TermsArticle({ className }) {
  return (
    <article className={className}>
      <h2>제1조 (목적)</h2>
      <p>
        Incheon Spotlight는 인천 관광 정보를 탐색하고, 로그인한 회원이 방문 인증과 지역 스탬프를
        기록할 수 있는 웹 서비스입니다.
      </p>
      <h2>제2조 (회원의 의무)</h2>
      <p>
        회원은 정확한 정보를 제공해야 하며, 타인의 계정을 사용할 수 없습니다. 방문 인증 사진은
        방문 확인 자료로 보관될 수 있습니다.
      </p>
      <h2>제3조 (서비스의 성격)</h2>
      <p>
        인천스팟은 독립적으로 운영되는 여행 서비스입니다.
      </p>
      <h2>제4조 (이메일 인증)</h2>
      <p>
        회원가입과 비밀번호 재설정 시 이메일로 숫자 6자리 인증번호를 보냅니다. 인증번호는 짧은
        시간만 유효하며, 원문은 서버에 저장하지 않습니다.
      </p>
    </article>
  );
}

export function PrivacyArticle({ className }) {
  return (
    <article className={className}>
      <h2>제1조 (수집 항목)</h2>
      <p>
        수집 항목은 이름, 휴대전화번호, 이메일, 닉네임, 비밀번호 해시, 방문 인증 사진·후기,
        저장한 여행지입니다. 회원가입·비밀번호 재설정 과정에서 인증 메일을 보내기 위해 이메일
        주소를 사용합니다.
      </p>
      <h2>제2조 (처리 방법)</h2>
      <p>
        비밀번호는 해시로만 저장하며 응답에 포함하지 않습니다. 비공개·확인 중 사진은 작성자와
        관리자만 볼 수 있습니다.
      </p>
    </article>
  );
}

export const LEGAL_DOCS = {
  terms: {
    title: '이용약관',
    description: '인천 관광정보 서비스 이용에 관한 안내입니다.',
  },
  privacy: {
    title: '개인정보 처리 안내',
    description: '회원 가입 및 방문 인증 과정에서 처리하는 개인정보 항목을 안내합니다.',
  },
};
