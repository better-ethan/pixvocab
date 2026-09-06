import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import {
  CheckIcon,
  Link2Icon,
  LinkIcon,
  Loader2Icon,
  MailIcon,
  PencilIcon,
  UserRoundIcon,
  UserRoundPenIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Route } from "./+types/profile";
import { buildPageTitle, createTrpcClient, type MatchItem } from "@/util";
import {
  redirect,
  useFetcher,
  useLoaderData,
  useRevalidator,
} from "react-router";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { GoogleIcon, UserAvatar } from "@/components/partial";
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

export const loader = async ({ request }: Route.LoaderArgs) => {
  const trpc = createTrpcClient(request);

  const currentUser = await trpc.user.getCurrentUser.query();

  if (!currentUser) {
    throw redirect("/signin");
  }

  const linkedAccounts = await trpc.user.listLinkedAccount.query();

  return { currentUser, linkedAccounts };
};

export const meta: Route.MetaFunction = ({ matches }: Route.MetaArgs) => {
  const pageTitle = buildPageTitle("My profile", matches as MatchItem[]);
  return [{ title: pageTitle }];
};

export const action = async ({ request }: Route.ActionArgs) => {
  const trpc = createTrpcClient(request);

  const formData = await request.formData();
  const name = formData.get("name") as string | null;
  const description = formData.get("description") as string | null;

  const result = await trpc.user.updateProfile.mutate({
    ...(name !== null ? { name } : {}),
    ...(description !== null ? { description } : {}),
  });

  return result;
};

export default function Page() {
  const { currentUser, linkedAccounts } = useLoaderData<typeof loader>();

  const linkedGoogleAccount = linkedAccounts.find(
    (account) => account.provider === "google"
  );

  const [editingNickname, setEditingNickname] = useState(false);

  const [editingDecription, setEditingDescription] = useState(false);

  const handleCancel = () => {
    setEditingNickname(false);
    setEditingDescription(false);
  };

  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      toast.success("Profile updated successfully!");
      setEditingNickname(false);
      setEditingDescription(false);
    }
  }, [fetcher.state, fetcher.data]);

  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const revalidator = useRevalidator();

  const handleDisconnectGoogleAccount = async () => {
    if (linkedGoogleAccount) {
      setIsDisconnecting(true);
      await authClient.unlinkAccount({
        providerId: linkedGoogleAccount.provider,
        accountId: linkedGoogleAccount.accountId,
      });
      setDisconnectDialogOpen(false);
      setIsDisconnecting(false);
      toast.success("Google account disconnected successfully!");
      revalidator.revalidate();
    }
  };

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectGoogleAccount = async () => {
    setIsConnecting(true);
    try {
      await authClient.linkSocial({
        provider: "google",
        callbackURL: "/dashboard/user/profile",
      });
    } catch (error) {
      toast.error("Failed to connect Google account. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex justify-center items-start h-dvh w-full p-2">
      <Card className="w-full max-w-lg sm:min-w-96 shadow-sm">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <UserAvatar src={currentUser.image ?? undefined} />
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel>
                  <MailIcon className="size-5" /> Email
                </FieldLabel>
                <p className="text-gray-400">{currentUser?.email}</p>
              </Field>
              <Field>
                <FieldLabel>
                  <UserRoundIcon className="size-5" /> Nickname
                </FieldLabel>
                {editingNickname ? (
                  <fetcher.Form
                    className="w-full flex flex-col gap-2"
                    method="post"
                  >
                    <Input
                      name="name"
                      autoFocus
                      defaultValue={currentUser?.name || ""}
                      className="w-full shadow-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          handleCancel();
                        }
                      }}
                    />
                    <div className="flex justify-end gap-3">
                      <Button size="icon" variant="ghost" type="submit">
                        <CheckIcon
                          className="size-4 text-green-500"
                          strokeWidth={4}
                        />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleCancel}
                      >
                        <XIcon
                          className="size-4 text-red-500"
                          strokeWidth={4}
                        />
                      </Button>
                    </div>
                  </fetcher.Form>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      {currentUser?.name || "Not Set"}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingNickname(true);
                      }}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                  </div>
                )}
              </Field>
              <Field>
                <FieldLabel>
                  <UserRoundPenIcon className="size-5" /> Description
                </FieldLabel>
                {editingDecription ? (
                  <fetcher.Form
                    className="w-full flex flex-col gap-2"
                    method="post"
                  >
                    <Textarea
                      name="description"
                      autoFocus
                      defaultValue={currentUser?.description || ""}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          handleCancel();
                        }
                      }}
                      className="w-full resize-none shadow-sm"
                    />
                    <div className="flex justify-end gap-3">
                      <Button type="submit" size="icon" variant="ghost">
                        <CheckIcon
                          className="size-4 text-green-500"
                          strokeWidth={4}
                        />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleCancel}
                      >
                        <XIcon
                          className="size-4 text-red-500"
                          strokeWidth={4}
                        />
                      </Button>
                    </div>
                  </fetcher.Form>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex-1 wrap-break-word">
                      {currentUser?.description || "Not Set"}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingDescription(true);
                      }}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                  </div>
                )}
              </Field>
              <Field>
                <FieldLabel>
                  <Link2Icon className="size-5" />
                  Connected Accounts
                </FieldLabel>
                <ul className="flex flex-col gap-2">
                  <li
                    key="google"
                    className="flex flex-col md:flex-row gap-2 items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span>{getProviderIcon("google")}</span>
                        Google
                      </span>
                      <span className="text-gray-400">
                        {linkedGoogleAccount?.email}
                      </span>
                    </div>
                    <div>
                      {linkedGoogleAccount ? (
                        <AlertDialog
                          open={disconnectDialogOpen}
                          onOpenChange={setDisconnectDialogOpen}
                        >
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="destructive"
                                className="shadow-sm"
                                size="xs"
                              />
                            }
                          >
                            Disconnect
                          </AlertDialogTrigger>
                          <AlertDialogContent className="shadow-sm">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will disconnect your Google account
                                from your profile. You will not be able to use
                                this account for login until you reconnect it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="shadow-sm">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="shadow-sm"
                                variant="destructive"
                                onClick={handleDisconnectGoogleAccount}
                                disabled={isDisconnecting}
                              >
                                Confirm{" "}
                                {isDisconnecting && (
                                  <Loader2Icon className="size-4 animate-spin" />
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          className="shadow-sm"
                          size="xs"
                          variant="secondary"
                          onClick={handleConnectGoogleAccount}
                          disabled={isConnecting}
                        >
                          Connect{" "}
                          {isConnecting && (
                            <Loader2Icon className="size-4 animate-spin" />
                          )}
                        </Button>
                      )}
                    </div>
                  </li>
                </ul>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>
    </div>
  );
}

function getProviderIcon(provider: string) {
  if (provider === "google") return <GoogleIcon className="size-4" />;
  return null;
}
