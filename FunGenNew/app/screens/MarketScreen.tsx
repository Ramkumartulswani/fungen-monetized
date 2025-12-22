import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

/* ===================== TYPES ===================== */

type Zone = {
  strike: number;
  call_oi: number;
  call_oi_change_pct: number;
  put_oi: number;
  put_oi_change_pct: number;
  interpretation: string;
  interpretation_code: string;
};

type MarketData = {
  spot_price: number;
  market_outlook: {
    direction_symbol: string;
    confidence: string;
  };
  zones: {
    support: Zone[];
    resistance: Zone[];
  };
  parallel_oi_analysis: {
    support_zone: { summary: string };
    resistance_zone: { summary: string };
  };
};

/* ===================== CONFIG ===================== */

const API_URL =
  'https://drive.google.com/file/d/1t9fYO6ry9igdt3DZqlBqakMArBA4CdUK';

const REFRESH_INTERVAL_MS = 60000;

/* ===================== HELPERS ===================== */

const getStorageLabel = (z: Zone, isSupport: boolean) => {
  const c = z.interpretation_code;
  if (isSupport) {
    if (c === 'STRONG_BUY') return '🟢🟢 STRONG SUPPORT';
    if (c === 'HEAVY_SUPPORT') return '🟢 SUPPORT BUILDING';
  } else {
    if (c === 'STRONG_SELL') return '🔴🔴 STRONG RESISTANCE';
    if (c === 'HEAVY_RESISTANCE') return '🔴 RESISTANCE BUILDING';
  }
  return '🟡 RANGE';
};

const format = (n: number) =>
  Math.abs(n) > 1e5 ? (n / 1e5).toFixed(2) + 'L' : n.toFixed(0);

/* ===================== SCREEN ===================== */

export default function MarketScreen() {
  const [data, setData] = useState<MarketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const fetching = useRef(false);

  const fetchData = async () => {
    if (fetching.current) return;
    fetching.current = true;

    try {
      const res = await fetch(API_URL);
      const text = await res.text();

      // 🔴 Detect Google Drive HTML response
      if (text.startsWith('<!DOCTYPE html')) {
        throw new Error('Invalid JSON (Drive HTML received)');
      }

      const json: MarketData = JSON.parse(text);

      if (!json?.zones?.support || !json?.zones?.resistance) {
        throw new Error('Malformed market JSON');
      }

      setData(json);
      setError(null);
    } catch (e: any) {
      console.error('MarketScreen error:', e);
      setError(e.message);
    } finally {
      fetching.current = false;
    }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const toggle = (s: number) => {
    LayoutAnimation.easeInEaseOut();
    setExpanded(p => ({ ...p, [s]: !p[s] }));
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ {error}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading market data…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
      }
    >
      <Text style={styles.title}>NIFTY · ₹{data.spot_price}</Text>
      <Text style={styles.sub}>
        {data.market_outlook.direction_symbol} · {data.market_outlook.confidence}
      </Text>

      <Text style={styles.section}>🟢 Support</Text>
      <Text style={styles.summary}>
        {data.parallel_oi_analysis.support_zone.summary}
      </Text>

      {data.zones.support.map(z => (
        <TouchableOpacity key={z.strike} style={styles.card} onPress={() => toggle(z.strike)}>
          <Text style={styles.strike}>{z.strike}</Text>
          <Text>{getStorageLabel(z, true)}</Text>
          {expanded[z.strike] && (
            <Text style={styles.detail}>
              Put OI: {format(z.put_oi)} ({z.put_oi_change_pct}%)
            </Text>
          )}
        </TouchableOpacity>
      ))}

      <Text style={styles.section}>🔴 Resistance</Text>
      <Text style={styles.summary}>
        {data.parallel_oi_analysis.resistance_zone.summary}
      </Text>

      {data.zones.resistance.map(z => (
        <TouchableOpacity key={z.strike} style={styles.card} onPress={() => toggle(z.strike)}>
          <Text style={styles.strike}>{z.strike}</Text>
          <Text>{getStorageLabel(z, false)}</Text>
          {expanded[z.strike] && (
            <Text style={styles.detail}>
              Call OI: {format(z.call_oi)} ({z.call_oi_change_pct}%)
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loading: { color: '#94a3b8' },
  error: { color: '#f87171', textAlign: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#22c55e' },
  sub: { color: '#94a3b8', marginBottom: 16 },
  section: { marginTop: 20, fontSize: 20, color: '#e5e7eb' },
  summary: { color: '#94a3b8', marginBottom: 8 },
  card: {
    backgroundColor: '#020617',
    padding: 14,
    borderRadius: 12,
    marginVertical: 6,
  },
  strike: { fontSize: 20, color: '#f8fafc' },
  detail: { color: '#cbd5e1', marginTop: 6 },
});
