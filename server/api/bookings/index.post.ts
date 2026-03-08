import { users, bookings, bookingStops } from "~~/server/db/schema";
import { BookingForm } from "~~/shared/types/bookingForm";

export default defineEventHandler(async (event) => {
  const bookingForm = await readBody<BookingForm>(event);

  if (!bookingForm) {
    throw createError({ statusCode: 400, statusMessage: "Missing booking data" });
  }

  try {
    let userId = bookingForm.userId;

    if (!userId) {
      // New user.
      const [newUser] = await db
        .insert(users)
        .values({
          firstName: bookingForm.firstName,
          lastName: bookingForm.lastName,
          email: bookingForm.email,
          phoneNumber: bookingForm.phoneNumber,
        })
        .returning();

      userId = newUser!.id;
    }

    const [booking] = await db
      .insert(bookings)
      .values({
        pickupDate: new Date(bookingForm.pickupDate),
        pickupTime: bookingForm.pickupTime,
        pickup: bookingForm.pickup,
        dropOff: bookingForm.dropOff,
        numberOfPassengers: bookingForm.numberOfPassengers,
        userId: userId,
      })
      .returning();

    // Save stops.
    if (bookingForm.stops) {
      const stopAddresses = bookingForm.stops.split("~");
      const stops = stopAddresses.map((stop) => ({
        stop,
        bookingId: booking!.id,
      }));

      await db.insert(bookingStops).values(stops);
    }

    return { status: "success", statusMessage: "Successfully created booking." };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
