import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { URL } from "url";
import fs from "fs";
import path from "path";

// ---- Types ----
export interface CrawledPage {
  link: string;
  content: string;
}

// GraphQL response type
export interface CrawlResponse {
  success: boolean;
  message: string;
  pagesCount: number;
  outputFile: string;
}

// ---- Utility ----
function normalizeUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function isSameOrigin(base: string, target: string): boolean {
  try {
    return new URL(base).origin === new URL(target).origin;
  } catch {
    return false;
  }
}

function extractPlainText(html: string): string {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, noscript, svg, img, iframe").remove();

  const text = $("body").text();

  return text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ")
    .trim();
}

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const normalized = normalizeUrl(baseUrl, href);
    if (!normalized) return;

    links.add(normalized);
  });

  return Array.from(links);
}

function safeFileName(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
}

// ---- Main crawler ----
export async function crawlSite(
  url?: string,
  options?: {
    maxPages?: number;
    delayMs?: number;
  }
): Promise<CrawlResponse> {
  const startUrl = url || "https://kvkli.cz";
  const maxPages = options?.maxPages ?? 200;
  const delayMs = options?.delayMs ?? 50;

  const visited = new Set<string>();
  const pages: CrawledPage[] = [];

  async function crawl(currentUrl: string): Promise<void> {
    console.log(`Crawling: ${currentUrl}`);
    if (visited.has(currentUrl)) return;
    if (visited.size >= maxPages) return;
    if (!isSameOrigin(startUrl, currentUrl)) return;

    visited.add(currentUrl);

    try {
      const res = await fetch(currentUrl, {
        headers: {
          "User-Agent": "AI-Context-Crawler/1.0",
        },
      });

      if (!res.ok) return;
      const html = await res.text();

      const content = extractPlainText(html);

      pages.push({
        link: currentUrl,
        content,
      });

      const links = extractLinks(html, currentUrl);

      for (const link of links) {
        if (!visited.has(link)) {
          if (delayMs > 0) {
            await new Promise((r) => setTimeout(r, delayMs));
          }
          await crawl(link);
        }
      }
    } catch {
      // Fail silently for crawler robustness
    }
  }

  try {
    await crawl(startUrl);

    const fileName = `crawl_${safeFileName(startUrl)}_${Date.now()}.json`;
    const publicDir = path.join(process.cwd(), "public");
    const filePath = path.join(publicDir, fileName);

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(
      filePath,
      JSON.stringify({ pages }, null, 2),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(publicDir, "latest_crawl.json"),
      JSON.stringify({ visited }, null, 2),
      "utf-8"
    );

    return {
      success: true,
      message: "Website crawled successfully",
      pagesCount: pages.length,
      outputFile: `/public/${fileName}`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to crawl website",
      pagesCount: 0,
      outputFile: "",
    };
  }
}
