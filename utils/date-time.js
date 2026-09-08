const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export default function formatToKst(date) {
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  const dateString = kstDate.toISOString().slice(0, 19);

  return `${dateString}+09:00`;
}
