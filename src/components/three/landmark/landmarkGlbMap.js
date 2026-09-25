/**
 * 맵 GLB 노드 접두사(LM_*) ↔ 퀘스트 LANDMARK_KEY(lm-*).
 * 이름은 비슷해도 키가 다를 수 있어 추측하지 않고 명시 매핑만 쓴다.
 */
export const LM_PREFIX_TO_LANDMARK_KEY = {
  LM_aramaru: 'lm-aramaru',
  LM_art_platform: 'lm-artplatform',
  LM_biological_resources: 'lm-nibr',
  LM_bomunsa: 'lm-bomunsa',
  LM_bugeunri_dolmen: 'lm-goryeo',
  LM_bupyeong_art_center: 'lm-bupyeong-artcenter',
  LM_bupyeong_history_museum: 'lm-bupyeong-history-museum',
  LM_butterfly_park: 'lm-bupyeong-nabi-park',
  LM_central_park: 'lm-songdo-park',
  LM_cheongna_lake_park: 'lm-cheongna',
  LM_chinatown: 'lm-chinatown',
  LM_dumujin: 'lm-dumujin',
  LM_eurwangni: 'lm-eurwangni',
  LM_g_tower: 'lm-gtower',
  LM_gahyeonsan: 'lm-gahyeonsan-geomdan',
  LM_geomdan_prehistory_museum: 'lm-geomdan-prehistory',
  LM_gwangseongbo: 'lm-gwangseongbo',
  LM_gyeyang_fortress_museum: 'lm-gyeyang-fortress-museum',
  LM_gyeyangsan: 'lm-gyeyangsan',
  LM_hanagae: 'lm-hanagae',
  LM_hwadojin: 'lm-hwadojin',
  LM_incheon_dohobu: 'lm-dohobu',
  LM_incheon_grand_park: 'lm-grand-park',
  LM_jeondeungsa: 'lm-jeondeungsa',
  LM_jeongseojin: 'lm-jeongseojin',
  LM_landing_memorial: 'lm-landing-memorial',
  LM_manisan_chamseongdan: 'lm-manisan',
  LM_mokseom: 'lm-mokseom',
  LM_neungnae_park: 'lm-neungnae-park',
  LM_open_port_museum: 'lm-openport-museum',
  LM_seaside_park: 'lm-seaside-park',
  LM_simnipo: 'lm-yeongheung',
  LM_songam_museum: 'lm-songam-museum',
  LM_sorae_fish_market: 'lm-sorae-port',
  LM_sorae_history_museum: 'lm-sorae-history',
  LM_sorae_wetland: 'lm-sorae-wetland',
  LM_subong_park: 'lm-subong',
  LM_tribowl: 'lm-tribowl',
  LM_wolmi_theme_park: 'lm-wolmido',
  LM_yonggungsa: 'lm-yonggungsa',
};

/** 완성형/공사현장 모델을 구·군 호버 그룹에 붙이기 위한 명시 매핑 */
export const LANDMARK_KEY_TO_DISTRICT = {
  'lm-aramaru': 'seohae',
  'lm-artplatform': 'jemulpo',
  'lm-nibr': 'seohae',
  'lm-bomunsa': 'ganghwa',
  'lm-goryeo': 'ganghwa',
  'lm-bupyeong-artcenter': 'bupyeong',
  'lm-bupyeong-history-museum': 'bupyeong',
  'lm-bupyeong-nabi-park': 'bupyeong',
  'lm-songdo-park': 'yeonsu',
  'lm-cheongna': 'seohae',
  'lm-chinatown': 'jemulpo',
  'lm-dumujin': 'ongjin',
  'lm-eurwangni': 'yeongjong',
  'lm-gtower': 'yeonsu',
  'lm-gahyeonsan-geomdan': 'geomdan',
  'lm-geomdan-prehistory': 'geomdan',
  'lm-gwangseongbo': 'ganghwa',
  'lm-gyeyang-fortress-museum': 'gyeyang',
  'lm-gyeyangsan': 'gyeyang',
  'lm-hanagae': 'yeongjong',
  'lm-hwadojin': 'jemulpo',
  'lm-dohobu': 'michuhol',
  'lm-grand-park': 'namdong',
  'lm-jeondeungsa': 'ganghwa',
  'lm-jeongseojin': 'seohae',
  'lm-landing-memorial': 'yeonsu',
  'lm-manisan': 'ganghwa',
  'lm-mokseom': 'ongjin',
  'lm-neungnae-park': 'gyeyang',
  'lm-openport-museum': 'jemulpo',
  'lm-seaside-park': 'yeonsu',
  'lm-yeongheung': 'ongjin',
  'lm-songam-museum': 'michuhol',
  'lm-sorae-port': 'namdong',
  'lm-sorae-history': 'namdong',
  'lm-sorae-wetland': 'namdong',
  'lm-subong': 'michuhol',
  'lm-tribowl': 'yeonsu',
  'lm-wolmido': 'jemulpo',
  'lm-yonggungsa': 'jemulpo',
};

