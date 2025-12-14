import React, { useEffect, useState, useRef } from 'react';
import styles from './MarketScreen.styles';

import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Animated,
} from 'react-native';

/* ======================
   DRIVE JSON URLS
   ====================== */
const MARKET_URLS = {
  NIFTY:
    'https://drive.google.com/uc?export=download&id=1t9fYO6ry9igdt3DZqlBqakMArBA4CdUK',
  BANKNIFTY:
    'https://drive.google.com/uc?export=download&id=YOUR_BANKNIFTY_FILE_ID',
};

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
  const [selectedIndex, setSelectedIndex] =
    useState<'NIFTY' | 'BANKNIFTY'>('NIFTY');

  /* ======================
     BIAS CHANGE ANIMATION
     ====================== */
  const prevBiasRef = useRef<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const fetchMarketData = async () => {
    try {
      setError(false);
      const url = MARKET_URLS[selectedIndex] + '&t=' + Date.now();
      const res = await fetch(url);
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
    setLoading(true);
    fetchMarketData();
  }, [selectedIndex]);

  useEffect(() => {
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedIndex]);

  /* ======================
     PULSE ON BIAS CHANGE
     ====================== */
  useEffect(() => {
    if (!data) return;

    const currentBias = data.final_decision.bias;

    if (prevBiasRef.current && prevBiasRef.current !== currentBias) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }

    prevBiasRef.current = currentBias;
  }, [data?.final_decision.bias]);

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
    data.key_indicators.net_oi_change > 0
      ? '⬆️'
      : data.key_indicators.net_oi_change < 0
      ? '⬇️'
      : '➡️';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchMarketData} />
      }
    >
      {/* INDEX TOGGLE */}
      <View style={styles.toggleRow}>
        {(['NIFTY', 'BANKNIFTY'] as const).map(idx => (
          <Text
            key={idx}
            style={[
              styles.toggleButton,
              selectedIndex === idx && styles.toggleActive,
            ]}
            onPress={() => setSelectedIndex(idx)}
          >
            {idx}
          </Text>
        ))}
      </View>

      {/* MARKET MOOD */}
      <Animated.View
        style={[
          styles.moodCard,
          {
            backgroundColor: isBullish ? '#E8F5E9' : '#FDECEA',
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={styles.moodEmoji}>
          {isBullish ? '📈' : '📉'}
        </Text>
        <Text style={styles.moodText}>
          {data.final_decision.bias} ({data.final_decision.confidence})
        </Text>
      </Animated.View>

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

      {/* SUPPORT LEVELS */}
      <Text style={styles.sectionTitle}>Support Levels</Text>
      {data.zones.support.map((s, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.tableCell}>Strike {s.strike}</Text>
          <Text style={styles.tableCell}>Put ΔOI {s.put_oi_change}</Text>
        </View>
      ))}

      {/* RESISTANCE LEVELS */}
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
