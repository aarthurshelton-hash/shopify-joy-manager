import jsPDF from 'jspdf';

export async function generateTAMReport(): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colors
  const gold = [212, 175, 55];
  const dark = [30, 28, 26];
  const text = [60, 60, 60];
  const lightGray = [120, 120, 120];
  const green = [34, 197, 94];
  const blue = [59, 130, 246];

  let yPos = margin;

  const addHeader = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(title, margin, yPos);
    yPos += 35;
  };

  const addSubheader = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(title, margin, yPos);
    yPos += 22;
  };

  const addParagraph = (content: string, indent = 0) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(text[0], text[1], text[2]);
    const lines = doc.splitTextToSize(content, contentWidth - indent);
    doc.text(lines, margin + indent, yPos);
    yPos += lines.length * 14 + 8;
  };

  const addBullet = (content: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(text[0], text[1], text[2]);
    doc.text('•', margin + 10, yPos);
    const lines = doc.splitTextToSize(content, contentWidth - 25);
    doc.text(lines, margin + 25, yPos);
    yPos += lines.length * 14 + 4;
  };

  const addMetricBox = (label: string, value: string, description: string) => {
    doc.setFillColor(245, 243, 240);
    doc.roundedRect(margin, yPos - 5, contentWidth, 60, 5, 5, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(label, margin + 15, yPos + 15);
    
    doc.setFontSize(22);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(value, margin + 15, yPos + 40);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(text[0], text[1], text[2]);
    doc.text(description, margin + 150, yPos + 35);
    
    yPos += 75;
  };

  const checkPageBreak = (needed: number) => {
    if (yPos + needed > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // ===== TITLE PAGE =====
  yPos = 180;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(42);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('EN PENSENT', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 60;
  doc.setFontSize(20);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text('Total Addressable Market Report', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 35;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('Chess Game Visualization Platform', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 25;
  doc.text('The Future of Chess Intelligence', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 80;
  doc.setFontSize(11);
  doc.text('January 2026', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 20;
  doc.text('Confidential Investment Document', pageWidth / 2, yPos, { align: 'center' });

  // ===== PAGE 2: Executive Summary =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Executive Summary');
  
  addParagraph('En Pensent transforms chess games into collectible generative art, creating a new category at the intersection of the $12.5B global chess market and the $65B art/collectibles market. Our platform enables chess enthusiasts to visualize, own, and trade unique "Visions" — AI-generated artworks derived from chess game data, each paired with contemplative haiku poetry.');
  
  yPos += 5;
  addParagraph('Powered by Stockfish 17 NNUE (~3200 ELO) and our proprietary Natural Vision™ pattern recognition technology, we\'re building the world\'s most comprehensive chess intelligence platform — where visual art meets predictive analytics.');
  
  yPos += 10;
  addSubheader('Key Market Insights');
  
  addBullet('800M+ active chess players globally, with 45% growth since 2020');
  addBullet('Chess.com alone has 150M+ registered users, growing 20% annually');
  addBullet('The Queen\'s Gambit effect: 125% increase in chess set sales, sustained interest');
  addBullet('Collectibles market shifting toward digital-physical hybrid products');
  addBullet('Gen Z and Millennials prefer experiences and unique items over mass-produced goods');
  addBullet('NFT market correction creates opportunity for tangible digital ownership');

  yPos += 15;
  addSubheader('Market Sizing Summary');
  
  addMetricBox('TAM', '$12.5 Billion', 'Global chess + art collectibles market');
  addMetricBox('SAM', '$2.1 Billion', 'Digital chess merchandise & collectibles');
  addMetricBox('SOM', '$180 Million', 'Achievable market share (5-year projection)');

  // ===== PAGE 3: TAM Analysis =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Total Addressable Market (TAM)');
  
  addSubheader('Market Definition');
  addParagraph('Our TAM encompasses the global market for chess-related products, personalized art, and digital collectibles. This represents the total revenue opportunity if En Pensent captured 100% of the relevant market.');
  
  addBullet('Chess merchandise and memorabilia ($2.8B) — sets, books, apparel, accessories');
  addBullet('Personalized art and custom prints ($4.2B) — growing 8% annually');
  addBullet('Digital collectibles and ownership platforms ($3.5B) — post-NFT correction');
  addBullet('Chess education and content ($2.0B) — courses, coaching, analysis tools');
  
  yPos += 15;
  addSubheader('Growth Drivers');
  
  addBullet('The Queen\'s Gambit Effect: Netflix series drove 125% increase in chess set sales, interest sustained');
  addBullet('Streaming boom: Chess.com and Lichess viewership up 300% since 2020');
  addBullet('Celebrity engagement: PewDiePie, Logic, MrBeast, and other influencers streaming chess');
  addBullet('AI advancement: Tools like Stockfish making analysis accessible to casual players');
  addBullet('Remote socialization: Chess as a shared activity during and post-pandemic');
  addBullet('Esports crossover: Chess tournaments gaining mainstream media attention');

  yPos += 15;
  addSubheader('Competitive Landscape');
  addParagraph('No direct competitors offer chess game visualization as collectible art. Adjacent markets include:');
  
  addBullet('Chess.com (analysis tools, no art/collectibles) — $100M+ revenue');
  addBullet('Chessify (engine analysis, no visualization) — Limited scale');
  addBullet('Traditional art print companies (no chess focus) — Fragmented market');
  addBullet('NFT platforms (no tangible product, market skepticism) — Trust issues');
  addBullet('Sports memorabilia platforms (different audience) — No chess focus');

  // ===== PAGE 4: SAM Analysis =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Serviceable Addressable Market (SAM)');
  
  addSubheader('Market Segmentation');
  addParagraph('Our SAM focuses on chess enthusiasts willing to spend on premium digital and physical products. We segment by engagement level and spending propensity:');
  
  yPos += 10;
  
  // Segment table
  const segments = [
    ['Serious Players (800-2000 ELO)', '50M users', '$42/year avg', '$2.1B'],
    ['Collectors & Art Buyers', '15M users', '$85/year avg', '$1.3B'],
    ['Educators & Coaches', '2M users', '$120/year avg', '$240M'],
    ['Casual Enthusiasts', '200M users', '$8/year avg', '$1.6B']
  ];
  
  doc.setFillColor(245, 243, 240);
  doc.roundedRect(margin, yPos, contentWidth, 135, 5, 5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('Segment', margin + 15, yPos + 20);
  doc.text('Users', margin + 200, yPos + 20);
  doc.text('Spend', margin + 300, yPos + 20);
  doc.text('Value', margin + 410, yPos + 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(text[0], text[1], text[2]);
  segments.forEach((seg, i) => {
    const rowY = yPos + 45 + (i * 24);
    doc.text(seg[0], margin + 15, rowY);
    doc.text(seg[1], margin + 200, rowY);
    doc.text(seg[2], margin + 300, rowY);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(seg[3], margin + 410, rowY);
    doc.setTextColor(text[0], text[1], text[2]);
  });
  
  yPos += 155;
  
  addSubheader('Geographic Focus');
  addBullet('Primary: United States, Western Europe, India (70% of target market)');
  addBullet('Secondary: Russia, Eastern Europe, South America (emerging markets)');
  addBullet('Tertiary: Southeast Asia, Australia, Japan (growth markets)');
  addBullet('Initial launch: English-speaking markets with phased international expansion');

  yPos += 15;
  addSubheader('SAM Calculation');
  addParagraph('Conservative SAM of $2.1B derived from serious players and collectors segments, representing users with demonstrated willingness to pay for premium chess products and personalized content. This excludes the larger casual enthusiast market, which represents upside potential.');

  // ===== PAGE 5: SOM Analysis =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Serviceable Obtainable Market (SOM)');
  
  addSubheader('5-Year Revenue Projection');
  addParagraph('Our SOM represents the realistic market capture based on current product-market fit indicators, growth trajectory, and competitive positioning:');
  
  yPos += 10;
  
  const projections = [
    ['Year 1', '5,000', '$50', '$250K', 'Launch phase'],
    ['Year 2', '25,000', '$65', '$1.6M', 'Book launch + mobile'],
    ['Year 3', '100,000', '$80', '$8M', 'Enterprise expansion'],
    ['Year 4', '350,000', '$95', '$33M', 'International growth'],
    ['Year 5', '1,000,000', '$120', '$120M', 'Market leadership']
  ];
  
  doc.setFillColor(245, 243, 240);
  doc.roundedRect(margin, yPos, contentWidth, 175, 5, 5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('Year', margin + 15, yPos + 20);
  doc.text('Subscribers', margin + 80, yPos + 20);
  doc.text('ARPU', margin + 180, yPos + 20);
  doc.text('Revenue', margin + 260, yPos + 20);
  doc.text('Focus', margin + 360, yPos + 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(text[0], text[1], text[2]);
  projections.forEach((proj, i) => {
    const rowY = yPos + 45 + (i * 26);
    doc.text(proj[0], margin + 15, rowY);
    doc.text(proj[1], margin + 80, rowY);
    doc.text(proj[2], margin + 180, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(proj[3], margin + 260, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(proj[4], margin + 360, rowY);
    doc.setTextColor(text[0], text[1], text[2]);
  });
  
  yPos += 195;
  
  addSubheader('Revenue Mix (Year 5 Steady State)');
  addBullet('Premium Subscriptions (40%): $48M — 400K subscribers at $10/month average');
  addBullet('Physical Prints (35%): $42M — 17% net margin on $250M gross print sales');
  addBullet('Marketplace Fees (15%): $18M — 5% on $360M in trades');
  addBullet('Enterprise & Licensing (10%): $12M — Tournament partnerships, educational institutions, API access');

  yPos += 15;
  addSubheader('Key Growth Levers');
  addBullet('Mobile app launch (Q2 2026) — 3x user acquisition potential');
  addBullet('Carlsen Book release — Premium content driving premium conversions');
  addBullet('Tournament partnerships — Exposure to competitive player segment');
  addBullet('Enterprise API — B2B revenue stream with recurring contracts');

  // ===== PAGE 6: Unit Economics =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Unit Economics');
  
  addSubheader('Profit-Based Royalty Model');
  addParagraph('En Pensent employs a sustainable profit-based royalty system. Creators earn 17% of PROFIT, not revenue, ensuring platform sustainability while rewarding engagement. This model is designed for long-term viability rather than unsustainable growth.');
  
  yPos += 10;
  
  addMetricBox('Digital Margin', '95%', 'Subscriptions & digital downloads');
  addMetricBox('Physical Margin', '~17%', 'After Printify fulfillment & platform costs');
  addMetricBox('Marketplace Fee', '5%', 'On peer-to-peer Vision trades');
  
  addSubheader('Example: $79 Canvas Print');
  
  const breakdown = [
    ['Customer pays', '$79.00'],
    ['Fulfillment (Printify)', '-$45.00'],
    ['Platform overhead', '-$5.00'],
    ['Gross Profit', '$29.00'],
    ['Creator Royalty (17%)', '-$4.93'],
    ['Net to Platform', '$24.07']
  ];
  
  doc.setFillColor(245, 243, 240);
  doc.roundedRect(margin, yPos, 280, 180, 5, 5, 'F');
  
  breakdown.forEach((item, i) => {
    const rowY = yPos + 25 + (i * 26);
    doc.setFont('helvetica', i === 3 || i === 5 ? 'bold' : 'normal');
    doc.setFontSize(10);
    if (i === 4) {
      doc.setTextColor(gold[0], gold[1], gold[2]);
    } else if (i === 5) {
      doc.setTextColor(green[0], green[1], green[2]);
    } else {
      doc.setTextColor(text[0], text[1], text[2]);
    }
    doc.text(item[0], margin + 15, rowY);
    doc.text(item[1], margin + 220, rowY, { align: 'right' });
  });
  
  yPos += 200;
  
  addSubheader('Value Distribution (17% Appreciation Pool)');
  addBullet('Creator Royalties: 40% — Direct earnings for Vision owners on print orders');
  addBullet('Education Fund: 25% — Chess scholarships and youth programs globally');
  addBullet('Palette Pool: 20% — Distributed to palette creators based on usage');
  addBullet('Legendary Gamecard Pool: 15% — Famous game holder rewards (e.g., Immortal Game)');

  // ===== PAGE 7: Technology Moat =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Technology Moat');
  
  addSubheader('Three Pillars of Competitive Advantage');
  
  yPos += 5;
  addParagraph('Our technology stack creates barriers to entry that would take years and millions of dollars to replicate:');
  
  yPos += 10;
  
  // Pillar 1
  doc.setFillColor(245, 243, 240);
  doc.roundedRect(margin, yPos, contentWidth, 100, 5, 5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('Stockfish 17 NNUE Integration', margin + 15, yPos + 25);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.text('~3200 ELO grandmaster-strength analysis with centipawn accuracy, win probability, and move', margin + 15, yPos + 50);
  doc.text('classification. Real-time evaluation powering our analytical foundation.', margin + 15, yPos + 65);
  doc.text('Depth 20+ analysis • Best move suggestions • Inaccuracy/mistake/blunder detection', margin + 15, yPos + 85);
  
  yPos += 115;
  
  // Pillar 2
  doc.setFillColor(245, 243, 240);
  doc.roundedRect(margin, yPos, contentWidth, 100, 5, 5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('Natural Vision™ Pattern Recognition', margin + 15, yPos + 25);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.text('AI-powered camera-based game identification. Point at any Vision print or image and instantly', margin + 15, yPos + 50);
  doc.text('retrieve game data. Building the largest visual chess pattern database ever created.', margin + 15, yPos + 65);
  doc.text('Cross-reference matching • Physical-digital bridge • Verification system', margin + 15, yPos + 85);
  
  yPos += 115;
  
  // Pillar 3
  doc.setFillColor(245, 243, 240);
  doc.roundedRect(margin, yPos, contentWidth, 100, 5, 5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('Proprietary Visual Encryption Algorithm', margin + 15, yPos + 25);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.text('Unique encoding system that transforms piece movements into color trails, creating layered', margin + 15, yPos + 50);
  doc.text('compositions that reveal the soul of each game. Each visualization is a scannable fingerprint.', margin + 15, yPos + 65);
  doc.text('Movement encoding • Color trail generation • Layered composition • Unique signatures', margin + 15, yPos + 85);
  
  yPos += 120;
  
  addSubheader('Network Effects');
  addBullet('More users = more trades = more marketplace liquidity = higher values');
  addBullet('More visualizations = stronger pattern database = better recognition');
  addBullet('More creators = more content = more reasons to subscribe');
  addBullet('More prints = more real-world exposure = more organic discovery');

  // ===== PAGE 8: Investment Thesis =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Investment Thesis');
  
  addSubheader('Why Now?');
  addBullet('Chess popularity at all-time highs with sustained growth trajectory');
  addBullet('NFT market correction creates vacuum for tangible digital ownership');
  addBullet('AI/ML capabilities enable unique, personalized generative art at scale');
  addBullet('Print-on-demand infrastructure mature and globally accessible');
  addBullet('First-mover advantage in nascent chess collectibles category');
  addBullet('Mobile-first generation comfortable with digital ownership');
  
  yPos += 15;
  addSubheader('Competitive Moat');
  addBullet('Proprietary visualization algorithm — server-side, obfuscated, patent-pending');
  addBullet('Stockfish 17 + color theory fusion — novel combination, not obvious to replicate');
  addBullet('Natural Vision™ scanner — technically challenging reverse-lookup technology');
  addBullet('Growing data moat — millions of visual patterns cross-referenced');
  addBullet('Established brand + community — trust and loyalty cannot be copied overnight');
  addBullet('Sustainable profit-based economics vs. unsustainable revenue-share models');
  
  yPos += 15;
  addSubheader('Strategic Value for Acquirers');
  addBullet('Instant differentiation for major chess platforms through premium art vertical');
  addBullet('Monetizes 150M+ user bases with museum-quality prints and digital ownership');
  addBullet('Creates new revenue streams without cannibalizing core chess products');
  addBullet('Enterprise-ready architecture designed for global scale integration');
  
  yPos += 15;
  addSubheader('Key Metrics to Watch');
  addBullet('Monthly Active Users (MAU) and DAU/MAU ratio (engagement)');
  addBullet('Premium conversion rate (target: 5-8% of registered users)');
  addBullet('Average Revenue Per User (ARPU) growth trajectory');
  addBullet('Vision Score growth and marketplace liquidity');
  
  yPos += 20;
  
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.roundedRect(margin, yPos, contentWidth, 100, 5, 5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Strategic Partnership Opportunity', margin + 15, yPos + 25);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('To reach full potential — processing millions of daily visualizations for 800M+ players —', margin + 15, yPos + 50);
  doc.text('this technology requires enterprise-scale infrastructure. Acquisition-ready architecture.', margin + 15, yPos + 65);
  doc.text('Contact: investors@enpensent.com', margin + 15, yPos + 85);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('En Pensent • TAM Report • Confidential', margin, pageHeight - 25);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 25, { align: 'right' });
  }

  return doc.output('blob');
}
