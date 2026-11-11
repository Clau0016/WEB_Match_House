import { ImageOff } from "lucide-react";
import { useLoad } from "./common";
import { checked, db } from "./data";

export function MediaImage({ path, alt, className }: { path: string | null; alt: string; className: string }) {
  const { data } = useLoad(async () => path ? (await checked(db.storage.from("mh-photos").createSignedUrl(path, 900)))?.signedUrl ?? null : null, path ?? "");
  return data ? <img src={data} alt={alt} className={className} loading="lazy" /> : <span className={className + " mh-image-placeholder"} aria-hidden="true"><ImageOff size={22} /></span>;
}
