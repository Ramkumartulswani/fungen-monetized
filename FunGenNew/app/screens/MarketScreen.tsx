import React, { useEffect, useState, useRef } from 'react';
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
  Alert,
  Modal,
  Share,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ======================
   TYPES
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

type PriceAlert = {
  id: string;
  index: 'NIFTY' | 'BANKNIFTY';
  targetPrice: number;
  type: 'above' | 'below';
  createdAt: number;
};

type MarketStats = {
  viewCount: number;
  lastViewed: string;
  favorites: string[];
  alerts: PriceAlert[];
};

/* ======================
   CONFIG
   ====================== */
const MARKET_URLS = {
  NIFTY: 'https://drive.google.com/uc?export=download&id=1t9fYO6ry9igdt3DZqlBqakMArBA4CdUK',
  BANKNIFTY: 'https://drive.google.com/uc?export=download&id=YOUR_BANKNIFTY_FILE_ID',
};

const { width } = Dimensions.get('window');

export default function MarketScreen() {
  const [data, setData] = useState<MarketData | null>(null);
  const [historicalData, setHistoricalData] = useState<Array<{price: number, time: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<'NIFTY' | 'BANKNIFTY'>('NIFTY');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'zones'>('overview');
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [stats, setStats] = useState<MarketStats>({
    viewCount: 0,
    lastViewed: '',
    favorites: [],
    alerts: [],
  });

  /* ======================
     ANIMATIONS
     ====================== */
  const prevBiasRef = useRef<string | null>(null);
  const prevPriceRef = useRef<number | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const priceFlashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStats();
    fetchMarketData();
  }, []);

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

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (!data) return;

    // Bias change animation
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

    // Price change animation
    const currentPrice = data.spot_price;
    if (prevPriceRef.current && prevPriceRef.current !== currentPrice) {
      Animated.sequence([
        Animated.timing(priceFlashAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(priceFlashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();

      checkPriceAlerts(currentPrice);
    }
    prevPriceRef.current = currentPrice;

    if (historicalData.length === 0 || 
        historicalData[historicalData.length - 1].price !== currentPrice) {
      setHistoricalData(prev => [
        ...prev.slice(-20),
        { price: currentPrice, time: new Date().toLocaleTimeString() }
      ]);
    }
  }, [data]);

  const loadStats = async () => {
    try {
      const saved = await AsyncStorage.getItem('MARKET_STATS');
      if (saved) {
        setStats(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const saveStats = async (newStats: MarketStats) => {
    try {
      await AsyncStorage.setItem('MARKET_STATS', JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  };

  const fetchMarketData = async () => {
    try {
      setError(false);
      const url = MARKET_URLS[selectedIndex] + '&t=' + Date.now();
      const res = await fetch(url);
      const json = await res.json();
      setData(json);

      const newStats = {
        ...stats,
        viewCount: stats.viewCount + 1,
        lastViewed: new Date().toISOString(),
      };
      saveStats(newStats);

      await AsyncStorage.setItem('MARKET_VIEWS', (stats.viewCount + 1).toString());

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

  const checkPriceAlerts = (currentPrice: number) => {
    stats.alerts.forEach(alert => {
      if (alert.index !== selectedIndex) return;

      const shouldAlert = 
        (alert.type === 'above' && currentPrice >= alert.targetPrice) ||
        (alert.type === 'below' && currentPrice <= alert.targetPrice);

      if (shouldAlert) {
        Alert.alert(
          '🔔 Price Alert!',
          `${alert.index} has ${alert.type === 'above' ? 'crossed above' : 'fallen below'} ₹${alert.targetPrice.toFixed(2)}`,
          [
            { text: 'Dismiss' },
            { 
              text: 'Remove Alert', 
              onPress: () => removeAlert(alert.id),
              style: 'destructive'
            },
          ]
        );
      }
    });
  };

  const addPriceAlert = (targetPrice: number, type: 'above' | 'below') => {
    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      index: selectedIndex,
      targetPrice,
      type,
      createdAt: Date.now(),
    };

    const newStats = {
      ...stats,
      alerts: [...stats.alerts, newAlert],
    };
    saveStats(newStats);
    setAlertModalVisible(false);
    Alert.alert('Success', `Alert set for ${selectedIndex} ${type} ₹${targetPrice.toFixed(2)}`);
  };

  const removeAlert = (id: string) => {
    const newStats = {
      ...stats,
      alerts: stats.alerts.filter(a => a.id !== id),
    };
    saveStats(newStats);
  };

  const toggleFavorite = () => {
    const isFavorite = stats.favorites.includes(selectedIndex);
    const newFavorites = isFavorite
      ? stats.favorites.filter(f => f !== selectedIndex)
      : [...stats.favorites, selectedIndex];

    const newStats = {
      ...stats,
      favorites: newFavorites,
    };
    saveStats(newStats);
  };

  const shareAnalysis = async () => {
    if (!data) return;

    try {
      const message = `
📊 ${data.index} Market Analysis

💰 Spot Price: ₹${formatPrice(data.spot_price)}
${data.final_decision.bias === 'BULLISH' ? '🐂' : data.final_decision.bias === 'BEARISH' ? '🐻' : '⚖️'} Bias: ${data.final_decision.bias}
📈 Confidence: ${data.final_decision.confidence}

📊 Key Indicators:
• PCR: ${data.key_indicators.pcr_oi.toFixed(2)}
• Net OI Change: ${formatNumber(data.key_indicators.net_oi_change)}

💡 Signals:
${data.market_outlook.signals.slice(0, 3).map(s => `• ${s}`).join('\n')}

⏰ ${data.timestamp}
⚠️ For educational purposes only
      `.trim();

      await Share.share({ message });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

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
        return { color: '#10B981', emoji: '🟢', label: 'HIGH', percentage: 85 };
      case 'MODERATE':
        return { color: '#F59E0B', emoji: '🟡', label: 'MODERATE', percentage: 60 };
      case 'LOW':
        return { color: '#EF4444', emoji: '🔴', label: 'LOW', percentage: 35 };
      default:
        return { color: '#6B7280', emoji: '⚪', label: 'UNKNOWN', percentage: 0 };
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

  const priceFlashColor = priceFlashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(99, 102, 241, 0)', 'rgba(99, 102, 241, 0.3)'],
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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

  const biasData = getBiasData(data.final_decision.bias);
  const confidenceData = getConfidenceData(data.final_decision.confidence);
  const pcrData = getPCRInterpretation(data.key_indicators.pcr_oi);
  const isFavorite = stats.favorites.includes(selectedIndex);
  const activeAlerts = stats.alerts.filter(a => a.index === selectedIndex);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchMarketData();
            }}
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
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            style={styles.premiumHeader}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>📊 Market Pulse</Text>
                <Text style={styles.headerSubtitle}>
                  Live Options Flow Analysis
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerActionButton}
                  onPress={toggleFavorite}
                >
                  <Text style={styles.headerActionIcon}>
                    {isFavorite ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerActionButton}
                  onPress={() => setShareModalVisible(true)}
                >
                  <Text style={styles.headerActionIcon}>📤</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{stats.viewCount}</Text>
                <Text style={styles.headerStatLabel}>Views</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{activeAlerts.length}</Text>
                <Text style={styles.headerStatLabel}>Alerts</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{historicalData.length}</Text>
                <Text style={styles.headerStatLabel}>Data Points</Text>
              </View>
            </View>
          </LinearGradient>

          {/* INDEX SELECTOR & CONTROLS */}
          <View style={styles.controlsRow}>
            <View style={styles.selectorContainer}>
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

            <View style={styles.controlButtons}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setAutoRefresh(!autoRefresh)}
              >
                <Text style={styles.controlButtonIcon}>
                  {autoRefresh ? '🔄' : '⏸️'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setAlertModalVisible(true)}
              >
                <Text style={styles.controlButtonIcon}>🔔</Text>
                {activeAlerts.length > 0 && (
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>{activeAlerts.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* VIEW MODE TOGGLE */}
          <View style={styles.viewModeToggle}>
            {(['overview', 'detailed', 'zones'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.viewModeButton,
                  viewMode === mode && styles.viewModeActive,
                ]}
                onPress={() => setViewMode(mode)}
              >
                <Text
                  style={[
                    styles.viewModeText,
                    viewMode === mode && styles.viewModeTextActive,
                  ]}
                >
                  {mode === 'overview' ? '📋 Overview' : mode === 'detailed' ? '📊 Detailed' : '🎯 Zones'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* HERO SPOT PRICE CARD */}
          <Animated.View
            style={[
              styles.heroCard,
              { backgroundColor: priceFlashColor },
            ]}
          >
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

            {historicalData.length > 2 && (
              <View style={styles.miniChart}>
                <Text style={styles.miniChartTitle}>Price Movement</Text>
                <View style={styles.chartContainer}>
                  {historicalData.slice(-10).map((point, index) => {
                    const maxPrice = Math.max(...historicalData.slice(-10).map(p => p.price));
                    const minPrice = Math.min(...historicalData.slice(-10).map(p => p.price));
                    const height = ((point.price - minPrice) / (maxPrice - minPrice)) * 40;
                    return (
                      <View key={index} style={styles.chartBar}>
                        <View
                          style={[
                            styles.chartBarFill,
                            {
                              height: height || 2,
                              backgroundColor:
                                index > 0 && point.price >= historicalData.slice(-10)[index - 1].price
                                  ? '#10B981'
                                  : '#EF4444',
                            },
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </Animated.View>

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

            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceBarFill,
                  {
                    width: `${confidenceData.percentage}%`,
                    backgroundColor: confidenceData.color,
                  },
                ]}
              />
            </View>

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

          {/* CONTENT BASED ON VIEW MODE */}
          {viewMode === 'overview' && (
            <>
              {/* KEY INDICATORS GRID */}
              <View style={styles.indicatorsGrid}>
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
            </>
          )}

          {viewMode === 'detailed' && (
            <View style={styles.detailedView}>
              <Text style={styles.detailedTitle}>📊 Complete Analysis</Text>
              <Text style={styles.detailedSubtext}>Detailed view coming soon</Text>
            </View>
          )}

          {viewMode === 'zones' && (
            <>
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
            </>
          )}

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

      {/* MODALS */}
      <Modal
        visible={alertModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔔 Price Alerts</Text>
            
            {activeAlerts.length > 0 && (
              <View style={styles.activeAlerts}>
                <Text style={styles.activeAlertsTitle}>Active Alerts</Text>
                {activeAlerts.map(alert => (
                  <View key={alert.id} style={styles.alertItem}>
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertPrice}>₹{alert.targetPrice.toFixed(2)}</Text>
                      <Text style={styles.alertType}>
                        {alert.type === 'above' ? '📈 Above' : '📉 Below'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeAlertButton}
                      onPress={() => removeAlert(alert.id)}
                    >
                      <Text style={styles.removeAlertText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.addAlertSection}>
              <Text style={styles.addAlertTitle}>Set New Alert</Text>
              <TouchableOpacity
                style={styles.alertOption}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Alert.prompt(
                      'Price Alert',
                      `Set alert when ${selectedIndex} goes above:`,
                      (text) => {
                        const price = parseFloat(text);
                        if (!isNaN(price) && price > 0) {
                          addPriceAlert(price, 'above');
                        }
                      },
                      'plain-text',
                      data.spot_price.toString()
                    );
                  } else {
                    Alert.alert('Price Alert', 'Enter target price in app settings');
                  }
                }}
              >
                <Text style={styles.alertOptionText}>📈 Alert Above Current Price</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertOption}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Alert.prompt(
                      'Price Alert',
                      `Set alert when ${selectedIndex} goes below:`,
                      (text) => {
                        const price = parseFloat(text);
                        if (!isNaN(price) && price > 0) {
                          addPriceAlert(price, 'below');
                        }
                      },
                      'plain-text',
                      data.spot_price.toString()
                    );
                  } else {
                    Alert.alert('Price Alert', 'Enter target price in app settings');
                  }
                }}
              >
                <Text style={styles.alertOptionText}>📉 Alert Below Current Price</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setAlertModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📤 Share Analysis</Text>
            
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => {
                shareAnalysis();
                setShareModalVisible(false);
              }}
            >
              <Text style={styles.shareOptionIcon}>📱</Text>
              <Text style={styles.shareOptionText}>Share as Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => {
                Alert.alert('Coming Soon', 'Screenshot sharing feature');
              }}
            >
              <Text style={styles.shareOptionIcon}>📸</Text>
              <Text style={styles.shareOptionText}>Share as Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShareModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Base
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

  // Loading
  loadingEmoji: { fontSize: 80, marginBottom: 20 },
  loadingText: { fontSize: 16, color: '#64748B', fontWeight: '600' },

  // Error
  errorEmoji: { fontSize: 80, marginBottom: 20 },
  errorText: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  errorSubtext: { fontSize: 16, color: '#64748B', marginBottom: 24 },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // Header
  premiumHeader: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionIcon: { fontSize: 20 },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerStat: { alignItems: 'center' },
  headerStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#6366F1',
    marginBottom: 4,
  },
  headerStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  selectorButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    position: 'relative',
  },
  selectorActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
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
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  controlButtonIcon: { fontSize: 20 },
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 4,
  },

  // View Mode
  viewModeToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  viewModeActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  viewModeTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },

  // Hero Card
  heroCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spotPriceSection: { flex: 1 },
  indexLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 4,
  },
  spotPrice: {
    fontSize: 36,
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
  quickStats: {
    gap: 12,
    alignItems: 'flex-end',
  },
  quickStat: { alignItems: 'flex-end' },
  quickStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickStatDivider: {
    width: 40,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  miniChart: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  miniChartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 50,
    gap: 4,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },

  // Bias Card
  biasCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
  },
  biasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  biasLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  biasEmoji: { fontSize: 32 },
  biasTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceEmoji: { fontSize: 14 },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  biasIcon: { fontSize: 40 },
  confidenceBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  sentimentMeter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  meterPercentage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  meterBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  meterFillBull: {
    height: '100%',
    backgroundColor: '#10B981',
    position: 'absolute',
    left: 0,
  },
  meterFillBear: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  meterLabelBull: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  meterLabelBear: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Indicators Grid
  indicatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  indicatorCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  indicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  indicatorIcon: { fontSize: 24 },
  indicatorBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  indicatorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  indicatorValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  indicatorFooter: { gap: 4 },
  indicatorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  indicatorSubtext: {
    fontSize: 11,
    color: '#94A3B8',
  },
  indicatorTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  indicatorTagText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Zone Totals
  zoneTotalsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  zoneTotalsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  zoneTotalsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  zoneTotalItem: {
    flex: 1,
    alignItems: 'center',
  },
  zoneTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  zoneTotalValueGreen: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 4,
  },
  zoneTotalValueRed: {
    fontSize: 24,
    fontWeight: '900',
    color: '#EF4444',
    marginBottom: 4,
  },
  zoneTotalSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  zoneTotalDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },

  // Signals
  signalsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  signalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  signalsIcon: { fontSize: 24 },
  signalsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  signalsList: { gap: 12 },
  signalItem: {
    flexDirection: 'row',
    gap: 12,
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
    marginTop: 6,
  },
  signalText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },

  // Detailed View
  detailedView: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  detailedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  detailedSubtext: {
    fontSize: 14,
    color: '#64748B',
  },

  // Zones
  zoneSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  zoneSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoneHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoneEmoji: { fontSize: 24 },
  zoneTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  zoneBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resistanceBadge: {
    backgroundColor: '#EF444420',
  },
  zoneBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  zoneCards: { gap: 12 },
  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  zoneCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  strikePrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  zoneLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  strengthBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resistanceStrengthBadge: {
    backgroundColor: '#EF444420',
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  oiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  oiItem: { flex: 1 },
  oiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  oiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Footer
  footerInfo: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  timestampIcon: { fontSize: 16 },
  timestampText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  disclaimerIcon: { fontSize: 16 },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#92400E',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 24,
    textAlign: 'center',
  },
  activeAlerts: {
    marginBottom: 24,
  },
  activeAlertsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  alertInfo: { flex: 1 },
  alertPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 14,
    color: '#64748B',
  },
  removeAlertButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeAlertText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '700',
  },
  addAlertSection: {
    marginBottom: 20,
  },
  addAlertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  alertOption: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  alertOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  shareOptionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  shareOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalCloseButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
