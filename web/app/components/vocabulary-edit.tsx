"use client";

import React, {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Stage,
  Layer,
  Text as CanvasText,
  Circle,
  Image,
  Transformer,
  Group,
  Line,
} from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { Button } from "@/components/ui/button";
import {
  CloudUploadIcon,
  ImageIcon,
  PlusIcon,
  TrashIcon,
  Volume2,
  ChevronLeftIcon,
  BookAIcon,
  ToolCaseIcon,
  FileTextIcon,
  Loader2Icon,
  Loader2,
  RectangleEllipsisIcon,
  EllipsisVerticalIcon,
  RotateCwIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MoveUpIcon,
  MoveDownIcon,
  ChevronDownIcon,
  FileVolumeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchImagesFromPixabay } from "@/lib/image-api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/ui/text";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { useTRPC } from "@/util";
import {
  Form,
  useFetcher,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit,
} from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKonvaSnapping } from "use-konva-snapping";
import { Label } from "@/components/ui/label";
import Cropper, { type Area } from "react-easy-crop";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Menu } from "@/components/ui/menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

import nanoid from "@/lib/nanoid";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface WordItem {
  number: number;
  word: string;
  audio: string;
}

export interface CanvasContent {
  images: ImageItem[];
  labels: LabelItem[];
  lines: LineItem[];
  words: { number: number; word: string; audio: string }[];
}

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

interface VocabularyEditorProps {
  mode?: "edit" | "view";
  operation?: "create" | "edit";
  category: CategoryItem[];
  data?: {
    title: string;
    slug?: string;
    status?: "draft" | "published";
    categoryId: number;
    description: string;
    thumbnail: string;
    content: {
      images: ImageItem[];
      labels: LabelItem[];
      lines: LineItem[];
      words: { number: number; word: string; audio: string }[];
    };
  };
  canvasClassName?: string;
}

type EditorMode = "edit" | "view";

async function isGifByUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-5" } });
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const header = String.fromCharCode(...bytes);
    return header === "GIF87a" || header === "GIF89a";
  } catch {
    return false;
  }
}

function URLImage({
  src,
  isSelected = false,
  mode = "view",
  clickHandler,
  onTransform,
  onTransformEnd,
  width,
  height,
  ...rest
}: Omit<Konva.ImageConfig, "image"> & {
  src: string;
  isSelected?: boolean;
  mode?: EditorMode;
  clickHandler?: () => void;
  onTransform?: (e: Konva.KonvaEventObject<Event>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}) {
  const [image] = useImage(src, "anonymous");
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    } else if (!isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const finalWidth = width ?? 200;
  const finalHeight =
    height ??
    (image
      ? (image.naturalHeight / image.naturalWidth) * finalWidth
      : undefined);

  const isEditMode = mode === "edit";

  const canvasRef = useRef(document.createElement("canvas"));

  const [isGif, setIsGif] = useState(false);

  useEffect(() => {
    isGifByUrl(src).then(setIsGif);
  }, [src]);

  useEffect(() => {
    if (!isGif) return;

    let animator: any = null;

    function setupGifler() {
      let initialized = false;
      function onDrawFrame(ctx: CanvasRenderingContext2D, frame: any) {
        if (!initialized) {
          canvasRef.current.width = frame.width;
          canvasRef.current.height = frame.height;
          initialized = true;
        }

        if (frame.disposal === 2) {
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }

        ctx.drawImage(frame.buffer, frame.x ?? 0, frame.y ?? 0);
        imageRef.current?.getLayer()?.batchDraw();
      }
      animator = (window as any).gifler(src);
      animator.frames(canvasRef.current, onDrawFrame);
    }

    if (typeof (window as any).gifler !== "undefined") {
      setupGifler();
      return () => animator?.stop?.();
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/gifler@0.1.0/gifler.min.js";
    script.onload = () => setupGifler();
    document.head.appendChild(script);

    return () => {
      animator?.stop?.();
    };
  }, [isGif, src]);

  const imageSource = isGif ? canvasRef.current : image;
  return (
    <>
      <Image
        ref={imageRef}
        image={imageSource}
        onClick={clickHandler}
        onTap={clickHandler}
        width={finalWidth}
        height={finalHeight}
        {...rest}
      />
      {isEditMode && isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
          onTransform={onTransform}
          onTransformEnd={onTransformEnd}
        />
      )}
    </>
  );
}
interface ImageItem {
  id: string;
  src: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface PixabayHit {
  id: number;
  previewURL: string;
  webformatURL: string;
  tags: string;
}

interface LabelItem {
  id: string;
  number: number;
  x: number;
  y: number;
}

const WIDTH = 800;
const HEIGHT = 600;

function NumberCircle({
  label,
  draggable,
  mode = "view",
  isSelected = false,
  onSelect,
  onDragMove,
  onDragEnd,
}: {
  label: LabelItem;
  draggable?: boolean;
  mode?: "view" | "edit";
  isSelected?: boolean;
  onSelect: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}) {
  return (
    <>
      <Group
        x={label.x}
        y={label.y}
        onClick={onSelect}
        draggable={draggable}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      >
        {mode === "edit" && isSelected && (
          <Circle
            radius={16}
            fill="transparent"
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[4, 2]}
          />
        )}
        <Circle radius={12} fill={"white"} stroke={"#9ca3af"} strokeWidth={1} />
        <CanvasText
          text={String(label.number)}
          fill={"#374151"}
          fontSize={18}
          fontStyle={"normal"}
          align="center"
          verticalAlign="middle"
          width={24}
          height={24}
          offsetX={12}
          offsetY={12}
        />
      </Group>
    </>
  );
}

interface LineItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
  strokeWidth?: number;
}

