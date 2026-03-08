import { users } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const { phoneNumber } = await readBody(event);

  if (!phoneNumber) {
    throw createError({ statusCode: 400, statusMessage: "Missing phone number" });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.phoneNumber, phoneNumber),
    });

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: "Phone number not found" });
    }

    return { status: "success", user };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
