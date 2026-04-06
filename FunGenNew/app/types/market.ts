export interface MarketData {
  index: string;
  spot_price: number;
  final_decision: MarketDecision;
  key_indicators: KeyIndicators;
  zones?: OptionZones;
  timestamp: string;
}

export interface MarketDecision {
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: string;
}

export interface KeyIndicators {
  pcr_oi: number;
  atm_pcr: number;
}

export interface OptionZones {
  support: OptionZone[];
  resistance: OptionZone[];
}

export interface OptionZone {
  strike: number;
  put_oi: number;
  put_oi_change: number;
  call_oi: number;
  call_oi_change: number;
}

export type IndexType = 'NIFTY' | 'BANKNIFTY';
export type ViewModeType = 'overview' | 'zones';
