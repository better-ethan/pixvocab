import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { BadgeInfoIcon, ShieldCheckIcon } from "lucide-react";
import { Form, Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/plan";
import { buildPageTitle, createTrpcClient, type MatchItem } from "@/util";
import { authClient } from "@/lib/auth-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const trpc = createTrpcClient(request);

  const currentUser = await trpc.user.getCurrentUser.query();

  if (!currentUser) {
    return { subscriptionStatus: null };
  }

  const subscriptionStatus = await trpc.stripe.getSubscriptionStatus.query();

  return { subscriptionStatus };
};

export const meta: Route.MetaFunction = ({ matches }: Route.MetaArgs) => {
  const pageTitle = buildPageTitle("Pricing", matches as MatchItem[]);
  return [{ title: pageTitle }];
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();

  const trpc = createTrpcClient(request);

  const plan = formData.get("plan") as string;
  const interval = formData.get("interval") as Interval;
  const success_url = formData.get("success_url") as string;
  const cancel_url = formData.get("cancel_url") as string;

  const result = await trpc.stripe.createCheckoutSession.mutate({
    plan,
    interval,
    success_url,
    cancel_url,
  });

  return redirect(result.checkoutUrl as string);
};

interface PlanItem {
  name: string;
  price: {
    monthly: { lookup_key: string; value: string };
    annual: { lookup_key: string; value: string };
  };
  description: string;
  features: string[];
  cta: string;
  highlight: boolean;
}

const plans: PlanItem[] = [
  {
    name: "free",
    price: {
      monthly: { lookup_key: "free_monthly", value: "$0" },
      annual: { lookup_key: "free_yearly", value: "$0" },
    },
    description: "Perfect for getting started",
    features: [
      "Basic editor",
      "Create up to 3 visual vocabulary",
      "Public sharing",
    ],
    cta: "GET STARTED",
    highlight: false,
  },
  {
    name: "pro",
    price: {
      monthly: { lookup_key: "pro_monthly", value: "$9.9" },
      annual: { lookup_key: "pro_yearly", value: "$99" },
    },
    description: "Pro plan with more features and benefits",
    features: [
      "Everything in Free",
      "Unlimited visual vocabulary",
      "More features coming soon",
    ],
    cta: "GO PRO",
    highlight: true,
  },
];

type Interval = "monthly" | "annual";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "Can I cancel my subscription?",
    answer:
      "Yes, you can cancel your subscription at any time. There are no hidden fees.",
  },
  {
    question: "Can I try for free?",
    answer:
      "Absolutely, we do have a free plan that you can use to get started. Free plan has all the features of the pro plan, but with some limitations.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept all major credit cards, including Visa, MasterCard, and American Express.",
  },
];

interface CurrentPlan {
  name: string;
  interval?: Interval;
  status?: string;
}

