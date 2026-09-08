import { useState } from "react";
import { MoreVertical, Play, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { compactNumber } from "@/lib/format";

/**
 * Grid tile used on profiles and in search.
 *
 * The preview is the real video (first frame), never a blank poster, and the
 * whole tile is tappable so the clip opens in the full player. Owner controls
 * live inside the three-dot menu only.
 */
export function VideoTile({
  videoUrl,
  posterUrl,
  views,
  onOpen,
  onDelete,
  deleting,
}: {
  videoUrl?: string;
  posterUrl?: string;
  views?: number;
  onOpen: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Play clip"
        className="press block w-full"
      >
        <video
          src={videoUrl ? `${videoUrl}#t=0.1` : undefined}
          poster={posterUrl || undefined}
          muted
          playsInline
          preload="metadata"
          tabIndex={-1}
          className="pointer-events-none aspect-[9/16] w-full bg-black object-contain"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/85 to-transparent px-2 pt-6 pb-1.5">
          <Play className="h-3 w-3 fill-current text-foreground/90" />
          <span className="text-[11px] font-bold text-foreground/95 tabular-nums">
            {compactNumber(views ?? 0)}
          </span>
        </span>
      </button>

      {onDelete ? (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Clip options"
              className="press absolute top-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-2xl border-border bg-surface">
            <DropdownMenuItem
              disabled={deleting}
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault();
                setMenuOpen(false);
                onDelete();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete clip
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
