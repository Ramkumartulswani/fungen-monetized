import { MarketData } from './market';

function isValidMarketData(data: unknown): data is MarketData {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.index !== 'string') return false;
  if (typeof obj.spot_price !== 'number') return false;
  if (!obj.final_decision || typeof obj.final_decision !== 'object') return false;

  const decision = obj.final_decision as Record<string, unknown>;
  if (!['BULLISH', 'BEARISH', 'NEUTRAL'].includes(decision.bias as string)) return false;
  if (typeof decision.confidence !== 'string') return false;

  if (!obj.key_indicators || typeof obj.key_indicators !== 'object') return false;

  const indicators = obj.key_indicators as Record<string, unknown>;
  if (typeof indicators.pcr_oi !== 'number') return false;
  if (typeof indicators.atm_pcr !== 'number') return false;

  if (obj.zones) {
    if (typeof obj.zones !== 'object') return false;

    const zones = obj.zones as Record<string, unknown>;
    if (zones.support && !Array.isArray(zones.support)) return false;
    if (zones.resistance && !Array.isArray(zones.resistance)) return false;
  }

  if (typeof obj.timestamp !== 'string') return false;

  return true;
}

export { isValidMarketData };