export default function Page() {
  const { subscriptionStatus } = useLoaderData<typeof loader>();

  const currentPlan: CurrentPlan = {
    name: "free",
  };

  if (subscriptionStatus?.status === "active") {
    currentPlan.name = subscriptionStatus.plan;
    currentPlan.interval =
      subscriptionStatus.billingInterval === "year" ? "annual" : "monthly";
    currentPlan.status = subscriptionStatus.status;
  }

  return (
    <div className="flex flex-col items-center px-4 py-12 gap-24">
      <div className="flex flex-col items-center gap-4">
        <Text as="h2" className="text-center text-3xl font-bold">
          Unlock Unlimited Visual Vocabulary
        </Text>
        <Text className="text-muted-foreground text-center">
          Upgrade to create unlimited visual vocabulary and learn more
          effectively
        </Text>
      </div>
      <div className="flex flex-col items-center gap-8">
        <Tabs defaultValue="annual" className="w-full max-w-2xl">
          <TabsList className="mb-6 mx-auto shadow-sm flex gap-2">
            <TabsTrigger
              value="annual"
              className="shadow-none data-active:shadow-sm"
            >
              Annual (save ~17%)
            </TabsTrigger>
            <TabsTrigger value="monthly" className="shadow-none">
              Monthly
            </TabsTrigger>
          </TabsList>
          {(["annual", "monthly"] as Interval[]).map((interval) => (
            <TabsContent
              key={interval}
              value={interval}
              className={"flex flex-col gap-4 md:flex-row"}
            >
              {plans.map((plan) => (
                <PlanCard
                  key={plan.name}
                  plan={plan}
                  interval={interval}
                  currentPlan={currentPlan}
                />
              ))}
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex items-center gap-1 text-muted-foreground">
          <BadgeInfoIcon className="size-5" />
          <Text className="text-muted-foreground">
            Cancel anytime. No hidden fees. No credit card required for free
            plan.
          </Text>
        </div>
        <div className="flex gap-1 text-green-600">
          <span>
            <ShieldCheckIcon />
          </span>
          <Text>
            We use Stripe to process payments. Your payment information is never
            stored on our servers.
          </Text>
        </div>
      </div>
      <Faq questionsAndAnswers={faqs} />
    </div>
  );
}

function PlanCard({
  plan,
  interval,
  currentPlan,
}: {
  plan: PlanItem;
  interval: Interval;
  currentPlan?: CurrentPlan;
}) {
  const { data: session } = authClient.useSession();

  const isLoggedIn = !!session?.user;

  let isFreePlan = plan.name === "free";

  const isCurrentPlan = isFreePlan
    ? currentPlan?.name === "free"
    : currentPlan?.name === plan.name && currentPlan?.interval === interval;

  return (
    <Card
      className={cn(
        "flex flex-col flex-1 shadow-sm",
        plan.highlight ? "border-primary shadow-md" : ""
      )}
    >
      <CardContent className="flex flex-col flex-1 gap-2">
        <div className="w-full flex items-center justify-between">
          <CardTitle className="uppercase">{plan.name}</CardTitle>
          <CardAction>
            {plan.highlight && (
              <span className="bg-accent text-accent-foreground px-2 py-1 rounded">
                Recommended
              </span>
            )}
          </CardAction>
        </div>
        <div className="flex items-end gap-2 mt-4">
          <Text className="text-3xl font-bold">
            {plan.price[interval].value}
          </Text>
          <span className="text-muted-foreground mb-1">
            {interval === "annual" ? "/per year" : "/per month"}
          </span>
        </div>
        {/* {interval === "annual" && plan.highlight && (
          <span className="text-sm text-accent-foreground bg-accent px-2 py-1 w-fit rounded">
            Save ~22% with annual
          </span>
        )} */}
        <Text className="text-muted-foreground">{plan.description}</Text>
        <Text className="font-medium mb-2">What's included</Text>
        <ul className="space-y-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="bg-inherit border-none flex flex-col items-center gap-2">
        {isLoggedIn && isCurrentPlan && (
          <div className="flex items-center justify-center gap-1.5 text-base text-muted-foreground w-full">
            <BadgeInfoIcon className="size-5" />
            <span>Your current plan</span>
          </div>
        )}
        <PlanCardAction
          plan={plan}
          interval={interval}
          isLoggedIn={isLoggedIn}
          currentPlan={currentPlan}
        />
      </CardFooter>
    </Card>
  );
}

function PlanCardAction({
  plan,
  interval,
  isLoggedIn,
  currentPlan,
}: {
  plan: PlanItem;
  interval: Interval;
  isLoggedIn: boolean;
  currentPlan?: CurrentPlan;
}) {
  const isFreePlan = plan.name === "free";
  const isActivePaidSubscriber =
    !isFreePlan && currentPlan && currentPlan.name !== "free";

  // free plan
  if (isFreePlan) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full shadow-sm"
        disabled={isLoggedIn}
        render={<Link to="/signup?redirect=/pricing" />}
        nativeButton={false}
      >
        {plan.cta}
      </Button>
    );
  }

  // pro plan
  if (isActivePaidSubscriber) {
    return (
      <Button
        type="button"
        variant="secondary"
        className="w-full shadow-sm"
        render={
          <Link to="/dashboard/user/current-plan">Manage Subscription</Link>
        }
        nativeButton={false}
      />
    );
  }

  // not logged in, show login dialog
  if (!isLoggedIn) {
    return (
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant={plan.highlight ? "default" : "outline"}
              className="w-full shadow-sm"
            >
              {plan.cta}
            </Button>
          }
        ></AlertDialogTrigger>
        <AlertDialogContent className="shadow-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Please log in to continue</AlertDialogTitle>
            <AlertDialogDescription>
              Log in to purchase a subscription. If you don't have an account,
              sign up first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="shadow-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="shadow-sm"
              render={<Link to="/signin?redirect=/pricing">Log in</Link>}
            />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // logged in and not a paid subscriber, show checkout form
  return (
    <Form method="POST" className="w-full">
      <input type="hidden" name="plan" value={plan.name} />
      <input
        type="hidden"
        name="lookup_key"
        value={plan.price[interval].lookup_key}
      />
      <input type="hidden" name="interval" value={interval} />
      <input type="hidden" name="success_url" value="/pricing/success" />
      <input type="hidden" name="cancel_url" value="/pricing/cancel" />
      <Button
        type="submit"
        variant={plan.highlight ? "default" : "outline"}
        className="w-full shadow-sm"
      >
        {plan.cta}
      </Button>
    </Form>
  );
}

function Faq({ questionsAndAnswers = [] }: { questionsAndAnswers: FaqItem[] }) {
  return (
    <div className="max-w-lg mx-auto w-full">
      <Text as="h3" className="text-3xl font-bold mb-8">
        Frequently Asked Questions
      </Text>
      <div>
        <Accordion>
          {questionsAndAnswers.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="shadow-sm"
            >
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
