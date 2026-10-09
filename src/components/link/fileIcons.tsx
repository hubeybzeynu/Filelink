// One place that decides which icon (and tint) a file or folder gets, so the
// File Explorer, the AI's file list and its choice cards all look the same.

import {
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  Laptop,
} from "lucide-react";
import type { ComponentType } from "react";

type IconComponent = ComponentType<{ className?: string }>;

const EXT_ICON: { test: RegExp; icon: IconComponent; tone: string }[] = [
  { test: /\.(png|jpe?g|gif|webp|svg|bmp|heic|avif|ico)$/i, icon: FileImage, tone: "text-accent" },
  { test: /\.(mp4|mov|mkv|avi|webm|m4v)$/i, icon: FileVideo, tone: "text-accent" },
  { test: /\.(mp3|wav|flac|ogg|m4a)$/i, icon: FileAudio, tone: "text-accent" },
  { test: /\.(zip|rar|7z|tar|gz|bz2|xz|apk|jar|iso)$/i, icon: FileArchive, tone: "text-warning" },
  { test: /\.(pdf|docx?|rtf|odt|txt|md|pages)$/i, icon: FileText, tone: "text-destructive" },
  { test: /\.(xlsx?|csv|numbers|ods|pptx?)$/i, icon: FileSpreadsheet, tone: "text-primary" },
  {
    test: /\.(tsx?|jsx?|mjs|cjs|json|html?|css|scss|py|rb|go|rs|java|cs|cpp|c|h|php|sh|ps1|bat|cmd|sql|ya?ml|toml|xml)$/i,
    icon: FileCode2,
    tone: "text-primary",
  },
];

export function iconForName(name: string, kind: "file" | "folder" | "device" | "generic" = "file") {
  if (kind === "folder") return { Icon: Folder as IconComponent, tone: "text-warning" };
  if (kind === "device") return { Icon: Laptop as IconComponent, tone: "text-primary" };
  const hit = EXT_ICON.find((e) => e.test.test(name));
  return {
    Icon: (hit?.icon ?? FileIcon) as IconComponent,
    tone: hit?.tone ?? "text-muted-foreground",
  };
}

export function FileTypeIcon({
  name,
  kind = "file",
  className = "size-5",
}: {
  name: string;
  kind?: "file" | "folder" | "device" | "generic";
  className?: string;
}) {
  const { Icon, tone } = iconForName(name, kind);
  return <Icon className={`${className} shrink-0 ${tone}`} />;
}
