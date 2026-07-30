"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OrganizationLogoProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

const tones = [
  "bg-[#fff0e8] text-[#8b3210]",
  "bg-[#edf2ff] text-[#244d9d]",
  "bg-[#eaf7f3] text-[#12644d]",
  "bg-[#f3efff] text-[#5d45a7]",
  "bg-[#f1efeb] text-[#514d49]",
];

function toneFor(name: string) {
  const hash = Array.from(name).reduce(
    (value, character) => value + character.charCodeAt(0),
    0,
  );
  return tones[hash % tones.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function OrganizationLogo({
  name,
  src,
  size = 48,
  className,
}: OrganizationLogoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/5 font-data text-xs font-semibold",
        toneFor(name),
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span>{initials(name) || "ORG"}</span>
      {showImage ? (
        <Image
          src={src!}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          unoptimized
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full bg-white object-contain p-1.5"
        />
      ) : null}
    </span>
  );
}

