import React, { useEffect, useMemo } from "react";
import { X } from "lucide-react";

function getEmbeddedUrl(rawUrl, kind) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol)) return null;

  if (kind === "video") {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";
    if (host === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      videoId = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || "";
    }
    if (videoId) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
  }

  if (url.hostname.toLowerCase().includes("drive.google.com")) {
    const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
    if (fileId) return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
  }

  if (url.hostname.toLowerCase() === "docs.google.com") {
    const docMatch = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
    if (docMatch) return `https://docs.google.com/${docMatch[1]}/d/${encodeURIComponent(docMatch[2])}/preview`;
  }

  // Browsers display PDF URLs in their built-in viewer when embedded in an iframe.
  if (kind === "pdf" && url.pathname.toLowerCase().endsWith(".pdf")) url.hash = "toolbar=1";
  return url.toString();
}

export default function StudyMaterialViewer({ material, onClose }) {
  const embedUrl = useMemo(() => material ? getEmbeddedUrl(material.url, material.kind) : null, [material]);

  useEffect(() => {
    if (!material) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [material, onClose]);

  if (!material) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm md:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={material.title} className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-line px-4 py-3 md:px-6">
          <div className="min-w-0"><h2 className="truncate text-sm font-black text-content md:text-lg">{material.title}</h2><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Study Material Viewer</p></div>
          <button type="button" onClick={onClose} aria-label="Close viewer" className="rounded-xl p-2 text-content-muted transition hover:bg-red-50 hover:text-red-600"><X className="h-5 w-5"/></button>
        </header>
        {embedUrl ? <div className={`relative min-h-0 flex-1 bg-surface-subtle ${material.kind === "video" ? "flex items-center justify-center" : "h-[78vh]"}`}>
          <iframe
            key={embedUrl}
            title={material.title}
            src={embedUrl}
            className={material.kind === "video" ? "aspect-video max-h-[78vh] w-full bg-surface-inverse" : "h-full w-full bg-surface"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-center text-[10px] text-white">If the provider blocks embedded viewing, adjust its sharing permissions and try again.</p>
        </div> : <div className="p-10 text-center text-sm font-semibold text-red-600">This material link is invalid. Use an HTTP or HTTPS URL.</div>}
      </section>
    </div>
  );
}