function EditableHandDrawLine({
  mode,
  line,
  isSelected,
  onSelect,
  onChange,
}: {
  mode: EditorMode;
  line: LineItem;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updated: LineItem) => void;
}) {
  const points = [line.startX, line.startY, line.endX, line.endY];

  const HANDLE_RADIUS = 6;

  return (
    <>
      <Group
        onClick={onSelect}
        onTap={onSelect}
        draggable={mode === "edit"}
        onDragEnd={(e) => {
          const dx = e.target.x();
          const dy = e.target.y();

          onChange({
            ...line,
            startX: line.startX + dx,
            startY: line.startY + dy,
            endX: line.endX + dx,
            endY: line.endY + dy,
          });

          e.target.position({ x: 0, y: 0 });
        }}
      >
        <Line points={points} stroke={"transparent"} strokeWidth={20} />

        <Line
          points={points}
          stroke={line.color ?? "black"}
          strokeWidth={line.strokeWidth ?? 2}
          listening={false}
          perfectDrawEnabled={false}
        />

        {mode === "edit" && isSelected && (
          <>
            <Circle
              x={line.startX}
              y={line.startY}
              radius={HANDLE_RADIUS}
              fill={"white"}
              stroke={"#3b82f6"}
              strokeWidth={1}
              draggable
              onDragStart={(e) => {
                e.cancelBubble = true;
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
              }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                onChange({
                  ...line,
                  startX: e.target.x(),
                  startY: e.target.y(),
                });
              }}
            />
            <Circle
              x={line.endX}
              y={line.endY}
              radius={HANDLE_RADIUS}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={1}
              draggable
              onDragStart={(e) => {
                e.cancelBubble = true;
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
              }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                onChange({
                  ...line,
                  endX: e.target.x(),
                  endY: e.target.y(),
                });
              }}
            />
          </>
        )}
      </Group>
    </>
  );
}

function DraggableLine({
  color = "black",
  label = "Line",
  onClick,
}: {
  color?: string;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded cursor-pointer",
        "border border-dashed border-gray-300 hover:border-primary",
        "hover:bg-primary/20 transition select-none"
      )}
    >
      <svg width="80" height="24" viewBox="0 0 80 24">
        <line
          x1="4"
          y1="12"
          x2="76"
          y2="12"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function getCroppedImage(
  imageSrc: string,
  croppedAreaPixels: Area
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const WIDTH = 200;
      const aspectRatio = croppedAreaPixels.width / croppedAreaPixels.height;
      const outputWidth = WIDTH;
      const outputHeight = WIDTH / aspectRatio;

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) return reject("No canvas context");

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        outputWidth,
        outputHeight
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject("Failed to create blob");
          resolve(blob);
        },
        "image/webp",
        0.85
      );
    };

    image.onerror = reject;
  });
}

