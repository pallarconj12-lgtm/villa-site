"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * next/image with a clearly labeled placeholder if the file is missing, so an
 * empty slot never looks like a broken page: it tells you which file to add.
 */
export function ImagePlaceholder({ label, src }: { label?: string; src: string }) {
  return (
    <div
      role="img"
      aria-label={`Image placeholder${label ? `: ${label}` : ""}`}
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-umber/50 bg-gradient-to-br from-sand via-[#cbbca3] to-[#b7a68b] p-6 text-center text-ink"
    >
      <span className="font-sans text-[11px] tracking-[0.25em]">IMAGE PLACEHOLDER</span>
      {label && <span className="font-display text-2xl">{label}</span>}
      <span className="max-w-full break-all font-sans text-xs text-umber">
        Add file: public{src}
      </span>
    </div>
  );
}

type Props = ImageProps & { label?: string };

export default function SafeImage({ label, src, alt, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return <ImagePlaceholder label={label ?? alt} src={String(src)} />;
  return <Image src={src} alt={alt} onError={() => setFailed(true)} {...rest} />;
}
