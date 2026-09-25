/**
 * aiJobApi.js — AI 비동기 잡 제출·폴링 공통 러너
 * - POST /api/ai/{kind}/jobs 제출 (Idempotency-Key 재사용, 5xx만 최대 3회 재시도)
 * - GET /api/ai/jobs/{id} 를 2초 간격으로 폴링하며 최대 11분 대기
 * - abort 시 DELETE /api/ai/jobs/{id} 로 서버 작업까지 취소
 */
import { api } from './http';

const cancelled = () => Object.assign(new Error('Cancelled'), { code: 'ERR_CANCELED' });
function pause(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(cancelled()); return; }
    const abort = () => { clearTimeout(timer); reject(cancelled()); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
export async function runAiJob(kind, body, { signal } = {}) {
  const key = crypto.randomUUID();
  let job;
  // Retrying submission uses the same key, so a dropped response cannot start a second generation.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      ({ data: job } = await api.post(`/api/ai/${kind}/jobs`, body, { signal, timeout: 15000, headers: { 'Idempotency-Key': key } }));
      break;
    } catch (error) {
      if (signal?.aborted || error.code === 'ERR_CANCELED' || (error.response && error.response.status < 500) || attempt === 2) throw error;
      await pause(1000 * (attempt + 1), signal);
    }
  }
  const abort = () => { void api.delete(`/api/ai/jobs/${job.id}`).catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  const deadline = Date.now() + 660000;
  try {
    if (signal?.aborted) { abort(); throw cancelled(); }
    let failures = 0;
    while (true) {
      if (job.state === 'SUCCEEDED') return job.result;
      if (job.state === 'CANCELLED') throw cancelled();
      if (job.state === 'FAILED') throw Object.assign(new Error(job.error), { response: { status: job.errorStatus, data: { error: job.error, message: job.error } } });
      if (Date.now() > deadline) { abort(); throw Object.assign(new Error('Timeout'), { code: 'ECONNABORTED' }); }
      await pause(2000, signal);
      try {
        ({ data: job } = await api.get(`/api/ai/jobs/${job.id}`, { signal, timeout: 10000 }));
        failures = 0;
      } catch (error) {
        if (signal?.aborted || error.code === 'ERR_CANCELED' || (error.response && error.response.status < 500) || ++failures > 5) throw error;
      }
    }
  } finally { signal?.removeEventListener('abort', abort); }
}
