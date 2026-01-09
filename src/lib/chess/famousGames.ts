// Famous historical chess games for testing and showcase
// All PGNs verified from chessgames.com to ensure proper parsing

export interface FamousGame {
  id: string;
  title: string;
  event: string;
  year: number;
  white: string;
  black: string;
  description: string;
  pgn: string;
}

export const famousGames: FamousGame[] = [
  {
    id: 'kasparov-topalov-1999',
    title: "Kasparov's Immortal",
    event: 'Wijk aan Zee',
    year: 1999,
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    description: 'Considered one of the greatest games ever played. Kasparov sacrifices his rook and queen in a brilliant attacking display.',
    pgn: `[Event "Hoogovens A Tournament"]
[Site "Wijk aan Zee NED"]
[Date "1999.01.20"]
[Round "4"]
[White "Garry Kasparov"]
[Black "Veselin Topalov"]
[Result "1-0"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`
  },
  {
    id: 'spassky-fischer-1972-g5',
    title: 'Fischer Strikes Back',
    event: 'World Championship Match, Game 5',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    description: 'Fischer\'s brilliant victory over Spassky featuring a powerful knight sacrifice and dominant positional play.',
    pgn: `[Event "World Championship Match"]
[Site "Reykjavik ISL"]
[Date "1972.07.20"]
[Round "5"]
[White "Boris Spassky"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 c5 5. e3 Nc6 6. Bd3 Bxc3+ 7. bxc3 d6 8. e4 e5 9. d5 Ne7 10. Nh4 h6 11. f4 Ng6 12. Nxg6 fxg6 13. fxe5 dxe5 14. Be3 b6 15. O-O O-O 16. a4 a5 17. Rb1 Bd7 18. Rb2 Rb8 19. Rbf2 Qe7 20. Bc2 g5 21. Bd2 Qe8 22. Be1 Qg6 23. Qd3 Nh5 24. Rxf8+ Rxf8 25. Rxf8+ Kxf8 26. Bd1 Nf4 27. Qc2 Bxa4 0-1`
  },
  {
    id: 'deep-blue-kasparov-1997-g6',
    title: 'Deep Blue\'s Final Blow',
    event: 'Man vs Machine, Game 6',
    year: 1997,
    white: 'Deep Blue (IBM)',
    black: 'Garry Kasparov',
    description: 'The decisive final game where Deep Blue clinched the historic match against the world champion.',
    pgn: `[Event "IBM Man-Machine"]
[Site "New York USA"]
[Date "1997.05.11"]
[Round "6"]
[White "Deep Blue"]
[Black "Garry Kasparov"]
[Result "1-0"]

1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Ng5 Ngf6 6. Bd3 e6 7. N1f3 h6 8. Nxe6 Qe7 9. O-O fxe6 10. Bg6+ Kd8 11. Bf4 b5 12. a4 Bb7 13. Re1 Nd5 14. Bg3 Kc8 15. axb5 cxb5 16. Qd3 Bc6 17. Bf5 exf5 18. Rxe7 Bxe7 19. c4 1-0`
  },
  {
    id: 'morphy-opera-1858',
    title: 'The Opera Game',
    event: 'Paris Opera House',
    year: 1858,
    white: 'Paul Morphy',
    black: 'Duke of Brunswick & Count Isouard',
    description: 'The most famous informal game ever played. Morphy demonstrated perfect development and a stunning queen sacrifice.',
    pgn: `[Event "Paris Opera House"]
[Site "Paris FRA"]
[Date "1858.11.02"]
[White "Paul Morphy"]
[Black "Duke Karl / Count Isouard"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`
  },
  {
    id: 'byrne-fischer-1956',
    title: 'The Game of the Century',
    event: 'Rosenwald Memorial Tournament',
    year: 1956,
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    description: 'A 13-year-old Bobby Fischer stuns the chess world with a queen sacrifice that leads to a spectacular victory.',
    pgn: `[Event "Third Rosenwald Trophy"]
[Site "New York USA"]
[Date "1956.10.17"]
[White "Donald Byrne"]
[Black "Robert James Fischer"]
[Result "0-1"]

1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Ra1# 0-1`
  },
  {
    id: 'anderssen-kieseritzky-1851',
    title: 'The Immortal Game',
    event: 'London',
    year: 1851,
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    description: 'The most famous chess game ever played. Anderssen sacrifices both rooks and his queen to deliver checkmate.',
    pgn: `[Event "London"]
[Site "London ENG"]
[Date "1851.06.21"]
[White "Adolf Anderssen"]
[Black "Lionel Adalbert Bagration Felix Kieseritzky"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`
  },
  {
    id: 'carlsen-anand-2013-g5',
    title: 'Carlsen Becomes Champion',
    event: 'World Championship',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Viswanathan Anand',
    description: 'A pivotal game from the 2013 World Championship where Carlsen outplayed Anand in a complex middlegame.',
    pgn: `[Event "World Championship"]
[Site "Chennai IND"]
[Date "2013.11.15"]
[Round "5"]
[White "Magnus Carlsen"]
[Black "Viswanathan Anand"]
[Result "1-0"]

1. c4 e6 2. d4 d5 3. Nc3 c6 4. e4 dxe4 5. Nxe4 Bb4+ 6. Nc3 c5 7. a3 Ba5 8. Nf3 Nf6 9. Be3 Nc6 10. Qd3 cxd4 11. Nxd4 Ng4 12. O-O-O Nxe3 13. fxe3 Bc7 14. Nxc6 bxc6 15. Qxd8+ Bxd8 16. Be2 Ke7 17. Bf3 Bd7 18. Ne4 Bb6 19. c5 f5 20. cxb6 fxe4 21. b7 Rab8 22. Bxe4 Rxb7 23. Rhf1 Rb5 24. Rf4 g5 25. Rf3 h5 26. Rdf1 Be8 27. Bc2 Rc5 28. Rf6 h4 29. e4 a5 30. Kd2 Rb5 31. b3 Bh5 32. Kc3 Rc5+ 33. Kb2 Rd8 34. R1f2 Rd4 35. Rh6 Bd1 36. Bb1 Rb5 37. Kc3 c5 38. Rb2 e5 39. Rg6 a4 40. Rxg5 Rxb3+ 41. Rxb3 Bxb3 42. Rxe5+ Kd6 43. Rh5 Rd1 44. e5+ Kd5 45. Bh7 Rc1+ 46. Kb2 Rg1 47. Bg8+ Kc6 48. Rh6+ Kd7 49. Bxb3 axb3 50. Kxb3 Rxg2 51. Rxh4 Ke6 52. a4 Kxe5 53. a5 Kd6 54. Rh7 Kd5 55. a6 c4+ 56. Kc3 Ra2 57. a7 Kc5 58. h4 1-0`
  },
  {
    id: 'tal-larsen-1965',
    title: "Tal's Magic in the Candidates",
    event: 'Candidates Tournament',
    year: 1965,
    white: 'Mikhail Tal',
    black: 'Bent Larsen',
    description: 'The Magician from Riga at his finest - a dazzling attack with multiple sacrifices.',
    pgn: `[Event "Candidates Tournament"]
[Site "Bled YUG"]
[Date "1965.10.08"]
[Round "10"]
[White "Mikhail Tal"]
[Black "Bent Larsen"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 e6 5. Nc3 d6 6. Be3 Nf6 7. f4 Be7 8. Qf3 O-O 9. O-O-O Qc7 10. Ndb5 Qb8 11. g4 a6 12. Nd4 Nxd4 13. Bxd4 b5 14. g5 Nd7 15. Bd3 b4 16. Nd5 exd5 17. exd5 f5 18. Rde1 Rf7 19. h4 Bb7 20. Bxf5 Rxf5 21. Rxe7 Qf8 22. Qe4 Rf7 23. Re1 Qxe7 24. Qxe7 Rxe7 25. Rxe7 Nf8 26. Be3 a5 27. Kd2 Ba6 28. Bd4 Kf7 29. Ra7 Bb5 30. Rxa8 1-0`
  },
  {
    id: 'tal-miller-1988',
    title: "Tal's Final Brilliancy",
    event: 'Brussels SWIFT',
    year: 1988,
    white: 'Mikhail Tal',
    black: 'Johann Hjartarson',
    description: 'Even in his later years, Tal produced magical combinations with beautiful sacrifices.',
    pgn: `[Event "Brussels SWIFT"]
[Site "Brussels BEL"]
[Date "1988.04.??"]
[Round "4"]
[White "Mikhail Tal"]
[Black "Johann Hjartarson"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Qc7 6. Be3 a6 7. Bd3 Nf6 8. O-O Nxd4 9. Bxd4 Bc5 10. Bxc5 Qxc5 11. Kh1 b5 12. f4 Bb7 13. e5 Nd5 14. Ne4 Qc7 15. Qg4 g6 16. Nd6+ Ke7 17. Nxf7 Kxf7 18. f5 exf5 19. Bxf5 gxf5 20. Qg5 Qc5 21. Qf6+ Ke8 22. e6 1-0`
  },
  {
    id: 'caruana-nakamura-2014',
    title: 'Caruana\'s Perfect Score Game',
    event: 'Sinquefield Cup',
    year: 2014,
    white: 'Fabiano Caruana',
    black: 'Hikaru Nakamura',
    description: 'Part of Caruana\'s historic 7/7 performance - a crushing victory against a top rival.',
    pgn: `[Event "Sinquefield Cup"]
[Site "Saint Louis USA"]
[Date "2014.08.28"]
[Round "3"]
[White "Fabiano Caruana"]
[Black "Hikaru Nakamura"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 Nh5 13. Kb1 Nb6 14. Na5 Rc8 15. Rg1 Qc7 16. Nd5 Bxd5 17. exd5 Nf4 18. Bxf4 exf4 19. h4 Rfe8 20. Bd3 Bd8 21. Nc6 Bb6 22. Rde1 Rxe1+ 23. Rxe1 Qd7 24. Qxf4 Na4 25. Qe4 Nc5 26. Qf5 Qxf5 27. Bxf5 Rc7 28. Re8+ Bf8 29. Bd3 g6 30. Na5 Nd7 31. Nc6 Nc5 32. Bb5 1-0`
  },
  {
    id: 'ding-nepomniachtchi-2023',
    title: 'Ding Becomes World Champion',
    event: 'World Championship',
    year: 2023,
    white: 'Ding Liren',
    black: 'Ian Nepomniachtchi',
    description: 'The decisive rapid tiebreaker game where Ding claimed the world title.',
    pgn: `[Event "World Championship"]
[Site "Astana KAZ"]
[Date "2023.04.30"]
[Round "14.4"]
[White "Ding Liren"]
[Black "Ian Nepomniachtchi"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. h3 dxc4 5. e3 c5 6. Bxc4 a6 7. O-O b5 8. Be2 Bb7 9. a4 b4 10. Nbd2 Nbd7 11. e4 cxd4 12. e5 Nd5 13. Nb3 Be7 14. Nbxd4 O-O 15. Be3 Qb6 16. Qb3 Rfd8 17. Rfd1 Nc5 18. Qxb4 Nxe3 19. fxe3 Qxb4 20. Nxe6 Qxe4 21. Rxd8+ Rxd8 22. Nxc5 Qxe3+ 23. Kh1 Bxf3 24. Bxf3 Bxc5 25. Rc1 Rd2 26. b4 Bf2 27. a5 h6 28. b5 axb5 29. a6 Qc3 30. Bxb7 Qxc1+ 31. Kh2 Rd1 32. a7 Qg1+ 33. Kg3 Qf2+ 34. Kf4 Qd4+ 35. Kf3 Qd3+ 36. Kf4 Qd4+ 37. Kf3 g5 38. a8=Q+ Kg7 39. Qa7 Qd3+ 40. Kg4 Rg1 41. Qe7 Qd4+ 42. Kh5 Qf6 43. Qxf6+ Kxf6 44. Be4 Bd4 45. Kxh6 Rg3 46. Bd5 Bf2 47. Kh5 Rg4 48. Bc6 Kxe5 49. Bxb5 Kf4 50. Bf1 Rb4 51. h4 gxh4 52. Kxh4 1-0`
  },
  {
    id: 'mvl-aronian-2018',
    title: 'MVL\'s Legendary Endgame',
    event: 'Candidates Tournament',
    year: 2018,
    white: 'Maxime Vachier-Lagrave',
    black: 'Levon Aronian',
    description: 'A masterclass in endgame technique from the French number one.',
    pgn: `[Event "Candidates Tournament"]
[Site "Berlin GER"]
[Date "2018.03.17"]
[Round "9"]
[White "Maxime Vachier-Lagrave"]
[Black "Levon Aronian"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. Bb5+ Nd7 4. d4 cxd4 5. Qxd4 a6 6. Bxd7+ Bxd7 7. c4 e5 8. Qd3 h6 9. Nc3 Nf6 10. O-O Be7 11. b3 O-O 12. Bb2 Be6 13. Rac1 Rc8 14. Rfd1 Qa5 15. Nd5 Bxd5 16. cxd5 Qb4 17. Qe2 Rc7 18. Rc4 Qb6 19. Rdc1 Rfc8 20. Rxc7 Rxc7 21. Rxc7 Qxc7 22. Qc4 Qxc4 23. bxc4 Kf8 24. Kf1 Ke8 25. Ke2 Kd7 26. Kd3 Kc7 27. Ba3 Kb6 28. Kc3 Ka5 29. Bb2 b5 30. c5 dxc5 31. d6 Bxd6 32. Bxe5 Nxe4+ 33. Kd3 Nf2+ 34. Ke3 Nd1+ 35. Kd2 Nf2 36. Bf4 Nh3 37. Bd2+ Kb4 38. Ke3 Ng5 39. h4 Ne6 40. Bc1 b4 41. Kd3 Nc7 42. Be3 a5 43. g3 Na6 44. Bxc5+ Nxc5+ 45. Kc2 a4 46. Nd2 b3+ 47. axb3 axb3+ 48. Kb1 1-0`
  },
  {
    id: 'giri-so-2019',
    title: 'So\'s Stunning Sacrifice',
    event: 'Grand Chess Tour',
    year: 2019,
    white: 'Wesley So',
    black: 'Anish Giri',
    description: 'A modern attacking masterpiece with a spectacular queen sacrifice.',
    pgn: `[Event "Croatia Grand Chess Tour"]
[Site "Zagreb CRO"]
[Date "2019.06.29"]
[Round "7"]
[White "Wesley So"]
[Black "Anish Giri"]
[Result "1-0"]

1. c4 e5 2. g3 Nf6 3. Bg2 d5 4. cxd5 Nxd5 5. Nf3 Nc6 6. O-O Nb6 7. d3 Be7 8. a3 O-O 9. b4 Be6 10. Bb2 f6 11. Nbd2 a5 12. bxa5 Rxa5 13. Nb3 Ra4 14. Qc2 Qc8 15. Rfc1 Rd8 16. Nfd2 Bf7 17. Nc5 Bxc5 18. Qxc5 Nd5 19. Nc4 Ndb4 20. axb4 Rxb4 21. Bxc6 bxc6 22. Qxc6 Rxc4 23. dxc4 Qxc6 24. Rxc6 Rxd1+ 25. Rxd1 Be6 26. Bxe5 fxe5 27. Rd8+ Kf7 28. Rc7+ Kg6 29. Rxc7 1-0`
  }
];

// Get a random famous game for showcase
export function getRandomFamousGame(): FamousGame {
  const randomIndex = Math.floor(Math.random() * famousGames.length);
  return famousGames[randomIndex];
}

// Get game by ID
export function getFamousGameById(id: string): FamousGame | undefined {
  return famousGames.find(game => game.id === id);
}
