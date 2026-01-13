// Unique poetry for famous chess games
// Each poem reflects the game's historical context, style, and emotional arc
// Poetry styles vary: haiku, couplets, quatrains, free verse, epigrams

export interface GamePoetry {
  gameId: string;
  poem: string;
  style: 'haiku' | 'couplet' | 'quatrain' | 'free verse' | 'epigram' | 'sonnet fragment';
}

// Poetry collection for famous games
export const gamePoetryCollection: Record<string, GamePoetry> = {
  'kasparov-topalov-1999': {
    gameId: 'kasparov-topalov-1999',
    poem: "Rook and queen offered—\nThe king hunts through fire and steel.\nLegends are forged here.",
    style: 'haiku'
  },
  'byrne-fischer-1956': {
    gameId: 'byrne-fischer-1956',
    poem: "A boy of thirteen with eyes that see through time,\nSacrifices his queen—the world holds its breath.\nFrom Brooklyn's streets, a genius climbs.",
    style: 'free verse'
  },
  'anderssen-kieseritzky-1851': {
    gameId: 'anderssen-kieseritzky-1851',
    poem: "Both rooks, the queen—all given away,\nYet victory blooms from sacrifice.\nThe Immortal Game, they'll forever say.",
    style: 'quatrain'
  },
  'deep-blue-kasparov-1997': {
    gameId: 'deep-blue-kasparov-1997',
    poem: "Silicon dreams meet mortal thought—\nThe machine finds what man could not.",
    style: 'couplet'
  },
  'spassky-fischer-1972': {
    gameId: 'spassky-fischer-1972',
    poem: "Cold War on sixty-four squares,\nAmerica's champion strikes.\nHistory bends to his will.",
    style: 'free verse'
  },
  'lasker-thomas-1912': {
    gameId: 'lasker-thomas-1912',
    poem: "The king, once safe, now flees in terror—\nAcross the board, through check and fire,\nUntil at last, cornered in error.",
    style: 'quatrain'
  },
  'morphy-opera-1858': {
    gameId: 'morphy-opera-1858',
    poem: "Between the arias, between the acts,\nA queen is given, a king is caught.\nThe opera ends with checkmate's facts.",
    style: 'quatrain'
  },
  'oldest-recorded-1475': {
    gameId: 'oldest-recorded-1475',
    poem: "Five centuries whisper\nThrough ancient moves preserved—\nChess finds its first voice.",
    style: 'haiku'
  },
  'carlsen-anand-2013': {
    gameId: 'carlsen-anand-2013',
    poem: "The young Norwegian, patient as stone,\nGrinds down the champion, move by move,\nUntil the crown becomes his own.",
    style: 'quatrain'
  },
  'botvinnik-capablanca-1938': {
    gameId: 'botvinnik-capablanca-1938',
    poem: "The Cuban legend meets Soviet steel.\nA queen sacrificed, a dynasty falls.\nNew masters rise; old crowns must yield.",
    style: 'quatrain'
  },
  'alekhine-capablanca-1927': {
    gameId: 'alekhine-capablanca-1927',
    poem: "Thirty-four battles, marathon of will—\nThe invincible finally bends.\nBuenos Aires witnesses the kill.",
    style: 'free verse'
  },
  'marshall-capablanca-1909': {
    gameId: 'marshall-capablanca-1909',
    poem: "Youth arrives with quiet grace,\nThe champion falls to unknown hands.\nA star is born to take his place.",
    style: 'quatrain'
  },
  'anderssen-dufresne-1852': {
    gameId: 'anderssen-dufresne-1852',
    poem: "Evergreen—the game that never fades,\nWhere beauty conquers through sacrificial blades.",
    style: 'couplet'
  },
  'karpov-kasparov-1985': {
    gameId: 'karpov-kasparov-1985',
    poem: "The octopus knight\nStrangles from its outpost square—\nYouth claims its throne tonight.",
    style: 'haiku'
  },
  'short-timman-1991': {
    gameId: 'short-timman-1991',
    poem: "The king marches forth, fearless and bold,\nUp the board, through enemy lines.\nA victory story forever told.",
    style: 'quatrain'
  },
  'polgar-kasparov-2002': {
    gameId: 'polgar-kasparov-2002',
    poem: "She breaks the barrier, defeats the king.\nHistory written in a woman's hand.",
    style: 'couplet'
  },
  'tal-miller-1988': {
    gameId: 'tal-miller-1988',
    poem: "The Magician plays—\nPieces dance in wild fire.\nRiga's flame still blazes.",
    style: 'haiku'
  },
  'fischer-spassky-1972-g6': {
    gameId: 'fischer-spassky-1972-g6',
    poem: "The queen's gambit declined, then transformed,\nInto a symphony of perfect play.\nThe greatest game the world has seen performed.",
    style: 'quatrain'
  },
  'steinitz-bardeleben-1895': {
    gameId: 'steinitz-bardeleben-1895',
    poem: "Rather than face the inevitable mate,\nHe walked away from the board's cruel fate.",
    style: 'couplet'
  },
  'rubinstein-rotlewi-1907': {
    gameId: 'rubinstein-rotlewi-1907',
    poem: "Rubinstein's immortal sacrifice speaks—\nTwo rooks, a queen, all fuel for the blaze.\nPerfection found in what destruction wreaks.",
    style: 'quatrain'
  },
  'nezhmetdinov-chernikov-1962': {
    gameId: 'nezhmetdinov-chernikov-1962',
    poem: "Wild knight rides forth,\nSacrifice upon sacrifice—\nRussian fire burns true.",
    style: 'haiku'
  },
  'carlsen-karjakin-2016': {
    gameId: 'carlsen-karjakin-2016',
    poem: "In rapid's crucible, under tiebreak's strain,\nThe champion proves his reign remains.",
    style: 'couplet'
  },
  'ding-nepomniachtchi-2023': {
    gameId: 'ding-nepomniachtchi-2023',
    poem: "After Carlsen's crown lies empty still,\nTwo warriors fight for chess's throne.\nHistory writes with iron will.",
    style: 'quatrain'
  },
  'nakamura-caruana-2024': {
    gameId: 'nakamura-caruana-2024',
    poem: "The Candidates rage—modern titans clash.\nAmerican dreams in every flash.",
    style: 'couplet'
  },
  'gukesh-ding-2024': {
    gameId: 'gukesh-ding-2024',
    poem: "Eighteen years young—\nThe youngest world champion rises.\nIndia's prodigy has begun.",
    style: 'haiku'
  },
  'adams-torre-1920': {
    gameId: 'adams-torre-1920',
    poem: "The windmill turns, relentless, sure,\nEach check a blade that cuts through hope.\nThe trap complete, the victory pure.",
    style: 'quatrain'
  },
  'greco-amateur-1620': {
    gameId: 'greco-amateur-1620',
    poem: "Before modern rules were set,\nThe Italian master taught\nLessons we cannot forget.",
    style: 'free verse'
  },
  'philidor-amateur-1790': {
    gameId: 'philidor-amateur-1790',
    poem: "Pawns are the soul of chess, he said—\nThen proved it true with every move instead.",
    style: 'couplet'
  },
  'lopez-amateur-1560': {
    gameId: 'lopez-amateur-1560',
    poem: "The Spanish priest plays ancient lines,\nWhile Renaissance courts watch with awe.\nHis opening still forever shines.",
    style: 'quatrain'
  },
  'morphy-anderssen-1858': {
    gameId: 'morphy-anderssen-1858',
    poem: "Two titans meet on Paris ground—\nThe American proves the finest found.",
    style: 'couplet'
  },
  'bird-amateur-1886': {
    gameId: 'bird-amateur-1886',
    poem: "Eccentric moves, surprising start—\nBird's Opening, chess as art.",
    style: 'couplet'
  },
  'blackburne-amateur-1880': {
    gameId: 'blackburne-amateur-1880',
    poem: "The Black Death strikes without a sound,\nCombinations sharp and swift abound.",
    style: 'couplet'
  },
  'lasker-schlechter-1910': {
    gameId: 'lasker-schlechter-1910',
    poem: "One move from losing crown and fame,\nLasker finds the saving flame.",
    style: 'couplet'
  },
  'tarrasch-lasker-1908': {
    gameId: 'tarrasch-lasker-1908',
    poem: "Theory meets psychology—\nLasker's practical play prevails.",
    style: 'epigram'
  },
  'pillsbury-tarrasch-1895': {
    gameId: 'pillsbury-tarrasch-1895',
    poem: "Hastings '95—\nAmerica's new hope arrives.\nPillsbury takes the prize alive.",
    style: 'haiku'
  },
  'pillsbury-lasker-1896': {
    gameId: 'pillsbury-lasker-1896',
    poem: "Champions collide,\nBrilliance meeting brilliance—\nChess history's tide.",
    style: 'haiku'
  },
  'janowski-lasker-1909': {
    gameId: 'janowski-lasker-1909',
    poem: "Lasker defends with iron nerve,\nThe challenger gets what he deserves.",
    style: 'couplet'
  },
  'chigorin-tarrasch-1893': {
    gameId: 'chigorin-tarrasch-1893',
    poem: "Russian romanticism\nMeets German precision—\nChess philosophy in collision.",
    style: 'free verse'
  },
  'maroczy-tartakower-1922': {
    gameId: 'maroczy-tartakower-1922',
    poem: "The Bind constricts—\nPatient positional play\nSlowly restricts.",
    style: 'haiku'
  },
  'bogoljubow-alekhine-1922': {
    gameId: 'bogoljubow-alekhine-1922',
    poem: "Alekhine's genius ignites the board,\nCombinations sharp as any sword.",
    style: 'couplet'
  },
  'spielmann-reti-1928': {
    gameId: 'spielmann-reti-1928',
    poem: "Hypermodern dreams unfold—\nNew ideas brave and bold.",
    style: 'couplet'
  },
  'tartakower-reti-1926': {
    gameId: 'tartakower-reti-1926',
    poem: "Fianchetto flanks arise,\nThe center controlled from distant skies.",
    style: 'couplet'
  },
  'euwe-alekhine-1935': {
    gameId: 'euwe-alekhine-1935',
    poem: "The mathematician calculates,\nThe champion falters—Holland celebrates.",
    style: 'couplet'
  },
  'flohr-botvinnik-1933': {
    gameId: 'flohr-botvinnik-1933',
    poem: "Soviet school rises—\nScientific chess begins.\nNew era surprises.",
    style: 'haiku'
  },
  'lilienthal-capablanca-1935': {
    gameId: 'lilienthal-capablanca-1935',
    poem: "Even the mighty machine can fall,\nWhen youth strikes with everything at all.",
    style: 'couplet'
  },
  'botvinnik-smyslov-1954': {
    gameId: 'botvinnik-smyslov-1954',
    poem: "The Patriarch fights to hold his crown,\nBut Smyslov's artistry won't be held down.",
    style: 'couplet'
  },
  'smyslov-reshevsky-1953': {
    gameId: 'smyslov-reshevsky-1953',
    poem: "Zurich '53—\nThe candidates gather, tensions run free.\nWho will the next challenger be?",
    style: 'quatrain'
  },
  'keres-petrosian-1959': {
    gameId: 'keres-petrosian-1959',
    poem: "Iron Tigran builds his wall,\nNothing gets through, nothing at all.",
    style: 'couplet'
  },
  'petrosian-spassky-1966': {
    gameId: 'petrosian-spassky-1966',
    poem: "The fortress stands—\nDefense as art, victory in patient hands.",
    style: 'couplet'
  },
  'spassky-petrosian-1969': {
    gameId: 'spassky-petrosian-1969',
    poem: "Universal style breaks through the wall,\nSpassky rises, Petrosian falls.",
    style: 'couplet'
  },
  'geller-fischer-1967': {
    gameId: 'geller-fischer-1967',
    poem: "Fischer meets his nemesis—\nGeller's score remains the test.",
    style: 'couplet'
  },
  'petrosian-fischer-1971': {
    gameId: 'petrosian-fischer-1971',
    poem: "The Tiger stalks but cannot catch\nThe American who's found his match.",
    style: 'couplet'
  },
  'lombardy-fischer-1960': {
    gameId: 'lombardy-fischer-1960',
    poem: "Teacher and student cross swords—\nGenius speaks in opening chords.",
    style: 'couplet'
  },
  'gligoric-fischer-1959': {
    gameId: 'gligoric-fischer-1959',
    poem: "Yugoslav master, sixteen-year-old foe—\nFischer's star begins to glow.",
    style: 'couplet'
  },
  'fischer-larsen-1971': {
    gameId: 'fischer-larsen-1971',
    poem: "Six and zero—\nLarsen falls to Fischer's perfect score.\nThe Dane meets his hero.",
    style: 'haiku'
  },
  'spassky-bronstein-1960': {
    gameId: 'spassky-bronstein-1960',
    poem: "The artist battles the rising star—\nBronstein's brilliance shines from afar.",
    style: 'couplet'
  },
  'bronstein-brilliancy-1953': {
    gameId: 'bronstein-brilliancy-1953',
    poem: "Zurich's brightest game unfolds,\nBronstein's genius, fearless and bold.",
    style: 'couplet'
  },
  'kholmov-bronstein-1965': {
    gameId: 'kholmov-bronstein-1965',
    poem: "Soviet masters clash and fight,\nBronstein conjures pure delight.",
    style: 'couplet'
  },
  'suetin-spassky-1963': {
    gameId: 'suetin-spassky-1963',
    poem: "Young Spassky shows his might—\nBrilliant attack ignites the night.",
    style: 'couplet'
  },
  'korchnoi-karpov-1978': {
    gameId: 'korchnoi-karpov-1978',
    poem: "Defector versus loyalist—chess Cold War.\nBaguio's tension like never before.",
    style: 'couplet'
  },
  'karpov-seirawan-1982': {
    gameId: 'karpov-seirawan-1982',
    poem: "The boa constricts,\nKarpov's positional grip—\nSeirawan conflicts.",
    style: 'haiku'
  },
  'kasparov-karpov-1990': {
    gameId: 'kasparov-karpov-1990',
    poem: "Lyon and New York—the fifth match rages on.\nTwo titans fighting until the bitter dawn.",
    style: 'couplet'
  },
  'kasparov-short-1993': {
    gameId: 'kasparov-short-1993',
    poem: "London's classical chess—\nKasparov proves he's still the best.",
    style: 'couplet'
  },
  'kramnik-kasparov-2000': {
    gameId: 'kramnik-kasparov-2000',
    poem: "The Berlin Wall holds—\nThe champion's reign finally ends.\nA new era unfolds.",
    style: 'haiku'
  },
  'kramnik-carlsen-2008': {
    gameId: 'kramnik-carlsen-2008',
    poem: "The Mozart of chess arrives,\nAgainst Kramnik, the young genius thrives.",
    style: 'couplet'
  },
  'topalov-anand-2010': {
    gameId: 'topalov-anand-2010',
    poem: "Sofia's drama unfolds—\nAnand defends what he holds.",
    style: 'couplet'
  },
  'gelfand-anand-2012': {
    gameId: 'gelfand-anand-2012',
    poem: "Moscow's quiet match—\nAnand survives Gelfand's catch.",
    style: 'couplet'
  },
  'aronian-anand-2013': {
    gameId: 'aronian-anand-2013',
    poem: "Before the crown changes hands,\nAronian makes his final stands.",
    style: 'couplet'
  },
  'stein-portisch-1962': {
    gameId: 'stein-portisch-1962',
    poem: "Leonid the tactician—\nSoviet fire meets Hungarian precision.",
    style: 'couplet'
  },
  'ivanchuk-yusupov-1991': {
    gameId: 'ivanchuk-yusupov-1991',
    poem: "Genius unleashed—\nIvanchuk's magic cannot be policed.",
    style: 'couplet'
  },
  'anand-kramnik-2008': {
    gameId: 'anand-kramnik-2008',
    poem: "The Tiger from Madras strikes,\nClaiming the crown he likes.",
    style: 'couplet'
  },
  'so-carlsen-2016': {
    gameId: 'so-carlsen-2016',
    poem: "American challenge rises—\nSo's brilliance surprises.",
    style: 'couplet'
  },
  'vachier-lagrave-aronian-2018': {
    gameId: 'vachier-lagrave-aronian-2018',
    poem: "French flair meets Armenian fire—\nModern masters never tire.",
    style: 'couplet'
  },
  'firouzja-carlsen-2022': {
    gameId: 'firouzja-carlsen-2022',
    poem: "The prodigy challenges the king—\nWhat will tomorrow's battles bring?",
    style: 'couplet'
  },
  'stockfish-leela-2023': {
    gameId: 'stockfish-leela-2023',
    poem: "Machine versus machine—\nPerfection beyond human dream.",
    style: 'couplet'
  },
  'habu-kasparov-1996': {
    gameId: 'habu-kasparov-1996',
    poem: "Shogi master crosses the board—\nEast meets West, mutual accord.",
    style: 'couplet'
  },
  'viswanathan-kasparov-1995': {
    gameId: 'viswanathan-kasparov-1995',
    poem: "PCA battle in the tower—\nThe champion shows his power.",
    style: 'couplet'
  },
  'najdorf-glucksberg-1929': {
    gameId: 'najdorf-glucksberg-1929',
    poem: "The Polish Immortal blazes bright—\nSacrifice after sacrifice ignites the night.",
    style: 'couplet'
  },
  'reshevsky-najdorf-1952': {
    gameId: 'reshevsky-najdorf-1952',
    poem: "Two legends of their generation—\nChess excellence in demonstration.",
    style: 'couplet'
  },
  'capablanca-bernstein-1914': {
    gameId: 'capablanca-bernstein-1914',
    poem: "The machine plays perfect—\nCapablanca's technique, no defect.",
    style: 'couplet'
  },
  'nimzowitsch-capablanca-1927': {
    gameId: 'nimzowitsch-capablanca-1927',
    poem: "The revolutionary meets the machine—\nNimzowitsch's ideas on the scene.",
    style: 'couplet'
  },
  'torre-lasker-1925': {
    gameId: 'torre-lasker-1925',
    poem: "From Mexico, Torre strikes—\nThe windmill spins, the crowd delights.",
    style: 'couplet'
  },
  'sicilian-najdorf-1997': {
    gameId: 'sicilian-najdorf-1997',
    poem: "The Poisoned Pawn still bites—\nTheory's edge in tournament fights.",
    style: 'couplet'
  },
  'chinese-immortal-1941': {
    gameId: 'chinese-immortal-1941',
    poem: "From the East, a masterpiece—\nChina's chess art finds release.",
    style: 'couplet'
  },
  'saint-amant-staunton-1843': {
    gameId: 'saint-amant-staunton-1843',
    poem: "France and England clash—\nThe first great match in a flash.",
    style: 'couplet'
  },
  'zurich-1953-brilliancy': {
    gameId: 'zurich-1953-brilliancy',
    poem: "The Candidates' finest hour—\nBrilliancy unveils its power.",
    style: 'couplet'
  },
  'mwali-amateur-1973': {
    gameId: 'mwali-amateur-1973',
    poem: "Africa's chess rises—\nNew talent always surprises.",
    style: 'couplet'
  }
};

// Get poetry for a specific game
export const getGamePoetry = (gameId: string): GamePoetry | null => {
  return gamePoetryCollection[gameId] || null;
};

// Get a display-friendly poem (single line for previews)
export const getPoetryPreview = (gameId: string): string | null => {
  const poetry = gamePoetryCollection[gameId];
  if (!poetry) return null;
  
  // Get first line for preview
  const lines = poetry.poem.split('\n');
  return lines[0];
};

// Get the full poem with proper line breaks
export const getFullPoem = (gameId: string): string | null => {
  const poetry = gamePoetryCollection[gameId];
  return poetry?.poem || null;
};

// Get poetry style label
export const getPoetryStyleLabel = (gameId: string): string | null => {
  const poetry = gamePoetryCollection[gameId];
  if (!poetry) return null;
  
  const styleLabels: Record<string, string> = {
    'haiku': 'Haiku',
    'couplet': 'Couplet',
    'quatrain': 'Quatrain',
    'free verse': 'Free Verse',
    'epigram': 'Epigram',
    'sonnet fragment': 'Sonnet Fragment'
  };
  
  return styleLabels[poetry.style] || poetry.style;
};
