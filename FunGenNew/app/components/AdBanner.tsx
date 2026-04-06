import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Modal, TouchableOpacity, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const AD_IDS = {
  banner: Platform.OS === 'android' ? 'ca-app-pub-5140463358652561/4048273795' : 'ca-app-pub-5140463358652561/4048273795',
  interstitial: 'ca-app-pub-5140463358652561/4757337345',
  rewarded: 'ca-app-pub-5140463358652561/8321177830',
};

export const AdBanner: React.FC = () => {
  const [loading, setLoading] = useState(true);

  const adHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; }
        body { background: #f5f5f5; }
      </style>
    </head>
    <body>
      <iframe 
        src="https://googleads.g.doubleclick.net/mads/admobe/sdk_inslider/v1?slotId=${AD_IDS.banner}"
        width="100%"
        height="50"
        scrolling="no"
        frameborder="0">
      </iframe>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: adHtml }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export const showInterstitialAd = (onClose?: () => void) => {
  const interstitialHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; }
        body { background: #000; }
        iframe { width: 100%; height: 100%; border: none; }
      </style>
    </head>
    <body>
      <iframe 
        src="https://googleads.g.doubleclick.net/mads/admobe/sdk_inslider/v1?slotId=${AD_IDS.interstitial}"
        width="100%"
        height="100%"
        scrolling="no"
        frameborder="0">
      </iframe>
    </body>
    </html>
  `;

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <WebView
          style={styles.interstitialWebview}
          originWhitelist={['*']}
          source={{ html: interstitialHtml }}
          javaScriptEnabled={true}
        />
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>X</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 50,
    backgroundColor: '#f5f5f5',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  interstitialWebview: {
    width: width * 0.9,
    height: height * 0.7,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
