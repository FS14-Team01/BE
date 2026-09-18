const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// API 응답용 KST 형식으로 변환
function formatToKst(date) {
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  const dateString = kstDate.toISOString().slice(0, 19);

  return `${dateString}+09:00`;
}

// KST 기준 날짜/시간 계산용 Date 반환
// 랜덤포인트 시간대 판정, 포토카드 생성 횟수 제한 계산에 사용
function getKstNow() {
  const now = new Date();

  return new Date(now.getTime() + KST_OFFSET_MS);
}

export { formatToKst, getKstNow };
