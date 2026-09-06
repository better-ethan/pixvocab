import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import { adminClient } from "better-auth/client/plugins";

const getBaseURL = () => {
  if (typeof window === "undefined") return "http://localhost:3000";
  return `${window.location.protocol}//${window.location.hostname}:3000`;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    stripeClient({
      subscription: true,
    }),
    adminClient(),
  ],
});
