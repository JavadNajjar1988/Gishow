import {api} from '../auth/api';
export interface Reservation {id:string;run_turn_id:number;seat_ids:number[];expires_at:string;status:string}
export interface Order {id:string;reservation_id:string;status:string;amount_irr:number;expires_at:string;ref_id:string|null;gateway_mode:string|null;tickets:{id:string;seat_id:number}[];items:{seat_id:number;amount_irr:number;row:number;number:number;part_name:string;event_title:string}[]}
export const salesApi={
  paymentStatus:()=>api<{configured:boolean;mode:string|null}>('/sales/payment-status'),
  reservations:()=>api<Reservation[]>('/sales/reservations'),
  reserve:(run_turn_id:number,seat_ids:number[])=>api<Reservation>('/sales/reservations','POST',{run_turn_id,seat_ids}),
  cancel:(id:string)=>api(`/sales/reservations/${id}`,'DELETE'),
  createOrder:(reservation_id:string)=>api<Order>('/sales/orders','POST',{reservation_id}),
  orders:()=>api<Order[]>('/sales/orders'),
  order:(id:string)=>api<Order>(`/sales/orders/${id}`),
  payment:(id:string)=>api<{payment_url:string}>(`/sales/orders/${id}/payment`,'POST'),
};
