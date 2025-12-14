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
  'https://drive.google.com/uc?export=download&id=1Je1mwoLqxhULWpuNknkyz6X-gg9IloVt';

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
      put_oi: number;
      put_oi_change: number;
      call_oi: number;
      call_oi_change: number;
    }[];
    resistance: {
      strike: number;
      call_oi: number;
      call_oi_change: number;
      put_oi: number;
      put_oi_change: number;
    }[];
  };

  final_decision: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: 'LOW' | 'MODERATE' | 'HIGH';
  };

  disclaimer: string;
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
    } catch (e) {
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
     DERIVED DISPLAY VALUES
     ====================== */
  const isBullish = data.final_decision.bias === 'BULLISH';

  const nearestSupport =
    data.zones.support.length > 0
      ? data.zones.support[0].strike
      : '-';

  const nearestResistance =
    data.zones.resistance.length > 0
      ? data.zones.resistance[0].strike
      : '-';

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
          Market is {data.final_decision.bias} ({data.final_decision.confidence})
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

      {/* SUPPORT / RESISTANCE */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.label}>Support</Text>
          <Text style={styles.value}>{nearestSupport}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Resistance</Text>
          <Text style={styles.value}>{nearestResistance}</Text>
        </View>
      </View>

      {/* SUMMARY (DERIVED, SAFE) */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          Spot {data.spot_price} · Net OI {data.key_indicators.net_oi_change}
        </Text>
      </View>

      {/* FOOTER */}
      <Text style={styles.timestamp}>
        Last updated: {data.timestamp}
      </Text>

      <Text style={styles.disclaimer}>
        {data.disclaimer}
      </Text>
    </ScrollView>
  );
}
