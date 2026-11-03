"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, Mail, Share2 } from "lucide-react";
import Button from "@/components/ui/buttons/Button";
import styles from "./ShareButton.module.css";

type ShareButtonProps = {
  /** Path of the page to share, e.g. /venues/ball-mania. The site address is added for you. */
  path: string;
  title: string;
  text: string;
};

type CopyState = "idle" | "copied" | "failed";

function absoluteUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "");
  return `${base}${path}`;
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function ShareButton({ path, title, text }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleClick() {
    // On phones, use the built in share sheet (Instagram, WhatsApp, Facebook...).
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: absoluteUrl(path) });
      } catch {
        // The person closed the share sheet. Nothing to do.
      }
      return;
    }
    setCopyState("idle");
    setOpen((prev) => !prev);
  }

  async function handleCopy() {
    const ok = await copyText(absoluteUrl(path));
    setCopyState(ok ? "copied" : "failed");
    if (ok) setTimeout(() => setCopyState("idle"), 2000);
  }

  // Only computed once the menu is open, so it never runs on the server.
  const url = open ? absoluteUrl(path) : "";
  const message = `${text} ${url}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const targets = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(message)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
  ];

  return (
    <div className={styles.root} ref={rootRef}>
      <Button
        type="button"
        variant="outline"
        icon={<Share2 />}
        onClick={handleClick}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Share
      </Button>

      {open && (
        <div className={styles.menu} role="menu">
          <button type="button" className={styles.item} role="menuitem" onClick={handleCopy}>
            {copyState === "copied" ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Link2 size={16} aria-hidden="true" />
            )}
            {copyState === "copied"
              ? "Link copied"
              : copyState === "failed"
                ? "Couldn't copy, try again"
                : "Copy link"}
          </button>

          {targets.map((target) => (
            <a
              key={target.label}
              className={styles.item}
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
            >
              {target.label}
            </a>
          ))}

          <a
            className={styles.item}
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`}
            role="menuitem"
          >
            <Mail size={16} aria-hidden="true" />
            Email
          </a>

          <p className={styles.hint}>
            For Instagram, copy the link and paste it in your story, bio or DM.
          </p>
        </div>
      )}
    </div>
  );
}