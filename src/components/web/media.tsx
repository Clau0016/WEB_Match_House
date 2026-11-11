import { ImageOff } from "lucide-react";
import { useLoad } from "./common";
import { checked, db } from "./data";

const demoPhotoOwners: Record<string, string> = {
  "room-2.jpg": "1", "room-4.jpg": "1", "room-6.jpg": "1", "room-8.jpg": "1",
  "giulia.jpg": "1", "samuele.jpg": "2", "elena.jpg": "3",
};

export function isDemoProfile(id: string) {
  return /^d34d0000-0000-4000-8000-00000000000[1-3]$/.test(id);
}

export function MediaImage({ path, alt, className }: { path: string | null; alt: string; className: string }) {
  const [owner, file] = path?.split("/") ?? [];
  const demoUrl = file && owner === "d34d0000-0000-4000-8000-00000000000" + demoPhotoOwners[file] ? "/seed/" + file : null;
  const { data } = useLoad(async () => path && !demoUrl ? (await checked(db.storage.from("mh-photos").createSignedUrl(path, 900)))?.signedUrl ?? null : null, path ?? "");
  const src = demoUrl ?? data;
  return src ? <img src={src} alt={alt} className={className} loading="lazy" /> : <span className={className + " mh-image-placeholder"} aria-hidden="true"><ImageOff size={22} /></span>;
}
