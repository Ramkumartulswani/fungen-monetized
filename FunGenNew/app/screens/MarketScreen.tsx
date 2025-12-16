import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const MARKET_URLS: any = {
  NIFTY:
    'https://drive.google.com/uc?export=download&id=1t9fYO6ry9igdt3DZqlBqakMArBA4CdUK',
  BANKNIFTY:
    'https://drive.google.com/uc?export=download&id=1Yj0AtywQaR-RW0ofrOpw7p8Yi1S66WVa',
};

export default function MarketScreen() {
  const navigation = useNavigation();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<'NIFTY' | 'BANKNIFTY'>(
    'NIFTY'
  );
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'zones'>(
    'overview'
  );

  useEffect(() => {
    fetchMarketData();
  }, [selectedIndex]);

  const fetchMarketData = async () => {
    try {
      setError(false);
      const url = MARKET_URLS[selectedIndex] + '&t=' + Date.now();
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(num);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingEmoji}>📊</Text>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading market data…</Text>
      </View>
    );
  }

  /* ---------- ERROR ---------- */
  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>📉</Text>
        <Text style={styles.errorText}>Connection Lost</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMarketData}>
          <Text style={styles.retryButtonText}>🔄 Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bias = data.final_decision.bias;
  const biasColor =
    bias === 'BULLISH' ? '#10B981' : bias === 'BEARISH' ? '#EF4444' : '#6B7280';
  const biasEmoji = bias === 'BULLISH' ? '🐂' : bias === 'BEARISH' ? '🐻' : '⚖️';

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchMarketData();
            }}
            tintColor="#6366F1"
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 Market Pulse</Text>
          <Text style={styles.headerSubtitle}>Live Options Analysis</Text>
        </View>

        {/* MARKET PRO CTA (SAFE) */}
        <TouchableOpacity
          style={styles.proBanner}
          onPress={() => navigation.navigate('MarketPaywall' as never)}
        >
          <Text style={styles.proText}>
            ⭐ Unlock Market Pro – ₹49 / month
          </Text>
        </TouchableOpacity>

        {/* INDEX SELECTOR */}
        <View style={styles.selectorContainer}>
          {['NIFTY', 'BANKNIFTY'].map(idx => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.selectorButton,
                selectedIndex === idx && styles.selectorActive,
              ]}
              onPress={() => setSelectedIndex(idx as any)}
            >
              <Text
                style={[
                  styles.selectorText,
                  selectedIndex === idx && styles.selectorTextActive,
                ]}
              >
                {idx}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* VIEW MODE */}
        <View style={styles.viewModeToggle}>
          {['overview', 'detailed', 'zones'].map(mode => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton,
                viewMode === mode && styles.viewModeActive,
              ]}
              onPress={() => setViewMode(mode as any)}
            >
              <Text
                style={[
                  styles.viewModeText,
                  viewMode === mode && styles.viewModeTextActive,
                ]}
              >
                {mode.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PRICE CARD */}
        <View style={styles.card}>
          <Text style={styles.indexLabel}>{data.index}</Text>
          <Text style={styles.spotPrice}>
            ₹{formatPrice(data.spot_price)}
          </Text>
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* BIAS */}
        <View style={[styles.biasCard, { borderColor: biasColor }]}>
          <Text style={styles.biasEmoji}>{biasEmoji}</Text>
          <Text style={[styles.biasTitle, { color: biasColor }]}>{bias}</Text>
          <Text style={styles.confidenceText}>
            {data.final_decision.confidence} CONFIDENCE
          </Text>
        </View>

        {/* OVERVIEW */}
        {viewMode === 'overview' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Key Indicators</Text>
            <Text>PCR: {data.key_indicators.pcr_oi.toFixed(2)}</Text>
            <Text>ATM PCR: {data.key_indicators.atm_pcr.toFixed(2)}</Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.timestamp}>{data.timestamp}</Text>
          <Text style={styles.disclaimer}>
            ⚠️ Educational purpose only. Not financial advice.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingEmoji: { fontSize: 50 },
  loadingText: { marginTop: 10, color: '#64748B' },
  errorEmoji: { fontSize: 50 },
  errorText: { fontSize: 18, fontWeight: '700' },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 10,
  },
  retryButtonText: { color: '#fff', fontWeight: '700' },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#0F172A',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: { color: '#CBD5E1' },
  proBanner: {
    margin: 16,
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
  },
  proText: { textAlign: 'center', fontWeight: '800', color: '#92400E' },
  selectorContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  selectorButton: { flex: 1, padding: 10, alignItems: 'center' },
  selectorActive: { backgroundColor: '#fff', borderRadius: 8 },
  selectorText: { color: '#64748B' },
  selectorTextActive: { color: '#6366F1', fontWeight: '700' },
  viewModeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  viewModeButton: { flex: 1, padding: 8, alignItems: 'center' },
  viewModeActive: { backgroundColor: '#fff', borderRadius: 8 },
  viewModeText: { fontSize: 12, color: '#64748B' },
  viewModeTextActive: { color: '#6366F1', fontWeight: '700' },
  card: {
    margin: 16,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  indexLabel: { color: '#6366F1', fontWeight: '700' },
  spotPrice: { fontSize: 30, fontWeight: '900' },
  liveText: { color: '#10B981', fontWeight: '700' },
  biasCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  biasEmoji: { fontSize: 32 },
  biasTitle: { fontSize: 22, fontWeight: '900' },
  confidenceText: { color: '#64748B', fontWeight: '700' },
  section: { margin: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  footer: { margin: 16 },
  timestamp: { textAlign: 'center', color: '#64748B' },
  disclaimer: {
    marginTop: 8,
    textAlign: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
  },
});
