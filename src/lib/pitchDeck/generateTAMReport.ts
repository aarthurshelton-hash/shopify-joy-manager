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
  yPos = 200;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('EN PENSENT', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 50;
  doc.setFontSize(18);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text('Total Addressable Market Report', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('Chess Game Visualization Platform', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 80;
  doc.setFontSize(10);
  doc.text('January 2026', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  doc.text('Confidential', pageWidth / 2, yPos, { align: 'center' });

  // ===== PAGE 2: Executive Summary =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Executive Summary');
  
  addParagraph('En Pensent transforms chess games into collectible generative art, creating a new category at the intersection of the $12.5B global chess market and the $65B art/collectibles market. Our platform enables chess enthusiasts to visualize, own, and trade unique "Visions" — AI-generated artworks derived from chess game data.');
  
  yPos += 10;
  addSubheader('Key Market Insights');
  
  addBullet('800M+ active chess players globally, with 45% growth since 2020');
  addBullet('Chess.com alone has 150M+ registered users');
  addBullet('The collectibles market is shifting toward digital-physical hybrid products');
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
  addParagraph('Our TAM encompasses the global market for chess-related products, personalized art, and digital collectibles. This includes:');
  
  addBullet('Chess merchandise and memorabilia ($2.8B)');
  addBullet('Personalized art and custom prints ($4.2B)');
  addBullet('Digital collectibles and ownership platforms ($3.5B)');
  addBullet('Chess education and content ($2.0B)');
  
  yPos += 15;
  addSubheader('Growth Drivers');
  
  addBullet('The Queen\'s Gambit Effect: Netflix series drove 125% increase in chess set sales');
  addBullet('Streaming boom: Chess.com and Lichess viewership up 300% since 2020');
  addBullet('Celebrity engagement: PewDiePie, Logic, and other influencers streaming chess');
  addBullet('AI advancement: Tools like Stockfish making analysis accessible to casual players');
  addBullet('Remote socialization: Chess as a shared activity during and post-pandemic');

  yPos += 15;
  addSubheader('Competitive Landscape');
  addParagraph('No direct competitors offer chess game visualization as collectible art. Adjacent markets include:');
  
  addBullet('Chess.com (analysis tools, no art/collectibles)');
  addBullet('Chessify (engine analysis, no visualization)');
  addBullet('Traditional art print companies (no chess focus)');
  addBullet('NFT platforms (no tangible product, market skepticism)');

  // ===== PAGE 4: SAM Analysis =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Serviceable Addressable Market (SAM)');
  
  addSubheader('Market Segmentation');
  addParagraph('Our SAM focuses on chess enthusiasts willing to spend on premium digital and physical products. We segment by engagement level and spending propensity:');
  
  yPos += 10;
  
  // Segment table
  const segments = [
    ['Serious Players', '50M users', '$42/year avg', '$2.1B'],
    ['Collectors', '15M users', '$85/year avg', '$1.3B'],
    ['Educators/Coaches', '2M users', '$120/year avg', '$240M'],
    ['Casual Enthusiasts', '200M users', '$8/year avg', '$1.6B']
  ];
  
  doc.setFillColor(245, 243, 240);
  doc.roundedRect(margin, yPos, contentWidth, 130, 5, 5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('Segment', margin + 15, yPos + 20);
  doc.text('Users', margin + 150, yPos + 20);
  doc.text('Spend', margin + 280, yPos + 20);
  doc.text('Value', margin + 400, yPos + 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(text[0], text[1], text[2]);
  segments.forEach((seg, i) => {
    const rowY = yPos + 45 + (i * 22);
    doc.text(seg[0], margin + 15, rowY);
    doc.text(seg[1], margin + 150, rowY);
    doc.text(seg[2], margin + 280, rowY);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(seg[3], margin + 400, rowY);
    doc.setTextColor(text[0], text[1], text[2]);
  });
  
  yPos += 150;
  
  addSubheader('Geographic Focus');
  addBullet('Primary: United States, Western Europe, India (70% of target)');
  addBullet('Secondary: Russia, China, South America (emerging markets)');
  addBullet('Initial launch: English-speaking markets with expansion roadmap');

  yPos += 15;
  addSubheader('SAM Calculation');
  addParagraph('Conservative SAM of $2.1B derived from serious players and collectors segments, representing users with demonstrated willingness to pay for premium chess products and personalized content.');

  // ===== PAGE 5: SOM Analysis =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Serviceable Obtainable Market (SOM)');
  
  addSubheader('5-Year Revenue Projection');
  addParagraph('Our SOM represents the realistic market capture based on current product-market fit indicators and growth trajectory:');
  
  yPos += 10;
  
  const projections = [
    ['Year 1', '5,000', '$50', '$250K'],
    ['Year 2', '25,000', '$65', '$1.6M'],
    ['Year 3', '100,000', '$80', '$8M'],
    ['Year 4', '350,000', '$95', '$33M'],
    ['Year 5', '1,000,000', '$120', '$120M']
  ];
  
  doc.setFillColor(245, 243, 240);
  doc.roundedRect(margin, yPos, contentWidth, 155, 5, 5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('Year', margin + 15, yPos + 20);
  doc.text('Subscribers', margin + 120, yPos + 20);
  doc.text('ARPU', margin + 280, yPos + 20);
  doc.text('Revenue', margin + 400, yPos + 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(text[0], text[1], text[2]);
  projections.forEach((proj, i) => {
    const rowY = yPos + 45 + (i * 24);
    doc.text(proj[0], margin + 15, rowY);
    doc.text(proj[1], margin + 120, rowY);
    doc.text(proj[2], margin + 280, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(proj[3], margin + 400, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(text[0], text[1], text[2]);
  });
  
  yPos += 175;
  
  addSubheader('Revenue Mix (Year 5 Steady State)');
  addBullet('Premium Subscriptions (40%): $48M — 400K subscribers at $10/month');
  addBullet('Physical Prints (35%): $42M — 20% net margin on $210M gross');
  addBullet('Marketplace Fees (15%): $18M — 10% on $180M in trades');
  addBullet('Enterprise & Licensing (10%): $12M — Tournament partnerships, educational institutions');

  // ===== PAGE 6: Unit Economics =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Unit Economics');
  
  addSubheader('Profit-Based Royalty Model');
  addParagraph('En Pensent employs a sustainable profit-based royalty system. Creators earn 17% of PROFIT, not revenue, ensuring platform sustainability while rewarding engagement.');
  
  yPos += 10;
  
  addMetricBox('Digital Margin', '95%', 'Subscriptions & digital downloads');
  addMetricBox('Physical Margin', '~17%', 'After fulfillment & platform costs');
  addMetricBox('Marketplace Fee', '5%', 'On peer-to-peer Vision trades');
  
  addSubheader('Example: $49 Canvas Print');
  
  const breakdown = [
    ['Customer pays', '$49.00'],
    ['Fulfillment (Printify)', '-$28.00'],
    ['Platform overhead', '-$5.00'],
    ['Gross Profit', '$16.00'],
    ['Creator Royalty (17%)', '$2.72'],
    ['Net to Platform', '$13.28']
  ];
  
  doc.setFillColor(245, 243, 240);
  doc.roundedRect(margin, yPos, 280, 170, 5, 5, 'F');
  
  breakdown.forEach((item, i) => {
    const rowY = yPos + 25 + (i * 24);
    doc.setFont('helvetica', i === 3 || i === 5 ? 'bold' : 'normal');
    doc.setFontSize(10);
    if (i === 4) {
      doc.setTextColor(gold[0], gold[1], gold[2]);
    } else {
      doc.setTextColor(text[0], text[1], text[2]);
    }
    doc.text(item[0], margin + 15, rowY);
    doc.text(item[1], margin + 220, rowY, { align: 'right' });
  });
  
  yPos += 190;
  
  addSubheader('Value Distribution (17% Appreciation Pool)');
  addBullet('Creator Royalties: 40% — Direct earnings for Vision owners');
  addBullet('Education Fund: 25% — Chess scholarships and youth programs');
  addBullet('Palette Pool: 20% — Distributed to palette usage');
  addBullet('Legendary Gamecard Pool: 15% — Famous game holder rewards');

  // ===== PAGE 7: Conclusion =====
  doc.addPage();
  yPos = margin;
  
  addHeader('Investment Thesis');
  
  addSubheader('Why Now?');
  addBullet('Chess popularity at all-time highs with sustained growth trajectory');
  addBullet('NFT market correction creates vacuum for tangible digital ownership');
  addBullet('AI/ML capabilities enable unique, personalized generative art at scale');
  addBullet('Print-on-demand infrastructure mature and globally accessible');
  addBullet('First-mover advantage in nascent chess collectibles category');
  
  yPos += 15;
  addSubheader('Competitive Moat');
  addBullet('Proprietary visualization algorithm and palette system');
  addBullet('Curated library of 100+ famous games with unique haiku poetry');
  addBullet('Network effects: more users = more trades = more value');
  addBullet('Education Fund creates goodwill and community loyalty');
  addBullet('Sustainable profit-based economics vs. unsustainable revenue-share models');
  
  yPos += 15;
  addSubheader('Key Metrics to Watch');
  addBullet('Monthly Active Users (MAU) and DAU/MAU ratio');
  addBullet('Premium conversion rate (target: 5-8% of registered users)');
  addBullet('Average Revenue Per User (ARPU) growth');
  addBullet('Print order frequency and repeat purchase rate');
  addBullet('Marketplace liquidity (trades per Vision per month)');
  
  yPos += 25;
  
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.roundedRect(margin, yPos, contentWidth, 80, 5, 5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('$180M SOM by Year 5', margin + 15, yPos + 30);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('1M subscribers • $120 ARPU • 95% digital margin', margin + 15, yPos + 55);

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
