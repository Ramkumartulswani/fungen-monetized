import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const AD_UNIT_ID = 'ca-app-pub-5140463358652561/5622690496';
const TEST_AD_URL = 'https://googleads.g.doubleclick.net/mads/static/mad_sdk.html';

interface AdBannerProps {
  isTestMode?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ isTestMode = false }) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const adHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      <style>
        * { margin: 0; padding: 0; }
        html, body { height: 100%; background: transparent; }
        .ad-container {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f5f5f5;
        }
        .ad-container iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
      </style>
    </head>
    <body>
      <div class="ad-container">
        <iframe 
          src="https://googleads.g.doubleclick.net/mads/admobe/sdk_inslider/v1?slotId=/30497360/ca-app-pub-5140463358652561/5622690496&___ad_format=image&__ad_slot_type=DEPRECATED_MRAID_SIMPLE_AD&__caa_sample_key=a&__caa_key=dsp&__direct_vast_return_flag=0&__key=pubid&__mraid_expand=0&__network_code=30497360&__template_type=html&__tracking_supported=1&__unique_request_id=1&__wtv=1&__zone=/30497360/ca-app-pub-5140463358652561/5622690496&dsp=${encodeURIComponent('ca-app-pub-5140463358652561/5622690496')}"
          scrolling="no"
          frameborder="0">
        </iframe>
      </div>
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
        ref={webViewRef}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: adHtml }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        setSupportMultipleWindows={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default AdBanner;

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 60,
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
    backgroundColor: '#f5f5f5',
  },
});
