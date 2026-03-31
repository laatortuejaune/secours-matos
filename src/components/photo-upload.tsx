"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import Image from "next/image";

interface PhotoUploadProps {
  currentPhoto?: string | null;
  onUpload: (path: string) => void;
  onRemove?: () => void;
}

export function PhotoUpload({ currentPhoto, onUpload, onRemove }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.path) {
        setPreview(data.path);
        onUpload(data.path);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {preview ? (
        <div className="relative w-20 h-20 rounded-md overflow-hidden border">
          <Image src={preview} alt="Photo" fill className="object-cover" />
          {onRemove && (
            <button
              type="button"
              onClick={() => { setPreview(null); onRemove(); }}
              className="absolute top-0 right-0 bg-destructive text-white rounded-bl p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
        >
          <Camera className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Envoi..." : preview ? "Changer" : "Ajouter photo"}
      </Button>
    </div>
  );
}
