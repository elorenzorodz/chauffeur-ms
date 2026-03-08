<script setup>
const { $getGoogleLibrary } = useNuxtApp();
const props = defineProps({
  modelValue: Object,
  hideTabs: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: "Location",
  },
});
const emit = defineEmits(["update:location", "update:modelValue"]);

const locationPointsTabs = [
  { label: "Location", slot: "location" },
  { label: "Airport", slot: "airport" },
];

const address = ref(null);
const pickup = reactive({
  location: "",
  selectedLocation: null,
});

onMounted(async () => {
  try {
    const { Autocomplete } = await $getGoogleLibrary("places");

    const inputElement = address.value.$el.querySelector("input");
    if (!inputElement) return;

    const autocomplete = new Autocomplete(inputElement, {
      fields: ["address_components", "geometry", "name", "place_id", "formatted_address"],
      types: ["address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place || !place.geometry) {
        return;
      }

      pickup.location = place.formatted_address || place.name;

      pickup.selectedLocation = {
        address: place.formatted_address || place.name,
        placeId: place.place_id,
      };

      emit("update:location", pickup.selectedLocation);
      emit("update:modelValue", pickup.selectedLocation);
    });
  } catch (error) {
    console.error("Error loading Google Maps Places:", error);
  }
});

const clearLocation = () => {
  pickup.location = "";
  pickup.selectedLocation = null;
};

defineExpose({ clearLocation });
</script>

<template>
  <div class="w-full">
    <div v-if="hideTabs" class="relative w-full">
      <label class="absolute -top-2 left-3 px-1 bg-white text-[10px] text-gray-400 z-10">
        {{ label }}
      </label>
      <UInput ref="address" v-model="pickup.location" icon="i-lucide-map-pin" trailing-icon="i-lucide-chevron-down" class="w-full mx-auto" />
    </div>

    <UTabs
      v-else
      :items="locationPointsTabs"
      orientation="horizontal"
      size="xs"
      class="w-full"
      :ui="{
        root: 'w-full flex flex-col items-start',
        list: 'w-fit rounded-lg flex justify-start',
        container: 'w-full',
        content: 'w-full',
      }"
    >
      <template #location>
        <div class="relative w-full">
          <label class="absolute -top-2 left-3 px-1 bg-white text-[10px] text-gray-400 z-10">
            {{ label }}
          </label>
          <UInput ref="address" v-model="pickup.location" icon="i-lucide-map-pin" trailing-icon="i-lucide-chevron-down" class="w-full" />
        </div>
      </template>

      <template #airport>
        <div class="w-full p-4 border border-dashed border-gray-200 rounded-lg text-gray-400 text-sm italic">Airport selection coming soon.</div>
      </template>
    </UTabs>
  </div>
</template>
