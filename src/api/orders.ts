import { api } from './client';
import type { CreateOrderRequest, Order, PayOrderResponse } from './types';

export async function createOrder(body: CreateOrderRequest, idempotencyKey: string) {
  const { data } = await api.post<Order>('/orders', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return data;
}

export async function fetchOrder(id: string) {
  const { data } = await api.get<Order>(`/orders/${id}`);
  return data;
}

export async function fetchOrders() {
  const { data } = await api.get<Order[]>('/orders');
  return data;
}

export async function payOrder(id: string, email: string) {
  const { data } = await api.post<PayOrderResponse>(`/orders/${id}/pay`, { email });
  return data;
}
