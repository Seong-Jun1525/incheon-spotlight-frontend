/**
 * stampSlamClip.js — 스탬프 도장 찍기 GSAP 타임라인
 * - playStampSlam(root): StampHead를 내려찍고 Imprint를 확대하는 클립을 재생
 * - reducedMotion이면 최종 포즈만 적용하고, 노드명이 같으면 이후 GLB 클립으로 교체 가능
 */
import gsap from 'gsap';

export const STAMP_SLAM_CLIP = 'STAMP_SLAM';

/**
 * 여권에 도장을 찍는 모션을 호출한다.
 * 리그 노드명 StampHead / Imprint 를 유지하면 이후 GLB 클립으로 교체할 수 있다.
 */
export function playStampSlam(root, { reducedMotion = false, onComplete } = {}) {
  const head = root?.getObjectByName('StampHead');
  const imprint = root?.getObjectByName('Imprint');

  if (!head) {
    onComplete?.();
    return () => {};
  }

  if (reducedMotion) {
    head.position.y = -0.07;
    head.rotation.set(0, 0, 0);
    imprint?.scale.set(1, 1, 1);
    onComplete?.();
    return () => {};
  }

  const timeline = gsap.timeline({ id: STAMP_SLAM_CLIP, onComplete });
  gsap.set(head.position, { y: 1.32 });
  gsap.set(head.rotation, { x: -0.52, y: 0, z: 0.16 });
  if (imprint) gsap.set(imprint.scale, { x: 0.01, y: 0.01, z: 0.01 });

  timeline.to(
    head.position,
    { y: -0.075, duration: 0.4, ease: 'power4.in' },
    0,
  );
  timeline.to(
    head.rotation,
    { x: 0, z: 0, duration: 0.4, ease: 'power3.in' },
    0,
  );
  timeline.to(head.position, { y: 0.1, duration: 0.1, ease: 'power2.out' });
  timeline.to(head.position, { y: -0.045, duration: 0.1, ease: 'power1.inOut' });
  timeline.to(head.position, { y: 0.4, duration: 0.34, ease: 'power2.out' });
  timeline.to(
    head.rotation,
    { x: -0.12, z: 0.05, duration: 0.44, ease: 'power2.out' },
    0.5,
  );
  if (imprint) {
    timeline.to(
      imprint.scale,
      { x: 1, y: 1, z: 1, duration: 0.1, ease: 'back.out(2.4)' },
      0.38,
    );
  }

  return () => {
    timeline.kill();
  };
}
