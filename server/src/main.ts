import { router } from "./trpc.js";
import { pictureVocabRouter } from "./router/picture_vocab.js";
import { uploadRouter } from "./router/uploadRouter.js";
import { userRouter } from "./router/user.js";
import { audioRouter } from "./router/audio.js";
import { categoryRouter } from "./router/category.js";
import { blogRouter } from "./router/blog.js";
import { stripeRouter } from "./router/stripe.js";
import { adminRouter } from "./router/admin.js";

export const appRouter = router({
  pictureVocab: pictureVocabRouter,
  upload: uploadRouter,
  audio: audioRouter,
  user: userRouter,
  category: categoryRouter,
  blog: blogRouter,
  stripe: stripeRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
