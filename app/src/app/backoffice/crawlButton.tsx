"use client";
import { gql } from "@apollo/client";
import {  useMutation } from "@apollo/client/react";

interface CrawlWebsiteResponse {
  crawlWebsite: {
    success: boolean;
    message: string;
    pagesCount: number;
    outputFile: string;
  };
}

const CRAWL_WEBSITE = gql`
  mutation CrawlWebsite($url: String) {
    crawlWebsite(url: $url) {
      success
      message
      pagesCount
      outputFile
    }
  }
`;

function CrawlPanel(): React.ReactElement {
  const [crawlWebsite, { data, loading, error }] = useMutation<CrawlWebsiteResponse>(CRAWL_WEBSITE);

  const handleCrawl = () => {
    crawlWebsite({
      variables: { url: "https://kvkli.cz" }
    });
  };

  return (
    <div className="p-4">
      <button
        disabled={loading}
        onClick={handleCrawl}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? "Crawling..." : "Run Crawl"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error.message}
        </div>
      )}

      {data?.crawlWebsite && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h3 className="font-bold">Crawl Results:</h3>
          <pre className="mt-2">{JSON.stringify(data.crawlWebsite, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default CrawlPanel;
