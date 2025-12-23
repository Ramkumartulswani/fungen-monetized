import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// Google Drive URLs
const MARKET_URLS = {
  NIFTY: 'https://drive.google.com/uc?export=download&id=1t9fYO6ry9igdt3DZqlBqakMArBA4CdUK',
  BANKNIFTY: 'https://drive.google.com/uc?export=download&id=1Yj0AtywQaR-RW0ofrOpw7p8Yi1S66WVa',
};

// Auto-refresh interval (in milliseconds)
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

/* ---------------- HELPERS ---------------- */

const getStrength = (pct: number) => {
  if (pct >= 40) return { arrow: '▲▲', label: 'STRONG', color: '#DC2626', bg: '#FEE2E2' };
  if (pct >= 20) return { arrow: '▲', label: 'BUILDING', color: '#EF4444', bg: '#FEE2E2' };
  if (pct <= -30) return { arrow: '▼▼', label: 'UNWINDING', color: '#64748B', bg: '#F1F5F9' };
  if (pct < 0) return { arrow: '▼', label: 'WEAK', color: '#94A3B8', bg: '#F1F5F9' };
  return { arrow: '→', label: 'NEUTRAL', color: '#6B7280', bg: '#F3F4F6' };
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
};

const PulseIndicator = ({ color }: { color: string }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulseOuter,
        { 
          backgroundColor: color + '30',
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <View style={[styles.pulseInner, { backgroundColor: color }]} />
    </Animated.View>
  );
};

