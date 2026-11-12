import { useState, type ChangeEvent } from "react";
import { IconClose, IconImage, IconVideo } from "@/components/ui/icons";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { cn } from "@/lib/cn";

const MAX_PHOTOS = 10;
const MAX_VIDEO_BYTES = 2_000_000;
const MAX_VIDEO_SECONDS = 60;

/** Photos and one short video for the project, kept on this device until the account exists. Compact, so it fits under the description. */
export function PhotoPicker() {
  const [photos, setPhotos] = useState(readNeedWork().photos);
  const [video, setVideo] = useState(readNeedWork().video);
  const [error, setError] = useState("");

  function remember(next: string[]) {
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

  function rememberVideo(next: string) {
    setVideo(next);
    saveNeedWork({ video: next });
  }

  function onVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (file.size > MAX_VIDEO_BYTES) {
      setError("Keep the video under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError("That video could not be added.");
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const probe = document.createElement("video");
      probe.preload = "metadata";
      probe.onerror = () => setError("That video could not be added.");
      probe.onloadedmetadata = () => {
        if (probe.duration > MAX_VIDEO_SECONDS) {
          setError(`Keep the video to ${MAX_VIDEO_SECONDS} seconds or less.`);
          return;
        }
        rememberVideo(dataUrl);
      };
      probe.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-body font-medium text-foreground">
          Photos <span className="font-normal text-muted">(optional)</span>
        </p>
        <p className="text-caption text-muted">
          {photos.length} of {MAX_PHOTOS}
        </p>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {photos.map((src, index) => (
          <li key={`${index}-${src.slice(0, 24)}`} className="relative">
            <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <button
              type="button"
              aria-label={`Remove photo ${index + 1}`}
              onClick={() => remember(photos.filter((_, photoIndex) => photoIndex !== index))}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-foreground ring-1 ring-white/20"
            >
              <IconClose className="h-3 w-3" />
            </button>
          </li>
        ))}
        {photos.length < MAX_PHOTOS ? (
          <li>
            <label
              htmlFor="need-photos"
              className={cn(
                "flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/30 text-muted",
                "motion-safe:transition-colors hover:border-white/60 hover:text-foreground",
              )}
            >
              <IconImage className="h-5 w-5" />
              <span className="mt-0.5 text-caption">Add</span>
              <input id="need-photos" type="file" accept="image/*" multiple onChange={onPhotos} className="sr-only" />
            </label>
          </li>
        ) : null}
      </ul>
      <p className="mt-2 text-caption text-muted">
        We remove location data from every photo. Avoid showing your house number or mail.
      </p>

      <div className="mt-5 border-t border-border-subtle pt-5">
        <p className="text-body font-medium text-foreground">
          Short video <span className="font-normal text-muted">(optional)</span>
        </p>
        <p className="mt-1 text-caption text-muted">
          Up to {MAX_VIDEO_SECONDS} seconds and 2 MB. Avoid showing your house number or street.
        </p>
        {video ? (
          <div className="relative mt-3 w-fit">
            <video src={video} controls className="max-h-36 rounded-lg bg-black" />
            <button
              type="button"
              aria-label="Remove video"
              onClick={() => rememberVideo("")}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-foreground ring-1 ring-white/20"
            >
              <IconClose className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="need-video"
            className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-4 text-body-sm font-medium text-foreground motion-safe:transition-colors hover:border-white/50"
          >
            <IconVideo className="h-4 w-4 text-[#EE8A4A]" />
            Choose a video
            <input id="need-video" type="file" accept="video/*" onChange={onVideo} className="sr-only" />
          </label>
        )}
      </div>
      {error ? <p className="mt-3 text-body-sm text-destructive">{error}</p> : null}
    </div>
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