function ThumbnailUploader({
  thumbnail,
  onCropped,
}: {
  thumbnail?: string;
  onCropped?: (croppedImageBlob: Blob) => void;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(thumbnail ?? null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageSrc(url);

    setDialogOpen(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    e.target.value = "";
  };

  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      setImageSrc(null);
    }

    setDialogOpen(open);
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels);
    const croppedUrl = URL.createObjectURL(croppedBlob);
    setCroppedImage(croppedUrl);
    onCropped?.(croppedBlob);

    setDialogOpen(false);
    URL.revokeObjectURL(imageSrc);
  };

  const isThumbnailExist = thumbnail || croppedImage;
  return (
    <div>
      <Input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className={cn("shadow-sm", isThumbnailExist ? "hidden" : "")}
      />

      {isThumbnailExist && (
        <div className="flex gap-6 justify-start items-center">
          <img src={croppedImage ?? thumbnail} width={100} alt="Cropped" />
          <Button
            type="button"
            size={"sm"}
            variant="outline"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="shadow-sm"
          >
            Change
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="flex flex-col overflow-hidden shadow-sm">
          <DialogHeader>Crop Thumbnail</DialogHeader>
          <div className="relative w-full h-80 overflow-hidden">
            <Cropper
              image={imageSrc ?? undefined}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant={"secondary"}
              size={"sm"}
              onClick={() => handleDialogClose(false)}
              className="shadow-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropConfirm}
              className="shadow-sm"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function VocabularyEditor({
  mode = "view",
  operation = "create",
  category,
  data,
  canvasClassName,
}: VocabularyEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labels, setLabels] = useState<LabelItem[]>(
    data?.content ? data?.content.labels : []
  );
  const [images, setImages] = useState<ImageItem[]>(
    data?.content ? data?.content.images : []
  );
  const [lines, setLines] = useState<LineItem[]>(
    data?.content ? data?.content.lines : []
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const [imageSearch, setImageSearch] = useState("");

  const initialNumbers = data?.content.words.map((w) => w.number) ?? [
    1, 2, 3, 4, 5,
  ];
  const [numbers, setNumbers] = useState(initialNumbers);

  const initialWordMap = data?.content.words.reduce<
    Record<number, { word: string; audio: string }>
  >((map, w) => {
    map[w.number] = { word: w.word, audio: w.audio };
    return map;
  }, {});
  const [wordMap, setWordMap] = useState<
    Record<number, { word: string; audio?: string }>
  >(initialWordMap ?? {});

  const handleWordChange = (
    num: number,
    value: { word: string; audio?: string }
  ) => {
    setWordMap((prev) => ({ ...prev, [num]: value }));
  };

  const handleDelete = (item: string) => {
    setNumbers((prev) => prev.filter((n) => n !== Number(item)));
    setWordMap((prev) => {
      const m = { ...prev };
      delete m[Number(item)];
      return m;
    });
  };

  const handleMoveUp = (item: number) => {
    if (item <= 1) return;

    const currentWord = wordMap[item];
    setWordMap((prev) => {
      const newMap = { ...prev };
      newMap[item] = prev[item - 1];
      newMap[item - 1] = currentWord;
      return newMap;
    });
  };

  const handleMoveDown = (item: number) => {
    const maxNumber = Math.max(...Object.keys(wordMap).map(Number));
    if (item >= maxNumber) return;

    const currentWord = wordMap[item];
    setWordMap((prev) => {
      const newMap = { ...prev };
      newMap[item] = prev[item + 1];
      newMap[item + 1] = currentWord;
      return newMap;
    });
  };

  const trpc = useTRPC();
  const uploadMutation = useMutation(
    trpc.upload.getUploadUrl.mutationOptions()
  );

  const uploadFileToR2 = async ({
    file,
    source,
    defaultFileName,
  }: {
    file: File | Blob;
    source?: string;
    defaultFileName?: string;
  }): Promise<string> => {
    let filename = defaultFileName;

    if (!filename) {
      filename =
        file instanceof File
          ? file.name
          : `${Math.random().toString().slice(2, 7)}.webp`;
    }

    const { url, key } = await uploadMutation.mutateAsync({
      fileName: filename,
      fileType: file.type,
      source,
    });
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const publicUrl = `${import.meta.env.VITE_CLOUDFLARE_PUBLIC_URL}/${key}`;
    return publicUrl;
  };

  const [title, setTitle] = useState(data?.title ?? "");
  const [slug, setSlug] = useState(data?.slug ?? "");
  const [description, setDescription] = useState(data?.description ?? "");
  const [status, setStatus] = useState<"draft" | "published" | undefined>(
    data?.status
  );

  const [categoryId, setCategoryId] = useState<number | undefined>(
    data?.categoryId
  );

  const content = {
    images,
    labels,
    lines,
    words: numbers.map((num) => ({
      number: num,
      word: wordMap[num]?.word ?? "",
      audio: wordMap[num]?.audio,
    })),
  };

  const handleAddImage = (url: string) => {
    const id = `image-${Date.now()}`;
    setSelectedId(id);

    setImages((prev) => {
      const MAX_OFFSET = 70;
      const offset = (prev.length * 10) % MAX_OFFSET;

      return [
        ...prev,
        {
          id,
          src: url,
          x: WIDTH / 2 - 100 + offset,
          y: HEIGHT / 2 - 75 + offset,
          width: 200,
        },
      ];
    });
  };

  const handleAddLabel = (number: number) => {
    const id = `label-${Date.now()}`;
    setSelectedId(id);

    setLabels((prev) => {
      const MAX_OFFSET = 70;
      const offset = (prev.length * 10) % MAX_OFFSET;

      return [
        ...prev,
        {
          id,
          number,
          x: WIDTH / 2 + offset,
          y: HEIGHT / 2 + offset,
        },
      ];
    });
  };

  const handleAddLine = (color: string, strokeWidth: number) => {
    const id = `line-${Date.now()}`;
    setSelectedId(id);

    setLines((prev) => {
      const MAX_OFFSET = 70;
      const offset = (prev.length * 10) % MAX_OFFSET;

      const newLine: LineItem = {
        id,
        startX: WIDTH / 2 - 60 + offset,
        startY: HEIGHT / 2 + offset,
        endX: WIDTH / 2 + 60 + offset,
        endY: HEIGHT / 2 + offset,
        color,
        strokeWidth,
      };

      return [...prev, newLine];
    });
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSlug(event.target.value);
  };

  const handleTitleBlur = () => {
    setSlug(title.toLowerCase().split(" ").join("-"));
  };

  type Tool = "images" | "upload" | "words" | "tools";
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsPanelOpen(true);
      setActiveTool("images");
    }
  }, []);
  const toggleTool = (tool: Tool) => {
    if (activeTool === tool) {
      setIsPanelOpen((prev) => !prev);
    } else {
      setActiveTool(tool);
      setIsPanelOpen(true);
    }
  };

  const togglePanel = () => {
    setIsPanelOpen(false);
    setActiveTool(null);
  };

  useEffect(() => {
    if (mode === "view") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        if (selectedId?.startsWith("image-")) {
          setImages((prev) => prev.filter((img) => img.id !== selectedId));
          setSelectedId(null);
        } else if (selectedId?.startsWith("label-")) {
          setLabels((prev) => prev.filter((label) => label.id !== selectedId));
          setSelectedId(null);
        } else if (selectedId?.startsWith("line-")) {
          setLines((prev) => prev.filter((line) => line.id !== selectedId));
          setSelectedId(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, mode]);

  const [thumbnail, setThumbnail] = useState(data?.thumbnail);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);

  const submit = useSubmit();
  const navigation = useNavigation();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSaving(true);

    const formData = new FormData(e.currentTarget);

    let id: string | undefined;

    if (operation === "create") {
      id = nanoid();
      formData.set("id", id);
    } else {
      id = params.id;
    }

    const slug = formData.get("slug") as string;

    let newThumbnail = thumbnail;
    if (croppedImage) {
      const result = await uploadFileToR2({
        file: croppedImage,
        source: "thumbnail",
        defaultFileName: `vocab/${id}/${slug}.webp`,
      });

      newThumbnail = result;
    }

    formData.set("thumbnail", newThumbnail!);

    // preview image
    const canvas = containerRef.current?.querySelector("canvas");
    if (canvas) {
      const previewBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((blob) => resolve(blob), "image/webp", 1)
      );

      if (previewBlob) {
        const previewUrl = await uploadFileToR2({
          file: previewBlob,
          source: "preview",
          defaultFileName: `vocab/${id}/${slug}.webp`,
        });

        formData.set("preview", previewUrl);
      }
    }

    submit(formData, { method: "post" });

    setIsSaving(false);
  };

  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) {
      toast.info(`Uploading ${files.length} image(s)...`);
      try {
        await Promise.all(
          files.map(async (file, i) => {
            const publicUrl = await uploadFileToR2({ file });
            const id = `image-${Date.now()}-${i}`;
            setImages((prev) => [
              ...prev,
              {
                id,
                src: publicUrl,
                x: WIDTH / 2 + i * 20,
                y: HEIGHT / 2 + i * 20,
                width: 200,
              },
            ]);

            setSelectedId(id);
          })
        );
        toast.success("Upload successful!");
      } catch (error) {
        console.error("Upload failed: ", error);
        toast.error("Upload failed. Please try again.");
      }
    }
  };

  const addImageInputRef = useRef<HTMLInputElement>(null);

  const params = useParams();

  const handleDeleteRecord = () => {
    const formData = new FormData();
    submit(formData, {
      method: "post",
      action: `/dashboard/picture-vocab/${params.id}/${params.slug}/delete`,
    });
  };

  const [column, setColumn] = useState(4);

  const handleAutoGrid = () => {
    const n = images.length;
    if (n === 0) return;

    const PADDING = 20;
    const cols = column;
    const rows = Math.ceil(n / cols);

    const cellWidth = (WIDTH - PADDING * (cols + 1)) / cols;
    const cellHeight = (HEIGHT - PADDING * (rows + 1)) / rows;

    const sortedImages = [...images].sort((a, b) => {
      const rowA = Math.floor((a.y ?? 0) / (cellHeight + PADDING));
      const rowB = Math.floor((b.y ?? 0) / (cellHeight + PADDING));
      if (rowA !== rowB) return rowA - rowB;
      return (a.x ?? 0) - (b.x ?? 0);
    });

    const newImages = sortedImages.map((img, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const cellX = PADDING + col * (cellWidth + PADDING);
      const cellY = PADDING + row * (cellHeight + PADDING);

      const naturalWidth = img.width ?? 200;
      const naturalHeight = img.height ?? naturalWidth;

      const scale = Math.min(
        cellWidth / naturalWidth,
        cellHeight / naturalHeight
      );
      const newWidth = naturalWidth * scale;
      const newHeight = naturalHeight * scale;

      return {
        ...img,
        x: cellX + (cellWidth - newWidth) / 2,
        y: cellY + (cellHeight - newHeight) / 2,
        width: newWidth,
        height: newHeight,
      };
    });

    setImages(newImages);
  };

  const handleAutoLabels = () => {
    if (images.length === 0 || numbers.length === 0) return;

    const newLabels = [...labels];

    images.forEach((img, i) => {
      const number = numbers[i];
      if (number === undefined) return;

      const imgX = img.x ?? 0;
      const imgY = img.y ?? 0;
      const imgWidth = img.width ?? 200;
      const imgHeight = img.height ?? 200;

      const targetX = imgX + imgWidth / 2;
      const targetY = imgY + imgHeight + 4;

      const existingIndex = newLabels.findIndex((l) => l.number === number);

      if (existingIndex !== -1) {
        newLabels[existingIndex] = {
          ...newLabels[existingIndex],
          x: targetX,
          y: targetY,
        };
      } else {
        newLabels.push({
          id: `label-${Date.now()}-${number}`,
          number,
          x: targetX,
          y: targetY,
        });
      }
    });

    setLabels(newLabels);
  };

  return (
    <Form
      id="editor-form"
      method="post"
      className="flex flex-col w-full bg-inherit h-full"
      onSubmit={handleSubmit}
    >
      {mode === "edit" && (
        <div className="flex items-center  shrink-0">
          <Text as={"h3"}>
            {operation === "create" ? "Create a Picture Vocab" : "Edit"}
          </Text>
        </div>
      )}
      <div className="flex flex-col lg:flex-row w-full overflow-hidden py-1 bg-inherit gap-6 flex-1 min-h-0 px-1">
        {mode === "edit" && (
          <Card className="w-full lg:w-auto h-auto lg:h-full order-last lg:order-first shadow-sm py-0">
            <CardContent className="flex flex-col-reverse lg:flex-row p-0 relative h-full">
              <div
                className={cn(
                  "w-full lg:w-16.5 flex flex-row justify-around lg:flex-col lg:justify-start items-center",
                  isPanelOpen && "border-r border-gray-300"
                )}
              >
                <ToolButton
                  ButtonIcon={ImageIcon}
                  text="Images"
                  onClick={() => toggleTool("images")}
                  active={activeTool === "images"}
                  className="lg:rounded-tl-md"
                />
                <ToolButton
                  ButtonIcon={BookAIcon}
                  text="Words"
                  onClick={() => toggleTool("words")}
                  active={activeTool === "words"}
                />
                <ToolButton
                  ButtonIcon={ToolCaseIcon}
                  text="Tools"
                  onClick={() => toggleTool("tools")}
                  active={activeTool === "tools"}
                />
              </div>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 w-full lg:h-full",
                  isPanelOpen
                    ? "h-64 lg:w-80 opacity-100"
                    : "h-0 lg:w-0 opacity-0"
                )}
              >
                {isPanelOpen && activeTool === "images" && (
                  <ImageSearchPanel onAddImage={handleAddImage} />
                )}
                {isPanelOpen && activeTool === "words" && (
                  <WordsPanel
                    mode={mode}
                    numbers={numbers}
                    wordMap={wordMap}
                    onWordChange={handleWordChange}
                    onDelete={handleDelete}
                    onAdd={() =>
                      setNumbers((prev) => [...prev, prev.length + 1])
                    }
                    handleMoveUp={handleMoveUp}
                    handleMoveDown={handleMoveDown}
                    onAddLabel={handleAddLabel}
                    autoLablesHandler={handleAutoLabels}
                  />
                )}
                {isPanelOpen && activeTool === "tools" && (
                  <ToolsPanel onAddLine={handleAddLine} />
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={togglePanel}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 -right-3 shadow-none",
                  "h-12 w-6 p-0 text-gray-300",
                  "hidden lg:flex items-center justify-center",
                  "border-none rounded-full",
                  "transition-all duration-300 z-10",
                  "hover:text-secondary-foreground hover:-translate-y-1/2",
                  isPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                <ChevronLeftIcon className="size-10" />
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="flex flex-col justify-start overflow-y-auto flex-1 gap-4 min-h-0 p-1 order-first lg:order-last">
          <div className="flex justify-between items-center gap-4">
            <Input
              type="file"
              accept="image/*"
              multiple
              hidden
              ref={addImageInputRef}
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="max-w-32 shadow-sm"
              onClick={() => addImageInputRef.current?.click()}
            >
              Add Images
            </Button>
            <Dialog>
              <DialogTrigger
                render={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shadow-sm"
                  >
                    Auto Grid
                  </Button>
                }
              ></DialogTrigger>
              <DialogContent className="shadow-sm">
                <DialogHeader>
                  <DialogTitle>Auto Grid</DialogTitle>
                  <DialogDescription>
                    This feature will automatically arrange the images in a grid
                    layout. It will not modify the labels or lines.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <Label>Column</Label>
                    <Input
                      id="column"
                      type="number"
                      min={1}
                      value={column}
                      onChange={(e) => setColumn(parseInt(e.target.value))}
                      placeholder="Default is 4"
                    />
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAutoGrid}
                    className="shadow-sm"
                  >
                    Confirm
                  </Button>
                  <DialogClose
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shadow-sm"
                      />
                    }
                  >
                    Cancel
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div
            ref={containerRef}
            className={cn("flex flex-col gap-4 max-w-210")}
          >
            <VocabularyCanvas
              mode={mode}
              images={images}
              labels={labels}
              lines={lines}
              words={data?.content.words ?? []}
              selectedId={selectedId}
              onSelectId={setSelectedId}
              onImagesChange={setImages}
              onLabelsChange={setLabels}
              onLinesChange={setLines}
            />

            <Card className="w-full shadow-sm">
              <CardHeader className="">
                <CardTitle className="text-base font-medium">
                  Vocab settings
                </CardTitle>
              </CardHeader>
              <CardContent className="w-full flex flex-col gap-6">
                <Field>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    type="text"
                    value={title}
                    placeholder="Weather"
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="flex-1 h-8 shadow-sm"
                    required
                    name="title"
                    id="title"
                  />
                </Field>
                <Field>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="weather"
                    className="flex-1 h-8 shadow-sm"
                    required
                    name="slug"
                    id="slug"
                  />
                </Field>
                <Field>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    placeholder="About weather vocabulary, you can learn words like sunny, rainy, cloudy..."
                    className="flex-1 resize-none shadow-sm"
                    rows={2}
                    value={description}
                    readOnly={mode === "view"}
                    onChange={(e) =>
                      mode === "edit"
                        ? setDescription(e.target.value)
                        : undefined
                    }
                    name="description"
                    id="description"
                  />
                </Field>
                <Field>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus(value as "draft" | "published")
                    }
                    name="status"
                    required
                  >
                    <SelectTrigger
                      id="status"
                      className="flex-1 h-8 text-sm shadow-sm"
                    >
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="status">Category *</Label>
                  <Select
                    value={categoryId?.toString()}
                    onValueChange={(value) =>
                      setCategoryId(value ? parseInt(value) : undefined)
                    }
                    name="categoryId"
                    required
                  >
                    <SelectTrigger
                      id="status"
                      className="flex-1 h-8 text-sm shadow-sm"
                    >
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 overflow-y-auto">
                      {category.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="thumbnail">Thumbnail *</Label>
                  <ThumbnailUploader
                    thumbnail={thumbnail}
                    onCropped={setCroppedImage}
                  />
                </Field>
                <input
                  type="hidden"
                  name="content"
                  value={JSON.stringify(content)}
                />
                <Button
                  size="sm"
                  type="submit"
                  className="h-8 px-5 shadow-sm"
                  disabled={isSaving || navigation.state !== "idle"}
                >
                  {navigation.state === "idle" ? (
                    "Save"
                  ) : (
                    <Loader2 className="animate-spin" />
                  )}
                </Button>
                {operation === "edit" && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          size="sm"
                          type="button"
                          variant="destructive"
                          className="h-8 shadow-sm"
                        >
                          Delete
                        </Button>
                      }
                    ></AlertDialogTrigger>
                    <AlertDialogContent className="shadow-sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this vocab? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteRecord}
                          className="shadow-sm"
                        >
                          Delete
                        </AlertDialogAction>
                        <AlertDialogCancel className="shadow-sm">
                          Cancel
                        </AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button
                  size="sm"
                  type="button"
                  variant={"outline"}
                  className="h-8 px-5 shadow-sm"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Form>
  );
}

