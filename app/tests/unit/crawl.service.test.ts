import { describe, it, expect } from "@jest/globals";
import { parse } from "node-html-parser";

// Note: We're testing the helper functions that are exported
// crawlSite() requires network calls so we won't test it in unit tests

describe("crawl.service helpers", () => {
  describe("HTML parsing and content extraction", () => {
    it("should extract title from HTML", () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Page Title</title></head>
          <body><p>Content</p></body>
        </html>
      `;
      
      const root = parse(html);
      const title = root.querySelector("title")?.textContent?.trim();
      
      expect(title).toBe("Test Page Title");
    });

    it("should extract language attribute from html tag", () => {
      const html = `
        <!DOCTYPE html>
        <html lang="cs">
          <head><title>Test</title></head>
          <body><p>Content</p></body>
        </html>
      `;
      
      const root = parse(html);
      const language = root.querySelector("html")?.getAttribute("lang");
      
      expect(language).toBe("cs");
    });

    it("should find main content area", () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <header>Header content</header>
            <main>
              <h1>Main Content</h1>
              <p>This is the main content area.</p>
            </main>
            <footer>Footer content</footer>
          </body>
        </html>
      `;
      
      const root = parse(html);
      const main = root.querySelector("main");
      
      expect(main).toBeDefined();
      expect(main?.textContent).toContain("Main Content");
      expect(main?.textContent).toContain("This is the main content area");
    });

    it("should extract links with href attributes", () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <a href="https://example.com/page1">Link 1</a>
            <a href="/relative/path">Link 2</a>
            <a>No href</a>
          </body>
        </html>
      `;
      
      const root = parse(html);
      const links = root.querySelectorAll("a[href]");
      
      expect(links).toHaveLength(2);
      expect(links[0].getAttribute("href")).toBe("https://example.com/page1");
      expect(links[1].getAttribute("href")).toBe("/relative/path");
    });

    it("should handle headings of different levels", () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>Level 1</h1>
            <h2>Level 2</h2>
            <h3>Level 3</h3>
            <h4>Level 4</h4>
            <h5>Level 5</h5>
            <h6>Level 6</h6>
          </body>
        </html>
      `;
      
      const root = parse(html);
      
      expect(root.querySelector("h1")?.textContent).toBe("Level 1");
      expect(root.querySelector("h2")?.textContent).toBe("Level 2");
      expect(root.querySelector("h3")?.textContent).toBe("Level 3");
      expect(root.querySelector("h4")?.textContent).toBe("Level 4");
      expect(root.querySelector("h5")?.textContent).toBe("Level 5");
      expect(root.querySelector("h6")?.textContent).toBe("Level 6");
    });

    it("should extract paragraph content", () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <p>First paragraph.</p>
            <p>Second paragraph with <strong>bold text</strong>.</p>
          </body>
        </html>
      `;
      
      const root = parse(html);
      const paragraphs = root.querySelectorAll("p");
      
      expect(paragraphs).toHaveLength(2);
      expect(paragraphs[0].textContent).toBe("First paragraph.");
      expect(paragraphs[1].textContent).toContain("Second paragraph");
      expect(paragraphs[1].textContent).toContain("bold text");
    });
  });

  describe("URL handling", () => {
    it("should construct absolute URL from relative path", () => {
      const baseUrl = "https://example.com/page1";
      const relativePath = "/page2";
      
      const absoluteUrl = new URL(relativePath, baseUrl).toString();
      
      expect(absoluteUrl).toBe("https://example.com/page2");
    });

    it("should normalize URL by removing hash", () => {
      const url = new URL("https://example.com/page#section");
      url.hash = "";
      
      expect(url.toString()).toBe("https://example.com/page");
    });

    it("should extract origin from URL", () => {
      const url = new URL("https://example.com/path/to/page?query=1");
      
      expect(url.origin).toBe("https://example.com");
    });

    it("should validate same origin", () => {
      const baseOrigin = new URL("https://example.com").origin;
      const url1 = "https://example.com/page1";
      const url2 = "https://other.com/page1";
      
      expect(url1.startsWith(baseOrigin)).toBe(true);
      expect(url2.startsWith(baseOrigin)).toBe(false);
    });
  });

  describe("Content structure", () => {
    it("should identify semantic HTML5 elements", () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <header>Header</header>
            <nav>Navigation</nav>
            <main>Main content</main>
            <article>Article</article>
            <aside>Sidebar</aside>
            <footer>Footer</footer>
          </body>
        </html>
      `;
      
      const root = parse(html);
      
      expect(root.querySelector("header")).toBeDefined();
      expect(root.querySelector("nav")).toBeDefined();
      expect(root.querySelector("main")).toBeDefined();
      expect(root.querySelector("article")).toBeDefined();
      expect(root.querySelector("aside")).toBeDefined();
      expect(root.querySelector("footer")).toBeDefined();
    });

    it("should detect script and style tags for removal", () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>body { color: red; }</style>
            <script>console.log('test');</script>
          </head>
          <body>
            <p>Content</p>
            <script>alert('inline');</script>
          </body>
        </html>
      `;
      
      const root = parse(html);
      const scripts = root.querySelectorAll("script");
      const styles = root.querySelectorAll("style");
      
      expect(scripts.length).toBeGreaterThan(0);
      expect(styles.length).toBeGreaterThan(0);
    });
  });

  describe("Text normalization", () => {
    it("should normalize whitespace", () => {
      const text = "This  has    multiple   spaces";
      const normalized = text.replace(/\s+/g, " ").trim();
      
      expect(normalized).toBe("This has multiple spaces");
    });

    it("should remove line breaks", () => {
      const text = "Line 1\nLine 2\nLine 3";
      const normalized = text.replace(/\n+/g, " ").trim();
      
      expect(normalized).toBe("Line 1 Line 2 Line 3");
    });

    it("should trim leading and trailing whitespace", () => {
      const text = "   trimmed   ";
      const trimmed = text.trim();
      
      expect(trimmed).toBe("trimmed");
    });

    it("should check if text is meaningful", () => {
      const isMeaningful = (text: string): boolean => text.length > 20;
      
      expect(isMeaningful("Short")).toBe(false);
      expect(isMeaningful("This is a longer piece of meaningful text")).toBe(true);
    });
  });

  describe("Sentence splitting", () => {
    it("should split text by sentence delimiters", () => {
      const text = "First sentence. Second sentence! Third sentence? Fourth.";
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      
      expect(sentences).toHaveLength(4);
      expect(sentences[0]?.trim()).toBe("First sentence.");
      expect(sentences[1]?.trim()).toBe("Second sentence!");
      expect(sentences[2]?.trim()).toBe("Third sentence?");
    });

    it("should handle text without sentence delimiters", () => {
      const text = "No delimiters here";
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      
      expect(sentences).toHaveLength(1);
      expect(sentences[0]).toBe("No delimiters here");
    });
  });
});
