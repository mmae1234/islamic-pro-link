import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
// Vite raw import to read the changelog at build time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import changelog from "../../CHANGELOG.md?raw";

const AdminReleaseNotes: React.FC = () => {
  useEffect(() => {
    // Basic SEO for SPA route
    document.title = "Release Notes | Admin";
    const desc = "Internal release notes with dates and versioned changes (Keep a Changelog).";
    const existingDesc = document.querySelector('meta[name="description"]');
    if (existingDesc) existingDesc.setAttribute("content", desc);
    else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = desc;
      document.head.appendChild(meta);
    }
    const canonicalHref = `${window.location.origin}/admin/release-notes`;
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonicalHref;
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Release Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh] pr-4">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{changelog}</ReactMarkdown>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </main>
  );
};

export default AdminReleaseNotes;