function ToolButton({
  ButtonIcon,
  text,
  active = false,
  onClick,
  className,
}: {
  ButtonIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  text: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={cn(
        "size-16 flex flex-col items-center justify-center transition px-1",
        "rounded-none text-xs shadow-none border-none bg-inherit",
        "hover:bg-muted/50 hover:translate-y-0.5 hover:shadow-none",
        active && "bg-primary",
        className
      )}
    >
      <ButtonIcon className="size-6" />
      <Text as="p">{text}</Text>
    </Button>
  );
}

function ImageSearchPanel({
  onAddImage,
}: {
  onAddImage?: (url: string) => void;
}) {
  const [imageSearch, setImageSearch] = useState("");
  const [searchedImages, setSearchedImages] = useState<PixabayHit[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalHits, setTotalHits] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const handleImageSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setCurrentPage(1);

    try {
      const result = await fetchImagesFromPixabay(query);
      setSearchedImages(result?.hits ?? []);
      setTotalHits(result?.totalHits ?? 0);
    } finally {
      setIsSearching(false);
    }
  };

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasMore = searchedImages.length < totalHits;

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    const result = await fetchImagesFromPixabay(imageSearch, nextPage);
    setSearchedImages((prev) => [...prev, ...(result?.hits ?? [])]);
    setCurrentPage(nextPage);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    handleImageSearch("learning");
  }, []);

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <div className="">
        <Input
          type="search"
          placeholder="Search images..."
          value={imageSearch}
          onChange={(e) => setImageSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleImageSearch(imageSearch)}
          disabled={isSearching}
          className="shadow-sm"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isSearching && (
          <div className="flex items-center justify-center py-5">
            <Loader />
          </div>
        )}
        {!isSearching && searchedImages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No Results</p>
        ) : (
          <Text className="text-left w-full text-gray-400 text-sm px-1 py-3">
            Click an image to add it to the canvas 👉
          </Text>
        )}
        <div className="columns-2 gap-2 px-1">
          {searchedImages.map((img) => (
            <div
              key={img.id}
              onClick={() => onAddImage?.(img.webformatURL)}
              className={cn(
                "rounded overflow-hidden border border-gray-200 mb-2",
                "hover:ring-2 hover:ring-blue-400 cursor-pointer transition"
              )}
            >
              <img
                src={img.previewURL}
                alt={img.tags}
                className="w-full h-auto block"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-center py-3">
          {hasMore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex gap-2 shadow-sm"
            >
              {isLoadingMore ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ChevronDownIcon className="size-4" />
              )}
              Load More
            </Button>
          ) : (
            <Text className="text-gray-400 text-sm">
              You've reached the end.
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}

export const speak = (word: string, rate = 1) => {
  if (!word) return;
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = rate;
  const applyVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.name === "Samantha") ??
      voices.find((v) => v.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };
  if (window.speechSynthesis.getVoices().length > 0) applyVoiceAndSpeak();
  else window.speechSynthesis.onvoiceschanged = applyVoiceAndSpeak;
};

let audio: HTMLAudioElement | null = null;

export const playAudio = async (url: string, rate = 1) => {
  if (!url) return;

  if (audio) {
    audio.pause();
  }

  audio = new Audio(url);

  audio.playbackRate = rate;

  await audio.play();
};

export function WordAudio({
  url,
  playbackRate = 1,
  disabled = false,
  isLoading = false,
}: {
  url?: string;
  playbackRate?: number;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackRate;
    audio.play();
  };

  return (
    <div className="flex items-center justify-center">
      <audio ref={audioRef} src={url} preload="auto" />
      <Button
        type="button"
        onClick={play}
        disabled={!url || disabled}
        size="icon"
        variant={"ghost"}
      >
        {isLoading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <Volume2 className="size-4" strokeWidth="2.5" />
        )}
      </Button>
    </div>
  );
}
function MenuItemButton({
  ButtonIcon,
  text,
  onClick,
  disabled = false,
  className,
}: {
  ButtonIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-sm font-sans gap-2 hover:bg-primary w-full justify-start",
        className
      )}
    >
      <ButtonIcon className="size-4" />
      <span>{text}</span>
    </Button>
  );
}

