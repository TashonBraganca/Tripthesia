import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { db } from "./db";
import { users, profiles } from "../../../infra/schema";

export async function getCurrentUser() {
  const { userId } = auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  // Ensure user exists in our database
  await db
    .insert(users)
    .values({
      id: userId,
      email: user.emailAddresses[0]?.emailAddress ?? "",
    })
    .onConflictDoNothing();

  return {
    id: userId,
    email: user.emailAddresses[0]?.emailAddress ?? "",
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export async function getUserProfile(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.userId, userId),
  });

  return profile;
}

export async function createOrUpdateProfile(
  userId: string,
  data: Partial<typeof profiles.$inferInsert>
) {
  return await db
    .insert(profiles)
    .values({
      userId,
      ...data,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: data,
    })
    .returning();
}