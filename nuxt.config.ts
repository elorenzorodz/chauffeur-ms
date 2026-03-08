export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@nuxt/ui", "@nuxt/hints"],
  css: ["~/assets/css/main.css"],
  ui: {
    theme: {
      colors: ["primary", "secondary", "tertiary", "info", "success", "warning", "error", "neutral", "amber-brand"],
    },
  },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      googleMapsApiKey: "",
    },
    distanceMatrixApiKey: "",
    databaseUrl: "",
  },
});