function WordsPanel({
  mode = "view",
  numbers,
  wordMap,
  onWordChange,
  onDelete,
  onAdd,
  handleMoveUp,
  handleMoveDown,
  onAddLabel,
  autoLablesHandler,
}: {
  mode?: EditorMode;
  numbers: number[];
  wordMap: Record<number, { word: string; audio?: string }>;
  onWordChange: (num: number, value: { word: string; audio?: string }) => void;
  onDelete: (item: string) => void;
  onAdd: () => void;
  handleMoveUp: (item: number) => void;
  handleMoveDown: (item: number) => void;
  onAddLabel?: (num: number) => void;
  autoLablesHandler: () => void;
}) {
  const trpc = useTRPC();
  const audioUploadMutation = useMutation(
    trpc.audio.getUploadUrl.mutationOptions()
  );

  const [loadingItem, setLoadingItem] = useState<number | null>(null);

  const generateAudio = async (item: number) => {
    if (!wordMap[item] || !wordMap[item]?.word?.trim()) return;

    setLoadingItem(item);

    try {
      const { url } = await audioUploadMutation.mutateAsync({
        text: wordMap[item].word,
      });

      onWordChange(item, { ...wordMap[item], audio: url });
    } catch (err) {
    } finally {
      setLoadingItem(null);
    }
  };

  const uploadMutation = useMutation(
    trpc.upload.getUploadUrl.mutationOptions()
  );

  const audioInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetItem, setUploadTargetItem] = useState<number | null>(null);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadTargetItem === null) return;

    try {
      const filename = `${wordMap[uploadTargetItem].word}-${Date.now()}.mp3`;
      const { url, key } = await uploadMutation.mutateAsync({
        fileName: filename,
        fileType: file.type,
        source: "audio",
      });

      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const publicUrl = `${import.meta.env.VITE_CLOUDFLARE_PUBLIC_URL}/${key}`;
      onWordChange(uploadTargetItem, {
        ...wordMap[uploadTargetItem],
        audio: publicUrl,
      });

      toast.success("Audio uploaded successfully!");
    } catch (err) {
      toast.error("Audio upload failed.");
    } finally {
      e.target.value = "";
      setUploadTargetItem(null);
    }
  };

  const [highlightedItem, setHighlightedItem] = useState<number | null>(null);

  const triggerHighlight = (item: number) => {
    setHighlightedItem(item);
    setTimeout(() => setHighlightedItem(null), 1000);
  };

  const [menuSheetOpenedItem, setMenuSheetOpenedItem] = useState<number | null>(
    null
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <Text>Word List</Text>
        {mode === "edit" && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="px-1 shadow-sm"
              onClick={autoLablesHandler}
            >
              Auto Label
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="px-1 shadow-sm"
              onClick={onAdd}
            >
              <PlusIcon className="size-5" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 gap-2">
        <Text className="mb-3 text-gray-400">
          Click these number labels to add them to the canvas 👉
        </Text>
        <div className="flex flex-col gap-2">
          {numbers.map((item, index) => (
            <div key={item} className="flex items-center gap-2 mb-1">
              <div
                onClick={() => mode === "edit" && onAddLabel?.(item)}
                className={cn(
                  "w-6 h-6 rounded-full bg-white flex items-center justify-center border",
                  "cursor-pointer text-lg hover:bg-primary shrink-0"
                )}
              >
                {item}
              </div>
              <Input
                type="text"
                value={wordMap[item]?.word ?? ""}
                onChange={(e) =>
                  mode === "edit"
                    ? onWordChange(item, { word: e.target.value })
                    : undefined
                }
                onBlur={() => generateAudio(item)}
                readOnly={mode === "view"}
                className={cn(
                  "px-1 py-1 shadow-none",
                  highlightedItem === item && "bg-primary"
                )}
              />
              {/* <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const audioUrl = wordMap[item]?.audio;
                  if (!audioUrl) return;
                  await playAudio(audioUrl);
                }}
                disabled={!wordMap[item]?.audio}
              >
                {loadingItem === item ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button> */}
              <WordAudio
                url={wordMap[item]?.audio}
                disabled={!wordMap[item]?.audio}
                isLoading={loadingItem === item}
              />
              {mode === "edit" && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-2 rounded hover:bg-accent hidden md:block">
                      <RectangleEllipsisIcon
                        className="size-4"
                        strokeWidth={2.5}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => generateAudio(item)}
                        disabled={!wordMap[item]?.word}
                      >
                        <RotateCwIcon />
                        Create Audio
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setUploadTargetItem(item);
                          audioInputRef.current?.click();
                        }}
                      >
                        <FileVolumeIcon />
                        Upload Audio
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          handleMoveUp(item);
                          triggerHighlight(item - 1);
                        }}
                      >
                        <MoveUpIcon />
                        Move Up
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          handleMoveDown(item);
                          triggerHighlight(item + 1);
                        }}
                      >
                        <MoveDownIcon />
                        Move Down
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={index !== numbers.length - 1}
                        onClick={() => onDelete(String(item))}
                      >
                        <TrashIcon />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Sheet
                    open={menuSheetOpenedItem === item}
                    onOpenChange={(open) =>
                      setMenuSheetOpenedItem(open ? item : null)
                    }
                  >
                    <SheetTrigger
                      render={
                        <Button type="button" variant="ghost">
                          <RectangleEllipsisIcon className="size-4" />
                        </Button>
                      }
                      className="block md:hidden"
                    ></SheetTrigger>
                    <SheetContent
                      side="bottom"
                      showCloseButton={false}
                      className="p-2"
                    >
                      <MenuItemButton
                        onClick={() => {
                          generateAudio(item);
                          setMenuSheetOpenedItem(null);
                        }}
                        disabled={!wordMap[item]?.word}
                        ButtonIcon={RotateCwIcon}
                        text="Create Audio"
                      />

                      <MenuItemButton
                        ButtonIcon={FileVolumeIcon}
                        text="Upload Audio"
                        onClick={() => {
                          setUploadTargetItem(item);
                          audioInputRef.current?.click();
                          setMenuSheetOpenedItem(null);
                        }}
                      />
                      <MenuItemButton
                        ButtonIcon={MoveUpIcon}
                        text="Move Up"
                        onClick={() => {
                          handleMoveUp(item);
                          triggerHighlight(item - 1);
                          setMenuSheetOpenedItem(null);
                        }}
                      />
                      <MenuItemButton
                        ButtonIcon={MoveDownIcon}
                        text="Move Down"
                        onClick={() => {
                          handleMoveDown(item);
                          triggerHighlight(item + 1);
                          setMenuSheetOpenedItem(null);
                        }}
                      />
                      <MenuItemButton
                        disabled={index !== numbers.length - 1}
                        onClick={() => {
                          onDelete(String(item));
                          setMenuSheetOpenedItem(null);
                        }}
                        ButtonIcon={TrashIcon}
                        text="Remove"
                        className="text-destructive hover:bg-destructive hover:text-white"
                      />
                    </SheetContent>
                  </Sheet>
                </>
              )}
            </div>
          ))}
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            hidden
            onChange={handleAudioUpload}
          />
        </div>
      </div>
    </div>
  );
}

