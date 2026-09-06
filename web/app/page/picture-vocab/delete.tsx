import { createTrpcClient } from "@/util";
import { redirect } from "react-router";
import type { Route } from "./+types/delete";

export const action = async ({ params, request }: Route.ActionArgs) => {
  const trpc = createTrpcClient(request);

  await trpc.pictureVocab.remove.mutate({
    id: params.id,
  });
  return redirect("/dashboard/picture-vocab/authored?deleted=true");
};
