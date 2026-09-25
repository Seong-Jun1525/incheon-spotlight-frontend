/**
 * AiThinkingTrace.jsx — AI 응답 대기 상태와 참고 출처를 알리는 표시용 컴포넌트
 * - AiThinkingTrace: active일 때 안내 제목과 텍스트 스켈레톤으로 생성 중임을 보여줌
 * - AiThoughtSummary: 호출한 도구 라벨 목록을 <details>로 접어 출처처럼 노출
 */
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../atoms/Skeleton';
import styles from './AiThinkingTrace.module.scss';

export function AiThinkingTrace({ title, active = true }) {
  const { t } = useTranslation();
  if (!active) return null;
  const label = title || t('ai.preparing');
  return (
    <div className={styles.trace}>
      <p className={styles.title}>{label}</p>
      <Skeleton variant='text' count={1} label={label} />
    </div>
  );
}

export function AiThoughtSummary({ tools = [] }) {
  const { t } = useTranslation();
  if (!tools.length) return null;
  return (
    <details className={styles.summary}>
      <summary>{t('ai.usedSources')}</summary>
      <ol>
        {tools.map((label) => (
          <li key={label}>{t(label, { defaultValue: label })}</li>
        ))}
      </ol>
    </details>
  );
}
