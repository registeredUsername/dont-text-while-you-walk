import type { CapacitorConfig } from '@capacitor/cli';

// appId : identifiant unique dans les stores. À choisir AVANT la première publication,
// il ne pourra plus changer ensuite (voir docs/GDD.md, questions ouvertes).
const config: CapacitorConfig = {
  appId: 'com.donttextwhileyouwalk.game',
  appName: "Don't Text While You Walk",
  webDir: 'dist',
  backgroundColor: '#1d1f24',
};

export default config;
