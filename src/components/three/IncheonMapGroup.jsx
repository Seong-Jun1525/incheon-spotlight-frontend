/**
 * 인천 3D 맵 그룹 — 랜드마크 포함 통합 맵
 * 호버/선택/카메라/라벨 유지. 미획득 랜드마크는 공사현장, 스탬프 시 건설.
 */
import { useMemo, useRef } from 'react';
import { MeshStandardMaterial } from 'three';
import { districtLabels } from '../../data/incheonDistricts';
import { useDistrictLegalCodeMap } from '../../hooks/useDistrictLegalCodeMap';
import { getDistrictSggCd } from '../../services/districtLegalCodeService';
import {
  IncheonIcMap,
} from './IncheonIcMap';
import { IC_MAP_HEIGHT_BOOST } from './incheonIcMapConfig';
import { LandmarkBuildLayer, useZoomPastThreshold } from './landmark/LandmarkBuildLayer';
import { groupSitesByDistrict } from './landmark/landmarkGlbMap';
import { DistrictCameraSync } from './incheonMap/DistrictCameraSync';
import { LandmarkCameraFocus } from './incheonMap/LandmarkCameraFocus';
import { DistrictHoverTooltip } from './incheonMap/DistrictHoverTooltip';
import { DistrictName3D } from './incheonMap/DistrictName3D';
import {
  MAP_CAMERA_REST,
  MAP_CONFIG,
  SITE_DETAIL_ZOOM,
} from './incheonMap/mapGroupConfig';
import { useDistrictMeshHighlight } from './incheonMap/useDistrictMeshHighlight';
import { getDistrictPalette } from './mapVisualConstants';
import { MapOcean } from './incheonMap/MapOcean';

/** 통합 맵은 XY(Z=두께). 라벨·툴팁은 로컬 +Z (= 월드 +Y after -π/2 X) */
const LABEL_CHIP_POS = [0, 0, 0.16];
const LABEL_TEXT_POS = [0, 0, 0.12];
const TOOLTIP_POS = [0, 0, 0.2];

function createDistrictMaterial(id) {
  const palette = getDistrictPalette(id);
  return new MeshStandardMaterial({
    color: palette.fill,
    emissive: palette.side,
    emissiveIntensity: 0.1,
    roughness: 0.48,
    metalness: 0.04,
    flatShading: false,
  });
}

export function IncheonMapGroup({
  selectedDistrict = null,
  hoveredDistrict = null,
  onDistrictClick,
  onDistrictHover,
  floatAnimation = false,
  landmarkPins = [],
  spotlightPins = [],
  onLandmarkClick,
  districtDetails = {},
  selectedLandmarkId = null,
  seasonMonth = null,
}) {
  const groupRef = useRef(null);
  const districtRefs = useRef({});
  const districtModelRefs = useRef({});

  const registerDistrictRef = (id, node) => {
    districtRefs.current[id] = node;
  };

  const registerDistrictModelRef = (id, node) => {
    districtModelRefs.current[id] = node;
  };

  useDistrictMeshHighlight({
    selectedDistrict,
    hoveredDistrict,
    districtModelRefs,
  });

  const pinPlaces = useMemo(() => {
    const places = [];
    for (const pin of landmarkPins ?? []) {
      if (pin?.place) places.push(pin.place);
    }
    for (const pin of spotlightPins ?? []) {
      if (pin?.place) places.push(pin.place);
    }
    return places;
  }, [landmarkPins, spotlightPins]);

  void floatAnimation;

  return (
    <>
      <DistrictCameraSync
        selectedDistrict={selectedDistrict}
        districtRefs={districtRefs}
        restTarget={MAP_CAMERA_REST}
      />
      <LandmarkCameraFocus />

      <group
        ref={groupRef}
        name='incheonMap'
        position={MAP_CONFIG.position}
        rotation={MAP_CONFIG.rotation}
        scale={MAP_CONFIG.scale}
      >
        <MapOcean seasonMonth={seasonMonth} />
        <IncheonIcMap>
          {({ districts, landmarks }) => (
            <MapDistricts
              districts={districts}
              landmarks={landmarks}
              selectedDistrict={selectedDistrict}
              hoveredDistrict={hoveredDistrict}
              districtDetails={districtDetails}
              onDistrictClick={onDistrictClick}
              onDistrictHover={onDistrictHover}
              registerDistrictRef={registerDistrictRef}
              registerDistrictModelRef={registerDistrictModelRef}
              onLandmarkClick={onLandmarkClick}
              selectedLandmarkId={selectedLandmarkId}
              pinPlaces={pinPlaces}
            />
          )}
        </IncheonIcMap>
      </group>
    </>
  );
}

