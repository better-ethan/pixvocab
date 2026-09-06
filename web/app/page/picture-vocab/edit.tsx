import { buildPageTitle, createTrpcClient, type MatchItem } from "@/util";
import { VocabularyEditor } from "@/components/vocabulary-edit";
import { toast } from "sonner";
import {
  data,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
} from "react-router";
import { useEffect } from "react";
import type { Route } from "./+types/edit";
import { reuploadPixabayImages } from "@/util/image";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = params.id;
  const slug = params.slug;
  if (!id) {
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

  const category = await trpc.category.list.query();

  return { data: result, category };
};

export const meta: Route.MetaFunction = ({ matches }: Route.MetaArgs) => {
  const pageTitle = buildPageTitle("Edit", matches as MatchItem[]);
  return [{ title: pageTitle }];
};

export const action = async ({ params, request }: Route.ActionArgs) => {
  const formData = await request.formData();
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

  const id = params.id;

  const updatedContent = await reuploadPixabayImages(JSON.parse(content));

  const result = await trpc.pictureVocab.toggle.mutate({
    id,
    title,
    slug,
    description,
    thumbnail,
    preview,
    status: status as "draft" | "published",
    categoryId: parseInt(categoryIdString, 10),
    content: JSON.stringify(updatedContent),
  });
  return { id: result.id };
};

export default function Page() {
  const { data, category } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const navigate = useNavigate();
  useEffect(() => {
    if (actionData?.id) {
      navigate("/dashboard/picture-vocab/authored", {
        state: { updated: true },
      });
    }
  }, [actionData]);

  return (
    <div className="w-full h-full overflow-y-auto">
      <VocabularyEditor
        mode="edit"
        operation="edit"
        category={category}
        data={{
          title: data.title,
          slug: data.slug,
          status: data.status as "draft" | "published",
          categoryId: data.categoryId,
          description: data.description as string,
          thumbnail: data.thumbnail,
          content: data.content!,
        }}
      />
    </div>
  );
}
