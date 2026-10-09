import { useState, type ChangeEvent, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { IconClose, IconImage, IconVideo } from "@/components/ui/icons";
import { NEED_DESCRIBE_PATH, NEED_HOME_PATH, NEED_REVIEW_PATH, NEED_SAVE_PATH, needContinueTarget } from "@/lib/cxRoutes";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { cn } from "@/lib/cn";
import { OpportunityAction, OpportunityFrame, opportunityTitleClass } from "./OpportunityChrome";

const MAX_PHOTOS = 10;
const MAX_VIDEO_BYTES = 2_000_000;

export function ProjectMediaSection() {
  const work = readNeedWork();
  const [photos, setPhotos] = useState(work.photos);
  const [video, setVideo] = useState(work.video);
  const [error, setError] = useState("");

  function rememberPhotos(next: string[]) {
    setPhotos(next);
    saveNeedWork({ photos: next });
  }

  function rememberVideo(next: string) {
    setVideo(next);
    saveNeedWork({ video: next });
  }

  function onPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError("");
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) setError(`You can add ${MAX_PHOTOS} photos.`);
    for (const file of files.slice(0, room)) {
      readPhoto(file)
        .then((dataUrl) => {
          setPhotos((current) => {
            if (current.length >= MAX_PHOTOS) return current;
            const next = [...current, dataUrl].slice(0, MAX_PHOTOS);
            saveNeedWork({ photos: next });
            return next;
          });
        })
        .catch(() => setError("That photo could not be added."));
    }
  }

  function onVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setError("Keep the video under 2 MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => rememberVideo(String(reader.result || ""));
    reader.onerror = () => setError("That video could not be added.");
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <UploadArea
          id="need-photos"
          icon={<IconImage className="h-6 w-6" />}
          title="Upload photos"
          hint={photos.length === 0 ? `Up to ${MAX_PHOTOS}` : `${photos.length} of ${MAX_PHOTOS}`}
          accept="image/*"
          multiple
          disabled={photos.length >= MAX_PHOTOS}
          onChange={onPhotos}
        />
        <UploadArea
          id="need-video"
          icon={<IconVideo className="h-6 w-6" />}
          title="Upload video"
          hint={video ? "1 video" : "One video"}
          accept="video/*"
          onChange={onVideo}
        />
      </div>
      {photos.length > 0 ? (
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((src, index) => (
            <li key={`${index}-${src.slice(0, 24)}`} className="relative">
              <img src={src} alt="" className="aspect-square w-full rounded-md object-cover" />
              <button
                type="button"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => rememberPhotos(photos.filter((_, photoIndex) => photoIndex !== index))}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground"
              >
                <IconClose className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {video ? (
        <div className="relative mt-6">
          <video src={video} controls className="max-h-64 w-full rounded-md bg-black" />
          <button
            type="button"
            aria-label="Remove video"
            onClick={() => rememberVideo("")}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground"
          >
            <IconClose className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-4 text-body-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function NeedMediaPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const work = readNeedWork();
  const [photos, setPhotos] = useState(work.photos);
  const video = work.video;
  const [error, setError] = useState("");

  const returning = new URLSearchParams(search).get("return") === "review";
  if (work.categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;

  function rememberPhotos(next: string[]) {
    setPhotos(next);
    saveNeedWork({ photos: next });
  }

  function onPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError("");
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) setError(`You can add ${MAX_PHOTOS} photos.`);
    for (const file of files.slice(0, room)) {
      readPhoto(file)
        .then((dataUrl) => {
          setPhotos((current) => {
            if (current.length >= MAX_PHOTOS) return current;
            const next = [...current, dataUrl].slice(0, MAX_PHOTOS);
            saveNeedWork({ photos: next });
            return next;
          });
        })
        .catch(() => setError("That photo could not be added."));
    }
  }

  return (
    <OpportunityFrame
      step={3}
      category={work.categories[0]}
      backTo={returning ? NEED_REVIEW_PATH : NEED_DESCRIBE_PATH}
      action={
        <OpportunityAction
          onClick={() => {
            saveNeedWork({ photos, video });
            navigate(needContinueTarget(NEED_SAVE_PATH, search));
          }}
        >
          {photos.length > 0 ? "Next" : "Skip for now"}
        </OpportunityAction>
      }
    >
      <h1 className={opportunityTitleClass}>
        Add photos
      </h1>
      <p className="mt-3 text-body leading-relaxed text-muted">
        Optional, but contractors respond more when they can see the space. Up to 10. They stay on this device until you
        create your account. Once your project is live, the first photo shows on its card and signed-in members can see
        them all.
      </p>
      <label
        htmlFor="need-photos"
        className={cn(
          "mt-6 flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/30 text-muted",
          photos.length >= MAX_PHOTOS && "cursor-not-allowed opacity-50",
        )}
      >
        <IconImage className="h-6 w-6" />
        <span className="mt-2 text-body-sm">Add photos</span>
        <input
          id="need-photos"
          type="file"
          accept="image/*"
          multiple
          disabled={photos.length >= MAX_PHOTOS}
          onChange={onPhotos}
          className="sr-only"
        />
      </label>
      <p className="mt-3 text-body-sm text-muted">
        {photos.length} of {MAX_PHOTOS} photos
      </p>
      {photos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-4 gap-2">
          {photos.map((src, index) => (
            <li key={`${index}-${src.slice(0, 24)}`} className="relative">
              <img src={src} alt="" className="aspect-square w-full rounded-md object-cover" />
              <button
                type="button"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => rememberPhotos(photos.filter((_, photoIndex) => photoIndex !== index))}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground"
              >
                <IconClose className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 text-body-sm text-muted">
        We remove location data from every photo before it leaves your device. Avoid showing your house number or mail.
      </p>
      {error ? <p className="mt-3 text-body-sm text-destructive">{error}</p> : null}
    </OpportunityFrame>
  );
}

function UploadArea({
  id,
  icon,
  title,
  hint,
  accept,
  multiple,
  disabled,
  onChange,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-8 text-center",
        "motion-safe:transition-colors hover:border-white/50",
        disabled && "cursor-not-allowed opacity-60 hover:border-border",
      )}
    >
      <span className="text-[#F2BA8B]">{icon}</span>
      <span className="mt-3 text-body font-medium text-foreground">{title}</span>
      <span className="mt-1 text-body-sm text-muted">{hint}</span>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
    </label>
  );
}

function readPhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("image"));
      image.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(String(reader.result || ""));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}
