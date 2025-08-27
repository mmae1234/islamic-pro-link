import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// SEO utility function for setting page title and meta description
export function setSEOTitle(title: string) {
  if (typeof document !== 'undefined') {
    document.title = title;
  }
}

export function setSEOMeta(name: string, content: string) {
  if (typeof document !== 'undefined') {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  }
}
