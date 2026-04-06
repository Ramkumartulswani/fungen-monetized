import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const PROD_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';

interface AdBannerProps {
  isTestMode?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ isTestMode = true }) => {
  const bannerId = isTestMode ? TEST_BANNER_ID : PROD_BANNER_ID;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={bannerId}
        size={BannerAdSize.ANCHORED_ADAPTER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: isTestMode,
        }}
      />
    </View>
  );
};

export default AdBanner;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
