"use client";

import PocketBase from "pocketbase";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

let client;

/** Returns a singleton PocketBase client bound to the browser's authStore. */
export function pb() {
  if (!client) {
    client = new PocketBase(POCKETBASE_URL);
    client.autoCancellation(false);
  }
  return client;
}

export function fileUrl(record, filename, thumb) {
  if (!record || !filename) return "";
  return pb().files.getURL(record, filename, thumb ? { thumb } : undefined);
}

export function currentUser() {
  return pb().authStore.record;
}

export function isLoggedIn() {
  return pb().authStore.isValid;
}

export function hasStaffRole() {
  const user = currentUser();
  return !!user && (user.role === "admin" || user.role === "operator");
}

export async function logout() {
  pb().authStore.clear();
}
