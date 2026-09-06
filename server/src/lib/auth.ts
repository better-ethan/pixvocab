import { betterAuth } from "better-auth";
import { stripe } from "@better-auth/stripe";
import { captcha, admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  db,
  user,
  session,
  account,
  verification,
  subscription,
} from "@package/drizzle";
import { sendMail } from "./email.js";
import { stripe as stripeClient } from "./stripe.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    debugLogs: true,
    schema: { user, session, account, verification, subscription },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      // Admin plugin fields (in schema order)
      role: "user", // or your configured defaultRole
      banned: false,
      banReason: null,
      banExpires: null,
      ...additionalFields,
      id,
    }),
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        from: "thisisethanlee@gmail.com",
        to: user.email,
        subject: "Reset your password",
        html: `<p>You requested a password reset. Click the link below to reset your password:</p>
              <a href="${url}">Reset Password</a>
              <p>If you did not request this, please ignore this email.</p>
              `,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMail({
        from: "thisisethanlee@gmail.com",
        to: user.email,
        subject: "Verify your email",
        text: `Please verify your email by clicking the following link: ${url}`,
        html: `<p>Please verify your email by clicking the link below:</p>
              <a href="${url}">Verify Email</a>
              `,
      });
    },
    autoSignInAfterVerification: true,
  },
  trustedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
  logger: {
    level: "debug",
  },
  user: {
    additionalFields: {
      description: {
        type: "string",
        required: false,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      overrideUserInfoOnSignIn: true,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      updateUserInfoOnLink: true,
      allowDifferentEmails: true,
    },
  },
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "pro",
            lookupKey: "pro_monthly",
            annualDiscountLookupKey: "pro_yearly",
          },
        ],
      },
    }),
    captcha({
      provider: "google-recaptcha",
      secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY!,
    }),
    admin(),
  ],
});
