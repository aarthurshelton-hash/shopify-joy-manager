import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageMeta {
  title: string;
  description: string;
  image?: string;
  type?: string;
  keywords?: string;
}

// Page-specific meta data
const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "En Pensent - Transform Chess Games Into Art",
    description: "Create stunning generative art from any chess game. Upload PGN, choose a palette, and transform your games into museum-quality prints.",
    image: "https://enpensent.com/og-home.png",
    type: "website",
    keywords: "chess art, generative art, chess visualization, PGN art, chess prints, chess gifts"
  },
  "/about": {
    title: "About En Pensent - Our Story & Mission",
    description: "Learn about En Pensent's mission to transform chess games into unique generative art. Founded by chess enthusiasts and artists.",
    image: "https://enpensent.com/og-about.png",
    type: "website",
    keywords: "about en pensent, chess art company, generative art startup"
  },
  "/investors": {
    title: "Invest in En Pensent - Investor Relations",
    description: "Join us in revolutionizing chess art. View our pitch deck, TAM analysis, and investment opportunities.",
    image: "https://enpensent.com/og-investors.png",
    type: "website",
    keywords: "invest chess art, en pensent investment, chess startup funding"
  },
  "/marketplace": {
    title: "Vision Marketplace - Buy & Sell Chess Art",
    description: "Discover, collect, and trade unique chess visualizations. Browse thousands of Visions created by our community.",
    image: "https://enpensent.com/og-marketplace.png",
    type: "website",
    keywords: "chess art marketplace, buy chess art, sell chess visualizations, vision trading"
  },
  "/my-vision": {
    title: "My Gallery - Your Chess Art Collection",
    description: "View and manage your personal collection of chess visualizations. Export, print, or list your Visions for sale.",
    image: "https://enpensent.com/og-gallery.png",
    type: "website"
  },
  "/my-palettes": {
    title: "My Palettes - Custom Color Schemes",
    description: "Create and manage custom color palettes for your chess visualizations. Make your art truly unique.",
    image: "https://enpensent.com/og-palettes.png",
    type: "website"
  },
  "/creative-mode": {
    title: "Creative Mode - Design Custom Chess Art",
    description: "Full creative control over your chess visualizations. Customize every aspect of your artwork.",
    image: "https://enpensent.com/og-creative.png",
    type: "website",
    keywords: "custom chess art, design chess visualization, creative mode"
  },
  "/play": {
    title: "Play Chess - Create Art While You Play",
    description: "Play chess against Stockfish AI or friends. Watch your game transform into art in real-time.",
    image: "https://enpensent.com/og-play.png",
    type: "website",
    keywords: "play chess online, chess game art, stockfish chess"
  },
  "/leaderboard": {
    title: "Leaderboard - Top Creators & Collectors",
    description: "See the top En Pensent creators, collectors, and most valuable Visions on the platform.",
    image: "https://enpensent.com/og-leaderboard.png",
    type: "website"
  },
  "/vision-scanner": {
    title: "Natural Vision™ Scanner - Identify Chess Art",
    description: "Scan any En Pensent print to instantly view the game, analysis, and ownership history.",
    image: "https://enpensent.com/og-scanner.png",
    type: "website",
    keywords: "vision scanner, chess art recognition, natural vision technology"
  },
  "/book": {
    title: "Chess Art Books - Carlsen in Color",
    description: "Create custom chess art books featuring your favorite games with AI-generated poetry and analysis.",
    image: "https://enpensent.com/og-book.png",
    type: "product",
    keywords: "chess art book, carlsen in color, chess visualization book"
  },
  "/order-print": {
    title: "Order Prints - Museum-Quality Chess Art",
    description: "Order museum-quality prints of your chess visualizations. Premium framing options available.",
    image: "https://enpensent.com/og-print.png",
    type: "product",
    keywords: "chess art prints, order chess art, museum quality prints"
  },
  "/education-fund": {
    title: "Chess Education Fund - Supporting Youth Chess",
    description: "2% of all En Pensent revenue supports chess education in underserved communities worldwide.",
    image: "https://enpensent.com/og-education.png",
    type: "website",
    keywords: "chess education, youth chess programs, chess charity"
  },
  "/creator-dashboard": {
    title: "Creator Dashboard - Track Your Earnings",
    description: "Monitor your Vision sales, royalties, and performance analytics as an En Pensent creator.",
    image: "https://enpensent.com/og-creator.png",
    type: "website"
  },
  "/news": {
    title: "News & Updates - En Pensent Blog",
    description: "Latest features, updates, and stories from the En Pensent community. Stay informed about new releases.",
    image: "https://enpensent.com/og-news.png",
    type: "website",
    keywords: "en pensent news, chess art updates, new features"
  },
  "/terms": {
    title: "Terms of Service - En Pensent",
    description: "Read the terms and conditions for using the En Pensent platform.",
    type: "website"
  },
  "/privacy": {
    title: "Privacy Policy - En Pensent",
    description: "Learn how En Pensent protects your privacy and handles your data.",
    type: "website"
  },
  "/dmca": {
    title: "DMCA Policy - En Pensent",
    description: "Digital Millennium Copyright Act policy and procedures for En Pensent.",
    type: "website"
  },
  "/account": {
    title: "My Account - En Pensent",
    description: "Manage your En Pensent account, subscription, and preferences.",
    type: "website"
  },
  "/analytics": {
    title: "Analytics - Vision Performance",
    description: "Track the performance and engagement of your chess visualizations.",
    type: "website"
  },
  "/premium-analytics": {
    title: "Premium Analytics - Advanced Insights",
    description: "Deep analytics and insights for Visionary members. Track trends, earnings, and more.",
    type: "website"
  },
  "/game-history": {
    title: "Game History - Your Chess Games",
    description: "View and manage your chess game history. Revisit and visualize past games.",
    type: "website"
  }
};

const DEFAULT_META: PageMeta = {
  title: "En Pensent - Chess Art Prints",
  description: "Transform any chess game into stunning generative art. Create, scan, and collect unique visualizations.",
  image: "https://enpensent.com/opengraph-image-p98pqg.png",
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
    const meta = PAGE_META[pathname] || DEFAULT_META;
    const fullUrl = `${BASE_URL}${pathname === "/" ? "" : pathname}`;
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
