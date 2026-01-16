import { useLocation } from "react-router-dom";
import { useEffect } from "react";

// Current date for IP claims timestamp
const CLAIM_DATE = "2024-01-01";
const PRIORITY_DATE = "2024";

// Organization structured data for En Pensent with IP claims
const ORGANIZATION_DATA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "En Pensent",
  "alternateName": ["EnPensent", "En Pensent™"],
  "url": "https://enpensent.com",
  "logo": "https://enpensent.com/favicon.png",
  "description": "Pioneer of visual chess pattern recognition technology. Creator of the world's first chess-to-art visualization engine combining proprietary algorithms with Stockfish 17 NNUE integration.",
  "foundingDate": PRIORITY_DATE,
  "founder": {
    "@type": "Person",
    "name": "Alec Arthur Shelton",
    "jobTitle": "Founder & CEO"
  },
  "sameAs": [
    "https://twitter.com/EnPensent"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "hello@enpensent.com",
    "contactType": "customer service"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "San Francisco",
    "addressRegion": "CA",
    "addressCountry": "US"
  },
  "owns": [
    {
      "@type": "Product",
      "name": "En Pensent Visual Chess Engine",
      "description": "Proprietary chess visualization algorithm"
    }
  ]
};

// Intellectual Property Claims - establishes public record
const IP_CLAIMS_DATA = {
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "En Pensent Chess Visualization Technology",
  "creator": {
    "@type": "Organization",
    "name": "En Pensent"
  },
  "dateCreated": CLAIM_DATE,
  "datePublished": CLAIM_DATE,
  "copyrightYear": 2024,
  "copyrightHolder": {
    "@type": "Organization",
    "name": "En Pensent"
  },
  "description": "Revolutionary chess pattern recognition and visualization technology combining color theory algorithms with Stockfish 17 NNUE neural network analysis to create unique artistic representations of chess games.",
  "keywords": [
    "chess visualization",
    "pattern recognition",
    "generative art",
    "chess analytics",
    "visual encryption",
    "En Pensent algorithm"
  ],
  "isAccessibleForFree": false,
  "license": "https://enpensent.com/terms"
};

// Trademark claims structured data
const TRADEMARK_CLAIMS_DATA = {
  "@context": "https://schema.org",
  "@type": "Brand",
  "name": "En Pensent",
  "alternateName": [
    "En Pensent™",
    "Natural Vision™",
    "Hustlenomics™",
    "Vision™",
    "Visionary™"
  ],
  "logo": "https://enpensent.com/favicon.png",
  "slogan": "Transform Chess Into Art",
  "description": "Protected trademarks and service marks of En Pensent. All rights reserved.",
  "owns": {
    "@type": "CreativeWork",
    "name": "En Pensent Visual Chess Pattern Recognition System",
    "description": "Patent-pending technology for converting chess game data into visual art using proprietary color mapping and neural network analysis.",
    "dateCreated": CLAIM_DATE
  }
};

// Technology/Invention claims
const TECHNOLOGY_CLAIMS_DATA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "En Pensent: Visual Chess Pattern Recognition Engine",
  "author": {
    "@type": "Organization",
    "name": "En Pensent"
  },
  "datePublished": CLAIM_DATE,
  "description": "First-of-its-kind technology combining: (1) Proprietary color theory algorithms mapping chess positions to visual patterns, (2) Stockfish 17 NNUE integration for position evaluation, (3) Visual encryption methodology for art generation, (4) Natural Vision™ scanner technology for art-to-game reverse lookup, (5) Predictive pattern analysis for move suggestion.",
  "keywords": [
    "chess engine",
    "pattern recognition",
    "color theory",
    "generative art",
    "neural network",
    "Stockfish 17",
    "visual encryption",
    "reverse image lookup"
  ],
  "about": {
    "@type": "Thing",
    "name": "Chess Visualization Technology",
    "description": "Novel method and system for transforming chess game notation into unique visual art"
  }
};

// WebSite structured data for search box
const WEBSITE_DATA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "En Pensent",
  "url": "https://enpensent.com",
  "description": "World's first visual chess pattern recognition engine. Transform any chess game into stunning generative art.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://enpensent.com/marketplace?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

