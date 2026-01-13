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
  centerText('EN PENSENT', 420, 120, gold);
  
  doc.setFont('helvetica', 'normal');
  centerText('Transforming Chess History into Collectible Art', 520, 48);
  
  doc.setFontSize(24);
  doc.setTextColor(cream[0], cream[1], cream[2]);
  centerText('Where Every Move Becomes a Masterpiece', 620, 32);
  
  centerText('Investor Pitch Deck • 2026', 980, 24, [150, 150, 150]);

  // ===== SLIDE 2: Problem =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('THE PROBLEM', 120, 64, gold);
  
  doc.setFont('helvetica', 'normal');
  const problems = [
    '🎯  Chess has 800M+ players but no premium collectible market',
    '🖼️  Historic games exist only as notation — not as art',
    '💰  NFT market crashed — collectors want tangible value',
    '🎓  Chess education lacks sustainable funding models',
    '👥  Creators have no way to monetize game analysis'
  ];
  
  problems.forEach((problem, i) => {
    leftText(problem, margin + 200, 280 + (i * 120), 40);
  });

  // ===== SLIDE 3: Solution =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('THE SOLUTION', 120, 64, gold);
  
  doc.setFont('helvetica', 'normal');
  centerText('Chess Visions: AI-generated art from historical games', 280, 44);
  
  const solutions = [
    ['🎨 Unique Visualizations', 'Every chess game becomes a unique piece of generative art'],
    ['📖 Curated Haiku Poetry', 'Each Vision includes a hand-crafted haiku capturing the essence'],
    ['🖨️ Premium Physical Prints', 'Gallery-quality prints through Printify integration'],
    ['💎 Digital Ownership', 'Claim, trade, and collect unique Visions'],
    ['📈 Creator Royalties', '20% of PROFIT flows back to Vision owners forever']
  ];
  
  solutions.forEach((sol, i) => {
    doc.setFont('helvetica', 'bold');
    leftText(sol[0], margin + 100, 380 + (i * 110), 36, gold);
    doc.setFont('helvetica', 'normal');
    leftText(sol[1], margin + 100, 420 + (i * 110), 28);
  });

  // ===== SLIDE 4: Market Opportunity =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('MARKET OPPORTUNITY', 120, 64, gold);
  
  // TAM/SAM/SOM boxes
  const boxes = [
    { label: 'TAM', value: '$12.5B', desc: 'Global Chess + Art Collectibles' },
    { label: 'SAM', value: '$2.1B', desc: 'Digital Chess Collectibles' },
    { label: 'SOM', value: '$180M', desc: 'Premium Chess Art (5 Year)' }
  ];
  
  boxes.forEach((box, i) => {
    const x = 280 + (i * 500);
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(x, 250, 400, 350, 20, 20, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(32);
    doc.text(box.label, x + 200, 320, { align: 'center' });
    
    doc.setFontSize(72);
    doc.text(box.value, x + 200, 430, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(cream[0], cream[1], cream[2]);
    doc.setFontSize(24);
    doc.text(box.desc, x + 200, 520, { align: 'center' });
  });
  
  centerText('800M+ chess players worldwide • 45% growth since 2020', 700, 28);

  // ===== SLIDE 5: Business Model =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('BUSINESS MODEL', 120, 64, gold);
  
  const revenues = [
    ['Premium Membership', '$9.99/month', 'HD downloads, ownership rights, trading'],
    ['Physical Prints', '$29-299', '20% margin after fulfillment costs'],
    ['Marketplace Fees', '10%', 'On all Vision trades between collectors'],
    ['Carlsen Book', '$49.99', 'Limited edition with 50 historic games'],
    ['Enterprise Licensing', 'Custom', 'Tournaments, clubs, educational institutions']
  ];
  
  let yPos = 250;
  revenues.forEach((rev) => {
    doc.setFont('helvetica', 'bold');
    leftText(rev[0], margin + 100, yPos, 32, gold);
    doc.setFont('helvetica', 'normal');
    leftText(rev[1], margin + 600, yPos, 32, cream);
    leftText(rev[2], margin + 900, yPos, 24, [180, 180, 180]);
    yPos += 80;
  });
  
  // Margin callout
  doc.setFillColor(30, 28, 26);
  doc.roundedRect(margin + 100, 680, 600, 120, 15, 15, 'F');
  doc.setFont('helvetica', 'bold');
  leftText('95%', margin + 150, 750, 64, gold);
  doc.setFont('helvetica', 'normal');
  leftText('Gross margin on', margin + 350, 730, 28);
  leftText('digital products', margin + 350, 765, 28);
  
  doc.setFillColor(30, 28, 26);
  doc.roundedRect(margin + 800, 680, 600, 120, 15, 15, 'F');
  doc.setFont('helvetica', 'bold');
  leftText('20%', margin + 850, 750, 64, gold);
  doc.setFont('helvetica', 'normal');
  leftText('Net margin on', margin + 1050, 730, 28);
  leftText('physical prints', margin + 1050, 765, 28);

  // ===== SLIDE 6: Profit-Based Royalties =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('CREATOR ECONOMICS', 120, 64, gold);
  
  centerText('Sustainable Profit-Based Royalties', 200, 36);
  
  doc.setFont('helvetica', 'normal');
  const royaltyPoints = [
    '• Creators earn 20% of PROFIT, not revenue — ensuring sustainability',
    '• Revenue share only after platform costs are covered',
    '• Transparent tracking via real-time dashboard',
    '• Lifetime royalties on every print order and trade',
    '• Education Fund receives 5% of all forfeited Vision value'
  ];
  
  royaltyPoints.forEach((point, i) => {
    leftText(point, margin + 200, 320 + (i * 80), 32);
  });
  
  // Example calculation
  doc.setFillColor(30, 28, 26);
  doc.roundedRect(margin + 200, 700, 1400, 200, 20, 20, 'F');
  
  doc.setFont('helvetica', 'bold');
  leftText('Example: $79 Canvas Print', margin + 250, 770, 28, gold);
  doc.setFont('helvetica', 'normal');
  leftText('Revenue: $79  →  Costs: $42 (fulfillment + platform)  →  Profit: $37  →  Creator Royalty: $7.40', margin + 250, 830, 24);

  // ===== SLIDE 7: Traction =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('TRACTION & MILESTONES', 120, 64, gold);
  
  const metrics = [
    { value: '100+', label: 'Famous Games Curated' },
    { value: '16', label: 'Signature Palettes' },
    { value: '∞', label: 'Unique Visions Possible' },
    { value: 'Live', label: 'Marketplace Active' }
  ];
  
  metrics.forEach((metric, i) => {
    const x = 160 + (i * 420);
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(x, 250, 360, 200, 15, 15, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(56);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(metric.value, x + 180, 340, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(24);
    doc.setTextColor(cream[0], cream[1], cream[2]);
    doc.text(metric.label, x + 180, 400, { align: 'center' });
  });
  
  // Roadmap
  doc.setFont('helvetica', 'bold');
  centerText('ROADMAP', 550, 36, gold);
  
  const roadmap = [
    ['Q1 2026', 'Carlsen Book Launch + 1,000 subscribers'],
    ['Q2 2026', 'Mobile app + Tournament partnerships'],
    ['Q3 2026', 'Enterprise API + Educational licensing'],
    ['Q4 2026', 'International expansion + 10K subscribers']
  ];
  
  roadmap.forEach((item, i) => {
    const x = 160 + (i * 420);
    doc.setFont('helvetica', 'bold');
    leftText(item[0], x + 40, 650, 28, gold);
    doc.setFont('helvetica', 'normal');
    leftText(item[1], x + 40, 690, 20);
  });

  // ===== SLIDE 8: Team =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('FOUNDING VISION', 120, 64, gold);
  
  doc.setFont('helvetica', 'normal');
  centerText('Built by chess enthusiasts, technologists, and artists', 220, 36);
  
  const values = [
    ['🎯 Mission', 'Make chess history accessible, beautiful, and collectible'],
    ['💡 Innovation', 'First platform combining generative art with chess heritage'],
    ['🌍 Impact', 'Funding chess education through every transaction'],
    ['🔒 Trust', 'Transparent economics with profit-based creator royalties']
  ];
  
  values.forEach((val, i) => {
    const x = (i % 2 === 0) ? margin + 100 : margin + 900;
    const y = 350 + Math.floor(i / 2) * 200;
    
    doc.setFillColor(30, 28, 26);
    doc.roundedRect(x, y - 50, 720, 150, 15, 15, 'F');
    
    doc.setFont('helvetica', 'bold');
    leftText(val[0], x + 40, y + 10, 32, gold);
    doc.setFont('helvetica', 'normal');
    leftText(val[1], x + 40, y + 60, 24);
  });

  // ===== SLIDE 9: Ask =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('THE ASK', 120, 64, gold);
  
  doc.setFontSize(80);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  centerText('$500K Seed Round', 300, 80);
  
  doc.setFont('helvetica', 'normal');
  const useOfFunds = [
    ['40%', 'Product Development', 'Mobile apps, API, advanced features'],
    ['30%', 'Marketing & Growth', 'Chess influencers, tournament sponsorships'],
    ['20%', 'Content & Partnerships', 'Game licensing, artist collaborations'],
    ['10%', 'Operations', 'Legal, infrastructure, team']
  ];
  
  useOfFunds.forEach((item, i) => {
    const y = 450 + (i * 100);
    doc.setFont('helvetica', 'bold');
    leftText(item[0], margin + 300, y, 36, gold);
    leftText(item[1], margin + 500, y, 32, cream);
    doc.setFont('helvetica', 'normal');
    leftText(item[2], margin + 900, y, 24, [180, 180, 180]);
  });

  // ===== SLIDE 10: Contact =====
  addSlide();
  doc.setFont('helvetica', 'bold');
  centerText('JOIN THE JOURNEY', 350, 72, gold);
  
  doc.setFont('helvetica', 'normal');
  centerText('Where Every Move Becomes a Masterpiece', 450, 40);
  
  centerText('🌐  enpensent.com', 600, 36);
  centerText('📧  investors@enpensent.com', 670, 36);
  
  centerText('En Pensent • 2026', 950, 24, [150, 150, 150]);

  // Return as blob
  return doc.output('blob');
}