function ToolsPanel({
  onAddLine,
}: {
  onAddLine?: (color: string, strokeWidth: number) => void;
}) {
  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <Text className="text-gray-400">
        Click a line to add it to the canvas 👉
      </Text>
      <div>
        <DraggableLine
          color="black"
          label="Helper Line"
          onClick={() => onAddLine?.("black", 2)}
        />
      </div>
    </div>
  );
}

function ImageGrid({
  images,
}: {
  images: {
    id: string | number;
    url: string;
    altText?: string;
  }[];
}) {
  return (
    <div className="flex flex-col lg:columns-2 gap-2 mt-2 px-1">
      {images.map((img) => (
        <div
          key={img.id}
          className={cn(
            "rounded overflow-hidden border border-gray-100 mb-2",
            "hover:ring-2 hover:ring-blue-400 cursor-pointer transition p-1"
          )}
        >
          <img
            src={img.url}
            alt={img.altText}
            className="w-full h-auto block"
          />
        </div>
      ))}
    </div>
  );
}

interface VocabularyCanvasProps {
  mode: EditorMode;
  images: ImageItem[];
  labels: LabelItem[];
  lines: LineItem[];
  words: WordItem[];
  selectedId?: string | null;
  onSelectId?: (id: string | null) => void;
  onImagesChange?: (images: ImageItem[]) => void;
  onLabelsChange?: (labels: LabelItem[]) => void;
  onLinesChange?: (lines: LineItem[]) => void;
}

