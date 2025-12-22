import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import PushNotification from "react-native-push-notification";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Zone = {
  strike: number;
  call_oi: number;
  call_oi_change: number;
  call_oi_change_pct: number;
  put_oi: number;
  put_oi_change: number;
  put_oi_change_pct: number;
  interpretation: string;
  interpretation_code: string;
};

type MarketData = {
  spot_price: number;
  key_indicators: {
    pcr_oi: number;
    pcr_interpretation: string;
    net_oi_change: number;
    net_oi_interpretation: string;
  };
  market_outlook: {
    direction_symbol: string;
    confidence: string;
    signals: string[];
  };
  zones: {
    support: Zone[];
    resistance: Zone[];
  };
  parallel_oi_analysis: {
    support_zone: { summary: string };
    resistance_zone: { summary: string };
    cross_strike_analysis: { bias_interpretation: string };
  };
};

const API_URL = 
  "https://drive.google.com/uc?export=download&id=1Je1mwoLqxhULWpuNknkyz6X-gg9IloVt"; // Nifty

const REFRESH_INTERVAL_MS = 60000;

const getStorageLabel = (zone: Zone, isSupport: boolean) => {
  const code = zone.interpretation_code;
  if (isSupport) {
    if (code === "STRONG_BUY") return "🟢🟢 STRONG BULLISH STORAGE";
    if (code === "HEAVY_SUPPORT") return "🟢 STORING BULLISH";
    if (code === "LONG_UNWINDING") return "🔴 STORING BEARISH";
  } else {
    if (code === "STRONG_SELL") return "🔴🔴 STRONG BEARISH STORAGE";
    if (code === "HEAVY_RESISTANCE") return "🔴 STORING BEARISH";
    if (code === "SHORT_COVERING") return "🟢 STORING BULLISH";
  }
  return "🟡 STORING RANGE";
};

const formatNumber = (num: number) => {
  if (Math.abs(num) >= 100000) return (num / 100000).toFixed(2) + "L";
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toFixed(0);
};

export default function MarketScreen() {
  const [data, setData] = useState<MarketData | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isFetchingRef = useRef(false);
  const prevIntensityRef = useRef<Record<number, number>>({});

  useEffect(() => {
    PushNotification.createChannel({
      channelId: "market-alerts",
      channelName: "Market Alerts",
      channelDescription: "Strike storage intensity alerts",
      importance: 4,
    });
  }, []);

  const checkAndNotify = (zone: Zone, isSupport: boolean) => {
    const intensity = isSupport
      ? zone.put_oi_change_pct
      : zone.call_oi_change_pct;
    const prev = prevIntensityRef.current[zone.strike] ?? 0;
    const label = getStorageLabel(zone, isSupport);

    if (
      intensity > 70 &&
      intensity > prev &&
      label.includes("STRONG")
    ) {
      PushNotification.localNotification({
        channelId: "market-alerts",
        title: "Storage Intensifying",
        message: `${zone.strike} → ${label} (${intensity.toFixed(1)}%)`,
        importance: "high",
      });
    }
    prevIntensityRef.current[zone.strike] = intensity;
  };

  const fetchData = async (source: "auto" | "manual" = "auto") => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setError("");
    try {
      const res = await fetch(API_URL, { cache: "no-store", timeout: 15000 });
      const json: MarketData = await res.json();
      if (!json || !json.zones) {
        setError("Invalid JSON format");
        return;
      }
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString());

      json.zones.support.forEach((z) => checkAndNotify(z, true));
      json.zones.resistance.forEach((z) => checkAndNotify(z, false));
    } catch (e) {
      console.error("Market fetch failed:", e);
      setError("Unable to fetch market data");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData("auto");
    const interval = setInterval(() => fetchData("auto"), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData("manual");
    setRefreshing(false);
  };

  const toggle = (strike: number) => {
    LayoutAnimation.easeInEaseOut();
    setExpanded((p) => ({ ...p, [strike]: !p[strike] }));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loading}>Loading market data…</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          {error || "No market data available"}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.symbol}>NIFTY</Text>
        <Text style={styles.price}>
          ₹{data.spot_price.toFixed(2)}
        </Text>
        <Text style={styles.outlook}>
          {data.market_outlook.direction_symbol} · Storage View · {data.market_outlook.confidence}
        </Text>
        <Text style={styles.timestamp}>
          Updated: {lastUpdate}
        </Text>
      </View>

      {/* SUPPORT */}
      <Text style={styles.sectionTitle}>🟢 Support Storage</Text>
      <Text style={styles.zoneSummary}>
        {data.parallel_oi_analysis.support_zone.summary}
      </Text>

      {data.zones.support.map((z) => (
        <TouchableOpacity
          key={z.strike}
          style={styles.card}
          onPress={() => toggle(z.strike)}
        >
          <Text style={styles.strike}>{z.strike}</Text>
          <Text style={styles.label}>{getStorageLabel(z, true)}</Text>
          {expanded[z.strike] && (
            <View style={styles.details}>
              <Text>Put OI: {formatNumber(z.put_oi)} ({z.put_oi_change_pct.toFixed(1)}%)</Text>
              <Text>Call OI: {formatNumber(z.call_oi)} ({z.call_oi_change_pct.toFixed(1)}%)</Text>
              <Text style={styles.note}>{z.interpretation}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* RESISTANCE */}
      <Text style={styles.sectionTitle}>🔴 Resistance Storage</Text>
      <Text style={styles.zoneSummary}>
        {data.parallel_oi_analysis.resistance_zone.summary}
      </Text>

      {data.zones.resistance.map((z) => (
        <TouchableOpacity
          key={z.strike}
          style={styles.card}
          onPress={() => toggle(z.strike)}
        >
          <Text style={styles.strike}>{z.strike}</Text>
          <Text style={styles.label}>{getStorageLabel(z, false)}</Text>
          {expanded[z.strike] && (
            <View style={styles.details}>
              <Text>Call OI: {formatNumber(z.call_oi)} ({z.call_oi_change_pct.toFixed(1)}%)</Text>
              <Text>Put OI: {formatNumber(z.put_oi)} ({z.put_oi_change_pct.toFixed(1)}%)</Text>
              <Text style={styles.note}>{z.interpretation}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <Text style={styles.footer}>
        ℹ️ Strike-wise storage information only. No trading advice.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loading: { color: "#94a3b8", marginTop: 12 },
  error: { color: "red", marginTop: 8, textAlign: "center" },
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  header: { marginBottom: 20 },
  symbol: { fontSize: 22, fontWeight: "700", color: "#fff" },
  price: { fontSize: 34, fontWeight: "800", color: "#22c55e" },
  outlook: { color: "#94a3b8", marginTop: 4 },
  timestamp: { fontSize: 12, color: "#64748b", marginTop: 4 },
  sectionTitle: { marginTop: 20, fontSize: 20, fontWeight: "700", color: "#e5e7eb" },
  zoneSummary: { color: "#94a3b8", marginVertical: 6, textAlign: "center" },
  card: {
    backgroundColor: "#020617",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  strike: { fontSize: 22, fontWeight: "700", color: "#f8fafc" },
  label: { marginTop: 4, color: "#a5f3fc" },
  details: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#1e293b", paddingTop: 8 },
  note: { marginTop: 6, fontSize: 12, color: "#cbd5e1", textAlign: "center" },
  footer: { marginTop: 24, fontSize: 12, color: "#64748b", textAlign: "center" },
});
