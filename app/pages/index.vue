<script setup lang="ts">
import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";
import { FetchError } from "ofetch";
import type { BookingForm } from "~~/shared/types/bookingForm";

const currentDateTime = new Date().toISOString();
const currentDate = currentDateTime.split("T")[0];

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

const toast = useToast();
const bookingTabs = [
  { label: "One-way", icon: "i-lucide-circle-arrow-right", slot: "one-way" },
  { label: "Hourly", icon: "i-lucide-hourglass", slot: "hourly" },
];
const phoneNumber = ref("");
const showGreetingOrForm = ref(false);
const isNewCustomer = ref(false);
const reactiveData = reactive({
  user: null,
  formSubmitted: false,
  invalidEmail: false,
});
const booking = reactive({
  date: currentDate,
  time: getCurrentTime(),
  pickup: "",
  dropOff: "",
  firstName: "",
  lastName: "",
  email: "",
  passengers: 1,
});
const locationData = reactive({
  pickupPlaceId: "",
  dropOffPlaceId: "",
  distance: "",
  duration: "",
  stops: [],
});

const formatPhoneNumber = (val: string) => {
  const formatter = new AsYouType();

  phoneNumber.value = formatter.input(val);

  // If phone number is valid. Check for user information.
  if (parsePhoneNumberFromString(phoneNumber.value)?.isValid()) {
    checkPhone();
  } else {
    showGreetingOrForm.value = false;
  }
};

const countryCode = computed(() => {
  const phoneNumberToValidate = parsePhoneNumberFromString(phoneNumber.value);

  return phoneNumberToValidate?.country?.toLowerCase() || "us";
});

const checkPhone = async () => {
  try {
    const { user } = await $fetch("/api/users/check-phone", {
      method: "POST",
      body: { phoneNumber: parsePhoneNumberFromString(phoneNumber.value)!.number },
    });

    reactiveData.user = user;

    showGreetingOrForm.value = true;
    isNewCustomer.value = false;
  } catch (err: unknown) {
    if (err instanceof FetchError && err.data.statusCode === 404) {
      showGreetingOrForm.value = true;
      isNewCustomer.value = true;
    } else {
      toast.add({
        title: "Error",
        description: "An unexpected error occurred.",
        color: "error",
      });
    }
  }
};

const updateLocation = (data: any, type: string) => {
  if (!data) {
    return;
  }

  if (type === "pickup") {
    booking.pickup = data.address;
    locationData.pickupPlaceId = data.placeId;
  } else {
    booking.dropOff = data.address;
    locationData.dropOffPlaceId = data.placeId;
  }
};

watch(
  () => [locationData.pickupPlaceId, locationData.dropOffPlaceId, locationData.stops.map((s) => s.placeId)],
  async ([newPickup, newDest]) => {
    if (newPickup && newDest) {
      try {
        const { distance, duration } = await $fetch("/api/distance", {
          method: "POST",
          body: { pickupId: newPickup, dropOffId: newDest, stopIds: locationData.stops.map((x) => x.placeId).join(",") },
        });

        if (distance && duration) {
          locationData.distance = distance;
          locationData.duration = duration;
        }
      } catch (err: unknown) {
        if (err instanceof FetchError) {
          toast.add({
            title: "Error",
            description: err.data?.statusMessage || "Failed to calculate distance and travel time.",
            color: "error",
          });
        } else {
          toast.add({
            title: "Error",
            description: "An unexpected error occurred.",
            color: "error",
          });
        }
      }
    } else {
      locationData.distance = "";
      locationData.duration = "";
    }
  },
);

const addStop = () => {
  const newStop = {
    type: "stop",
    address: "",
    placeId: "",
  };

  locationData.stops.splice(locationData.stops.length - 1, 0, newStop);
};

const removeStop = (index) => {
  locationData.stops.splice(index, 1);
};

const pickupLocationRef = ref(null);
const dropOffLocationRef = ref(null);

