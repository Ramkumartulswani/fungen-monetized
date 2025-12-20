import { NativeModules, Platform } from 'react-native';

type FeatureFlags = {
  paywallEnabled: boolean;
  premiumEnabled: boolean;
  maxFreeUses: number;
  showUpgradeBanner: boolean;
  showMarketProBanner: boolean; // 👈 NEW
};

const defaultFlags: FeatureFlags = {
  paywallEnabled: false,
  premiumEnabled: true,
  maxFreeUses: 5,
  showUpgradeBanner: false,
  showMarketProBanner: true, // 👈 DEFAULT = existing behaviour
};


export async function getFeatureFlags(): Promise<FeatureFlags> {
  if (Platform.OS !== 'android') {
    return defaultFlags;
  }

  try {
    const nativeFlags = await NativeModules.FeatureFlags?.getFlags?.();
    return {
  ...defaultFlags,
  ...nativeFlags,
  showMarketProBanner:
    nativeFlags?.showMarketProBanner ?? true,
};

  } catch (e) {
    return defaultFlags;
  }
}