export function VocabularyCanvas({
  mode = "view",
  images,
  labels,
  lines,
  words,
  selectedId,
  onSelectId,
  onImagesChange,
  onLabelsChange,
  onLinesChange,
}: VocabularyCanvasProps) {
  const { handleDragging, handleDragEnd, handleResizing, handleResizeEnd } =
    useKonvaSnapping({
      guidelineColor: "blue",
      guidelineDash: true,
      snapToStageCenter: true,
      snapRange: 5,
      guidelineThickness: 1,
      showGuidelines: true,
      snapToShapes: true,
      snapToStageBorders: true,
    });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(WIDTH);
  const scale = stageWidth / WIDTH;
  const stageHeight = HEIGHT * scale;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    setStageWidth(Math.min(el.getBoundingClientRect().width, WIDTH));

    const observer = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setStageWidth(Math.min(w, WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-2 md:p-4">
        <div
          ref={wrapperRef}
          className={cn(
            "overflow-hidden flex flex-col gap-2 justify-center items-center"
          )}
        >
          <div className="flex flex-col" style={{ maxWidth: stageWidth }}>
            <div
              className="bg-white border border-gray-400 border-dashed overflow-hidden"
              style={{ width: stageWidth, height: stageHeight }}
            >
              <Stage
                width={stageWidth}
                height={stageHeight}
                scaleX={scale}
                scaleY={scale}
                onMouseDown={(e) => {
                  if (e.target === e.target.getStage()) {
                    onSelectId?.(null);
                  }
                }}
              >
                <Layer>
                  {images.map((img, index) => (
                    <URLImage
                      key={index}
                      mode={mode}
                      width={img.width ?? 200}
                      height={img.height}
                      draggable={mode === "edit"}
                      src={img.src}
                      x={img.x}
                      y={img.y}
                      isSelected={selectedId === img.id}
                      onClick={() => onSelectId?.(img.id)}
                      onDragMove={handleDragging}
                      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                        handleDragEnd(e);
                        const pos = e.target.position();
                        onImagesChange?.(
                          images.map((it) =>
                            it.id === img.id
                              ? { ...it, x: pos.x, y: pos.y }
                              : it
                          )
                        );
                      }}
                      onTransform={handleResizing}
                      onTransformEnd={(e) => {
                        const node = (
                          e.currentTarget as Konva.Transformer
                        ).nodes()[0] as Konva.Node;
                        if (!node) return;

                        const newWidth = node.width() * node.scaleX();
                        const newHeight = node.height() * node.scaleY();

                        handleResizeEnd(e);

                        node.scaleX(1);
                        node.scaleY(1);

                        onImagesChange?.(
                          images.map((it) =>
                            it.id === img.id
                              ? {
                                  ...it,
                                  x: node.x(),
                                  y: node.y(),
                                  width: newWidth,
                                  height: newHeight,
                                  rotation: node.rotation(),
                                }
                              : it
                          )
                        );
                      }}
                    />
                  ))}
                  {labels.map((label) => (
                    <NumberCircle
                      key={label.id}
                      label={label}
                      draggable={mode === "edit"}
                      mode={mode}
                      onSelect={() => onSelectId?.(label.id)}
                      isSelected={selectedId === label.id}
                      onDragMove={handleDragging}
                      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                        handleDragEnd(e);
                        const pos = e.target.position();
                        onLabelsChange?.(
                          labels.map((l) =>
                            l.id === label.id ? { ...l, x: pos.x, y: pos.y } : l
                          )
                        );
                      }}
                    />
                  ))}
                  {lines.map((line) => (
                    <EditableHandDrawLine
                      key={line.id}
                      line={line}
                      isSelected={selectedId === line.id}
                      mode={mode}
                      onSelect={() => onSelectId?.(line.id)}
                      onChange={(updated) =>
                        onLinesChange?.(
                          lines.map((l) => (l.id === updated.id ? updated : l))
                        )
                      }
                    />
                  ))}
                </Layer>
              </Stage>
            </div>
            {mode === "view" && <WordList words={words} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type WordListMode = "view" | "fillIn" | "dictation";

function WordList({ words }: { words: WordItem[] }) {
  const [rate, setRate] = useState(1);

  const [mode, setMode] = useState<WordListMode>("view");

  const [wordArr, setWordArr] = useState(words);

  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [userAnswerResults, setUserAnswerResults] = useState<boolean[]>([]);

  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false);

  const handleFillIn = () => {
    setMode("fillIn");
    setUserAnswers(Array(words.length).fill(""));
    setUserAnswerResults(Array(words.length).fill(false));

    setHasCheckedAnswer(false);
  };

  const handleDictation = () => {
    setMode("dictation");
    setUserAnswers(Array(words.length).fill(""));
    setUserAnswerResults(Array(words.length).fill(false));

    setHasCheckedAnswer(false);

    // because Array.sort() will change the original array, we need to create a new array first
    const dictationWordArr = [...wordArr].sort(() => Math.random() - 0.5);
    setWordArr(dictationWordArr);
  };

  const handleCheckAnswer = () => {
    const results = wordArr.map((word, index) => {
      const userAnswer = userAnswers[index] || "";
      return userAnswer.trim().toLowerCase() === word.word.trim().toLowerCase();
    });
    setUserAnswerResults(results);
    setHasCheckedAnswer(true);
  };

  return (
    <div className="flex flex-col w-full gap-2 pb-2">
      <div>
        {mode === "fillIn" && (
          <Text className="text-sm text-gray-500 my-2">
            Fill in the blanks, then click "Check" to verify your answers.
          </Text>
        )}
        {mode === "dictation" && (
          <Text className="text-sm text-gray-500 my-2">
            Listen to the audio and fill in the blanks. Click "Check" to verify
            your answers.
          </Text>
        )}
        <div className="overflow-y-auto max-h-40 lg:max-h-50">
          <div
            className={cn(
              "columns-1 sm:columns-2 lg:columns-3 py-2",
              mode === "dictation" && "pl-2"
            )}
          >
            {wordArr?.map(({ number, word, audio }, index) => (
              <div
                key={number}
                className={cn(
                  "flex items-center gap-2 break-inside-avoid",
                  mode !== "view" && "mb-1"
                )}
              >
                {(mode === "view" ||
                  mode === "fillIn" ||
                  (mode === "dictation" && hasCheckedAnswer)) && (
                  <span>{number}.</span>
                )}
                {(mode === "fillIn" || mode === "dictation") && (
                  <Input
                    type="text"
                    value={userAnswers[index] || ""}
                    onChange={(e) => {
                      const newAnswers = [...userAnswers];
                      newAnswers[index] = e.target.value;
                      setUserAnswers(newAnswers);
                    }}
                    className={cn(
                      "flex-1 border rounded px-2 py-1",
                      "shadow-none",
                      userAnswerResults[index] === true &&
                        hasCheckedAnswer &&
                        "border-green-500 bg-green-100",
                      userAnswerResults[index] === false &&
                        hasCheckedAnswer &&
                        "border-red-600 bg-red-300"
                    )}
                  />
                )}
                {mode === "view" && (
                  <Text className="flex-1 font-normal">{word}</Text>
                )}

                <WordAudio disabled={!word} url={audio} playbackRate={rate} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {(mode === "fillIn" || mode === "dictation") && (
        <div className="flex justify-between items-center px-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setMode("view");
              setWordArr(words);
            }}
            className="shadow-sm"
          >
            Exit
          </Button>
          <Button size="sm" onClick={handleCheckAnswer} className="shadow-sm">
            Check
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center gap-2 px-2">
        <div>
          <Select
            value={rate.toString()}
            onValueChange={(value) => setRate(parseFloat(value))}
          >
            <SelectTrigger
              id="rate"
              className="min-w-12 h-8 p-2 py-1 shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-12 shadow-sm">
              <SelectItem value="0.5">🐢 0.5x</SelectItem>
              <SelectItem value="0.75">🚶 0.75x</SelectItem>
              <SelectItem value="1">🚴 1x</SelectItem>
              <SelectItem value="1.25">🏃 1.25x</SelectItem>
              <SelectItem value="1.5">🚗 1.5x</SelectItem>
              <SelectItem value="1.75">✈️ 1.75x</SelectItem>
              <SelectItem value="2">🚀 2x</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            size="sm"
            variant={"secondary"}
            onClick={handleFillIn}
            className="shadow-sm"
          >
            Fill in
          </Button>
          <Button
            type="button"
            size="sm"
            variant={"secondary"}
            onClick={handleDictation}
            className="shadow-sm"
          >
            Dictation
          </Button>
        </div>
      </div>
    </div>
  );
}
