"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface DialogModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  variant?: "modal" | "drawer";
  maxWidthClass?: string;
  children: React.ReactNode;
}

export function DialogModal({
  open,
  onClose,
  title,
  variant = "modal",
  maxWidthClass = "max-w-lg",
  children,
}: DialogModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      onClose();
    };

    dialog.addEventListener("close", handleClose);

    // Light-dismiss fallback for browsers lacking <dialog closedby="any">
    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, [onClose]);

  const isDrawer = variant === "drawer";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={
        isDrawer
          ? "arrow-drawer w-full max-w-md"
          : `arrow-dialog w-full ${maxWidthClass}`
      }
    >
      <div
        className={
          isDrawer
            ? "flex h-full w-full flex-col bg-white text-[#0B0B0D] shadow-2xl border-l border-neutral-200"
            : "w-full overflow-hidden rounded-2xl bg-white text-[#0B0B0D] shadow-2xl border border-neutral-200"
        }
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 shrink-0">
          <h2 id={titleId} className="font-display text-xl tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={`Close ${title}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-[#0B0B0D] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={isDrawer ? "flex-1 overflow-y-auto" : "max-h-[82dvh] overflow-y-auto"}>
          {children}
        </div>
      </div>
    </dialog>
  );
}
