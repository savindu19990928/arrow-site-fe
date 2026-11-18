"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Pause,
  Play,
  RotateCcw,
  Smartphone,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Product3DModel } from "@/lib/types";
import { useStore } from "@/components/providers/StoreProvider";

interface ModelViewerElement extends HTMLElement {
  autoRotate?: boolean;
  cameraOrbit?: string;
  fieldOfView?: string;
  zoom?: (delta: number) => void;
  resetTurntableRotation?: () => void;
  activateAR?: () => Promise<void>;
  canActivateAR?: boolean;
}

interface Product3DViewerProps {
  viewer: Product3DModel;
  fallbackPoster?: string | null;
  className?: string;
}

export function Product3DViewer({
  viewer,
  fallbackPoster,
  className = "h-[360px] sm:h-[440px]",
}: Product3DViewerProps) {
  const { notify } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const mvRef = useRef<ModelViewerElement | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [autoRotate, setAutoRotate] = useState(viewer.auto_rotate ?? true);
  const [fovDeg, setFovDeg] = useState(() => {
    const parsed = parseFloat(viewer.field_of_view || "30");
    return Number.isFinite(parsed) ? parsed : 30;
  });

  useEffect(() => {
    let mounted = true;
    import("@google/model-viewer")
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mvRef.current) return;
    mvRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (!mvRef.current) return;
    mvRef.current.setAttribute("field-of-view", `${fovDeg}deg`);
  }, [fovDeg]);

  const handleZoomIn = () => {
    setFovDeg((prev) => Math.max(15, prev - 5));
  };

  const handleZoomOut = () => {
    setFovDeg((prev) => Math.min(55, prev + 5));
  };

  const handleReset = () => {
    const initialFov = parseFloat(viewer.field_of_view || "30") || 30;
    setFovDeg(initialFov);
    if (mvRef.current) {
      mvRef.current.setAttribute(
        "camera-orbit",
        viewer.camera_orbit || "0deg 75deg 105%"
      );
      mvRef.current.setAttribute("field-of-view", `${initialFov}deg`);
      mvRef.current.resetTurntableRotation?.();
    }
  };

  const handleAR = async () => {
    const el = mvRef.current;
    if (el && el.canActivateAR && el.activateAR) {
      try {
        await el.activateAR();
        return;
      } catch {
        // fallback message below
      }
    }
    notify({
      type: "info",
      title: "AR Ready on Mobile Devices",
      message:
        "Open this product page on an iOS (Quick Look) or Android (ARCore) phone to place the cycle in your space.",
    });
  };

  if (loadError || !viewer.model_3d_file) {
    return (
      <div
        className={`relative w-full ${className} flex flex-col items-center justify-center bg-[#EAECEF] rounded-2xl p-6 text-center`}
      >
        <Box className="h-8 w-8 text-neutral-500 mb-2" />
        <p className="text-sm font-semibold text-[#0B0B0D]">
          3D Preview Unavailable on this Browser
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          Showing high-resolution product view instead.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {ready ? (
        React.createElement("model-viewer", {
          ref: (node: ModelViewerElement | null) => {
            mvRef.current = node;
          },
          src: viewer.model_3d_file,
          poster: viewer.model_3d_poster || fallbackPoster || undefined,
          alt: `Interactive 3D model of ${viewer.name}`,
          "camera-controls": true,
          "touch-action": "pan-y",
          "auto-rotate": autoRotate ? true : undefined,
          "disable-zoom": viewer.allow_zoom === false ? true : undefined,
          "camera-orbit": viewer.camera_orbit || "0deg 75deg 105%",
          "field-of-view": `${fovDeg}deg`,
          "environment-image": viewer.environment_preset || "neutral",
          "shadow-intensity": "1",
          exposure: "1",
          ar: true,
          "ar-modes": "webxr scene-viewer quick-look",
          style: {
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
          },
        })
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-500">
          <div className="h-8 w-8 rounded-full border-2 border-[#0B0B0D] border-t-transparent animate-spin" />
          <span className="text-xs font-semibold">Loading 3D Model...</span>
        </div>
      )}

      {/* Interactive 3D & AR Control Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md border border-neutral-200 px-3 py-1.5 shadow-md">
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 pr-2 border-r border-neutral-200">
          Drag to rotate
        </span>
        {viewer.allow_zoom !== false && (
          <>
            <button
              type="button"
              onClick={handleZoomIn}
              aria-label="Zoom in 3D model"
              className="p-1.5 rounded-full hover:bg-neutral-100 text-[#0B0B0D]"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              aria-label="Zoom out 3D model"
              className="p-1.5 rounded-full hover:bg-neutral-100 text-[#0B0B0D]"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setAutoRotate((v) => !v)}
          aria-label={autoRotate ? "Pause auto-rotation" : "Resume auto-rotation"}
          className="p-1.5 rounded-full hover:bg-neutral-100 text-[#0B0B0D]"
        >
          {autoRotate ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset 3D camera"
          className="p-1.5 rounded-full hover:bg-neutral-100 text-[#0B0B0D]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleAR}
          className="ml-1 inline-flex items-center gap-1 rounded-full bg-[#0B0B0D] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-neutral-800"
        >
          <Smartphone className="h-3 w-3" />
          AR
        </button>
      </div>
    </div>
  );
}
