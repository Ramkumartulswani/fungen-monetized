import React, { useEffect, useState } from 'react';
import styles from './MarketScreen.styles';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';

const MARKET_DATA_URL =
  'https://drive.google.com/uc?export=download&id=1Je1mwoLqxhULWpuNknkyz6X-gg9IloVt';

type MarketData = {
  index: string;
  timestamp: string;
  interval: string;
  bias: 'Bullish' | 'Bearish' | string;
  pcr: number;
  support: number;
  resistance: number;
  summary: string;
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

    // Auto refresh every 5 minutes
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

  const isBullish = data.bias === 'Bullish';

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
        <Text style={styles.moodEmoji}>{isBullish ? '📈' : '📉'}</Text>
        <Text style={styles.moodText}>
          Market is {data.bias}
        </Text>
      </View>

      {/* METRICS */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.label}>PCR</Text>
          <Text style={styles.value}>{data.pcr}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.label}>Support</Text>
          <Text style={styles.value}>{data.support}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Resistance</Text>
          <Text style={styles.value}>{data.resistance}</Text>
        </View>
      </View>

      {/* SUMMARY */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>{data.summary}</Text>
      </View>

      {/* FOOTER */}
      <Text style={styles.timestamp}>
        Last updated: {data.timestamp}
      </Text>

      <Text style={styles.disclaimer}>
        ⚠️ Educational only. Not financial advice.
      </Text>
    </ScrollView>
  );
}

