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

let PushNotification: any = null;
try {
  PushNotification = require('react-native-push-notification');
} catch {
  // Safe for release if lib is missing
}

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

/* ===================== TYPES ===================== */

type Zone = {
  strike: number;
  call_oi: number;
  call_oi_change: number;
  call_oi_change_pct: number;
  put_oi: number;
  put_oi_change: number;
  put_oi_change_pct: number;
  interpretation: string;
  interpretation_code: string;
};

type MarketData = {
  spot_price: number;
  market_outlook: {
    direction?: string;
    direction_symbol?: string;
    confidence?: string;
    signals?: string[];
  };
  zones: {
    support: Zone[];
    resistance: Zone[];
  };
  parallel_oi_analysis?: {
    support_zone?: { summary?: string };
    resistance_zone?: { summary?: string };
  };
};

/* ===================== CONFIG ===================== */

const API_URL = 'https://your-api-url/nifty_market.json';
const REFRESH_INTERVAL = 60_000;

/* ===================== HELPERS ===================== */

const formatNumber = (n = 0) => {
  if (Math.abs(n) >= 100000) return (n / 100000).toFixed(2) + 'L';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(0);
};

const getStorageLabel = (z: Zone, isSupport: boolean) => {
  const c = z.interpretation_code;
  if (isSupport) {
    if (c === 'STRONG_BUY') return '🟢🟢 STRONG SUPPORT';
    if (c === 'HEAVY_SUPPORT') return '🟢 SUPPORT';
  } else {
    if (c === 'STRONG_SELL') return '🔴🔴 STRONG RESISTANCE';
    if (c === 'HEAVY_RESISTANCE') return '🔴 RESISTANCE';
  }
  return '🟡 RANGE';
};

/* ===================== SCREEN ===================== */

export default function MarketScreen() {
  const [data, setData] = useState<MarketData | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetching = useRef(false);

  /* ---------- Notifications (SAFE) ---------- */
  useEffect(() => {
    if (!PushNotification) return;
    PushNotification.createChannel({
      channelId: 'market-alerts',
      channelName: 'Market Alerts',
      importance: 4,
    });
  }, []);

  /* ---------- Fetch ---------- */
  const fetchData = async () => {
    if (fetching.current) return;
    fetching.current = true;

    try {
      const res = await fetch(API_URL, { cache: 'no-store' });
      const json = await res.json();

      if (!json?.zones?.support || !json?.zones?.resistance) {
        console.warn('Invalid market JSON');
        return;
      }

      setData(json);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Market fetch failed', e);
    } finally {
      fetching.current = false;
    }
  };

  /* ---------- Auto Refresh ---------- */
  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const toggle = (strike: number) => {
    LayoutAnimation.easeInEaseOut();
    setExpanded(p => ({ ...p, [strike]: !p[strike] }));
  };

  /* ---------- Loading ---------- */
  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading market data…</Text>
      </View>
    );
  }

  const outlook = data.market_outlook || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.symbol}>NIFTY</Text>
        <Text style={styles.price}>₹{data.spot_price.toFixed(2)}</Text>
        <Text style={styles.outlook}>
          {outlook.direction_symbol ?? outlook.direction ?? '—'} ·{' '}
          {outlook.confidence ?? '—'}
        </Text>
        <Text style={styles.timestamp}>Updated: {lastUpdate}</Text>
      </View>

      {/* SUPPORT */}
      <Text style={styles.sectionTitle}>🟢 Support Zones</Text>
      <Text style={styles.zoneSummary}>
        {data.parallel_oi_analysis?.support_zone?.summary ?? ''}
      </Text>

      {data.zones.support.map(z => (
        <TouchableOpacity
          key={z.strike}
          style={styles.card}
          onPress={() => toggle(z.strike)}
        >
          <Text style={styles.strike}>{z.strike}</Text>
          <Text style={styles.label}>{getStorageLabel(z, true)}</Text>

          {expanded[z.strike] && (
            <View style={styles.details}>
              <Text>Put OI: {formatNumber(z.put_oi)} ({z.put_oi_change_pct}%)</Text>
              <Text>Call OI: {formatNumber(z.call_oi)} ({z.call_oi_change_pct}%)</Text>
              <Text style={styles.note}>{z.interpretation}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* RESISTANCE */}
      <Text style={styles.sectionTitle}>🔴 Resistance Zones</Text>
      <Text style={styles.zoneSummary}>
        {data.parallel_oi_analysis?.resistance_zone?.summary ?? ''}
      </Text>

      {data.zones.resistance.map(z => (
        <TouchableOpacity
          key={z.strike}
          style={styles.card}
          onPress={() => toggle(z.strike)}
        >
          <Text style={styles.strike}>{z.strike}</Text>
          <Text style={styles.label}>{getStorageLabel(z, false)}</Text>

          {expanded[z.strike] && (
            <View style={styles.details}>
              <Text>Call OI: {formatNumber(z.call_oi)} ({z.call_oi_change_pct}%)</Text>
              <Text>Put OI: {formatNumber(z.put_oi)} ({z.put_oi_change_pct}%)</Text>
              <Text style={styles.note}>{z.interpretation}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <Text style={styles.footer}>
        ℹ️ Informational view only. Not trading advice.
      </Text>
    </ScrollView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  loading: { color: '#94a3b8', textAlign: 'center', marginTop: 100 },
  header: { marginBottom: 20 },
  symbol: { fontSize: 22, fontWeight: '700', color: '#fff' },
  price: { fontSize: 34, fontWeight: '800', color: '#22c55e' },
  outlook: { color: '#94a3b8', marginTop: 4 },
  timestamp: { fontSize: 12, color: '#64748b', marginTop: 4 },
  sectionTitle: { marginTop: 20, fontSize: 20, fontWeight: '700', color: '#e5e7eb' },
  zoneSummary: { color: '#94a3b8', marginVertical: 6, textAlign: 'center' },
  card: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  strike: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  label: { marginTop: 4, color: '#a5f3fc' },
  details: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8 },
  note: { marginTop: 6, fontSize: 12, color: '#cbd5e1', textAlign: 'center' },
  footer: { marginTop: 24, fontSize: 12, color: '#64748b', textAlign: 'center' },
});
