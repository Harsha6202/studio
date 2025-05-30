import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const inferIsVideoUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|ogg)$/i.test(url) || url.startsWith('data:video/') || url.startsWith('blob:');
};

// Helper to check if a src string is potentially valid for Image or Video
export const isPotentiallyValidMediaSrc = (url: string | undefined | null): url is string => {
  if (!url || url.trim() === "") {
    return false;
  }
  // Allow common image and video data URIs, http/https, relative paths, and blob URLs
  return (
    url.startsWith("data:image") ||
    url.startsWith("data:video") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/") ||
    url.startsWith("blob:")
  );
};