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
import { Form, Link, useSearchParams } from "react-router";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import ReCAPTCHA from "react-google-recaptcha";
import { PasswordInput } from "@/components/ui/password-input";
import { Field } from "@/components/ui/field";
import { DividerWithText, GoogleSignInButton } from "@/components/partial";
import type { Route } from "./+types/signin";
import { buildPageTitle, type MatchItem } from "@/util";
import { Loader2Icon } from "lucide-react";

export const meta: Route.MetaFunction = ({ matches }: Route.MetaArgs) => {
  const pageTitle = buildPageTitle("Sign in", matches as MatchItem[]);
  return [{ title: pageTitle }];
};

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard/user/profile";

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [isOperating, setIsOperating] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsOperating(true);

    const recaptchaToken = await recaptchaRef.current?.executeAsync();

    if (!recaptchaToken) return;

    const { data, error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: redirectTo,
      fetchOptions: {
        headers: {
          "x-captcha-response": recaptchaToken,
        },
        onRequest: (ctx) => {
          toast.info("Sign in in progress...");
        },
        onSuccess: () => {
          toast.success("Sign in successful!");
        },
        onError: (ctx) => {
          if (ctx.error.code === "EMAIL_NOT_VERIFIED") {
            toast.error(`Please verify your email address before signing in.`);
          } else {
            toast.error(`Sign in failed: ${ctx.error.message}`);
          }
        },
      },
    });

    if (error) {
      toast.error(`Sign in failed: ${error.message}`);
    }

    setIsOperating(false);

    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Welcome back! Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <GoogleSignInButton />
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="shadow-sm"
              />
            </Field>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY!}
              size="invisible"
            />
            <Link
              to="/user/request-reset-password"
              className="text-end text-blue-600 hover:underline"
            >
              <Text>Forget password?</Text>
            </Link>
            <Button type="submit" className="shadow-sm" disabled={isOperating}>
              Sign In{" "}
              {isOperating && (
                <Loader2Icon className="ml-2 size-4 animate-spin" />
              )}
            </Button>
          </Form>
          <Text className="text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link to="/signup" className="ml-2 text-blue-600 hover:underline">
              Create one
            </Link>
          </Text>
        </CardContent>
      </Card>
    </div>
  );
}