function MapDistricts({
  districts,
  landmarks,
  selectedDistrict,
  hoveredDistrict,
  districtDetails,
  onDistrictClick,
  onDistrictHover,
  registerDistrictRef,
  registerDistrictModelRef,
  onLandmarkClick,
  selectedLandmarkId,
  pinPlaces = [],
}) {
  const { districtLegalCodeMap } = useDistrictLegalCodeMap();
  const { grouped, leftovers } = useMemo(
    () => groupSitesByDistrict(landmarks, districts),
    [landmarks, districts],
  );
  const zoomDetail = useZoomPastThreshold(SITE_DETAIL_ZOOM);

  return (
    <>
      {districts.map(({ id, geometry, center, label, scenery }) => {
        const isSelected = selectedDistrict === id;
        const isHovered = hoveredDistrict === id && !isSelected;
        const interactionScale = isSelected ? 1.04 : isHovered ? 1.025 : 1;
        const liftZ = isSelected ? 0.055 : isHovered ? 0.032 : 0;

        return (
          <DistrictMesh
            key={id}
            id={id}
            geometry={geometry}
            scenery={scenery}
            center={center}
            label={label}
            legalDistrictCode={getDistrictSggCd(districtLegalCodeMap, id)}
            interactionScale={interactionScale}
            liftZ={liftZ}
            isSelected={isSelected}
            isHovered={isHovered}
            districtDetails={districtDetails}
            selectedDistrict={selectedDistrict}
            onDistrictClick={onDistrictClick}
            onDistrictHover={onDistrictHover}
            registerDistrictRef={registerDistrictRef}
            registerDistrictModelRef={registerDistrictModelRef}
            sites={grouped.get(id) ?? []}
            showFullSites={zoomDetail}
            showNameLabels={isSelected || isHovered}
            showFestivals={!selectedDistrict && !hoveredDistrict}
            onLandmarkClick={onLandmarkClick}
            selectedLandmarkId={selectedLandmarkId}
            pinPlaces={pinPlaces}
          />
        );
      })}
      {leftovers.length > 0 ? (
        <LandmarkBuildLayer
          sites={leftovers}
          showFullSites={zoomDetail}
          showNameLabels={zoomDetail}
          onLandmarkClick={onLandmarkClick}
          selectedLandmarkId={selectedLandmarkId}
          pinPlaces={pinPlaces}
        />
      ) : null}
    </>
  );
}

function DistrictMesh({
  id,
  geometry,
  scenery,
  center,
  label,
  legalDistrictCode,
  interactionScale,
  liftZ,
  isSelected,
  isHovered,
  districtDetails,
  selectedDistrict,
  onDistrictClick,
  onDistrictHover,
  registerDistrictRef,
  registerDistrictModelRef,
  sites = [],
  showFullSites = false,
  showNameLabels = false,
  showFestivals = true,
  onLandmarkClick,
  selectedLandmarkId = null,
  pinPlaces = [],
}) {
  const landMeshRef = useRef(null);
  const material = useMemo(() => createDistrictMaterial(id), [id]);

  const cleanGeometry = useMemo(() => {
    const geo = geometry.clone();
    if (geo.getAttribute('color')) {
      geo.deleteAttribute('color');
    }
    return geo;
  }, [geometry]);

  const showHoverTooltip = isHovered && !selectedDistrict;

  return (
    <group
      name={`district-${id}`}
      ref={(node) => {
        registerDistrictRef(id, node);
      }}
      position={[center[0], center[1], center[2]]}
      userData={{
        districtId: id,
        legalDistrictCode,
        label: label ?? districtLabels[id],
      }}
    >
      <group
        ref={(node) => {
          registerDistrictModelRef(id, node);
        }}
        position={[0, 0, liftZ]}
        scale={interactionScale}
      >
        <mesh
          ref={landMeshRef}
          geometry={cleanGeometry}
          material={material}
          position={[-center[0], -center[1], -center[2]]}
          scale={[1, 1, IC_MAP_HEIGHT_BOOST]}
          castShadow={false}
          receiveShadow={false}
          renderOrder={0}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
          onClick={(e) => {
            e.stopPropagation();
            onDistrictClick?.(id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
            onDistrictHover?.(id);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = '';
            onDistrictHover?.(null);
          }}
        />
      </group>

      {scenery ? (
        <group position={[0, 0, liftZ]} scale={interactionScale}>
          <primitive
            object={scenery}
            position={[-center[0], -center[1], -center[2]]}
            dispose={null}
          />
        </group>
      ) : null}

      {sites.length > 0 ? (
        <group position={[0, 0, liftZ]} scale={interactionScale}>
          <LandmarkBuildLayer
            sites={sites}
            districtCenter={center}
            showFullSites={showFullSites}
            showNameLabels={showNameLabels}
            onLandmarkClick={onLandmarkClick}
            selectedLandmarkId={selectedLandmarkId}
            pinPlaces={pinPlaces}
          />
        </group>
      ) : null}

      {!showHoverTooltip ? (
        <DistrictName3D
          id={id}
          isSelected={isSelected}
          isHovered={isHovered}
          festivalCount={districtDetails?.[id]?.festivals?.length ?? 0}
          showFestivals={showFestivals}
          chipPosition={LABEL_CHIP_POS}
          labelPosition={LABEL_TEXT_POS}
        />
      ) : null}

      {showHoverTooltip ? (
        <DistrictHoverTooltip
          districtId={id}
          districtDetails={districtDetails}
          meshRef={landMeshRef}
          position={TOOLTIP_POS}
        />
      ) : null}
    </group>
  );
}
