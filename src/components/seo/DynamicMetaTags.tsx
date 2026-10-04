import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import pageMeta from "./pageMeta.json";

interface PageMeta {
  title: string;
  description: string;
  image?: string;
  type?: string;
  keywords?: string;
}

// Page-specific meta data (shared with scripts/prerender-meta.mjs)
const PAGE_META: Record<string, PageMeta> = pageMeta;

const DEFAULT_META: PageMeta = {
  title: "En Pensent - Chess Art Prints",
  description: "Transform any chess game into stunning generative art. Create, scan, and collect unique visualizations.",
  image: "https://enpensent.com/og-home.png",
  type: "website",
  keywords: "chess art, generative art, chess visualization, chess prints"
};

const BASE_URL = "https://enpensent.com";

// Helper to update or create meta tag
const setMetaTag = (property: string, content: string, isName = false) => {
  const attribute = isName ? "name" : "property";
  let element = document.querySelector(`meta[${attribute}="${property}"]`);
  
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, property);
    document.head.appendChild(element);
  }
  
  element.setAttribute("content", content);
};

// Helper to update link tags
const setLinkTag = (rel: string, href: string) => {
  let element = document.querySelector(`link[rel="${rel}"]`);
  
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  
  element.setAttribute("href", href);
};

export const DynamicMetaTags = () => {
  const location = useLocation();
  
  useEffect(() => {
    const pathname = location.pathname;

    // #1 — Dynamic OG tags for /g/:hash (shared game links)
    const gameMatch = pathname.match(/^\/g\/(.+)$/);
    let meta: PageMeta;
    let fullUrl: string;

    if (gameMatch) {
      meta = {
        title: "Every Game Is A Work Of Art — En Pensent",
        description: "Watch this chess game paint itself into a living visualization. Powered by the engine that reads the middlegame more accurately than Stockfish.",
        image: "https://enpensent.com/og-home.png",
        type: "website",
        keywords: "chess art, chess visualization, shared game, pgn art",
      };
      fullUrl = `${BASE_URL}/g/${gameMatch[1]}`;
    } else {
      meta = PAGE_META[pathname] || DEFAULT_META;
      fullUrl = `${BASE_URL}${pathname === "/" ? "" : pathname}`;
    }

    const imageUrl = meta.image || DEFAULT_META.image;
    
    // Update document title
    document.title = meta.title;
    
    // Basic meta tags
    setMetaTag("description", meta.description, true);
    if (meta.keywords) {
      setMetaTag("keywords", meta.keywords, true);
    }
    
    // Canonical URL
    setLinkTag("canonical", fullUrl);
    
    // Open Graph tags
    setMetaTag("og:title", meta.title);
    setMetaTag("og:description", meta.description);
    setMetaTag("og:type", meta.type || "website");
    setMetaTag("og:url", fullUrl);
    setMetaTag("og:image", imageUrl!);
    setMetaTag("og:image:width", "1200");
    setMetaTag("og:image:height", "630");
    setMetaTag("og:image:alt", meta.title);
    setMetaTag("og:site_name", "En Pensent");
    setMetaTag("og:locale", "en_US");
    
    // Twitter Card tags
    setMetaTag("twitter:card", "summary_large_image", true);
    setMetaTag("twitter:site", "@EnPensent", true);
    setMetaTag("twitter:creator", "@EnPensent", true);
    setMetaTag("twitter:title", meta.title, true);
    setMetaTag("twitter:description", meta.description, true);
    setMetaTag("twitter:image", imageUrl!, true);
    setMetaTag("twitter:image:alt", meta.title, true);
    
    // Additional SEO tags
    setMetaTag("robots", "index, follow", true);
    setMetaTag("googlebot", "index, follow", true);
    setMetaTag("author", "En Pensent", true);
    
  }, [location.pathname]);
  
  return null;
};

export default DynamicMetaTags;
