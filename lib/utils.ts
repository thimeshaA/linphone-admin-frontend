import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// blob -> object URL -> a hidden `<a download>` click -> revoke. This is
// what lets the saved file take the filename we pass rather than the
// browser's own native-viewer guess (a plain `window.open` on a blob: URL
// loses the server's Content-Disposition filename entirely).
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
