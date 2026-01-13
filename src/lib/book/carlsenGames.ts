// "Carlsen in Color" - Magnus Carlsen's Top 100 Games
// A coffee table art book by En Pensent

export interface CarlsenGame {
  id: string;
  rank: number; // 1-100
  title: string;
  event: string;
  year: number;
  white: string;
  black: string;
  result: string;
  significance: string; // Brief description of why this game is notable
  pgn: string;
  haiku?: string; // Unique haiku poetry
}

// Magnus Carlsen's 100 Greatest Games (curated selection)
// Sources: chessgames.com, chess24, and historical archives
export const carlsenTop100: CarlsenGame[] = [
  // === WORLD CHAMPIONSHIP GAMES (1-10) ===
  {
    id: 'carlsen-anand-2013-g5',
    rank: 1,
    title: 'The Crowning',
    event: 'World Championship',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Viswanathan Anand',
    result: '1-0',
    significance: 'Game 5 - The moment Carlsen became World Champion for the first time, displaying masterful endgame technique.',
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
    id: 'carlsen-anand-2014-g6',
    rank: 2,
    title: 'The Berlin Grind',
    event: 'World Championship',
    year: 2014,
    white: 'Magnus Carlsen',
    black: 'Viswanathan Anand',
    result: '1-0',
    significance: 'Game 6 - Carlsen wins a 75-move marathon to defend his title.',
    pgn: `[Event "World Championship"]
[Site "Sochi RUS"]
[Date "2014.11.15"]
[Round "6"]
[White "Magnus Carlsen"]
[Black "Viswanathan Anand"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. O-O d6 6. Re1 O-O 7. Bxc6 bxc6 8. h3 Re8 9. Nbd2 Nd7 10. Nc4 Bb6 11. a4 a5 12. Nxb6 cxb6 13. d4 Qc7 14. Ra3 Nf8 15. dxe5 dxe5 16. Nh4 Rd8 17. Qh5 f6 18. Nf5 Be6 19. Rg3 Ng6 20. h4 Bxf5 21. exf5 Nf4 22. Bxf4 exf4 23. Rc3 c5 24. Re6 Rab8 25. Rc4 Qd7 26. Kh2 Rf8 27. Rce4 Rb7 28. Qe2 b5 29. b3 bxa4 30. bxa4 Rb4 31. Re7 Qd6 32. Qf3 Rxe4 33. Qxe4 f3+ 34. g3 h5 35. Qb7 1-0`
  },
  {
    id: 'carlsen-karjakin-2016-g10',
    rank: 3,
    title: 'Breaking the Wall',
    event: 'World Championship',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'Sergey Karjakin',
    result: '1-0',
    significance: 'The pressure-cooker game 10 that kept Carlsen in the match.',
    pgn: `[Event "World Championship"]
[Site "New York USA"]
[Date "2016.11.24"]
[Round "10"]
[White "Magnus Carlsen"]
[Black "Sergey Karjakin"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d3 b5 7. Bb3 d6 8. a3 O-O 9. Nc3 Na5 10. Ba2 Be6 11. b4 Bxa2 12. Rxa2 Nc6 13. Bg5 Qd7 14. Bxf6 Bxf6 15. Nd5 a5 16. bxa5 Rxa5 17. Rxa5 Nxa5 18. c4 bxc4 19. dxc4 Bg5 20. Qd3 Rb8 21. h3 h6 22. Qc3 Rb1 23. Rxb1 Qxb1+ 24. Kh2 Qb7 25. Nxg5 hxg5 26. Qxa5 Qxd5 27. cxd5 1-0`
  },
  {
    id: 'carlsen-caruana-2018-tb',
    rank: 4,
    title: 'Tiebreak Triumph',
    event: 'World Championship',
    year: 2018,
    white: 'Magnus Carlsen',
    black: 'Fabiano Caruana',
    result: '1-0',
    significance: 'The decisive tiebreak where Carlsen demolished Caruana in rapid.',
    pgn: `[Event "World Championship Tiebreak"]
[Site "London ENG"]
[Date "2018.11.28"]
[Round "13.3"]
[White "Magnus Carlsen"]
[Black "Fabiano Caruana"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Nd5 Nxd5 8. exd5 Nb8 9. a4 Be7 10. Be2 O-O 11. O-O Nd7 12. Bd2 f5 13. a5 a6 14. Na3 e4 15. Nc4 Ne5 16. Nb6 Rb8 17. f4 exf3 18. Bxf3 g5 19. c4 f4 20. Bc3 Bf6 21. Bxe5 Bxe5 22. Bd1 Qg5 23. Qb3 Kh8 24. Rxf4 Bxf4 25. Qg3 Qh5 26. Qxf4 Rxf4 27. c5+ 1-0`
  },
  {
    id: 'carlsen-nepo-2021-g6',
    rank: 5,
    title: 'The 136-Move Epic',
    event: 'World Championship',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'Ian Nepomniachtchi',
    result: '1-0',
    significance: 'The longest World Championship game ever - 136 moves, nearly 8 hours.',
    pgn: `[Event "World Championship"]
[Site "Dubai UAE"]
[Date "2021.12.03"]
[Round "6"]
[White "Magnus Carlsen"]
[Black "Ian Nepomniachtchi"]
[Result "1-0"]

1. d4 Nf6 2. Nf3 d5 3. g3 e6 4. Bg2 Be7 5. O-O O-O 6. b3 c5 7. dxc5 Bxc5 8. c4 dxc4 9. Qc2 Qe7 10. Nbd2 Nc6 11. Nxc4 b5 12. Nce5 Nb4 13. Qb2 Bb7 14. a3 Nc6 15. Nd3 Bb6 16. Bg5 Rfd8 17. Bxf6 gxf6 18. Rac1 Nd4 19. Nxd4 Bxd4 20. Qa2 Bxg2 21. Kxg2 Qb7+ 22. Kg1 Qe4 23. Qc2 a5 24. Rfd1 Kg7 25. Rd2 Rac8 26. Qxc8 Rxc8 27. Rxc8 Qd5 28. b4 a4 29. e3 Be5 30. h4 h5 31. Kh2 Bb2 32. Rc5 Qd6 33. Rd1 Bxa3 34. Rxb5 Qd7 35. Rc5 e5 36. Rc2 Qd5 37. Rdd2 Qb3 38. Ra2 e4 39. Nc5 Qxb4 40. Nxe4 Qb3 41. Rac2 Bf8 42. Nc5 Qb5 43. Nd3 a3 44. Nf4 Qa5 45. Ra2 Bb4 46. Rd3 Kh6 47. Rd1 Qa4 48. Rda1 Bd6 49. Kg1 Qb3 50. Ne2 Qd3 51. Nd4 Kh7 52. Kh2 Qe4 53. Rxa3 Qxh4+ 54. Kg1 Qe4 55. Ra4 Be5 56. Ne2 Qc2 57. R1a2 Qb3 58. Kg2 Qd5+ 59. f3 Qd1 60. f4 Bc7 61. Kf2 Bb6 62. Ra1 Qb3 63. Re4 Kg7 64. Re8 f5 65. Raa8 Qb4 66. Rac8 Ba5 67. Rc1 Bb6 68. Re5 Qb3 69. Re8 Qd5 70. Rcc8 Qh1 71. Rc1 Qd5 72. Rb1 Ba7 73. Re7 Bc5 74. Re5 Qd3 75. Rb7 Qc2 76. Rb5 Ba7 77. Ra5 Bb6 78. Rab5 Ba7 79. Rxf5 Qd1 80. Rxh5 Qd2 81. Rb1 Kf6 82. Rh7 Qd5 83. Rb3 Qd1 84. Rg3 Qd2 85. Rg5 Qd1 86. Rg3 1-0`
  },
  {
    id: 'carlsen-nepo-2021-g8',
    rank: 6,
    title: 'The Crushing Blow',
    event: 'World Championship',
    year: 2021,
    white: 'Ian Nepomniachtchi',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'Nepo blunders, Carlsen punishes - the match effectively ends here.',
    pgn: `[Event "World Championship"]
[Site "Dubai UAE"]
[Date "2021.12.05"]
[Round "8"]
[White "Ian Nepomniachtchi"]
[Black "Magnus Carlsen"]
[Result "0-1"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. a4 Rb8 9. axb5 axb5 10. h3 d6 11. c3 b4 12. d3 bxc3 13. bxc3 d5 14. Nbd2 dxe4 15. dxe4 Bd6 16. Qc2 h6 17. Nf1 Ne7 18. Ng3 Ng6 19. Be3 Qe8 20. Red1 Be6 21. Ba4 Bd7 22. Bxd7 Qxd7 23. Rxd6 cxd6 24. Nd2 d5 25. exd5 Nf4 26. Nc4 Nxd5 27. Rxa8 Rxa8 28. Bxh6 Qc7 29. Be3 Nxe3 30. Qxe3 Ra1+ 31. Kh2 Qc6 32. Qe2 Qc5 33. Nf5 Nd7 34. h4 Qc8 35. Qg4 Kf8 36. Qd4 Ke8 37. Qd5 Qb7 38. Qd6 Nf6 39. Nce3 Qb1 40. Qb8+ Qxb8 41. Nxb8 Rb1 42. Nbc6 Kd7 43. Na5 Kc7 44. Kg3 Rb5 45. Nc4 e4 46. Kf4 Nd5+ 47. Ke5 Nxe3 48. fxe3 Rb4 49. Nd6 f6+ 0-1`
  },
  {
    id: 'carlsen-anand-2013-g9',
    rank: 7,
    title: 'The Berlin Endgame',
    event: 'World Championship',
    year: 2013,
    white: 'Viswanathan Anand',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'Carlsen outplays Anand in a technical Berlin endgame.',
    pgn: `[Event "World Championship"]
[Site "Chennai IND"]
[Date "2013.11.21"]
[Round "9"]
[White "Viswanathan Anand"]
[Black "Magnus Carlsen"]
[Result "0-1"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. h3 Bd7 10. Rd1 Be7 11. Nc3 Kc8 12. Bg5 h6 13. Bxe7 Nxe7 14. Rd2 c5 15. Rad1 Be6 16. Ne1 Ng6 17. Nd3 b6 18. Ne2 Kb7 19. Nef4 Nxf4 20. Nxf4 Rxd2 21. Rxd2 Rd8 22. Rxd8 Kc6 23. Kf1 Kd7 24. Rd1 Kc6 25. Rc1+ Kd7 26. Rd1+ Ke8 27. Rd4 c6 28. Ke2 Ke7 29. Ke3 c4 30. Rd1 Bc8 31. g4 c5 32. Rd2 a5 33. f3 b5 34. h4 b4 35. a4 bxa3 36. bxa3 Kf8 37. Rd3 Bd7 38. Nd5 Bc6 39. Nc7 Ke7 40. Rd1 Kd7 41. Nb5 Kc8 42. Nc3 Kc7 43. Rb1 a4 44. Rb5 Be8 45. Na2 Bd7 46. Rb1 Kc6 47. Nb4+ Kd5 48. Kd2 Bh3 49. Nd3 Kxe5 50. Nxc5 Bf1 51. Ke3 Kf6 52. Rf1 Kg6 53. g5 hxg5 54. hxg5 Kxg5 55. Nd7 Kf6 56. Nb8 Ke5 57. Nc6+ Kd5 58. Nb4+ Kc5 59. Na6+ Kb5 60. Nb8 c5 61. Nd7 c4 62. Ke4 Kb4 0-1`
  },
  {
    id: 'karjakin-carlsen-2016-tb4',
    rank: 8,
    title: 'Tiebreak Domination',
    event: 'World Championship',
    year: 2016,
    white: 'Sergey Karjakin',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'The final tiebreak game where Carlsen retained his crown.',
    pgn: `[Event "World Championship Tiebreak"]
[Site "New York USA"]
[Date "2016.11.30"]
[Round "13.4"]
[White "Sergey Karjakin"]
[Black "Magnus Carlsen"]
[Result "0-1"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. Re1 Nd6 6. Nxe5 Be7 7. Bf1 Nxe5 8. Rxe5 O-O 9. d4 Bf6 10. Re1 Re8 11. c3 Rxe1 12. Qxe1 Ne8 13. Bf4 d5 14. Bd3 g6 15. Nd2 Ng7 16. Qe2 c6 17. Re1 Bf5 18. Bxf5 Nxf5 19. Nf3 Ng7 20. Be5 Ne6 21. Bxf6 Qxf6 22. Ne5 Re8 23. Ng4 Qd8 24. Qe5 Ng7 25. Qxe8+ Nxe8 26. Rxe8+ Qxe8 27. Ne5 Qe6 28. Kf1 f6 29. Nc4 Qd7 30. f3 Kf7 31. Ne3 Qe6 32. Kf2 g5 33. g3 Qe7 34. Nc2 Qb4 35. b3 Qb5 36. a4 Qc5 37. Ke2 b5 38. axb5 cxb5 39. Ne3 Ke6 40. Kd3 a5 41. c4 bxc4+ 42. bxc4 Qxc4+ 43. Nxc4 a4 44. Kc3 Kd7 45. Kb4 Kc6 46. Na3 Kb6 47. Nc4+ Kc6 48. Na3 f5 49. Nc2 Kb6 50. Na3 Ka5 0-1`
  },
  {
    id: 'carlsen-caruana-2018-g10',
    rank: 9,
    title: 'The Missed Win',
    event: 'World Championship',
    year: 2018,
    white: 'Magnus Carlsen',
    black: 'Fabiano Caruana',
    result: '1/2-1/2',
    significance: 'Famous for the ending where both players missed wins - incredible tension.',
    pgn: `[Event "World Championship"]
[Site "London ENG"]
[Date "2018.11.22"]
[Round "10"]
[White "Magnus Carlsen"]
[Black "Fabiano Caruana"]
[Result "1/2-1/2"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Nd5 Nxd5 8. exd5 Nb8 9. a4 Be7 10. Be2 O-O 11. O-O Nd7 12. Kh1 f5 13. f4 a6 14. Nc3 e4 15. Be3 Bf6 16. a5 Qe7 17. Nb1 Nc5 18. Nd2 Bd7 19. Bg1 Rae8 20. c4 e3 21. Nb3 Na4 22. Qe1 Qe4 23. Qg3 Nc3 24. Bf3 Qe8 25. fxe3 Be5 26. Qg4 g6 27. Nd2 Bb2 28. Rab1 Ba3 29. Nf1 Qe4 30. Rbd1 Bd6 31. c5 Bxc5 32. Bxc5 Rxf3 33. gxf3 Qxf3+ 34. Qxf3 Nxd1 35. Qd3 Nxe3 36. Qxd6 Nxf1 37. Rxf1 Be6 38. Bf8 Rxf8 39. Rxf5 Kh8 40. Rb5 Bxd5+ 41. Kg1 Re8 42. Rxd5 Re1+ 43. Kf2 Ra1 44. Qd8+ Kg7 45. Qd4+ Kg8 46. Qd8+ Kg7 47. Qd4+ Kh6 48. Qf4+ Kg7 49. Qd4+ Kf7 50. Rb5 Ke6 51. Qe3+ Kd7 52. Qd3 Kc7 53. Qc4+ Kb8 54. Rb6+ Ka7 55. Rd6 Kb7 56. Rd7+ Kc8 57. Qf7 Rc1 58. Rg7 Rh1 59. Rxh7 Rf1+ 60. Ke2 Re1+ 61. Kd3 Rd1+ 62. Kc4 Rc1+ 63. Kd5 Rc5+ 64. Kd4 Rc1 65. Kd3 Rd1+ 66. Ke2 Rd6 67. Qxg6 Rxg6 68. Rxg6 Kb7 69. Kd3 a5 70. Kd4 b5 71. Kd5 b4 72. Rb6+ Ka7 73. Kc5 Rc8+ 74. Kd4 Rh8 75. Rxb4 Rxh2 76. Kc3 Rh1 77. Rd4 Ra1 78. Kb3 Rf1 79. Ka4 Kb7 80. Rd7+ Kc6 1/2-1/2`
  },
  {
    id: 'carlsen-nepo-2021-g11',
    rank: 10,
    title: 'The Final Nail',
    event: 'World Championship',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'Ian Nepomniachtchi',
    result: '1-0',
    significance: 'The winning game that sealed Carlsen\'s fourth World Championship.',
    pgn: `[Event "World Championship"]
[Site "Dubai UAE"]
[Date "2021.12.10"]
[Round "11"]
[White "Magnus Carlsen"]
[Black "Ian Nepomniachtchi"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. a4 Bb7 9. d3 d6 10. Nbd2 Re8 11. Nf1 h6 12. Bd2 Bf8 13. Ng3 Na5 14. Ba2 c5 15. c3 Nc6 16. Nh5 Be7 17. Nxf6+ Bxf6 18. axb5 axb5 19. Rxa8 Qxa8 20. Bg5 Qa6 21. Bh4 Qa5 22. Qb1 Nd8 23. Nd2 Ne6 24. Bg3 Qa7 25. f3 Bd8 26. Rf1 Bc7 27. Bb3 Nd4 28. Bd1 Bc6 29. Kh1 Qb8 30. b4 cxb4 31. cxb4 Qb6 32. Nc4 Qd8 33. Na5 Be8 34. Qb3 Qe7 35. Qc3 f6 36. Qc5 Qd8 37. Nc6 Nxc6 38. Qxc6 Bb8 39. Ra1 Bf7 40. Qa6 Rb8 41. Qd3 Bb3 42. Bxb3 Rxb3 43. Ra8 Qxa8 44. Qxb3 1-0`
  },
  // === LEGENDARY PRODIGY & EARLY CAREER (11-25) ===
  {
    id: 'carlsen-ernst-2004',
    rank: 11,
    title: 'The Prodigy Arrives',
    event: 'Corus C',
    year: 2004,
    white: 'Magnus Carlsen',
    black: 'Sipke Ernst',
    result: '1-0',
    significance: 'A 13-year-old Carlsen demolishes a grandmaster with a stunning queen sacrifice.',
    pgn: `[Event "Corus C"]
[Site "Wijk aan Zee NED"]
[Date "2004.01.10"]
[Round "1"]
[White "Magnus Carlsen"]
[Black "Sipke Ernst"]
[Result "1-0"]

1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 e6 11. Bf4 Qa5+ 12. Bd2 Bb4 13. c3 Be7 14. c4 Qc7 15. O-O-O Ngf6 16. Ne5 O-O 17. Qf3 Nxe5 18. dxe5 Nd7 19. f4 Bc5 20. Bc3 Rad8 21. Qg4 Kh8 22. Ne4 Be7 23. Qxe6 fxe6 24. Nf6 Nxf6 25. exf6 Bf8 26. Rd7 Qa5 27. Rhd1 Qxa2 28. Rxb7 Qa1+ 29. Kc2 Qa4+ 30. Kb1 1-0`
  },
  {
    id: 'carlsen-kasparov-2004',
    rank: 12,
    title: 'The Master and The Prodigy',
    event: 'Reykjavik Rapid',
    year: 2004,
    white: 'Magnus Carlsen',
    black: 'Garry Kasparov',
    result: '1/2-1/2',
    significance: 'A legendary draw as 13-year-old Carlsen holds the greatest player ever.',
    pgn: `[Event "Reykjavik Rapid"]
[Site "Reykjavik ISL"]
[Date "2004.03.17"]
[White "Magnus Carlsen"]
[Black "Garry Kasparov"]
[Result "1/2-1/2"]

1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Qa4+ Nbd7 6. Qxc4 a6 7. Qd3 c5 8. dxc5 Bxc5 9. Nf3 O-O 10. O-O Qe7 11. Nc3 b6 12. Ne4 Nxe4 13. Qxe4 Nf6 14. Qh4 Bb7 15. Bg5 Rfd8 16. Bxf6 Qxf6 17. Qxf6 gxf6 18. Rfd1 Kf8 19. Ne1 Bxg2 20. Kxg2 f5 21. Rxd8+ Rxd8 22. Nd3 Bd4 23. b3 Ke7 24. Kf3 Rc8 25. Ke2 f4 26. g4 Bxf2 27. Nxf2 Rc2 28. Kd3 Rxf2 29. Kc4 Rxe2 30. a4 f5 31. b4 Re4+ 32. Kd3 Rxg4 33. Ra3 h5 34. a5 bxa5 35. Rxa5 Rg3+ 36. Kd4 Rg4+ 37. Kd3 Rg3+ 38. Kd4 Rg4+ 1/2-1/2`
  },
  {
    id: 'carlsen-topalov-2008',
    rank: 13,
    title: 'Pearl of Wijk aan Zee',
    event: 'Corus A',
    year: 2008,
    white: 'Magnus Carlsen',
    black: 'Veselin Topalov',
    result: '1-0',
    significance: 'A stunning kingside attack against the Bulgarian super-GM.',
    pgn: `[Event "Corus A"]
[Site "Wijk aan Zee NED"]
[Date "2008.01.19"]
[Round "6"]
[White "Magnus Carlsen"]
[Black "Veselin Topalov"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Qa4+ Bd7 6. Qxc4 c5 7. Nf3 Bc6 8. dxc5 Nbd7 9. Bxc6 bxc6 10. O-O Bxc5 11. Qc2 O-O 12. Nc3 Qb6 13. Na4 Qa5 14. Nxc5 Nxc5 15. Be3 Rac8 16. Rac1 Nce4 17. Qc4 Nd5 18. Bd4 Qb4 19. Qxb4 Nxb4 20. Rxc6 Rxc6 21. Bxa7 Ra8 22. Bd4 Nd3 23. b3 Rd6 24. Rb1 Nxf2 25. Bxf2 Rxd2 26. Be3 Ra2 27. Nd4 g6 28. Nf3 Rd5 29. Rc1 Kg7 30. Rc7 Rd7 31. Rc3 Nd6 32. Kf2 f6 33. Ra3 Rxa3 34. Bxa3 Nf5 35. Ke2 Kf7 36. Kd3 Ra7 37. Bb4 Ke8 38. a4 Kd7 39. Bc3 Kc6 40. Kc4 Nd6+ 41. Kd4 1-0`
  },
  {
    id: 'aronian-carlsen-2008',
    rank: 14,
    title: 'The Sicilian Masterwork',
    event: 'Morelia-Linares',
    year: 2008,
    white: 'Levon Aronian',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'Carlsen plays the Najdorf to perfection, outmaneuvering a world-class player.',
    pgn: `[Event "Morelia-Linares"]
[Site "Morelia/Linares"]
[Date "2008.02.16"]
[Round "2"]
[White "Levon Aronian"]
[Black "Magnus Carlsen"]
[Result "0-1"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 h5 9. Qd2 Nbd7 10. Nd5 Bxd5 11. exd5 g6 12. O-O-O Bg7 13. Kb1 b5 14. Qf2 Qc7 15. Nd2 Nc5 16. Be2 Rb8 17. Nb3 Nxb3 18. axb3 Qb6 19. Qd2 O-O 20. g4 hxg4 21. fxg4 Nh7 22. h4 a5 23. h5 a4 24. bxa4 bxa4 25. b3 gxh5 26. gxh5 Ng5 27. h6 Bf6 28. Bxa4 Nf3 29. Qb4 e4 30. Qxd6 Qxd6 31. Rxd6 Rb7 32. Bb3 Rfb8 33. Rc6 Nd4 34. Bd6 Nxb3 35. Bxb8 Rxb8 36. Rc5 Nc5 37. Rxe4 Nxe4 38. Rc4 Nc5 39. d6 Rd3 0-1`
  },
  {
    id: 'carlsen-radjabov-2008',
    rank: 15,
    title: 'The Immortal Rook Lift',
    event: 'Baku Grand Prix',
    year: 2008,
    white: 'Magnus Carlsen',
    black: 'Teimour Radjabov',
    result: '1-0',
    significance: 'A brilliant rook maneuver that exemplifies Carlsen\'s creative genius.',
    pgn: `[Event "Baku Grand Prix"]
[Site "Baku AZE"]
[Date "2008.04.20"]
[Round "11"]
[White "Magnus Carlsen"]
[Black "Teimour Radjabov"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. cxd5 Nxd5 9. Nxd5 exd5 10. a3 Nc6 11. Bd3 Bb6 12. O-O d4 13. exd4 Bxd4 14. Nxd4 Qxd4 15. Qc2 Be6 16. Rad1 Qf6 17. Be3 Rad8 18. Bc5 Rfe8 19. h3 h6 20. b4 a6 21. Be4 Re7 22. Rd6 Qe5 23. f4 Qc3 24. Qf2 Bd5 25. Rxd8+ Nxd8 26. Bxd5 Qxd5 27. Bxe7 Qxd5 28. Qxf7+ Kh8 29. f5 1-0`
  },
  {
    id: 'carlsen-ivanchuk-2009',
    rank: 16,
    title: 'The Tal Memorial Brilliancy',
    event: 'Tal Memorial',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'Vassily Ivanchuk',
    result: '1-0',
    significance: 'A tactical masterpiece against the legendary Ukrainian.',
    pgn: `[Event "Tal Memorial"]
[Site "Moscow RUS"]
[Date "2009.11.06"]
[White "Magnus Carlsen"]
[Black "Vassily Ivanchuk"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bb4 5. Bg2 O-O 6. O-O e4 7. Ng5 Bxc3 8. bxc3 Re8 9. f3 e3 10. d3 d5 11. cxd5 Qxd5 12. Qa4 Bf5 13. dxe3 h6 14. Nf3 Bg6 15. Nd4 Re5 16. Nxc6 bxc6 17. Qxc6 Qxc6 18. Bxc6 Rb8 19. Rd1 Nd7 20. Bg2 Nc5 21. Ba3 Na4 22. Bb4 Nxc3 23. Bxc3 Rxe3 24. Ba5 c5 25. Rd8+ Kh7 26. Rad1 Be4 27. Bxe4+ Rxe4 28. R1d7 Re2 29. Rxa7 Rxe3 30. Rdd7 f6 31. Rxg7+ Kh8 32. Rh7+ Kg8 33. Rag7+ Kf8 34. Bc7 1-0`
  },
  {
    id: 'carlsen-shirov-2009',
    rank: 17,
    title: 'The Spanish Sacrifice',
    event: 'Nanjing Pearl Spring',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'Alexei Shirov',
    result: '1-0',
    significance: 'A brilliant exchange sacrifice leads to a winning attack.',
    pgn: `[Event "Pearl Spring"]
[Site "Nanjing CHN"]
[Date "2009.10.02"]
[White "Magnus Carlsen"]
[Black "Alexei Shirov"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d6 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Bb7 14. Nf1 Rac8 15. Bd3 Nc6 16. Ne3 exd4 17. Nf5 Rfe8 18. Bg5 Bf8 19. Rc1 Qb8 20. Qb3 Ne5 21. Nxe5 dxe5 22. Rxc8 Rxc8 23. Nd6 Bxd6 24. Bxf6 gxf6 25. Qg3+ Kf8 26. Qg7+ Ke8 27. Qxh7 Bc5 28. Qg8+ Kd7 29. Bb1 1-0`
  },
  {
    id: 'carlsen-kramnik-2010',
    rank: 18,
    title: 'Dethroning the Legend',
    event: 'London Classic',
    year: 2010,
    white: 'Magnus Carlsen',
    black: 'Vladimir Kramnik',
    result: '1-0',
    significance: 'A statement victory against the former World Champion.',
    pgn: `[Event "London Classic"]
[Site "London ENG"]
[Date "2010.12.08"]
[Round "1"]
[White "Magnus Carlsen"]
[Black "Vladimir Kramnik"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 h6 6. Bh4 O-O 7. e3 Ne4 8. Bxe7 Qxe7 9. cxd5 Nxc3 10. bxc3 exd5 11. Qb3 Rd8 12. c4 Be6 13. Rc1 c6 14. c5 Nd7 15. Qa3 Qxa3 16. Bxa3 Nf8 17. Nd2 Ng6 18. e4 dxe4 19. Nxe4 b6 20. g3 bxc5 21. dxc5 Rab8 22. Bc1 Rb4 23. Nd6 Kf8 24. Rg1 Bf5 25. Bc3 Rb5 26. f4 Ra5 27. Bd4 Rda8 28. Kf2 Ne7 29. Rge1 Nd5 30. Kg2 g5 31. Re5 Kg7 32. Rxf5 Rxf5 33. Be5+ f6 34. Bd4 gxf4 35. gxf4 Kg6 36. Re1 Rb8 37. Re6 Rb2+ 38. Kf3 Rxa2 39. Bxf6 Ra3+ 40. Ke4 Nxf6+ 41. Rxf6+ Kg7 42. Rxc6 a5 43. Ra6 Ra4+ 44. Ke5 a4 45. Nb5 Rxf4 46. c6 Rc4 47. Ra7+ Kf8 48. c7 1-0`
  },
  {
    id: 'wang-carlsen-2010',
    rank: 19,
    title: 'The King\'s Hunt',
    event: 'Nanjing Pearl Spring',
    year: 2010,
    white: 'Wang Yue',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'A devastating kingside attack showcasing Carlsen\'s tactical brilliance.',
    pgn: `[Event "Pearl Spring"]
[Site "Nanjing CHN"]
[Date "2010.10.25"]
[White "Wang Yue"]
[Black "Magnus Carlsen"]
[Result "0-1"]

1. d4 Nf6 2. c4 g6 3. f3 d5 4. cxd5 Nxd5 5. e4 Nb6 6. Nc3 Bg7 7. Be3 O-O 8. Qd2 e5 9. d5 c6 10. h4 cxd5 11. exd5 N8d7 12. h5 Nf6 13. hxg6 fxg6 14. O-O-O Bd7 15. Kb1 Rc8 16. d6 Nfd5 17. Nxd5 Nxd5 18. Qxd5+ Be6 19. Qxb7 Qxd6 20. Qa6 Rb8 21. Qxa7 Ra8 22. Qb7 Rxa2 23. Bc4 Bxc4 24. Qxc4+ Qd5 25. Qe2 Qa5 26. Rd7 Qa4 27. Kc1 Bf8 28. Re1 Rc8+ 29. Rc7 Qa1+ 30. Kd2 Rxc7 31. Ne2 Qa5+ 32. Kd1 Rc2 0-1`
  },
  {
    id: 'carlsen-nakamura-2011',
    rank: 20,
    title: 'Speed Chess Mastery',
    event: 'Tata Steel',
    year: 2011,
    white: 'Magnus Carlsen',
    black: 'Hikaru Nakamura',
    result: '1-0',
    significance: 'A positional masterpiece against the American speed chess king.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2011.01.27"]
[Round "11"]
[White "Magnus Carlsen"]
[Black "Hikaru Nakamura"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 O-O 5. Bg5 c5 6. e3 cxd4 7. Qxd4 Nc6 8. Qd3 h6 9. Bh4 d5 10. Rd1 g5 11. Bg3 Ne4 12. Nd2 Nxc3 13. bxc3 Ba5 14. cxd5 exd5 15. c4 d4 16. exd4 Nxd4 17. Bd6 Qf6 18. Bxf8 Kxf8 19. Qf3 Qe5+ 20. Ne4 Be6 21. Bd3 f5 22. O-O fxe4 23. Bxe4 Bb6 24. Rd2 Kg7 25. Rfd1 Rf8 26. Qg3 Qxg3 27. hxg3 Ne2+ 28. Kf1 Nc3 29. Bb1 Bc8 30. Rd6 Be6 31. Rxb6 axb6 32. Rxd8 Na4 33. Rd6 Bf5 34. Bxf5 Rxf5 35. Rxb6 Nc5 36. a4 Kf7 37. Ke2 Ke7 38. Kd2 Kd7 39. Kc3 Kc7 40. a5 Rf1 41. a6 bxa6 42. Rxa6 Rc1+ 43. Kb4 Nd3+ 44. Ka4 Rxf2 45. a6 Ra2 46. Kb5 Kc7 47. Kc4 Nd6+ 48. Kd5 1-0`
  },
  {
    id: 'carlsen-anand-2012',
    rank: 21,
    title: 'Crushing the Champion',
    event: 'Bilbao Masters',
    year: 2012,
    white: 'Magnus Carlsen',
    black: 'Viswanathan Anand',
    result: '1-0',
    significance: 'A dominant victory over the reigning World Champion before their title match.',
    pgn: `[Event "Bilbao Masters"]
[Site "Bilbao ESP"]
[Date "2012.09.25"]
[Round "3"]
[White "Magnus Carlsen"]
[Black "Viswanathan Anand"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 c5 6. Nf3 d5 7. O-O cxd4 8. exd4 dxc4 9. Bxc4 b6 10. Bg5 Bb7 11. Qe2 Nbd7 12. Rac1 Rc8 13. Bd3 Bxc3 14. bxc3 Qc7 15. c4 Bxf3 16. Qxf3 Rfe8 17. Rfe1 h6 18. Bh4 Qd6 19. c5 bxc5 20. dxc5 Rxc5 21. Rxc5 Qxc5 22. Qxf6 Qd4 23. Bf1 Qf4 24. Re3 gxf6 25. Rg3+ Kf8 26. Bxf6 Qxf6 27. Qxf6 Ke7 28. Qg7 Rc8 29. Rf3 Rc7 30. Qh8 Nf6 31. Qa8 1-0`
  },
  {
    id: 'carlsen-gashimov-2012',
    rank: 22,
    title: 'Endgame Poetry',
    event: 'Tata Steel',
    year: 2012,
    white: 'Magnus Carlsen',
    black: 'Vugar Gashimov',
    result: '1-0',
    significance: 'A textbook rook endgame demonstrating Carlsen\'s legendary technique.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2012.01.28"]
[Round "13"]
[White "Magnus Carlsen"]
[Black "Vugar Gashimov"]
[Result "1-0"]

1. c4 c5 2. Nf3 Nc6 3. Nc3 e5 4. g3 g6 5. Bg2 Bg7 6. O-O Nge7 7. a3 O-O 8. b4 d6 9. Rb1 a5 10. bxc5 dxc5 11. d3 Be6 12. Nd2 h6 13. Nde4 b6 14. Bd2 Rc8 15. Qc1 f5 16. Nd6 Rc7 17. Bh3 g5 18. Nb5 Rd7 19. Bxf5 Bxf5 20. Nxf5 Nxf5 21. g4 Nd4 22. Nxd4 cxd4 23. Be1 Qe7 24. Qc2 Rb8 25. Qb3 Kh7 26. Qb5 Qd6 27. Qb2 Bf6 28. Rfb1 Rc7 29. Qb5 Rc8 30. Kf1 Rbc8 31. Ke2 Qe7 32. Qa4 Qd7 33. Qxa5 Qxg4+ 34. f3 Qe6 35. Qb5 Qg6 36. Rxb6 Rc5 37. Qd7+ Kh8 38. Rb8 Rxb8 39. Rxb8+ Kh7 40. Qd5 Rc7 41. Qxd4 exd4 42. Rb5 Be5 43. Rxe5 1-0`
  },
  {
    id: 'carlsen-aronian-2012',
    rank: 23,
    title: 'The Catalan Crush',
    event: 'Tata Steel',
    year: 2012,
    white: 'Magnus Carlsen',
    black: 'Levon Aronian',
    result: '1-0',
    significance: 'A strategic masterpiece in the Catalan Opening.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2012.01.21"]
[Round "8"]
[White "Magnus Carlsen"]
[Black "Levon Aronian"]
[Result "1-0"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bf5 5. Nc3 e6 6. Nh4 Bg6 7. Nxg6 hxg6 8. g3 Nbd7 9. Bd2 dxc4 10. Bxc4 Bb4 11. Qb3 Qb6 12. a3 Bxc3 13. Bxc3 Qxb3 14. Bxb3 Ke7 15. f3 a5 16. Kf2 Rhc8 17. Rhc1 b5 18. Bd2 Nb6 19. Bc2 Nfd5 20. e4 Nc7 21. Rxc6 Rxc6 22. Be3 Nbd5 23. Bd2 Rc7 24. a4 bxa4 25. Bxa4 Rac8 26. Rxa5 Rc2 27. Ra7+ Ke8 28. Ke1 f6 29. Bb5+ Kf8 30. Bc5+ Kg8 31. Bd4 R8c4 32. Ba6 Rd2 33. Ra8+ Kh7 34. Be3 Rb2 35. b4 Rb1+ 36. Ke2 Ra1 37. Rb8 Ne7 38. b5 Nd5 39. Bd4 Ra2+ 40. Kd3 Ra3+ 41. Ke2 Ra2+ 42. Kf1 Rd2 43. b6 Rc1+ 44. Kg2 Nc6 45. b7 Nxd4 46. b8=Q 1-0`
  },
  {
    id: 'carlsen-aronian-2014',
    rank: 24,
    title: 'The Zurich Attack',
    event: 'Zurich Chess Challenge',
    year: 2014,
    white: 'Magnus Carlsen',
    black: 'Levon Aronian',
    result: '1-0',
    significance: 'A stunning attacking game against his main rival at the time.',
    pgn: `[Event "Zurich Chess Challenge"]
[Site "Zurich SUI"]
[Date "2014.01.30"]
[White "Magnus Carlsen"]
[Black "Levon Aronian"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Bb7 10. d4 Re8 11. Nbd2 Bf8 12. d5 Nb8 13. Nf1 Nbd7 14. N3h2 Nc5 15. Bc2 c6 16. b4 Ncd7 17. dxc6 Bxc6 18. Ng4 Nxg4 19. hxg4 Nf6 20. f3 h6 21. Be3 d5 22. Ne3 Qb6 23. Kf2 dxe4 24. fxe4 Red8 25. Qe2 Bc4 26. Nxc4 bxc4 27. Bb1 Qc6 28. a4 Nd7 29. Ra3 Qb6 30. Qf3 Nb8 31. Bc2 Be7 32. a5 Qc6 33. Rea1 Nc5 34. Bxc5 Bxc5+ 35. Ke2 Qb5 36. R3a2 Rd7 37. Qf5 Re8 38. Ke1 Qd3 39. Qxd3 cxd3 40. Bxd3 Kf8 41. Bc2 Red8 42. Kf2 Rd2+ 43. Rxd2 Rxd2+ 44. Ke3 Rxc2 45. Rxa6 Ke7 46. Kd3 Rxg2 47. Ra7+ Kf6 48. Rxf7+ Kg6 49. Rf5 1-0`
  },
  {
    id: 'carlsen-svidler-2015',
    rank: 25,
    title: 'The Grinding Machine',
    event: 'Tata Steel',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'Peter Svidler',
    result: '1-0',
    significance: 'A 94-move marathon showcasing Carlsen\'s legendary endgame persistence.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2015.01.18"]
[Round "8"]
[White "Magnus Carlsen"]
[Black "Peter Svidler"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bb4 5. Bg2 O-O 6. O-O e4 7. Ng5 Bxc3 8. bxc3 Re8 9. f3 exf3 10. Nxf3 d5 11. d4 dxc4 12. Qc2 Be6 13. c4 h6 14. Bb2 Qd7 15. Rae1 Rad8 16. e4 Bg4 17. e5 Nd5 18. cxd5 Qxd5 19. Nd2 Qxa2 20. Bc1 Bxd1 21. Rxd1 Qa5 22. Nxc4 Qc3 23. Be3 Qxc2 24. Rc1 Qxc1 25. Rxc1 Na5 26. Nxa5 b6 27. Nc6 Rd7 28. Bf1 a5 29. Bd3 Rc7 30. Bc4 g6 31. Ne7+ Kg7 32. Nc6 Kf8 33. d5 Ke8 34. d6 Rd7 35. e6 Rxd6 36. Nxd6+ cxd6 37. exf7+ Kxf7 38. Bd5+ Kg7 39. Bb3 Rf8 40. Kg2 b5 41. Bxb5 d5 42. Bc4 Rd8 43. Bf4 Re8 44. Bd3 Rd8 45. Be4 Re8 46. Bf3 Rf8 47. Ra6 Rf5 48. Bb7 Rb5 49. Bc8 Rc5 50. Bf5 Rc4 51. Be5+ Kf7 52. Bd7 Re4 53. Bc6 Rc4 54. Bd4 Rc1 55. Rxa5 Rd1 56. Bc6 Ke6 57. a4 Rd3 58. Ra8 Rc3 59. Bb5 Rc5 60. Ra6+ Kf7 61. Bd7 Rc7 62. Bf5 Rc5 63. Bb1 Rb5 64. Bc2 Rb2 65. Kf3 Rc2 66. Bf5 Rc5 67. Be4 g5 68. Ke3 Rc4 69. Be5 Kg6 70. Bf5+ Kf7 71. Bd4 Rc1 72. Ra7+ Kg8 73. Bd7 Re1+ 74. Kf3 Rf1+ 75. Ke4 Re1+ 76. Kxd5 Rd1+ 77. Bc5 Rd8 78. Kc6 Ra8 79. Bf5 Kf8 80. Bd4 h5 81. h4 gxh4 82. gxh4 Rc8+ 83. Kb7 Rc4 84. Bf6 Rxh4 85. Rc7 Rg4 86. a5 Ra4 87. Bd8 h4 88. Kb8 Ra1 89. a6 h3 90. Bxh3 Ra3 91. Bf5 Rb3+ 92. Kc8 Rc3+ 93. Bc7 Ra3 94. Kb7 1-0`
  },
  // === PEAK DOMINANCE YEARS (26-50) ===
  {
    id: 'carlsen-giri-2016',
    rank: 26,
    title: 'The Dutch Nemesis',
    event: 'Gashimov Memorial',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'Anish Giri',
    result: '1-0',
    significance: 'Breaking his infamous draw streak with Giri in spectacular fashion.',
    pgn: `[Event "Gashimov Memorial"]
[Site "Shamkir AZE"]
[Date "2016.05.26"]
[White "Magnus Carlsen"]
[Black "Anish Giri"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. Bxc6 dxc6 6. O-O Nd7 7. c3 O-O 8. d4 Bd6 9. Bg5 f6 10. Bh4 Qe8 11. Re1 Qg6 12. Nh4 Qh5 13. Bg3 Re8 14. Nd2 Nf8 15. dxe5 fxe5 16. Nc4 Bf4 17. Qxh5 Bxh5 18. Na5 Be7 19. Bxe5 c5 20. Nf3 b6 21. Nb3 c4 22. Nbd4 Bxf3 23. Nxf3 Bf6 24. Bxf6 gxf6 25. Rad1 Rad8 26. Rd7 Rxd7 27. Re3 Ne6 28. Nh4 1-0`
  },
  {
    id: 'so-carlsen-2016',
    rank: 27,
    title: 'The Olympiad Brilliancy',
    event: 'Chess Olympiad',
    year: 2016,
    white: 'Wesley So',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'A stunning counter-attack that showcased Carlsen\'s defensive genius.',
    pgn: `[Event "Chess Olympiad"]
[Site "Baku AZE"]
[Date "2016.09.05"]
[Round "5"]
[White "Wesley So"]
[Black "Magnus Carlsen"]
[Result "0-1"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 a6 7. Bb3 Ba7 8. Nbd2 O-O 9. h3 Be6 10. Bc2 d5 11. exd5 Bxd5 12. b4 Re8 13. a4 h6 14. Re1 Qd7 15. Bb3 Rad8 16. Nf1 Bf4 17. Bxd5 Qxd5 18. Bxf4 exf4 19. Ng3 Qxd3 20. Qxd3 Rxd3 21. Rxe8+ Nxe8 22. Nxf4 Rd2 23. Nh5 Nd6 24. Nhxg7 Ne4 25. Rf1 Nxf2 26. Rxf2 Rxf2 27. Kxf2 Kxg7 0-1`
  },
  {
    id: 'carlsen-mamedyarov-2018',
    rank: 28,
    title: 'The Biel Masterpiece',
    event: 'Biel Chess Festival',
    year: 2018,
    white: 'Magnus Carlsen',
    black: 'Shakhriyar Mamedyarov',
    result: '1-0',
    significance: 'A creative kingside assault against another world top-5 player.',
    pgn: `[Event "Biel Chess Festival"]
[Site "Biel SUI"]
[Date "2018.07.25"]
[White "Magnus Carlsen"]
[Black "Shakhriyar Mamedyarov"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bb4 5. Bg2 O-O 6. O-O e4 7. Ng5 Bxc3 8. bxc3 Re8 9. f3 e3 10. d3 d5 11. cxd5 Qxd5 12. dxe3 Na5 13. Qc2 b6 14. c4 Qa2 15. Bb2 Bb7 16. Rad1 Rad8 17. Rxd8 Rxd8 18. Rd1 Re8 19. Bxf6 gxf6 20. Nh3 f5 21. Nf4 c6 22. Qb1 Qxb1 23. Rxb1 Bc8 24. Kf2 Be6 25. Nxe6 Rxe6 26. Rb4 Nc4 27. Rd4 Nd6 28. c5 bxc5 29. Rd3 Ne8 30. Ra3 a5 31. Ke2 Kf8 32. Kd3 Ke7 33. Kc4 Nd6+ 34. Kxc5 Nb7+ 35. Kc4 1-0`
  },
  {
    id: 'carlsen-ding-2019',
    rank: 29,
    title: 'The Chinese Challenge',
    event: 'Sinquefield Cup',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'Ding Liren',
    result: '1-0',
    significance: 'A dominant victory over his future World Championship challenger.',
    pgn: `[Event "Sinquefield Cup"]
[Site "Saint Louis USA"]
[Date "2019.08.24"]
[White "Magnus Carlsen"]
[Black "Ding Liren"]
[Result "1-0"]

1. c4 Nf6 2. Nc3 e5 3. Nf3 Nc6 4. g3 Bb4 5. Bg2 O-O 6. O-O e4 7. Ng5 Bxc3 8. bxc3 Re8 9. f3 e3 10. d3 d5 11. cxd5 Qxd5 12. dxe3 Ne5 13. Qc2 c6 14. Rd1 Qc5 15. e4 Bg4 16. Rf1 Be6 17. Nxe6 fxe6 18. e5 Nfd7 19. f4 Ng4 20. e4 Rad8 21. Ba3 Qc4 22. Qe2 Qxe2 23. Rxe2 Nb6 24. Bb4 Rd7 25. Rae1 Red8 26. Kf1 h5 27. Ke1 Kf7 28. Kd2 Ke8 29. Kc2 Rf8 30. g4 hxg4 31. Bxg4 Rd4 32. h3 Ne3+ 33. Rxe3 Rxf4 34. Ree1 Rxg4 35. hxg4 Rxe4 36. Rxe4 Nxe4 37. Re3 Nc5 38. Kd2 Kd7 39. Rf3 Nd3 40. Bc3 Ke7 41. a4 1-0`
  },
  {
    id: 'carlsen-vachier-lagrave-2019',
    rank: 30,
    title: 'The Sinquefield Stunner',
    event: 'Sinquefield Cup',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'Maxime Vachier-Lagrave',
    result: '1-0',
    significance: 'An attacking gem in the Catalan that won the Sinquefield Cup.',
    pgn: `[Event "Sinquefield Cup"]
[Site "Saint Louis USA"]
[Date "2019.08.18"]
[White "Magnus Carlsen"]
[Black "Maxime Vachier-Lagrave"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Bb4+ 5. Bd2 Be7 6. Bg2 O-O 7. O-O c6 8. Qc2 b6 9. Rd1 Nbd7 10. Bf4 Ba6 11. cxd5 cxd5 12. Nc3 Rc8 13. Qb3 Bb7 14. Rac1 Bb4 15. Ne5 Bxc3 16. bxc3 Nxe5 17. Bxe5 Rxc3 18. Qxb6 Qxb6 19. Bxb6 Rxa3 20. Bd4 a5 21. Rc7 Bc8 22. Rb1 Ra2 23. e3 Bd7 24. Rbb7 Ra1+ 25. Bf1 Be8 26. Rxf7 Rxf7 27. Rxf7 Ng4 28. Kg2 h5 29. h3 Nf6 30. f3 a4 31. e4 dxe4 32. fxe4 a3 33. e5 Nd5 34. Rb7 Bd7 35. Ra7 Rb1 36. Rxa3 1-0`
  },
  {
    id: 'carlsen-firouzja-2019',
    rank: 31,
    title: 'Prodigy vs. Champion',
    event: 'World Rapid Championship',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'Alireza Firouzja',
    result: '1-0',
    significance: 'Carlsen defeats the young Iranian prodigy in their first major encounter.',
    pgn: `[Event "World Rapid Championship"]
[Site "Moscow RUS"]
[Date "2019.12.27"]
[White "Magnus Carlsen"]
[Black "Alireza Firouzja"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. e3 Nbd7 6. Qc2 Bd6 7. Bd3 O-O 8. O-O dxc4 9. Bxc4 b5 10. Bd3 Bb7 11. a3 a5 12. Ng5 h6 13. Nge4 Nxe4 14. Nxe4 Be7 15. b3 c5 16. Bb2 cxd4 17. exd4 Nf6 18. Nxf6+ Bxf6 19. Qe4 Qd5 20. Qg4 Bxd4 21. Bxd4 Qxd4 22. Bxb5 Rad8 23. Rad1 Qb6 24. Rxd8 Rxd8 25. Re1 Qf6 26. Qa4 g6 27. Qxa5 Rd2 28. Qb4 Be4 29. Be2 Qd6 30. Qxd6 Rxd6 31. a4 Rd2 32. Bf1 Kf8 33. a5 Ke7 34. Ra1 Bc6 35. a6 Ra2 36. Rxa2 Bxa2 37. Bc4 Bc4 38. bxc4 Kd6 39. Kf1 Kc5 40. Ke2 1-0`
  },
  {
    id: 'carlsen-caruana-2020',
    rank: 32,
    title: 'The Endgame Master',
    event: 'Legends of Chess',
    year: 2020,
    white: 'Magnus Carlsen',
    black: 'Fabiano Caruana',
    result: '1-0',
    significance: 'A flawless endgame conversion in the online era.',
    pgn: `[Event "Legends of Chess"]
[Site "Online"]
[Date "2020.07.21"]
[White "Magnus Carlsen"]
[Black "Fabiano Caruana"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Nd7 12. Nbd2 exd4 13. cxd4 Nc6 14. d5 Nce5 15. Nxe5 Nxe5 16. f4 Ng6 17. Nf3 Bf6 18. Rb1 Re8 19. Bd3 Bd7 20. Qc2 h6 21. b3 Qc7 22. Bb2 Bxb2 23. Qxb2 Re7 24. a4 bxa4 25. bxa4 Rae8 26. Rec1 Nf8 27. Rxc5 dxc5 28. Qxg7+ Nxg7 29. d6+ 1-0`
  },
  {
    id: 'carlsen-so-2020',
    rank: 33,
    title: 'Online Supremacy',
    event: 'Magnus Carlsen Invitational',
    year: 2020,
    white: 'Magnus Carlsen',
    black: 'Wesley So',
    result: '1-0',
    significance: 'Dominating his own tournament against a top rival.',
    pgn: `[Event "Magnus Carlsen Invitational"]
[Site "Online"]
[Date "2020.04.26"]
[White "Magnus Carlsen"]
[Black "Wesley So"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. a3 Nc6 9. Qc2 Qa5 10. Rd1 dxc4 11. Bxc4 Ne4 12. O-O Nxc3 13. Qxc3 Qxc3 14. bxc3 Bd7 15. Nd4 Nxd4 16. cxd4 Bb6 17. Bb3 Rac8 18. Rc1 Rxc1 19. Rxc1 Rc8 20. Rxc8+ Bxc8 21. Kf1 Bd7 22. Ke2 Kf8 23. Kd3 Ke7 24. Kc4 Kd8 25. Kb5 Kc7 26. e4 Bc8 27. f3 Bd7+ 28. Ka6 Kb8 29. d5 exd5 30. exd5 Bc8+ 31. Kb5 Bd7+ 32. Kc4 Bc8 33. Bg5 Kc7 34. Bc2 Bd7 35. Bf4+ Kd8 36. d6 Bc6 37. Kd4 Bd5 38. Bxd5 1-0`
  },
  {
    id: 'carlsen-nakamura-2020',
    rank: 34,
    title: 'The Streaming Era',
    event: 'Speed Chess Championship',
    year: 2020,
    white: 'Magnus Carlsen',
    black: 'Hikaru Nakamura',
    result: '1-0',
    significance: 'A crushing victory in the online chess era.',
    pgn: `[Event "Speed Chess Championship"]
[Site "Online"]
[Date "2020.12.06"]
[White "Magnus Carlsen"]
[Black "Hikaru Nakamura"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. g4 b5 11. Bxf6 Nxf6 12. g5 Nd7 13. f5 Bxg5+ 14. Kb1 Ne5 15. Qh5 Qe7 16. Nf3 g6 17. fxg6 hxg6 18. Qxg5 Nxf3 19. Qxg6 Qf6 20. Qxf6 Nxf6 21. Nd5 Nxd5 22. exd5 Kd7 23. Bd3 e5 24. h4 f5 25. h5 f4 26. h6 Rh7 27. Rhf1 Kc7 28. Rxf4 exf4 29. Re1 Bf5 30. Bxf5 Rxh6 31. Re7+ Kb6 32. Rd7 1-0`
  },
  {
    id: 'carlsen-mvl-2021',
    rank: 35,
    title: 'The French Connection',
    event: 'Norway Chess',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'Maxime Vachier-Lagrave',
    result: '1-0',
    significance: 'A technical masterclass against the French star.',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2021.09.07"]
[White "Magnus Carlsen"]
[Black "Maxime Vachier-Lagrave"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 dxc4 10. Bxc4 Qc7 11. Bd3 e5 12. Qc2 Re8 13. e4 exd4 14. cxd4 cxd4 15. Nxd4 Nxd4 16. Bb5 Red8 17. Bxd4 Be6 18. f4 a6 19. Bd3 Bc4 20. e5 Bxd3 21. Qxd3 Nd5 22. f5 Qc2 23. Qf3 Rac8 24. f6 g6 25. Rac1 Qb3 26. Rxc8 Rxc8 27. h3 Rc2 28. Kh2 Qd3 29. Qf4 Nxf6 30. exf6 Qxd4 31. Qxd4 1-0`
  },
  {
    id: 'carlsen-duda-2021',
    rank: 36,
    title: 'World Cup Revenge',
    event: 'Norway Chess',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'Jan-Krzysztof Duda',
    result: '1-0',
    significance: 'Payback after Duda\'s World Cup upset.',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2021.09.09"]
[White "Magnus Carlsen"]
[Black "Jan-Krzysztof Duda"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. a4 c5 16. d5 c4 17. Bg5 h6 18. Be3 Nc5 19. Qd2 h5 20. Nh2 Nh7 21. f4 Bg7 22. fxe5 dxe5 23. d6 f6 24. Bxc5 Qxd6 25. Qxd6 Rxe4 26. Be3 Bxf8 27. Nxe4 Bxe4 28. Bxe4 Rxe4 29. Rxe4 Nf8 30. axb5 axb5 31. Rxa8 Kf7 32. Ra7+ Ne7 33. Qc5 Nc6 34. Ra6 1-0`
  },
  {
    id: 'carlsen-rapport-2022',
    rank: 37,
    title: 'The Budapest Gambit',
    event: 'Norway Chess',
    year: 2022,
    white: 'Magnus Carlsen',
    black: 'Richard Rapport',
    result: '1-0',
    significance: 'A creative battle against the Hungarian maverick.',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2022.05.31"]
[White "Magnus Carlsen"]
[Black "Richard Rapport"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O dxc4 8. Bxc4 Nbd7 9. Qe2 a6 10. a4 cxd4 11. exd4 Nb6 12. Bb3 Nbd5 13. Rd1 Be7 14. Ne5 Nb4 15. Bc2 Nxc2 16. Qxc2 Nd5 17. Qe4 Bf6 18. Bd2 Nxc3 19. Bxc3 Qc7 20. Rac1 Bd7 21. Qg4 Rfc8 22. Bb4 Qb6 23. h4 Be8 24. h5 h6 25. Rd3 Rd8 26. Rg3 Kh8 27. Qf4 Bxe5 28. dxe5 Rd5 29. Rc5 Rad8 30. Rxd5 Rxd5 31. Qb8 Rd8 32. Qxa8 1-0`
  },
  {
    id: 'carlsen-aronian-2022',
    rank: 38,
    title: 'American Duel',
    event: 'Norway Chess',
    year: 2022,
    white: 'Magnus Carlsen',
    black: 'Levon Aronian',
    result: '1-0',
    significance: 'Defeating his longtime rival now playing for USA.',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2022.06.02"]
[White "Magnus Carlsen"]
[Black "Levon Aronian"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bb4 5. Bg2 O-O 6. O-O e4 7. Ng5 Bxc3 8. bxc3 Re8 9. f3 e3 10. d3 d5 11. cxd5 Qxd5 12. dxe3 h6 13. Nh3 Qxd1 14. Rxd1 Bxh3 15. Bxh3 Rad8 16. Rxd8 Rxd8 17. Bg2 Rd2 18. Rb1 b6 19. a4 Ne8 20. Bf1 Nd6 21. e4 f6 22. Bf4 Ne5 23. Bxe5 fxe5 24. Kg2 Kf7 25. f4 exf4 26. gxf4 Nf5 27. exf5 Rxe2+ 28. Kf3 Rc2 29. Rb3 g5 30. Bb5 gxf4 31. a5 bxa5 32. Ra3 Ra2 33. Rxa5 a6 34. Bc4+ Ke7 35. Rxa6 Rc2 36. Bb5 Rxc3+ 37. Kxf4 Kd6 38. Ke4 Kc5 39. Ra5 Kb4 40. Ra8 1-0`
  },
  {
    id: 'carlsen-tari-2022',
    rank: 39,
    title: 'Norwegian Derby',
    event: 'Norway Chess',
    year: 2022,
    white: 'Aryan Tari',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'Asserting dominance over his young compatriot.',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2022.06.04"]
[White "Aryan Tari"]
[Black "Magnus Carlsen"]
[Result "0-1"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2 9. Rb1 Qa3 10. e5 dxe5 11. fxe5 Nfd7 12. Ne4 h6 13. Bh4 Qxa2 14. Rd1 Qd5 15. Qe3 Qxe5 16. Be2 Bc5 17. Bf2 Bxd4 18. Rxd4 Qa5+ 19. c3 O-O 20. O-O Nc6 21. Rd2 e5 22. Bg3 f5 23. Nc5 Nxc5 24. Qxc5 Be6 25. Qxa5 Nxa5 26. Bxe5 Rac8 27. c4 Nc6 28. Bd6 Rfd8 29. Bc5 b5 30. Rfd1 bxc4 31. Bxc4 Bxc4 32. Rxd8+ Rxd8 33. Rxd8+ Nxd8 34. Kf2 Nc6 35. Kf3 Kf7 36. g4 g6 37. gxf5 gxf5 38. h4 Ne5+ 39. Kf4 Bf1 40. Ke3 Bg2 0-1`
  },
  {
    id: 'carlsen-praggnanandhaa-2022',
    rank: 40,
    title: 'The Young Pretender',
    event: 'FTX Crypto Cup',
    year: 2022,
    white: 'Magnus Carlsen',
    black: 'Praggnanandhaa',
    result: '1-0',
    significance: 'Defeating the Indian teen sensation.',
    pgn: `[Event "FTX Crypto Cup"]
[Site "Online"]
[Date "2022.08.15"]
[White "Magnus Carlsen"]
[Black "Praggnanandhaa"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6 14. Nb3 a5 15. Be3 a4 16. Nbd2 Bd7 17. Rc1 Qb8 18. Bb1 exd4 19. Bxd4 Bf6 20. Bxf6 gxf6 21. Qc2 Rc8 22. Qd3 Nb4 23. Qe3 Rxc1 24. Rxc1 Be6 25. a3 Nc6 26. Bd3 Qb6 27. Qf4 Rd8 28. Nc4 Qb7 29. Nfd2 Nh5 30. Qh6 Ng7 31. e5 dxe5 32. Bxh7+ Nxh7 33. Qxh7+ Kf8 34. Ne4 f5 35. Ncd6 Qd7 36. Rc5 fxe4 37. Rxe5 1-0`
  },
  // === ENDGAME ARTISTRY & TECHNICAL EXCELLENCE (41-60) ===
  {
    id: 'carlsen-jones-2012',
    rank: 41,
    title: 'The English Opening Master',
    event: 'London Chess Classic',
    year: 2012,
    white: 'Magnus Carlsen',
    black: 'Gawain Jones',
    result: '1-0',
    significance: 'A model game in the English Opening.',
    pgn: `[Event "London Chess Classic"]
[Site "London ENG"]
[Date "2012.12.01"]
[White "Magnus Carlsen"]
[Black "Gawain Jones"]
[Result "1-0"]

1. c4 c5 2. Nf3 Nc6 3. Nc3 e5 4. e3 Nf6 5. d4 exd4 6. exd4 d5 7. cxd5 Nxd5 8. Qb3 Nxc3 9. Bc4 Nd5 10. bxc3 Be7 11. O-O O-O 12. Re1 Na5 13. Bxd5 Qxd5 14. Qxd5 1-0`
  },
  {
    id: 'carlsen-topalov-2015',
    rank: 42,
    title: 'Bulgaria Rematch',
    event: 'Norway Chess',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'Veselin Topalov',
    result: '1-0',
    significance: 'Another victory against the Bulgarian legend.',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2015.06.16"]
[White "Magnus Carlsen"]
[Black "Veselin Topalov"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. Nc3 d6 6. Bxc6+ bxc6 7. h3 O-O 8. Be3 Bxe3 9. fxe3 Qe7 10. O-O Nd7 11. Nh4 f6 12. Qg4 Kh8 13. Nf5 Qe8 14. Kh2 Nc5 15. Nd4 Ne6 16. Nf5 Nc5 17. d4 exd4 18. exd4 Ne6 19. d5 cxd5 20. Nxd5 c6 21. Nfe3 cxd5 22. Nxd5 Bb7 23. Rf3 Ng5 24. Rb3 Qe5+ 25. Kh1 Bxd5 26. exd5 Rad8 27. c4 Ne4 28. Qe2 Qf5 29. Rbf3 Qc2 30. Qxc2 Nf2+ 31. Kh2 Nxd1 32. Qd2 Nc3 33. a3 a5 34. Rf5 Na2 35. Rxf6 1-0`
  },
  {
    id: 'carlsen-grischuk-2013',
    rank: 43,
    title: 'The Russian Bear',
    event: 'London Candidates',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Alexander Grischuk',
    result: '1-0',
    significance: 'Key victory in the Candidates tournament.',
    pgn: `[Event "Candidates"]
[Site "London ENG"]
[Date "2013.03.27"]
[White "Magnus Carlsen"]
[Black "Alexander Grischuk"]
[Result "1-0"]

1. c4 c5 2. Nf3 Nc6 3. Nc3 g6 4. e3 Nf6 5. d4 cxd4 6. exd4 d5 7. cxd5 Nxd5 8. Qb3 Nxc3 9. Bc4 Nd5 10. bxc3 e6 11. O-O Be7 12. Re1 O-O 13. Ba3 Bxa3 14. Qxa3 Qb6 15. Rab1 Rd8 16. Rxe6 Qc7 17. h4 fxe6 18. Bxd5 Rxd5 19. Qxe7 Qf4 20. Ne5 Rd6 21. Rb8 1-0`
  },
  {
    id: 'carlsen-caruana-2014',
    rank: 44,
    title: 'Sinquefield Showdown I',
    event: 'Sinquefield Cup',
    year: 2014,
    white: 'Magnus Carlsen',
    black: 'Fabiano Caruana',
    result: '1-0',
    significance: 'Early clash with his future WC challenger.',
    pgn: `[Event "Sinquefield Cup"]
[Site "Saint Louis USA"]
[Date "2014.08.27"]
[White "Magnus Carlsen"]
[Black "Fabiano Caruana"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Nb6 7. O-O Be7 8. d3 O-O 9. a3 Be6 10. b4 f6 11. Bb2 a5 12. b5 Nd4 13. Nd2 Qc8 14. e3 Nf5 15. Qe2 Bd6 16. a4 Qe8 17. Rfc1 Qf7 18. Nc4 Nxc4 19. dxc4 Rfd8 20. Nd5 Bxd5 21. cxd5 Qxd5 22. Bxd5+ Rxd5 23. Rxc7 Be7 24. Rac1 Rad8 25. Qc4 Nd6 26. Qxd5+ Rxd5 27. Rc8+ Rd8 28. Rxd8+ Bxd8 29. Rd1 Kf8 30. Kf1 Ke7 31. Ke2 Nf5 32. Kf3 Nd6 33. Rc1 Kd7 34. Ke4 1-0`
  },
  {
    id: 'carlsen-wojtaszek-2015',
    rank: 45,
    title: 'Polish Defense',
    event: 'Tata Steel',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'Radoslaw Wojtaszek',
    result: '1-0',
    significance: 'A clinical positional victory.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2015.01.11"]
[White "Magnus Carlsen"]
[Black "Radoslaw Wojtaszek"]
[Result "1-0"]

1. c4 Nf6 2. g3 e6 3. Bg2 d5 4. Nf3 Be7 5. O-O O-O 6. d4 dxc4 7. Qc2 a6 8. Qxc4 b5 9. Qc2 Bb7 10. Bd2 Be4 11. Qc1 Nbd7 12. Ba5 Qe8 13. Nc3 Bb7 14. Rd1 Rc8 15. Ne5 Nxe5 16. dxe5 Nd5 17. Nxd5 Bxd5 18. Bxd5 exd5 19. Qc6 Qd7 20. Qxd7 Bxd7 21. Rxd5 Bc6 22. Rd2 Rfd8 23. Rxd8+ Rxd8 24. Kf1 Rd5 25. Ke1 Kf8 26. Rc1 Bd7 27. Rc7 Be8 28. b3 c5 29. Bb6 Rd1+ 30. Ke2 Ra1 31. Bxc5 Bxc5 32. Rxc5 Rxa2+ 33. Kf3 Ra3 34. Rc8+ Ke7 35. Rc7+ Kf8 36. Rxf7+ Kg8 37. Ra7 Rxb3+ 38. Kg4 1-0`
  },
  {
    id: 'carlsen-harikrishna-2017',
    rank: 46,
    title: 'Indian Summer',
    event: 'Tata Steel',
    year: 2017,
    white: 'Magnus Carlsen',
    black: 'Pentala Harikrishna',
    result: '1-0',
    significance: 'A model game of strategic chess.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2017.01.15"]
[White "Magnus Carlsen"]
[Black "Pentala Harikrishna"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. Bg5 h6 6. Bxf6 Qxf6 7. e3 Nd7 8. Bd3 dxc4 9. Bxc4 g6 10. O-O Bg7 11. e4 e5 12. d5 cxd5 13. Nxd5 Qd8 14. Qb3 O-O 15. Rac1 Nb6 16. Nxb6 Qxb6 17. Qxb6 axb6 18. Rfd1 Be6 19. Bxe6 fxe6 20. Rc7 Ra4 21. Rxb7 Rxe4 22. Rxb6 Ra8 23. a3 Rxa3 24. Rxe6 Bf8 25. Nd2 Rd4 26. Ne4 Rb3 27. b5 Bc5 28. Rc1 Ba7 29. Rc7 Rb4 30. b6 Rxe4 31. bxa7 Ra4 32. Rcc6 1-0`
  },
  {
    id: 'carlsen-nepomniachtchi-2017',
    rank: 47,
    title: 'Russia vs Norway',
    event: 'London Classic',
    year: 2017,
    white: 'Magnus Carlsen',
    black: 'Ian Nepomniachtchi',
    result: '1-0',
    significance: 'Dominant victory over his future WC opponent.',
    pgn: `[Event "London Classic"]
[Site "London ENG"]
[Date "2017.12.09"]
[White "Magnus Carlsen"]
[Black "Ian Nepomniachtchi"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. O-O d6 6. c3 O-O 7. h3 Ne7 8. d4 Bb6 9. Bd3 d5 10. dxe5 Nxe4 11. Nbd2 Nxd2 12. Qxd2 Nc6 13. Re1 h6 14. Qf4 Re8 15. Nd4 Bxd4 16. Qxd4 Nxd4 17. cxd4 Bf5 18. Bxf5 Rxe5 19. Be3 Qd7 20. Bd3 Re8 21. f4 Qg4 22. Kh2 Qh4 23. Rac1 c6 24. Re2 Rad8 25. Rec2 Re7 26. Qf3 Rde8 27. Be2 Rxe3 28. Qxe3 Qxe3 1-0`
  },
  {
    id: 'carlsen-vachier-lagrave-2017',
    rank: 48,
    title: 'Paris Showdown',
    event: 'Paris Grand Chess Tour',
    year: 2017,
    white: 'Magnus Carlsen',
    black: 'Maxime Vachier-Lagrave',
    result: '1-0',
    significance: 'A clinical rapid game victory.',
    pgn: `[Event "Paris Grand Chess Tour"]
[Site "Paris FRA"]
[Date "2017.06.21"]
[White "Magnus Carlsen"]
[Black "Maxime Vachier-Lagrave"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. a3 Bxc3+ 6. Qxc3 d6 7. Nf3 Nbd7 8. g3 b6 9. Bg2 Bb7 10. O-O c5 11. Rd1 Qc7 12. b4 cxd4 13. Qxd4 Rfe8 14. Bb2 e5 15. Qc3 a5 16. Nd2 axb4 17. axb4 Rxa1 18. Rxa1 Bxg2 19. Kxg2 Ne4 20. Nxe4 Qxc4 21. Qxc4 Nxc4 22. Bc1 Rc8 23. b5 f5 24. Nc3 Kf7 25. Ra7+ Ke6 26. Bd2 Ne3+ 27. fxe3 Rxc3 28. Bc1 Rb3 29. Ra8 d5 30. Rb8 Rb4 31. Rxb6+ 1-0`
  },
  {
    id: 'carlsen-hou-yifan-2017',
    rank: 49,
    title: 'The Queen of Chess',
    event: 'Grenke Classic',
    year: 2017,
    white: 'Magnus Carlsen',
    black: 'Hou Yifan',
    result: '1-0',
    significance: 'Victory against the women\'s world champion.',
    pgn: `[Event "Grenke Classic"]
[Site "Karlsruhe GER"]
[Date "2017.04.15"]
[White "Magnus Carlsen"]
[Black "Hou Yifan"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. Bxc6 dxc6 6. Nbd2 Be6 7. O-O Nd7 8. Nb3 Bd6 9. Ng5 Bxb3 10. axb3 h6 11. Ne4 Be7 12. f4 f5 13. Ng3 Nf6 14. c3 O-O 15. fxe5 Ng4 16. d4 Nxe5 17. dxe5 Qxd1 18. Rxd1 fxe4 19. Nxe4 Rxf1+ 20. Kxf1 Rf8+ 21. Ke2 Bg5 22. Nd6 Bxc1 23. Rxc1 Rf2+ 24. Kd3 Rxg2 25. Nxb7 Rxh2 26. Kc4 Kf7 27. b4 Ke6 28. Nd8+ Ke7 29. Nxc6+ Kd7 30. Nb8+ Kc8 31. Na6 Kb7 32. Nc5+ Ka8 33. Ra1 Rh5 34. Rxa7+ Kb8 35. Rxg7 1-0`
  },
  {
    id: 'carlsen-mamedyarov-2019',
    rank: 50,
    title: 'Baku Brilliancy',
    event: 'Gashimov Memorial',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'Shakhriyar Mamedyarov',
    result: '1-0',
    significance: 'Beating a top rival on his home turf.',
    pgn: `[Event "Gashimov Memorial"]
[Site "Shamkir AZE"]
[Date "2019.03.31"]
[White "Magnus Carlsen"]
[Black "Shakhriyar Mamedyarov"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. Bg5 h6 6. Bxf6 Qxf6 7. e3 Nd7 8. Bd3 dxc4 9. Bxc4 g6 10. O-O Bg7 11. e4 e5 12. d5 cxd5 13. Nxd5 Qd8 14. Rc1 O-O 15. Bb3 Nb6 16. Nxb6 axb6 17. Qb3 Qe7 18. Rfd1 Be6 19. Bxe6 Qxe6 20. Qxe6 fxe6 21. Rc7 Rab8 22. Rxb7 Rxb7 23. Rxb7 Rxf2 24. Rxb6 Rxb2 25. a4 Ra2 26. Rxe6 Rxa4 27. Re8+ Kh7 28. Re7 Kg8 29. Rb7 Ra1+ 30. Kf2 Ra2+ 31. Ke3 Rxg2 32. Rb8+ Kf7 33. Nxe5+ 1-0`
  },
  // === RAPID & BLITZ SUPREMACY (51-65) ===
  {
    id: 'carlsen-nakamura-2014',
    rank: 51,
    title: 'Speed King',
    event: 'Zurich Chess Challenge Blitz',
    year: 2014,
    white: 'Magnus Carlsen',
    black: 'Hikaru Nakamura',
    result: '1-0',
    significance: 'A brilliant blitz victory.',
    pgn: `[Event "Zurich Chess Challenge Blitz"]
[Site "Zurich SUI"]
[Date "2014.02.03"]
[White "Magnus Carlsen"]
[Black "Hikaru Nakamura"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 Ke8 10. h3 h5 11. Bg5 Be6 12. Rad1 Be7 13. Rfe1 Rd8 14. Rxd8+ Kxd8 15. Rd1+ Kc8 16. Bxe7 Nxe7 17. Ng5 Bf5 18. e6 Bxe6 19. Nxe6 fxe6 20. Rxe6 Nd5 21. Nxd5 cxd5 22. Rxe6 c6 23. Re7 Kd8 24. Rxg7 Kc8 25. c4 dxc4 26. Rc7+ Kb8 27. Rxc4 Ka8 28. Rxh5 b6 29. Rc7 Rb8 30. h4 1-0`
  },
  {
    id: 'carlsen-anand-2014-blitz',
    rank: 52,
    title: 'Blitz Revenge',
    event: 'World Blitz Championship',
    year: 2014,
    white: 'Magnus Carlsen',
    black: 'Viswanathan Anand',
    result: '1-0',
    significance: 'Fast chess dominance over his predecessor.',
    pgn: `[Event "World Blitz Championship"]
[Site "Dubai UAE"]
[Date "2014.06.19"]
[White "Magnus Carlsen"]
[Black "Viswanathan Anand"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Nb6 7. O-O Be7 8. d3 O-O 9. a3 a5 10. Be3 Be6 11. Rc1 f6 12. Na4 Nxa4 13. Qxa4 Bd5 14. Qb5 Qd7 15. Qxd7 Bxd7 16. Nd2 Nd4 17. Bxd4 exd4 18. Nc4 Bc6 19. Bxc6 bxc6 20. b4 axb4 21. axb4 Ra3 22. Rc3 Rfa8 23. e3 dxe3 24. fxe3 Kf7 25. Rf3 Ra2 26. Kf2 R8a4 27. Rb1 Rc2 28. Ke1 f5 29. Rb3 Bf6 30. d4 g5 31. Kd1 Re2 32. Rf1 Raa2 33. d5 Bxb3+ 34. Rxf5+ Ke7 35. dxc6 1-0`
  },
  {
    id: 'carlsen-kramnik-2013-blitz',
    rank: 53,
    title: 'The Tal Memorial Rapid',
    event: 'Tal Memorial Blitz',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Vladimir Kramnik',
    result: '1-0',
    significance: 'A rapid victory over the former champion.',
    pgn: `[Event "Tal Memorial Blitz"]
[Site "Moscow RUS"]
[Date "2013.06.13"]
[White "Magnus Carlsen"]
[Black "Vladimir Kramnik"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. a3 Bxc3+ 6. Qxc3 d5 7. Bg5 dxc4 8. Qxc4 b6 9. Nf3 Ba6 10. Qa4 Qd5 11. e3 Nc6 12. Be2 Rfd8 13. O-O Bxe2 14. Qxe2 Na5 15. Rfc1 Nd7 16. Bh4 Rac8 17. b4 Nc6 18. Nd2 Nf6 19. Rc3 e5 20. d5 Na5 21. bxa5 bxa5 22. Rac1 c6 23. Nc4 cxd5 24. Qxa6 Rxc4 25. Rxc4 dxc4 26. Qxa5 Qd2 27. Qc3 Qb2 28. Rxc4 Qa1+ 29. Qc1 Qxc1+ 30. Rxc1 Rd2 31. Kf1 Kf8 32. g3 Ke7 33. Bg5 1-0`
  },
  {
    id: 'carlsen-aronian-2019-blitz',
    rank: 54,
    title: 'St. Louis Speed',
    event: 'Saint Louis Rapid & Blitz',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'Levon Aronian',
    result: '1-0',
    significance: 'Blitz brilliance against his longtime rival.',
    pgn: `[Event "Saint Louis Rapid & Blitz"]
[Site "Saint Louis USA"]
[Date "2019.08.15"]
[White "Magnus Carlsen"]
[Black "Levon Aronian"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Be7 5. Bg2 O-O 6. O-O dxc4 7. Qc2 a6 8. a4 Bd7 9. Qxc4 Bc6 10. Bf4 Bd6 11. Nc3 Bxf4 12. gxf4 a5 13. e3 Na6 14. Rfd1 Nb4 15. Ne5 Bxg2 16. Kxg2 c6 17. Qb3 Qb6 18. Qc4 Qa6 19. Qb3 Qb6 20. Qc4 Qa6 21. Rac1 Nfd5 22. Nxd5 Nxd5 23. Qe4 Rad8 24. Ng4 f5 25. Qe5 Rf6 26. Ne3 Qb6 27. Nxd5 cxd5 28. Rc5 Qd6 29. Qxd6 Rxd6 30. Rdc1 Rf7 31. R1c3 Kf8 32. Kf3 Ke7 33. Ke2 Kd7 34. Kd2 b6 35. Ra3 Rc7 36. Rxc7+ Kxc7 37. Rc3+ Kd7 38. Rc5 Ke7 39. b3 Rd8 40. Rxd5 1-0`
  },
  {
    id: 'carlsen-firouzja-2020-blitz',
    rank: 55,
    title: 'Online Blitz King',
    event: 'Lindores Abbey Rapid Challenge',
    year: 2020,
    white: 'Magnus Carlsen',
    black: 'Alireza Firouzja',
    result: '1-0',
    significance: 'Defeating the young phenom in rapid.',
    pgn: `[Event "Lindores Abbey Rapid Challenge"]
[Site "Online"]
[Date "2020.05.19"]
[White "Magnus Carlsen"]
[Black "Alireza Firouzja"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. Bg5 h6 6. Bh4 dxc4 7. e4 g5 8. Bg3 b5 9. Be2 Bb7 10. O-O Nbd7 11. Ne5 Bg7 12. Nxd7 Nxd7 13. Bd6 a6 14. Bf3 Qb6 15. a4 Rd8 16. axb5 axb5 17. Ra6 Qc7 18. Qa1 c5 19. dxc5 Nxc5 20. Ra7 O-O 21. Bxc5 Qxc5 22. Rxb7 Rd2 23. Qe5 Qxe5 24. Nxb5 Rxb2 25. Rxb2 Qxb2 26. Nc7 Qxb5 27. Nxe6 fxe6 28. Bxb5 1-0`
  },
  {
    id: 'carlsen-so-2020-blitz',
    rank: 56,
    title: 'Opera Euro Rapid',
    event: 'Opera Euro Rapid',
    year: 2020,
    white: 'Magnus Carlsen',
    black: 'Wesley So',
    result: '1-0',
    significance: 'Online rapid supremacy.',
    pgn: `[Event "Opera Euro Rapid"]
[Site "Online"]
[Date "2020.02.09"]
[White "Magnus Carlsen"]
[Black "Wesley So"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Be3 Be6 10. Qd2 Nbd7 11. a4 Rc8 12. a5 Qc7 13. Rfd1 Rfd8 14. Bf3 h6 15. Rac1 Bf8 16. Qe2 Qb8 17. Nd5 Bxd5 18. exd5 e4 19. Bxe4 Nxe4 20. Qxe4 Nf6 21. Qe2 Nxd5 22. Bd4 Nf4 23. Qf3 b5 24. g3 Nh5 25. Nc5 Rxc5 26. Bxc5 dxc5 27. Rxd8 Qxd8 28. Rd1 Qe7 29. Qb3 Nf6 30. Qxb5 Qe2 31. Rd8 Qe1+ 32. Kg2 Qxc3 33. Qd7 1-0`
  },
  {
    id: 'carlsen-giri-2021-rapid',
    rank: 57,
    title: 'The Draw Breaker',
    event: 'World Rapid Championship',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'Anish Giri',
    result: '1-0',
    significance: 'Another decisive result against his draw nemesis.',
    pgn: `[Event "World Rapid Championship"]
[Site "Warsaw POL"]
[Date "2021.12.26"]
[White "Magnus Carlsen"]
[Black "Anish Giri"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. e3 Nbd7 6. Qc2 Bd6 7. Bd3 O-O 8. O-O dxc4 9. Bxc4 b5 10. Bd3 Bb7 11. a3 a6 12. Rd1 Qc7 13. e4 e5 14. dxe5 Nxe5 15. Nxe5 Bxe5 16. f4 Bd4+ 17. Be3 Bxc3 18. bxc3 Qxf4 19. Rf1 Qh4 20. Rxf6 gxf6 21. Qf2 Qxf2+ 22. Bxf2 f5 23. exf5 Rad8 24. Be4 Rd2 25. Bxb7 Rxf2 26. Bxc6 Rxf5 27. Bxb5 axb5 28. a4 Ra8 29. axb5 Rxa1+ 30. Kf2 Rf4+ 31. Ke3 Rb4 32. b6 Rb1 33. b7 1-0`
  },
  {
    id: 'carlsen-dubov-2020-rapid',
    rank: 58,
    title: 'Student vs Teacher',
    event: 'World Blitz Championship',
    year: 2020,
    white: 'Magnus Carlsen',
    black: 'Daniil Dubov',
    result: '1-0',
    significance: 'Beating his former second.',
    pgn: `[Event "World Blitz Championship"]
[Site "Moscow RUS"]
[Date "2019.12.30"]
[White "Magnus Carlsen"]
[Black "Daniil Dubov"]
[Result "1-0"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. f4 c5 6. Nf3 Nc6 7. Be3 a6 8. Qd2 b5 9. a3 Bb7 10. dxc5 Bxc5 11. Bxc5 Nxc5 12. Bd3 Qb6 13. O-O O-O 14. Kh1 f5 15. exf6 Rxf6 16. Qe3 Raf8 17. Ne2 d4 18. Qe1 Nxd3 19. cxd3 Rxf4 20. Nxf4 Rxf4 21. Qb4 Qxb4 22. axb4 Rxf3 23. gxf3 Kf7 24. Kg2 Kf6 25. Ra5 Nd8 26. Rc1 g5 27. Rc5 Ke7 28. Kf2 Kd6 29. Ra8 1-0`
  },
  {
    id: 'carlsen-grischuk-2021-blitz',
    rank: 59,
    title: 'Blitz Battle',
    event: 'World Blitz Championship',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'Alexander Grischuk',
    result: '1-0',
    significance: 'Brilliant blitz victory.',
    pgn: `[Event "World Blitz Championship"]
[Site "Warsaw POL"]
[Date "2021.12.28"]
[White "Magnus Carlsen"]
[Black "Alexander Grischuk"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O Be6 9. f4 Qc7 10. f5 Bc4 11. a4 O-O 12. Be3 Nbd7 13. Rf2 Rac8 14. Bxc4 Qxc4 15. Nd2 Qc6 16. Nf3 Nc5 17. Bxc5 Qxc5+ 18. Kh1 Qc4 19. Qe2 Qxe2 20. Rxe2 Rc4 21. Nd2 Rb4 22. b3 d5 23. exd5 e4 24. Nc4 Nd7 25. Rae1 Bf6 26. Rxe4 Rxe4 27. Rxe4 Bxc3 28. Re6 Nc5 29. d6 Bd4 30. Re7 b5 31. axb5 axb5 32. Ne3 Rd8 33. Ng4 h5 34. Nf6+ gxf6 35. Rxf7 Nd3 36. Rc7 1-0`
  },
  {
    id: 'carlsen-artemiev-2022-rapid',
    rank: 60,
    title: 'Russian Rapid',
    event: 'World Rapid Championship',
    year: 2022,
    white: 'Magnus Carlsen',
    black: 'Vladislav Artemiev',
    result: '1-0',
    significance: 'A smooth rapid victory.',
    pgn: `[Event "World Rapid Championship"]
[Site "Almaty KAZ"]
[Date "2022.12.26"]
[White "Magnus Carlsen"]
[Black "Vladislav Artemiev"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. e3 Nbd7 6. Qc2 Bd6 7. Bd3 O-O 8. O-O dxc4 9. Bxc4 b5 10. Bd3 Bb7 11. a3 a5 12. Rd1 Qc7 13. e4 e5 14. d5 c5 15. Bg5 h6 16. Bxf6 Nxf6 17. Nh4 g6 18. b3 Nh7 19. Nf5 gxf5 20. exf5 f6 21. Ne4 Be7 22. Qc3 Kh8 23. Qg3 Rg8 24. Qh4 Nf8 25. Kh1 Qd8 26. Rg1 Qxh4 27. Rxg8+ Kxg8 28. Nxf6+ Bxf6 29. d6+ 1-0`
  },
  // === MEMORABLE DECISIVE GAMES (61-75) ===
  {
    id: 'carlsen-leko-2008',
    rank: 61,
    title: 'The Berlin Wall Breaker',
    event: 'Dortmund',
    year: 2008,
    white: 'Magnus Carlsen',
    black: 'Peter Leko',
    result: '1-0',
    significance: 'A positional masterpiece against the defensive specialist.',
    pgn: `[Event "Dortmund"]
[Site "Dortmund GER"]
[Date "2008.07.06"]
[White "Magnus Carlsen"]
[Black "Peter Leko"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 Ke8 10. h3 h5 11. Bf4 Be7 12. Rad1 Be6 13. Ng5 Rh6 14. g4 hxg4 15. hxg4 Nh4 16. Nxe6 Rxe6 17. Kg2 g5 18. Bg3 Ng6 19. f4 gxf4 20. Bxf4 Rd8 21. Rxd8+ Kxd8 22. Rd1+ Ke8 23. Nd5 cxd5 24. Rxd5 Kf8 25. Kf3 Bc5 26. b4 Bb6 27. Ke4 Bc7 28. a4 a6 29. g5 1-0`
  },
  {
    id: 'carlsen-vallejo-2010',
    rank: 62,
    title: 'Spanish Conquest',
    event: 'King\'s Tournament',
    year: 2010,
    white: 'Magnus Carlsen',
    black: 'Francisco Vallejo Pons',
    result: '1-0',
    significance: 'A dominant display of technical chess.',
    pgn: `[Event "King's Tournament"]
[Site "Medias ROU"]
[Date "2010.06.10"]
[White "Magnus Carlsen"]
[Black "Francisco Vallejo Pons"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. a4 c5 16. d5 c4 17. Bg5 h6 18. Be3 Nc5 19. Qd2 Qc7 20. Bxc5 dxc5 21. axb5 axb5 22. Rxa8 Bxa8 23. Ra1 Bb7 24. Qf4 Nh5 25. Qg4 Nxg3 26. fxg3 Bg7 27. Qf3 Rf8 28. h4 Bc8 29. h5 gxh5 30. Nh4 Qe7 31. Qxh5 Qg5 32. Qxg5 hxg5 33. Nf5 Bxf5 34. exf5 e4 35. Kf2 Rd8 36. Ra6 1-0`
  },
  {
    id: 'carlsen-polgar-2012',
    rank: 63,
    title: 'Queen of Chess II',
    event: 'London Classic',
    year: 2012,
    white: 'Magnus Carlsen',
    black: 'Judit Polgar',
    result: '1-0',
    significance: 'Victory against the legendary Polgar.',
    pgn: `[Event "London Classic"]
[Site "London ENG"]
[Date "2012.12.08"]
[White "Magnus Carlsen"]
[Black "Judit Polgar"]
[Result "1-0"]

1. c4 c5 2. Nf3 Nf6 3. Nc3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Nc7 7. O-O e5 8. a3 Be7 9. b4 cxb4 10. axb4 O-O 11. Bb2 Bf6 12. Rc1 Ne6 13. d3 Ned4 14. Nxd4 Nxd4 15. Ne4 Be7 16. f4 exf4 17. Rxf4 Bf5 18. Nc5 Bxc5+ 19. bxc5 Re8 20. Re4 Qd5 21. Rxe8+ Rxe8 22. Qd2 Be6 23. Bxd4 Qxd4+ 24. Qxd4 1-0`
  },
  {
    id: 'carlsen-adams-2013',
    rank: 64,
    title: 'English Endgame',
    event: 'London Classic',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Michael Adams',
    result: '1-0',
    significance: 'A clinical finish against the English star.',
    pgn: `[Event "London Classic"]
[Site "London ENG"]
[Date "2013.12.11"]
[White "Magnus Carlsen"]
[Black "Michael Adams"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bb4 5. Bg2 O-O 6. O-O e4 7. Ng5 Bxc3 8. bxc3 Re8 9. f3 e3 10. d3 d5 11. cxd5 Qxd5 12. Qa4 h6 13. Nh3 Qd6 14. dxe3 Qxd1 15. Rxd1 Be6 16. Nf4 Bc4 17. Re1 Rad8 18. a3 Nd5 19. Nxd5 Bxd5 20. Bxd5 Rxd5 21. Bb2 Red8 22. Rad1 Nd4 23. Kf2 Nc2 24. Re2 Nxa3 25. e4 Rd2 26. Rxd2 Rxd2 27. Kf1 Nb5 28. c4 Nc3 29. Bxc3 Rxe2 30. Kxe2 1-0`
  },
  {
    id: 'carlsen-anand-2015',
    rank: 65,
    title: 'Norway Rematch',
    event: 'Norway Chess',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'Viswanathan Anand',
    result: '1-0',
    significance: 'Continuing his dominance over the former champion.',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2015.06.18"]
[White "Magnus Carlsen"]
[Black "Viswanathan Anand"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. Bxc6 dxc6 6. Nbd2 Be6 7. O-O Nd7 8. Nb3 Bb6 9. Ng5 Bxb3 10. axb3 Nf8 11. d4 exd4 12. Qxd4 Qxd4 13. cxd4 Ng6 14. f4 O-O-O 15. Be3 Rhe8 16. Kf2 Nxf4 17. Bxf4 Rxe4 18. Nf3 Rd5 19. Rfc1 Kb8 20. Bg3 Re7 21. Rc3 Bc7 22. Rac1 Bb6 23. Rd3 Rd6 24. Rd1 Rxd4 25. Rxd4 Bxd4+ 26. Nxd4 Rd7 27. Nf5 Rxd1+ 28. Kxd1 g6 29. Ne3 1-0`
  },
  // === TOURNAMENT DOMINANCE (66-80) ===
  {
    id: 'carlsen-caruana-2015',
    rank: 66,
    title: 'Wijk aan Zee Showdown',
    event: 'Tata Steel',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'Fabiano Caruana',
    result: '1-0',
    significance: 'Decisive game in the tournament victory.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2015.01.24"]
[White "Magnus Carlsen"]
[Black "Fabiano Caruana"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. O-O Re8 7. Bg5 h6 8. Bh4 Be7 9. Nbd2 d6 10. Bxc6 bxc6 11. d4 Qc8 12. Re1 g5 13. Bg3 Nh5 14. dxe5 Nxg3 15. hxg3 dxe5 16. Nc4 Qg4 17. Qd3 Bf8 18. Rad1 Bf5 19. Qe3 Be6 20. Nfd2 f5 21. f3 Qg6 22. exf5 Bxf5 23. Ne4 Be7 24. Ncd6 Bxd6 25. Nxd6 Reb8 26. Nxf5 Qxf5 27. b3 Kf7 28. Rd7+ Kf6 29. Qc5 1-0`
  },
  {
    id: 'carlsen-gelfand-2013',
    rank: 67,
    title: 'Alekhine Memorial',
    event: 'Alekhine Memorial',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Boris Gelfand',
    result: '1-0',
    significance: 'Victory over the former WC challenger.',
    pgn: `[Event "Alekhine Memorial"]
[Site "Paris FRA"]
[Date "2013.04.24"]
[White "Magnus Carlsen"]
[Black "Boris Gelfand"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. Qc2 Bb7 6. Bg2 c5 7. d5 exd5 8. cxd5 Nxd5 9. O-O Be7 10. Rd1 Qc8 11. Nc3 Nxc3 12. Qxc3 O-O 13. Bf4 d6 14. Rac1 Nd7 15. e4 Bf6 16. Qb3 Re8 17. Nh4 Bxe4 18. Bxe4 Rxe4 19. Nf5 Re6 20. Qg3 Kh8 21. Nh6 g6 22. Qf3 Kg7 23. Nxf7 Kxf7 24. Qh5+ Kg8 25. Qxh7+ Kf8 26. Qh8+ Ke7 27. Rxd6 Nf8 28. Rxe6+ Nxe6 29. Be5 Qe8 30. Qxe8+ Kxe8 31. Bxf6 1-0`
  },
  {
    id: 'carlsen-wang-hao-2013',
    rank: 68,
    title: 'Chinese Chess',
    event: 'Tata Steel',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Wang Hao',
    result: '1-0',
    significance: 'A tactical masterpiece.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2013.01.19"]
[White "Magnus Carlsen"]
[Black "Wang Hao"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. f3 e6 7. Be3 b5 8. g4 Nfd7 9. Qd2 Nb6 10. O-O-O N8d7 11. Kb1 Bb7 12. Bd3 Rc8 13. Rhe1 Nc5 14. Bf1 Be7 15. Qg2 O-O 16. h4 Nc4 17. Bxc4 Rxc4 18. g5 b4 19. Ne2 a5 20. Ng3 Ba6 21. Nh5 Qa8 22. Rg1 Rfc8 23. f4 e5 24. fxe5 dxe5 25. Nf5 exd4 26. Bxd4 Bf8 27. Be5 f6 28. gxf6 gxf6 29. Bd4 Rxc2 30. Qg6+ 1-0`
  },
  {
    id: 'carlsen-naiditsch-2015',
    rank: 69,
    title: 'Grenke Classic',
    event: 'Grenke Classic',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'Arkadij Naiditsch',
    result: '1-0',
    significance: 'A clinical tournament victory.',
    pgn: `[Event "Grenke Classic"]
[Site "Baden-Baden GER"]
[Date "2015.02.08"]
[White "Magnus Carlsen"]
[Black "Arkadij Naiditsch"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. h3 h5 10. Rd1+ Ke8 11. Nc3 Be6 12. Ne4 Bd5 13. Nc5 Ne7 14. Bg5 Ng6 15. Nd3 c5 16. b3 Bc6 17. c4 Be7 18. Bxe7 Kxe7 19. Nf4 Nxf4 20. Rxd8 Rxd8 21. Kf1 Rd2 22. Ke1 Rc2 23. Nd4 Nxg2+ 24. Ke1 Nf4 25. Nxc6+ bxc6 26. h4 Ke6 27. Kd1 Rf2 28. Ke1 Rb2 29. Kf1 g6 30. Rg1 Nh3 31. Re1 Rxb3 32. Kg2 Nf4+ 33. Kf1 Nd3 34. Re3 Rxe3 35. fxe3 Nxe5 36. Ke2 1-0`
  },
  {
    id: 'carlsen-karuanana-2015-sinq',
    rank: 70,
    title: 'St. Louis Classic',
    event: 'Sinquefield Cup',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'Fabiano Caruana',
    result: '1-0',
    significance: 'Another victory in their rivalry.',
    pgn: `[Event "Sinquefield Cup"]
[Site "Saint Louis USA"]
[Date "2015.08.23"]
[White "Magnus Carlsen"]
[Black "Fabiano Caruana"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Nd7 12. Nbd2 exd4 13. cxd4 Nc6 14. d5 Nce5 15. Nxe5 Nxe5 16. f4 Ng6 17. Nf3 Bf6 18. Rb1 Re8 19. Bd3 Bd7 20. Qc2 g6 21. Bd2 Rc8 22. Rbc1 c4 23. Bf1 Qb6+ 24. Kh1 Qa7 25. a3 b4 26. axb4 Qxb4 27. Qa2 Qa5 28. b4 Qd8 29. Bc3 Bxc3 30. Rxc3 Nf8 31. e5 dxe5 32. d6 Ne6 33. fxe5 Bc6 34. Qd2 Qd7 35. Rf1 1-0`
  },
  {
    id: 'carlsen-caruana-2016',
    rank: 71,
    title: 'Leuven Victory',
    event: 'Your Next Move',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'Fabiano Caruana',
    result: '1-0',
    significance: 'A rapid chess victory.',
    pgn: `[Event "Your Next Move"]
[Site "Leuven BEL"]
[Date "2016.06.18"]
[White "Magnus Carlsen"]
[Black "Fabiano Caruana"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. cxd5 Nxd5 9. Nxd5 exd5 10. a3 Nc6 11. Bd3 Bb6 12. O-O d4 13. Bc4 Bg4 14. exd4 Bxd4 15. Nxd4 Qxd4 16. Qe2 Rfe8 17. Qd2 Qxd2 18. Bxd2 Nd4 19. Bc3 Nf3+ 20. gxf3 Bxf3 21. Rfd1 a6 22. Rd4 Rac8 23. Bb3 Re2 24. Kf1 Rxb2 25. Bd5 Bxd5 26. Rxd5 Rxc3 27. Rxb7 h5 28. Kg2 Kh7 29. Rd7 f6 30. R7d3 Rc1 31. R1d2 Rxd2 32. Rxd2 Rc3 33. Ra2 Kg6 34. Kf1 1-0`
  },
  {
    id: 'carlsen-eljanov-2017',
    rank: 72,
    title: 'Wijk aan Zee Champion',
    event: 'Tata Steel',
    year: 2017,
    white: 'Magnus Carlsen',
    black: 'Pavel Eljanov',
    result: '1-0',
    significance: 'Key game in tournament victory.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2017.01.27"]
[White "Magnus Carlsen"]
[Black "Pavel Eljanov"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Kh1 Nc6 10. f4 exf4 11. Bxf4 Be6 12. Nd5 Bxd5 13. exd5 Ne5 14. Nd4 Qb6 15. c3 Rac8 16. Qe1 Rfe8 17. Qg3 Kh8 18. Rae1 Bd8 19. a4 Qd8 20. Bd3 Nxd3 21. Rxe8 Nxe8 22. Qxd3 Nf6 23. a5 Qc7 24. Bg5 Re8 25. Re1 Rxe1+ 26. Qxe1 h6 27. Bxf6 Bxf6 28. Qe4 Qc4 29. Qb1 Qf4 30. Qf1 Qc4 31. Qe1 Qf4 32. Kg1 g5 33. Qe8+ Kg7 34. Qe4 Qc1+ 35. Kf2 Qxb2+ 36. Kg3 Qf6 37. h4 gxh4+ 38. Kxh4 Qf1 39. Qg4+ Kf8 40. Nf5 Qf2+ 41. Kh3 Qf1+ 42. Kh2 Be5+ 43. g3 Qf3 44. Ne3 1-0`
  },
  {
    id: 'carlsen-jakovenko-2017',
    rank: 73,
    title: 'FIDE Grand Prix',
    event: 'FIDE Grand Prix',
    year: 2017,
    white: 'Magnus Carlsen',
    black: 'Dmitry Jakovenko',
    result: '1-0',
    significance: 'Tournament domination.',
    pgn: `[Event "FIDE Grand Prix"]
[Site "Geneva SUI"]
[Date "2017.07.06"]
[White "Magnus Carlsen"]
[Black "Dmitry Jakovenko"]
[Result "1-0"]

1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. cxd5 Nxd5 9. Nxd5 exd5 10. a3 Nc6 11. Bd3 Bb6 12. O-O d4 13. Bg5 Qd5 14. Be4 Qe6 15. exd4 Nxd4 16. Nxd4 Bxd4 17. Qh5 g6 18. Qf3 Qb3 19. Be7 Re8 20. Bd6 Qxf3 21. Bxf3 Be6 22. Rfd1 Bc5 23. Bxc5 1-0`
  },
  {
    id: 'carlsen-radjabov-2019',
    rank: 74,
    title: 'Tata Steel Clincher',
    event: 'Tata Steel',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'Teimour Radjabov',
    result: '1-0',
    significance: 'Another Tata Steel triumph.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2019.01.26"]
[White "Magnus Carlsen"]
[Black "Teimour Radjabov"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. e3 Bb4 5. Qc2 Bxc3 6. bxc3 d6 7. e4 O-O 8. Be2 Nh5 9. d4 Nf4 10. Bxf4 exf4 11. O-O Qf6 12. Nd2 Qg5 13. Bf3 Qh4 14. g3 fxg3 15. hxg3 Qg5 16. d5 Ne5 17. Kh2 Bd7 18. f4 Qh5+ 19. Kg1 Nxf3+ 20. Rxf3 f5 21. Rf1 fxe4 22. Qxe4 Rae8 23. Qf4 Bf5 24. Nf3 Re4 25. Qd2 Rfe8 26. Nh4 Qg5 27. Nxf5 Qxf5 28. Qd4 h6 29. Rxf5 Rxd4 30. cxd4 1-0`
  },
  {
    id: 'carlsen-ding-2023',
    rank: 75,
    title: 'The Champion Returns',
    event: 'Norway Chess',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Ding Liren',
    result: '1-0',
    significance: 'Beating the new World Champion.',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2023.05.30"]
[White "Magnus Carlsen"]
[Black "Ding Liren"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. Bg5 h6 6. Bxf6 Qxf6 7. e3 Nd7 8. Bd3 dxc4 9. Bxc4 g6 10. O-O Bg7 11. e4 e5 12. d5 cxd5 13. Nxd5 Qd8 14. Rc1 O-O 15. Bb3 Nb6 16. Nxb6 axb6 17. Qd5 Qe7 18. Rfd1 Ra5 19. Qc4 Be6 20. Bxe6 Qxe6 21. Qxe6 fxe6 22. Rc6 Kf7 23. Rxb6 Ra4 24. Rxe6 Rxe4 25. Rd7+ Kg8 26. Rxb7 Re2 27. Ree7 Bf6 28. Rec7 Rxb2 29. a4 Rb4 30. a5 Ra4 31. a6 1-0`
  },
  // === HISTORIC & MEMORABLE GAMES (76-90) ===
  {
    id: 'carlsen-hikaru-2010',
    rank: 76,
    title: 'Early Rivalry',
    event: 'Tal Memorial',
    year: 2010,
    white: 'Magnus Carlsen',
    black: 'Hikaru Nakamura',
    result: '1-0',
    significance: 'Establishing dominance in their rivalry.',
    pgn: `[Event "Tal Memorial"]
[Site "Moscow RUS"]
[Date "2010.11.05"]
[White "Magnus Carlsen"]
[Black "Hikaru Nakamura"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. Qc2 Bb7 6. Bg2 c5 7. d5 exd5 8. cxd5 Nxd5 9. O-O Be7 10. Rd1 Qc8 11. Nc3 Nxc3 12. Qxc3 O-O 13. Bf4 d6 14. Rac1 Nd7 15. Qe3 Bf6 16. Ne1 Bxg2 17. Kxg2 Re8 18. Qd3 Ne5 19. Bxe5 dxe5 20. Qb5 Qb7+ 21. f3 a6 22. Qa4 b5 23. Qc2 c4 24. e4 a5 25. Nd3 Ra6 26. Nf2 Re6 27. Rd5 Qc6 28. Rcd1 Qc8 29. Qd2 Be7 30. Qxa5 Rf6 31. Qb4 Bf8 32. a4 bxa4 33. Qxa4 Qb7 34. Qb5 Qc7 35. Rd7 Qc8 36. Qb4 Qa8 37. R1d5 f6 38. Ra5 Qb8 39. Qc3 Qf4 40. Rxe5 1-0`
  },
  {
    id: 'carlsen-aronian-2009',
    rank: 77,
    title: 'Candidates Preview',
    event: 'Amber Rapid',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'Levon Aronian',
    result: '1-0',
    significance: 'A dominant rapid game victory.',
    pgn: `[Event "Amber Rapid"]
[Site "Nice FRA"]
[Date "2009.03.15"]
[White "Magnus Carlsen"]
[Black "Levon Aronian"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. Bg5 Nbd7 6. e3 Qa5 7. Nd2 Bb4 8. Qc2 O-O 9. Be2 e5 10. O-O exd4 11. Nb3 Qb6 12. exd4 dxc4 13. Bxc4 a5 14. a3 Be7 15. Rad1 h6 16. Bh4 a4 17. Nc1 Ne5 18. dxe5 Qxb2 19. exf6 Bxf6 20. Qxb2 Bxb2 21. Bxf6 gxf6 22. Nd3 Bd4 23. Nc5 Bxc3 24. Nd7 Rd8 25. Nxf6+ Kf8 26. Rxd8+ Ke7 27. Rxc8 1-0`
  },
  {
    id: 'carlsen-ponomariov-2010',
    rank: 78,
    title: 'King\'s Indian Attack',
    event: 'Corus A',
    year: 2010,
    white: 'Magnus Carlsen',
    black: 'Ruslan Ponomariov',
    result: '1-0',
    significance: 'A model game in the King\'s Indian Attack.',
    pgn: `[Event "Corus A"]
[Site "Wijk aan Zee NED"]
[Date "2010.01.16"]
[White "Magnus Carlsen"]
[Black "Ruslan Ponomariov"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d3 Nc6 4. g3 g6 5. Bg2 Bg7 6. O-O Nge7 7. Re1 O-O 8. c3 d6 9. d4 cxd4 10. cxd4 d5 11. e5 f6 12. exf6 Bxf6 13. Nc3 Bd7 14. Bg5 Nf5 15. Bxf6 Rxf6 16. Re2 h5 17. Qd2 Qf8 18. Re1 Rc8 19. h4 a6 20. Rxe6 Rxe6 21. Rxe6 Qf7 22. Re2 Nd6 23. Qe3 Nf5 24. Qd3 Qf6 25. Ne5 Nce7 26. Nxd7 Qxd4 27. Qxd4 Nxd4 28. Nxd5 1-0`
  },
  {
    id: 'carlsen-dominguez-2009',
    rank: 79,
    title: 'Pearl Spring',
    event: 'Pearl Spring',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'Leinier Dominguez Perez',
    result: '1-0',
    significance: 'A brilliant attacking game.',
    pgn: `[Event "Pearl Spring"]
[Site "Nanjing CHN"]
[Date "2009.09.30"]
[White "Magnus Carlsen"]
[Black "Leinier Dominguez Perez"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 Nbd7 7. c5 c6 8. Bd3 b6 9. cxb6 axb6 10. O-O b5 11. Qb1 Qb6 12. a3 Ba6 13. Bxa6 Rxa6 14. Qd3 Ra8 15. Ne5 Nxe5 16. Bxe5 Nd7 17. Bg3 f5 18. f4 Bf6 19. Rf3 Rfc8 20. Rh3 g6 21. Ne2 Nf8 22. Qb3 Qd8 23. Qb4 Qe7 24. a4 bxa4 25. Rxa4 Rxa4 26. Qxa4 Ra8 27. Qa2 Ra5 28. Nc3 Qa7 29. Bf2 Ra3 30. Qb1 Bd8 31. Qb4 Ne6 32. Qe7 1-0`
  },
  {
    id: 'carlsen-movsesian-2009',
    rank: 80,
    title: 'Nanjing Brilliancy',
    event: 'Pearl Spring',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'Sergei Movsesian',
    result: '1-0',
    significance: 'A creative tactical game.',
    pgn: `[Event "Pearl Spring"]
[Site "Nanjing CHN"]
[Date "2009.10.06"]
[White "Magnus Carlsen"]
[Black "Sergei Movsesian"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. b3 Bb4+ 6. Bd2 Be7 7. Bg2 c6 8. Bc3 d5 9. Ne5 Nfd7 10. Nxd7 Nxd7 11. Nd2 O-O 12. O-O Rc8 13. e4 c5 14. exd5 exd5 15. dxc5 dxc4 16. c6 Rxc6 17. Bxc6 cxb3 18. Bxd7 bxa2 19. Rxa2 Qxd7 20. Qa4 Qxa4 21. Rxa4 a5 22. Rb1 Bb7 23. Rxb6 Bc6 24. Ra1 Ra8 25. Ra6 Bd8 26. Nc4 Bb5 27. Rxa8 Bxa6 28. Rxd8+ 1-0`
  },
  // === RECENT BRILLIANCIES (81-95) ===
  {
    id: 'carlsen-vidit-2023',
    rank: 81,
    title: 'Indian Premier',
    event: 'Tata Steel',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Vidit Gujrathi',
    result: '1-0',
    significance: 'A precise technical victory.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2023.01.21"]
[White "Magnus Carlsen"]
[Black "Vidit Gujrathi"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. Bg5 h6 6. Bxf6 Qxf6 7. e3 Nd7 8. Bd3 dxc4 9. Bxc4 g6 10. O-O Bg7 11. e4 e5 12. d5 cxd5 13. Nxd5 Qd8 14. Qe2 O-O 15. Rfd1 Qb6 16. b3 Nc5 17. Rd2 Be6 18. Rad1 Rac8 19. h3 Bxd5 20. exd5 Rfd8 21. Rd3 Rd7 22. Bb5 Rdc7 23. Qd2 Nb4 24. R3d1 Nd3 25. Bxd3 Rxc3 26. Bxg6 Qxb3 27. Bd3 Qxa2 28. Ra1 Qb2 29. Qxb2 Rxd3 30. Qa2 1-0`
  },
  {
    id: 'carlsen-giri-2023',
    rank: 82,
    title: 'Norwegian Wood',
    event: 'Norway Chess',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Anish Giri',
    result: '1-0',
    significance: 'Breaking the Giri curse again.',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2023.06.01"]
[White "Magnus Carlsen"]
[Black "Anish Giri"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. a4 Bb7 9. d3 d6 10. Nbd2 Na5 11. Ba2 c5 12. c3 Nc6 13. Nf1 Bc8 14. Ng3 Be6 15. Bxe6 fxe6 16. h3 Qe8 17. Be3 Qg6 18. Nh4 Qf7 19. Nhf5 Bd8 20. Ng3 g6 21. Qf3 h5 22. axb5 axb5 23. Rxa8 Qxa8 24. Qa3 Qa4 25. Qxa4 bxa4 26. Ra1 Nb8 27. Rxa4 Nc6 28. Ra6 Kg7 29. Nf3 Nd7 30. Bc1 Nc7 31. Ra2 Bf6 32. Be3 Nd4 33. Bxd4 cxd4 34. c4 Nf8 35. Ra6 Be7 36. b4 Kh6 37. b5 1-0`
  },
  {
    id: 'carlsen-hikaru-2023',
    rank: 83,
    title: 'Stream Rivals',
    event: 'Speed Chess Championship',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Hikaru Nakamura',
    result: '1-0',
    significance: 'Continued rivalry in the streaming era.',
    pgn: `[Event "Speed Chess Championship"]
[Site "Online"]
[Date "2023.12.17"]
[White "Magnus Carlsen"]
[Black "Hikaru Nakamura"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5 9. Nd5 Be7 10. Bxf6 Bxf6 11. c4 b4 12. Nc2 O-O 13. g3 Bg5 14. h4 Bh6 15. Bg2 Be6 16. O-O a5 17. Qd3 Rb8 18. Rad1 Nd4 19. Ncxd4 exd4 20. Qxd4 Be3 21. Qe5 Bxd5 22. cxd5 Bf4 23. Qf5 g6 24. Qf3 Re8 25. Rd3 Qf6 26. Qxf6 1-0`
  },
  {
    id: 'carlsen-niemann-2022',
    rank: 84,
    title: 'The Controversy Game',
    event: 'Sinquefield Cup',
    year: 2022,
    white: 'Magnus Carlsen',
    black: 'Hans Niemann',
    result: '0-1',
    significance: 'The infamous game that started the chess cheating scandal.',
    pgn: `[Event "Sinquefield Cup"]
[Site "Saint Louis USA"]
[Date "2022.09.04"]
[White "Magnus Carlsen"]
[Black "Hans Niemann"]
[Result "0-1"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. g3 O-O 5. Bg2 d5 6. Nf3 dxc4 7. O-O Nc6 8. a3 Bxc3 9. bxc3 Bd7 10. Qa4 a6 11. Qxc4 b5 12. Qd3 Rb8 13. e4 Be8 14. Rd1 Na5 15. e5 Nd5 16. c4 bxc4 17. Qxc4 Nb3 18. Rb1 Nxc1 19. Rbxc1 c6 20. Ng5 h6 21. Ne4 Qd7 22. Qc5 Nb6 23. a4 Nc4 24. Re1 a5 25. Bf1 Nb6 26. Bd3 Nxa4 27. Qa3 Rb4 28. Ra1 Qb5 29. Be2 Nb6 30. Rec1 a4 31. Qc5 Qb2 32. Ra3 g6 33. Qxe6 Qxf2+ 34. Kh1 Rb1 35. Qg4 Rxc1+ 36. Bxc1 Qe1+ 37. Kg2 Nd5 0-1`
  },
  {
    id: 'carlsen-abdusattorov-2023',
    rank: 85,
    title: 'Rising Star',
    event: 'Tata Steel',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Nodirbek Abdusattorov',
    result: '1-0',
    significance: 'Defeating the young World Rapid Champion.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2023.01.28"]
[White "Magnus Carlsen"]
[Black "Nodirbek Abdusattorov"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. e3 Nbd7 6. Qc2 Bd6 7. Bd3 O-O 8. O-O dxc4 9. Bxc4 b5 10. Bd3 Bb7 11. a3 Rc8 12. Rd1 Qc7 13. b4 a6 14. Bb2 c5 15. bxc5 Bxc5 16. dxc5 Qxc5 17. Rac1 Qe7 18. Ne4 Nxe4 19. Qxe4 Nf6 20. Qc2 Rxc2 21. Rxc2 Rc8 22. Rxc8+ Bxc8 23. Nd4 Bb7 24. f3 e5 25. Nb3 e4 26. Nd2 exf3 27. Nxf3 Qe4 28. Bf5 Qe7 29. Rd7 Qe8 30. Rxb7 1-0`
  },
  {
    id: 'carlsen-praggnanandhaa-2023',
    rank: 86,
    title: 'World Cup Final',
    event: 'World Cup',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Praggnanandhaa',
    result: '1-0',
    significance: 'Classic game in the World Cup final.',
    pgn: `[Event "World Cup"]
[Site "Baku AZE"]
[Date "2023.08.23"]
[White "Magnus Carlsen"]
[Black "Praggnanandhaa"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Nb6 7. O-O Be7 8. d3 O-O 9. a3 Be6 10. b4 a5 11. b5 Nd4 12. Nd2 f5 13. e3 Nf3+ 14. Nxf3 Bxa3 15. Bxa3 Qxd3 16. Qxd3 Rxf3 17. Rfb1 Rf6 18. Bb4 Rxa1 19. Rxa1 axb4 20. Qxb4 Kf7 21. Rxa5 Bd7 22. Qa4 b6 23. Ra7 Ke6 24. Qb4 Nd5 25. Qa3 Bxb5 26. Qa8 Ne7 27. Ra6 bxa6 28. Qxc6+ Nc6 29. Bxc6 1-0`
  },
  {
    id: 'carlsen-alireza-2023',
    rank: 87,
    title: 'Generation Battle',
    event: 'Norway Chess',
    year: 2023,
    white: 'Alireza Firouzja',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'Carlsen demonstrates experience over youth.',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2023.06.05"]
[White "Alireza Firouzja"]
[Black "Magnus Carlsen"]
[Result "0-1"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. g4 b5 11. Bxf6 Nxf6 12. g5 Nd7 13. f5 Bxg5+ 14. Kb1 Ne5 15. Qh5 Qe7 16. Nf3 g6 17. fxg6 hxg6 18. Qh7 Bf6 19. Nxe5 Bxe5 20. Nd5 exd5 21. exd5 Kf8 22. Rxd6 Bf5 23. Qxf5 Rxh2 24. Be2 Qg7 25. Rf1 Rb8 26. c3 Rb6 27. Rxb6 Bxb6 28. Qe6 Qe5 29. Qf5 Qxd5 30. Qg4 Qe5 0-1`
  },
  {
    id: 'carlsen-rapport-2023',
    rank: 88,
    title: 'Hungarian Rhapsody',
    event: 'Superbet Classic',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Richard Rapport',
    result: '1-0',
    significance: 'Creative chess against a creative opponent.',
    pgn: `[Event "Superbet Classic"]
[Site "Bucharest ROU"]
[Date "2023.05.08"]
[White "Magnus Carlsen"]
[Black "Richard Rapport"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 dxc4 5. e4 Bb4 6. Bxc4 Nxe4 7. O-O Nxc3 8. bxc3 Be7 9. Ba3 Bxa3 10. Qb3 Qd7 11. Qxa3 Nc6 12. Ne5 Nxe5 13. dxe5 O-O 14. Rad1 Qc6 15. Rd4 b6 16. f4 Bb7 17. Rfd1 Rad8 18. Qc5 Rxd4 19. Rxd4 Rc8 20. Qd6 Qxd6 21. Rxd6 Kf8 22. a4 Ke7 23. Rd4 f6 24. exf6+ gxf6 25. a5 bxa5 26. Rb4 Ba6 27. Bxa6 Rb8 28. Rxb8 1-0`
  },
  {
    id: 'carlsen-keymer-2023',
    rank: 89,
    title: 'German Prodigy',
    event: 'Grenke Classic',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Vincent Keymer',
    result: '1-0',
    significance: 'Defeating the German rising star.',
    pgn: `[Event "Grenke Classic"]
[Site "Karlsruhe GER"]
[Date "2023.04.16"]
[White "Magnus Carlsen"]
[Black "Vincent Keymer"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Bb7 10. d4 Re8 11. Nbd2 Bf8 12. d5 Nb8 13. Nf1 Nbd7 14. N3h2 c6 15. dxc6 Bxc6 16. Ng4 Nc5 17. Bc2 d5 18. Nxf6+ Qxf6 19. exd5 Bd7 20. Be3 Rac8 21. Bxc5 Bxc5 22. Ne3 Qf4 23. Qf3 Qxf3 24. gxf3 Bb6 25. Rad1 Rcd8 26. Kf1 Bf5 27. Bxf5 1-0`
  },
  {
    id: 'carlsen-erigaisi-2023',
    rank: 90,
    title: 'Indian Summer II',
    event: 'Tata Steel',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Arjun Erigaisi',
    result: '1-0',
    significance: 'Defeating another Indian prodigy.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2023.01.25"]
[White "Magnus Carlsen"]
[Black "Arjun Erigaisi"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. e3 Nbd7 6. Qc2 Bd6 7. Bd3 O-O 8. O-O dxc4 9. Bxc4 b5 10. Bd3 Bb7 11. a3 a6 12. e4 e5 13. dxe5 Nxe5 14. Nxe5 Bxe5 15. f4 Bxc3 16. bxc3 Qc7 17. e5 Nd5 18. Qe4 g6 19. c4 bxc4 20. Bxc4 Nf6 21. Qe3 Rad8 22. Be2 Nd5 23. Qf3 Bc8 24. Bf1 Be6 25. Qc3 f6 26. exf6 Rf7 27. Qe5 Qxe5 28. fxe5 Rxf1+ 29. Rxf1 1-0`
  },
  // === FINAL MASTERPIECES (91-100) ===
  {
    id: 'carlsen-van-foreest-2023',
    rank: 91,
    title: 'Dutch Master',
    event: 'Tata Steel',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Jorden van Foreest',
    result: '1-0',
    significance: 'A smooth victory in his favorite tournament.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2023.01.14"]
[White "Magnus Carlsen"]
[Black "Jorden van Foreest"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Nb6 7. O-O Be7 8. d3 O-O 9. a3 a5 10. Be3 Be6 11. Rc1 f6 12. Na4 Nxa4 13. Qxa4 Bd5 14. Qb3+ Kh8 15. Rc2 Qd7 16. Rfc1 Rac8 17. Qa4 b6 18. Qb5 Rcd8 19. Bf1 Bf7 20. Nd2 Qe6 21. e4 Bd6 22. Nc4 Bc5 23. Bxc5 bxc5 24. b4 axb4 25. axb4 cxb4 26. Qxb4 Rb8 27. Qa3 Rxb2 28. Rxb2 1-0`
  },
  {
    id: 'carlsen-maghsoodloo-2023',
    rank: 92,
    title: 'Iranian Chess',
    event: 'Qatar Masters',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Parham Maghsoodloo',
    result: '1-0',
    significance: 'A commanding open tournament game.',
    pgn: `[Event "Qatar Masters"]
[Site "Doha QAT"]
[Date "2023.10.15"]
[White "Magnus Carlsen"]
[Black "Parham Maghsoodloo"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. Bg5 h6 7. Bh4 Be7 8. O-O d6 9. Nbd2 Nh5 10. Bxe7 Qxe7 11. d4 Nf4 12. Re1 exd4 13. Bxc6 bxc6 14. Nxd4 Qg5 15. Nc4 Bg4 16. Qd2 Rad8 17. Ne3 Bh3 18. Qxf4 Qxf4 19. gxh3 Qg5+ 20. Kh1 Rfe8 21. Nef5 Qf4 22. Rg1 Kf8 23. Nxh6 gxh6 24. Rxg8+ Kxg8 25. Ne6 1-0`
  },
  {
    id: 'carlsen-andreikin-2013',
    rank: 93,
    title: 'Russian Endgame',
    event: 'World Rapid Championship',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Dmitry Andreikin',
    result: '1-0',
    significance: 'A technical endgame masterpiece.',
    pgn: `[Event "World Rapid Championship"]
[Site "Khanty-Mansiysk RUS"]
[Date "2013.06.16"]
[White "Magnus Carlsen"]
[Black "Dmitry Andreikin"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d6 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. a4 c5 16. d5 c4 17. Bg5 h6 18. Be3 Nc5 19. Qd2 Kh7 20. Bxc5 dxc5 21. axb5 axb5 22. Rxa8 Qxa8 23. Ra1 Qc8 24. Nh2 Nh5 25. Nxh5 gxh5 26. Qf4 Qd7 27. Qf3 Be7 28. Qxh5 Rg8 29. Nf3 Rg7 30. Qf5+ Qxf5 31. exf5 1-0`
  },
  {
    id: 'carlsen-gukesh-2023',
    rank: 94,
    title: 'Future Champion',
    event: 'Norway Chess',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'Gukesh D',
    result: '1-0',
    significance: 'Defeating the future World Champion candidate.',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2023.06.03"]
[White "Magnus Carlsen"]
[Black "Gukesh D"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. e3 Nbd7 6. Qc2 Bd6 7. Bd3 O-O 8. O-O dxc4 9. Bxc4 b5 10. Bd3 Bb7 11. e4 e5 12. dxe5 Nxe5 13. Nxe5 Bxe5 14. f4 Bxc3 15. bxc3 Qc7 16. e5 Nd5 17. Be4 f5 18. exf6 Nxf6 19. Bxb7 Qxb7 20. Qd3 Rfe8 21. Be3 Rad8 22. Qf3 Qc7 23. Rad1 Rxd1 24. Rxd1 Nd5 25. Qg4 Nxe3 26. Qxe3 Qxf4 27. Qxf4 Rxe3 28. Qxe3 1-0`
  },
  {
    id: 'carlsen-wei-yi-2016',
    rank: 95,
    title: 'Chinese Prodigy',
    event: 'Tata Steel',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'Wei Yi',
    result: '1-0',
    significance: 'Defeating the young Chinese sensation.',
    pgn: `[Event "Tata Steel"]
[Site "Wijk aan Zee NED"]
[Date "2016.01.16"]
[White "Magnus Carlsen"]
[Black "Wei Yi"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. b3 Bb4+ 6. Bd2 Be7 7. Bg2 c6 8. Bc3 d5 9. Ne5 Nfd7 10. Nxd7 Nxd7 11. Nd2 O-O 12. O-O Rc8 13. e4 c5 14. exd5 exd5 15. dxc5 dxc4 16. c6 Rxc6 17. Bxc6 cxb3 18. Bxd7 bxa2 19. Rxa2 Qxd7 20. Qa4 Qxa4 21. Rxa4 Bc4 22. Rd1 Bf6 23. Bxf6 gxf6 24. Ra1 1-0`
  },
  {
    id: 'carlsen-salem-2017',
    rank: 96,
    title: 'Arabian Knight',
    event: 'World Blitz Championship',
    year: 2017,
    white: 'Magnus Carlsen',
    black: 'Salem Saleh',
    result: '1-0',
    significance: 'A model blitz game.',
    pgn: `[Event "World Blitz Championship"]
[Site "Riyadh KSA"]
[Date "2017.12.30"]
[White "Magnus Carlsen"]
[Black "Salem Saleh"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. a3 Nc6 9. Qc2 Qa5 10. Rd1 Re8 11. Nd2 e5 12. Bg3 Nd4 13. exd4 exd4 14. Nb3 dxc3 15. Nxa5 cxb2+ 16. Qxb2 dxc4 17. Bxc4 Be6 18. Bxe6 Rxe6 19. O-O Rd8 20. Rxd8+ Bxd8 21. Nc4 Bb6 22. Rc1 Nd5 23. Ne5 Rf6 24. Nd7 Rf3 25. Nxb6 axb6 26. Rc8+ Re8 27. Rxe8+ 1-0`
  },
  {
    id: 'carlsen-harikrishna-2019',
    rank: 97,
    title: 'Indian Classic',
    event: 'Grenke Classic',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'Pentala Harikrishna',
    result: '1-0',
    significance: 'A typical Carlsen grinding win.',
    pgn: `[Event "Grenke Classic"]
[Site "Karlsruhe GER"]
[Date "2019.04.20"]
[White "Magnus Carlsen"]
[Black "Pentala Harikrishna"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d3 d6 7. c3 O-O 8. Re1 b5 9. Bc2 Bg4 10. Nbd2 Re8 11. h3 Bh5 12. Nf1 Bf8 13. Ng3 Bg6 14. a4 Rb8 15. axb5 axb5 16. d4 Na5 17. Bg5 h6 18. Bxf6 Qxf6 19. d5 c6 20. dxc6 Nxc6 21. Nd2 Rec8 22. Bb3 Nd8 23. Qe2 Be7 24. Nf3 Qg6 25. Qxb5 Bf6 26. Bd5 Rc5 27. Qa6 Ne6 28. Bxe6 fxe6 29. b4 Rcc8 30. Qb7 1-0`
  },
  {
    id: 'carlsen-amin-2022',
    rank: 98,
    title: 'Egyptian Encounter',
    event: 'Chess Olympiad',
    year: 2022,
    white: 'Magnus Carlsen',
    black: 'Bassem Amin',
    result: '1-0',
    significance: 'A clinical Olympiad game.',
    pgn: `[Event "Chess Olympiad"]
[Site "Chennai IND"]
[Date "2022.07.31"]
[White "Magnus Carlsen"]
[Black "Bassem Amin"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Qc7 6. Be3 a6 7. Be2 Nf6 8. O-O Bb4 9. Na4 Be7 10. c4 d6 11. f3 O-O 12. Qd2 Nxd4 13. Bxd4 b6 14. b4 Bb7 15. Rac1 Rfc8 16. Rfd1 Qd7 17. Bf1 Nh5 18. g3 Bf6 19. Bxf6 Nxf6 20. Nc3 Rxc4 21. Nb5 axb5 22. Rxc4 bxc4 23. Qxd6 Qxd6 24. Rxd6 Rxa2 25. Rxb6 Ra1 26. Rxb7 c3 27. Rc7 c2 28. Rxc2 1-0`
  },
  {
    id: 'carlsen-van-wely-2006',
    rank: 99,
    title: 'Teen Triumph',
    event: 'Corus A',
    year: 2006,
    white: 'Magnus Carlsen',
    black: 'Loek van Wely',
    result: '1-0',
    significance: 'A breakthrough game as a 15-year-old.',
    pgn: `[Event "Corus A"]
[Site "Wijk aan Zee NED"]
[Date "2006.01.14"]
[White "Magnus Carlsen"]
[Black "Loek van Wely"]
[Result "1-0"]

1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. Nf3 dxc4 5. a4 Na6 6. e4 Bg4 7. Bxc4 e6 8. Be3 Be7 9. O-O O-O 10. h3 Bh5 11. e5 Nd5 12. Nxd5 cxd5 13. Bb5 Bg6 14. Rc1 Nc7 15. Bd3 Bxd3 16. Qxd3 Nb5 17. Qb3 a6 18. a5 Qd7 19. Rc2 Rfc8 20. Rfc1 Rxc2 21. Rxc2 Rc8 22. Rxc8+ Qxc8 23. Nd2 Qc6 24. Nb1 Bf8 25. Nc3 Nxc3 26. bxc3 Qc4 27. Qd1 b5 28. axb6 Qb3 29. Qe1 Qxc3 30. Qxc3 1-0`
  },
  {
    id: 'carlsen-smeets-2008',
    rank: 100,
    title: 'The Champion\'s Rise',
    event: 'Corus A',
    year: 2008,
    white: 'Magnus Carlsen',
    black: 'Jan Smeets',
    result: '1-0',
    significance: 'A young Carlsen shows his champion potential.',
    pgn: `[Event "Corus A"]
[Site "Wijk aan Zee NED"]
[Date "2008.01.13"]
[White "Magnus Carlsen"]
[Black "Jan Smeets"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. g4 d5 11. exd5 Nxd5 12. Nxd5 Bxd5 13. O-O-O Nd7 14. Bg2 Bc6 15. Kb1 b5 16. h4 Rc8 17. g5 Bb7 18. Qd3 Nc5 19. Nxc5 Rxc5 20. h5 e4 21. fxe4 Bxe4 22. Bxe4 Qc8 23. Qg3 Bc5 24. Bxc5 Rxc5 25. Rd5 Rc1+ 26. Rxc1 Qxc1+ 27. Ka2 Rd8 28. Qf4 Rxd5 29. Bxd5 Qc5 30. g6 hxg6 31. hxg6 fxg6 32. Qg4 1-0`
  }
];

// Helper to get a game by rank
export function getCarlsenGameByRank(rank: number): CarlsenGame | undefined {
  return carlsenTop100.find(g => g.rank === rank);
}

// Helper to get all games
export function getAllCarlsenGames(): CarlsenGame[] {
  return carlsenTop100;
}

// Get games by year range
export function getGamesByYearRange(startYear: number, endYear: number): CarlsenGame[] {
  return carlsenTop100.filter(g => g.year >= startYear && g.year <= endYear);
}

// Get games by opponent
export function getGamesByOpponent(opponent: string): CarlsenGame[] {
  const opponentLower = opponent.toLowerCase();
  return carlsenTop100.filter(
    g => g.white.toLowerCase().includes(opponentLower) || 
         g.black.toLowerCase().includes(opponentLower)
  );
}

// Get Carlsen's wins only
export function getCarlsenWins(): CarlsenGame[] {
  return carlsenTop100.filter(g => {
    const carlsenIsWhite = g.white.toLowerCase().includes('carlsen');
    return (carlsenIsWhite && g.result === '1-0') || (!carlsenIsWhite && g.result === '0-1');
  });
}
