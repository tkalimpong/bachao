import type { CapacitorConfig } from '@capacitor/cli';
import { APP_ID, APP_NAME } from './src/lib/appBrand';

const config: CapacitorConfig = {
  appId: APP_ID,
  appName: APP_NAME,
  webDir: 'dist',
};

export default config;
