import { buildPageTitle, createTrpcClient, type MatchItem } from "@/util";
import {
  VocabularyEditor,
  type CanvasContent,
} from "@/components/vocabulary-edit";
import { toast } from "sonner";
import {
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
} from "react-router";
import { useEffect } from "react";
import type { Route } from "./+types/create";
import { Text } from "@/components/ui/text";
import { reuploadPixabayImages } from "@/util/image";
import { FREE_LIMIT } from "@package/shared";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const trpc = createTrpcClient(request);

  const category = await trpc.category.list.query();

  const subscriptionStatus = await trpc.stripe.getSubscriptionStatus.query();

  const { total } = await trpc.pictureVocab.authored.query({});

  const isPro = subscriptionStatus && subscriptionStatus.status === "active";

  if (!isPro && total >= FREE_LIMIT) {
    return redirect("/dashboard/picture-vocab/authored?limit_reached=true");
  }

  return {
    category,
  };
};

export const meta: Route.MetaFunction = ({ matches }: Route.MetaArgs) => {
  const pageTitle = buildPageTitle("Create", matches as MatchItem[]);
  return [{ title: pageTitle }];
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const thumbnail = formData.get("thumbnail") as string;
  const preview = formData.get("preview") as string;
  const content = formData.get("content") as string;
  let status = formData.get("status");
  if (!status) status = "draft";

  const categoryIdString = formData.get("categoryId") as string;

  const trpc = createTrpcClient(request);

  // Check if free users have reached the limit
  const subscriptionStatus = await trpc.stripe.getSubscriptionStatus.query();
  const { total } = await trpc.pictureVocab.authored.query({});

  const isPro = subscriptionStatus && subscriptionStatus.status === "active";

  if (!isPro && total >= FREE_LIMIT) {
    return redirect("/dashboard/picture-vocab/authored?limit_reached=true");
  }

  // download and re-upload images to our R2, then replace the src in content
  const updatedContent = await reuploadPixabayImages(JSON.parse(content));

  const result = await trpc.pictureVocab.create.mutate({
    id,
    title,
    slug,
    description,
    status: status as "draft" | "published",
    categoryId: parseInt(categoryIdString, 10),
    thumbnail,
    preview,
    content: JSON.stringify(updatedContent),
  });

  return result;
};

export default function Page() {
  const { category } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();

  const navigate = useNavigate();

  useEffect(() => {
    if (actionData && actionData.id) {
      navigate("/dashboard/picture-vocab/authored", {
        state: { created: true },
      });
    }
  }, [actionData]);

  return (
    <div className="w-full h-full overflow-y-auto">
      <VocabularyEditor mode="edit" category={category} />
    </div>
  );
}
