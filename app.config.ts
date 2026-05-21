import { ExpoConfig, ConfigContext } from 'expo/config';

let LOCAL_MAPS_KEY = '';
try {
  LOCAL_MAPS_KEY = require('./secrets.local').MAPS_KEY ?? '';
} catch {
  // secrets.local.ts não existe — usa env apenas
}

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || LOCAL_MAPS_KEY || '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Leonardo Consultoria',
  slug: 'leonardo-mudas',
  android: {
    ...(config.android ?? {}),
    config: {
      ...(config.android?.config ?? {}),
      googleMaps: {
        apiKey: MAPS_KEY,
      },
    },
  },
});
