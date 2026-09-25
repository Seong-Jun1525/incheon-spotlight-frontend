/**
 * useStatPageView.js — 페이지 조회 통계를 자동으로 전송하는 훅
 * - 경로가 바뀔 때마다 page_view 이벤트를 기록
 * - 장소·코스 식별자 등 추가 정보를 함께 전송
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { STAT_EVENTS } from '../constants/statEvents';
import { trackStat } from '../utils/trackStat';

export function useStatPageView(extra = {}) {
  const location = useLocation();

  useEffect(() => {
    trackStat({
      eventType: STAT_EVENTS.PAGE_VIEW,
      ...extra,
    });
    // extra is page-identity fields (contentId, courseId), not a changing object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, extra.contentId, extra.courseId]);
}
