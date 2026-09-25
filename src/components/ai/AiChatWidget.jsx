/**
 * AiChatWidget.jsx — AI 챗봇 런처와 패널을 페이지에 얹는 위젯
 * - useAiChatStore의 열림 상태에 따라 AiChatLauncher와 AiChatPanel을 전환
 * - AI가 추천한 장소를 고르면 /map/:contentId로, 코스 경로 보기를 누르면 코스 지도로 이동
 * - navigateStateFromAiPlace로 지도 페이지에 넘길 라우터 state를 구성
 */
import { useNavigate } from 'react-router-dom';
import { useAiChatStore } from '../../stores/useAiChatStore';
import { AI_GENERATED_COURSE_ID } from '../../utils/aiCourseAdapter';
import { toMapPageState } from '../../utils/mapNavigation';
import { AiChatLauncher, AiChatPanel } from './AiChatPanel';

export function navigateStateFromAiPlace(place) {
  if (!place?.contentId) return null;
  return toMapPageState(place);
}

export function AiChatWidget({ districtId, contentId, placeTitle }) {
  const navigate = useNavigate();
  const isOpen = useAiChatStore((state) => state.isOpen);
  const open = useAiChatStore((state) => state.open);
  const close = useAiChatStore((state) => state.close);

  const handleSelectPlace = (place) => {
    const state = navigateStateFromAiPlace(place);
    if (!state) return;
    navigate(`/map/${place.contentId}`, { state });
  };

  const handleViewCourseRoute = (course) => {
    if (!course?.stops?.length) return;
    navigate(`/course/${AI_GENERATED_COURSE_ID}/map`);
  };

  return (
    <>
      <AiChatLauncher hidden={isOpen} onClick={open} />
      <AiChatPanel
        isOpen={isOpen}
        onClose={close}
        districtId={districtId}
        contentId={contentId}
        placeTitle={placeTitle}
        onSelectPlace={handleSelectPlace}
        onViewCourseRoute={handleViewCourseRoute}
      />
    </>
  );
}
