/**
 * feedback.js — 안내·오류·확인 메시지 전용 4개 언어 사전
 * - rows: 영어 식별자를 키로 [ko, en, ja, zh-CN] 문구를 나열(지도 조작 안내, 로딩·실패 메시지, 즐겨찾기·일정 저장 안내 등)
 * - 내보낼 때 `feedback.<키>` 형태로 언어별 사전으로 펼쳐 i18n 리소스에 병합
 * - {{count}} 같은 i18next 보간 변수를 포함하는 문구가 있음
 */
const rows = {
  mapActivate: ['지도를 클릭하면 휠로 확대·축소할 수 있습니다', 'Click the map to enable scroll zoom', '地図をクリックするとスクロールで拡大・縮小できます', '点击地图后可滚轮缩放'],
  mapActive: ['지도 조작 중 · 밖으로 이동하거나 Esc로 해제', 'Map active · leave the map or press Esc to exit', '地図操作中 · 地図の外へ移動、またはEscで解除', '地图操作中 · 移出地图或按Esc退出'],
  retry: ['다시 시도','Retry','再試行','重试'],
  detailError: ['상세 정보를 불러오지 못했습니다.','Could not load place details.','詳細を読み込めませんでした。','无法加载地点详情。'],
  loading: ['불러오는 중…','Loading…','読み込み中…','加载中…'],
  accountFavorites: ['즐겨찾기는 로그인한 계정에 저장됩니다.','Favorites are saved to your account.','お気に入りはアカウントに保存されます。','收藏将保存到您的账号。'],
  guestFavorites: ['이 기기에 저장하며, 로그인하면 계정으로 옮깁니다.','Saved on this device and merged into your account when you sign in.','この端末に保存し、ログイン時にアカウントへ移します。','保存在此设备，登录后合并到账号。'],
  pendingFavorites: ['이 기기의 {{count}}개 장소가 아직 이관되지 않았습니다. 원본은 보존됩니다.','{{count}} places have not been transferred. The device copies are kept.','{{count}}件は未移行です。端末のデータは保持されています。','还有{{count}}个地点未迁移，设备上的原数据已保留。'],
  editDates: ['여행 기간 변경','Change travel dates','旅行期間を変更','修改旅行日期'],
  dateChangeHint: ['기존 일정은 출발일에 맞춰 이동하고 귀가 일정은 마지막 날로 옮깁니다. 추가한 날짜는 직접 채워 주세요. 예약·운영시간과 비용을 다시 확인한 뒤 확정 저장하세요.','Activities shift with the start date; the return moves to the last day. Fill any added days, then review reservations, opening hours and costs before confirming.','出発日に合わせて予定を移動し、帰路は最終日に移します。追加日は予定を入れ、予約・営業時間・費用を確認して確定してください。','行程随出发日期平移，返程移至最后一天。请补充新增日期，并核对预约、营业时间和费用后确认。'],
  saveFirst: ['편집 중인 내용을 먼저 저장해 주세요.','Save your current edits first.','編集中の内容を先に保存してください。','请先保存当前修改。'],
  dateRange: ['여행 기간은 1~7일로 입력해 주세요.','Choose a trip lasting 1–7 days.','旅行期間は1〜7日で入力してください。','旅行时长请选择1至7天。'],
  startDate: ['출발일','Start date','出発日','出发日期'],
  endDate: ['종료일','End date','終了日','结束日期'],
  removeOutside: ['줄어든 기간 밖의 일정과 연결된 비용·준비사항 삭제에 동의합니다. 고정 일정은 보호됩니다.','Remove activities outside the shorter trip and their linked costs and tasks. Locked activities are protected.','短縮した期間外の予定と関連費用・準備事項を削除します。固定予定は保護されます。','同意删除缩短后日期范围外的行程及关联费用和准备事项。锁定行程受保护。'],
  saving: ['저장 중…','Saving…','保存中…','保存中…'],
  applyDates: ['기간 변경 후 초안 저장','Apply dates and save draft','期間を変更して下書き保存','修改日期并保存草稿'],
  addFavoritePlace: ['즐겨찾기에서 장소 추가','Add a saved place','お気に入りから追加','从收藏添加地点'],
  period: ['여행 기간별 보기','Filter by travel period','旅行期間で絞り込み','按旅行时间筛选'],
  all: ['전체','All','すべて','全部'],
  upcoming: ['예정된 여행','Upcoming','今後の旅行','即将出行'],
  ongoing: ['여행 중','In progress','旅行中','旅行中'],
  past: ['지난 여행','Past trips','過去の旅行','过去的旅行'],
  deletePlanConfirm: ['이 계획과 저장한 모든 버전을 삭제하시겠어요?','Delete this plan and all its saved versions?','この計画とすべての保存版を削除しますか？','确定删除此计划及其所有保存版本吗？'],
  delete: ['삭제','Delete','削除','删除'],
  cancel: ['취소','Cancel','キャンセル','取消'],
  originalContent: ['번역 자료가 없어 원문을 표시합니다.','Translation unavailable; showing the original.','翻訳がないため原文を表示します。','暂无译文，显示原文。'],
  detailMissing: ['선택한 장소를 찾지 못했습니다. 목록에서 다시 선택해 주세요.','This place could not be loaded. Please pick it again from the list.','この場所を読み込めませんでした。一覧から選び直してください。','无法加载该地点。请从列表中重新选择。'],
  favoriteLocalOnly: ['이 장소는 아직 계정에 저장할 수 없습니다.','This place cannot be saved to your account yet.','この場所はまだアカウントに保存できません。','该地点暂时无法保存到账号。'],
};
export default Object.fromEntries(['ko','en','ja','zh-CN'].map((lang,i)=>[lang,Object.fromEntries(Object.entries(rows).map(([key,values])=>['feedback.'+key,values[i]]))]));
