import { NativeModules, Platform } from 'react-native';

type FeatureFlags = {
  paywallEnabled: boolean;
  premiumEnabled: boolean;
  maxFreeUses: number;
  showUpgradeBanner: boolean;
};

const defaultFlags: FeatureFlags = {
  paywallEnabled: false,
  premiumEnabled: true,
  maxFreeUses: 5,
  showUpgradeBanner: false,
};

export async function getFeatureFlags(): Promise<FeatureFlags> {
  if (Platform.OS !== 'android') {
    return defaultFlags;
  }

  try {
    const nativeFlags = await NativeModules.FeatureFlags?.getFlags?.();
    return { ...defaultFlags, ...nativeFlags };
  } catch (e) {
    return defaultFlags;
  }
}
