import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const APP_ID = 'ca-app-pub-5140463358652561~3341696785';
const BANNER_AD_UNIT_ID = __DEV__ 
  ? 'ca-app-pub-3940256099942544/6300978111' 
  : 'ca-app-pub-5140463358652561/5622690496';

interface AdBannerProps {
  isTestMode?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ isTestMode = __DEV__ }) => {
  const bannerId = isTestMode ? TestIds.BANNER : BANNER_AD_UNIT_ID;

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
