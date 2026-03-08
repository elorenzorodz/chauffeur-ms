import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  setOptions({
    key: config.public.googleMapsApiKey,
    authReferrerPolicy: "origin",
  });

  return {
    provide: {
      getGoogleLibrary: (name) => importLibrary(name),
    },
  };
});
