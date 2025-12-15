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
import AsyncStorage from '@react-native-async-storage/async-storage';

const MARKET_URLS = {
  NIFTY: 'https://drive.google.com/uc?export=download&id=1t9fYO6ry9igdt3DZqlBqakMArBA4CdUK',
  BANKNIFTY: 'https://drive.google.com/file/d/1Yj0AtywQaR-RW0ofrOpw7p8Yi1S66WVa',
};

export default function MarketScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState('NIFTY');
  const [viewMode, setViewMode] = useState('overview');

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
    } catch (err) {
      console.error('Fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(num);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingEmoji}>📊</Text>
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 12 }} />
        <Text style={styles.loadingText}>Loading market data...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>📉</Text>
        <Text style={styles.errorText}>Connection Lost</Text>
        <Text style={styles.errorSubtext}>Unable to fetch market data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMarketData}>
          <Text style={styles.retryButtonText}>🔄 Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const biasColor = data.final_decision.bias === 'BULLISH' ? '#10B981' : 
                    data.final_decision.bias === 'BEARISH' ? '#EF4444' : '#6B7280';
  const biasEmoji = data.final_decision.bias === 'BULLISH' ? '🐂' : 
                    data.final_decision.bias === 'BEARISH' ? '🐻' : '⚖️';

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
        {/* Header */}
        <View style={[styles.header, { backgroundColor: '#0F172A' }]}>
          <Text style={styles.headerTitle}>📊 Market Pulse</Text>
          <Text style={styles.headerSubtitle}>Live Options Analysis</Text>
        </View>

        {/* Index Selector */}
        <View style={styles.selectorContainer}>
          <TouchableOpacity
            style={[styles.selectorButton, selectedIndex === 'NIFTY' && styles.selectorActive]}
            onPress={() => setSelectedIndex('NIFTY')}
          >
            <Text style={[styles.selectorText, selectedIndex === 'NIFTY' && styles.selectorTextActive]}>
              NIFTY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectorButton, selectedIndex === 'BANKNIFTY' && styles.selectorActive]}
            onPress={() => setSelectedIndex('BANKNIFTY')}
          >
            <Text style={[styles.selectorText, selectedIndex === 'BANKNIFTY' && styles.selectorTextActive]}>
              BANKNIFTY
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'overview' && styles.viewModeActive]}
            onPress={() => setViewMode('overview')}
          >
            <Text style={[styles.viewModeText, viewMode === 'overview' && styles.viewModeTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'detailed' && styles.viewModeActive]}
            onPress={() => setViewMode('detailed')}
          >
            <Text style={[styles.viewModeText, viewMode === 'detailed' && styles.viewModeTextActive]}>
              Detailed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'zones' && styles.viewModeActive]}
            onPress={() => setViewMode('zones')}
          >
            <Text style={[styles.viewModeText, viewMode === 'zones' && styles.viewModeTextActive]}>
              Zones
            </Text>
          </TouchableOpacity>
        </View>

        {/* Price Card */}
        <View style={styles.card}>
          <Text style={styles.indexLabel}>{data.index}</Text>
          <Text style={styles.spotPrice}>₹{formatPrice(data.spot_price)}</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Bias Card */}
        <View style={[styles.biasCard, { borderColor: biasColor, backgroundColor: biasColor + '10' }]}>
          <View style={styles.biasRow}>
            <Text style={styles.biasEmoji}>{biasEmoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.biasTitle, { color: biasColor }]}>
                {data.final_decision.bias}
              </Text>
              <Text style={styles.confidenceText}>
                {data.final_decision.confidence} CONFIDENCE
              </Text>
            </View>
          </View>
        </View>

        {/* Key Indicators */}
        {viewMode === 'overview' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Key Indicators</Text>
            
            <View style={styles.indicatorRow}>
              <View style={styles.indicatorCard}>
                <Text style={styles.indicatorLabel}>PCR</Text>
                <Text style={styles.indicatorValue}>
                  {data.key_indicators.pcr_oi.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.indicatorCard}>
                <Text style={styles.indicatorLabel}>ATM PCR</Text>
                <Text style={styles.indicatorValue}>
                  {data.key_indicators.atm_pcr.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.indicatorRow}>
              <View style={styles.indicatorCard}>
                <Text style={styles.indicatorLabel}>Call OI Δ</Text>
                <Text style={[styles.indicatorValue, { 
                  color: data.key_indicators.call_oi_change > 0 ? '#10B981' : '#EF4444' 
                }]}>
                  {formatNumber(data.key_indicators.call_oi_change)}
                </Text>
              </View>
              
              <View style={styles.indicatorCard}>
                <Text style={styles.indicatorLabel}>Put OI Δ</Text>
                <Text style={[styles.indicatorValue, { 
                  color: data.key_indicators.put_oi_change > 0 ? '#10B981' : '#EF4444' 
                }]}>
                  {formatNumber(data.key_indicators.put_oi_change)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Signals */}
        {viewMode === 'overview' && data.market_outlook.signals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Market Signals</Text>
            {data.market_outlook.signals.map((signal, index) => (
              <View key={index} style={styles.signalItem}>
                <Text style={styles.signalDot}>•</Text>
                <Text style={styles.signalText}>{signal}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Zones */}
        {viewMode === 'zones' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🛡️ Support Zones</Text>
              {data.zones.support.map((zone, index) => (
                <View key={index} style={styles.zoneCard}>
                  <Text style={styles.strikePrice}>₹{zone.strike.toLocaleString('en-IN')}</Text>
                  <Text style={styles.oiText}>Put OI: {formatNumber(zone.put_oi)}</Text>
                  <Text style={[styles.oiChangeText, { 
                    color: zone.put_oi_change > 0 ? '#10B981' : '#EF4444' 
                  }]}>
                    Change: {formatNumber(zone.put_oi_change)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚔️ Resistance Zones</Text>
              {data.zones.resistance.map((zone, index) => (
                <View key={index} style={styles.zoneCard}>
                  <Text style={styles.strikePrice}>₹{zone.strike.toLocaleString('en-IN')}</Text>
                  <Text style={styles.oiText}>Call OI: {formatNumber(zone.call_oi)}</Text>
                  <Text style={[styles.oiChangeText, { 
                    color: zone.call_oi_change > 0 ? '#10B981' : '#EF4444' 
                  }]}>
                    Change: {formatNumber(zone.call_oi_change)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.timestamp}>🕐 {data.timestamp}</Text>
          <Text style={styles.disclaimer}>
            ⚠️ {data.disclaimer || 'Educational purpose only'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectorContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectorActive: {
    backgroundColor: '#FFFFFF',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  selectorTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  viewModeToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  viewModeActive: {
    backgroundColor: '#FFFFFF',
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  viewModeTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  indexLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 8,
  },
  spotPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  biasCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  biasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  biasEmoji: {
    fontSize: 32,
  },
  biasTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  indicatorCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  indicatorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  indicatorValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  signalItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  signalDot: {
    fontSize: 16,
    color: '#6366F1',
    marginRight: 8,
  },
  signalText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  strikePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  oiText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  oiChangeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  timestamp: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
});
