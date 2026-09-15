"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
import {
  Ban,
  MailIcon,
  UserRoundIcon,
  ShieldIcon,
  CalendarIcon,
  UserPenIcon,
  BadgeCheckIcon,
  BadgeAlertIcon,
  Loader2Icon,
} from "lucide-react";
import type { Route } from "./+types/user-index";
import { createTrpcClient } from "@/util";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { UserAvatar } from "@/components/partial";
import { Field, FieldLabel, FieldLegend } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const trpc = createTrpcClient(request);

  const user = await trpc.admin.getUserById.query({ id: params.id });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return { user };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const trpc = createTrpcClient(request);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const id = formData.get("id") as string;
  const reason = formData.get("reason") as string;

  if (intent === "ban") {
    await trpc.admin.banUser.mutate({
      id,
      reason,
    });
  } else if (intent === "unban") {
    await trpc.admin.unbanUser.mutate({
      id,
    });
  }

  return {
    success: true,
  };
};

export default function Page() {
  const { user } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();

  const isBanned = user?.banned;

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const navigation = useNavigation();
  useEffect(() => {
    if (navigation.state === "idle" && actionData?.success) {
      setIsDialogOpen(false);
    }
  }, [navigation.state, actionData?.success]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4">
          <UserAvatar src={user.image ?? undefined} />
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              {user.name}
              <Badge variant={isBanned ? "destructive" : "secondary"}>
                {isBanned ? "Banned" : "Active"}
              </Badge>
            </CardTitle>
            <CardDescription>User ID: {user.id}</CardDescription>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-3 text-sm">
            <MailIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Email</span>
            <div className="flex items-center gap-2">
              {user.email}{" "}
              {user.emailVerified ? (
                <BadgeCheckIcon className="size-6 fill-green-600 stroke-white" />
              ) : (
                <BadgeAlertIcon className="size-6" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <UserRoundIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Name</span>
            <span>{user.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <UserPenIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Description</span>
            <span>{user.description}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <ShieldIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Role</span>
            <span>{user.role}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Created at</span>
            <span>{new Date(user.createdAt).toLocaleString()}</span>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end pt-6">
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  variant={isBanned ? "outline" : "destructive"}
                  className="shadow-sm"
                >
                  {isBanned ? (
                    <>Unban</>
                  ) : (
                    <>
                      <Ban className="mr-1 size-4" />
                      Ban
                    </>
                  )}
                </Button>
              }
            ></AlertDialogTrigger>
            <AlertDialogContent>
              <Form method="post">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you want to {isBanned ? "unbanned" : "banned"} this
                    user?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isBanned
                      ? `Unbanning will allow ${user.name} to log in and use the system again.`
                      : `Banning will prevent ${user.name} from logging in and using the system. Please confirm your action.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {!isBanned && (
                  <Field className="my-4">
                    <Textarea
                      name="reason"
                      placeholder="Please provide a reason for this action"
                      className="w-full shadow-sm"
                      required
                    />
                  </Field>
                )}
                <input type="hidden" value={user.id} name="id" />
                <input
                  type="hidden"
                  value={isBanned ? "unban" : "ban"}
                  name="intent"
                />

                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel type="button" className="shadow-sm">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    type="submit"
                    className="shadow-sm"
                    disabled={navigation.state === "submitting"}
                  >
                    {navigation.state === "submitting" && (
                      <Loader2Icon className="size-5 animate-spin" />
                    )}
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </Form>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
