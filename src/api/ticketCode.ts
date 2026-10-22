/** Код квитка в QR: TH-<ORDER>-<ряд><місце з двох цифр>, напр. TH-A495DE98-314. */
export function ticketCode(orderId: string, row: number, number: number) {
  return `TH-${orderId.toUpperCase()}-${row}${String(number).padStart(2, '0')}`;
}

export function parseTicketCode(code: string) {
  const m = code
    .trim()
    .toUpperCase()
    .match(/^TH-(.+)-(\d{1,2})(\d{2})$/);
  if (!m) return null;
  return { orderId: m[1].toLowerCase(), row: Number(m[2]), number: Number(m[3]) };
}