export default function MarketScreen() {
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL / 1000);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMarketData();
    
    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefreshEnabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
    
    return () => {
      stopAutoRefresh();
    };
  }, [autoRefreshEnabled]);

  useEffect(() => {
    if (marketData) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [marketData]);

  const startAutoRefresh = () => {
    // Clear any existing intervals
    stopAutoRefresh();
    
    // Start auto-refresh interval
    refreshIntervalRef.current = setInterval(() => {
      fetchMarketData(true); // Silent refresh
    }, AUTO_REFRESH_INTERVAL);
    
    // Start countdown interval
    setCountdown(AUTO_REFRESH_INTERVAL / 1000);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return AUTO_REFRESH_INTERVAL / 1000;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const fetchMarketData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch(MARKET_URLS.NIFTY, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMarketData(data);
      setLastUpdated(new Date());
      
      // Reset countdown
      if (autoRefreshEnabled) {
        setCountdown(AUTO_REFRESH_INTERVAL / 1000);
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to load market data');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMarketData();
    setRefreshing(false);
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };

  if (loading && !marketData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading market data...</Text>
      </View>
    );
  }

  if (error && !marketData) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.centerContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.errorEmoji}>📡</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>Pull down to retry</Text>
      </ScrollView>
    );
  }

  if (!marketData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No data available</Text>
      </View>
    );
  }

  const d = marketData;

  /* ---------------- MARKET STATUS ---------------- */

  const isBullish = d.final_decision.bias === 'BULLISH';
  const isBearish = d.final_decision.bias === 'BEARISH';

  const statusColors = isBullish
    ? ['#10B981', '#059669', '#047857']
    : isBearish
    ? ['#EF4444', '#DC2626', '#B91C1C']
    : ['#6B7280', '#4B5563', '#374151'];

  const accentColor = isBullish ? '#10B981' : isBearish ? '#EF4444' : '#6B7280';

  /* ---------------- UI ---------------- */

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* 🔄 AUTO REFRESH STATUS BAR */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, { 
              backgroundColor: autoRefreshEnabled ? '#10B981' : '#94A3B8' 
            }]} />
            <Text style={styles.statusText}>
              {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : 'Fetching...'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={toggleAutoRefresh}
            activeOpacity={0.7}
          >
            <Text style={[styles.refreshButtonText, {
              color: autoRefreshEnabled ? '#10B981' : '#94A3B8'
            }]}>
              {autoRefreshEnabled ? `🔄 ${countdown}s` : '⏸ Paused'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🔥 MARKET STATUS HERO */}
        <LinearGradient 
          colors={statusColors} 
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative background circles */}
          <View style={styles.heroDecor}>
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <PulseIndicator color="#fff" />
              <Text style={styles.heroEmoji}>{d.final_decision.bias_symbol}</Text>
            </View>
            
            <Text style={styles.heroTitle}>
              {d.final_decision.bias} PRESSURE
            </Text>
            
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {d.parallel_oi_analysis.cross_strike_analysis.bias_interpretation}
              </Text>
            </View>
            
            <View style={styles.heroFooter}>
              <View style={styles.confidenceMeter}>
                <View style={styles.confidenceLabel}>
                  <Text style={styles.confidenceLabelText}>CONFIDENCE</Text>
                </View>
                <Text style={styles.confidenceValue}>{d.final_decision.confidence}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* 📊 PRICE CONTEXT */}
        <View style={[styles.card, styles.priceCard]}>
          <View style={styles.priceHeader}>
            <View>
              <Text style={styles.priceLabel}>SPOT PRICE</Text>
              <Text style={styles.price}>₹ {d.spot_price}</Text>
            </View>
            <View style={[styles.priceBadge, { borderColor: accentColor }]}>
              <Text style={[styles.priceBadgeText, { color: accentColor }]}>LIVE</Text>
            </View>
          </View>
          
          <View style={styles.pcrRow}>
            <View style={styles.pcrItem}>
              <Text style={styles.pcrLabel}>PCR</Text>
              <Text style={styles.pcrValue}>{d.key_indicators.pcr_oi}</Text>
              <Text style={styles.pcrInterpretation}>{d.key_indicators.pcr_interpretation}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.pcrItem}>
              <Text style={styles.pcrLabel}>ATM PCR</Text>
              <Text style={styles.pcrValue}>{d.key_indicators.atm_pcr}</Text>
              <Text style={styles.pcrInterpretation}>{d.key_indicators.atm_pcr_interpretation}</Text>
            </View>
          </View>
        </View>

        {/* ⚡ OI ACTIVITY RADAR */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚡</Text>
            <Text style={styles.sectionTitle}>OI Activity Radar</Text>
          </View>

          <View style={styles.radarContainer}>
            {/* Resistance Strikes */}
            <View style={styles.radarSection}>
              <Text style={styles.radarSectionTitle}>RESISTANCE</Text>
              {d.zones.resistance.map((z: any, i: number) => {
                const s = getStrength(z.call_oi_change_pct);
                return (
                  <View key={`res-${i}`} style={styles.radarItem}>
                    <View style={styles.radarLeft}>
                      <View style={[styles.radarDot, { backgroundColor: '#DC2626' }]} />
                      <Text style={styles.radarStrike}>{z.strike}</Text>
                      <Text style={styles.radarType}>CE</Text>
                    </View>
                    <View style={[styles.radarBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.radarArrow, { color: s.color }]}>{s.arrow}</Text>
                      <Text style={[styles.radarLabel, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Support Strikes */}
            <View style={[styles.radarSection, styles.radarSectionLast]}>
              <Text style={styles.radarSectionTitle}>SUPPORT</Text>
              {d.zones.support.map((z: any, i: number) => {
                const s = getStrength(z.put_oi_change_pct);
                return (
                  <View key={`sup-${i}`} style={styles.radarItem}>
                    <View style={styles.radarLeft}>
                      <View style={[styles.radarDot, { backgroundColor: '#16A34A' }]} />
                      <Text style={styles.radarStrike}>{z.strike}</Text>
                      <Text style={styles.radarType}>PE</Text>
                    </View>
                    <View style={[styles.radarBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.radarArrow, { color: s.color }]}>{s.arrow}</Text>
                      <Text style={[styles.radarLabel, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* 🎯 KEY LEVELS */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎯</Text>
            <Text style={styles.sectionTitle}>Key Levels</Text>
          </View>

          <View style={styles.levelsContainer}>
            {/* Resistance */}
            <View style={styles.levelSection}>
              <View style={styles.levelHeader}>
                <View style={styles.levelDot} />
                <Text style={styles.levelTitle}>RESISTANCE</Text>
              </View>
              <View style={styles.levelChips}>
                {d.zones.resistance.slice(0, 3).map((z: any, i: number) => (
                  <LinearGradient
                    key={i}
                    colors={['#FEE2E2', '#FECACA']}
                    style={styles.levelChip}
                  >
                    <Text style={styles.levelChipStrike}>{z.strike}</Text>
                    <Text style={styles.levelChipCode}>{z.interpretation_code}</Text>
                  </LinearGradient>
                ))}
              </View>
            </View>

            {/* Support */}
            <View style={[styles.levelSection, { marginTop: 16 }]}>
              <View style={styles.levelHeader}>
                <View style={[styles.levelDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.levelTitle}>SUPPORT</Text>
              </View>
              <View style={styles.levelChips}>
                {d.zones.support.slice(0, 3).map((z: any, i: number) => (
                  <LinearGradient
                    key={i}
                    colors={['#D1FAE5', '#A7F3D0']}
                    style={styles.levelChip}
                  >
                    <Text style={styles.levelChipStrike}>{z.strike}</Text>
                    <Text style={styles.levelChipCode}>{z.interpretation_code}</Text>
                  </LinearGradient>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 🧠 MARKET SUMMARY */}
        <LinearGradient
          colors={['#F8FAFC', '#F1F5F9']}
          style={[styles.card, styles.summaryCard]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🧠</Text>
            <Text style={styles.sectionTitle}>Market Summary</Text>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryBlock}>
              <View style={styles.summaryIndicator} />
              <Text style={styles.summaryText}>
                {d.parallel_oi_analysis.resistance_zone.summary}
              </Text>
            </View>
            <View style={[styles.summaryBlock, { marginTop: 12 }]}>
              <View style={styles.summaryIndicator} />
              <Text style={styles.summaryText}>
                {d.parallel_oi_analysis.support_zone.summary}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ height: 40 }} />
      </Animated.View>
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },

  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },

  errorText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },

  errorHint: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  /* STATUS BAR */
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },

  refreshButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },

  /* HERO SECTION */
  hero: {
    margin: 16,
    marginTop: 0,
    padding: 28,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  heroDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
  },
  decorCircle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -30,
  },
  heroContent: {
    position: 'relative',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  heroEmoji: { 
    fontSize: 48,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  heroFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  confidenceMeter: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  confidenceLabel: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceLabelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confidenceValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },

  /* PULSE INDICATOR */
  pulseOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  /* CARD STYLES */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  /* SECTION HEADERS */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },

  /* PRICE CARD */
  priceCard: {
    backgroundColor: '#fff',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
  },
  priceBadge: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pcrRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
  },
  pcrItem: {
    flex: 1,
    alignItems: 'center',
  },
  pcrLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  pcrValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  pcrInterpretation: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  divider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },

  /* RADAR SECTION */
  radarContainer: {
    gap: 16,
  },
  radarSection: {
    borderTopWidth: 2,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  radarSectionLast: {
    marginTop: 8,
  },
  radarSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  radarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radarStrike: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  radarType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  radarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  radarArrow: {
    fontSize: 14,
    fontWeight: '900',
  },
  radarLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* LEVELS SECTION */
  levelsContainer: {},
  levelSection: {},
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  levelTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  levelChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 100,
  },
  levelChipStrike: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  levelChipCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },

  /* SUMMARY CARD */
  summaryCard: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  summaryContent: {},
  summaryBlock: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryIndicator: {
    width: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginTop: 2,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    fontWeight: '600',
  },
});
