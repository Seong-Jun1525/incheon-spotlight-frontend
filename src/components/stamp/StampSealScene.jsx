/**
 * StampSealScene.jsx — 여권에 도장을 찍는 3D 연출 씬
 * - StampHead/Imprint 메시를 구성하고 playStampSlam으로 찍기 애니메이션을 재생
 * - 구·군 이름과 장소명을 3D 텍스트로 표시하며 다크/라이트 색을 맞춤
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, PerspectiveCamera, Text } from '@react-three/drei';
import { DISTRICT_NAME_FONT } from '../three/incheonMap/mapGroupConfig';
import { useColorModeStore } from '../../stores/useColorModeStore';
import { playStampSlam } from './stampSlamClip';

function CameraAim() {
  useUiLanguage();
  const camera = useThree((state) => state.camera);

  useLayoutEffect(() => {
    camera.lookAt(0, 0.22, 0);
  }, [camera]);

  return null;
}

function StampLabel({ children, ...props }) {
  useUiLanguage();
  return (
    <Suspense fallback={null}>
      <Text font={DISTRICT_NAME_FONT} anchorX='center' anchorY='middle' {...props}>
        {uiText(children)}
      </Text>
    </Suspense>
  );
}

function StampHead() {
  useUiLanguage();
  return (
    <group name='StampHead' position={[0, 1.32, 0]} rotation={[-0.52, 0, 0.16]}>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.72, 20]} />
        <meshStandardMaterial color='#6b3a22' roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.1, 20]} />
        <meshStandardMaterial color='#c6a15b' roughness={0.28} metalness={0.72} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.1, 32]} />
        <meshStandardMaterial color='#9f1239' roughness={0.42} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.03, 12, 40]} />
        <meshStandardMaterial color='#fff7ed' roughness={0.35} metalness={0.05} />
      </mesh>
      <StampLabel
        position={[0, 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.09}
        color='#fff7ed'
        maxWidth={0.7}
      >
        INCHEON
      </StampLabel>
    </group>
  );
}

function PassportDesk({ placeName, isDark }) {
  useUiLanguage();
  return (
    <group>
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 3.2]} />
        <meshStandardMaterial color={isDark ? '#1b2530' : '#d7c4a8'} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0.08]}>
        <planeGeometry args={[1.7, 1.15]} />
        <meshStandardMaterial color={isDark ? '#2a3340' : '#f4efe3'} roughness={0.82} />
      </mesh>
      <StampLabel
        position={[0, 0.01, 0.38]}
        rotation={[-Math.PI / 2, 0, 0.08]}
        fontSize={0.07}
        color={isDark ? '#c5d4e8' : '#3f4a3a'}
        maxWidth={1.4}
      >
        {uiText(placeName || '인천 스탬프')}
      </StampLabel>
      <mesh
        name='Imprint'
        position={[0, 0.012, -0.02]}
        rotation={[-Math.PI / 2, 0, 0.08]}
        scale={0.01}
      >
        <circleGeometry args={[0.28, 32]} />
        <meshStandardMaterial
          color='#be123c'
          transparent
          opacity={0.82}
          roughness={0.7}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function StampSealRig({ placeName, reducedMotion, onPlayed }) {
  useUiLanguage();
  const group = useRef(null);
  const playedRef = useRef(false);
  const onPlayedRef = useRef(onPlayed);
  onPlayedRef.current = onPlayed;
  const isDark = useColorModeStore((state) => state.resolved === 'dark');

  useEffect(() => {
    playedRef.current = false;
    const finish = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      onPlayedRef.current?.();
    };
    const stop = playStampSlam(group.current, {
      reducedMotion,
      onComplete: finish,
    });
    const fallback = window.setTimeout(finish, 1400);
    return () => {
      window.clearTimeout(fallback);
      stop?.();
    };
  }, [reducedMotion]);

  return (
    <group ref={group}>
      <PassportDesk placeName={placeName} isDark={isDark} />
      <StampHead />
    </group>
  );
}

export function StampSealScene({ placeName, reducedMotion = false, onPlayed }) {
  useUiLanguage();
  const isDark = useColorModeStore((state) => state.resolved === 'dark');

  return (
    <Canvas
      dpr={[1, 1.5]}
      style={{ width: '100%', height: '100%', display: 'block' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(isDark ? '#243040' : '#cbb79a', 1);
      }}
    >
      <PerspectiveCamera makeDefault position={[1.55, 1.7, 2.45]} fov={30} near={0.1} far={40} />
      <CameraAim />
      <hemisphereLight
        intensity={isDark ? 0.45 : 0.7}
        color={isDark ? '#d7e3f2' : '#fffaf3'}
        groundColor={isDark ? '#1a2430' : '#d9cbb3'}
      />
      <ambientLight intensity={isDark ? 0.35 : 0.55} />
      <directionalLight position={[2.4, 4.2, 2.2]} intensity={isDark ? 0.7 : 1.05} color='#fff7ed' />
      <StampSealRig
        placeName={placeName}
        reducedMotion={reducedMotion}
        onPlayed={onPlayed}
      />
      <ContactShadows
        position={[0, -0.07, 0]}
        opacity={isDark ? 0.45 : 0.28}
        scale={5}
        blur={2.2}
        far={2.4}
      />
    </Canvas>
  );
}
