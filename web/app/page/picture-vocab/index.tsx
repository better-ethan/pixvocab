import { Link, useLoaderData, useLocation, useParams } from "react-router";
import type { Route } from "./+types/index";
import { buildPageTitle, createTrpcClient, type MatchItem } from "@/util";
import {
  playAudio,
  speak,
  VocabularyCanvas,
  VocabularyEditor,
  WordAudio,
  type CanvasContent,
} from "@/components/vocabulary-edit";
import {
  BlocksIcon,
  CalendarIcon,
  ComponentIcon,
  DatabaseSearchIcon,
  Share2Icon,
  TagIcon,
  User2Icon,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = params.id;
  const slug = params.slug;
  if (!id || !slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const trpc = createTrpcClient(request);

  const result = await trpc.pictureVocab.getByIdAndSlug.query({
    id,
    slug,
  });

  if (!result) {
    throw new Response("Not Found", { status: 404 });
  }

  const currentUser = await trpc.user.getCurrentUser.query();

  if (result.status === "draft" && currentUser?.id !== result.userId) {
    throw new Response("Not Found", { status: 404 });
  }

  if (
    result.moderationStatus !== "approved" &&
    currentUser?.id !== result.userId
  ) {
    throw new Response("Not Found", { status: 404 });
  }

  return result;
};

export const meta: Route.MetaFunction = ({
  loaderData,
  matches,
}: Route.MetaArgs) => {
  const pageTitle = buildPageTitle(loaderData.title, matches as MatchItem[]);
  return [{ title: pageTitle }];
};

export default function Page() {
  const data = useLoaderData<typeof loader>();

  const { images, labels, lines, words } =
    data.content as unknown as CanvasContent;

  return (
    <div className="flex gap-2 w-full">
      <div className="hidden lg:w-60 lg:h-screen lg:block bg-white mt-8"></div>
      <div className="flex flex-col gap-4 min-w-0 overflow-hidden flex-1">
        {data.status === "draft" && (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg text-center mt-3">
            Draft vocab is only visible to author
          </div>
        )}
        {data.moderationStatus === "rejected" && (
          <div className="p-1 bg-yellow-100 text-yellow-800 rounded-lg text-center text-sm">
            <p className="">
              This vocab has been rejected, you have to re-edit it .
            </p>
            {data.moderationReason && (
              <p className="mt-2">Reason: {data.moderationReason}</p>
            )}
          </div>
        )}
        <div className="mt-8 flex flex-col justify-start gap-3 px-2">
          <div className="flex flex-col gap-4 max-w-210">
            <VocabularyCanvas
              mode="view"
              images={images}
              labels={labels}
              lines={lines}
              words={words}
            />

            <div className="flex justify-end">
              <ShareButton />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-start">
                {data.title.charAt(0).toUpperCase() + data.title.slice(1)}
              </h1>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-1">
                  <User2Icon className="size-5" />
                  <Link
                    to={`/user/${data.userId}/${data.username}`}
                    className="hover:underline hover:text-blue-600"
                  >
                    <Text>{data.username}</Text>
                  </Link>
                </div>
                <div className="flex items-center gap-1">
                  <TagIcon className="size-5" />
                  <Link
                    to={`/category/${data.currentCateory?.slug}`}
                    className="hover:underline hover:text-blue-600"
                  >
                    {data.currentCateory?.name}
                  </Link>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="size-5" />
                  <Text>
                    {new Date(data.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </div>
              </div>
            </div>
            <DescriptionSection description={data.description || ""} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareButton() {
  const location = useLocation();
  const params = useParams();
  const [activeTab, setActiveTab] = useState<"share" | "embed">("share");
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      setShareUrl(window.location.origin + location.pathname + location.search);
    }
  }, [location.pathname, location.search]);

  const embedUrl = `${origin}/embed/vocab/${params.id}/${params.slug}`;

  const embedCode =
    `<style>` +
    `.vv-iframe{max-width:520px;width:100%;height:auto;aspect-ratio:52/68;}` +
    `@media(max-width:480px){.vv-iframe{aspect-ratio:300/485;}}` +
    `</style>` +
    `<iframe class="vv-iframe" src="${embedUrl}" width="520" height="680" allowfullscreen></iframe>`;

  const handleCopy = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    });
  };

  const socialLinks = [
    {
      label: "Facebook",
      logoSrc: "/images/facebook-logo.png",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
    },
    {
      label: "Twitter",
      logoSrc: "/images/x-logo.png",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shareUrl
      )}`,
    },
  ];

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className={"flex items-center gap-2"} variant="ghost">
            <Share2Icon className="size-5" />
            <span>Share</span>
          </Button>
        }
      ></DialogTrigger>
      <DialogContent className="sm:max-w-md shadow-sm p-6">
        <h2 className="text-lg font-bold">Share this visual vocabulary</h2>

        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "share"
                ? "border-b-2 border-primary text-black"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("share")}
          >
            Share
          </button>
          {/* <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "embed"
                ? "border-b-2 border-primary text-black"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("embed")}
          >
            Embed
          </button> */}
        </div>

        {activeTab === "share" && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 justify-around">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <img src={s.logoSrc} className="h-8 w-auto" />
                  <span className="text-xs text-gray-600">{s.label}</span>
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500">Page link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 p-2 text-sm border border-gray-300 rounded bg-gray-50"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleCopy(shareUrl, setCopied)}
                  className="shadow-sm"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* {activeTab === "embed" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">
              Paste this code into your website's HTML:
            </p>
            <textarea
              readOnly
              value={embedCode}
              rows={4}
              className="w-full p-2 text-sm border border-gray-300 rounded bg-gray-50 resize-none font-mono"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleCopy(embedCode, setEmbedCopied)}
              className="shadow-sm"
            >
              {embedCopied ? "✓ Copied!" : "Copy embed code"}
            </Button>
          </div>
        )} */}
      </DialogContent>
    </Dialog>
  );
}

function DescriptionSection({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (element) {
      setClamped(element.scrollHeight > element.clientHeight);
    }
  }, [description]);

  return (
    <div className="bg-white p-4 min-h-25 rounded-lg">
      <p ref={textRef} className={cn("", !expanded && "line-clamp-1")}>
        {description}
      </p>
      {(clamped || expanded) && (
        <Button
          type="button"
          size={"sm"}
          variant={"secondary"}
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2"
        >
          {expanded ? "Show Less" : "More"}
        </Button>
      )}
    </div>
  );
}
