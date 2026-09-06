import {
  Link,
  Navigate,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { buildPageTitle, createTrpcClient, type MatchItem } from "@/util";
import {
  EmptyContent,
  EmptyTitle,
  Empty,
  EmptyHeader,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import type { Route } from "./+types/list";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BadgeInfoIcon,
  CloudAlertIcon,
  Code2Icon,
  EyeIcon,
  PenLineIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FREE_LIMIT } from "@package/shared";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const trpc = createTrpcClient(request);

  const vocab = await trpc.pictureVocab.authored.query({});

  const subscriptionStatus = await trpc.stripe.getSubscriptionStatus.query();

  return {
    vocab,
    subscriptionStatus,
  };
};

export const meta: Route.MetaFunction = ({ matches }: Route.MetaArgs) => {
  const pageTitle = buildPageTitle("My authored", matches as MatchItem[]);
  return [{ title: pageTitle }];
};

export default function Page() {
  const { vocab, subscriptionStatus } = useLoaderData<typeof loader>();

  const { data, page, limit, total } = vocab;

  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;
  const searchParams = new URLSearchParams(location.search);
  useEffect(() => {
    if (state?.created || state?.updated) {
      toast.success(`${state.created ? "Created" : "Updated"} successfully!`);
      // Remove the state
      navigate(location.pathname, { replace: true, state: {} });
    } else if (searchParams.get("deleted") === "true") {
      toast.success("Deleted successfully!");
      // Remove the deleted query parameter from the URL
      navigate(location.pathname, { replace: true });
    } else if (searchParams.get("limit_reached") === "true") {
      toast.error(
        `You've reached the free plan limit (${total} / ${FREE_LIMIT} vocabs). Upgrade to Pro to create more vocabs.`
      );
      // Remove the limit_reached query parameter from the URL
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, state]);

  const isPro = subscriptionStatus && subscriptionStatus.status === "active";
  const isAtLimit = !isPro && data.length >= FREE_LIMIT;

  return (
    <div className="max-w-5xl w-full h-full overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Text as={"h2"} className="mb-4 text-start">
          My Authored
        </Text>
        <span>
          {data.length} vocab{data.length > 1 ? "s" : ""}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="flex justify-center mt-16">
          <Empty className="w-full max-w-md shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="default" className="bg-inherit">
                <CloudAlertIcon className="size-10" />
              </EmptyMedia>
              <EmptyTitle className="text-xl">
                No Visual Vocabulary Yet
              </EmptyTitle>
              <EmptyDescription className="">
                You haven't created any visual vocabulary yet. Create your first
                one and share your knowledge with others!
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                className="shadow-sm"
                render={
                  <Link to="/dashboard/picture-vocab/create">Create</Link>
                }
                nativeButton={false}
              ></Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div>
          {!isPro && (
            <div
              className={cn(
                "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-2 rounded-lg mb-4 text-sm",
                isAtLimit
                  ? "bg-amber-50 border border-amber-400 text-amber-800"
                  : "bg-blue-50 border border-blue-200 text-blue-700"
              )}
            >
              <span>
                {isAtLimit
                  ? `🔒 You've reached the free plan limit (${total} / ${FREE_LIMIT} vocabs).`
                  : `Free plan: ${total} / ${FREE_LIMIT} vocabs used.`}
              </span>
              <Button
                variant="secondary"
                className="shadow-sm text-sm"
                render={<Link to="/pricing">✨ Upgrade to Pro</Link>}
                nativeButton={false}
              />
            </div>
          )}
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto p-2",
              "justify-items-center w-full "
            )}
          >
            {data.map((item, index) => (
              <Card className="w-full shadow-sm pt-2" key={index}>
                <CardContent className="flex flex-col gap-1 justify-center items-center pb-0">
                  <span
                    className={cn(
                      "text-xs w-fit px-2 py-0.5 rounded-full font-medium self-end",
                      item.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-muted-foreground"
                    )}
                  >
                    {item.status === "published" ? "🌍 Published" : "📝 Draft"}
                  </span>
                  <img className="w-full h-auto" src={item.thumbnail} />
                </CardContent>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base font-normal">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-row items-center gap-2 justify-between">
                  <EmbedButton
                    id={item.id}
                    slug={item.slug}
                    title={item.title}
                    isPro={isPro ?? undefined}
                    disabled={item.status !== "published"}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size={"sm"}
                      render={
                        <Link
                          to={`/dashboard/picture-vocab/${item.id}/${item.slug}/edit`}
                        >
                          <PenLineIcon className="size-4" />
                        </Link>
                      }
                      nativeButton={false}
                      className="shadow-sm"
                      title="Edit"
                    ></Button>

                    <Button
                      size={"sm"}
                      variant={"secondary"}
                      render={
                        <Link
                          to={`/picture-vocab/${item.id}/${item.slug}`}
                          target="_blank"
                        >
                          <EyeIcon className="size-4" />
                        </Link>
                      }
                      nativeButton={false}
                      className="shadow-sm"
                      title="View"
                    ></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmbedButton({
  id,
  slug,
  title,
  isPro = false,
  disabled,
}: {
  id: string;
  slug: string;
  title: string;
  disabled?: boolean;
  isPro?: boolean;
}) {
  const [embedCopied, setEmbedCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, [location.pathname, location.search]);

  const embedUrl = `${origin}/embed/vocab/${id}/${slug}`;

  const embedCode =
    `<style>` +
    `.pv-iframe{max-width:520px;width:100%;height:auto;aspect-ratio:52/68;}` +
    `@media(max-width:480px){.pv-iframe{aspect-ratio:300/485;}}` +
    `</style>` +
    `<iframe class="pv-iframe" src="${embedUrl}" width="520" height="680" allowfullscreen></iframe>`;

  const handleCopy = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2500);
    });
  };

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            className={"flex items-center gap-2 shadow-sm"}
            variant="outline"
            size="sm"
            title="Embed"
            disabled={disabled}
          >
            <Code2Icon />
          </Button>
        }
      ></DialogTrigger>
      <DialogContent className="sm:max-w-md shadow-sm p-6" initialFocus={false}>
        <div className="flex flex-col gap-2 mb-2">
          <p className="text-sm text-muted-foreground">Embed on your site</p>
          <h2 className="text-lg font-bold leading-tight">{title}</h2>
        </div>

        <div className="flex border-b border-gray-200"></div>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Paste this code into your website's HTML:
          </p>
          <textarea
            readOnly
            value={embedCode}
            rows={4}
            disabled={!isPro}
            className={cn(
              "w-full p-2 text-sm border border-gray-300 rounded bg-gray-50 resize-none font-mono",
              !isPro && "pointer-events-none cursor-not-allowed"
            )}
            onClick={(e) => {
              if (isPro) {
                (e.target as HTMLTextAreaElement).select();
              } else {
                e.preventDefault();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleCopy(embedCode, setEmbedCopied)}
            className="shadow-sm"
            disabled={!isPro}
          >
            {embedCopied ? "✓ Copied!" : "Copy embed code"}
          </Button>
          {!isPro && (
            <div className="flex flex-row items-center gap-2 text-sm">
              <BadgeInfoIcon className="size-6 fill-red-500 stroke-white" />
              <span>Pro users only. </span>
              <Button
                variant="secondary"
                size="sm"
                nativeButton={false}
                className="shadow-sm"
                render={<Link to="/pricing" />}
              >
                ✨ Upgrade
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
