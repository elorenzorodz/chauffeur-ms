import { Client, TravelMode } from "@googlemaps/google-maps-services-js";
import { param } from "drizzle-orm";

const client = new Client({});

export default defineEventHandler(async (event) => {
  const { pickupId, dropOffId, stopIds } = await readBody(event);
  const config = useRuntimeConfig();

  try {
    if (!stopIds) {
      const response = await client.distancematrix({
        params: {
          origins: [`place_id:${pickupId}`],
          destinations: [`place_id:${dropOffId}`],
          mode: TravelMode.driving,
          key: config.distanceMatrixApiKey,
        },
        timeout: 1000,
      });

      const data = response.data.rows[0].elements[0];

      if (data.status !== "OK") {
        throw createError({
          statusCode: 400,
          statusMessage: "Route not found",
        });
      }

      return {
        distance: data.distance.text,
        duration: data.duration.text,
      };
    } else {
      const stopIdArray = stopIds.split(",");

      const response = await client.directions({
        params: {
          origin: `place_id:${pickupId}`,
          destination: `place_id:${dropOffId}`,
          waypoints: stopIdArray.map((id: string) => `place_id:${id}`),
          mode: TravelMode.driving,
          key: config.distanceMatrixApiKey,
        },
        timeout: 1000,
      });

      const route = response.data.routes[0];

      const totalDistance = route.legs.reduce((acc, leg) => acc + leg.distance.value, 0);
      const totalDuration = route.legs.reduce((acc, leg) => acc + leg.duration.value, 0);

      return {
        distance: `${(totalDistance / 1000).toFixed(1)} km`,
        duration: `${Math.round(totalDuration / 60)} mins`,
      };
    }
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Google Maps API Error",
    });
  }
});
