import { buildPageTitle, createTrpcClient, type MatchItem } from "@/util";
import type { Route } from "./+types/current-plan";
import { Form, Link, redirect, useLoaderData } from "react-router";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CircleAlertIcon } from "lucide-react";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const trpc = createTrpcClient(request);

  const subscriptionRecord = await trpc.stripe.getSubscriptionStatus.query();

  return subscriptionRecord;
};

export const meta: Route.MetaFunction = ({ matches }: Route.MetaArgs) => {
  const pageTitle = buildPageTitle("My plan", matches as MatchItem[]);
  return [{ title: pageTitle }];
};

export const action = async ({ request }: Route.ActionArgs) => {
  const trpc = createTrpcClient(request);

  const result = await trpc.stripe.createPortalSession.mutate({
    returnUrl: `${new URL(request.url).origin}/dashboard/user/current-plan`,
  });

  return redirect(result.portalUrl as string);
};

export default function Page() {
  const subscriptionRecord = useLoaderData<typeof loader>();

  const isActive = subscriptionRecord?.status === "active";
  const isExpired = subscriptionRecord?.status === "expired";
  const isCanceled = !!isActive && subscriptionRecord?.canceledAt;
  const isPro = isActive;
  const isAnnualPlan = subscriptionRecord?.billingInterval === "year";

  const formattedDate = subscriptionRecord?.periodEnd
    ? new Date(subscriptionRecord.periodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex justify-center items-start h-dvh w-full p-2">
      <Card className="w-full max-w-lg sm:min-w-96 shadow-sm">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-base">
          {/* Plan Name */}
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold capitalize">
              {isPro ? subscriptionRecord.plan : "Free"}
            </p>
            {isPro && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize shadow-sm shadow-primary">
                {isAnnualPlan ? "annual" : "monthly"}
              </span>
            )}
          </div>

          {/* Free - never subscribed */}
          {!subscriptionRecord && (
            <>
              <p className="text-muted-foreground">Create up to 3 vocabs.</p>
            </>
          )}

          {/* Pro - active and not canceled */}
          {isPro && !isCanceled && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">Active</span>
                </div>
                {formattedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Renews on</span>
                    <span className="font-medium">{formattedDate}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Pro - active but canceled (cancel at period end) */}
          {isPro && isCanceled && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">Active</span>
                </div>
                {formattedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ends on</span>
                    <span className="font-medium">{formattedDate}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-red-600">
                <CircleAlertIcon /> <span>Auto-renew is off.</span>
              </div>
            </>
          )}

          {/* Expired */}
          {isExpired && (
            <>
              <p className="text-muted-foreground">
                Your Pro subscription expired on {formattedDate}.
              </p>
            </>
          )}
        </CardContent>
        <CardFooter className="bg-inherit border-none">
          {(!subscriptionRecord || isExpired) && (
            <Button
              variant="secondary"
              className="w-full shadow-sm"
              render={<Link to="/pricing">Upgrade to Pro</Link>}
              nativeButton={false}
            ></Button>
          )}
          {isPro && !isCanceled && (
            <Form method="post" className="w-full">
              <Button
                type="submit"
                variant="secondary"
                className={"w-full shadow-sm"}
              >
                Manage Subscription
              </Button>
            </Form>
          )}
          {isPro && isCanceled && (
            <Form method="post" className="w-full">
              <Button
                type="submit"
                variant="secondary"
                className={"w-full shadow-sm"}
              >
                Resume Subscription
              </Button>
            </Form>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
