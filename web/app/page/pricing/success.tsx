import { createTrpcClient } from "@/util";
import type { Route } from "./+types/success";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useLoaderData } from "react-router";
import { CheckCircle, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  const trpc = createTrpcClient(request);

  if (!sessionId) {
    throw new Error("Missing session_id");
  }

  const checkoutSession = await trpc.stripe.retrieveCheckoutSession.query({
    sessionId,
  });

  return checkoutSession;
};

export default function Page() {
  const { plan, interval, paymentStatus, amount } =
    useLoaderData<typeof loader>();

  const isPaid = paymentStatus === "paid";
  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center pb-2">
          {isPaid && (
            <div className="flex justify-center mb-4">
              <div
                className={cn(
                  "w-24 h-24 bg-green-500 rounded-full",
                  "flex justify-center items-center"
                )}
              >
                <CheckIcon className="size-12 text-white" />
              </div>
            </div>
          )}
          <CardTitle className="text-2xl font-bold">
            {isPaid ? "Payment Successful!" : "Processing Payment..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-center">
          <p className="text-muted-foreground">
            {isPaid
              ? "Thank you for your purchase. Your subscription is now active."
              : "Your payment is being processed. Please wait a moment."}
          </p>

          <div className="bg-yellow-50 rounded-lg p-4 flex flex-col gap-4 text-left">
            {plan && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium capitalize">{plan}</span>
              </div>
            )}
            {interval && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billing</span>
                <span className="font-medium capitalize">{interval}ly</span>
              </div>
            )}
            {amount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  ${(amount / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span
                className={`font-medium capitalize ${
                  isPaid ? "text-green-500" : "text-yellow-500"
                }`}
              >
                {paymentStatus}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col bg-inherit border-none items-center gap-4">
          <Button
            variant="outline"
            className="w-full shadow-sm"
            render={<Link to="/">Back to Home</Link>}
          ></Button>
          <Button
            variant="secondary"
            className={"w-full shadow-sm"}
            render={<Link to="/dashboard/dashboard">Go to Dashboard</Link>}
          ></Button>
        </CardFooter>
      </Card>
    </div>
  );
}
