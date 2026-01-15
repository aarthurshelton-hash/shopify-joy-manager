import { useLocation } from "react-router-dom";
import { useEffect } from "react";

// Organization structured data for En Pensent
const ORGANIZATION_DATA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "En Pensent",
  "alternateName": "EnPensent",
  "url": "https://enpensent.com",
  "logo": "https://enpensent.com/favicon.png",
  "description": "Transform any chess game into stunning generative art. Create, scan, and collect unique visualizations.",
  "foundingDate": "2024",
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
  }
};

// WebSite structured data for search box
const WEBSITE_DATA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "En Pensent",
  "url": "https://enpensent.com",
  "description": "Transform any chess game into stunning generative art",
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
  "description": "Transform chess games into unique generative art prints. Features include PGN/FEN visualization, custom color palettes, HD exports, and print ordering."
};

// Product data for the main service offering
const PRODUCT_DATA = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Chess Art Prints",
  "brand": {
    "@type": "Brand",
    "name": "En Pensent"
  },
  "description": "Custom generative art prints created from your chess games. Each visualization is unique based on your game's moves and chosen color palette.",
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
  }
};

// FAQ data for common questions
const FAQ_DATA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is En Pensent?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "En Pensent is a platform that transforms chess games into unique generative art. Upload any PGN or FEN notation and our proprietary algorithm creates a stunning visual representation of the game."
      }
    },
    {
      "@type": "Question",
      "name": "How do I create a chess art print?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Simply paste your chess game in PGN format, select a color palette, and our algorithm generates a unique visualization. You can then download it in HD, create an animated GIF, or order a physical print."
      }
    },
    {
      "@type": "Question",
      "name": "What is a Vision?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A Vision is what we call each unique chess art piece. Each Vision is created from a specific game and palette combination, making it one-of-a-kind. Visions can be saved, traded, and printed."
      }
    },
    {
      "@type": "Question",
      "name": "Can I sell my chess art?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Premium members can list their Visions on our marketplace. Creators earn 5% perpetual royalties on all secondary sales of their original Visions."
      }
    },
    {
      "@type": "Question",
      "name": "What is the Education Fund?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "2% of all platform revenue goes to our Chess Education Fund, supporting chess education programs for underserved communities worldwide."
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
    // Always inject global structured data
    injectStructuredData("sd-organization", ORGANIZATION_DATA);
    injectStructuredData("sd-website", WEBSITE_DATA);
    injectStructuredData("sd-software", SOFTWARE_APP_DATA);
    
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
