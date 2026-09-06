import { buildPageTitle, createTrpcClient, trpc, type MatchItem } from "@/util";
import type { Route } from "./+types/home";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Link, useLoaderData, type MetaDescriptor } from "react-router";
import {
  VocabularyCanvas,
  type CanvasContent,
} from "@/components/vocabulary-edit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const meta: Route.MetaFunction = ({ matches }: Route.MetaArgs) => {
  const pageTitle = buildPageTitle("Home", matches as MatchItem[]);
  return [
    { title: pageTitle },
    {
      name: "description",
      content: "Learning English through Picture and Audio",
    },
  ];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const id = process.env.HOME_PAGE_VOCAB_ID as string;

  const trpc = createTrpcClient(request);

  const vocab = await trpc.pictureVocab.getById.query({
    id,
  });

  return { vocab };
};

export default function Page() {
  const { vocab } = useLoaderData<typeof loader>();
  const { images, labels, lines, words } =
    (vocab?.content as unknown as CanvasContent) ?? {};

  return (
    <div className="flex flex-col items-center gap-24 p-4 max-w-5xl mx-auto">
      <div className="flex flex-col items-center gap-8 w-full mt-4">
        <div className="flex flex-col items-center gap-6 w-full">
          <Text as={"h2"} className="text-center">
            Learning English through <TextWithHighlight text="Picture" /> and{" "}
            <TextWithHighlight text="Audio" />
          </Text>
          <Text className="text-center text-muted-foreground">
            A more effective way to learn English vocabulary
          </Text>
        </div>
        <div className="w-full max-w-160">
          {vocab && (
            <VocabularyCanvas
              mode="view"
              images={images}
              labels={labels}
              lines={lines}
              words={words}
            />
          )}
        </div>
        <Button
          className="shadow-sm mt-4"
          render={<Link to={"/category/all"}>Explore More Visual Vocab</Link>}
          nativeButton={false}
        />
      </div>
      <div className="flex flex-col items-center w-full gap-8">
        <div className="flex flex-col items-center gap-6">
          <Text as="h2" className="text-center">
            The Power of Pictures and Audio
          </Text>
          <p className="text-muted-foreground text-center">
            See the meaning. Hear the sound. Remember the word.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {[
            {
              icon: "🖼️",
              title: "Pictures make meaning clear",
              desc:
                "Pictures connect words directly to meaning. " +
                "You can understand new words without translating into your native language, " +
                "helping you think in English naturally.",
              img: "/images/picture-benefit-1.webp",
              alt: "Pictures make meaning clear",
            },
            {
              icon: "🧠",
              title: "Pictures improve memory",
              desc:
                "Visual information is easier for the brain to remember. " +
                "Combining pictures with words helps you recall vocabulary faster and longer.",
              img: "/images/picture-benefit-2.webp",
              alt: "Pictures improve memory",
            },
            {
              icon: "🎙️",
              title: "Learn pronunciation naturally",
              desc:
                "Listen to native audio and learn how words sound. " +
                "This helps you pronounce words correctly and speak with confidence.",
              img: "/images/audio-benefit-1.webp",
              alt: "Listen to native audio and learn how words sound.",
            },
            {
              icon: "👂",
              title: "Audio improves listening skills",
              desc:
                "You may know a word when you see it, but not recognize it when you hear it. " +
                "Repeated listening trains your brain to identify words in natural conversations.",
              img: "/images/audio-benefit-2.webp",
              alt: "Audio improves listening skills",
            },
          ].map((item) => (
            <Card key={item.title} className="shadow-sm">
              <CardContent>
                <div className="overflow-hidden">
                  <img
                    src={item.img}
                    className="w-auto h-48 mx-auto transition-transform duration-300 hover:scale-105"
                    alt={item.alt}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    <Text as="h4">{item.title}</Text>
                  </div>
                  <Text className="text-muted-foreground">{item.desc}</Text>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center w-full gap-8">
        <div className="flex flex-col items-center gap-6">
          <Text as="h2" className="text-center">
            How to Create a Visual Vocab in{" "}
            <TextWithHighlight text="3 Simple Steps" />
          </Text>
          <Text className="text-muted-foreground">
            It's designed to make creating visual vocab super easy
          </Text>
        </div>

        <div className="flex flex-col md:flex-row md:items-stretch gap-4 w-full">
          {[
            {
              step: "01",
              title: "Add Pictures",
              desc: "Add pictures. We'll arrange them into a neat grid automatically.",
              img: "/images/how-to-add-pictures-edited.webp",
              alt: "Add pictures. We'll arrange them into a neat grid automatically.",
            },
            {
              step: "02",
              title: "Add Vocabulary",
              desc: "Add vocabulary. We'll generate the audio and place the number labels.",
              img: "/images/how-to-add-vocabulary-edited.webp",
              alt: "Add vocabulary. We'll generate the audio and place the number labels.",
            },
            {
              step: "03",
              title: "Complete and Save",
              desc: "Fill in the details and save.",
              img: "/images/how-to-fill-form-save-edited.webp",
              alt: "Fill in the details and save.",
            },
          ].map((item, index, arr) => (
            <div
              key={item.title}
              className="flex md:flex-col flex-row md:w-1/3 w-full items-start gap-4"
            >
              <Card className="shadow-sm w-full h-full">
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-primary">
                      {item.step}
                    </span>
                    <Text as="h4">{item.title}</Text>
                  </div>
                  <div className="overflow-hidden rounded-md mb-3">
                    <ZoomableImage
                      src={item.img}
                      alt={item.alt}
                      className="w-full h-40 md:h-56 object-contain mx-auto transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <Text className="text-muted-foreground">{item.desc}</Text>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        <Text className="text-muted-foreground">
          No need to adjust images or move labels manually. We'll auto-arrange
          everything for you.
        </Text>

        <Button
          render={
            <Link to={"/dashboard/picture-vocab/create"}>
              Create Your Visual Vocab Now
            </Link>
          }
          nativeButton={false}
          className="shadow-sm"
        />
      </div>

      <div className="flex flex-col items-center w-full gap-8">
        <div className="flex flex-col items-center gap-6">
          <Text as="h2">Bring Your English to Life</Text>
          <Text className="text-muted-foreground text-center">
            Language isn't just something you read. It's something you see,
            hear, and experience. Visual vocabulary combines pictures and native
            audio to make every word easier to understand, remember, and use.
          </Text>
        </div>
        <div>
          <img
            src="/images/bring-english-to-life.webp"
            alt="bring your English to life"
          />
        </div>
      </div>
    </div>
  );
}

function TextWithHighlight({ text }: { text: string }) {
  return (
    <span className="relative inline-block z-10">
      <span
        className={cn(
          "absolute top-[35%] -left-1 -right-1 h-[60%] -rotate-3 -z-10",
          "rounded-full bg-primary"
        )}
      ></span>
      <span className="relative">{text}</span>
    </span>
  );
}

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

function ZoomableImage({ src, alt, className }: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={cn("cursor-zoom-in", className)}
        onClick={() => setOpen(true)}
      />

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-10 right-0 text-white text-3xl leading-none hover:text-gray-300"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
            <img
              src={src}
              alt={alt}
              className="w-full h-auto max-h-[85dvh] object-contain rounded-lg shadow-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