/** 맵 라벨용 짧은 명소명. 행정 키와 별도로 둔다. */
export const LANDMARK_KEY_TO_LABEL = {
  'lm-aramaru': '아라마루',
  'lm-artplatform': '아트플랫폼',
  'lm-nibr': '생물자원관',
  'lm-bomunsa': '보문사',
  'lm-goryeo': '부근리 고인돌',
  'lm-bupyeong-artcenter': '부평아트센터',
  'lm-bupyeong-history-museum': '부평역사박물관',
  'lm-bupyeong-nabi-park': '부평나비공원',
  'lm-songdo-park': '센트럴파크',
  'lm-cheongna': '청라호수공원',
  'lm-chinatown': '차이나타운',
  'lm-dumujin': '두무진',
  'lm-eurwangni': '을왕리해수욕장',
  'lm-gtower': 'G타워',
  'lm-gahyeonsan-geomdan': '가현산',
  'lm-geomdan-prehistory': '검단선사박물관',
  'lm-gwangseongbo': '광성보',
  'lm-gyeyang-fortress-museum': '계양산성박물관',
  'lm-gyeyangsan': '계양산',
  'lm-hanagae': '하나개해수욕장',
  'lm-hwadojin': '화도진공원',
  'lm-dohobu': '인천도호부관아',
  'lm-grand-park': '인천대공원',
  'lm-jeondeungsa': '전등사',
  'lm-jeongseojin': '정서진',
  'lm-landing-memorial': '상륙기념관',
  'lm-manisan': '마니산 참성단',
  'lm-mokseom': '목섬',
  'lm-neungnae-park': '능내공원',
  'lm-openport-museum': '개항박물관',
  'lm-seaside-park': '씨사이드파크',
  'lm-yeongheung': '십리포해수욕장',
  'lm-songam-museum': '송암미술관',
  'lm-sorae-port': '소래포구',
  'lm-sorae-history': '소래역사관',
  'lm-sorae-wetland': '소래습지',
  'lm-subong': '수봉공원',
  'lm-tribowl': '트라이볼',
  'lm-wolmido': '월미도',
  'lm-yonggungsa': '용궁사',
};

export function landmarkDisplayName(landmarkKey) {
  return LANDMARK_KEY_TO_LABEL[landmarkKey] ?? landmarkKey;
}

/**
 * 맵 로컬 XY 보정. 호버/선택 시 명칭이 서로 가리지 않게 패드에서 살짝 민다.
 * 구 경계로 조금 넘어가도 된다.
 */
export const LANDMARK_LABEL_NUDGE = {
  'lm-wolmido': [-0.32, -0.1],
  'lm-chinatown': [-0.24, 0.08],
  'lm-artplatform': [0.14, -0.28],
  'lm-openport-museum': [0.3, 0.02],
  'lm-hwadojin': [0.18, 0.28],
  'lm-gyeyangsan': [-0.2, 0.12],
  'lm-gyeyang-fortress-museum': [0.22, -0.08],
  'lm-neungnae-park': [-0.06, -0.24],
  'lm-gahyeonsan-geomdan': [-0.1, 0.14],
  'lm-geomdan-prehistory': [0.14, 0.12],
  'lm-sorae-port': [-0.26, -0.06],
  'lm-sorae-history': [0.3, 0.04],
  'lm-sorae-wetland': [-0.16, 0.16],
  'lm-bupyeong-artcenter': [0.04, -0.22],
  'lm-bupyeong-nabi-park': [-0.14, 0.06],
};

export function landmarkLabelNudge(landmarkKey) {
  const nudge = LANDMARK_LABEL_NUDGE[landmarkKey];
  return nudge ?? [0, 0];
}

/** common_construction.glb 바닥 패드 XY (맵 로컬 Z-up과 동일) */
export const CONSTRUCTION_NATIVE_WIDTH = 1.9;

/** 완성형 랜드마크를 맵에서 읽을 수 있게 키우는 배율 (패드 원점 기준) */
export const LANDMARK_DISPLAY_SCALE = 2.45;

/**
 * GLB는 Y-up, 구·군 메시는 XY(Z=두께). 같은 맵 그룹에 놓으려면 Rx(-90).
 * (x, y, z) → (x, z, -y)
 */
export function glbYUpToMapLocal(x, y, z) {
  return [x, z, -y];
}

export function skipRaycast() {}

function pointInTriangle2D(px, py, ax, ay, bx, by, cx, cy) {
  const v0x = cx - ax;
  const v0y = cy - ay;
  const v1x = bx - ax;
  const v1y = by - ay;
  const v2x = px - ax;
  const v2y = py - ay;
  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;
  const denom = dot00 * dot11 - dot01 * dot01;
  if (Math.abs(denom) < 1e-12) return false;
  const u = (dot11 * dot02 - dot01 * dot12) / denom;
  const v = (dot00 * dot12 - dot01 * dot02) / denom;
  return u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6;
}

