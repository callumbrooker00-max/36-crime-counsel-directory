"use client";

import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { uploadHeadshot, removeHeadshot } from "@/lib/admin/image-actions";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function cropToBlob(src: string, area: Area): Promise<Blob | null> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.92));
}

export function ImageUploader({
  counselId,
  name,
  initialUrl,
  initialAlt,
  onChange,
}: {
  counselId: string;
  name: string;
  initialUrl?: string | null;
  initialAlt?: string | null;
  onChange?: (url: string | null) => void;
}) {
  const { toast } = useToast();
  const [url, setUrl] = React.useState<string | null>(initialUrl ?? null);
  const [alt, setAlt] = React.useState(initialAlt ?? "");
  const [src, setSrc] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [area, setArea] = React.useState<Area | null>(null);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  async function save() {
    if (!src || !area) return;
    setBusy(true);
    const blob = await cropToBlob(src, area);
    if (!blob) {
      setBusy(false);
      toast({ title: "Couldn't crop the image." });
      return;
    }
    const fd = new FormData();
    fd.append("image", blob, "headshot.jpg");
    fd.append("alt", alt);
    const res = await uploadHeadshot(counselId, fd);
    setBusy(false);
    if (res.ok) {
      setUrl(res.url ?? null);
      setSrc(null);
      onChange?.(res.url ?? null);
      toast({ title: "Headshot updated" });
    } else {
      toast({ title: res.error ?? "Upload failed." });
    }
  }

  async function remove() {
    setBusy(true);
    const res = await removeHeadshot(counselId);
    setBusy(false);
    if (res.ok) {
      setUrl(null);
      onChange?.(null);
      toast({ title: "Headshot removed" });
    } else toast({ title: res.error ?? "Couldn't remove." });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={name} src={url ?? undefined} size="lg" />
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onFile} aria-label="Choose a headshot" />
          <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            {url ? "Replace" : "Upload"} photo
          </Button>
          {url && (
            <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={busy}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <Input label="Alt text" value={alt} onChange={(e) => setAlt(e.target.value)} helpText="Describe the photo for screen readers." />

      <Modal open={src !== null} onOpenChange={(o) => !o && setSrc(null)}>
        {src && (
          <ModalContent title="Crop headshot" description="Drag to reposition, use the slider to zoom." className="max-w-lg">
            <div className="relative h-64 w-full overflow-hidden rounded-control bg-ink">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, px) => setArea(px)}
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom"
                className="flex-1 accent-[var(--color-ribbon)]"
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => setSrc(null)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" loading={busy} onClick={save}>
                Save
              </Button>
            </div>
          </ModalContent>
        )}
      </Modal>
    </div>
  );
}
