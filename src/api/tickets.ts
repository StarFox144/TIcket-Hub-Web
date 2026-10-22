import { api } from './client';
import type { ScanResult } from './types';

export { parseTicketCode, ticketCode } from './ticketCode';

export async function scanTicket(code: string) {
  const { data } = await api.post<ScanResult>('/tickets/scan', { code });
  return data;
}