const submitBooking = async () => {
  reactiveData.formSubmitted = false;

  let bookingForm: BookingForm = {
    pickupDate: booking.date,
    pickupTime: booking.time,
    pickup: booking.pickup,
    dropOff: booking.dropOff,
    numberOfPassengers: booking.passengers,
  };

  reactiveData.formSubmitted = true;

  if (!phoneNumber.value) {
    return;
  }

  if (!reactiveData.user) {
    // New user.
    bookingForm.firstName = booking.firstName;
    bookingForm.lastName = booking.lastName;
    bookingForm.email = booking.email;

    reactiveData.invalidEmail = false;
    const emailPattern = /^[A-Za-z0-9._\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,15}$/;

    if (!emailPattern.test(bookingForm.email)) {
      reactiveData.invalidEmail = true;

      return;
    }

    if (!bookingForm.firstName || !bookingForm.lastName) {
      return;
    }
  } else {
    bookingForm.userId = reactiveData.user.id;
  }

  bookingForm.phoneNumber = parsePhoneNumberFromString(phoneNumber.value)!.number;

  if (!bookingForm.pickup || !bookingForm.dropOff) {
    return;
  }

  bookingForm.stops = locationData.stops.map((x) => x.address).join("~");

  try {
    await $fetch("/api/bookings", {
      method: "POST",
      body: bookingForm,
    });

    phoneNumber.value = "";
    booking.pickup = "";
    booking.dropOff = "";
    booking.passengers = 1;

    if (!reactiveData.user) {
      booking.firstName = "";
      booking.lastName = "";
      booking.email = "";
    }

    locationData.stops = [];
    pickupLocationRef.value?.clearLocation();
    dropOffLocationRef.value?.clearLocation();

    reactiveData.formSubmitted = false;
    showGreetingOrForm.value = false;
    isNewCustomer.value = false;

    toast.add({
      title: "Success",
      description: "Successfully booked.",
      color: "success",
    });
  } catch (err: unknown) {
    if (err instanceof FetchError) {
      toast.add({
        title: "Error",
        description: err.data?.statusMessage || "Registration failed",
        color: "error",
      });
    } else {
      toast.add({
        title: "Error",
        description: "An unexpected error occurred.",
        color: "error",
      });
    }
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#fbf9fa] p-4">
    <div class="w-full max-w-[540px] bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
      <div class="flex flex-col items-center mb-4">
        <div class="flex items-center gap-2 text-[#5e6ba1] font-bold text-2xl">
          <UIcon name="i-lucide-car-front" class="size-8" />
          <span>Chauffeur MS</span>
        </div>
      </div>

      <h1 class="text-3xl font-light mb-6 text-gray-800 tracking-tight text-center">Let's get you on your way!</h1>

      <UTabs
        :items="bookingTabs"
        class="w-full"
        :ui="{
          trigger: 'cursor-pointer',
        }"
      >
        <template #one-way>
          <div class="mt-2 space-y-2">
            <section class="space-y-2">
              <h2 class="font-bold text-gray-900">Pickup</h2>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <UInput v-model="booking.date" type="date" icon="i-lucide-calendar" />
                <UInput v-model="booking.time" type="time" icon="i-lucide-clock" />
              </div>

              <div class="flex gap-2">
                <LocationPoints ref="pickupLocationRef" @update:location="(payload) => updateLocation(payload, 'pickup')" />
              </div>
              <p v-if="reactiveData.formSubmitted && !booking.pickup" class="text-xs text-red-500 italic">Please enter a pickup location.</p>

              <div class="grid grid-cols-1">
                <div v-for="(stop, index) in locationData.stops" :key="stop.id" class="mt-1 flex items-center">
                  <div class="flex w-full">
                    <LocationPoints v-model="locationData.stops[index]" hide-tabs label="Stop" />
                    <UButton icon="i-lucide-trash-2" color="error" variant="ghost" @click="removeStop(index)" />
                  </div>
                  <p v-if="reactiveData.formSubmitted && !locationData.stops[index].placeId" class="text-xs text-red-500 italic">
                    Please enter a stop location.
                  </p>
                </div>
              </div>
              <UButton label="+ Add a stop" variant="link" class="text-[#d4bc6e] p-0 font-normal text-sm cursor-pointer" @click="addStop" />
            </section>

            <section class="space-y-2 mb-4">
              <h2 class="font-bold text-gray-900">Drop off</h2>
              <div class="flex gap-2">
                <LocationPoints ref="dropOffLocationRef" @update:location="(payload) => updateLocation(payload, 'dropoff')" />
              </div>
              <p v-if="reactiveData.formSubmitted && !booking.dropOff" class="text-xs text-red-500 italic">Please enter a drop off location.</p>
            </section>

            <section v-if="booking.pickup && booking.dropOff" class="space-y-2 mb-4 italic font-bold">
              <p>Distance: {{ locationData.distance }}</p>
              <p>Duration: {{ locationData.duration }}</p>
            </section>

            <section class="space-y-2">
              <h2 class="font-bold text-gray-900">Contact Information</h2>
              <UInput v-model="phoneNumber" placeholder="+1 774 415 3244" class="w-full" @update:model-value="formatPhoneNumber">
                <template #leading>
                  <div class="flex items-center">
                    <UIcon :name="`i-circle-flags-${countryCode}`" class="size-5 shadow-sm rounded-full" />
                  </div>
                </template>
              </UInput>

              <p
                v-if="(reactiveData.formSubmitted && !phoneNumber) || (phoneNumber && !parsePhoneNumberFromString(phoneNumber)?.isValid())"
                class="text-xs text-red-500 italic"
              >
                Please enter a valid phone number.
              </p>

              <div v-if="showGreetingOrForm">
                <div v-if="isNewCustomer">
                  <p class="text-xs text-gray-500 italic mt-4">
                    We don't have that phone number on file. Please provide additional contact information.
                  </p>

                  <div class="grid grid-cols-2 gap-4 mt-4">
                    <div class="relative">
                      <label class="absolute -top-2 left-3 px-1 bg-white text-[10px] text-gray-400 z-10">First name</label>
                      <UInput v-model="booking.firstName" icon="i-lucide-user" class="w-full" required />
                      <p v-if="reactiveData.formSubmitted && !booking.firstName" class="text-xs text-red-500 italic">Please enter your first name.</p>
                    </div>
                    <div class="relative">
                      <label class="absolute -top-2 left-3 px-1 bg-white text-[10px] text-gray-400 z-10">Last name</label>
                      <UInput v-model="booking.lastName" icon="i-lucide-user" class="w-full" />
                      <p v-if="reactiveData.formSubmitted && !booking.lastName" class="text-xs text-red-500 italic">Please enter your last name.</p>
                    </div>
                  </div>

                  <div class="relative mt-4">
                    <label class="absolute -top-2 left-3 px-1 bg-white text-[10px] text-gray-400 z-10">Email</label>
                    <UInput v-model="booking.email" placeholder="name@example.com" icon="i-lucide-mail" class="w-full" type="email" />
                    <p v-if="reactiveData.formSubmitted && reactiveData.invalidEmail" class="text-xs text-red-500 italic">Invalid email.</p>
                  </div>
                </div>
                <div v-else>
                  <p class="text-lg">Hi {{ reactiveData.user?.firstName }}!</p>
                </div>
              </div>
            </section>

            <section class="space-y-2 mt-4">
              <p class="text-sm text-gray-600">How many passengers are expected for the trip?</p>
              <div class="grid grid-cols-2 gap-4 mt-4">
                <div class="relative">
                  <label class="absolute -top-2 left-3 px-1 bg-white text-[10px] text-gray-400 z-10"># of Passengers</label>
                  <UInput v-model="booking.passengers" type="number" placeholder="#" class="w-full" />
                </div>
              </div>
            </section>

            <UButton
              label="Continue"
              block
              class="rounded-md font-bold bg-[#d4bc6e] hover:bg-[#c4a75d] text-white shadow-none mt-4"
              @click="submitBooking"
            />
          </div>
        </template>

        <template #hourly>
          <div class="mt-8 p-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">Hourly booking is coming soon.</div>
        </template>
      </UTabs>
    </div>
  </div>
</template>
