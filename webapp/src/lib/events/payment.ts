import { EventEmitter } from 'events'

export const paymentEvents = new EventEmitter()

export const PAYMENT_EVENTS = {
  PAYMENT_SUCCESS: 'payment_success'
} as const 