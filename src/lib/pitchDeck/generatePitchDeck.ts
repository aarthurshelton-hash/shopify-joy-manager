import jsPDF from 'jspdf';

export async function generatePitchDeck(): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [1920, 1080]
  });

  const width = 1920;
  const height = 1080;
  const margin = 80;
  
  // Colors
  const gold = [212, 175, 55];
  const darkBg = [12, 10, 9];
  const cream = [250, 249, 246];
  const green = [34, 197, 94];
  const blue = [59, 130, 246];

  // Helper functions
  const addSlide = (bgColor: number[] = darkBg) => {
    doc.addPage([width, height], 'landscape');
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(0, 0, width, height, 'F');
  };

  const centerText = (text: string, y: number, size: number, color: number[] = cream) => {
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (width - textWidth) / 2, y);
  };

  const leftText = (text: string, x: number, y: number, size: number, color: number[] = cream) => {
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x, y);
  };

  // ===== SLIDE 1: Title =====
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, width, height, 'F');
  
  doc.setFont('helvetica', 'bold');
  centerText('EN PENSENT', 380, 120, gold);
  
  doc.setFont('helvetica', 'normal');
  centerText('The Future of Chess Intelligence', 480, 48);
  
  doc.setFontSize(28);
  doc.setTextColor(cream[0], cream[1], cream[2]);
  centerText('Transforming Chess Games into Collectible Art', 560, 32);
  centerText('Powered by AI Pattern Recognition & Stockfish 17 NNUE', 610, 28);
  
  // Key metrics row
  const metrics = [
    { value: '800M+', label: 'Chess Players' },
    { value: '$12.5B', label: 'TAM' },
    { value: '3200', label: 'Engine ELO' },
    { value: '100+', label: 'Curated Games' }
  ];
  
  metrics.forEach((m, i) => {
    const x = 320 + (i * 340);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(m.value, x, 750, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(cream[0], cream[1], cream[2]);
    doc.text(m.label, x, 780, { align: 'center' });
  });
  
  centerText('Investor Pitch Deck • January 2026', 980, 24, [150, 150, 150]);

  // ===== SLIDE 2: Problem =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('THE PROBLEM', 100, 64, gold);
  
  doc.setFont('helvetica', 'normal');
  centerText('A $12.5B Market with No Premium Experience', 160, 32);
  
  const problems = [
    { icon: '🎯', text: 'Chess has 800M+ players but no premium collectible market', detail: 'Unlike sports cards or fine art, chess lacks tangible memorabilia' },
    { icon: '🖼️', text: 'Historic games exist only as notation — not as art', detail: 'The beauty of chess remains invisible to non-players' },
    { icon: '💰', text: 'NFT market crashed — collectors want tangible value', detail: 'Digital ownership without physical products failed the market' },
    { icon: '🎓', text: 'Chess education lacks sustainable funding models', detail: 'Youth programs struggle while the game grows exponentially' },
    { icon: '👥', text: 'Creators have no way to monetize game analysis', detail: 'Content creators can\'t earn from their strategic insights' },
    { icon: '🔍', text: 'Pattern recognition technology remains siloed', detail: 'No platform combines visual analysis with engine intelligence' }
  ];
  
  problems.forEach((problem, i) => {
    const y = 260 + (i * 110);
    doc.setFont('helvetica', 'bold');
    leftText(`${problem.icon}  ${problem.text}`, margin + 100, y, 32);
    doc.setFont('helvetica', 'normal');
    leftText(problem.detail, margin + 145, y + 40, 22, [180, 180, 180]);
  });

  // ===== SLIDE 3: Solution =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('THE SOLUTION', 100, 64, gold);
  
  doc.setFont('helvetica', 'normal');
  centerText('En Pensent: Where Chess Art Meets Predictive Intelligence', 160, 36);
  
  const solutions = [
    { title: '🎨 Chess Visions', desc: 'AI-generated art from any chess game — every piece\'s journey becomes visual poetry', highlight: 'Unique visualizations' },
    { title: '📖 Haiku Poetry', desc: 'Each Vision includes a hand-crafted haiku capturing the essence of the battle', highlight: '17 syllables of insight' },
    { title: '🖨️ Premium Prints', desc: 'Museum-quality giclée prints on archival canvas with handcrafted frames', highlight: '$29-$299 price range' },
    { title: '💎 Digital Ownership', desc: 'Claim, trade, and collect unique Visions on our zero-fee marketplace', highlight: 'Real ownership rights' },
    { title: '📈 Creator Royalties', desc: '17% of PROFIT flows back to Vision owners forever — sustainable economics', highlight: 'Lifetime earnings' },
    { title: '🔬 Natural Vision™', desc: 'AI pattern recognition that identifies games from images — building the world\'s largest chess visual database', highlight: 'Proprietary technology' }
  ];
  
  solutions.forEach((sol, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + 80 + (col * 880);
    const y = 280 + (row * 220);
    
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(x - 20, y - 40, 820, 180, 15, 15, 'F');
    
    doc.setFont('helvetica', 'bold');
    leftText(sol.title, x, y, 32, gold);
    doc.setFont('helvetica', 'normal');
    leftText(sol.desc, x, y + 45, 22);
    doc.setFont('helvetica', 'bold');
    leftText(sol.highlight, x, y + 90, 20, green);
  });

  // ===== SLIDE 4: Technology =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('TECHNOLOGY MOAT', 100, 64, gold);
  
  centerText('Proprietary Stack That Can\'t Be Replicated', 160, 32);
  
  // Three pillars
  const pillars = [
    { 
      title: 'Stockfish 17 NNUE',
      elo: '~3200 ELO',
      features: ['Grandmaster-strength analysis', 'Centipawn accuracy', 'Win probability', 'Move classification']
    },
    {
      title: 'Natural Vision™',
      elo: 'AI Recognition',
      features: ['Camera-based game ID', 'Pattern fingerprinting', 'Cross-reference matching', 'Physical-digital bridge']
    },
    {
      title: 'Visual Encryption',
      elo: 'Unique Algorithm',
      features: ['Piece movement encoding', 'Color trail generation', 'Layered composition', 'Scannable fingerprint']
    }
  ];
  
  pillars.forEach((pillar, i) => {
    const x = 200 + (i * 540);
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(x, 240, 480, 500, 20, 20, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(pillar.title, x + 240, 310, { align: 'center' });
    
    doc.setFontSize(48);
    doc.text(pillar.elo, x + 240, 380, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(20);
    doc.setTextColor(cream[0], cream[1], cream[2]);
    pillar.features.forEach((f, fi) => {
      doc.text(`• ${f}`, x + 40, 450 + (fi * 50));
    });
  });
  
  // Bottom insight
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.roundedRect(margin + 100, 800, width - margin * 2 - 200, 80, 10, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  centerText('Combined: The most comprehensive chess pattern recognition system ever built', 850, 24);

  // ===== SLIDE 5: Market Opportunity =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('MARKET OPPORTUNITY', 100, 64, gold);
  
  centerText('$12.5B TAM Growing 45% Since 2020', 160, 32);
  
  // TAM/SAM/SOM boxes
  const boxes = [
    { label: 'TAM', value: '$12.5B', desc: 'Global Chess + Art Collectibles', growth: 'Chess merchandise + Personalized art + Digital collectibles' },
    { label: 'SAM', value: '$2.1B', desc: 'Digital Chess Collectibles', growth: 'Serious players + Collectors + Educators willing to pay' },
    { label: 'SOM', value: '$180M', desc: 'Premium Chess Art (5 Year)', growth: '1M subscribers × $120 ARPU at steady state' }
  ];
  
  boxes.forEach((box, i) => {
    const x = 200 + (i * 540);
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(x, 230, 480, 380, 20, 20, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(28);
    doc.text(box.label, x + 240, 290, { align: 'center' });
    
    doc.setFontSize(72);
    doc.text(box.value, x + 240, 390, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(cream[0], cream[1], cream[2]);
    doc.setFontSize(24);
    doc.text(box.desc, x + 240, 460, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(180, 180, 180);
    const lines = doc.splitTextToSize(box.growth, 420);
    doc.text(lines, x + 240, 520, { align: 'center' });
  });
  
  // Market drivers
  const drivers = [
    '800M+ chess players worldwide',
    'Queen\'s Gambit: 125% surge in interest',
    'Streaming boom: 300% viewership growth',
    'NFT correction: opportunity for tangible digital'
  ];
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(22);
  doc.setTextColor(cream[0], cream[1], cream[2]);
  drivers.forEach((d, i) => {
    const x = 200 + (i * 420);
    doc.text(`✓ ${d}`, x, 700);
  });

  // ===== SLIDE 6: Business Model =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('BUSINESS MODEL', 100, 64, gold);
  
  centerText('Multiple Revenue Streams with Premium Margins', 160, 32);
  
  const revenues = [
    { name: 'Premium Membership', price: '$9.99/month', margin: '95%', desc: 'HD downloads, ownership rights, trading, Stockfish analysis' },
    { name: 'Physical Prints', price: '$29-299', margin: '17%', desc: 'Museum-quality canvas, premium frames, worldwide shipping' },
    { name: 'Marketplace Fees', price: '5%', margin: '100%', desc: 'On all Vision trades between collectors' },
    { name: 'Carlsen Book', price: '$49.99', margin: '40%', desc: '100 games, AI haiku poetry, limited edition hardcover' },
    { name: 'Enterprise Licensing', price: 'Custom', margin: '70%', desc: 'Tournaments, clubs, educational institutions, API access' }
  ];
  
  revenues.forEach((rev, i) => {
    const y = 240 + (i * 120);
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(margin + 80, y - 30, 1680, 100, 10, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    leftText(rev.name, margin + 120, y + 15, 28, gold);
    leftText(rev.price, margin + 520, y + 15, 28, cream);
    leftText(rev.margin, margin + 750, y + 15, 28, green);
    doc.setFont('helvetica', 'normal');
    leftText(rev.desc, margin + 900, y + 15, 22, [180, 180, 180]);
  });
  
  // Margin callouts
  doc.setFillColor(30, 28, 26);
  doc.roundedRect(margin + 80, 860, 500, 120, 15, 15, 'F');
  doc.setFont('helvetica', 'bold');
  leftText('95%', margin + 130, 930, 64, gold);
  doc.setFont('helvetica', 'normal');
  leftText('Gross margin on', margin + 310, 910, 24);
  leftText('digital products', margin + 310, 945, 24);
  
  doc.setFillColor(30, 28, 26);
  doc.roundedRect(margin + 680, 860, 500, 120, 15, 15, 'F');
  doc.setFont('helvetica', 'bold');
  leftText('17%', margin + 730, 930, 64, gold);
  doc.setFont('helvetica', 'normal');
  leftText('Net margin on', margin + 910, 910, 24);
  leftText('physical prints', margin + 910, 945, 24);
  
  doc.setFillColor(30, 28, 26);
  doc.roundedRect(margin + 1280, 860, 500, 120, 15, 15, 'F');
  doc.setFont('helvetica', 'bold');
  leftText('$120', margin + 1320, 930, 64, gold);
  doc.setFont('helvetica', 'normal');
  leftText('Target ARPU', margin + 1500, 910, 24);
  leftText('at scale', margin + 1500, 945, 24);

  // ===== SLIDE 7: Creator Economics =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('CREATOR ECONOMICS', 100, 64, gold);
  
  centerText('Sustainable Profit-Based Royalties', 160, 36);
  
  doc.setFont('helvetica', 'normal');
  const royaltyPoints = [
    '• Creators earn 17% of PROFIT, not revenue — ensuring platform sustainability',
    '• Revenue share only after platform costs are covered',
    '• Transparent tracking via real-time dashboard',
    '• Lifetime royalties on every print order and trade',
    '• Education Fund receives 5% of all forfeited Vision value'
  ];
  
  royaltyPoints.forEach((point, i) => {
    leftText(point, margin + 150, 280 + (i * 70), 28);
  });
  
  // Value distribution
  const distributions = [
    { label: 'Creator Royalties', percent: '40%', color: gold },
    { label: 'Education Fund', percent: '25%', color: green },
    { label: 'Palette Pool', percent: '20%', color: blue },
    { label: 'Gamecard Pool', percent: '15%', color: [168, 85, 247] }
  ];
  
  distributions.forEach((dist, i) => {
    const x = 200 + (i * 420);
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(x, 620, 360, 140, 15, 15, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.setTextColor(dist.color[0], dist.color[1], dist.color[2]);
    doc.text(dist.percent, x + 180, 690, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(18);
    doc.setTextColor(cream[0], cream[1], cream[2]);
    doc.text(dist.label, x + 180, 730, { align: 'center' });
  });
  
  // Example calculation
  doc.setFillColor(30, 28, 26);
  doc.roundedRect(margin + 150, 820, 1540, 160, 20, 20, 'F');
  
  doc.setFont('helvetica', 'bold');
  leftText('Example: $79 Canvas Print', margin + 200, 880, 28, gold);
  doc.setFont('helvetica', 'normal');
  leftText('Revenue: $79  →  Costs: $42 (Printify + Platform)  →  Profit: $37  →  Creator Royalty: $6.29', margin + 200, 930, 24);

  // ===== SLIDE 8: Traction & Roadmap =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('TRACTION & MILESTONES', 100, 64, gold);
  
  const tractionMetrics = [
    { value: '100+', label: 'Famous Games Curated', detail: 'From Immortal Game to Carlsen masterpieces' },
    { value: '16', label: 'Signature Palettes', detail: 'Minimalist to Art Deco aesthetics' },
    { value: '∞', label: 'Unique Visions Possible', detail: 'Any game × any palette = unique art' },
    { value: 'Live', label: 'Marketplace Active', detail: 'Zero-fee trading platform' }
  ];
  
  tractionMetrics.forEach((metric, i) => {
    const x = 120 + (i * 440);
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(x, 200, 400, 220, 15, 15, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(56);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(metric.value, x + 200, 290, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(22);
    doc.setTextColor(cream[0], cream[1], cream[2]);
    doc.text(metric.label, x + 200, 340, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(150, 150, 150);
    doc.text(metric.detail, x + 200, 380, { align: 'center' });
  });
  
  // Roadmap
  doc.setFont('helvetica', 'bold');
  centerText('2026 ROADMAP', 500, 36, gold);
  
  const roadmap = [
    { q: 'Q1', milestone: 'Carlsen Book Launch', target: '1,000 subscribers', status: 'In Progress' },
    { q: 'Q2', milestone: 'Mobile App Release', target: 'Tournament partnerships', status: 'Planned' },
    { q: 'Q3', milestone: 'Enterprise API', target: 'Educational licensing', status: 'Planned' },
    { q: 'Q4', milestone: 'International Expansion', target: '10K subscribers', status: 'Planned' }
  ];
  
  roadmap.forEach((item, i) => {
    const x = 120 + (i * 440);
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(x, 560, 400, 200, 15, 15, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(item.q, x + 200, 620, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(20);
    doc.setTextColor(cream[0], cream[1], cream[2]);
    doc.text(item.milestone, x + 200, 670, { align: 'center' });
    doc.text(item.target, x + 200, 700, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(green[0], green[1], green[2]);
    doc.text(item.status, x + 200, 735, { align: 'center' });
  });

  // ===== SLIDE 9: Competitive Advantage =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('COMPETITIVE MOAT', 100, 64, gold);
  
  centerText('Why We Win', 160, 32);
  
  const advantages = [
    { title: 'First Mover', desc: 'Only platform combining generative art with chess heritage — no direct competitors', icon: '🏆' },
    { title: 'Technology Stack', desc: 'Proprietary visualization algorithm + Natural Vision™ + Stockfish 17 integration', icon: '⚡' },
    { title: 'Network Effects', desc: 'More users = more trades = more value = stronger pattern database', icon: '🔗' },
    { title: 'Community Loyalty', desc: 'Education Fund creates goodwill; sustainable economics build trust', icon: '❤️' },
    { title: 'Content Library', desc: '100+ curated famous games with unique haiku poetry — years of curation', icon: '📚' },
    { title: 'Sustainable Model', desc: 'Profit-based royalties vs. unsustainable revenue-share — we\'re built to last', icon: '♻️' }
  ];
  
  advantages.forEach((adv, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + 80 + (col * 880);
    const y = 260 + (row * 200);
    
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(x - 20, y - 40, 820, 160, 15, 15, 'F');
    
    doc.setFont('helvetica', 'bold');
    leftText(`${adv.icon}  ${adv.title}`, x, y, 28, gold);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(adv.desc, 740);
    doc.setFontSize(20);
    doc.setTextColor(cream[0], cream[1], cream[2]);
    doc.text(descLines, x, y + 50);
  });

  // ===== SLIDE 10: The Ask =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('THE ASK', 100, 64, gold);
  
  doc.setFontSize(80);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  centerText('$500K Seed Round', 260, 80);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(28);
  doc.setTextColor(cream[0], cream[1], cream[2]);
  centerText('Building the future of chess intelligence', 340, 28);
  
  const useOfFunds = [
    { pct: '40%', category: 'Product Development', details: 'Mobile apps, API platform, advanced features, AI enhancement' },
    { pct: '30%', category: 'Marketing & Growth', details: 'Chess influencers, tournament sponsorships, content creation' },
    { pct: '20%', category: 'Content & Partnerships', details: 'Game licensing, artist collaborations, educational content' },
    { pct: '10%', category: 'Operations', details: 'Legal, infrastructure, compliance, team growth' }
  ];
  
  useOfFunds.forEach((item, i) => {
    const y = 440 + (i * 110);
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(margin + 200, y - 30, 1440, 90, 10, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    leftText(item.pct, margin + 250, y + 20, 36, gold);
    leftText(item.category, margin + 420, y + 20, 28, cream);
    doc.setFont('helvetica', 'normal');
    leftText(item.details, margin + 800, y + 20, 20, [180, 180, 180]);
  });
  
  // Target metrics
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.roundedRect(margin + 200, 900, 1440, 80, 10, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  centerText('Target: $180M SOM by Year 5  •  1M Subscribers  •  $120 ARPU  •  95% Digital Margin', 950, 24);

  // ===== SLIDE 11: Contact =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('JOIN THE JOURNEY', 300, 72, gold);
  
  doc.setFont('helvetica', 'normal');
  centerText('Where Every Move Becomes a Masterpiece', 380, 40);
  
  centerText('The Future of Chess Intelligence Starts Here', 450, 32, [180, 180, 180]);
  
  doc.setFontSize(32);
  centerText('🌐  enpensent.com', 580, 32);
  centerText('📧  investors@enpensent.com', 650, 32);
  
  // Key stats reminder
  const finalStats = [
    { label: 'TAM', value: '$12.5B' },
    { label: 'Ask', value: '$500K' },
    { label: 'Target', value: '1M subs' },
    { label: 'Margin', value: '95%' }
  ];
  
  finalStats.forEach((stat, i) => {
    const x = 360 + (i * 320);
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(x, 750, 240, 100, 10, 10, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(150, 150, 150);
    doc.text(stat.label, x + 120, 785, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(stat.value, x + 120, 825, { align: 'center' });
  });
  
  centerText('En Pensent • January 2026 • Confidential', 950, 24, [150, 150, 150]);

  // Return as blob
  return doc.output('blob');
}
