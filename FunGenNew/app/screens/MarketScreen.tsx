import React, { useEffect, useState, useRef } from 'react';
import styles from './MarketScreen.styles';

import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
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
    resistance: Array<{
      strike: number;
      call_oi: number;
      call_oi_change: number;
      put_oi: number;
      put_oi_change: number;
    }>;
    support: Array<{
      strike: number;
      put_oi: number;
      put_oi_change: number;
      call_oi: number;
      call_oi_change: number;
    }>;
  };

  zone_totals?: {
    resistance: {
      call_oi_change: number;
      put_oi_change: number;
    };
    support: {
      put_oi_change: number;
      call_oi_change: number;
    };
  };

  final_decision: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: 'LOW' | 'MODERATE' | 'HIGH';
  };

  disclaimer?: string;
};

const { width } = Dimensions.get('window');

export default function MarketScreen() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedIndex, setSelectedIndex] =
    useState<'NIFTY' | 'BANKNIFTY'>('NIFTY');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  /* ======================
     BIAS CHANGE ANIMATION
     ====================== */
  const prevBiasRef = useRef<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const fetchMarketData = async () => {
    try {
      setError(false);
      const url = MARKET_URLS[selectedIndex] + '&t=' + Date.now();
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
      
      // Animate content on load
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    fetchMarketData();
  }, [selectedIndex]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedIndex, autoRefresh]);

  /* ======================
     PULSE ON BIAS CHANGE
     ====================== */
  useEffect(() => {
    if (!data) return;

    const currentBias = data.final_decision.bias;

    if (prevBiasRef.current && prevBiasRef.current !== currentBias) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }

    prevBiasRef.current = currentBias;
  }, [data?.final_decision.bias]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH':
        return '#10B981';
      case 'MODERATE':
        return '#F59E0B';
      case 'LOW':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getBiasColors = (bias: string) => {
    switch (bias) {
      case 'BULLISH':
        return {
          bg: '#ECFDF5',
          border: '#10B981',
          text: '#059669',
          gradient: ['#D1FAE5', '#ECFDF5'],
        };
      case 'BEARISH':
        return {
          bg: '#FEF2F2',
          border: '#EF4444',
          text: '#DC2626',
          gradient: ['#FEE2E2', '#FEF2F2'],
        };
      default:
        return {
          bg: '#F3F4F6',
          border: '#6B7280',
          text: '#4B5563',
          gradient: ['#E5E7EB', '#F3F4F6'],
        };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading market data…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>📉</Text>
        <Text style={styles.errorText}>Failed to load market data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMarketData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ======================
     DERIVED UI VALUES
     ====================== */
  const biasColors = getBiasColors(data.final_decision.bias);
  const isBullish = data.final_decision.bias === 'BULLISH';
  const isBearish = data.final_decision.bias === 'BEARISH';

  const trendArrow =
    data.key_indicators.net_oi_change > 0
      ? '⬆️'
      : data.key_indicators.net_oi_change < 0
      ? '⬇️'
      : '➡️';

  const pcrInterpretation =
    data.key_indicators.pcr_oi > 1.2
      ? 'Bullish'
      : data.key_indicators.pcr_oi < 0.8
      ? 'Bearish'
      : 'Neutral';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={fetchMarketData}
          tintColor="#6366F1"
          colors={['#6366F1']}
        />
      }
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Market Analytics</Text>
            <Text style={styles.headerSubtitle}>Real-time Options Flow</Text>
          </View>
          <TouchableOpacity
            style={styles.autoRefreshButton}
            onPress={() => setAutoRefresh(!autoRefresh)}
          >
            <Text style={styles.autoRefreshText}>
              {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* INDEX TOGGLE */}
        <View style={styles.toggleContainer}>
          {(['NIFTY', 'BANKNIFTY'] as const).map(idx => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.toggleButton,
                selectedIndex === idx && styles.toggleActive,
              ]}
              onPress={() => setSelectedIndex(idx)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  selectedIndex === idx && styles.toggleActiveText,
                ]}
              >
                {idx}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SPOT PRICE CARD */}
        <View style={styles.spotCard}>
          <Text style={styles.spotLabel}>{data.index} Spot</Text>
          <Text style={styles.spotPrice}>₹{formatPrice(data.spot_price)}</Text>
          <View style={styles.spotBadge}>
            <Text style={styles.spotBadgeText}>Live</Text>
          </View>
        </View>

        {/* MARKET BIAS CARD */}
        <Animated.View
          style={[
            styles.biasCard,
            {
              backgroundColor: biasColors.bg,
              borderColor: biasColors.border,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.biasHeader}>
            <Text style={styles.biasEmoji}>
              {isBullish ? '🐂' : isBearish ? '🐻' : '⚖️'}
            </Text>
            <View style={styles.biasTextContainer}>
              <Text style={[styles.biasText, { color: biasColors.text }]}>
                {data.final_decision.bias}
              </Text>
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(data.final_decision.confidence) },
                ]}
              >
                <Text style={styles.confidenceText}>
                  {data.final_decision.confidence} CONFIDENCE
                </Text>
              </View>
            </View>
          </View>

          {/* Score Bars */}
          {(data.market_outlook.bullish_score > 0 ||
            data.market_outlook.bearish_score > 0) && (
            <View style={styles.scoreContainer}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Bull</Text>
                <View style={styles.scoreBarContainer}>
                  <View
                    style={[
                      styles.scoreBar,
                      styles.bullishBar,
                      { width: `${data.market_outlook.bullish_score}%` },
                    ]}
                  />
                </View>
                <Text style={styles.scoreValue}>
                  {data.market_outlook.bullish_score}%
                </Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Bear</Text>
                <View style={styles.scoreBarContainer}>
                  <View
                    style={[
                      styles.scoreBar,
                      styles.bearishBar,
                      { width: `${data.market_outlook.bearish_score}%` },
                    ]}
                  />
                </View>
                <Text style={styles.scoreValue}>
                  {data.market_outlook.bearish_score}%
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* KEY INDICATORS GRID */}
        <View style={styles.gridContainer}>
          <View style={styles.gridCard}>
            <Text style={styles.gridIcon}>📊</Text>
            <Text style={styles.gridLabel}>PCR OI</Text>
            <Text style={styles.gridValue}>
              {data.key_indicators.pcr_oi.toFixed(3)}
            </Text>
            <Text style={styles.gridSubtext}>{pcrInterpretation}</Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridIcon}>🎯</Text>
            <Text style={styles.gridLabel}>ATM PCR</Text>
            <Text style={styles.gridValue}>
              {data.key_indicators.atm_pcr.toFixed(3)}
            </Text>
            <Text style={styles.gridSubtext}>At The Money</Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridIcon}>{trendArrow}</Text>
            <Text style={styles.gridLabel}>Net OI Change</Text>
            <Text
              style={[
                styles.gridValue,
                {
                  color:
                    data.key_indicators.net_oi_change > 0
                      ? '#10B981'
                      : data.key_indicators.net_oi_change < 0
                      ? '#EF4444'
                      : '#6B7280',
                },
              ]}
            >
              {formatNumber(data.key_indicators.net_oi_change)}
            </Text>
            <Text style={styles.gridSubtext}>Open Interest</Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridIcon}>📞</Text>
            <Text style={styles.gridLabel}>Call ΔOI</Text>
            <Text
              style={[
                styles.gridValue,
                { color: data.key_indicators.call_oi_change > 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {formatNumber(data.key_indicators.call_oi_change)}
            </Text>
            <Text style={styles.gridSubtext}>Change</Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridIcon}>📝</Text>
            <Text style={styles.gridLabel}>Put ΔOI</Text>
            <Text
              style={[
                styles.gridValue,
                { color: data.key_indicators.put_oi_change > 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {formatNumber(data.key_indicators.put_oi_change)}
            </Text>
            <Text style={styles.gridSubtext}>Change</Text>
          </View>
        </View>

        {/* SUPPORT LEVELS */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('support')}
        >
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>🛡️</Text>
            <Text style={styles.sectionTitle}>Support Zones</Text>
          </View>
          <Text style={styles.expandIcon}>
            {expandedSection === 'support' ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {(expandedSection === 'support' || expandedSection === null) && (
          <View style={styles.zoneContainer}>
            {data.zones.support.map((s, i) => (
              <View key={i} style={styles.zoneCard}>
                <View style={styles.zoneHeader}>
                  <Text style={styles.strikeText}>₹{formatNumber(s.strike)}</Text>
                  <View style={styles.zoneBadge}>
                    <Text style={styles.zoneBadgeText}>Support {i + 1}</Text>
                  </View>
                </View>
                <View style={styles.zoneRow}>
                  <View style={styles.zoneItem}>
                    <Text style={styles.zoneItemLabel}>Put OI</Text>
                    <Text style={styles.zoneItemValue}>
                      {formatNumber(s.put_oi)}
                    </Text>
                  </View>
                  <View style={styles.zoneItem}>
                    <Text style={styles.zoneItemLabel}>Put ΔOI</Text>
                    <Text
                      style={[
                        styles.zoneItemValue,
                        { color: s.put_oi_change > 0 ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {s.put_oi_change > 0 ? '+' : ''}
                      {formatNumber(s.put_oi_change)}
                    </Text>
                  </View>
                </View>
                <View style={styles.zoneRow}>
                  <View style={styles.zoneItem}>
                    <Text style={styles.zoneItemLabel}>Call OI</Text>
                    <Text style={styles.zoneItemValue}>
                      {formatNumber(s.call_oi)}
                    </Text>
                  </View>
                  <View style={styles.zoneItem}>
                    <Text style={styles.zoneItemLabel}>Call ΔOI</Text>
                    <Text
                      style={[
                        styles.zoneItemValue,
                        { color: s.call_oi_change > 0 ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {s.call_oi_change > 0 ? '+' : ''}
                      {formatNumber(s.call_oi_change)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* RESISTANCE LEVELS */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('resistance')}
        >
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>⚔️</Text>
            <Text style={styles.sectionTitle}>Resistance Zones</Text>
          </View>
          <Text style={styles.expandIcon}>
            {expandedSection === 'resistance' ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {(expandedSection === 'resistance' || expandedSection === null) && (
          <View style={styles.zoneContainer}>
            {data.zones.resistance.map((r, i) => (
              <View key={i} style={styles.zoneCard}>
                <View style={styles.zoneHeader}>
                  <Text style={styles.strikeText}>₹{formatNumber(r.strike)}</Text>
                  <View style={[styles.zoneBadge, styles.resistanceBadge]}>
                    <Text style={styles.zoneBadgeText}>Resistance {i + 1}</Text>
                  </View>
                </View>
                <View style={styles.zoneRow}>
                  <View style={styles.zoneItem}>
                    <Text style={styles.zoneItemLabel}>Call OI</Text>
                    <Text style={styles.zoneItemValue}>
                      {formatNumber(r.call_oi)}
                    </Text>
                  </View>
                  <View style={styles.zoneItem}>
                    <Text style={styles.zoneItemLabel}>Call ΔOI</Text>
                    <Text
                      style={[
                        styles.zoneItemValue,
                        { color: r.call_oi_change > 0 ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {r.call_oi_change > 0 ? '+' : ''}
                      {formatNumber(r.call_oi_change)}
                    </Text>
                  </View>
                </View>
                <View style={styles.zoneRow}>
                  <View style={styles.zoneItem}>
                    <Text style={styles.zoneItemLabel}>Put OI</Text>
                    <Text style={styles.zoneItemValue}>
                      {formatNumber(r.put_oi)}
                    </Text>
                  </View>
                  <View style={styles.zoneItem}>
                    <Text style={styles.zoneItemLabel}>Put ΔOI</Text>
                    <Text
                      style={[
                        styles.zoneItemValue,
                        { color: r.put_oi_change > 0 ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {r.put_oi_change > 0 ? '+' : ''}
                      {formatNumber(r.put_oi_change)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ZONE TOTALS */}
        {data.zone_totals && (
          <View style={styles.totalsCard}>
            <Text style={styles.totalsTitle}>Zone Totals Summary</Text>
            <View style={styles.totalsGrid}>
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>Support Put ΔOI</Text>
                <Text
                  style={[
                    styles.totalValue,
                    { color: '#10B981' },
                  ]}
                >
                  +{formatNumber(data.zone_totals.support.put_oi_change)}
                </Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>Support Call ΔOI</Text>
                <Text
                  style={[
                    styles.totalValue,
                    { color: '#EF4444' },
                  ]}
                >
                  {formatNumber(data.zone_totals.support.call_oi_change)}
                </Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>Resistance Call ΔOI</Text>
                <Text
                  style={[
                    styles.totalValue,
                    { color: '#10B981' },
                  ]}
                >
                  +{formatNumber(data.zone_totals.resistance.call_oi_change)}
                </Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>Resistance Put ΔOI</Text>
                <Text
                  style={[
                    styles.totalValue,
                    { color: data.zone_totals.resistance.put_oi_change > 0 ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {data.zone_totals.resistance.put_oi_change > 0 ? '+' : ''}
                  {formatNumber(data.zone_totals.resistance.put_oi_change)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* MARKET SIGNALS */}
        <View style={styles.signalsCard}>
          <View style={styles.signalsHeader}>
            <Text style={styles.signalsIcon}>💡</Text>
            <Text style={styles.signalsTitle}>Market Signals</Text>
          </View>
          {data.market_outlook.signals.map((signal, i) => (
            <View key={i} style={styles.signalItem}>
              <Text style={styles.signalBullet}>•</Text>
              <Text style={styles.signalText}>{signal}</Text>
            </View>
          ))}
        </View>

        {/* TIMESTAMP */}
        <View style={styles.timestampCard}>
          <Text style={styles.timestampIcon}>🕐</Text>
          <Text style={styles.timestampText}>
            Last updated: {data.timestamp}
          </Text>
        </View>

        {/* DISCLAIMER */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerIcon}>⚠️</Text>
          <Text style={styles.disclaimerText}>
            {data.disclaimer || 'Educational purpose only. This is not financial advice.'}
          </Text>
        </View>

        {/* BOTTOM SPACING */}
        <View style={{ height: 30 }} />
      </Animated.View>
    </ScrollView>
  );
}