// Software Application data for the platform
const SOFTWARE_APP_DATA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "En Pensent",
  "operatingSystem": "Web",
  "applicationCategory": "ArtApplication",
  "applicationSubCategory": "Chess Analysis",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "150"
  },
  "description": "Pioneer of visual chess pattern recognition. Transform chess games into unique generative art using our proprietary algorithm combined with Stockfish 17 analysis. Features include PGN/FEN visualization, custom color palettes, HD exports, Natural Vision™ scanner, and print ordering.",
  "featureList": [
    "Proprietary chess-to-art visualization algorithm",
    "Stockfish 17 NNUE integration",
    "Natural Vision™ scanner technology",
    "HD export and print ordering",
    "Marketplace for trading Visions",
    "Predictive pattern analysis"
  ],
  "softwareVersion": "1.0",
  "datePublished": CLAIM_DATE,
  "creator": {
    "@type": "Organization",
    "name": "En Pensent"
  }
};

// Product data for the main service offering
const PRODUCT_DATA = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Chess Art Prints by En Pensent",
  "brand": {
    "@type": "Brand",
    "name": "En Pensent"
  },
  "description": "Custom generative art prints created using En Pensent's proprietary visualization technology. Each Vision is unique based on your game's moves, chosen color palette, and our patent-pending algorithm.",
  "image": "https://enpensent.com/opengraph-image-p98pqg.png",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "29",
    "highPrice": "199",
    "priceCurrency": "USD",
    "offerCount": "1000+"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "200"
  },
  "manufacturer": {
    "@type": "Organization",
    "name": "En Pensent"
  }
};

// FAQ data for common questions with IP emphasis
const FAQ_DATA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is En Pensent?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "En Pensent is the pioneer of visual chess pattern recognition technology. Founded in 2024, we created the world's first algorithm that transforms chess games into unique generative art by combining proprietary color theory with Stockfish 17 neural network analysis."
      }
    },
    {
      "@type": "Question",
      "name": "How does En Pensent's technology work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our patent-pending technology uses a proprietary algorithm that maps chess positions and moves to visual patterns using advanced color theory. Combined with Stockfish 17 NNUE integration, we analyze millions of patterns to create unique artistic representations of each game."
      }
    },
    {
      "@type": "Question",
      "name": "What is Natural Vision™?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Natural Vision™ is En Pensent's proprietary scanner technology that can identify and authenticate any Vision artwork. It uses pattern recognition to reverse-lookup the original chess game from its visual representation."
      }
    },
    {
      "@type": "Question",
      "name": "What is a Vision?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A Vision is En Pensent's trademarked term for each unique chess art piece. Each Vision is created from a specific game and palette combination using our proprietary algorithm, making it one-of-a-kind. Visions can be saved, traded, and printed."
      }
    },
    {
      "@type": "Question",
      "name": "Can I sell my chess art?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Visionary™ members can list their Visions on our marketplace. Creators earn perpetual royalties on all secondary sales through our Hustlenomics™ system."
      }
    },
    {
      "@type": "Question",
      "name": "What is the Education Fund?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "2% of all En Pensent platform revenue goes to our Chess Education Fund, supporting chess education programs for underserved communities worldwide."
      }
    }
  ]
};

// Comprehensive breadcrumb configuration with categories
type BreadcrumbConfig = {
  name: string;
  parent?: string; // Parent path for nested breadcrumbs
};

const BREADCRUMB_MAP: Record<string, BreadcrumbConfig> = {
  // Main sections
  "/about": { name: "About" },
  "/investors": { name: "Investors", parent: "/about" },
  "/education-fund": { name: "Education Fund", parent: "/about" },
  
  // Marketplace & Trading
  "/marketplace": { name: "Marketplace" },
  "/shop": { name: "Shop", parent: "/marketplace" },
  "/order-print": { name: "Order Print", parent: "/shop" },
  
  // Gallery & Collections
  "/my-vision": { name: "My Gallery" },
  "/my-palettes": { name: "My Palettes", parent: "/my-vision" },
  "/creator-dashboard": { name: "Creator Dashboard", parent: "/my-vision" },
  
  // Creative Tools
  "/creative-mode": { name: "Creative Mode" },
  "/studio": { name: "Studio", parent: "/creative-mode" },
  "/book": { name: "Book Generator", parent: "/creative-mode" },
  
  // Gaming & Competition
  "/play": { name: "Play Chess" },
  "/leaderboard": { name: "Leaderboard", parent: "/play" },
  
  // Discovery & Scanning
  "/vision-scanner": { name: "Vision Scanner" },
  
  // News & Updates
  "/news": { name: "News" },
  
  // Account & Settings
  "/account": { name: "Account" },
  "/premium": { name: "Premium", parent: "/account" },
  "/analytics": { name: "Analytics", parent: "/account" },
  "/premium-analytics": { name: "Premium Analytics", parent: "/analytics" },
  "/profile": { name: "Profile", parent: "/account" },
  
  // Legal Pages
  "/terms": { name: "Terms of Service" },
  "/privacy": { name: "Privacy Policy" },
  "/dmca": { name: "DMCA" }
};