function geometryContainsXY(geometry, x, y) {
  const pos = geometry?.attributes?.position;
  if (!pos) return false;
  const index = geometry.index;
  const triCount = index ? index.count / 3 : pos.count / 3;
  for (let i = 0; i < triCount; i += 1) {
    const ia = index ? index.getX(i * 3) : i * 3;
    const ib = index ? index.getX(i * 3 + 1) : i * 3 + 1;
    const ic = index ? index.getX(i * 3 + 2) : i * 3 + 2;
    if (
      pointInTriangle2D(
        x,
        y,
        pos.getX(ia),
        pos.getY(ia),
        pos.getX(ib),
        pos.getY(ib),
        pos.getX(ic),
        pos.getY(ic),
      )
    ) {
      return true;
    }
  }
  return false;
}

function minDistSqToGeometryXY(geometry, x, y) {
  const pos = geometry?.attributes?.position;
  if (!pos) return Infinity;
  let best = Infinity;
  for (let i = 0; i < pos.count; i += 1) {
    const dx = pos.getX(i) - x;
    const dy = pos.getY(i) - y;
    const dist = dx * dx + dy * dy;
    if (dist < best) best = dist;
  }
  return best;
}

/**
 * 3D 호버/리프트 소속은 행정 매핑이 아니라 구·군 메시 XY에 붙인다.
 * 퀘스트 구분은 LANDMARK_KEY_TO_DISTRICT 를 그대로 쓴다.
 */
export function pickHostDistrictId(x, y, districts = []) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !districts.length) return null;

  for (const district of districts) {
    if (geometryContainsXY(district.geometry, x, y)) return district.id;
  }

  let bestId = districts[0]?.id ?? null;
  let bestDist = Infinity;
  for (const district of districts) {
    const dist = minDistSqToGeometryXY(district.geometry, x, y);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = district.id;
    }
  }
  return bestId;
}

function isPrimaryBaseName(name, prefix) {
  const slug = prefix.slice(3);
  return name === `${prefix}__${slug}_BASE`;
}

function toMeshEntry(node) {
  return {
    name: node.name,
    geometry: node.geometry,
    material: node.material,
    position: [node.position.x, node.position.y, node.position.z],
    quaternion: [
      node.quaternion.x,
      node.quaternion.y,
      node.quaternion.z,
      node.quaternion.w,
    ],
    scale: [node.scale.x, node.scale.y, node.scale.z],
  };
}

/**
 * useGLTF nodes에서 LM_* 메시를 랜드마크 단위로 묶는다.
 */
export function groupLandmarkNodes(nodes) {
  const groups = new Map();

  for (const [name, node] of Object.entries(nodes)) {
    if (!name.startsWith('LM_') || !node?.isMesh || !node.geometry) continue;
    const prefix = name.split('__')[0];
    let group = groups.get(prefix);
    if (!group) {
      group = {
        prefix,
        landmarkKey: LM_PREFIX_TO_LANDMARK_KEY[prefix] ?? null,
        meshes: [],
        baseNode: null,
      };
      groups.set(prefix, group);
    }
    const entry = toMeshEntry(node);
    group.meshes.push(entry);
    if (isPrimaryBaseName(name, prefix)) {
      group.baseNode = entry;
    }
  }

  const sites = [];
  for (const group of groups.values()) {
    if (!group.landmarkKey) {
      console.warn(`[landmarkGlbMap] LANDMARK_KEY 없는 접두사: ${group.prefix}`);
      continue;
    }
    const base = group.baseNode ?? group.meshes[0];
    const [mx, my, mz] = glbYUpToMapLocal(
      base.position[0],
      base.position[1],
      base.position[2],
    );
    const padWidth = Math.abs(base.scale[0]) || 0.11;
    sites.push({
      prefix: group.prefix,
      landmarkKey: group.landmarkKey,
      districtId: LANDMARK_KEY_TO_DISTRICT[group.landmarkKey] ?? null,
      displayName: landmarkDisplayName(group.landmarkKey),
      meshes: group.meshes,
      mapPosition: [mx, my, mz],
      baseGlbPosition: [base.position[0], base.position[1], base.position[2]],
      landmarkScale: LANDMARK_DISPLAY_SCALE,
      constructionScale: Math.max(
        0.2,
        (padWidth / CONSTRUCTION_NATIVE_WIDTH) * 3.4,
      ),
    });
  }

  return sites;
}

/**
 * 맵에 붙일 구·군. 행정 키 매핑보다 실제 메시 위치를 우선한다.
 */
export function resolveSiteDistrictId(site, districts = []) {
  const [x, y] = site?.mapPosition ?? [];
  const hostId = pickHostDistrictId(x, y, districts);
  if (hostId) return hostId;
  return site?.districtId ?? null;
}

export function groupSitesByDistrict(sites = [], districts = []) {
  const grouped = new Map(districts.map((district) => [district.id, []]));
  const leftovers = [];

  for (const site of sites) {
    const hostDistrictId = resolveSiteDistrictId(site, districts);
    const bucket = grouped.get(hostDistrictId);
    if (bucket) {
      bucket.push({
        ...site,
        questDistrictId: site.districtId,
        districtId: hostDistrictId,
      });
    } else {
      leftovers.push(site);
    }
  }

  return { grouped, leftovers };
}
