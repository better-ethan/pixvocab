import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Form, Link } from "react-router";
import type { Route } from "./+types/signup";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import ReCAPTCHA from "react-google-recaptcha";
import { PasswordInput } from "@/components/ui/password-input";
import { Field } from "@/components/ui/field";
import { DividerWithText, GoogleSignInButton } from "@/components/partial";
import { buildPageTitle, type MatchItem } from "@/util";

export const meta: Route.MetaFunction = ({ matches }: Route.MetaArgs) => {
  const pageTitle = buildPageTitle("Sign up", matches as MatchItem[]);
  return [{ title: pageTitle }];
};

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const recaptchaToken = await recaptchaRef.current?.executeAsync();

    if (!recaptchaToken) return;

    if (password !== confirmPassword) {
      toast.error("Password and confirm password do not match!");
      return;
    }

    const { data, error } = await authClient.signUp.email(
      {
        email,
        password,
        name: email.split("@")[0],
        callbackURL: `${window.location.origin}/`,
        fetchOptions: {
          headers: {
            "x-captcha-response": recaptchaToken,
          },
          onRequest: () => {
            toast.info("Sign up in progress...");
          },
          onSuccess: () => {
            setSignUpSuccess(true);
            toast.success(
              "Sign up successful! Please check your email to verify your account."
            );
          },
          onError(ctx: { error: { message: string } }) {
            toast.error(`Sign up failed: ${ctx.error.message}`);
          },
        },
      },
      {}
    );

    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const [cooldown, setCooldown] = useState(0);

  const handleResendVerification = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);

    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/dashboard/user/profile`,
    });

    if (error) {
      toast.error("Failed to resend verification email. Please try again.");
    } else {
      toast.success("Verification email resent! Please check your inbox.");
      setCooldown(60); // Set cooldown to 60 seconds
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    setIsResending(false);
  };

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-100 shadow-sm">
        <CardHeader>
          {signUpSuccess ? (
            <CardTitle className="text-2xl">Account Created!</CardTitle>
          ) : (
            <>
              <CardTitle className="text-2xl">Create your Account</CardTitle>
              <CardDescription>
                Welcome! Please fill in the details to get started.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {signUpSuccess ? (
            <div className="flex flex-col items-center gap-4">
              <Text>Please check your email to verify your account.</Text>
              <Text className="text-gray-500">Don't receive the email?</Text>
              <Button
                disabled={isResending || cooldown > 0}
                variant="secondary"
                onClick={handleResendVerification}
                className={"shadow-sm"}
              >
                {isResending
                  ? "Sending..."
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend Verification Email"}
              </Button>
            </div>
          ) : (
            <>
              <GoogleSignInButton text="Sign up with Google" />
              <DividerWithText text="or" />
              <Form
                method="POST"
                className="flex flex-col gap-6"
                onSubmit={handleSubmit}
              >
                <Field>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="shadow-sm"
                  />
                </Field>
                <Field>
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    type="password"
                    id="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="shadow-sm"
                  />
                </Field>
                <Field>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="shadow-sm"
                  />
                </Field>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY!}
                  size="invisible"
                />
                <Button type="submit" className="shadow-sm">
                  Sign Up
                </Button>
              </Form>
              <Text className="text-muted-foreground mt-8">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="ml-2 text-blue-600 hover:underline"
                >
                  Sign In
                </Link>
              </Text>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
