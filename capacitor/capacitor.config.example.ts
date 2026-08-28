import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "id.kasa.kasir",
  appName: "KASA",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
};

export default config;
