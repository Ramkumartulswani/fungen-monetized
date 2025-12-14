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
  StatusBar,
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
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');

  /* ======================
     ANIMATIONS
     ====================== */
  const prevBiasRef = useRef<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
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
    slideAnim.setValue(30);
    fetchMarketData();
  }, [selectedIndex]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedIndex, autoRefresh]);

  /* ======================
     ROTATION ANIMATION
     ====================== */
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  /* ======================
     PULSE ON BIAS CHANGE
     ====================== */
  useEffect(() => {
    if (!data) return;

    const currentBias = data.final_decision.bias;

    if (prevBiasRef.current && prevBiasRef.current !== currentBias) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(pulseAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }

    prevBiasRef.current = currentBias;
  }, [data?.final_decision.bias]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(num);
  };

  const formatNumberFull = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getConfidenceData = (confidence: string) => {
    switch (confidence) {
      case 'HIGH':
        return { color: '#10B981', emoji: '🟢', label: 'HIGH' };
      case 'MODERATE':
        return { color: '#F59E0B', emoji: '🟡', label: 'MODERATE' };
      case 'LOW':
        return { color: '#EF4444', emoji: '🔴', label: 'LOW' };
      default:
        return { color: '#6B7280', emoji: '⚪', label: 'UNKNOWN' };
    }
  };

  const getBiasData = (bias: string) => {
    switch (bias) {
      case 'BULLISH':
        return {
          gradient: ['#10B981', '#059669'],
          emoji: '🐂',
          icon: '📈',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: '#10B981',
        };
      case 'BEARISH':
        return {
          gradient: ['#EF4444', '#DC2626'],
          emoji: '🐻',
          icon: '📉',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: '#EF4444',
        };
      default:
        return {
          gradient: ['#6B7280', '#4B5563'],
          emoji: '⚖️',
          icon: '➡️',
          bg: 'rgba(107, 114, 128, 0.1)',
          border: '#6B7280',
        };
    }
  };

  const getPCRInterpretation = (pcr: number) => {
    if (pcr > 1.2) return { text: 'Bullish', color: '#10B981', icon: '📈' };
    if (pcr < 0.8) return { text: 'Bearish', color: '#EF4444', icon: '📉' };
    return { text: 'Neutral', color: '#6B7280', icon: '➡️' };
  };

  const calculateOIStrength = (change: number, total: number) => {
    return Math.min(Math.abs(change / total) * 100, 100);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Text style={styles.loadingEmoji}>📊</Text>
        </Animated.View>
        <Text style={styles.loadingText}>Analyzing market data...</Text>
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 12 }} />
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
          <Text style={styles.retryButtonText}>🔄 Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ======================
     DERIVED UI VALUES
     ====================== */
  const biasData = getBiasData(data.final_decision.bias);
  const confidenceData = getConfidenceData(data.final_decision.confidence);
  const pcrData = getPCRInterpretation(data.key_indicators.pcr_oi);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#0F172A" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchMarketData}
            tintColor="#6366F1"
            colors={['#6366F1', '#8B5CF6']}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* PREMIUM HEADER */}
          <View style={styles.premiumHeader}>
            <View style={styles.headerGradient}>
              <View style={styles.headerContent}>
                <View>
                  <Text style={styles.headerTitle}>Market Pulse</Text>
                  <Text style={styles.headerSubtitle}>
                    Live Options Flow Analysis
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewModeButton}
                  onPress={() =>
                    setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')
                  }
                >
                  <Text style={styles.viewModeIcon}>
                    {viewMode === 'compact' ? '📋' : '📊'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* INDEX SELECTOR */}
          <View style={styles.selectorContainer}>
            <View style={styles.selectorWrapper}>
              {(['NIFTY', 'BANKNIFTY'] as const).map((idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.selectorButton,
                    selectedIndex === idx && styles.selectorActive,
                  ]}
                  onPress={() => setSelectedIndex(idx)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      selectedIndex === idx && styles.selectorTextActive,
                    ]}
                  >
                    {idx}
                  </Text>
                  {selectedIndex === idx && (
                    <View style={styles.activeIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.refreshToggle}
              onPress={() => setAutoRefresh(!autoRefresh)}
            >
              <Text style={styles.refreshIcon}>
                {autoRefresh ? '🔄' : '⏸️'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* HERO SPOT PRICE */}
          <View style={styles.heroCard}>
            <View style={styles.heroContent}>
              <View style={styles.spotPriceSection}>
                <Text style={styles.indexLabel}>{data.index}</Text>
                <Text style={styles.spotPrice}>₹{formatPrice(data.spot_price)}</Text>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>

              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatLabel}>PCR</Text>
                  <Text style={styles.quickStatValue}>
                    {data.key_indicators.pcr_oi.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatLabel}>Net OI</Text>
                  <Text
                    style={[
                      styles.quickStatValue,
                      {
                        color:
                          data.key_indicators.net_oi_change > 0
                            ? '#10B981'
                            : '#EF4444',
                      },
                    ]}
                  >
                    {formatNumber(data.key_indicators.net_oi_change)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* MARKET BIAS CARD */}
          <Animated.View
            style={[
              styles.biasCard,
              {
                backgroundColor: biasData.bg,
                borderColor: biasData.border,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.biasHeader}>
              <View style={styles.biasLeft}>
                <Text style={styles.biasEmoji}>{biasData.emoji}</Text>
                <View>
                  <Text style={[styles.biasTitle, { color: biasData.border }]}>
                    {data.final_decision.bias}
                  </Text>
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceEmoji}>
                      {confidenceData.emoji}
                    </Text>
                    <Text
                      style={[
                        styles.confidenceLabel,
                        { color: confidenceData.color },
                      ]}
                    >
                      {confidenceData.label} CONFIDENCE
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.biasIcon}>{biasData.icon}</Text>
            </View>

            {/* Sentiment Meter */}
            {(data.market_outlook.bullish_score > 0 ||
              data.market_outlook.bearish_score > 0) && (
              <View style={styles.sentimentMeter}>
                <View style={styles.meterHeader}>
                  <Text style={styles.meterLabel}>Sentiment Analysis</Text>
                  <Text style={styles.meterPercentage}>
                    {Math.max(
                      data.market_outlook.bullish_score,
                      data.market_outlook.bearish_score
                    )}
                    %
                  </Text>
                </View>
                <View style={styles.meterBar}>
                  <View
                    style={[
                      styles.meterFillBull,
                      { width: `${data.market_outlook.bullish_score}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.meterFillBear,
                      {
                        width: `${data.market_outlook.bearish_score}%`,
                        right: 0,
                        position: 'absolute',
                      },
                    ]}
                  />
                </View>
                <View style={styles.meterLabels}>
                  <Text style={styles.meterLabelBull}>
                    Bull {data.market_outlook.bullish_score}%
                  </Text>
                  <Text style={styles.meterLabelBear}>
                    Bear {data.market_outlook.bearish_score}%
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* KEY INDICATORS GRID */}
          <View style={styles.indicatorsGrid}>
            {/* PCR OI */}
            <View style={styles.indicatorCard}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorIcon}>📊</Text>
                <View style={styles.indicatorBadge}>
                  <Text style={styles.indicatorBadgeText}>PCR</Text>
                </View>
              </View>
              <Text style={styles.indicatorValue}>
                {data.key_indicators.pcr_oi.toFixed(3)}
              </Text>
              <View style={styles.indicatorFooter}>
                <Text style={styles.indicatorLabel}>Put-Call Ratio</Text>
                <View
                  style={[
                    styles.indicatorTag,
                    { backgroundColor: pcrData.color + '20' },
                  ]}
                >
                  <Text style={[styles.indicatorTagText, { color: pcrData.color }]}>
                    {pcrData.icon} {pcrData.text}
                  </Text>
                </View>
              </View>
            </View>

            {/* ATM PCR */}
            <View style={styles.indicatorCard}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorIcon}>🎯</Text>
                <View style={styles.indicatorBadge}>
                  <Text style={styles.indicatorBadgeText}>ATM</Text>
                </View>
              </View>
              <Text style={styles.indicatorValue}>
                {data.key_indicators.atm_pcr.toFixed(3)}
              </Text>
              <View style={styles.indicatorFooter}>
                <Text style={styles.indicatorLabel}>At The Money</Text>
                <Text style={styles.indicatorSubtext}>PCR Ratio</Text>
              </View>
            </View>

            {/* Call OI Change */}
            <View style={styles.indicatorCard}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorIcon}>📞</Text>
                <View
                  style={[
                    styles.indicatorBadge,
                    {
                      backgroundColor:
                        data.key_indicators.call_oi_change > 0
                          ? '#10B98120'
                          : '#EF444420',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.indicatorBadgeText,
                      {
                        color:
                          data.key_indicators.call_oi_change > 0
                            ? '#10B981'
                            : '#EF4444',
                      },
                    ]}
                  >
                    {data.key_indicators.call_oi_change > 0 ? '▲' : '▼'}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.indicatorValue,
                  {
                    color:
                      data.key_indicators.call_oi_change > 0
                        ? '#10B981'
                        : '#EF4444',
                  },
                ]}
              >
                {formatNumber(data.key_indicators.call_oi_change)}
              </Text>
              <View style={styles.indicatorFooter}>
                <Text style={styles.indicatorLabel}>Call OI Change</Text>
                <Text style={styles.indicatorSubtext}>
                  {formatNumberFull(data.key_indicators.call_oi_change)}
                </Text>
              </View>
            </View>

            {/* Put OI Change */}
            <View style={styles.indicatorCard}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorIcon}>📝</Text>
                <View
                  style={[
                    styles.indicatorBadge,
                    {
                      backgroundColor:
                        data.key_indicators.put_oi_change > 0
                          ? '#10B98120'
                          : '#EF444420',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.indicatorBadgeText,
                      {
                        color:
                          data.key_indicators.put_oi_change > 0
                            ? '#10B981'
                            : '#EF4444',
                      },
                    ]}
                  >
                    {data.key_indicators.put_oi_change > 0 ? '▲' : '▼'}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.indicatorValue,
                  {
                    color:
                      data.key_indicators.put_oi_change > 0 ? '#10B981' : '#EF4444',
                  },
                ]}
              >
                {formatNumber(data.key_indicators.put_oi_change)}
              </Text>
              <View style={styles.indicatorFooter}>
                <Text style={styles.indicatorLabel}>Put OI Change</Text>
                <Text style={styles.indicatorSubtext}>
                  {formatNumberFull(data.key_indicators.put_oi_change)}
                </Text>
              </View>
            </View>
          </View>

          {/* ZONE TOTALS OVERVIEW */}
          {data.zone_totals && (
            <View style={styles.zoneTotalsCard}>
              <Text style={styles.zoneTotalsTitle}>📈 Zone Activity Summary</Text>
              <View style={styles.zoneTotalsGrid}>
                <View style={styles.zoneTotalItem}>
                  <Text style={styles.zoneTotalLabel}>Support Strength</Text>
                  <Text style={styles.zoneTotalValueGreen}>
                    +{formatNumber(data.zone_totals.support.put_oi_change)}
                  </Text>
                  <Text style={styles.zoneTotalSub}>Put accumulation</Text>
                </View>
                <View style={styles.zoneTotalDivider} />
                <View style={styles.zoneTotalItem}>
                  <Text style={styles.zoneTotalLabel}>Resistance Buildup</Text>
                  <Text style={styles.zoneTotalValueRed}>
                    +{formatNumber(data.zone_totals.resistance.call_oi_change)}
                  </Text>
                  <Text style={styles.zoneTotalSub}>Call accumulation</Text>
                </View>
              </View>
            </View>
          )}

          {/* SUPPORT ZONES */}
          <View style={styles.zoneSection}>
            <View style={styles.zoneSectionHeader}>
              <View style={styles.zoneHeaderLeft}>
                <Text style={styles.zoneEmoji}>🛡️</Text>
                <Text style={styles.zoneTitle}>Support Zones</Text>
              </View>
              <View style={styles.zoneBadge}>
                <Text style={styles.zoneBadgeText}>
                  {data.zones.support.length} Levels
                </Text>
              </View>
            </View>

            <View style={styles.zoneCards}>
              {data.zones.support.map((zone, index) => {
                const strength = calculateOIStrength(
                  zone.put_oi_change,
                  zone.put_oi
                );
                return (
                  <View key={index} style={styles.zoneCard}>
                    <View style={styles.zoneCardHeader}>
                      <View>
                        <Text style={styles.strikePrice}>
                          ₹{formatNumberFull(zone.strike)}
                        </Text>
                        <Text style={styles.zoneLevel}>Support {index + 1}</Text>
                      </View>
                      <View style={styles.strengthBadge}>
                        <Text style={styles.strengthText}>
                          {strength.toFixed(0)}%
                        </Text>
                      </View>
                    </View>

                    <View style={styles.oiRow}>
                      <View style={styles.oiItem}>
                        <Text style={styles.oiLabel}>Put OI</Text>
                        <Text style={styles.oiValue}>
                          {formatNumber(zone.put_oi)}
                        </Text>
                      </View>
                      <View style={styles.oiItem}>
                        <Text style={styles.oiLabel}>Put ΔOI</Text>
                        <Text
                          style={[
                            styles.oiValue,
                            {
                              color:
                                zone.put_oi_change > 0 ? '#10B981' : '#EF4444',
                            },
                          ]}
                        >
                          {zone.put_oi_change > 0 ? '+' : ''}
                          {formatNumber(zone.put_oi_change)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.oiRow}>
                      <View style={styles.oiItem}>
                        <Text style={styles.oiLabel}>Call OI</Text>
                        <Text style={styles.oiValue}>
                          {formatNumber(zone.call_oi)}
                        </Text>
                      </View>
                      <View style={styles.oiItem}>
                        <Text style={styles.oiLabel}>Call ΔOI</Text>
                        <Text
                          style={[
                            styles.oiValue,
                            {
                              color:
                                zone.call_oi_change > 0 ? '#10B981' : '#EF4444',
                            },
                          ]}
                        >
                          {zone.call_oi_change > 0 ? '+' : ''}
                          {formatNumber(zone.call_oi_change)}
                        </Text>
                      </View>
                    </View>

                    {/* Strength Bar */}
                    <View style={styles.strengthBar}>
                      <View
                        style={[
                          styles.strengthFill,
                          { width: `${strength}%`, backgroundColor: '#10B981' },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* RESISTANCE ZONES */}
          <View style={styles.zoneSection}>
            <View style={styles.zoneSectionHeader}>
              <View style={styles.zoneHeaderLeft}>
                <Text style={styles.zoneEmoji}>⚔️</Text>
                <Text style={styles.zoneTitle}>Resistance Zones</Text>
              </View>
              <View style={[styles.zoneBadge, styles.resistanceBadge]}>
                <Text style={styles.zoneBadgeText}>
                  {data.zones.resistance.length} Levels
                </Text>
              </View>
            </View>

            <View style={styles.zoneCards}>
              {data.zones.resistance.map((zone, index) => {
                const strength = calculateOIStrength(
                  zone.call_oi_change,
                  zone.call_oi
                );
                return (
                  <View key={index} style={styles.zoneCard}>
                    <View style={styles.zoneCardHeader}>
                      <View>
                        <Text style={styles.strikePrice}>
                          ₹{formatNumberFull(zone.strike)}
                        </Text>
                        <Text style={styles.zoneLevel}>
                          Resistance {index + 1}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.strengthBadge,
                          styles.resistanceStrengthBadge,
                        ]}
                      >
                        <Text style={styles.strengthText}>
                          {strength.toFixed(0)}%
                        </Text>
                      </View>
                    </View>

                    <View style={styles.oiRow}>
                      <View style={styles.oiItem}>
                        <Text style={styles.oiLabel}>Call OI</Text>
                        <Text style={styles.oiValue}>
                          {formatNumber(zone.call_oi)}
                        </Text>
                      </View>
                      <View style={styles.oiItem}>
                        <Text style={styles.oiLabel}>Call ΔOI</Text>
                        <Text
                          style={[
                            styles.oiValue,
                            {
                              color:
                                zone.call_oi_change > 0 ? '#10B981' : '#EF4444',
                            },
                          ]}
                        >
                          {zone.call_oi_change > 0 ? '+' : ''}
                          {formatNumber(zone.call_oi_change)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.oiRow}>
                      <View style={styles.oiItem}>
                        <Text style={styles.oiLabel}>Put OI</Text>
                        <Text style={styles.oiValue}>
                          {formatNumber(zone.put_oi)}
                        </Text>
                      </View>
                      <View style={styles.oiItem}>
                        <Text style={styles.oiLabel}>Put ΔOI</Text>
                        <Text
                          style={[
                            styles.oiValue,
                            {
                              color:
                                zone.put_oi_change > 0 ? '#10B981' : '#EF4444',
                            },
                          ]}
                        >
                          {zone.put_oi_change > 0 ? '+' : ''}
                          {formatNumber(zone.put_oi_change)}
                        </Text>
                      </View>
                    </View>

                    {/* Strength Bar */}
                    <View style={styles.strengthBar}>
                      <View
                        style={[
                          styles.strengthFill,
                          { width: `${strength}%`, backgroundColor: '#EF4444' },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* MARKET SIGNALS */}
          {data.market_outlook.signals.length > 0 && (
            <View style={styles.signalsCard}>
              <View style={styles.signalsHeader}>
                <Text style={styles.signalsIcon}>💡</Text>
                <Text style={styles.signalsTitle}>Market Intelligence</Text>
              </View>
              <View style={styles.signalsList}>
                {data.market_outlook.signals.map((signal, index) => (
                  <View key={index} style={styles.signalItem}>
                    <View style={styles.signalDot} />
                    <Text style={styles.signalText}>{signal}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* FOOTER INFO */}
          <View style={styles.footerInfo}>
            <View style={styles.timestampRow}>
              <Text style={styles.timestampIcon}>🕐</Text>
              <Text style={styles.timestampText}>{data.timestamp}</Text>
            </View>
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerIcon}>⚠️</Text>
              <Text style={styles.disclaimerText}>
                {data.disclaimer || 'Educational purpose only. Not financial advice.'}
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </>
  );
}
