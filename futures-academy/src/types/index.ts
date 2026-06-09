export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h'
export type ContractSymbol = 'MNQ' | 'NQ' | 'MES' | 'ES'
export type Underlying = 'NQ100' | 'SP500'
export type OrderSide = 'BUY' | 'SELL'
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT'
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED'
export type CloseReason = 'SL' | 'TP' | 'MANUAL' | 'LIQUIDATION'
export type DataMode = 'SIMULATED' | 'REAL'

export interface OHLCVCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ContractSpec {
  symbol: ContractSymbol
  name: string
  underlying: Underlying
  tickSize: number
  tickValue: number
  pointValue: number
  initialMargin: number
  maintenanceMargin: number
  commissionRoundTrip: number
}

export interface Order {
  id: string
  symbol: ContractSymbol
  side: OrderSide
  type: OrderType
  size: number
  limitPrice?: number
  stopPrice?: number
  slPrice: number
  tpPrice?: number
  status: OrderStatus
  createdAt: number
  filledAt?: number
  fillPrice?: number
  commission: number
}

export interface Position {
  id: string
  orderId: string
  symbol: ContractSymbol
  side: OrderSide
  size: number
  entryPrice: number
  slPrice: number
  tpPrice?: number
  openedAt: number
  commission: number
  floatingPnL: number
}

export interface ClosedTrade {
  id: string
  positionId: string
  symbol: ContractSymbol
  side: OrderSide
  size: number
  entryPrice: number
  exitPrice: number
  slPrice: number
  tpPrice?: number
  openedAt: number
  closedAt: number
  grossPnL: number
  commission: number
  netPnL: number
  closeReason: CloseReason
}

export interface Route {
  path: string
  label: string
  icon: string
}
