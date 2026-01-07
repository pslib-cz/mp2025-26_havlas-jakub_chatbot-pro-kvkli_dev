import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { parse } from "node-html-parser";
import type { HTMLElement } from "node-html-parser";

export type ContentSection = {
  heading: string;
  level: number;
  content: string;
}

export interface CrawledPage {
  url: string;
  title: string;
  language?: string;
  sections: ContentSection[];
}

export interface CrawlResponse {
  success: boolean;
  message: string;
  pagesCount: number;
  outputFile: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeUrl(url: string) {
  const u = new URL(url);
  u.hash = "";
  return u.toString();
}

/**
 * Extract the main content area from HTML, removing navigation, headers, footers, etc.
 * Prefers <main> or <article>, falls back to <body>
 */
function extractMainContent(root: HTMLElement): HTMLElement | null {
  // Try to find main content container
  let mainContent = root.querySelector("main");
  if (!mainContent) {
    mainContent = root.querySelector("article");
  }
  if (!mainContent) {
    mainContent = root.querySelector("body");
  }
  
  if (!mainContent) return null;

  // Clone to avoid modifying original by serializing and re-parsing
  const clone = parse(mainContent.toString());

  // Remove unwanted elements
  const unwantedSelectors = [
    "nav",
    "header",
    "footer",
    "aside",
    "script",
    "style",
    "noscript",
    "iframe",
    ".cookie-banner",
    ".cookie-notice",
    "#cookie-consent",
    ".advertisement",
    ".ad",
    ".social-share",
    ".breadcrumb",
  ];

  unwantedSelectors.forEach((selector) => {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  });

  return clone;
}

/**
 * Extract structured content sections based on headings (h1-h6)
 * Content is grouped under the nearest preceding heading
 * Properly handles nested headings (h1 > h2 > h3) for better structure
 */
function extractStructuredSections(mainContent: HTMLElement): ContentSection[] {
  const sections: ContentSection[] = [];
  let currentSection: ContentSection | null = null;

  // Helper to normalize and clean text
  const cleanText = (text: string): string => {
    return text
      .replace(/\s+/g, " ") // normalize whitespace
      .replace(/\n+/g, " ") // remove line breaks
      .trim();
  };

  // Helper to check if text content is meaningful
  const isMeaningful = (text: string): boolean => {
    return text.length > 20; // ignore very short snippets
  };

  // Collect text from a node, excluding nested headings
  const collectText = (node: HTMLElement): string => {
    let text = "";
    
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        // Text node - collect it
        text += " " + (child.textContent || "");
      } else if (child.nodeType === 1) {
        const childEl = child as HTMLElement;
        const tag = childEl.tagName?.toLowerCase();
        
        // Skip headings - they'll be processed separately
        if (tag?.match(/^h[1-6]$/)) {
          continue;
        }
        
        // Recursively collect text from other elements
        text += " " + collectText(childEl);
      }
    }
    
    return text;
  };

  // Walk through DOM tree
  const walk = (node: HTMLElement) => {
    // Process direct children in order
    for (const child of node.childNodes) {
      if (child.nodeType !== 1) continue; // Skip non-element nodes
      
      const element = child as HTMLElement;
      const tagName = element.tagName?.toLowerCase();

      const headingMatch = tagName?.match(/^h([1-6])$/);
      if (headingMatch) {
        const level = parseInt(headingMatch[1], 10);
        const headingText = cleanText(element.textContent || "");

        if (headingText) {

          if (currentSection && isMeaningful(currentSection.content)) {
            sections.push(currentSection);
          }


          currentSection = {
            heading: headingText,
            level: level,
            content: "",
          };
        }
      } else {

        const text = cleanText(collectText(element));
        
        if (text) {
          if (!currentSection) {

            currentSection = {
              heading: "Introduction",
              level: 1,
              content: text,
            };
          } else {

            currentSection.content += (currentSection.content ? " " : "") + text;
          }
        }
        
        // Recurse to find nested headings
        walk(element);
      }
    }
  };

  walk(mainContent);

  //@ts-ignore
  if (currentSection && isMeaningful(currentSection.content)) {
    sections.push(currentSection);
  }

  return sections;
}

export async function crawlSite(
  startUrl: string = "https://www.kvkli.cz",
  options?: {
    maxPages?: number;
    delayMs?: number;
  }
): Promise<CrawlResponse> {
  const maxPages = options?.maxPages ?? 100;
  const delayMs = options?.delayMs ?? 5000;

  const visited = new Set<string>();
  const queue: string[] = [startUrl];
  const results: CrawledPage[] = [];

  const baseOrigin = new URL(startUrl).origin;

  try {
    while (queue.length > 0 && visited.size < maxPages) {
      const currentUrl = queue.shift()!;
      const normalized = normalizeUrl(currentUrl);

      if (visited.has(normalized)) continue;
      visited.add(normalized);

      console.log("Crawling:", normalized);

      let html: string;
      try {
        const res = await axios.get(normalized, {
          headers: {
            "User-Agent": "RespectfulCrawler/1.0 (+slow)",
          },
          timeout: 10000,
        });
        html = res.data;
      } catch {
        continue;
      }

      // Parse HTML
      const root = parse(html);

      // Extract structured content
      const title =
        root.querySelector("title")?.textContent?.trim() || "Untitled";
      const language =
        root.querySelector("html")?.getAttribute("lang") || undefined;

      const mainContent = extractMainContent(root);
      const sections = mainContent
        ? extractStructuredSections(mainContent)
        : [];

      // Store structured page data
      results.push({
        url: normalized,
        title,
        language,
        sections,
      });

      // Find links for further crawling
      const links = root.querySelectorAll("a[href]");

      for (const a of links) {
        let href = a.getAttribute("href");
        if (!href) continue;

        try {
          const absolute = normalizeUrl(
            new URL(href, normalized).toString()
          );

          if (!absolute.startsWith(baseOrigin)) continue;
          if (!visited.has(absolute)) {
            queue.push(absolute);
          }
        } catch {
          // ignore invalid URLs
        }
      }

      // 🔥 THIS is what makes it slow & safe
      await sleep(delayMs + Math.random() * 1000);
    }

    const outputDir = path.join(process.cwd(), "crawler-output");
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = Date.now();
    const outputFile = path.join(
      outputDir,
      `kvkli-structured-content-${timestamp}.json`
    );

    // Save structured content for vector embeddings / semantic search
    await fs.writeFile(
      outputFile,
      JSON.stringify(results, null, 2),
      "utf-8"
    );

    return {
      success: true,
      message: "Crawling completed politely 🐢",
      pagesCount: visited.size,
      outputFile,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message ?? "Crawler failed",
      pagesCount: visited.size,
      outputFile: "",
    };
  }
}