// Build full breadcrumb trail including parent hierarchy
const getBreadcrumbData = (pathname: string) => {
  const breadcrumbs: { name: string; url: string }[] = [
    { name: "Home", url: "https://enpensent.com" }
  ];
  
  if (pathname === "/" || !BREADCRUMB_MAP[pathname]) {
    // For home or unknown pages, just return home breadcrumb
    if (pathname !== "/" && pathname.length > 1) {
      // Generate breadcrumb from path for dynamic routes
      const pathName = pathname.slice(1).split("-").map(
        word => word.charAt(0).toUpperCase() + word.slice(1)
      ).join(" ");
      breadcrumbs.push({
        name: pathName,
        url: `https://enpensent.com${pathname}`
      });
    }
  } else {
    const config = BREADCRUMB_MAP[pathname];
    
    // Build parent chain
    const chain: { name: string; path: string }[] = [];
    let currentPath: string | undefined = pathname;
    
    while (currentPath && BREADCRUMB_MAP[currentPath]) {
      const currentConfig = BREADCRUMB_MAP[currentPath];
      chain.unshift({ name: currentConfig.name, path: currentPath });
      currentPath = currentConfig.parent;
    }
    
    // Add all breadcrumbs in order
    chain.forEach(item => {
      breadcrumbs.push({
        name: item.name,
        url: `https://enpensent.com${item.path}`
      });
    });
  }
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

// Helper to inject script tag
const injectStructuredData = (id: string, data: object) => {
  // Remove existing script if present
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }
  
  // Create and inject new script
  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

export const StructuredData = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Always inject global structured data - including IP claims
    injectStructuredData("sd-organization", ORGANIZATION_DATA);
    injectStructuredData("sd-website", WEBSITE_DATA);
    injectStructuredData("sd-software", SOFTWARE_APP_DATA);
    
    // Always inject IP protection claims on every page
    injectStructuredData("sd-ip-claims", IP_CLAIMS_DATA);
    injectStructuredData("sd-trademark-claims", TRADEMARK_CLAIMS_DATA);
    injectStructuredData("sd-technology-claims", TECHNOLOGY_CLAIMS_DATA);
    
    // Inject breadcrumbs based on current page
    const breadcrumbData = getBreadcrumbData(location.pathname);
    injectStructuredData("sd-breadcrumbs", breadcrumbData);
    
    // Page-specific structured data
    if (location.pathname === "/") {
      injectStructuredData("sd-product", PRODUCT_DATA);
      injectStructuredData("sd-faq", FAQ_DATA);
    } else if (location.pathname === "/marketplace") {
      injectStructuredData("sd-product", PRODUCT_DATA);
    } else if (location.pathname === "/about" || location.pathname === "/investors") {
      injectStructuredData("sd-faq", FAQ_DATA);
    }
    
    // Cleanup function to remove page-specific data when navigating away
    return () => {
      if (location.pathname !== "/" && location.pathname !== "/marketplace") {
        const productScript = document.getElementById("sd-product");
        if (productScript) productScript.remove();
      }
      if (location.pathname !== "/" && location.pathname !== "/about" && location.pathname !== "/investors") {
        const faqScript = document.getElementById("sd-faq");
        if (faqScript) faqScript.remove();
      }
    };
  }, [location.pathname]);
  
  return null; // This component doesn't render anything visible
};

export default StructuredData;
