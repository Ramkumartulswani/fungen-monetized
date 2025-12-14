import React, { useEffect, useState } from 'react';
import styles from './MarketScreen.styles';

import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';

const MARKET_DATA_URL =
  'https://drive.google.com/uc?export=download&id=1t9fYO6ry9igdt3DZqlBqakMArBA4CdUK';

/* ======================
   DRIVE JSON TYPE
   ====================== */
type MarketData = {
  timestamp: string;
  heartbeat: number;
  index: string;
  spot_price: number;

  key_indicators: {
    pcr_oi: number;
    atm_pcr: number;
    call_oi_change: number;
    put_oi_change: number;
    net_oi_change: number;
  };

  market_outlook: {
    direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: 'LOW' | 'MODERATE' | 'HIGH';
    signals: string[];
    bullish_score: number;
    bearish_score: number;
  };

  zones: {
    support: {
      strike: number;
      put_oi_change: number;
      call_oi_change: number;
    }[];
    resistance: {
      strike: number;
      call_oi_change: number;
      put_oi_change: number;
    }[];
  };

  final_decision: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: 'LOW' | 'MODERATE' | 'HIGH';
  };
};

export default function MarketScreen() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchMarketData = async () => {
    try {
      setError(false);
      const res = await fetch(MARKET_DATA_URL);
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading market data…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load market data</Text>
        <Text style={styles.retryText} onPress={fetchMarketData}>
          Tap to retry
        </Text>
      </View>
    );
  }

  /* ======================
     DERIVED UI VALUES
     ====================== */
  const isBullish = data.final_decision.bias === 'BULLISH';

  const trendArrow =
    data.key_indicators.net_oi_change > 0 ? '⬆️' :
    data.key_indicators.net_oi_change < 0 ? '⬇️' : '➡️';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchMarketData} />
      }
    >
      {/* MARKET MOOD */}
      <View
        style={[
          styles.moodCard,
          { backgroundColor: isBullish ? '#E8F5E9' : '#FDECEA' },
        ]}
      >
        <Text style={styles.moodEmoji}>
          {isBullish ? '📈' : '📉'}
        </Text>
        <Text style={styles.moodText}>
          {data.final_decision.bias} ({data.final_decision.confidence})
        </Text>
      </View>

      {/* KEY METRICS */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.label}>PCR</Text>
          <Text style={styles.value}>
            {data.key_indicators.pcr_oi.toFixed(2)}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>ATM PCR</Text>
          <Text style={styles.value}>
            {data.key_indicators.atm_pcr.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* TREND */}
      <View style={styles.card}>
        <Text style={styles.label}>Market Trend</Text>
        <Text style={styles.value}>
          {trendArrow} Net OI {data.key_indicators.net_oi_change}
        </Text>
      </View>

      {/* SUPPORT TABLE */}
      <Text style={styles.sectionTitle}>Support Levels</Text>
      {data.zones.support.map((s, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.tableCell}>Strike {s.strike}</Text>
          <Text style={styles.tableCell}>Put ΔOI {s.put_oi_change}</Text>
        </View>
      ))}

      {/* RESISTANCE TABLE */}
      <Text style={styles.sectionTitle}>Resistance Levels</Text>
      {data.zones.resistance.map((r, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.tableCell}>Strike {r.strike}</Text>
          <Text style={styles.tableCell}>Call ΔOI {r.call_oi_change}</Text>
        </View>
      ))}

      {/* SIGNALS */}
      <Text style={styles.sectionTitle}>Market Signals</Text>
      {data.market_outlook.signals.map((signal, i) => (
        <Text key={i} style={styles.signalText}>
          • {signal}
        </Text>
      ))}

      {/* FOOTER */}
      <Text style={styles.timestamp}>
        Last updated: {data.timestamp}
      </Text>

      {/* UI-LEVEL DISCLAIMER */}
      <Text style={styles.disclaimer}>
        ⚠️ Educational purpose only. This is not financial advice.
      </Text>
    </ScrollView>
  );
}
