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

// Selection: Magnus Carlsen's classical wins from the pgnmentor.com archive, weighted by event
// (World Championship > Candidates > Interzonal > Olympiad > elite events) and opponent strength,
// plus games listed as notable on Wikipedia; capped per year and opponent; ordered chronologically.
// Every PGN is replayed with chess.js. Rank = chronological position.
export const carlsenTop100: CarlsenGame[] = [
  {
    id: 'carlsen-ernst-2004',
    rank: 1,
    title: 'vs. Ernst, GMC 2004',
    event: 'GMC',
    year: 2004,
    white: 'Magnus Carlsen',
    black: 'S. Ernst',
    result: '1-0',
    significance: 'GMC, Wijk aan Zee NED, round 12, 2004. Carlsen wins with White in 29 moves. Opening: Caro-Kann: Classical.',
    pgn: `[Event "GMC"]
[Site "Wijk aan Zee NED"]
[Date "2004.01.24"]
[Round "12"]
[White "Magnus Carlsen"]
[Black "S. Ernst"]
[Result "1-0"]
[WhiteElo "2484"]
[BlackElo "2474"]
[ECO "B19"]

1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 e6 11. Bf4 Ngf6 12. O-O-O Be7 13. Ne4 Qa5 14. Kb1 O-O 15. Nxf6+ Nxf6 16. Ne5 Rad8 17. Qe2 c5 18. Ng6 fxg6 19. Qxe6+ Kh8 20. hxg6 Ng8 21. Bxh6 gxh6 22. Rxh6+ Nxh6 23. Qxe7 Nf7 24. gxf7 Kg7 25. Rd3 Rd6 26. Rg3+ Rg6 27. Qe5+ Kxf7 28. Qf5+ Rf6 29. Qd7# 1-0`
  },
  {
    id: 'carlsen-kasparov-2004',
    rank: 2,
    title: 'vs. Kasparov, Rapid 2004',
    event: 'Rapid',
    year: 2004,
    white: 'Magnus Carlsen',
    black: 'G. Kasparov',
    result: '1/2-1/2',
    significance: 'Rapid, Reykjavik ISL, 2004. Drawn in 52 moves. Opening: Slav Defense: Three Knights.',
    pgn: `[Event "Rapid"]
[Site "Reykjavik ISL"]
[Date "2004.03.18"]
[Round "1.1"]
[White "Magnus Carlsen"]
[Black "G. Kasparov"]
[Result "1/2-1/2"]
[WhiteElo "2484"]
[BlackElo "2831"]
[ECO "D52"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 Nbd7 6. e3 Qa5 7. Nd2 Bb4 8. Qc2 O-O 9. Be2 e5 10. O-O exd4 11. Nb3 Qb6 12. exd4 dxc4 13. Bxc4 a5 14. a4 Qc7 15. Rae1 h6 16. Bh4 Bd6 17. h3 Nb6 18. Bxf6 Nxc4 19. Ne4 Bh2+ 20. Kh1 Nd6 21. Kxh2 Nxe4+ 22. Be5 Nd6 23. Qc5 Rd8 24. d5 Qd7 25. Nd4 Nf5 26. dxc6 bxc6 27. Nxc6 Re8 28. Rd1 Qe6 29. Rfe1 Bb7 30. Nd4 Nxd4 31. Qxd4 Qg6 32. Qg4 Qxg4 33. hxg4 Bc6 34. b3 f6 35. Bc3 Rxe1 36. Rxe1 Bd5 37. Rb1 Kf7 38. Kg3 Rb8 39. b4 axb4 40. Bxb4 Bc4 41. a5 Ba6 42. f3 Kg6 43. Kf4 h5 44. gxh5+ Kxh5 45. Rh1+ Kg6 46. Bc5 Rb2 47. Kg3 Ra2 48. Bb6 Kf7 49. Rc1 g5 50. Rc7+ Kg6 51. Rc6 Bf1 52. Bf2 1/2-1/2`
  },
  {
    id: 'carlsen-aronian-2007',
    rank: 3,
    title: 'vs. Aronian, WCh Candidates s/f 2007',
    event: 'WCh Candidates s/f',
    year: 2007,
    white: 'Magnus Carlsen',
    black: 'L. Aronian',
    result: '1-0',
    significance: 'WCh Candidates s/f, Elista RUS, round 3, 2007. Carlsen wins with White in 41 moves. Opening: Réti Opening.',
    pgn: `[Event "WCh Candidates s/f"]
[Site "Elista RUS"]
[Date "2007.05.29"]
[Round "3"]
[White "Magnus Carlsen"]
[Black "L. Aronian"]
[Result "1-0"]
[WhiteElo "2693"]
[BlackElo "2759"]
[ECO "A30"]

1. Nf3 Nf6 2. c4 b6 3. g3 c5 4. Bg2 Bb7 5. O-O e6 6. Nc3 Be7 7. Re1 d5 8. cxd5 Nxd5 9. d4 Nxc3 10. bxc3 Be4 11. Ne5 Bxg2 12. Kxg2 O-O 13. e4 Qc8 14. Qg4 Bf6 15. Nf3 Kh8 16. h4 Nc6 17. Bg5 cxd4 18. Bxf6 gxf6 19. cxd4 e5 20. Qxc8 Raxc8 21. d5 Na5 22. h5 Nc4 23. Nh4 Nd6 24. h6 Rc3 25. Rac1 Rfc8 26. Rxc3 Rxc3 27. Nf5 Nxf5 28. exf5 Kg8 29. Re4 Kf8 30. Rg4 Rc7 31. Rg7 b5 32. Rxh7 Kg8 33. Rg7+ Kh8 34. d6 Rd7 35. Kf3 b4 36. Ke4 Rxd6 37. Rxf7 Ra6 38. g4 Kg8 39. h7+ Kh8 40. g5 fxg5 41. f6 1-0`
  },
  {
    id: 'carlsen-aronian-2007-2',
    rank: 4,
    title: 'vs. Aronian, WCh Candidates s/f 2007',
    event: 'WCh Candidates s/f',
    year: 2007,
    white: 'Magnus Carlsen',
    black: 'L. Aronian',
    result: '1-0',
    significance: 'WCh Candidates s/f, Elista RUS, round 5, 2007. Carlsen wins with White in 49 moves. Opening: Queen\'s Indian Defense.',
    pgn: `[Event "WCh Candidates s/f"]
[Site "Elista RUS"]
[Date "2007.06.01"]
[Round "5"]
[White "Magnus Carlsen"]
[Black "L. Aronian"]
[Result "1-0"]
[WhiteElo "2693"]
[BlackElo "2759"]
[ECO "E12"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 d5 6. cxd5 Nxd5 7. Qc2 Be7 8. e4 Nxc3 9. bxc3 O-O 10. Bd3 c5 11. O-O Qc7 12. Qe2 Nd7 13. Bb2 c4 14. Bc2 b5 15. Bc1 a5 16. Rb1 Ba6 17. e5 b4 18. axb4 axb4 19. Bg5 Nb6 20. Qe4 g6 21. Qh4 Ra7 22. Bf6 Bxf6 23. exf6 Nd5 24. Be4 Qf4 25. Bxd5 Qxh4 26. Nxh4 exd5 27. Rxb4 Bc8 28. Rb6 Ra3 29. Rc1 Be6 30. Nf3 Rfa8 31. h4 h6 32. Ne5 Ra1 33. Rxa1 Rxa1+ 34. Kh2 Ra3 35. Rb8+ Kh7 36. f4 Rxc3 37. h5 gxh5 38. Rf8 Ra3 39. f5 Bxf5 40. Rxf7+ Kg8 41. Rg7+ Kf8 42. Rb7 Ra8 43. Kg3 Rd8 44. Kf4 Be4 45. g3 c3 46. Rf7+ Kg8 47. Rg7+ Kf8 48. Nd7+ Rxd7 49. Rxd7 1-0`
  },
  {
    id: 'carlsen-aronian-2007-3',
    rank: 5,
    title: 'vs. Aronian, WCh Candidates s/f 2007',
    event: 'WCh Candidates s/f',
    year: 2007,
    white: 'Magnus Carlsen',
    black: 'L. Aronian',
    result: '1-0',
    significance: 'WCh Candidates s/f, Elista RUS, round 10, 2007. Carlsen wins with White in 84 moves. Opening: Queen\'s Indian Defense.',
    pgn: `[Event "WCh Candidates s/f"]
[Site "Elista RUS"]
[Date "2007.06.03"]
[Round "10"]
[White "Magnus Carlsen"]
[Black "L. Aronian"]
[Result "1-0"]
[WhiteElo "2693"]
[BlackElo "2759"]
[ECO "E12"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. Nc3 Bb7 5. Bg5 Be7 6. e3 h6 7. Bh4 c5 8. Be2 cxd4 9. Nxd4 a6 10. O-O Nc6 11. Nf3 O-O 12. Qd2 Qb8 13. Rfd1 Rd8 14. Rac1 d6 15. Qc2 Qa7 16. a3 Rac8 17. Qb1 Nb8 18. b4 Nbd7 19. Bg3 d5 20. cxd5 Nxd5 21. Nxd5 Bxd5 22. e4 Bc6 23. Nd4 Ba4 24. Rxc8 Rxc8 25. Rc1 Qa8 26. f3 Bg5 27. f4 Rxc1+ 28. Qxc1 Qxe4 29. fxg5 Qxd4+ 30. Bf2 Qe5 31. Qc8+ Nf8 32. Qxa6 b5 33. Bf1 hxg5 34. Qc8 f5 35. Bc5 Qf6 36. h3 e5 37. Bxf8 Qxf8 38. Qe6+ Qf7 39. Qxe5 Qd7 40. Be2 Kh7 41. Kf2 g6 42. Qe3 Qd8 43. Qe5 Qd2 44. Kg3 Qc1 45. Kh2 Qxa3 46. Qe7+ Kh6 47. Qf8+ Kh7 48. Qe7+ Kh6 49. Qe5 Kh7 50. Qe7+ Kh6 51. Bxb5 Bxb5 52. Qe5 Kh7 53. Qxb5 f4 54. Qd7+ Kh6 55. Qe8 Qb2 56. Qf8+ Kh7 57. Qe7+ Kh6 58. h4 f3 59. Qxg5+ Kh7 60. h5 gxh5 61. Qxh5+ Kg7 62. Qg4+ Kh7 63. Qd7+ Kh6 64. Qc6+ Kg7 65. Qc7+ Kh6 66. Qf4+ Kh7 67. Qf7+ Kh6 68. Qxf3 Qxb4 69. Kh3 Qb1 70. Qf6+ Kh7 71. Qf3 Kg7 72. Kh4 Kh7 73. Qf7+ Kh8 74. Qh5+ Kg7 75. Qg4+ Kh7 76. Qh5+ Kg7 77. Qe5+ Kh7 78. Qd5 Kg7 79. Qd4+ Kh7 80. Qd7+ Kh8 81. g4 Qh1+ 82. Kg5 Qc1+ 83. Kg6 Qb1+ 84. Qf5 1-0`
  },
  {
    id: 'mamedyarov-carlsen-2008',
    rank: 6,
    title: 'vs. Mamedyarov, Corus A 2008',
    event: 'Corus A',
    year: 2008,
    white: 'S. Mamedyarov',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'Corus A, Wijk aan Zee NED, round 1, 2008. Carlsen wins with Black in 40 moves. Opening: Sicilian Defense: Old Sicilian.',
    pgn: `[Event "Corus A"]
[Site "Wijk aan Zee NED"]
[Date "2008.01.12"]
[Round "1"]
[White "S. Mamedyarov"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2760"]
[BlackElo "2733"]
[ECO "B50"]

1. e4 c5 2. Nf3 Nc6 3. Nc3 g6 4. g3 Bg7 5. Bg2 d6 6. O-O Bg4 7. h3 Bxf3 8. Qxf3 Nf6 9. d3 O-O 10. Qd1 Nd7 11. f4 c4 12. dxc4 Na5 13. Nd5 Nxc4 14. c3 Ndb6 15. Qe2 Rc8 16. Kh2 e6 17. Nb4 Na4 18. f5 Re8 19. fxe6 fxe6 20. Nd3 Qb6 21. h4 Qa6 22. Rf2 Ne5 23. Nf4 Nc5 24. Qxa6 bxa6 25. Re2 h6 26. Kh1 a5 27. Be3 a4 28. Rd1 Rc6 29. Bd4 g5 30. Nh3 g4 31. Nf4 Rb6 32. Nh5 Bh8 33. Red2 Reb8 34. Bxc5 dxc5 35. Rd8+ Kf7 36. Rxb8 Rxb8 37. Rd2 Nc4 38. Rd7+ Ke8 39. Rxa7 Be5 40. Rxa4 Ne3 0-1`
  },
  {
    id: 'kramnik-carlsen-2008',
    rank: 7,
    title: 'vs. Kramnik, Corus A 2008',
    event: 'Corus A',
    year: 2008,
    white: 'V. Kramnik',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'Corus A, Wijk aan Zee NED, round 12, 2008. Carlsen wins with Black in 57 moves. Opening: Réti Opening.',
    pgn: `[Event "Corus A"]
[Site "Wijk aan Zee NED"]
[Date "2008.01.26"]
[Round "12"]
[White "V. Kramnik"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2799"]
[BlackElo "2733"]
[ECO "A30"]

1. Nf3 Nf6 2. c4 e6 3. Nc3 c5 4. g3 b6 5. Bg2 Bb7 6. O-O Be7 7. d4 cxd4 8. Qxd4 d6 9. Rd1 a6 10. Ng5 Bxg2 11. Kxg2 Nc6 12. Qf4 O-O 13. Nce4 Ne8 14. b3 Ra7 15. Bb2 Rd7 16. Rac1 Nc7 17. Nf3 f5 18. Nc3 g5 19. Qd2 g4 20. Ne1 Bg5 21. e3 Rff7 22. Kg1 Ne8 23. Ne2 Nf6 24. Nf4 Qe8 25. Qc3 Rg7 26. b4 Ne4 27. Qb3 Rge7 28. Qa4 Ne5 29. Qxa6 Ra7 30. Qb5 Qxb5 31. cxb5 Rxa2 32. Rc8+ Kf7 33. Nfd3 Bf6 34. Nxe5+ dxe5 35. Rc2 Rea7 36. Kg2 Ng5 37. Rd6 e4 38. Bxf6 Kxf6 39. Kf1 Ra1 40. Ke2 Rb1 41. Rd1 Rxb4 42. Ng2 Rxb5 43. Nf4 Rc5 44. Rb2 b5 45. Kf1 Rac7 46. Rbb1 Rb7 47. Rb4 Rc4 48. Rb2 b4 49. Rdb1 Nf3 50. Kg2 Rd7 51. h3 e5 52. Ne2 Rd2 53. hxg4 fxg4 54. Rxd2 Nxd2 55. Rb2 Nf3 56. Kf1 b3 57. Kg2 Rc2 0-1`
  },
  {
    id: 'carlsen-adams-2008',
    rank: 8,
    title: 'vs. Adams, 38th Olympiad 2008',
    event: '38th Olympiad',
    year: 2008,
    white: 'Magnus Carlsen',
    black: 'M. Adams',
    result: '1-0',
    significance: '38th Olympiad, Dresden GER, round 4, 2008. Carlsen wins with White in 46 moves. Opening: Queen\'s Indian Defense: Classical.',
    pgn: `[Event "38th Olympiad"]
[Site "Dresden GER"]
[Date "2008.11.16"]
[Round "4"]
[White "Magnus Carlsen"]
[Black "M. Adams"]
[Result "1-0"]
[WhiteElo "2786"]
[BlackElo "2734"]
[ECO "E17"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. Nc3 O-O 7. Bf4 d5 8. Ne5 Na6 9. O-O c5 10. cxd5 Nxd5 11. Nxd5 exd5 12. dxc5 Nxc5 13. Rc1 Bf6 14. Nd3 Ne6 15. Qd2 Qe7 16. Be5 Bxe5 17. Nxe5 Rac8 18. e3 Rc7 19. Nf3 Rfc8 20. Rfd1 h6 21. Rxc7 Rxc7 22. Ne1 Qf6 23. Qe2 Rd7 24. Qb5 Nc5 25. Qb4 a5 26. Qd2 Ne6 27. Nf3 Rc7 28. Qe2 Rc5 29. h3 g6 30. a3 Bc6 31. Rd2 Ba4 32. Kh2 Bb3 33. Qa6 Qd8 34. Qd3 Bc4 35. Qc3 Ba2 36. Qd3 Bc4 37. Qc2 Bf1 38. Qd1 Bxg2 39. Kxg2 Qa8 40. Kh2 Qc6 41. Ne5 Qd6 42. b4 axb4 43. axb4 Rc8 44. Rxd5 Qxb4 45. h4 h5 46. Rd7 1-0`
  },
  {
    id: 'carlsen-topalov-2009',
    rank: 9,
    title: 'vs. Topalov, 5th MTel Masters 2009',
    event: '5th MTel Masters',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'V. Topalov',
    result: '1-0',
    significance: '5th MTel Masters, Sofia BUL, round 1, 2009. Carlsen wins with White in 36 moves. Opening: Slav Defense: Three Knights.',
    pgn: `[Event "5th MTel Masters"]
[Site "Sofia BUL"]
[Date "2009.05.13"]
[Round "1"]
[White "Magnus Carlsen"]
[Black "V. Topalov"]
[Result "1-0"]
[WhiteElo "2770"]
[BlackElo "2812"]
[ECO "D43"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 h6 6. Bxf6 Qxf6 7. e3 Nd7 8. Bd3 dxc4 9. Bxc4 g6 10. O-O Bg7 11. e4 O-O 12. e5 Qe7 13. Qe2 b5 14. Bd3 Bb7 15. Be4 Rfd8 16. Rac1 Rab8 17. Rfd1 a6 18. h4 Ba8 19. Rc2 Rdc8 20. Rdc1 Qf8 21. a4 c5 22. axb5 cxd4 23. Nxd4 Bxe4 24. Nxe4 Rxc2 25. Rxc2 axb5 26. Nc6 Rb6 27. f4 Qa8 28. Ne7+ Kh7 29. h5 Ra6 30. hxg6+ fxg6 31. Rc7 Ra1+ 32. Kf2 Qd8 33. Qd3 Qxe7 34. Rxd7 Qh4+ 35. Kf3 Qh5+ 36. Kg3 1-0`
  },
  {
    id: 'carlsen-leko-2009',
    rank: 10,
    title: 'vs. Leko, 2nd Pearl Spring 2009',
    event: '2nd Pearl Spring',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'P. Leko',
    result: '1-0',
    significance: '2nd Pearl Spring, Nanjing CHN, round 1, 2009. Carlsen wins with White in 44 moves. Opening: Scotch Game: Classical.',
    pgn: `[Event "2nd Pearl Spring"]
[Site "Nanjing CHN"]
[Date "2009.09.28"]
[Round "1"]
[White "Magnus Carlsen"]
[Black "P. Leko"]
[Result "1-0"]
[WhiteElo "2772"]
[BlackElo "2762"]
[ECO "C45"]

1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Nge7 7. Bc4 Ne5 8. Be2 Qg6 9. O-O d6 10. f4 Qxe4 11. Bf2 Bxd4 12. cxd4 N5g6 13. g3 O-O 14. Nc3 Qf5 15. d5 a6 16. Re1 Kh8 17. Rc1 Bd7 18. Bf3 Rac8 19. Qb3 b5 20. Ne2 Qh3 21. Nd4 Bg4 22. Bg2 Qh5 23. h4 Ng8 24. Rc6 Nf6 25. Rxa6 Bd7 26. Nxb5 Rb8 27. a4 Ng4 28. Bf3 Qh6 29. Qc4 Nxh4 30. Bxg4 Bxg4 31. gxh4 Bf3 32. f5 Qh5 33. Qf4 Bxd5 34. Nxc7 Bb7 35. Rb6 f6 36. Bd4 Qf7 37. Ne6 Rg8 38. Kf2 Rbc8 39. Bc3 Bd5 40. a5 Rc4 41. Nd4 Ba8 42. Qxd6 Qh5 43. Qf4 Rcc8 44. Rbe6 1-0`
  },
  {
    id: 'carlsen-topalov-2009-2',
    rank: 11,
    title: 'vs. Topalov, 2nd Pearl Spring 2009',
    event: '2nd Pearl Spring',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'V. Topalov',
    result: '1-0',
    significance: '2nd Pearl Spring, Nanjing CHN, round 2, 2009. Carlsen wins with White in 41 moves. Opening: King\'s Indian Defense: Classical.',
    pgn: `[Event "2nd Pearl Spring"]
[Site "Nanjing CHN"]
[Date "2009.09.29"]
[Round "2"]
[White "Magnus Carlsen"]
[Black "V. Topalov"]
[Result "1-0"]
[WhiteElo "2772"]
[BlackElo "2813"]
[ECO "E90"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. h3 Na6 7. Be3 e5 8. d5 c6 9. g4 Nc5 10. Nd2 a5 11. a3 Nfd7 12. Rg1 a4 13. Qc2 Nb6 14. O-O-O Bd7 15. Kb1 cxd5 16. cxd5 Rc8 17. Bb5 Bxb5 18. Nxb5 Qd7 19. Nc3 Bf6 20. g5 Bd8 21. h4 Na8 22. Bxc5 Rxc5 23. Qxa4 Qc8 24. Rc1 Nb6 25. Qd1 Qh3 26. Qf3 Qd7 27. Qd3 Kg7 28. Rc2 f6 29. gxf6+ Rxf6 30. h5 Rxf2 31. hxg6 h6 32. Nd1 Rxc2 33. Nxf2 Rc8 34. Ng4 Bg5 35. Nf3 Nc4 36. Nxg5 hxg5 37. Ne3 Nxe3 38. Qxe3 Qa4 39. Qxg5 Qxe4+ 40. Ka1 Re8 41. Rc1 1-0`
  },
  {
    id: 'jakovenko-carlsen-2009',
    rank: 12,
    title: 'vs. Jakovenko, 2nd Pearl Spring 2009',
    event: '2nd Pearl Spring',
    year: 2009,
    white: 'D. Jakovenko',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '2nd Pearl Spring, Nanjing CHN, round 4, 2009. Carlsen wins with Black in 63 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "2nd Pearl Spring"]
[Site "Nanjing CHN"]
[Date "2009.10.01"]
[Round "4"]
[White "D. Jakovenko"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2742"]
[BlackElo "2772"]
[ECO "B92"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Be3 Be6 10. Qd2 Nbd7 11. a4 Nb6 12. a5 Nc4 13. Bxc4 Bxc4 14. Rfd1 Rc8 15. f3 Rc6 16. Kh1 Qc8 17. Rac1 Rd8 18. Nd5 Bxd5 19. exd5 Rc4 20. Qd3 e4 21. fxe4 Rxe4 22. c4 Re8 23. Bg1 Bf8 24. Nd4 g6 25. Rf1 Bh6 26. Qf3 Rf4 27. Qd3 Ng4 28. Nf3 Rfe4 29. Rc3 Ne3 30. Re1 Qg4 31. Re2 Qh5 32. Bxe3 Rxe3 33. Rxe3 Bxe3 34. Qe2 Qh6 35. c5 dxc5 36. d6 Re6 37. d7 Bg5 38. Qd1 Bd8 39. Rxc5 Qf8 40. Rd5 Qb4 41. b3 Re3 42. Nd2 Qc3 43. Nf3 Qb4 44. Nd2 Qf4 45. Nf3 Rc3 46. Qe2 Qe3 47. Qxe3 Rxe3 48. Rd4 Kf8 49. Rb4 Rd3 50. Rxb7 Rd1+ 51. Ng1 Bxa5 52. g4 Ke7 53. Kg2 Rxd7 54. Rxd7+ Kxd7 55. Kf3 Kd6 56. Ke4 Kc5 57. Kd3 Kd5 58. Nf3 Bd8 59. h3 h6 60. h4 h5 61. gxh5 gxh5 62. Ke3 Kc5 63. Kd3 Kb4 0-1`
  },
  {
    id: 'carlsen-radjabov-2009',
    rank: 13,
    title: 'vs. Radjabov, 2nd Pearl Spring 2009',
    event: '2nd Pearl Spring',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'T. Radjabov',
    result: '1-0',
    significance: '2nd Pearl Spring, Nanjing CHN, round 5, 2009. Carlsen wins with White in 25 moves. Opening: Sicilian Rossolimo.',
    pgn: `[Event "2nd Pearl Spring"]
[Site "Nanjing CHN"]
[Date "2009.10.02"]
[Round "5"]
[White "Magnus Carlsen"]
[Black "T. Radjabov"]
[Result "1-0"]
[WhiteElo "2772"]
[BlackElo "2757"]
[ECO "B30"]

1. e4 c5 2. Nf3 Nc6 3. Bb5 e6 4. O-O Nge7 5. c3 a6 6. Ba4 b5 7. Bc2 Bb7 8. Qe2 d5 9. e5 d4 10. Be4 Qb6 11. d3 Rd8 12. a4 Nd5 13. axb5 axb5 14. cxd4 cxd4 15. Nbd2 Nf4 16. Qd1 Nb4 17. Nb3 Bxe4 18. dxe4 Nfd3 19. Bg5 Rc8 20. Nfxd4 Nxb2 21. Qe2 Nc4 22. Rfc1 Bc5 23. Nxb5 O-O 24. Nxc5 Nxe5 25. Be7 1-0`
  },
  {
    id: 'leko-carlsen-2009',
    rank: 14,
    title: 'vs. Leko, Tal Memorial 2009',
    event: 'Tal Memorial',
    year: 2009,
    white: 'P. Leko',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'Tal Memorial, Moscow RUS, round 9, 2009. Carlsen wins with Black in 59 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "Tal Memorial"]
[Site "Moscow RUS"]
[Date "2009.11.14"]
[Round "9"]
[White "P. Leko"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2752"]
[BlackElo "2801"]
[ECO "B90"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 Ng4 7. Bg5 h6 8. Bh4 g5 9. Bg3 Bg7 10. h3 Nf6 11. Qf3 Qb6 12. O-O-O Nc6 13. Nxc6 Qxc6 14. Be2 Qc5 15. Rhe1 g4 16. hxg4 Bxg4 17. Qd3 Be6 18. e5 dxe5 19. Bf3 e4 20. Nxe4 Nxe4 21. Rxe4 O-O 22. Qe3 Rac8 23. Qxc5 Rxc5 24. Bg4 Bxg4 25. Rxg4 f5 26. Rb4 b5 27. a4 Rfc8 28. c3 Rc4 29. Rxc4 Rxc4 30. axb5 axb5 31. Rd8+ Kh7 32. Rd7 Rg4 33. Bb8 Rxg2 34. Rxe7 Kg6 35. Bg3 h5 36. Kd1 Bf6 37. Re6 Kf7 38. Re3 h4 39. Bc7 Rxf2 40. b3 Rf1+ 41. Ke2 Rc1 42. c4 bxc4 43. bxc4 Rxc4 44. Bb8 Rc2+ 45. Kf1 Kg6 46. Re2 Rc8 47. Bd6 Rc6 48. Be7 Bxe7 49. Rxe7 Rc2 50. Re3 Kg5 51. Kg1 Kg4 52. Ra3 f4 53. Ra8 Rd2 54. Ra7 Kg3 55. Rg7+ Kf3 56. Ra7 Rd1+ 57. Kh2 Ke2 58. Kh3 f3 59. Ra2+ Rd2 0-1`
  },
  {
    id: 'carlsen-kramnik-2009',
    rank: 15,
    title: 'vs. Kramnik, Chess Classic 2009',
    event: 'Chess Classic',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'V. Kramnik',
    result: '1-0',
    significance: 'Chess Classic, London ENG, round 1, 2009. Carlsen wins with White in 43 moves. Opening: English Opening: Anglo-Indian.',
    pgn: `[Event "Chess Classic"]
[Site "London ENG"]
[Date "2009.12.08"]
[Round "1"]
[White "Magnus Carlsen"]
[Black "V. Kramnik"]
[Result "1-0"]
[WhiteElo "2801"]
[BlackElo "2772"]
[ECO "A29"]

1. c4 Nf6 2. Nc3 e5 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Nb6 7. O-O Be7 8. a3 O-O 9. b4 Be6 10. Rb1 f6 11. d3 a5 12. b5 Nd4 13. Nd2 Qc8 14. e3 Nf5 15. Qc2 Rd8 16. Bb2 a4 17. Rfc1 Nd6 18. Nde4 Ne8 19. Qe2 Bf8 20. f4 exf4 21. gxf4 Qd7 22. d4 c6 23. Nc5 Bxc5 24. dxc5 Nc4 25. Rd1 Qc7 26. Bc1 Na5 27. bxc6 bxc6 28. Nxa4 Rxd1+ 29. Qxd1 Rd8 30. Qc2 Qf7 31. Nc3 Qh5 32. Ne2 Bf5 33. e4 Bg4 34. Ng3 Qf7 35. Bf1 Be6 36. Qc3 Ra8 37. Rb4 Qd7 38. f5 Bf7 39. Bf4 Qd1 40. Kf2 Nb3 41. Be2 Qb1 42. Bc4 Rxa3 43. Ne2 1-0`
  },
  {
    id: 'carlsen-ivanchuk-2010',
    rank: 16,
    title: 'vs. Ivanchuk, Corus A 2010',
    event: 'Corus A',
    year: 2010,
    white: 'Magnus Carlsen',
    black: 'V. Ivanchuk',
    result: '1-0',
    significance: 'Corus A, Wijk aan Zee NED, round 7, 2010. Carlsen wins with White in 35 moves. Opening: Slav Defense.',
    pgn: `[Event "Corus A"]
[Site "Wijk aan Zee NED"]
[Date "2010.01.23"]
[Round "7"]
[White "Magnus Carlsen"]
[Black "V. Ivanchuk"]
[Result "1-0"]
[WhiteElo "2810"]
[BlackElo "2749"]
[ECO "D10"]

1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 a6 5. Qc2 g6 6. Bd3 Be6 7. b3 Bg7 8. Nge2 c5 9. cxd5 Nxd5 10. Nxd5 Bxd5 11. e4 Be6 12. Qxc5 Nc6 13. Be3 Rc8 14. Qa3 O-O 15. Rd1 Nxd4 16. Bxd4 Bxd4 17. Bb1 Bc5 18. b4 Qxd1+ 19. Kxd1 Bxf2 20. Nf4 Bc4 21. Bd3 Rfd8 22. Ke2 Bxd3+ 23. Kxf2 Rc2+ 24. Kf3 Bc4 25. Rc1 Rxa2 26. Qc3 b5 27. Ra1 Rdd2 28. Rxa2 Rxa2 29. h4 h5 30. g4 hxg4+ 31. Kxg4 f6 32. e5 Kf7 33. exf6 exf6 34. Qe3 Rc2 35. Qa7+ 1-0`
  },
  {
    id: 'carlsen-shirov-2010',
    rank: 17,
    title: 'vs. Shirov, Grand Slam Final Masters 2010',
    event: 'Grand Slam Final Masters',
    year: 2010,
    white: 'Magnus Carlsen',
    black: 'A. Shirov',
    result: '1-0',
    significance: 'Grand Slam Final Masters, Bilbao ESP, round 5, 2010. Carlsen wins with White in 65 moves. Opening: Ruy Lopez: Morphy Defense.',
    pgn: `[Event "Grand Slam Final Masters"]
[Site "Bilbao ESP"]
[Date "2010.10.14"]
[Round "5"]
[White "Magnus Carlsen"]
[Black "A. Shirov"]
[Result "1-0"]
[WhiteElo "2826"]
[BlackElo "2749"]
[ECO "C78"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 Bc5 7. a4 Rb8 8. axb5 axb5 9. c3 d6 10. d4 Bb6 11. h3 O-O 12. Re1 h6 13. Na3 exd4 14. cxd4 Na5 15. Bc2 b4 16. Nb5 Ba6 17. Na7 Bb7 18. d5 Ra8 19. Nb5 Nc4 20. Rxa8 Qxa8 21. Nbd4 Qa7 22. b3 Ne5 23. Bb2 Nxf3+ 24. gxf3 Qa2 25. Qc1 Bxd4 26. Bxd4 Nd7 27. Kh1 f6 28. Rg1 Rf7 29. Qd2 Qa8 30. Qxh6 Ne5 31. Bd1 Qe8 32. Qe3 c5 33. Bb2 Re7 34. f4 Nd7 35. Qg3 Qf7 36. Bf3 Ba6 37. Bg4 Nf8 38. Bf5 c4 39. bxc4 Bxc4 40. Qh4 Bxd5 41. f3 Be6 42. Bxf6 Bxf5 43. exf5 Rc7 44. Rxg7+ Qxg7 45. Bxg7 Rxg7 46. f6 Rd7 47. Qe1 d5 48. Qxb4 d4 49. Qc4+ Kh7 50. Qd3+ Kg8 51. f5 Kf7 52. Kg2 Kxf6 53. Kg3 Kg7 54. h4 Nh7 55. Kf2 Nf6 56. Qd2 Nh7 57. Ke1 d3 58. Qg2+ Kh8 59. Kd2 Nf8 60. Qg5 Kh7 61. h5 Kh8 62. f6 Kh7 63. f4 Kh8 64. h6 Kh7 65. f5 1-0`
  },
  {
    id: 'carlsen-topalov-2010',
    rank: 18,
    title: 'vs. Topalov, 3rd Pearl Spring 2010',
    event: '3rd Pearl Spring',
    year: 2010,
    white: 'Magnus Carlsen',
    black: 'V. Topalov',
    result: '1-0',
    significance: '3rd Pearl Spring, Nanjing CHN, round 5, 2010. Carlsen wins with White in 32 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "3rd Pearl Spring"]
[Site "Nanjing CHN"]
[Date "2010.10.24"]
[Round "5"]
[White "Magnus Carlsen"]
[Black "V. Topalov"]
[Result "1-0"]
[WhiteElo "2826"]
[BlackElo "2803"]
[ECO "C84"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d3 b5 7. Bb3 d6 8. a4 Rb8 9. axb5 axb5 10. Nbd2 O-O 11. Re1 Bd7 12. c3 Ra8 13. Rxa8 Qxa8 14. d4 h6 15. Nf1 Re8 16. Ng3 Qc8 17. Nh4 Bf8 18. Ng6 Na5 19. Nxf8 Rxf8 20. Bc2 Re8 21. f4 Bg4 22. Qd3 exf4 23. Bxf4 Nc4 24. Bc1 c5 25. Rf1 cxd4 26. cxd4 Qd8 27. h3 Be6 28. b3 Qa5 29. Kh2 Nh7 30. e5 g6 31. d5 Nxe5 32. dxe6 1-0`
  },
  {
    id: 'topalov-carlsen-2010',
    rank: 19,
    title: 'vs. Topalov, 3rd Pearl Spring 2010',
    event: '3rd Pearl Spring',
    year: 2010,
    white: 'V. Topalov',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '3rd Pearl Spring, Nanjing CHN, round 9, 2010. Carlsen wins with Black in 33 moves. Opening: Catalan Opening.',
    pgn: `[Event "3rd Pearl Spring"]
[Site "Nanjing CHN"]
[Date "2010.10.29"]
[Round "9"]
[White "V. Topalov"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2803"]
[BlackElo "2826"]
[ECO "E00"]

1. d4 Nf6 2. c4 e6 3. g3 Bb4+ 4. Bd2 Bxd2+ 5. Qxd2 d5 6. Bg2 c6 7. Nf3 Nbd7 8. O-O b6 9. Rc1 O-O 10. b4 Bb7 11. Qb2 Rb8 12. Nbd2 Qe7 13. e3 Rfc8 14. Rc2 c5 15. bxc5 bxc5 16. Qa3 Rc6 17. Rac1 Ra6 18. Qd3 h6 19. Qe2 dxc4 20. Qxc4 cxd4 21. Nxd4 Rb6 22. Bxb7 R8xb7 23. Kg2 Ne5 24. Qc5 Qxc5 25. Rxc5 Rb2 26. R1c2 Nd3 27. Rc8+ Kh7 28. N4f3 a5 29. h3 a4 30. a3 g5 31. Rxb2 Rxb2 32. Rc3 Nxf2 33. Rc7 N2e4 0-1`
  },
  {
    id: 'carlsen-adams-2010',
    rank: 20,
    title: 'vs. Adams, 2nd London Chess Classic 2010',
    event: '2nd London Chess Classic',
    year: 2010,
    white: 'Magnus Carlsen',
    black: 'M. Adams',
    result: '1-0',
    significance: '2nd London Chess Classic, London ENG, round 2, 2010. Carlsen wins with White in 49 moves. Opening: English Opening: Anglo-Indian.',
    pgn: `[Event "2nd London Chess Classic"]
[Site "London ENG"]
[Date "2010.12.09"]
[Round "2"]
[White "Magnus Carlsen"]
[Black "M. Adams"]
[Result "1-0"]
[WhiteElo "2802"]
[BlackElo "2723"]
[ECO "A29"]

1. c4 Nf6 2. Nc3 e5 3. Nf3 Nc6 4. g3 Bc5 5. Bg2 d6 6. O-O O-O 7. d3 a6 8. a3 Ba7 9. b4 Be6 10. Nd2 Rb8 11. Rb1 Ne7 12. a4 Qd7 13. b5 Bh3 14. Ba3 h6 15. e3 Bxg2 16. Kxg2 Bc5 17. Bxc5 dxc5 18. Nf3 Qe6 19. e4 c6 20. Qb3 Rbd8 21. bxa6 bxa6 22. Qc2 Ng6 23. Ng1 Rb8 24. a5 Nd7 25. Na4 Qd6 26. Ne2 Qc7 27. Qc3 Rfd8 28. Rxb8 Rxb8 29. f4 exf4 30. gxf4 Qd6 31. Kh1 Rb4 32. Qc2 Nh4 33. Nac3 Qg6 34. Ng3 Nf6 35. e5 Nh5 36. Nxh5 Qxh5 37. Ne4 Kh8 38. Qf2 Nf5 39. Nxc5 Qh3 40. Re1 Nh4 41. Qg3 Qxg3 42. hxg3 Nf3 43. Rf1 Nd4 44. Kg2 Ne6 45. Nxa6 Ra4 46. f5 Ng5 47. Nc7 Kg8 48. a6 Kf8 49. Kf2 1-0`
  },
  {
    id: 'carlsen-gelfand-2011',
    rank: 21,
    title: 'vs. Gelfand, 6th Tal Memorial 2011',
    event: '6th Tal Memorial',
    year: 2011,
    white: 'Magnus Carlsen',
    black: 'B. Gelfand',
    result: '1-0',
    significance: '6th Tal Memorial, Moscow RUS, round 2, 2011. Carlsen wins with White in 38 moves. Opening: Slav Defense: Main Line.',
    pgn: `[Event "6th Tal Memorial"]
[Site "Moscow RUS"]
[Date "2011.11.17"]
[Round "2"]
[White "Magnus Carlsen"]
[Black "B. Gelfand"]
[Result "1-0"]
[WhiteElo "2826"]
[BlackElo "2744"]
[ECO "D12"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bf5 5. Nc3 e6 6. Nh4 Bg6 7. Nxg6 hxg6 8. Bd3 Nbd7 9. O-O Bd6 10. h3 dxc4 11. Bxc4 Nb6 12. Bb3 e5 13. Qc2 Qe7 14. Bd2 O-O-O 15. d5 e4 16. dxc6 Qe5 17. f4 exf3 18. Rxf3 Ng4 19. cxb7+ Kb8 20. hxg4 Rh1+ 21. Kf2 Rxa1 22. Ne2 Bc5 23. Bc3 Qe7 24. g5 Rdd1 25. Ng3 Bd6 26. Qe2 Rg1 27. Qd3 Bc7 28. Ne4 Raf1+ 29. Ke2 Rxf3 30. gxf3 f5 31. gxf6 gxf6 32. Bxf6 Qh7 33. Qb5 Rg2+ 34. Kd3 Qd7+ 35. Qxd7 Nxd7 36. Bd5 Be5 37. f4 Bc7 38. Bc6 1-0`
  },
  {
    id: 'carlsen-adams-2011',
    rank: 22,
    title: 'vs. Adams, 3rd London Chess Classic 2011',
    event: '3rd London Chess Classic',
    year: 2011,
    white: 'Magnus Carlsen',
    black: 'M. Adams',
    result: '1-0',
    significance: '3rd London Chess Classic, London ENG, round 7, 2011. Carlsen wins with White in 38 moves. Opening: Nimzo-Indian Defense.',
    pgn: `[Event "3rd London Chess Classic"]
[Site "London ENG"]
[Date "2011.12.10"]
[Round "7"]
[White "Magnus Carlsen"]
[Black "M. Adams"]
[Result "1-0"]
[WhiteElo "2826"]
[BlackElo "2734"]
[ECO "E21"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 b6 5. Qc2 Bb7 6. a3 Bxc3+ 7. Qxc3 d5 8. cxd5 Qxd5 9. e3 Nbd7 10. b4 O-O 11. Bb2 a5 12. Bd3 axb4 13. axb4 Rxa1+ 14. Bxa1 Qa2 15. O-O Nd5 16. Qe1 c5 17. dxc5 bxc5 18. b5 Ra8 19. Qc1 h6 20. h3 Qa3 21. Qd2 Qb4 22. Qc2 Qa4 23. Qb2 f6 24. Rc1 Nb4 25. Be2 Bxf3 26. gxf3 Nd5 27. f4 N7b6 28. Bg4 Kf7 29. Qb1 Qa3 30. Rd1 f5 31. Bf3 Ra4 32. Be5 Qb4 33. Qd3 Ra3 34. Qf1 g6 35. h4 Nc4 36. Rxd5 Nxe5 37. Rxe5 Qc3 38. Kg2 1-0`
  },
  {
    id: 'radjabov-carlsen-2012',
    rank: 23,
    title: 'vs. Radjabov, 7th Mikhail Tal Memorial 2012',
    event: '7th Mikhail Tal Memorial',
    year: 2012,
    white: 'T. Radjabov',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '7th Mikhail Tal Memorial, Moscow RUS, round 5, 2012. Carlsen wins with Black in 59 moves. Opening: Scotch Game: Classical.',
    pgn: `[Event "7th Mikhail Tal Memorial"]
[Site "Moscow RUS"]
[Date "2012.06.13"]
[Round "5"]
[White "T. Radjabov"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2784"]
[BlackElo "2835"]
[ECO "C45"]

1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Nxc6 Qf6 6. Qf3 bxc6 7. Qg3 d6 8. Nc3 Qg6 9. Bd3 Nf6 10. Na4 Bd4 11. c3 Bb6 12. O-O Qxg3 13. hxg3 Ng4 14. Bf4 f6 15. Rad1 h5 16. Be2 Be6 17. Nxb6 axb6 18. a3 Ke7 19. f3 Ne5 20. Kf2 b5 21. Bxe5 fxe5 22. Ke3 h4 23. gxh4 Rxh4 24. Rh1 Rah8 25. Rxh4 Rxh4 26. Rc1 Rh2 27. Kf2 Rh8 28. Ke3 g5 29. Bd3 Kd7 30. Ra1 Bb3 31. Rc1 Kc8 32. Kf2 Kb7 33. Kg3 Be6 34. Ra1 Kb6 35. Rc1 c5 36. Ra1 c4 37. Bc2 Kc5 38. Re1 c6 39. Bb1 Kb6 40. Bc2 Kc7 41. Kf2 Kd7 42. a4 bxa4 43. Ra1 Rb8 44. Ra2 d5 45. exd5 cxd5 46. Bxa4+ Kd6 47. Bc2 d4 48. Be4 Rb6 49. Ke2 g4 50. fxg4 Bxg4+ 51. Kd2 Be6 52. Kc2 Bd5 53. Bxd5 d3+ 54. Kd2 Kxd5 55. Ke3 Rg6 56. Ra5+ Ke6 57. Ke4 Rg4+ 58. Kf3 Rf4+ 59. Ke3 Rf1 0-1`
  },
  {
    id: 'bologan-carlsen-2012',
    rank: 24,
    title: 'vs. Bologan, 45th Biel GM 2012',
    event: '45th Biel GM',
    year: 2012,
    white: 'V. Bologan',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '45th Biel GM, Biel SUI, round 3, 2012. Carlsen wins with Black in 40 moves. Opening: Sicilian Rossolimo.',
    pgn: `[Event "45th Biel GM"]
[Site "Biel SUI"]
[Date "2012.07.29"]
[Round "3"]
[White "V. Bologan"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2732"]
[BlackElo "2837"]
[ECO "B30"]

1. e4 c5 2. Nf3 Nc6 3. Bb5 d6 4. O-O Bd7 5. Re1 Nf6 6. h3 e6 7. c3 d5 8. d3 a6 9. Ba4 b5 10. Bc2 dxe4 11. dxe4 e5 12. a4 Be7 13. axb5 axb5 14. Rxa8 Qxa8 15. Bg5 Be6 16. Na3 b4 17. Nb1 O-O 18. Ba4 h6 19. Bh4 Rd8 20. Nbd2 g5 21. Bg3 Nd7 22. Bb3 Nf8 23. Qc2 f6 24. Nc4 Qa6 25. Qe2 Rb8 26. Ne3 Qxe2 27. Bxe6+ Nxe6 28. Rxe2 Ra8 29. h4 Ra2 30. Kf1 Kf7 31. Bh2 Na5 32. hxg5 hxg5 33. Rd2 b3 34. Bxe5 g4 35. Nxg4 Nc4 36. Re2 Nxb2 37. Nd2 c4 38. Bg3 Nd3 39. f4 Nexf4 40. Bxf4 Ra1+ 0-1`
  },
  {
    id: 'carlsen-bologan-2012',
    rank: 25,
    title: 'vs. Bologan, 45th Biel GM 2012',
    event: '45th Biel GM',
    year: 2012,
    white: 'Magnus Carlsen',
    black: 'V. Bologan',
    result: '1-0',
    significance: '45th Biel GM, Biel SUI, round 8, 2012. Carlsen wins with White in 40 moves. Opening: Benko Gambit: Accepted.',
    pgn: `[Event "45th Biel GM"]
[Site "Biel SUI"]
[Date "2012.07.31"]
[Round "8"]
[White "Magnus Carlsen"]
[Black "V. Bologan"]
[Result "1-0"]
[WhiteElo "2837"]
[BlackElo "2732"]
[ECO "A59"]

1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 g6 6. Nc3 Bxa6 7. e4 Bxf1 8. Kxf1 d6 9. Nf3 Bg7 10. g3 O-O 11. Kg2 Nbd7 12. Qe2 Qb6 13. a4 Rfb8 14. Nb5 Ne8 15. Bg5 Qd8 16. Ra3 Nb6 17. b3 Qd7 18. Ra2 f6 19. Bc1 f5 20. exf5 gxf5 21. Rd1 Nf6 22. Qe6+ Qxe6 23. dxe6 Ne4 24. Nh4 c4 25. bxc4 Nxc4 26. Nc7 Nc3 27. Nxa8 Nxa2 28. Nc7 Nc3 29. Rd3 Rc8 30. Nb5 Nxb5 31. axb5 Rc5 32. Rb3 Na5 33. Rb1 Bd4 34. b6 Nb7 35. Rb4 Bxf2 36. Kxf2 Rc2+ 37. Kf3 Rxc1 38. Nxf5 Rf1+ 39. Kg4 Nc5 40. b7 1-0`
  },
  {
    id: 'carlsen-anand-2012',
    rank: 26,
    title: 'vs. Anand, 5th Final Masters 2012',
    event: '5th Final Masters',
    year: 2012,
    white: 'Magnus Carlsen',
    black: 'V. Anand',
    result: '1-0',
    significance: '5th Final Masters, Sao Paulo/Bilbao BRA/ESP, round 9, 2012. Carlsen wins with White in 30 moves. Opening: Sicilian Defense.',
    pgn: `[Event "5th Final Masters"]
[Site "Sao Paulo/Bilbao BRA/ESP"]
[Date "2012.10.12"]
[Round "9"]
[White "Magnus Carlsen"]
[Black "V. Anand"]
[Result "1-0"]
[WhiteElo "2843"]
[BlackElo "2780"]
[ECO "B52"]

1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7 4. Bxd7+ Qxd7 5. c4 Nf6 6. Nc3 g6 7. d4 cxd4 8. Nxd4 Bg7 9. f3 Qc7 10. b3 Qa5 11. Bb2 Nc6 12. O-O O-O 13. Nce2 Rfd8 14. Bc3 Qb6 15. Kh1 d5 16. Nxc6 bxc6 17. Qe1 Rdc8 18. e5 Ne8 19. e6 fxe6 20. Nf4 Bxc3 21. Qxc3 d4 22. Qd2 c5 23. Rae1 Ng7 24. g4 Rc6 25. Nh3 Ne8 26. Qh6 Nf6 27. Ng5 d3 28. Re5 Kh8 29. Rd1 Qa6 30. a4 1-0`
  },
  {
    id: 'carlsen-aronian-2012',
    rank: 27,
    title: 'vs. Aronian, 4th London Chess Classic 2012',
    event: '4th London Chess Classic',
    year: 2012,
    white: 'Magnus Carlsen',
    black: 'L. Aronian',
    result: '1-0',
    significance: '4th London Chess Classic, London ENG, 2012. Carlsen wins with White in 59 moves. Opening: Ruy Lopez: Morphy Defense.',
    pgn: `[Event "4th London Chess Classic"]
[Site "London ENG"]
[Date "2012.12.02"]
[Round "2.1"]
[White "Magnus Carlsen"]
[Black "L. Aronian"]
[Result "1-0"]
[WhiteElo "2848"]
[BlackElo "2815"]
[ECO "C77"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. d3 b5 6. Bb3 Bc5 7. Nc3 O-O 8. Nd5 Nxd5 9. Bxd5 Rb8 10. O-O Ne7 11. Nxe5 Nxd5 12. exd5 Re8 13. d4 Bf8 14. b3 Bb7 15. c4 d6 16. Nf3 Qf6 17. Be3 Bc8 18. Qd2 Qg6 19. Kh1 h6 20. Rac1 Be7 21. Ng1 Bg5 22. Bxg5 Qxg5 23. Rfd1 bxc4 24. bxc4 Qxd2 25. Rxd2 a5 26. h3 Rb4 27. Nf3 Bf5 28. c5 Kf8 29. Nh2 Reb8 30. Ng4 Rb1 31. Rxb1 Rxb1+ 32. Kh2 a4 33. Ne3 Bg6 34. Kg3 Rb4 35. Kf3 Ke7 36. Ke2 Kd7 37. f3 Rb5 38. Nd1 Rb4 39. c6+ Kc8 40. Nc3 f6 41. Ke3 Rc4 42. Ne2 a3 43. h4 Rb4 44. g4 Rb1 45. h5 Bh7 46. f4 f5 47. g5 Rh1 48. Ng3 Rh3 49. Kf3 hxg5 50. fxg5 g6 51. Re2 Kd8 52. hxg6 Bxg6 53. Re6 Bf7 54. g6 Bg8 55. g7 f4 56. Kxf4 Rh2 57. Nf5 Rxa2 58. Rf6 Re2 59. Rf8+ 1-0`
  },
  {
    id: 'gelfand-carlsen-2013',
    rank: 28,
    title: 'vs. Gelfand, FIDE Candidates 2013',
    event: 'FIDE Candidates',
    year: 2013,
    white: 'B. Gelfand',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'FIDE Candidates, London ENG, 2013. Carlsen wins with Black in 57 moves. Opening: Indian Game.',
    pgn: `[Event "FIDE Candidates"]
[Site "London ENG"]
[Date "2013.03.17"]
[Round "3.3"]
[White "B. Gelfand"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2740"]
[BlackElo "2872"]
[ECO "D52"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Nbd7 5. Bg5 c6 6. e3 Qa5 7. cxd5 Nxd5 8. Rc1 Nxc3 9. bxc3 Ba3 10. Rc2 b6 11. Bd3 Ba6 12. O-O Bxd3 13. Qxd3 O-O 14. e4 Rfe8 15. e5 h6 16. Bh4 c5 17. Nd2 cxd4 18. cxd4 Rac8 19. Nc4 Qb5 20. f4 Rc7 21. Qxa3 Rxc4 22. Rxc4 Qxc4 23. Bf2 Qc7 24. Rc1 Qb7 25. Qd6 Nf8 26. g3 Rc8 27. Rxc8 Qxc8 28. d5 exd5 29. Qxd5 g6 30. Kg2 Ne6 31. Qf3 Kg7 32. a3 h5 33. h4 Qc2 34. Qb7 Qa4 35. Qf3 b5 36. f5 gxf5 37. Qxf5 Qxa3 38. Qxh5 a5 39. Qg4+ Kf8 40. h5 Qc1 41. Qe4 b4 42. Be3 Qc7 43. Qa8+ Kg7 44. h6+ Kh7 45. Qe4+ Kg8 46. Qa8+ Qd8 47. Qxd8+ Nxd8 48. Kf3 a4 49. Ke4 Nc6 50. Bc1 Na5 51. Bd2 b3 52. Kd3 Nc4 53. Bc3 a3 54. g4 Kh7 55. g5 Kg6 56. Bd4 b2 57. Kc2 Nd2 0-1`
  },
  {
    id: 'carlsen-grischuk-2013',
    rank: 29,
    title: 'vs. Grischuk, FIDE Candidates 2013',
    event: 'FIDE Candidates',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'A. Grischuk',
    result: '1-0',
    significance: 'FIDE Candidates, London ENG, 2013. Carlsen wins with White in 37 moves. Opening: Ruy Lopez: Berlin Defense.',
    pgn: `[Event "FIDE Candidates"]
[Site "London ENG"]
[Date "2013.03.19"]
[Round "4.4"]
[White "Magnus Carlsen"]
[Black "A. Grischuk"]
[Result "1-0"]
[WhiteElo "2872"]
[BlackElo "2764"]
[ECO "C65"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. O-O d6 7. h3 a6 8. Bxc6 bxc6 9. Re1 Re8 10. Nbd2 d5 11. exd5 Qxd5 12. Nb3 Bf8 13. c4 Qd6 14. Be3 Nd7 15. d4 e4 16. Nfd2 a5 17. a4 f5 18. c5 Qg6 19. Nc4 Nf6 20. Bf4 Nd5 21. Qd2 Be6 22. Nbxa5 Reb8 23. Ne5 Qf6 24. Bh2 Rxa5 25. Qxa5 Rxb2 26. Rab1 Ra2 27. Qa6 e3 28. fxe3 Qg5 29. Re2 Nxe3 30. Nf3 Qg6 31. Rxa2 Bxa2 32. Rb2 Bc4 33. Qa5 Bd5 34. Qe1 f4 35. Bxf4 Nc2 36. Qf2 Bxf3 37. Rxc2 1-0`
  },
  {
    id: 'svidler-carlsen-2013',
    rank: 30,
    title: 'vs. Svidler, FIDE Candidates 2013',
    event: 'FIDE Candidates',
    year: 2013,
    white: 'P. Svidler',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'FIDE Candidates, London ENG, 2013. Carlsen wins with Black in 36 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "FIDE Candidates"]
[Site "London ENG"]
[Date "2013.03.21"]
[Round "6.2"]
[White "P. Svidler"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2747"]
[BlackElo "2872"]
[ECO "C84"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d3 b5 7. Bb3 d6 8. a4 b4 9. Nbd2 O-O 10. a5 Be6 11. Nc4 Rb8 12. c3 bxc3 13. bxc3 h6 14. Re1 Qc8 15. Bc2 Rd8 16. Qe2 Bf8 17. Ne3 d5 18. exd5 Nxd5 19. Nxd5 Rxd5 20. h3 Bf5 21. Rd1 Qe6 22. Bb1 Qd7 23. Be3 e4 24. Nd4 Nxd4 25. Bxd4 exd3 26. Bxd3 Bxd3 27. Rxd3 c5 28. Be5 Rxd3 29. Bxb8 c4 30. Be5 Bc5 31. Rb1 Qd5 32. Rb8+ Kh7 33. Qh5 Qe4 34. Rb2 Rd5 35. Re2 Qb1+ 36. Kh2 f6 0-1`
  },
  {
    id: 'carlsen-gelfand-2013',
    rank: 31,
    title: 'vs. Gelfand, FIDE Candidates 2013',
    event: 'FIDE Candidates',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'B. Gelfand',
    result: '1-0',
    significance: 'FIDE Candidates, London ENG, 2013. Carlsen wins with White in 48 moves. Opening: Sicilian Rossolimo.',
    pgn: `[Event "FIDE Candidates"]
[Site "London ENG"]
[Date "2013.03.27"]
[Round "10.2"]
[White "Magnus Carlsen"]
[Black "B. Gelfand"]
[Result "1-0"]
[WhiteElo "2872"]
[BlackElo "2740"]
[ECO "B30"]

1. e4 c5 2. Nf3 Nc6 3. Bb5 e6 4. O-O Nge7 5. Re1 a6 6. Bf1 d5 7. exd5 Nxd5 8. d4 Nf6 9. Be3 cxd4 10. Nxd4 Bd7 11. c4 Nxd4 12. Bxd4 Bc6 13. Nc3 Be7 14. a3 a5 15. Qd3 O-O 16. Rad1 Qc7 17. Be5 Qb6 18. Qg3 Rfd8 19. Rxd8+ Qxd8 20. Rd1 Qb6 21. Bd4 Qb3 22. Rd3 Qc2 23. b4 axb4 24. axb4 Nh5 25. Qe5 Bf6 26. Qxh5 Bxd4 27. Rxd4 Qxc3 28. Qa5 Rf8 29. Qb6 e5 30. Rd1 g6 31. b5 Be4 32. Qf6 h5 33. h4 Bf5 34. Rd5 Qc1 35. Qxe5 Be6 36. Rd4 Ra8 37. Qe2 Kh7 38. Rd1 Qc3 39. Qe4 Ra1 40. Rxa1 Qxa1 41. c5 Qc3 42. Qxb7 Qe1 43. b6 Bc4 44. Qf3 Qxf1+ 45. Kh2 Qb1 46. b7 Qb5 47. c6 Bd5 48. Qg3 1-0`
  },
  {
    id: 'radjabov-carlsen-2013',
    rank: 32,
    title: 'vs. Radjabov, FIDE Candidates 2013',
    event: 'FIDE Candidates',
    year: 2013,
    white: 'T. Radjabov',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'FIDE Candidates, London ENG, 2013. Carlsen wins with Black in 89 moves. Opening: Nimzo-Indian Defense: Classical.',
    pgn: `[Event "FIDE Candidates"]
[Site "London ENG"]
[Date "2013.03.31"]
[Round "13.1"]
[White "T. Radjabov"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2793"]
[BlackElo "2872"]
[ECO "E32"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d6 5. Nf3 Nbd7 6. g3 O-O 7. Bg2 e5 8. O-O c6 9. Rd1 Re8 10. dxe5 dxe5 11. a3 Bxc3 12. Qxc3 Qe7 13. b4 Nb6 14. Be3 Ng4 15. Nd2 f5 16. h3 Nxe3 17. Qxe3 e4 18. Rac1 Be6 19. Qc3 Rad8 20. Bf1 c5 21. bxc5 Na4 22. Qb4 Nxc5 23. Nb3 Rxd1 24. Rxd1 Na6 25. Qxe7 Rxe7 26. e3 Kf7 27. Be2 b6 28. Rd8 Nc5 29. Nd4 Kf6 30. Kf1 Rd7 31. Rf8+ Bf7 32. Ke1 g6 33. h4 h6 34. Rc8 Be6 35. Rf8+ Rf7 36. Rh8 Rc7 37. Nb5 Rd7 38. Nd4 h5 39. Rf8+ Bf7 40. Rc8 Ke5 41. Ra8 a6 42. Rc8 Rd6 43. Nc6+ Kf6 44. Nd4 Be6 45. Rf8+ Ke7 46. Ra8 Rd7 47. Rb8 Rb7 48. Rxb7+ Nxb7 49. Kd2 Kd6 50. Kc3 Bf7 51. Nb3 Ke5 52. Bf1 a5 53. Be2 Be6 54. Bf1 Bd7 55. Be2 Ba4 56. Nd4 Nc5 57. Kb2 Be8 58. Kc3 Bf7 59. Nc6+ Kd6 60. Nd4 Nd7 61. Nb5+ Kc5 62. Nd4 Ne5 63. Nb3+ Kc6 64. a4 Kd7 65. Nd4 Kd6 66. Nb5+ Kc5 67. Nd4 Be8 68. Nb3+ Kd6 69. c5+ Kc7 70. Kd4 Nc6+ 71. Kc3 Ne7 72. cxb6+ Kxb6 73. Nd2 Bxa4 74. Nc4+ Ka6 75. Na3+ Kb7 76. Nc4 Ka6 77. Na3+ Ka7 78. Kd4 Nc6+ 79. Kc5 Ne5 80. Nc4 Nd3+ 81. Kd4 Nc1 82. Bf1 Bb5 83. Nxa5 Bxf1 84. Nc6+ Kb6 85. Ne7 Nd3 86. Nxg6 Kc7 87. Ne7 Bh3 88. Nd5+ Kd6 89. Nf6 Bg4 0-1`
  },
  {
    id: 'carlsen-anand-2013',
    rank: 33,
    title: 'The Crowning',
    event: 'WCh 2013',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'V. Anand',
    result: '1-0',
    significance: 'Game 5 - The moment Carlsen became World Champion for the first time, displaying masterful endgame technique.',
    pgn: `[Event "WCh 2013"]
[Site "Chennai IND"]
[Date "2013.11.15"]
[Round "5"]
[White "Magnus Carlsen"]
[Black "V. Anand"]
[Result "1-0"]
[WhiteElo "2870"]
[BlackElo "2775"]
[ECO "D31"]

1. c4 e6 2. d4 d5 3. Nc3 c6 4. e4 dxe4 5. Nxe4 Bb4+ 6. Nc3 c5 7. a3 Ba5 8. Nf3 Nf6 9. Be3 Nc6 10. Qd3 cxd4 11. Nxd4 Ng4 12. O-O-O Nxe3 13. fxe3 Bc7 14. Nxc6 bxc6 15. Qxd8+ Bxd8 16. Be2 Ke7 17. Bf3 Bd7 18. Ne4 Bb6 19. c5 f5 20. cxb6 fxe4 21. b7 Rab8 22. Bxe4 Rxb7 23. Rhf1 Rb5 24. Rf4 g5 25. Rf3 h5 26. Rdf1 Be8 27. Bc2 Rc5 28. Rf6 h4 29. e4 a5 30. Kd2 Rb5 31. b3 Bh5 32. Kc3 Rc5+ 33. Kb2 Rd8 34. R1f2 Rd4 35. Rh6 Bd1 36. Bb1 Rb5 37. Kc3 c5 38. Rb2 e5 39. Rg6 a4 40. Rxg5 Rxb3+ 41. Rxb3 Bxb3 42. Rxe5+ Kd6 43. Rh5 Rd1 44. e5+ Kd5 45. Bh7 Rc1+ 46. Kb2 Rg1 47. Bg8+ Kc6 48. Rh6+ Kd7 49. Bxb3 axb3 50. Kxb3 Rxg2 51. Rxh4 Ke6 52. a4 Kxe5 53. a5 Kd6 54. Rh7 Kd5 55. a6 c4+ 56. Kc3 Ra2 57. a7 Kc5 58. h4 1-0`
  },
  {
    id: 'anand-carlsen-2013',
    rank: 34,
    title: 'The Anand Showdown',
    event: 'WCh 2013',
    year: 2013,
    white: 'V. Anand',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'Game 9 - Carlsen defends brilliantly and clinches the world title.',
    pgn: `[Event "WCh 2013"]
[Site "Chennai IND"]
[Date "2013.11.21"]
[Round "9"]
[White "V. Anand"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2775"]
[BlackElo "2870"]
[ECO "E25"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. f3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5 exd5 8. e3 c4 9. Ne2 Nc6 10. g4 O-O 11. Bg2 Na5 12. O-O Nb3 13. Ra2 b5 14. Ng3 a5 15. g5 Ne8 16. e4 Nxc1 17. Qxc1 Ra6 18. e5 Nc7 19. f4 b4 20. axb4 axb4 21. Rxa6 Nxa6 22. f5 b3 23. Qf4 Nc7 24. f6 g6 25. Qh4 Ne8 26. Qh6 b2 27. Rf4 b1=Q+ 28. Nf1 Qe1 0-1`
  },
  {
    id: 'carlsen-gelfand-2014',
    rank: 35,
    title: 'vs. Gelfand, Zurich Chess Challenge 2014',
    event: 'Zurich Chess Challenge 2014',
    year: 2014,
    white: 'Magnus Carlsen',
    black: 'B. Gelfand',
    result: '1-0',
    significance: 'Zurich Chess Challenge 2014, Zurich SUI, 2014. Carlsen wins with White in 37 moves. Opening: English Opening.',
    pgn: `[Event "Zurich Chess Challenge 2014"]
[Site "Zurich SUI"]
[Date "2014.01.30"]
[Round "1.1"]
[White "Magnus Carlsen"]
[Black "B. Gelfand"]
[Result "1-0"]
[WhiteElo "2872"]
[BlackElo "2777"]
[ECO "E60"]

1. c4 g6 2. d4 Nf6 3. Nf3 Bg7 4. g3 c6 5. Bg2 d5 6. Qa4 O-O 7. O-O Nfd7 8. Qc2 Nf6 9. Bf4 Bf5 10. Qb3 Qb6 11. Nbd2 Ne4 12. e3 Qxb3 13. axb3 Na6 14. cxd5 cxd5 15. g4 Bxg4 16. Nxe4 dxe4 17. Nd2 f5 18. f3 e5 19. dxe5 exf3 20. Nxf3 Rae8 21. Ra5 Nb4 22. Nd4 b6 23. Rxa7 Bxe5 24. Bh6 Rf6 25. h3 Bh5 26. Nc2 g5 27. Bxg5 Rg6 28. Rxf5 h6 29. Bxh6 Rxh6 30. Nxb4 Bxb2 31. Nd5 Kh8 32. Rb7 Bd1 33. b4 Rg8 34. Ne7 Rd8 35. Be4 Bf6 36. Rxb6 Kg7 37. Rf2 1-0`
  },
  {
    id: 'nakamura-carlsen-2014',
    rank: 36,
    title: 'vs. Nakamura, Zurich Chess Challenge 2014',
    event: 'Zurich Chess Challenge 2014',
    year: 2014,
    white: 'H. Nakamura',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'Zurich Chess Challenge 2014, Zurich SUI, 2014. Carlsen wins with Black in 61 moves. Opening: Nimzo-Indian Defense.',
    pgn: `[Event "Zurich Chess Challenge 2014"]
[Site "Zurich SUI"]
[Date "2014.02.01"]
[Round "3.2"]
[White "H. Nakamura"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2789"]
[BlackElo "2872"]
[ECO "E20"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. f3 d5 5. a3 Be7 6. e4 dxe4 7. fxe4 e5 8. d5 Bc5 9. Bg5 O-O 10. Nf3 Bg4 11. h3 Bxf3 12. Qxf3 Nbd7 13. O-O-O Bd4 14. Ne2 c5 15. g4 a5 16. Kb1 Ra6 17. Ng3 g6 18. h4 a4 19. Rh2 Qa5 20. Bd2 Qc7 21. g5 Ne8 22. h5 Rb6 23. Bc1 Rb3 24. Qg4 Nb6 25. Be2 Nd6 26. Rdh1 Bxb2 27. Bxb2 Nbxc4 28. Bxc4 Nxc4 29. hxg6 Qb6 30. g7 Rd8 31. Qh4 Rxb2+ 32. Ka1 Rxh2 33. Rxh2 Qg6 34. Nf5 Re8 35. Qg4 Qb6 36. Qh3 Qg6 37. d6 Nxd6 38. Nxd6 Rd8 39. Nc4 Qxe4 40. Qh5 Rd3 41. Rh4 Qf5 42. Qe2 b5 43. Nd2 Qxg5 44. Qxd3 Qxh4 45. Ne4 Kxg7 46. Qf3 Qf4 47. Qg2+ Kf8 48. Kb2 h5 49. Nd2 h4 50. Kc2 b4 51. axb4 cxb4 52. Qa8+ Kg7 53. Qxa4 h3 54. Qb3 h2 55. Qd5 e4 56. Qh5 e3 57. Nf3 e2 58. Kb3 f6 59. Ne1 Qg3+ 60. Ka4 Qg1 61. Qxe2 Qa7+ 0-1`
  },
  {
    id: 'carlsen-mamedyarov-2014',
    rank: 37,
    title: 'vs. Mamedyarov, Vugar Gashimov Mem 2014',
    event: 'Vugar Gashimov Mem 2014',
    year: 2014,
    white: 'Magnus Carlsen',
    black: 'S. Mamedyarov',
    result: '1-0',
    significance: 'Vugar Gashimov Mem 2014, Shamkir AZE, 2014. Carlsen wins with White in 47 moves. Opening: Slav Defense: Three Knights.',
    pgn: `[Event "Vugar Gashimov Mem 2014"]
[Site "Shamkir AZE"]
[Date "2014.04.20"]
[Round "1.1"]
[White "Magnus Carlsen"]
[Black "S. Mamedyarov"]
[Result "1-0"]
[WhiteElo "2881"]
[BlackElo "2760"]
[ECO "D52"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 Nbd7 6. e3 Qa5 7. cxd5 Nxd5 8. Rc1 Nxc3 9. bxc3 Ba3 10. Rc2 b6 11. Be2 Ba6 12. O-O Bxe2 13. Qxe2 O-O 14. e4 Rac8 15. e5 Qa4 16. c4 Rfe8 17. Rd1 c5 18. d5 exd5 19. Rxd5 Nf8 20. h4 h6 21. Be3 Ng6 22. Qd3 Re6 23. h5 Ne7 24. Rd6 Bb4 25. Rc1 Re8 26. Rxe6 fxe6 27. Nh4 Qc6 28. a3 Ba5 29. Rd1 Qc7 30. Ng6 Nxg6 31. Qxg6 Qf7 32. Rd3 a6 33. a4 Rf8 34. g4 Qe8 35. Rd6 Qxa4 36. Qxe6+ Kh8 37. Bxh6 Qa1+ 38. Kg2 Rxf2+ 39. Kxf2 Qe1+ 40. Kg2 Qe4+ 41. Kh3 Qh1+ 42. Kg3 Qe1+ 43. Kf4 Bd2+ 44. Rxd2 Qxd2+ 45. Kf5 gxh6 46. Qe8+ Kg7 47. Qe7+ 1-0`
  },
  {
    id: 'carlsen-nakamura-2014',
    rank: 38,
    title: 'vs. Nakamura, Vugar Gashimov Mem 2014',
    event: 'Vugar Gashimov Mem 2014',
    year: 2014,
    white: 'Magnus Carlsen',
    black: 'H. Nakamura',
    result: '1-0',
    significance: 'Vugar Gashimov Mem 2014, Shamkir AZE, 2014. Carlsen wins with White in 61 moves. Opening: Slav Defense: Main Line.',
    pgn: `[Event "Vugar Gashimov Mem 2014"]
[Site "Shamkir AZE"]
[Date "2014.04.21"]
[Round "2.2"]
[White "Magnus Carlsen"]
[Black "H. Nakamura"]
[Result "1-0"]
[WhiteElo "2881"]
[BlackElo "2772"]
[ECO "D12"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bf5 5. Nc3 a6 6. Be2 h6 7. Bd3 Bxd3 8. Qxd3 e6 9. O-O Bb4 10. Bd2 O-O 11. Rfd1 Bxc3 12. Bxc3 Nbd7 13. b3 Qe7 14. Rac1 Rac8 15. Qe2 Ne4 16. Bb2 Rfd8 17. Ne1 Nd6 18. Ba3 f5 19. Nd3 Nf6 20. Bb4 Qc7 21. Qf3 dxc4 22. bxc4 Nf7 23. a4 a5 24. Be1 b6 25. Qg3 Qxg3 26. hxg3 Ra8 27. f3 Rdb8 28. Rc2 b5 29. Nc5 bxc4 30. Rxc4 Nd5 31. Bd2 e5 32. e4 fxe4 33. Nxe4 Nb6 34. Rxc6 Nd8 35. Rg6 Nc4 36. dxe5 Kh7 37. Rg4 Nxe5 38. Rh4 Ndf7 39. Bc3 Rb3 40. Rd5 Re8 41. Rf4 Re7 42. Bxa5 Ng6 43. Rff5 Nfe5 44. Rd1 Nc4 45. Rc1 Nxa5 46. Rxa5 Ra3 47. Rcc5 Ra2 48. Kh2 Rd7 49. Ra6 Ne7 50. g4 Rb7 51. Rb5 Rc7 52. Nc5 Rc6 53. Rxc6 Nxc6 54. Rb7 Nd4 55. Kh3 Kg8 56. Rb4 Ne2 57. g5 Ng1+ 58. Kg3 Ne2+ 59. Kg4 hxg5 60. Kxg5 Ng1 61. Rg4 1-0`
  },
  {
    id: 'carlsen-wojtaszek-2014',
    rank: 39,
    title: 'vs. Wojtaszek, 41st Olympiad Open 2014',
    event: '41st Olympiad Open 2014',
    year: 2014,
    white: 'Magnus Carlsen',
    black: 'R. Wojtaszek',
    result: '1-0',
    significance: '41st Olympiad Open 2014, Tromso NOR, 2014. Carlsen wins with White in 33 moves. Opening: Sicilian Defense: Closed.',
    pgn: `[Event "41st Olympiad Open 2014"]
[Site "Tromso NOR"]
[Date "2014.08.05"]
[Round "4.3"]
[White "Magnus Carlsen"]
[Black "R. Wojtaszek"]
[Result "1-0"]
[WhiteElo "2877"]
[BlackElo "2735"]
[ECO "B26"]

1. e4 c5 2. Nc3 d6 3. g3 Nc6 4. Bg2 g6 5. d3 Bg7 6. Be3 e5 7. Nh3 Nge7 8. f4 Nd4 9. O-O O-O 10. Qd2 Bd7 11. Nd1 Qc8 12. Ndf2 Ndc6 13. c3 b5 14. fxe5 Nxe5 15. Bh6 N7c6 16. Bxg7 Kxg7 17. Nf4 Qd8 18. Rad1 Rc8 19. Qe2 h5 20. d4 cxd4 21. cxd4 Ng4 22. h3 Nxf2 23. Qxf2 Ne7 24. Rd3 b4 25. Rf3 Qe8 26. g4 hxg4 27. hxg4 Bb5 28. Re1 Qd8 29. g5 Qb6 30. Bh3 Rcd8 31. Be6 Be8 32. Nd5 Nxd5 33. Bxd5 1-0`
  },
  {
    id: 'carlsen-nakamura-2014-2',
    rank: 40,
    title: 'vs. Nakamura, 2nd Sinquefield Cup 2014',
    event: '2nd Sinquefield Cup 2014',
    year: 2014,
    white: 'Magnus Carlsen',
    black: 'H. Nakamura',
    result: '1-0',
    significance: '2nd Sinquefield Cup 2014, Saint Louis USA, 2014. Carlsen wins with White in 52 moves. Opening: Slav Defense.',
    pgn: `[Event "2nd Sinquefield Cup 2014"]
[Site "Saint Louis USA"]
[Date "2014.09.03"]
[Round "7.2"]
[White "Magnus Carlsen"]
[Black "H. Nakamura"]
[Result "1-0"]
[WhiteElo "2877"]
[BlackElo "2787"]
[ECO "D10"]

1. d4 d5 2. c4 c6 3. Nc3 dxc4 4. e3 b5 5. a4 b4 6. Ne4 Qd5 7. Nd2 c3 8. bxc3 bxc3 9. Nb1 Qa5 10. Qc2 e5 11. Nf3 Na6 12. Nxe5 Nb4 13. Qb3 Be6 14. Bc4 c2 15. Bxe6 Nd3+ 16. Ke2 Nxe5 17. dxe5 fxe6 18. Qxe6+ Ne7 19. Nd2 Qd5 20. Qxd5 Nxd5 21. Ne4 Rb8 22. Bd2 Bb4 23. Rhc1 Bxd2 24. Nxd2 Nb4 25. Nf3 Ke7 26. Ne1 Rhd8 27. f4 c5 28. Nxc2 Nd3 29. Rcb1 Nb2 30. Ra2 Nxa4 31. Rxb8 Nc3+ 32. Kf3 Nxa2 33. Rb5 Nb4 34. Nxb4 cxb4 35. Rxb4 Ra8 36. Ke4 a5 37. Ra4 Kf7 38. g4 Ke7 39. f5 h6 40. h4 Kf7 41. e6+ Kf6 42. Rd4 Ke7 43. Rd7+ Kf8 44. e7+ Ke8 45. Rd8+ Rxd8 46. exd8=Q+ Kxd8 47. Kd5 Ke7 48. g5 a4 49. Kc4 hxg5 50. hxg5 Kd6 51. e4 Ke5 52. Kb4 1-0`
  },
  {
    id: 'carlsen-anand-2014',
    rank: 41,
    title: 'The Berlin Grind',
    event: 'WCh 2014',
    year: 2014,
    white: 'Magnus Carlsen',
    black: 'V. Anand',
    result: '1-0',
    significance: 'Game 6 - Carlsen wins a 75-move marathon to defend his title.',
    pgn: `[Event "WCh 2014"]
[Site "Sochi RUS"]
[Date "2014.11.09"]
[Round "2"]
[White "Magnus Carlsen"]
[Black "V. Anand"]
[Result "1-0"]
[WhiteElo "2863"]
[BlackElo "2792"]
[ECO "C65"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. O-O d6 6. Re1 O-O 7. Bxc6 bxc6 8. h3 Re8 9. Nbd2 Nd7 10. Nc4 Bb6 11. a4 a5 12. Nxb6 cxb6 13. d4 Qc7 14. Ra3 Nf8 15. dxe5 dxe5 16. Nh4 Rd8 17. Qh5 f6 18. Nf5 Be6 19. Rg3 Ng6 20. h4 Bxf5 21. exf5 Nf4 22. Bxf4 exf4 23. Rc3 c5 24. Re6 Rab8 25. Rc4 Qd7 26. Kh2 Rf8 27. Rce4 Rb7 28. Qe2 b5 29. b3 bxa4 30. bxa4 Rb4 31. Re7 Qd6 32. Qf3 Rxe4 33. Qxe4 f3+ 34. g3 h5 35. Qb7 1-0`
  },
  {
    id: 'caruana-carlsen-2015',
    rank: 42,
    title: 'vs. Caruana, 77th Tata Steel GpA 2015',
    event: '77th Tata Steel GpA',
    year: 2015,
    white: 'F. Caruana',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '77th Tata Steel GpA, Wijk aan Zee NED, 2015. Carlsen wins with Black in 39 moves. Opening: Sicilian Rossolimo.',
    pgn: `[Event "77th Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2015.01.16"]
[Round "6.4"]
[White "F. Caruana"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2820"]
[BlackElo "2862"]
[ECO "B31"]

1. e4 c5 2. Nf3 Nc6 3. Bb5 g6 4. Bxc6 dxc6 5. d3 Bg7 6. h3 Nf6 7. Nc3 b6 8. Be3 e5 9. O-O O-O 10. a3 Qe7 11. Qb1 Nh5 12. b4 f5 13. bxc5 f4 14. Bd2 bxc5 15. Qb3+ Be6 16. Qa4 Rac8 17. Qa5 g5 18. Na4 g4 19. hxg4 Bxg4 20. Qxc5 Qf6 21. Nh2 f3 22. Nxg4 Qg6 23. Qe7 fxg2 24. Rfb1 Qxg4 25. Qg5 Qe2 26. Qe3 Qg4 27. Qg5 Qxg5 28. Bxg5 Nf4 29. Bxf4 exf4 30. Kxg2 f3+ 31. Kf1 Rf4 32. c3 Rd8 33. d4 Bh6 34. Ke1 Rxe4+ 35. Kd1 c5 36. Kc2 cxd4 37. Kd3 Re2 38. c4 Rxf2 39. Rd1 Re2 0-1`
  },
  {
    id: 'carlsen-kramnik-2015',
    rank: 43,
    title: 'vs. Kramnik, Vugar Gashimov Mem 2015',
    event: 'Vugar Gashimov Mem 2015',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'V. Kramnik',
    result: '1-0',
    significance: 'Vugar Gashimov Mem 2015, Shamkir AZE, 2015. Carlsen wins with White in 49 moves. Opening: Ruy Lopez: Berlin Defense.',
    pgn: `[Event "Vugar Gashimov Mem 2015"]
[Site "Shamkir AZE"]
[Date "2015.04.24"]
[Round "7.3"]
[White "Magnus Carlsen"]
[Black "V. Kramnik"]
[Result "1-0"]
[WhiteElo "2863"]
[BlackElo "2783"]
[ECO "C65"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. O-O d6 7. h3 Ne7 8. d4 Bb6 9. Bd3 d5 10. Nbd2 dxe4 11. Nxe4 Nxe4 12. Bxe4 exd4 13. Qc2 h6 14. a4 c6 15. Rd1 Nd5 16. Nxd4 Re8 17. a5 Bxa5 18. Nf3 b5 19. Nd4 Bc7 20. Nxc6 Qd6 21. g3 Bb7 22. Bf4 Qxc6 23. Bxd5 Re1+ 24. Kh2 Qxd5 25. Rxd5 Rxa1 26. Rd1 Rxd1 27. Qxd1 Rd8 28. Qe2 Bb6 29. Be3 Bxe3 30. Qxe3 Rd1 31. g4 Bc6 32. Qc5 Bd7 33. Qxa7 Rd2 34. Kg3 Rd3+ 35. Kf4 Kh7 36. Qb7 Rd2 37. Ke3 Rd6 38. f4 g6 39. Qb8 Rd5 40. Ke4 Be6 41. Qb7 Rc5 42. Kd4 Rc4+ 43. Ke5 b4 44. cxb4 Rc2 45. Kf6 Rxb2 46. Qb8 Rf2 47. f5 gxf5 48. Qg3 Rf1 49. g5 1-0`
  },
  {
    id: 'carlsen-grischuk-2015',
    rank: 44,
    title: 'vs. Grischuk, 3rd Norway Chess 2015',
    event: '3rd Norway Chess 2015',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'A. Grischuk',
    result: '1-0',
    significance: '3rd Norway Chess 2015, Stavanger NOR, 2015. Carlsen wins with White in 45 moves. Opening: Réti Opening.',
    pgn: `[Event "3rd Norway Chess 2015"]
[Site "Stavanger NOR"]
[Date "2015.06.21"]
[Round "5.2"]
[White "Magnus Carlsen"]
[Black "A. Grischuk"]
[Result "1-0"]
[WhiteElo "2876"]
[BlackElo "2781"]
[ECO "B91"]

1. Nf3 c5 2. e4 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. g3 e5 7. Nde2 Be7 8. Bg2 b5 9. Nd5 Nbd7 10. Nec3 Bb7 11. a4 Nxd5 12. Nxd5 Nf6 13. axb5 Nxd5 14. exd5 axb5 15. Rxa8 Qxa8 16. Qd3 O-O 17. O-O Bc8 18. Be3 Bd7 19. Rc1 h6 20. Qd1 Qb7 21. Ra1 Ra8 22. h4 Ra6 23. b3 Bd8 24. c4 bxc4 25. bxc4 Bb6 26. c5 Bxc5 27. Bxc5 dxc5 28. d6 Qb6 29. Rxa6 Qxa6 30. Bd5 Qc8 31. Qb3 Be8 32. Qc3 c4 33. Bxc4 Bd7 34. Qb3 Qe8 35. Qf3 Kf8 36. h5 Kg8 37. Qe4 Bc6 38. Bd5 Bd7 39. Kg2 Kh8 40. f4 exf4 41. Qxe8+ Bxe8 42. Bxf7 Bc6+ 43. Kf2 fxg3+ 44. Kxg3 Bd7 45. Bg6 1-0`
  },
  {
    id: 'caruana-carlsen-2015-2',
    rank: 45,
    title: 'vs. Caruana, 3rd Sinquefield Cup 2015',
    event: '3rd Sinquefield Cup 2015',
    year: 2015,
    white: 'F. Caruana',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '3rd Sinquefield Cup 2015, Saint Louis USA, 2015. Carlsen wins with Black in 40 moves. Opening: Ruy Lopez: Morphy Defense.',
    pgn: `[Event "3rd Sinquefield Cup 2015"]
[Site "Saint Louis USA"]
[Date "2015.08.24"]
[Round "2.4"]
[White "F. Caruana"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2808"]
[BlackElo "2853"]
[ECO "C78"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 Bb7 7. d3 Be7 8. Nc3 O-O 9. a3 d6 10. Re1 Qd7 11. Ne2 Nd8 12. Ng3 Ne6 13. Ba2 Rfe8 14. Ng5 d5 15. Nxe6 Qxe6 16. Bg5 h6 17. Bxf6 Bxf6 18. Qf3 c6 19. c4 Rad8 20. cxd5 cxd5 21. Nf5 Bg5 22. h4 Bd2 23. Re2 dxe4 24. dxe4 Qf6 25. g3 Kf8 26. h5 Bg5 27. a4 b4 28. a5 Kg8 29. Bc4 Rd7 30. Ra4 Kh8 31. Rxb4 g6 32. hxg6 fxg6 33. Qb3 Bc6 34. Ne3 Bxe4 35. Bd5 Bxd5 36. Nxd5 Qc6 37. Nc3 Qf3 38. Qc2 Red8 39. Rbe4 Rd2 40. Rxd2 Rxd2 0-1`
  },
  {
    id: 'carlsen-so-2015',
    rank: 46,
    title: 'vs. So, 3rd Sinquefield Cup 2015',
    event: '3rd Sinquefield Cup 2015',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'W. So',
    result: '1-0',
    significance: '3rd Sinquefield Cup 2015, Saint Louis USA, 2015. Carlsen wins with White in 56 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "3rd Sinquefield Cup 2015"]
[Site "Saint Louis USA"]
[Date "2015.08.27"]
[Round "5.4"]
[White "Magnus Carlsen"]
[Black "W. So"]
[Result "1-0"]
[WhiteElo "2853"]
[BlackElo "2779"]
[ECO "B90"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Nbd7 9. Qd2 b5 10. O-O-O Be7 11. g4 b4 12. Nd5 Bxd5 13. exd5 Nb6 14. Na5 Nbxd5 15. Nc4 Nxe3 16. Nxe3 O-O 17. Bc4 Nd7 18. h4 a5 19. g5 Rc8 20. Bd5 Nb6 21. Kb1 Qc7 22. Rhf1 Nxd5 23. Nxd5 Qb7 24. f4 f5 25. Qe3 e4 26. h5 Rc5 27. h6 g6 28. Qb3 Rf7 29. a4 Bd8 30. Rd4 Kf8 31. Rfd1 Rc6 32. Ne3 Bb6 33. Nc4 Bxd4 34. Nxa5 Qb6 35. Nxc6 Bc5 36. Qd5 e3 37. a5 Qb5 38. Nd8 Ra7 39. Ne6+ Ke8 40. Nd4 Qxa5 41. Qg8+ Kd7 42. Qxh7+ Kc8 43. Qg8+ Kb7 44. c3 bxc3 45. Qb3+ Qb6 46. Qxb6+ Kxb6 47. bxc3 Bxd4 48. Rxd4 Kc6 49. Kc2 Ra2+ 50. Kd1 Rf2 51. Ke1 Kd7 52. Ra4 Ke6 53. Ra8 Rh2 54. c4 Kf7 55. Rb8 Ke6 56. Rg8 1-0`
  },
  {
    id: 'carlsen-nakamura-2015',
    rank: 47,
    title: 'vs. Nakamura, 7th London Classic 2015',
    event: '7th London Classic 2015',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'H. Nakamura',
    result: '1-0',
    significance: '7th London Classic 2015, London ENG, 2015. Carlsen wins with White in 78 moves. Opening: Slav Defense: Main Line.',
    pgn: `[Event "7th London Classic 2015"]
[Site "London ENG"]
[Date "2015.12.11"]
[Round "7.4"]
[White "Magnus Carlsen"]
[Black "H. Nakamura"]
[Result "1-0"]
[WhiteElo "2834"]
[BlackElo "2793"]
[ECO "D11"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bg4 5. h3 Bh5 6. cxd5 cxd5 7. Nc3 e6 8. g4 Bg6 9. Ne5 Nfd7 10. Nxg6 hxg6 11. Bg2 Nc6 12. e4 dxe4 13. Nxe4 Bb4+ 14. Nc3 Nb6 15. O-O O-O 16. d5 exd5 17. Nxd5 Bc5 18. Nc3 Bd4 19. Qf3 Qf6 20. Qxf6 Bxf6 21. Bf4 Rad8 22. Rad1 Bxc3 23. bxc3 Na4 24. c4 Nc3 25. Rd2 Rxd2 26. Bxd2 Ne2+ 27. Kh2 Rd8 28. Be3 Nc3 29. a3 Rd3 30. Rc1 Nd1 31. Be4 Rd7 32. Bc5 Nb2 33. Rc2 Na4 34. Be3 Nb6 35. c5 Nd5 36. Rd2 Nf6 37. Rxd7 Nxd7 38. Kg3 Kf8 39. f4 Nf6 40. Bf3 Ke7 41. f5 gxf5 42. gxf5 Kd7 43. Kf4 Ne8 44. Kg5 Ke7 45. Bf4 a6 46. h4 Kf8 47. Bg3 Nf6 48. Bd6+ Ke8 49. Kf4 Nd7 50. Bg2 Kd8 51. Kg5 Ke8 52. h5 Nf6 53. h6 Nh7+ 54. Kh5 Nf6+ 55. Kg5 Nh7+ 56. Kh4 gxh6 57. Kh5 Nf6+ 58. Kxh6 Ng4+ 59. Kg7 Nd4 60. Be4 Nf2 61. Bb1 Ng4 62. Bf4 f6 63. Be4 Nf2 64. Bb1 Ng4 65. Be4 Nf2 66. Bxb7 Nd3 67. Kxf6 Nxf4 68. Ke5 Nfe2 69. f6 a5 70. a4 Kf7 71. Bd5+ Kf8 72. Ke4 Nc2 73. c6 Nc3+ 74. Ke5 Nxa4 75. Bb3 Nb6 76. Bxc2 a4 77. c7 Kf7 78. Bxa4 1-0`
  },
  {
    id: 'carlsen-grischuk-2015-2',
    rank: 48,
    title: 'vs. Grischuk, 7th London Classic 2015',
    event: '7th London Classic 2015',
    year: 2015,
    white: 'Magnus Carlsen',
    black: 'A. Grischuk',
    result: '1-0',
    significance: '7th London Classic 2015, London ENG, 2015. Carlsen wins with White in 38 moves. Opening: Réti Opening.',
    pgn: `[Event "7th London Classic 2015"]
[Site "London ENG"]
[Date "2015.12.13"]
[Round "9.4"]
[White "Magnus Carlsen"]
[Black "A. Grischuk"]
[Result "1-0"]
[WhiteElo "2834"]
[BlackElo "2747"]
[ECO "B51"]

1. Nf3 c5 2. e4 d6 3. Bb5+ Nd7 4. O-O a6 5. Bd3 Ngf6 6. Re1 b5 7. c4 g5 8. Nxg5 Ne5 9. Be2 bxc4 10. Nc3 Rb8 11. Rf1 h6 12. Nf3 Nd3 13. Ne1 Nxb2 14. Bxb2 Rxb2 15. Bxc4 Rb4 16. Qe2 Bg7 17. Nc2 Rb6 18. Rab1 O-O 19. Rxb6 Qxb6 20. Ne3 e6 21. f4 Kh8 22. f5 a5 23. a4 Qd8 24. h3 Qe7 25. Ba6 Bxa6 26. Qxa6 Nh5 27. Rf3 Rg8 28. Nb5 Be5 29. Ng4 Qh4 30. fxe6 fxe6 31. Nxe5 dxe5 32. Qxe6 Qe1+ 33. Kh2 Rxg2+ 34. Kxg2 Qxd2+ 35. Kg1 Qe1+ 36. Rf1 Qe3+ 37. Rf2 Qe1+ 38. Kg2 1-0`
  },
  {
    id: 'eljanov-carlsen-2016',
    rank: 49,
    title: 'vs. Eljanov, 78th Tata Steel GpA 2016',
    event: '78th Tata Steel GpA',
    year: 2016,
    white: 'P. Eljanov',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '78th Tata Steel GpA, Wijk aan Zee NED, 2016. Carlsen wins with Black in 34 moves. Opening: Indian Game.',
    pgn: `[Event "78th Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2016.01.23"]
[Round "7.1"]
[White "P. Eljanov"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2760"]
[BlackElo "2844"]
[ECO "E10"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Bb4+ 5. Bd2 Be7 6. Bg2 O-O 7. O-O Nbd7 8. Qc2 Ne4 9. Bf4 c6 10. Nc3 g5 11. Be3 Nd6 12. b3 Nf5 13. g4 Nxe3 14. fxe3 b5 15. e4 b4 16. exd5 bxc3 17. dxc6 Nb8 18. Qe4 f5 19. gxf5 exf5 20. Qd5+ Qxd5 21. cxd5 Na6 22. Rac1 Nc7 23. Ne5 f4 24. Nc4 Rd8 25. Rxc3 Nxd5 26. c7 Nxc7 27. Bxa8 Nxa8 28. e3 Bb4 29. Rc2 Bb7 30. h4 Be4 31. Rh2 Nb6 32. Ne5 fxe3 33. hxg5 Rxd4 34. Ng4 Nd5 0-1`
  },
  {
    id: 'carlsen-adams-2016',
    rank: 50,
    title: 'vs. Adams, 78th Tata Steel GpA 2016',
    event: '78th Tata Steel GpA',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'M. Adams',
    result: '1-0',
    significance: '78th Tata Steel GpA, Wijk aan Zee NED, 2016. Carlsen wins with White in 66 moves. Opening: Giuoco Piano.',
    pgn: `[Event "78th Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2016.01.26"]
[Round "9.1"]
[White "Magnus Carlsen"]
[Black "M. Adams"]
[Result "1-0"]
[WhiteElo "2844"]
[BlackElo "2744"]
[ECO "C50"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O d6 5. c3 Nf6 6. d3 h6 7. a4 a5 8. Na3 O-O 9. Nc2 Re8 10. Re1 Ba7 11. Be3 Be6 12. Bb5 Bd7 13. Bxa7 Nxa7 14. Bc4 Be6 15. Bxe6 Rxe6 16. Ne3 Nc8 17. Nf5 Ne7 18. d4 exd4 19. N3xd4 Re5 20. Ng3 Ng6 21. Qc2 c6 22. Rad1 Qc7 23. Ndf5 Rd8 24. Qd2 Kh7 25. f4 Qb6+ 26. Kh1 Ree8 27. h3 Rd7 28. Nxd6 Rxd6 29. Qxd6 Qf2 30. Qd3 Nxf4 31. Qf3 Nxh3 32. Re2 Qxf3 33. gxf3 Ng5 34. Kg2 Ne6 35. Red2 g6 36. Nf1 h5 37. Ne3 h4 38. Nc4 g5 39. Nxa5 g4 40. Nxb7 g3 41. Nd6 Rg8 42. Nf5 Nf4+ 43. Kh1 h3 44. a5 N6h5 45. a6 Ne6 46. a7 Ra8 47. Ra1 Ng5 48. Nh4 Nf4 49. b4 g2+ 50. Nxg2 hxg2+ 51. Rxg2 Nxg2 52. Kxg2 Ne6 53. c4 Nc7 54. Kg3 Kg6 55. Kf4 Kf6 56. e5+ Ke7 57. Ke4 f6 58. f4 fxe5 59. Kxe5 Ne8 60. f5 Nd6 61. f6+ Kd7 62. Rd1 Re8+ 63. Kd4 Kc7 64. Re1 Nf5+ 65. Kc3 Ra8 66. f7 1-0`
  },
  {
    id: 'carlsen-harikrishna-2016',
    rank: 51,
    title: 'vs. Harikrishna, 4th Norway Chess 2016',
    event: '4th Norway Chess 2016',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'P. Harikrishna',
    result: '1-0',
    significance: '4th Norway Chess 2016, Stavanger NOR, 2016. Carlsen wins with White in 41 moves. Opening: Queen\'s Indian Defense: Main Line.',
    pgn: `[Event "4th Norway Chess 2016"]
[Site "Stavanger NOR"]
[Date "2016.04.19"]
[Round "1.2"]
[White "Magnus Carlsen"]
[Black "P. Harikrishna"]
[Result "1-0"]
[WhiteElo "2851"]
[BlackElo "2763"]
[ECO "E15"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. Nbd2 Bb4 6. Qa4 c5 7. a3 Bxd2+ 8. Bxd2 O-O 9. dxc5 bxc5 10. Bg2 Qb6 11. O-O Nc6 12. Be3 Rfc8 13. Rfd1 d5 14. cxd5 exd5 15. Bxc5 Qa5 16. Qc2 Bxe2 17. Qxe2 Qxc5 18. Rac1 Qb6 19. b4 h6 20. Qe3 Qb7 21. Bh3 Re8 22. Qc3 Ne7 23. Nd4 Ne4 24. Qc7 Qa6 25. f3 Ng5 26. Bd7 Red8 27. h4 Nxf3+ 28. Nxf3 Qxa3 29. Kg2 Qb2+ 30. Rd2 Qxb4 31. Re1 a5 32. Rde2 Ng6 33. h5 Nh8 34. Bf5 a4 35. Ne5 Qd6 36. Qc2 Re8 37. Bh7+ Kf8 38. Qf5 Re7 39. Bg6 Kg8 40. Nxf7 Rxf7 41. Bxf7+ 1-0`
  },
  {
    id: 'carlsen-kramnik-2016',
    rank: 52,
    title: 'vs. Kramnik, 4th Norway Chess 2016',
    event: '4th Norway Chess 2016',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'V. Kramnik',
    result: '1-0',
    significance: '4th Norway Chess 2016, Stavanger NOR, 2016. Carlsen wins with White in 50 moves. Opening: Queen\'s Gambit Declined: Exchange.',
    pgn: `[Event "4th Norway Chess 2016"]
[Site "Stavanger NOR"]
[Date "2016.04.27"]
[Round "7.3"]
[White "Magnus Carlsen"]
[Black "V. Kramnik"]
[Result "1-0"]
[WhiteElo "2851"]
[BlackElo "2801"]
[ECO "D35"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 exd5 5. Bg5 c6 6. e3 Bf5 7. Qf3 Bg6 8. Bxf6 Qxf6 9. Qxf6 gxf6 10. Nf3 Nd7 11. Nh4 Be7 12. Ne2 Nb6 13. Ng3 Bb4+ 14. Kd1 Na4 15. Ngf5 Kd7 16. Rb1 Ke6 17. Bd3 Rhc8 18. Ke2 Bf8 19. g4 c5 20. Ng2 cxd4 21. exd4 Bd6 22. h4 h5 23. Ng7+ Ke7 24. gxh5 Bxd3+ 25. Kxd3 Kd7 26. Ne3 Nb6 27. Ng4 Rh8 28. Rhe1 Be7 29. Nf5 Bd8 30. h6 Rc8 31. b3 Rc6 32. Nge3 Bc7 33. Rbc1 Rxc1 34. Rxc1 Bf4 35. Rc5 Ke6 36. Ng7+ Kd6 37. Ng4 Nd7 38. Rc2 f5 39. Nxf5+ Ke6 40. Ng7+ Kd6 41. Re2 Kc6 42. Re8 Rxe8 43. Nxe8 Nf8 44. Ne5+ Bxe5 45. dxe5 Kd7 46. Nf6+ Ke6 47. h5 Kxe5 48. Nd7+ Nxd7 49. h7 Nc5+ 50. Ke2 1-0`
  },
  {
    id: 'carlsen-eljanov-2016',
    rank: 53,
    title: 'vs. Eljanov, 4th Norway Chess 2016',
    event: '4th Norway Chess 2016',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'P. Eljanov',
    result: '1-0',
    significance: '4th Norway Chess 2016, Stavanger NOR, 2016. Carlsen wins with White in 35 moves. Opening: Queen\'s Gambit Declined.',
    pgn: `[Event "4th Norway Chess 2016"]
[Site "Stavanger NOR"]
[Date "2016.04.29"]
[Round "9.2"]
[White "Magnus Carlsen"]
[Black "P. Eljanov"]
[Result "1-0"]
[WhiteElo "2851"]
[BlackElo "2765"]
[ECO "D30"]

1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. g3 Bb4+ 5. Bd2 Be7 6. Bg2 O-O 7. O-O c6 8. Qc2 Nbd7 9. a4 a5 10. Rc1 Ne4 11. Be1 f5 12. Nbd2 Bd6 13. e3 Ra7 14. Qd1 b6 15. cxd5 cxd5 16. Nb1 Ba6 17. Na3 Qa8 18. Nb5 Bxb5 19. axb5 Rc8 20. Bf1 Rxc1 21. Rxc1 Rc7 22. Rxc7 Bxc7 23. Qa4 Qb8 24. b4 axb4 25. Bxb4 h6 26. Qc2 Bd6 27. Qc6 Ndf6 28. Bxd6 Qxd6 29. Qc8+ Kh7 30. Ne5 Qe7 31. Qc6 Ng4 32. Nxg4 fxg4 33. Bd3 g6 34. Bxe4 dxe4 35. Qxb6 1-0`
  },
  {
    id: 'carlsen-karjakin-2016',
    rank: 54,
    title: 'vs. Karjakin, WCh 2016',
    event: 'WCh 2016',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'Sergey Karjakin',
    result: '1-0',
    significance: 'WCh 2016, New York USA, round 10, 2016. Carlsen wins with White in 75 moves. Opening: Ruy Lopez: Berlin Defense.',
    pgn: `[Event "WCh 2016"]
[Site "New York USA"]
[Date "2016.11.24"]
[Round "10"]
[White "Magnus Carlsen"]
[Black "Sergey Karjakin"]
[Result "1-0"]
[WhiteElo "2853"]
[BlackElo "2772"]
[ECO "C65"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. Bg5 h6 7. Bh4 Be7 8. O-O d6 9. Nbd2 Nh5 10. Bxe7 Qxe7 11. Nc4 Nf4 12. Ne3 Qf6 13. g3 Nh3+ 14. Kh1 Ne7 15. Bc4 c6 16. Bb3 Ng6 17. Qe2 a5 18. a4 Be6 19. Bxe6 fxe6 20. Nd2 d5 21. Qh5 Ng5 22. h4 Nf3 23. Nxf3 Qxf3+ 24. Qxf3 Rxf3 25. Kg2 Rf7 26. Rfe1 h5 27. Nf1 Kf8 28. Nd2 Ke7 29. Re2 Kd6 30. Nf3 Raf8 31. Ng5 Re7 32. Rae1 Rfe8 33. Nf3 Nh8 34. d4 exd4 35. Nxd4 g6 36. Re3 Nf7 37. e5+ Kd7 38. Rf3 Nh6 39. Rf6 Rg7 40. b4 axb4 41. cxb4 Ng8 42. Rf3 Nh6 43. a5 Nf5 44. Nb3 Kc7 45. Nc5 Kb8 46. Rb1 Ka7 47. Rd3 Rc7 48. Ra3 Nd4 49. Rd1 Nf5 50. Kh3 Nh6 51. f3 Rf7 52. Rd4 Nf5 53. Rd2 Rh7 54. Rb3 Ree7 55. Rdd3 Rh8 56. Rb1 Rhh7 57. b5 cxb5 58. Rxb5 d4 59. Rb6 Rc7 60. Nxe6 Rc3 61. Nf4 Rhc7 62. Nd5 Rxd3 63. Nxc7 Kb8 64. Nb5 Kc8 65. Rxg6 Rxf3 66. Kg2 Rb3 67. Nd6+ Nxd6 68. Rxd6 Re3 69. e6 Kc7 70. Rxd4 Rxe6 71. Rd5 Rh6 72. Kf3 Kb8 73. Kf4 Ka7 74. Kg5 Rh8 75. Kf6 1-0`
  },
  {
    id: 'carlsen-karjakin-2016-2',
    rank: 55,
    title: 'Carlsen vs Karjakin',
    event: 'WCh Rapid TB 2016',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'Sergey Karjakin',
    result: '1-0',
    significance: 'Carlsen retains his title with a beautiful move to end a World Chess Championship match.',
    pgn: `[Event "WCh Rapid TB 2016"]
[Site "New York USA"]
[Date "2016.11.30"]
[Round "4"]
[White "Magnus Carlsen"]
[Black "Sergey Karjakin"]
[Result "1-0"]
[WhiteElo "2853"]
[BlackElo "2772"]
[ECO "B54"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. f3 e5 6. Nb3 Be7 7. c4 a5 8. Be3 a4 9. Nc1 O-O 10. Nc3 Qa5 11. Qd2 Na6 12. Be2 Nc5 13. O-O Bd7 14. Rb1 Rfc8 15. b4 axb3 16. axb3 Qd8 17. Nd3 Ne6 18. Nb4 Bc6 19. Rfd1 h5 20. Bf1 h4 21. Qf2 Nd7 22. g3 Ra3 23. Bh3 Rca8 24. Nc2 R3a6 25. Nb4 Ra5 26. Nc2 b6 27. Rd2 Qc7 28. Rbd1 Bf8 29. gxh4 Nf4 30. Bxf4 exf4 31. Bxd7 Qxd7 32. Nb4 Ra3 33. Nxc6 Qxc6 34. Nb5 Rxb3 35. Nd4 Qxc4 36. Nxb3 Qxb3 37. Qe2 Be7 38. Kg2 Qe6 39. h5 Ra3 40. Rd3 Ra2 41. R3d2 Ra3 42. Rd3 Ra7 43. Rd5 Rc7 44. Qd2 Qf6 45. Rf5 Qh4 46. Rc1 Ra7 47. Qxf4 Ra2+ 48. Kh1 Qf2 49. Rc8+ Kh7 50. Qh6+ 1-0`
  },
  {
    id: 'carlsen-wojtaszek-2017',
    rank: 56,
    title: 'vs. Wojtaszek, 79th Tata Steel GpA 2017',
    event: '79th Tata Steel GpA',
    year: 2017,
    white: 'Magnus Carlsen',
    black: 'R. Wojtaszek',
    result: '1-0',
    significance: '79th Tata Steel GpA, Wijk aan Zee NED, 2017. Carlsen wins with White in 44 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "79th Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2017.01.15"]
[Round "2.1"]
[White "Magnus Carlsen"]
[Black "R. Wojtaszek"]
[Result "1-0"]
[WhiteElo "2840"]
[BlackElo "2750"]
[ECO "B90"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. a3 e5 7. Nf5 d5 8. Bg5 d4 9. Bxf6 Qxf6 10. Nd5 Qd8 11. Qg4 Bxf5 12. Qxf5 Bd6 13. h4 Nc6 14. Bc4 b5 15. Bb3 Ne7 16. Qg4 O-O 17. Rh3 Nxd5 18. Bxd5 Ra7 19. Rg3 Qf6 20. a4 Bb4+ 21. Kf1 bxa4 22. Rxa4 a5 23. Ra1 Rc7 24. Bb3 Ra8 25. Kg1 Bf8 26. Qh5 g6 27. Qg4 Ra6 28. h5 Qf4 29. Qe2 Qf6 30. Qb5 Qc6 31. Qxe5 Re7 32. Qf4 a4 33. Bd5 Qc7 34. Qd2 Qb6 35. Ra2 Rc7 36. Rf3 Qb4 37. Qe2 Rb6 38. hxg6 hxg6 39. g3 Kg7 40. Kg2 Rd7 41. Qd1 Rf6 42. Rxf6 Kxf6 43. c3 dxc3 44. Rxa4 1-0`
  },
  {
    id: 'eljanov-carlsen-2017',
    rank: 57,
    title: 'vs. Eljanov, 79th Tata Steel GpA 2017',
    event: '79th Tata Steel GpA',
    year: 2017,
    white: 'P. Eljanov',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '79th Tata Steel GpA, Wijk aan Zee NED, 2017. Carlsen wins with Black in 60 moves.',
    pgn: `[Event "79th Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2017.01.28"]
[Round "12.1"]
[White "P. Eljanov"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2755"]
[BlackElo "2840"]
[ECO "A90"]

1. d4 e6 2. c4 f5 3. g3 Nf6 4. Bg2 d5 5. Nf3 Bd6 6. Nc3 c6 7. Bf4 Bxf4 8. gxf4 O-O 9. e3 Bd7 10. Qb3 Qc7 11. O-O Be8 12. Rfc1 Qe7 13. Qa3 Qxa3 14. bxa3 Nbd7 15. Rab1 Rb8 16. a4 a5 17. Rb2 Ne4 18. Nxe4 dxe4 19. Ng5 Rf6 20. f3 h6 21. Nh3 exf3 22. Bxf3 Rf7 23. Nf2 c5 24. Nd3 cxd4 25. exd4 Nf6 26. Nc5 Ne4 27. Nxe6 Bxa4 28. d5 Bd7 29. Bxe4 fxe4 30. Nc5 Bg4 31. Re1 Rc8 32. Nxe4 Rxf4 33. Nd6 Rcf8 34. Rb3 R8f6 35. Ne4 Rg6 36. Rg3 b6 37. d6 Kh7 38. Nf2 Rxc4 39. Nxg4 Rgxg4 40. Rxg4 Rxg4+ 41. Kf2 Rd4 42. Re6 Kg8 43. Ke3 Rd1 44. d7 Rxd7 45. Rxb6 Rd5 46. Rb2 Kh7 47. Ke4 Rh5 48. Kf4 Rh4+ 49. Kg3 g5 50. Rb7+ Kg6 51. Rb6+ Kh5 52. h3 Ra4 53. Rc6 Ra3+ 54. Kg2 Rxa2+ 55. Kg3 a4 56. Ra6 a3 57. Kf3 Rb2 58. Kg3 a2 59. Kf3 a1=Q 60. Rxa1 Kh4 0-1`
  },
  {
    id: 'carlsen-karjakin-2017',
    rank: 58,
    title: 'vs. Karjakin, 5th Norway Chess 2017',
    event: '5th Norway Chess 2017',
    year: 2017,
    white: 'Magnus Carlsen',
    black: 'Sergey Karjakin',
    result: '1-0',
    significance: '5th Norway Chess 2017, Stavanger NOR, 2017. Carlsen wins with White in 44 moves. Opening: Nimzo-Indian Defense.',
    pgn: `[Event "5th Norway Chess 2017"]
[Site "Stavanger NOR"]
[Date "2017.06.15"]
[Round "8.2"]
[White "Magnus Carlsen"]
[Black "Sergey Karjakin"]
[Result "1-0"]
[WhiteElo "2832"]
[BlackElo "2781"]
[ECO "E48"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. cxd5 exd5 7. Ne2 Re8 8. Bd2 Bf8 9. O-O b6 10. Rc1 c5 11. Nf4 Bb7 12. Qf3 Na6 13. Rfd1 cxd4 14. exd4 Nc7 15. Bc2 Bd6 16. Be3 Ne4 17. Ba4 Re7 18. Bb3 Qd7 19. h3 Nxc3 20. bxc3 Bc6 21. Nh5 Re6 22. Bc2 Ba4 23. c4 dxc4 24. d5 Rg6 25. Bd4 Bxc2 26. Rxc2 Qa4 27. Rcc1 Qxa2 28. Nxg7 Rxg7 29. Bxg7 Kxg7 30. Qg4+ Kf8 31. Qh4 Qb2 32. Rxc4 Ne8 33. Re1 Qf6 34. Qxh7 Qg7 35. Qc2 Qf6 36. Rg4 Bc5 37. Re2 Qh6 38. g3 Nf6 39. Rh4 Qg7 40. Kg2 Qg5 41. Qc3 Bd6 42. Rh8+ Ng8 43. Re4 Qg7 44. Rxg8+ 1-0`
  },
  {
    id: 'carlsen-karjakin-2017-2',
    rank: 59,
    title: 'vs. Karjakin, 5th Sinquefield Cup 2017',
    event: '5th Sinquefield Cup 2017',
    year: 2017,
    white: 'Magnus Carlsen',
    black: 'Sergey Karjakin',
    result: '1-0',
    significance: '5th Sinquefield Cup 2017, Saint Louis USA, 2017. Carlsen wins with White in 42 moves. Opening: Réti Opening: King\'s Indian Attack.',
    pgn: `[Event "5th Sinquefield Cup 2017"]
[Site "Saint Louis USA"]
[Date "2017.08.03"]
[Round "2.1"]
[White "Magnus Carlsen"]
[Black "Sergey Karjakin"]
[Result "1-0"]
[WhiteElo "2822"]
[BlackElo "2773"]
[ECO "A05"]

1. Nf3 Nf6 2. g3 c5 3. Bg2 Nc6 4. O-O e5 5. e4 d6 6. d3 g6 7. a3 Bg7 8. c3 O-O 9. b4 a6 10. Nbd2 b5 11. Rb1 Nd7 12. Nb3 cxb4 13. axb4 Nb6 14. Be3 Be6 15. Qd2 Rc8 16. Rfc1 Re8 17. h4 Na4 18. c4 h5 19. Kh2 Bg4 20. cxb5 axb5 21. Na5 Nd4 22. Rxc8 Qxc8 23. Rc1 Qd7 24. Nxd4 exd4 25. Bh6 Bh8 26. Rc6 Nc3 27. f3 Be6 28. Bf4 Be5 29. Bxe5 dxe5 30. f4 Qe7 31. Rc5 Rc8 32. Rxc8+ Bxc8 33. Nc6 Qd6 34. Nxe5 Qxb4 35. f5 Qd6 36. Nf3 gxf5 37. Qg5+ Kh7 38. e5 Qg6 39. Qd8 Be6 40. Ng5+ Kg7 41. Qxd4 Na4 42. Nh3 1-0`
  },
  {
    id: 'so-carlsen-2017',
    rank: 60,
    title: 'vs. So, 5th Sinquefield Cup 2017',
    event: '5th Sinquefield Cup 2017',
    year: 2017,
    white: 'W. So',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '5th Sinquefield Cup 2017, Saint Louis USA, 2017. Carlsen wins with Black in 29 moves. Opening: Scotch Game: Classical.',
    pgn: `[Event "5th Sinquefield Cup 2017"]
[Site "Saint Louis USA"]
[Date "2017.08.06"]
[Round "5.3"]
[White "W. So"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2810"]
[BlackElo "2822"]
[ECO "C45"]

1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bb4+ 5. c3 Be7 6. Nxc6 bxc6 7. Bd3 d6 8. O-O Nf6 9. Re1 O-O 10. Nd2 Re8 11. Nf3 Nd7 12. Bf4 Nc5 13. Bc2 Bg4 14. h3 Bh5 15. Be3 Nd7 16. Ba4 c5 17. g4 Bg6 18. e5 Rb8 19. Bf4 Rxb2 20. exd6 Bxd6 21. Rxe8+ Qxe8 22. Bxd6 cxd6 23. Qxd6 Qe2 24. Qg3 Nf8 25. Re1 Rb1 26. Rxb1 Bxb1 27. Bc6 Bxa2 28. Qd6 Qc4 29. Ne5 Qxc3 0-1`
  },
  {
    id: 'carlsen-so-2018',
    rank: 61,
    title: 'vs. So, 80th Tata Steel GpA 2018',
    event: '80th Tata Steel GpA',
    year: 2018,
    white: 'Magnus Carlsen',
    black: 'W. So',
    result: '1-0',
    significance: '80th Tata Steel GpA, Wijk aan Zee NED, 2018. Carlsen wins with White in 75 moves. Opening: Réti Opening.',
    pgn: `[Event "80th Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2018.01.24"]
[Round "10.1"]
[White "Magnus Carlsen"]
[Black "W. So"]
[Result "1-0"]
[WhiteElo "2834"]
[BlackElo "2792"]
[ECO "D02"]

1. Nf3 d5 2. d4 Nf6 3. Bf4 Bf5 4. e3 e6 5. c4 Bxb1 6. Qxb1 Bb4+ 7. Kd1 Bd6 8. Bg5 h6 9. Bxf6 Qxf6 10. cxd5 exd5 11. e4 Be7 12. Bb5+ c6 13. e5 Qf4 14. Bd3 c5 15. dxc5 Nc6 16. Qc1 Qb4 17. a3 Qxc5 18. Ke2 Nd4+ 19. Nxd4 Qxd4 20. f4 O-O 21. Qd2 Qb6 22. Rhe1 f6 23. e6 Qxe6+ 24. Kf3 Qd7 25. Rad1 Rad8 26. Qe3 Bd6 27. Bg6 f5 28. Qe6+ Qxe6 29. Rxe6 Bc5 30. Re5 Rf6 31. Bxf5 Bd6 32. Rdxd5 Kf7 33. Re4 g6 34. Bg4 h5 35. Bh3 Re8 36. Red4 Be5 37. Rb4 g5 38. g3 b6 39. Rd7+ Kf8 40. Rh7 g4+ 41. Bxg4 hxg4+ 42. Kxg4 Bd6 43. Rc4 a5 44. Rc6 Kg8 45. Rb7 Be5 46. Rcxb6 Rxb6 47. Rxb6 Bd4 48. Rb5 Re2 49. b3 Rxh2 50. Rxa5 Re2 51. Rd5 Bb2 52. a4 Bc3 53. Kf5 Re8 54. g4 Rf8+ 55. Ke4 Rb8 56. Rb5 Re8+ 57. Kd3 Be1 58. a5 Bf2 59. b4 Re3+ 60. Kc4 Re4+ 61. Kb3 Kf7 62. Re5 Rd4 63. b5 Rd3+ 64. Kc2 Rg3 65. g5 Bd4 66. Rd5 Be3 67. Rd3 Rg2+ 68. Kb3 Bc1 69. b6 Ke6 70. Rd4 Rb2+ 71. Ka4 Kf5 72. Rb4 Ra2+ 73. Kb5 Bxf4 74. Rxf4+ Kxf4 75. b7 1-0`
  },
  {
    id: 'carlsen-wojtaszek-2018',
    rank: 62,
    title: 'vs. Wojtaszek, Vugar Gashimov Mem 2018',
    event: 'Vugar Gashimov Mem 2018',
    year: 2018,
    white: 'Magnus Carlsen',
    black: 'R. Wojtaszek',
    result: '1-0',
    significance: 'Vugar Gashimov Mem 2018, Shamkir AZE, 2018. Carlsen wins with White in 31 moves. Opening: Sicilian Defense: Closed.',
    pgn: `[Event "Vugar Gashimov Mem 2018"]
[Site "Shamkir AZE"]
[Date "2018.04.23"]
[Round "5.3"]
[White "Magnus Carlsen"]
[Black "R. Wojtaszek"]
[Result "1-0"]
[WhiteElo "2843"]
[BlackElo "2744"]
[ECO "B23"]

1. e4 c5 2. Nc3 d6 3. d4 cxd4 4. Qxd4 Nc6 5. Qd2 Nf6 6. b3 e6 7. Bb2 a6 8. O-O-O b5 9. f3 h5 10. Nh3 Be7 11. Ng5 h4 12. f4 Bb7 13. Kb1 Rc8 14. Be2 Qc7 15. Rhe1 Nh7 16. Nxh7 Rxh7 17. g4 hxg3 18. hxg3 Bf6 19. Bd3 Rh8 20. g4 Nd4 21. Re3 Kf8 22. Ne2 Nxe2 23. Rxe2 Bc3 24. Bxc3 Qxc3 25. Qe3 Rc5 26. e5 dxe5 27. fxe5 Rh1 28. Rxh1 Bxh1 29. Rh2 Rxe5 30. Rh8+ Ke7 31. Qa7+ 1-0`
  },
  {
    id: 'giri-carlsen-2018',
    rank: 63,
    title: 'vs. Giri, Vugar Gashimov Mem 2018',
    event: 'Vugar Gashimov Mem 2018',
    year: 2018,
    white: 'A. Giri',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'Vugar Gashimov Mem 2018, Shamkir AZE, 2018. Carlsen wins with Black in 43 moves. Opening: English Opening: Reversed Sicilian.',
    pgn: `[Event "Vugar Gashimov Mem 2018"]
[Site "Shamkir AZE"]
[Date "2018.04.27"]
[Round "8.3"]
[White "A. Giri"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2777"]
[BlackElo "2843"]
[ECO "A29"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Nb6 7. O-O Be7 8. a3 a5 9. d3 O-O 10. Be3 Be6 11. Rc1 a4 12. Nd2 f5 13. Bxb6 cxb6 14. Nxa4 Bg5 15. Nc3 e4 16. Kh1 Qd7 17. Rb1 Rad8 18. Nc4 Qf7 19. b3 exd3 20. exd3 f4 21. Ne4 Be7 22. gxf4 Qxf4 23. a4 Nb4 24. Qe2 Qh6 25. Rbd1 Nd5 26. Rg1 Kh8 27. Bf1 Rf4 28. Ne5 Rdf8 29. f3 Rh4 30. d4 Nf4 31. Qd2 Bxb3 32. Rb1 Bxa4 33. Bb5 Bxb5 34. Rxb5 Qe6 35. Qb2 Bd8 36. Ng5 Qe8 37. Rb3 Bxg5 38. Rxg5 Ne6 39. Rg4 Rxg4 40. fxg4 Qd8 41. Rh3 Qd5+ 42. Kg1 Qe4 43. Qb4 Rf6 0-1`
  },
  {
    id: 'carlsen-navara-2018',
    rank: 64,
    title: 'vs. Navara, 51st Biel GM 2018',
    event: '51st Biel GM 2018',
    year: 2018,
    white: 'Magnus Carlsen',
    black: 'D. Navara',
    result: '1-0',
    significance: '51st Biel GM 2018, Biel SUI, 2018. Carlsen wins with White in 64 moves. Opening: Indian Game.',
    pgn: `[Event "51st Biel GM 2018"]
[Site "Biel SUI"]
[Date "2018.07.22"]
[Round "1.1"]
[White "Magnus Carlsen"]
[Black "D. Navara"]
[Result "1-0"]
[WhiteElo "2842"]
[BlackElo "2741"]
[ECO "D30"]

1. d4 Nf6 2. Nf3 d5 3. c4 e6 4. Bg5 Bb4+ 5. Nc3 h6 6. Bxf6 Qxf6 7. e3 O-O 8. Rc1 dxc4 9. Bxc4 c5 10. dxc5 Nd7 11. O-O Nxc5 12. Nb5 a6 13. Nbd4 b5 14. Be2 e5 15. Nc2 Rd8 16. Nxb4 Rxd1 17. Rfxd1 a5 18. Nd5 Qd6 19. Nxe5 Bb7 20. Bf3 Rc8 21. Ng4 Qf8 22. h4 Nd7 23. Rxc8 Bxc8 24. a3 h5 25. Nh2 g6 26. Be2 Ne5 27. Bxb5 Bb7 28. Nc3 Qe7 29. Rd4 Qe6 30. Nf1 Qb3 31. Rd2 Nc4 32. Rd7 Nxb2 33. Rxb7 Qxc3 34. Be8 Kf8 35. Bxf7 Qc6 36. Rxb2 Kxf7 37. Rd2 Qa4 38. Rd3 Qxh4 39. Rd7+ Kg8 40. Rd4 Qe7 41. a4 Qa3 42. g3 Qa1 43. Kg2 g5 44. Nd2 g4 45. Ne4 Qc1 46. Nf6+ Kf7 47. Nxh5 Qc6+ 48. Kg1 Qc1+ 49. Kh2 Kg6 50. Nf4+ Kf6 51. Ng2 Kg5 52. Rf4 Qd1 53. Nh4 Qc2 54. Nf5 Qd3 55. e4 Qd7 56. e5 Qh7+ 57. Kg1 Qg6 58. Nd6 Qe6 59. Rf5+ Qxf5 60. Nxf5 Kxf5 61. f4 gxf3 62. Kf2 Kxe5 63. Kxf3 Kf5 64. Ke3 1-0`
  },
  {
    id: 'carlsen-mamedyarov-2019',
    rank: 65,
    title: 'vs. Mamedyarov, 81st Tata Steel GpA 2019',
    event: '81st Tata Steel GpA',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'S. Mamedyarov',
    result: '1-0',
    significance: '81st Tata Steel GpA, Wijk aan Zee NED, 2019. Carlsen wins with White in 51 moves. Opening: Réti Opening.',
    pgn: `[Event "81st Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2019.01.18"]
[Round "6.1"]
[White "Magnus Carlsen"]
[Black "S. Mamedyarov"]
[Result "1-0"]
[WhiteElo "2835"]
[BlackElo "2817"]
[ECO "D27"]

1. Nf3 d5 2. d4 Nf6 3. c4 dxc4 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. b3 b6 8. dxc5 Qxd1 9. Rxd1 Bxc5 10. Bb2 Nbd7 11. Nbd2 Bb7 12. Be2 O-O 13. Nc4 Rfd8 14. Ne1 Bd5 15. Rac1 Rac8 16. Nd3 Be7 17. Nce5 Bb7 18. Nc4 Bd5 19. Nd2 Bb7 20. Kf1 h6 21. Bf3 Nd5 22. Nc4 b5 23. Na5 Ba8 24. a3 g5 25. h3 f5 26. b4 Kf7 27. Nb3 Bf6 28. Bxf6 Kxf6 29. Nbc5 N5b6 30. Be2 Nc4 31. a4 Ndb6 32. a5 Nd5 33. Nxa6 Ndxe3+ 34. fxe3 Nxe3+ 35. Kg1 Nxd1 36. Rxd1 Rc2 37. Bf3 Be4 38. Nac5 Bxd3 39. Rxd3 Rxd3 40. Nxd3 e5 41. Bb7 e4 42. Nc5 Ke5 43. a6 Ra2 44. Bc6 h5 45. Bxb5 g4 46. hxg4 hxg4 47. Bc4 Ra1+ 48. Kh2 f4 49. b5 f3 50. b6 Kf4 51. Nxe4 1-0`
  },
  {
    id: 'carlsen-giri-2019',
    rank: 66,
    title: 'vs. Giri, Vugar Gashimov Mem 2019',
    event: 'Vugar Gashimov Mem 2019',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'A. Giri',
    result: '1-0',
    significance: 'Vugar Gashimov Mem 2019, Shamkir AZE, 2019. Carlsen wins with White in 38 moves. Opening: English Opening: Reversed Sicilian.',
    pgn: `[Event "Vugar Gashimov Mem 2019"]
[Site "Shamkir AZE"]
[Date "2019.04.07"]
[Round "7.3"]
[White "Magnus Carlsen"]
[Black "A. Giri"]
[Result "1-0"]
[WhiteElo "2845"]
[BlackElo "2797"]
[ECO "A29"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Bc5 7. O-O O-O 8. d3 h6 9. Nxd5 Qxd5 10. a3 a5 11. Bd2 Qe6 12. Rc1 Qe7 13. Bc3 Nd4 14. e3 Nxf3+ 15. Qxf3 Bd6 16. Qh5 c6 17. f4 exf4 18. gxf4 Qxe3+ 19. Kh1 Rd8 20. Rce1 Qc5 21. f5 Bf8 22. Be4 Rd5 23. Rf3 b5 24. Rg1 Ra7 25. Bf6 g6 26. Qh3 Rd6 27. Qh4 Rxf6 28. Qxf6 Be7 29. Qxc6 Qxc6 30. Bxc6 Kg7 31. fxg6 fxg6 32. d4 a4 33. d5 b4 34. Be8 Bg5 35. h4 Bxh4 36. Rxg6+ Kh7 37. Rc6 Bg4 38. Rf4 Rg7 1-0`
  },
  {
    id: 'carlsen-vachierlagrave-2019',
    rank: 67,
    title: 'vs. Vachier Lagrave, GRENKE Chess Classic 2019',
    event: 'GRENKE Chess Classic 2019',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'M. Vachier Lagrave',
    result: '1-0',
    significance: 'GRENKE Chess Classic 2019, Karlsruhe/Baden Baden GER, 2019. Carlsen wins with White in 43 moves. Opening: English Opening: Symmetrical.',
    pgn: `[Event "GRENKE Chess Classic 2019"]
[Site "Karlsruhe/Baden Baden GER"]
[Date "2019.04.29"]
[Round "9.3"]
[White "Magnus Carlsen"]
[Black "M. Vachier Lagrave"]
[Result "1-0"]
[WhiteElo "2845"]
[BlackElo "2773"]
[ECO "A37"]

1. c4 c5 2. g3 g6 3. Bg2 Bg7 4. Nc3 Nc6 5. Nf3 d6 6. O-O Bf5 7. h3 Nf6 8. d3 O-O 9. Be3 a6 10. Qd2 b5 11. cxb5 axb5 12. Nxb5 Qa5 13. Nc3 Rab8 14. Rfc1 Rfc8 15. b3 e5 16. Bh6 Nd4 17. Bxg7 Nxf3+ 18. exf3 Kxg7 19. f4 Qa6 20. fxe5 dxe5 21. Na4 Nd7 22. Rc3 Rb4 23. g4 Be6 24. Nxc5 Nxc5 25. Rxc5 Rxb3 26. Rxc8 Bxc8 27. Rc1 Rxd3 28. Qe2 Be6 29. Qxe5+ Kg8 30. Rb1 Rd8 31. Rb8 Rxb8 32. Qxb8+ Kg7 33. Bd5 Bxd5 34. Qe5+ f6 35. Qxd5 h5 36. gxh5 gxh5 37. Qd7+ Kg6 38. a4 Qe2 39. Qd5 f5 40. a5 f4 41. Kg2 Kh6 42. Qf5 Qc4 43. Kf3 1-0`
  },
  {
    id: 'carlsen-grischuk-2019',
    rank: 68,
    title: 'vs. Grischuk, 7th Norway Chess 2019',
    event: '7th Norway Chess 2019',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'A. Grischuk',
    result: '1-0',
    significance: '7th Norway Chess 2019, Stavanger NOR, 2019. Carlsen wins with White in 34 moves. Opening: Grünfeld Defense: Exchange Variation.',
    pgn: `[Event "7th Norway Chess 2019"]
[Site "Stavanger NOR"]
[Date "2019.06.06"]
[Round "3.1"]
[White "Magnus Carlsen"]
[Black "A. Grischuk"]
[Result "1-0"]
[WhiteElo "2875"]
[BlackElo "2775"]
[ECO "D85"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Be3 c5 8. Rc1 Qa5 9. Qd2 O-O 10. Nf3 Bg4 11. d5 b5 12. Be2 Nd7 13. O-O Bxf3 14. Bxf3 c4 15. Be2 Rfd8 16. f4 Nb6 17. Bf3 Qa3 18. h4 e6 19. h5 Na4 20. hxg6 hxg6 21. f5 exf5 22. exf5 Qd6 23. Bf4 Qb6+ 24. Kh1 gxf5 25. d6 Rab8 26. Bd5 Nc5 27. Bg3 Ne6 28. Rxf5 Rxd6 29. Bxd6 Qxd6 30. Qe3 Qb6 31. Qf3 Rf8 32. Rf1 Nd8 33. Rh5 Qc7 34. Qe4 1-0`
  },
  {
    id: 'carlsen-so-2019',
    rank: 69,
    title: 'vs. So, 7th Sinquefield Cup 2019',
    event: '7th Sinquefield Cup 2019',
    year: 2019,
    white: 'Magnus Carlsen',
    black: 'W. So',
    result: '1-0',
    significance: '7th Sinquefield Cup 2019, Saint Louis USA, 2019. Carlsen wins with White in 43 moves. Opening: Giuoco Piano.',
    pgn: `[Event "7th Sinquefield Cup 2019"]
[Site "Saint Louis USA"]
[Date "2019.08.27"]
[Round "10.4"]
[White "Magnus Carlsen"]
[Black "W. So"]
[Result "1-0"]
[WhiteElo "2882"]
[BlackElo "2776"]
[ECO "C50"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 O-O 6. c3 d6 7. h3 h6 8. Re1 a6 9. a4 a5 10. Nbd2 Be6 11. Bb5 Na7 12. d4 Nxb5 13. dxc5 Na7 14. b3 Re8 15. cxd6 Qxd6 16. Ba3 c5 17. Nc4 Qxd1 18. Raxd1 Bxc4 19. bxc4 b6 20. Nh4 Rad8 21. f3 g6 22. g3 Nh5 23. Kf2 Nc6 24. Bc1 Kg7 25. Be3 Rxd1 26. Rxd1 Rd8 27. Rb1 Rb8 28. Ng2 Nf6 29. Ke2 Ne8 30. Bf2 Nd6 31. Ne3 Ne7 32. Nd5 Nxd5 33. cxd5 Rb7 34. Kd3 f5 35. c4 fxe4+ 36. fxe4 Rf7 37. Rxb6 Rxf2 38. Rxd6 Rf3+ 39. Ke2 Rc3 40. Re6 Rxc4 41. Rxe5 Rxa4 42. Re7+ Kf6 43. d6 1-0`
  },
  {
    id: 'vachierlagrave-carlsen-2019',
    rank: 70,
    title: 'vs. Vachier Lagrave, 7th Sinquefield Cup 2019',
    event: '7th Sinquefield Cup 2019',
    year: 2019,
    white: 'M. Vachier Lagrave',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '7th Sinquefield Cup 2019, Saint Louis USA, 2019. Carlsen wins with Black in 44 moves. Opening: Sicilian Rossolimo.',
    pgn: `[Event "7th Sinquefield Cup 2019"]
[Site "Saint Louis USA"]
[Date "2019.08.28"]
[Round "11.2"]
[White "M. Vachier Lagrave"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2778"]
[BlackElo "2882"]
[ECO "B31"]

1. e4 c5 2. Nf3 Nc6 3. Bb5 g6 4. Bxc6 bxc6 5. d4 cxd4 6. Qxd4 f6 7. O-O d6 8. c4 c5 9. Qd3 Bg7 10. b3 Nh6 11. Nc3 Rb8 12. Bd2 O-O 13. Rae1 Nf7 14. h4 Rb7 15. h5 g5 16. Nh2 Ne5 17. Qg3 Kh8 18. f4 gxf4 19. Bxf4 Rg8 20. Re3 Nc6 21. Qf2 f5 22. Nf3 Bxc3 23. Rxc3 e5 24. Rd3 exf4 25. Qb2+ Rbg7 26. h6 fxe4 27. Rd2 exf3 28. hxg7+ Rxg7 29. Rxf3 Qg5 30. Rdf2 Nd4 31. Rxf4 Bf5 32. b4 Be6 33. Rf8+ Bg8 34. bxc5 dxc5 35. Qb8 Qe3 36. Qd6 Qc1+ 37. Kh2 Qg5 38. Qd5 Qh4+ 39. Kg1 Qe7 40. Qh5 Qe3 41. Qh4 Ne2+ 42. Kh1 Qc1+ 43. Rf1 Ng3+ 44. Kg1 Qe3+ 0-1`
  },
  {
    id: 'vachierlagrave-carlsen-2019-2',
    rank: 71,
    title: 'vs. Vachier Lagrave, 11th London Classic 2019',
    event: '11th London Classic 2019',
    year: 2019,
    white: 'M. Vachier Lagrave',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '11th London Classic 2019, London ENG, 2019. Carlsen wins with Black in 45 moves. Opening: Sicilian Defense.',
    pgn: `[Event "11th London Classic 2019"]
[Site "London ENG"]
[Date "2019.12.04"]
[Round "1.7"]
[White "M. Vachier Lagrave"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2780"]
[BlackElo "2872"]
[ECO "B56"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Bd7 6. Bg5 e6 7. Ndb5 Bxb5 8. Bxb5+ Nc6 9. Qf3 Be7 10. e5 dxe5 11. Bxc6+ bxc6 12. Qxc6+ Kf8 13. O-O Qc8 14. Qf3 Rb8 15. Rab1 h6 16. Bxf6 gxf6 17. Rfd1 f5 18. Qe3 Qc7 19. Na4 Kg7 20. b3 Qxc2 21. Qxe5+ Bf6 22. Qg3+ Kh7 23. Qd3 Rhc8 24. Qd2 Rc7 25. g3 Rbc8 26. a3 Kg6 27. Qxc2 Rxc2 28. b4 R8c4 29. Nc5 Bd4 30. Nd3 Ra2 31. Rbc1 Rxc1 32. Rxc1 Rxa3 33. Nf4+ Kf6 34. Kf1 Ra2 35. Ne2 Bb6 36. f4 Rb2 37. Rc4 Ke7 38. h4 Kd6 39. Nc3 Rf2+ 40. Ke1 Rf3 41. Ne2 Kd5 42. Rc8 Rb3 43. Kd2 Ke4 44. Nc3+ Kf3 45. Rh8 Bd4 0-1`
  },
  {
    id: 'carlsen-vitiugov-2020',
    rank: 72,
    title: 'vs. Vitiugov, 82nd Tata Steel GpA 2020',
    event: '82nd Tata Steel GpA',
    year: 2020,
    white: 'Magnus Carlsen',
    black: 'N. Vitiugov',
    result: '1-0',
    significance: '82nd Tata Steel GpA, Wijk aan Zee NED, 2020. Carlsen wins with White in 30 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "82nd Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2020.01.19"]
[Round "8.1"]
[White "Magnus Carlsen"]
[Black "N. Vitiugov"]
[Result "1-0"]
[WhiteElo "2872"]
[BlackElo "2747"]
[ECO "C84"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d3 b5 7. Bb3 d6 8. Bd2 O-O 9. h3 h6 10. Re1 Re8 11. a3 Bf8 12. Nc3 Rb8 13. Ba2 Ne7 14. Nh4 g5 15. Nf3 Ng6 16. Nh2 c6 17. Ne2 d5 18. Ng3 dxe4 19. dxe4 Rb7 20. Qf3 Nf4 21. Rad1 Rd7 22. Be3 Rxd1 23. Rxd1 Qe7 24. Ng4 Nxg4 25. hxg4 Rd8 26. Re1 c5 27. Nf5 Qc7 28. g3 Ne6 29. Qh1 f6 30. Bd5 1-0`
  },
  {
    id: 'carlsen-caruana-2020',
    rank: 73,
    title: 'vs. Caruana, 8th Norway Chess 2020',
    event: '8th Norway Chess 2020',
    year: 2020,
    white: 'Magnus Carlsen',
    black: 'F. Caruana',
    result: '1-0',
    significance: '8th Norway Chess 2020, Stavanger NOR, 2020. Carlsen wins with White in 51 moves. Opening: Nimzo-Indian Defense: Classical.',
    pgn: `[Event "8th Norway Chess 2020"]
[Site "Stavanger NOR"]
[Date "2020.10.08"]
[Round "4.1"]
[White "Magnus Carlsen"]
[Black "F. Caruana"]
[Result "1-0"]
[WhiteElo "2863"]
[BlackElo "2828"]
[ECO "E32"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. a3 Bxc3+ 6. Qxc3 d5 7. Bg5 dxc4 8. Qxc4 b6 9. Rd1 Ba6 10. Qa4 h6 11. Bh4 Qd7 12. Qc2 Qc6 13. Qxc6 Nxc6 14. Bxf6 gxf6 15. e3 Bxf1 16. Kxf1 Na5 17. Nf3 Nc4 18. Rb1 c5 19. Ke2 Rfc8 20. Rhc1 Nd6 21. dxc5 bxc5 22. Rc2 Kf8 23. Nd2 c4 24. Rbc1 Rab8 25. Kf3 c3 26. bxc3 Rc5 27. c4 f5 28. Ke2 Ke7 29. Kd3 Kd7 30. Rc3 Rc6 31. c5 Ne8 32. Nf3 Ra6 33. Ne5+ Ke7 34. Ke2 Nf6 35. R1c2 Nd5 36. Rd3 Rc8 37. Rb3 Rc7 38. Rc4 Ra5 39. Nd3 e5 40. Nxe5 Raxc5 41. Rxc5 Rxc5 42. Rb7+ Ke6 43. Nxf7 Ra5 44. Nd8+ Kd6 45. Rb3 Ra6 46. Nf7+ Kc5 47. Ne5 h5 48. Kd2 h4 49. Nd3+ Kc4 50. Kc2 Rd6 51. Nf4 1-0`
  },
  {
    id: 'carlsen-duda-2020',
    rank: 74,
    title: 'vs. Duda, 8th Norway Chess 2020',
    event: '8th Norway Chess 2020',
    year: 2020,
    white: 'Magnus Carlsen',
    black: 'J. Duda',
    result: '1-0',
    significance: '8th Norway Chess 2020, Stavanger NOR, 2020. Carlsen wins with White in 26 moves. Opening: Slav Defense.',
    pgn: `[Event "8th Norway Chess 2020"]
[Site "Stavanger NOR"]
[Date "2020.10.11"]
[Round "6.1"]
[White "Magnus Carlsen"]
[Black "J. Duda"]
[Result "1-0"]
[WhiteElo "2863"]
[BlackElo "2757"]
[ECO "D10"]

1. d4 d5 2. c4 c6 3. e3 Nf6 4. Nc3 e6 5. b3 b6 6. Bb2 Bb7 7. Bd3 Nbd7 8. Nge2 Bd6 9. O-O O-O 10. Ng3 c5 11. cxd5 cxd4 12. Nce4 Bxg3 13. Nxg3 dxe3 14. dxe6 exf2+ 15. Rxf2 fxe6 16. Qe2 Nc5 17. Bc2 Ba6 18. Qe1 Qe8 19. Rd1 Rc8 20. b4 Nb7 21. Ne4 Nd5 22. Rxf8+ Qxf8 23. Bb1 Qxb4 24. Nf6+ Kh8 25. Qxe6 Ra8 26. Qxd5 1-0`
  },
  {
    id: 'firouzja-carlsen-2020',
    rank: 75,
    title: 'vs. Firouzja, 8th Norway Chess 2020',
    event: '8th Norway Chess 2020',
    year: 2020,
    white: 'Alireza Firouzja',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '8th Norway Chess 2020, Stavanger NOR, 2020. Carlsen wins with Black in 69 moves. Opening: Réti Opening: King\'s Indian Attack.',
    pgn: `[Event "8th Norway Chess 2020"]
[Site "Stavanger NOR"]
[Date "2020.10.15"]
[Round "9.1"]
[White "Alireza Firouzja"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2728"]
[BlackElo "2863"]
[ECO "A05"]

1. Nf3 Nf6 2. g3 c5 3. Bg2 Nc6 4. O-O e5 5. e4 d6 6. c3 g6 7. d4 cxd4 8. cxd4 Bg4 9. dxe5 dxe5 10. Nc3 Bg7 11. h3 Bxf3 12. Qxd8+ Rxd8 13. Bxf3 O-O 14. Kg2 Nd4 15. Bg5 h6 16. Bxf6 Bxf6 17. Nd5 Rd6 18. Rac1 Bd8 19. Rfd1 Kg7 20. Ne3 Ra6 21. a3 h5 22. Nc4 Bf6 23. h4 Rc8 24. Ne3 Rac6 25. Rxc6 Rxc6 26. Rd3 Bd8 27. Bd1 Rc1 28. Bb3 b5 29. Rd1 Rc8 30. Ba2 a5 31. Rd3 a4 32. Kf1 Bb6 33. Rc3 Rxc3 34. bxc3 Nb3 35. Ke1 Bc5 36. Nc2 Nc1 37. Bd5 Nd3+ 38. Ke2 Nxf2 39. Bc6 f6 40. Ne3 Nh1 41. Nf1 Bxa3 42. Bxb5 Bb2 43. Bxa4 Bxc3 44. Kf3 Bd4 45. g4 hxg4+ 46. Kxg4 Nf2+ 47. Kf3 Kh6 48. Ng3 Nd3 49. Be8 Nf4 50. Ne2 Ne6 51. Bf7 Nc5 52. Ng3 Bc3 53. h5 Be1 54. Bxg6 Bxg3 55. Kxg3 Kg5 56. Kf3 Nb3 57. Bf7 Nd4+ 58. Kg3 Ne2+ 59. Kf3 Nf4 60. Kg3 Nxh5+ 61. Bxh5 Kxh5 62. Kh3 Kh6 63. Kh4 Kg7 64. Kg3 Kf8 65. Kf2 Ke7 66. Ke2 Ke8 67. Ke3 Kd7 68. Kd3 Kd6 69. Kc3 Kc5 0-1`
  },
  {
    id: 'carlsen-firouzja-2021',
    rank: 76,
    title: 'vs. Firouzja, 83rd Tata Steel Masters 2021',
    event: '83rd Tata Steel Masters',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'Alireza Firouzja',
    result: '1-0',
    significance: '83rd Tata Steel Masters, Wijk aan Zee NED, 2021. Carlsen wins with White in 40 moves. Opening: Indian Game.',
    pgn: `[Event "83rd Tata Steel Masters"]
[Site "Wijk aan Zee NED"]
[Date "2021.01.16"]
[Round "1.1"]
[White "Magnus Carlsen"]
[Black "Alireza Firouzja"]
[Result "1-0"]
[WhiteElo "2862"]
[BlackElo "2749"]
[ECO "D37"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Nbd7 5. Bg5 h6 6. Bh4 Be7 7. cxd5 Nxd5 8. Bxe7 Qxe7 9. e4 Nxc3 10. bxc3 O-O 11. Bd3 c5 12. O-O cxd4 13. cxd4 b6 14. a4 Bb7 15. a5 bxa5 16. Rxa5 Nf6 17. Re1 Rfd8 18. Qa1 Qc7 19. h3 a6 20. Rc5 Qf4 21. Re5 Nd7 22. Ra5 Nf6 23. d5 exd5 24. e5 Ne4 25. Qd4 Rdc8 26. Raa1 a5 27. Rab1 Bc6 28. e6 fxe6 29. Ne5 Qf6 30. f3 Ng5 31. Rb6 Be8 32. Qe3 a4 33. Ng4 Qd8 34. Rxe6 Nxe6 35. Qxe6+ Bf7 36. Nxh6+ gxh6 37. Qxh6 Qc7 38. Qh7+ Kf8 39. Qh8+ Bg8 40. Qh6+ 1-0`
  },
  {
    id: 'carlsen-vachierlagrave-2021',
    rank: 77,
    title: 'vs. Vachier Lagrave, 83rd Tata Steel Masters 2021',
    event: '83rd Tata Steel Masters',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'M. Vachier Lagrave',
    result: '1-0',
    significance: '83rd Tata Steel Masters, Wijk aan Zee NED, 2021. Carlsen wins with White in 40 moves. Opening: Grünfeld Defense: Exchange Variation.',
    pgn: `[Event "83rd Tata Steel Masters"]
[Site "Wijk aan Zee NED"]
[Date "2021.01.31"]
[Round "13.3"]
[White "Magnus Carlsen"]
[Black "M. Vachier Lagrave"]
[Result "1-0"]
[WhiteElo "2862"]
[BlackElo "2784"]
[ECO "D85"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Qa4+ Qd7 8. Qa3 b6 9. Nf3 c5 10. Be3 O-O 11. Rd1 cxd4 12. cxd4 Qd6 13. Qxd6 exd6 14. Rc1 Bb7 15. Bd3 Nc6 16. Kd2 Rac8 17. h4 Nb4 18. Bb1 Rce8 19. a3 Nc6 20. Ba2 Rxe4 21. Bd5 Na5 22. Bxe4 Bxe4 23. Rc7 a6 24. h5 b5 25. h6 Bf6 26. Bg5 Bh8 27. Rh4 Bd5 28. Kc3 Nc4 29. Nd2 Nxa3 30. Kb4 Nc4 31. Nxc4 Bxc4 32. Be7 Re8 33. Rf4 f5 34. g4 Kf7 35. Bxd6+ Ke6 36. Bc5 Bf6 37. gxf5+ gxf5 38. Rc6+ Kf7 39. Rxf5 Re6 40. d5 1-0`
  },
  {
    id: 'carlsen-firouzja-2021-2',
    rank: 78,
    title: 'vs. Firouzja, 9th Norway Chess 2021',
    event: '9th Norway Chess 2021',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'Alireza Firouzja',
    result: '1-0',
    significance: '9th Norway Chess 2021, Stavanger NOR, 2021. Carlsen wins with White in 52 moves. Opening: Ruy Lopez: Morphy Defense.',
    pgn: `[Event "9th Norway Chess 2021"]
[Site "Stavanger NOR"]
[Date "2021.09.13"]
[Round "6.1"]
[White "Magnus Carlsen"]
[Black "Alireza Firouzja"]
[Result "1-0"]
[WhiteElo "2855"]
[BlackElo "2754"]
[ECO "C78"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 Bc5 7. a4 Rb8 8. c3 d6 9. d4 Bb6 10. a5 Ba7 11. h3 Bb7 12. Be3 Nxe4 13. Nbd2 Nxd2 14. Qxd2 O-O 15. dxe5 dxe5 16. Qxd8 Rbxd8 17. Bxa7 Nxa7 18. Nxe5 Bd5 19. Bc2 Nc6 20. Nxc6 Bxc6 21. Rad1 Rfe8 22. Rxd8 Rxd8 23. Rd1 Rxd1+ 24. Bxd1 Kf8 25. f4 Ke7 26. Kf2 Kd6 27. b4 Bd5 28. g4 h6 29. g5 hxg5 30. fxg5 c5 31. Ke3 cxb4 32. cxb4 Ke5 33. h4 g6 34. Bg4 Be6 35. h5 gxh5 36. Bxh5 Kf5 37. Bf3 Bc8 38. Kd4 Kxg5 39. Ke5 f5 40. Kd6 f4 41. Ke5 Kg6 42. Kxf4 Kf6 43. Bd5 Bd7 44. Bb7 Ke6 45. Ke4 Kd6 46. Bxa6 Bc6+ 47. Kd4 Be8 48. Bb7 Bd7 49. Bf3 Bc8 50. Be2 Bd7 51. Bd3 Bc6 52. Be4 1-0`
  },
  {
    id: 'carlsen-nepomniachtchi-2021',
    rank: 79,
    title: 'The 136-Move Epic',
    event: 'WCh 2021',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'I. Nepomniachtchi',
    result: '1-0',
    significance: 'The longest World Championship game ever - 136 moves, nearly 8 hours of intense play.',
    pgn: `[Event "WCh 2021"]
[Site "Dubai UAE"]
[Date "2021.12.03"]
[Round "6"]
[White "Magnus Carlsen"]
[Black "I. Nepomniachtchi"]
[Result "1-0"]
[WhiteElo "2855"]
[BlackElo "2782"]
[ECO "D02"]

1. d4 Nf6 2. Nf3 d5 3. g3 e6 4. Bg2 Be7 5. O-O O-O 6. b3 c5 7. dxc5 Bxc5 8. c4 dxc4 9. Qc2 Qe7 10. Nbd2 Nc6 11. Nxc4 b5 12. Nce5 Nb4 13. Qb2 Bb7 14. a3 Nc6 15. Nd3 Bb6 16. Bg5 Rfd8 17. Bxf6 gxf6 18. Rac1 Nd4 19. Nxd4 Bxd4 20. Qa2 Bxg2 21. Kxg2 Qb7+ 22. Kg1 Qe4 23. Qc2 a5 24. Rfd1 Kg7 25. Rd2 Rac8 26. Qxc8 Rxc8 27. Rxc8 Qd5 28. b4 a4 29. e3 Be5 30. h4 h5 31. Kh2 Bb2 32. Rc5 Qd6 33. Rd1 Bxa3 34. Rxb5 Qd7 35. Rc5 e5 36. Rc2 Qd5 37. Rdd2 Qb3 38. Ra2 e4 39. Nc5 Qxb4 40. Nxe4 Qb3 41. Rac2 Bf8 42. Nc5 Qb5 43. Nd3 a3 44. Nf4 Qa5 45. Ra2 Bb4 46. Rd3 Kh6 47. Rd1 Qa4 48. Rda1 Bd6 49. Kg1 Qb3 50. Ne2 Qd3 51. Nd4 Kh7 52. Kh2 Qe4 53. Rxa3 Qxh4+ 54. Kg1 Qe4 55. Ra4 Be5 56. Ne2 Qc2 57. R1a2 Qb3 58. Kg2 Qd5+ 59. f3 Qd1 60. f4 Bc7 61. Kf2 Bb6 62. Ra1 Qb3 63. Re4 Kg7 64. Re8 f5 65. Raa8 Qb4 66. Rac8 Ba5 67. Rc1 Bb6 68. Re5 Qb3 69. Re8 Qd5 70. Rcc8 Qh1 71. Rc1 Qd5 72. Rb1 Ba7 73. Re7 Bc5 74. Re5 Qd3 75. Rb7 Qc2 76. Rb5 Ba7 77. Ra5 Bb6 78. Rab5 Ba7 79. Rxf5 Qd3 80. Rxf7+ Kxf7 81. Rb7+ Kg6 82. Rxa7 Qd5 83. Ra6+ Kh7 84. Ra1 Kg6 85. Nd4 Qb7 86. Ra2 Qh1 87. Ra6+ Kf7 88. Nf3 Qb1 89. Rd6 Kg7 90. Rd5 Qa2+ 91. Rd2 Qb1 92. Re2 Qb6 93. Rc2 Qb1 94. Nd4 Qh1 95. Rc7+ Kf6 96. Rc6+ Kf7 97. Nf3 Qb1 98. Ng5+ Kg7 99. Ne6+ Kf7 100. Nd4 Qh1 101. Rc7+ Kf6 102. Nf3 Qb1 103. Rd7 Qb2+ 104. Rd2 Qb1 105. Ng1 Qb4 106. Rd1 Qb3 107. Rd6+ Kg7 108. Rd4 Qb2+ 109. Ne2 Qb1 110. e4 Qh1 111. Rd7+ Kg8 112. Rd4 Qh2+ 113. Ke3 h4 114. gxh4 Qh3+ 115. Kd2 Qxh4 116. Rd3 Kf8 117. Rf3 Qd8+ 118. Ke3 Qa5 119. Kf2 Qa7+ 120. Re3 Qd7 121. Ng3 Qd2+ 122. Kf3 Qd1+ 123. Re2 Qb3+ 124. Kg2 Qb7 125. Rd2 Qb3 126. Rd5 Ke7 127. Re5+ Kf7 128. Rf5+ Ke8 129. e5 Qa2+ 130. Kh3 Qe6 131. Kh4 Qh6+ 132. Nh5 Qh7 133. e6 Qg6 134. Rf7 Kd8 135. f5 Qg1 136. Ng7 1-0`
  },
  {
    id: 'carlsen-nepomniachtchi-2021-2',
    rank: 80,
    title: 'vs. Nepomniachtchi, WCh 2021',
    event: 'WCh 2021',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'I. Nepomniachtchi',
    result: '1-0',
    significance: 'WCh 2021, Dubai UAE, round 8, 2021. Carlsen wins with White in 46 moves. Opening: Petrov Defense: Steinitz Attack.',
    pgn: `[Event "WCh 2021"]
[Site "Dubai UAE"]
[Date "2021.12.05"]
[Round "8"]
[White "Magnus Carlsen"]
[Black "I. Nepomniachtchi"]
[Result "1-0"]
[WhiteElo "2855"]
[BlackElo "2782"]
[ECO "C43"]

1. e4 e5 2. Nf3 Nf6 3. d4 Nxe4 4. Bd3 d5 5. Nxe5 Nd7 6. Nxd7 Bxd7 7. Nd2 Nxd2 8. Bxd2 Bd6 9. O-O h5 10. Qe1+ Kf8 11. Bb4 Qe7 12. Bxd6 Qxd6 13. Qd2 Re8 14. Rae1 Rh6 15. Qg5 c6 16. Rxe8+ Bxe8 17. Re1 Qf6 18. Qe3 Bd7 19. h3 h4 20. c4 dxc4 21. Bxc4 b5 22. Qa3+ Kg8 23. Qxa7 Qd8 24. Bb3 Rd6 25. Re4 Be6 26. Bxe6 Rxe6 27. Rxe6 fxe6 28. Qc5 Qa5 29. Qxc6 Qe1+ 30. Kh2 Qxf2 31. Qxe6+ Kh7 32. Qe4+ Kg8 33. b3 Qxa2 34. Qe8+ Kh7 35. Qxb5 Qf2 36. Qe5 Qb2 37. Qe4+ Kg8 38. Qd3 Qf2 39. Qc3 Qf4+ 40. Kg1 Kh7 41. Qd3+ g6 42. Qd1 Qe3+ 43. Kh1 g5 44. d5 g4 45. hxg4 h3 46. Qf3 1-0`
  },
  {
    id: 'nepomniachtchi-carlsen-2021',
    rank: 81,
    title: 'vs. Nepomniachtchi, WCh 2021',
    event: 'WCh 2021',
    year: 2021,
    white: 'I. Nepomniachtchi',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'WCh 2021, Dubai UAE, round 9, 2021. Carlsen wins with Black in 39 moves. Opening: English Opening.',
    pgn: `[Event "WCh 2021"]
[Site "Dubai UAE"]
[Date "2021.12.07"]
[Round "9"]
[White "I. Nepomniachtchi"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2782"]
[BlackElo "2855"]
[ECO "A13"]

1. c4 e6 2. g3 d5 3. Bg2 d4 4. Nf3 Nc6 5. O-O Bc5 6. d3 Nf6 7. Nbd2 a5 8. Nb3 Be7 9. e3 dxe3 10. Bxe3 Ng4 11. Bc5 O-O 12. d4 a4 13. Bxe7 Qxe7 14. Nc5 a3 15. bxa3 Rd8 16. Nb3 Nf6 17. Re1 Qxa3 18. Qe2 h6 19. h4 Bd7 20. Ne5 Be8 21. Qe3 Qb4 22. Reb1 Nxe5 23. dxe5 Ng4 24. Qe1 Qxe1+ 25. Rxe1 h5 26. Bxb7 Ra4 27. c5 c6 28. f3 Nh6 29. Re4 Ra7 30. Rb4 Rb8 31. a4 Raxb7 32. Rb6 Rxb6 33. cxb6 Rxb6 34. Nc5 Nf5 35. a5 Rb8 36. a6 Nxg3 37. Na4 c5 38. a7 Rd8 39. Nxc5 Ra8 0-1`
  },
  {
    id: 'nepomniachtchi-carlsen-2021-2',
    rank: 82,
    title: 'vs. Nepomniachtchi, WCh 2021',
    event: 'WCh 2021',
    year: 2021,
    white: 'I. Nepomniachtchi',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'WCh 2021, Dubai UAE, round 11, 2021. Carlsen wins with Black in 49 moves. Opening: Two Knights Defense.',
    pgn: `[Event "WCh 2021"]
[Site "Dubai UAE"]
[Date "2021.12.10"]
[Round "11"]
[White "I. Nepomniachtchi"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2782"]
[BlackElo "2855"]
[ECO "C50"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Bc5 5. c3 d6 6. O-O a5 7. Re1 Ba7 8. Na3 h6 9. Nc2 O-O 10. Be3 Bxe3 11. Nxe3 Re8 12. a4 Be6 13. Bxe6 Rxe6 14. Qb3 b6 15. Rad1 Ne7 16. h3 Qd7 17. Nh2 Rd8 18. Nhg4 Nxg4 19. hxg4 d5 20. d4 exd4 21. exd5 Re4 22. Qc2 Rf4 23. g3 dxe3 24. gxf4 Qxg4+ 25. Kf1 Qh3+ 26. Kg1 Nf5 27. d6 Nh4 28. fxe3 Qg3+ 29. Kf1 Nf3 30. Qf2 Qh3+ 31. Qg2 Qxg2+ 32. Kxg2 Nxe1+ 33. Rxe1 Rxd6 34. Kf3 Rd2 35. Rb1 g6 36. b4 axb4 37. Rxb4 Ra2 38. Ke4 h5 39. Kd5 Rc2 40. Rb3 h4 41. Kc6 h3 42. Kxc7 h2 43. Rb1 Rxc3+ 44. Kxb6 Rb3+ 45. Rxb3 h1=Q 46. a5 Qe4 47. Ka7 Qe7+ 48. Ka8 Kg7 49. Rb6 Qc5 0-1`
  },
  {
    id: 'carlsen-giri-2022',
    rank: 83,
    title: 'vs. Giri, 84th Tata Steel Masters 2022',
    event: '84th Tata Steel Masters',
    year: 2022,
    white: 'Magnus Carlsen',
    black: 'A. Giri',
    result: '1-0',
    significance: '84th Tata Steel Masters, Wijk aan Zee NED, 2022. Carlsen wins with White in 36 moves. Opening: Indian Game.',
    pgn: `[Event "84th Tata Steel Masters"]
[Site "Wijk aan Zee NED"]
[Date "2022.01.16"]
[Round "2.1"]
[White "Magnus Carlsen"]
[Black "A. Giri"]
[Result "1-0"]
[WhiteElo "2865"]
[BlackElo "2772"]
[ECO "E06"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Be7 5. Bg2 O-O 6. O-O dxc4 7. Na3 Bxa3 8. bxa3 Bd7 9. a4 Bc6 10. Ba3 Re8 11. Qc2 Nbd7 12. Rac1 a6 13. Qxc4 Nb6 14. Qc3 Nxa4 15. Qb3 Qd5 16. Rxc6 Qxc6 17. Ne5 Qb5 18. Qc2 Nd5 19. Rb1 Qa5 20. Bxd5 exd5 21. Rxb7 c5 22. Qf5 Rf8 23. Nxf7 Qd8 24. dxc5 Qf6 25. Qxf6 gxf6 26. Nh6+ Kh8 27. c6 Rfc8 28. c7 Nc3 29. Bb2 d4 30. Nf7+ Kg7 31. Nd6 Kg6 32. Kf1 Nb5 33. Nxc8 Rxc8 34. a4 Nxc7 35. Bxd4 Ne6 36. Be3 1-0`
  },
  {
    id: 'carlsen-rapport-2022',
    rank: 84,
    title: 'vs. Rapport, 84th Tata Steel Masters 2022',
    event: '84th Tata Steel Masters',
    year: 2022,
    white: 'Magnus Carlsen',
    black: 'R. Rapport',
    result: '1-0',
    significance: '84th Tata Steel Masters, Wijk aan Zee NED, 2022. Carlsen wins with White in 31 moves. Opening: Réti Opening.',
    pgn: `[Event "84th Tata Steel Masters"]
[Site "Wijk aan Zee NED"]
[Date "2022.01.21"]
[Round "6.1"]
[White "Magnus Carlsen"]
[Black "R. Rapport"]
[Result "1-0"]
[WhiteElo "2865"]
[BlackElo "2763"]
[ECO "E04"]

1. Nf3 d5 2. d4 Nf6 3. c4 e6 4. g3 dxc4 5. Bg2 Nc6 6. O-O Rb8 7. Be3 Bd6 8. Qc1 b5 9. b3 Bb7 10. bxc4 bxc4 11. Qxc4 Nb4 12. a3 Nbd5 13. Bg5 O-O 14. Nbd2 h6 15. Bxf6 Nxf6 16. Rfc1 Nd7 17. Qa4 c5 18. Qxa7 Bxf3 19. Bxf3 cxd4 20. Ra2 Qe7 21. a4 Rfd8 22. Qxd4 Rb4 23. Qc3 Nb6 24. a5 Qa7 25. Qe3 Be7 26. Rcc2 Bg5 27. Qc5 Be7 28. axb6 Qxa2 29. Qxe7 Qxc2 30. Qxd8+ Kh7 31. b7 1-0`
  },
  {
    id: 'carlsen-mamedyarov-2022',
    rank: 85,
    title: 'vs. Mamedyarov, 84th Tata Steel Masters 2022',
    event: '84th Tata Steel Masters',
    year: 2022,
    white: 'Magnus Carlsen',
    black: 'S. Mamedyarov',
    result: '1-0',
    significance: '84th Tata Steel Masters, Wijk aan Zee NED, 2022. Carlsen wins with White in 27 moves. Opening: Indian Game.',
    pgn: `[Event "84th Tata Steel Masters"]
[Site "Wijk aan Zee NED"]
[Date "2022.01.25"]
[Round "9.1"]
[White "Magnus Carlsen"]
[Black "S. Mamedyarov"]
[Result "1-0"]
[WhiteElo "2865"]
[BlackElo "2767"]
[ECO "E04"]

1. d4 Nf6 2. Nf3 d5 3. c4 e6 4. g3 dxc4 5. Bg2 Bb4+ 6. Bd2 a5 7. O-O O-O 8. e3 Ra6 9. Qc2 b5 10. a4 c6 11. Nc3 Rb6 12. e4 Be7 13. e5 Nd5 14. axb5 cxb5 15. Nxd5 exd5 16. Bxa5 Nc6 17. Bxb6 Qxb6 18. Ra8 h6 19. Rfa1 Be6 20. Qd1 b4 21. b3 c3 22. R8a6 Qc7 23. Ne1 f6 24. Nd3 fxe5 25. Nxe5 Nxe5 26. Rxe6 c2 27. Qe1 1-0`
  },
  {
    id: 'carlsen-radjabov-2022',
    rank: 86,
    title: 'vs. Radjabov, 10th Norway Chess 2022',
    event: '10th Norway Chess 2022',
    year: 2022,
    white: 'Magnus Carlsen',
    black: 'T. Radjabov',
    result: '1-0',
    significance: '10th Norway Chess 2022, Stavanger NOR, 2022. Carlsen wins with White in 36 moves. Opening: Indian Game.',
    pgn: `[Event "10th Norway Chess 2022"]
[Site "Stavanger NOR"]
[Date "2022.06.02"]
[Round "3.1"]
[White "Magnus Carlsen"]
[Black "T. Radjabov"]
[Result "1-0"]
[WhiteElo "2864"]
[BlackElo "2753"]
[ECO "E06"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Be7 5. Bg2 O-O 6. O-O dxc4 7. Qc2 b5 8. a4 Bb7 9. axb5 a6 10. bxa6 Nxa6 11. Qxc4 Bd5 12. Qc3 c5 13. Bf4 Ne4 14. Qc1 cxd4 15. Nxd4 Nec5 16. Bxd5 Qxd5 17. Be3 Qb7 18. Nd2 Rac8 19. Qb1 Nb4 20. N4f3 Qb5 21. Re1 Rfd8 22. Kf1 h6 23. Rc1 Bf8 24. Ne4 Nb3 25. Rxc8 Rxc8 26. Nc3 Qb7 27. Ra4 Nd5 28. Nxd5 Qxd5 29. Kg2 Qc6 30. Ra7 g5 31. Qd3 Nc5 32. Qc4 Qb6 33. Qa2 Qc6 34. b4 Nd7 35. b5 Qd6 36. Qa6 1-0`
  },
  {
    id: 'carlsen-giri-2022-2',
    rank: 87,
    title: 'vs. Giri, 10th Norway Chess 2022',
    event: '10th Norway Chess 2022',
    year: 2022,
    white: 'Magnus Carlsen',
    black: 'A. Giri',
    result: '1-0',
    significance: '10th Norway Chess 2022, Stavanger NOR, 2022. Carlsen wins with White in 34 moves. Opening: Indian Game.',
    pgn: `[Event "10th Norway Chess 2022"]
[Site "Stavanger NOR"]
[Date "2022.06.03"]
[Round "4.1"]
[White "Magnus Carlsen"]
[Black "A. Giri"]
[Result "1-0"]
[WhiteElo "2864"]
[BlackElo "2761"]
[ECO "D41"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c5 5. cxd5 cxd4 6. Qxd4 exd5 7. Bg5 Be7 8. e3 O-O 9. Be2 Nc6 10. Qd3 h6 11. Bh4 Be6 12. O-O Qb6 13. Bxf6 Bxf6 14. Nxd5 Bxd5 15. Qxd5 Qxb2 16. Bc4 Qxa1 17. Rxa1 Bxa1 18. g4 Rae8 19. h4 Re7 20. g5 hxg5 21. Nxg5 Bf6 22. Qf5 Bxg5 23. hxg5 Re5 24. Qf4 Rc5 25. g6 Ne5 26. gxf7+ Nxf7 27. Be6 Rh5 28. Qc7 g5 29. Qxb7 Rh6 30. Bb3 g4 31. Qxa7 Kg7 32. e4 Rh5 33. Qc7 Kf6 34. a4 1-0`
  },
  {
    id: 'carlsen-rapport-2023',
    rank: 88,
    title: 'vs. Rapport, 85th Tata Steel Masters 2023',
    event: '85th Tata Steel Masters',
    year: 2023,
    white: 'Magnus Carlsen',
    black: 'R. Rapport',
    result: '1-0',
    significance: '85th Tata Steel Masters, Wijk aan Zee NED, 2023. Carlsen wins with White in 36 moves. Opening: Petrov Defense.',
    pgn: `[Event "85th Tata Steel Masters"]
[Site "Wijk aan Zee NED"]
[Date "2023.01.21"]
[Round "7.6"]
[White "Magnus Carlsen"]
[Black "R. Rapport"]
[Result "1-0"]
[WhiteElo "2859"]
[BlackElo "2740"]
[ECO "C42"]

1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nd3 Nxe4 5. Qe2 Qe7 6. Nf4 c6 7. f3 Nf6 8. d4 Bf5 9. c4 h5 10. Nc3 Na6 11. Kf2 Nb4 12. Qd1 O-O-O 13. Nd3 d5 14. c5 Nxd3+ 15. Bxd3 Ne4+ 16. fxe4 dxe4 17. Be2 Qf6 18. Be3 Bxc5 19. Rf1 Qh4+ 20. Kg1 Bd6 21. Rxf5 Qxh2+ 22. Kf1 Qh1+ 23. Bg1 g6 24. Rxf7 Rhf8 25. Bc4 Bh2 26. Kf2 Rxf7+ 27. Bxf7 Rf8 28. Qb3 Bxg1+ 29. Rxg1 Qh4+ 30. Ke2 Qg4+ 31. Kd2 Qf4+ 32. Kd1 Rxf7 33. Ne2 Qf5 34. Qh3 Qxh3 35. gxh3 Rf3 36. Rg3 1-0`
  },
  {
    id: 'erigaisi-carlsen-2023',
    rank: 89,
    title: 'vs. Erigaisi, 85th Tata Steel Masters 2023',
    event: '85th Tata Steel Masters',
    year: 2023,
    white: 'Arjun Erigaisi',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '85th Tata Steel Masters, Wijk aan Zee NED, 2023. Carlsen wins with Black in 56 moves. Opening: Réti Opening: King\'s Indian Attack.',
    pgn: `[Event "85th Tata Steel Masters"]
[Site "Wijk aan Zee NED"]
[Date "2023.01.29"]
[Round "13.3"]
[White "Arjun Erigaisi"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2722"]
[BlackElo "2859"]
[ECO "A05"]

1. Nf3 Nf6 2. g3 b6 3. Bg2 Bb7 4. O-O g6 5. c4 Bg7 6. d4 O-O 7. d5 Na6 8. Nc3 Nc5 9. Nd4 e5 10. Nc2 a5 11. b3 d6 12. e4 Bc8 13. Na3 Ne8 14. Nab5 Bd7 15. Rb1 f5 16. f3 f4 17. a3 g5 18. b4 Nb7 19. g4 h5 20. h3 Rf7 21. Kf2 Bf8 22. Rg1 Rh7 23. Bf1 Nf6 24. Ke1 Qc8 25. Rb2 Nd8 26. Qd3 Nf7 27. Kd1 Be7 28. Kc2 axb4 29. axb4 hxg4 30. hxg4 Ra1 31. Rb1 Rh2+ 32. Rg2 Rxg2+ 33. Bxg2 Rxb1 34. Kxb1 Nxg4 35. fxg4 Bxg4 36. Bf3 Bh3 37. Bh5 g4 38. Ne2 Bf1 39. Qd1 Bg2 40. Bg6 Ng5 41. Nbc3 Bf3 42. Qf1 Kg7 43. Bf5 Qh8 44. Nxf4 exf4 45. Bxf4 Bf6 46. Qc1 Nf7 47. Nb5 Qa8 48. e5 dxe5 49. Bd2 Nd6 50. Bh6+ Kf7 51. Nxd6+ cxd6 52. Bg5 Qh8 53. Be3 e4 54. Bxb6 Qh2 55. Bg1 Qe2 56. b5 Qd3+ 0-1`
  },
  {
    id: 'keymer-carlsen-2024',
    rank: 90,
    title: 'vs. Keymer, GRENKE Chess Classic 2024',
    event: 'GRENKE Chess Classic 2024',
    year: 2024,
    white: 'Vincent Keymer',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: 'GRENKE Chess Classic 2024, Karlsruhe GER, 2024. Carlsen wins with Black in 66 moves. Opening: Indian Game.',
    pgn: `[Event "GRENKE Chess Classic 2024"]
[Site "Karlsruhe GER"]
[Date "2024.03.28"]
[Round "5.2"]
[White "Vincent Keymer"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2738"]
[BlackElo "2830"]
[ECO "A61"]

1. d4 Nf6 2. c4 e6 3. Nc3 c5 4. d5 exd5 5. cxd5 d6 6. Nf3 g6 7. Bf4 Bg7 8. Qa4+ Bd7 9. Qb3 b5 10. Bxd6 Qb6 11. Be5 O-O 12. e3 c4 13. Qd1 b4 14. Nb1 Bb5 15. a4 Ba6 16. Nbd2 Rc8 17. Rc1 c3 18. bxc3 Bxf1 19. Kxf1 Nbd7 20. Bxf6 Nxf6 21. cxb4 Qa6+ 22. b5 Rxc1 23. Qxc1 Qxa4 24. g3 Qxb5+ 25. Kg2 Qxd5 26. Qc4 a5 27. Ra1 Qxc4 28. Nxc4 a4 29. Nb6 Nd5 30. Rxa4 Nxb6 31. Rb4 Nd5 32. Rb7 h6 33. Rd7 Nc3 34. Rd2 Bf6 35. h4 Ra2 36. Rxa2 Nxa2 37. Ne1 Nb4 38. Nf3 Bc3 39. Ng1 Kg7 40. Kf3 Kf6 41. Ne2 Be5 42. Ng1 Ke6 43. Ne2 Kd5 44. Ng1 Nd3 45. Ke2 Nc1+ 46. Kd2 Na2 47. Kd3 Nc3 48. Nf3 Ne4 49. Ke2 Bg7 50. Ne1 Kc4 51. Kf3 Nc3 52. Kg2 Nd5 53. Kf1 Bc3 54. Nf3 Kd3 55. Ng1 Nf6 56. Nh3 Be5 57. Ng1 Ne4 58. Kg2 f5 59. Nh3 g5 60. hxg5 hxg5 61. f4 g4 62. fxe5 gxh3+ 63. Kxh3 Ng5+ 64. Kh4 Nf3+ 65. Kh5 Nxe5 66. Kg5 Ke4 0-1`
  },
  {
    id: 'carlsen-rapport-2024',
    rank: 91,
    title: 'vs. Rapport, GRENKE Chess Classic 2024',
    event: 'GRENKE Chess Classic 2024',
    year: 2024,
    white: 'Magnus Carlsen',
    black: 'R. Rapport',
    result: '1-0',
    significance: 'GRENKE Chess Classic 2024, Karlsruhe GER, 2024. Carlsen wins with White in 32 moves. Opening: Indian Game.',
    pgn: `[Event "GRENKE Chess Classic 2024"]
[Site "Karlsruhe GER"]
[Date "2024.03.28"]
[Round "6.2"]
[White "Magnus Carlsen"]
[Black "R. Rapport"]
[Result "1-0"]
[WhiteElo "2830"]
[BlackElo "2720"]
[ECO "A61"]

1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 d6 5. Nc3 exd5 6. cxd5 g6 7. h3 Bg7 8. e4 O-O 9. Be3 Re8 10. Nd2 a6 11. a4 Nxe4 12. Ncxe4 f5 13. Be2 fxe4 14. Nc4 a5 15. Bf4 Bf8 16. Ra3 Na6 17. O-O Nb4 18. Qd2 b6 19. Rg3 Ra7 20. h4 Rf7 21. Bg5 Be7 22. Bxe7 Qxe7 23. h5 Bf5 24. Bg4 Bxg4 25. Rxg4 Rg7 26. Re1 gxh5 27. Rgxe4 Qxe4 28. Rxe4 Rxe4 29. Nxd6 Re5 30. f4 Rxd5 31. Qe2 h6 32. Qe6+ 1-0`
  },
  {
    id: 'carlsen-rapport-2024-2',
    rank: 92,
    title: 'vs. Rapport, GRENKE Chess Playoffs 1-2 2024',
    event: 'GRENKE Chess Playoffs 1-2',
    year: 2024,
    white: 'Magnus Carlsen',
    black: 'R. Rapport',
    result: '1-0',
    significance: 'GRENKE Chess Playoffs 1-2, Karlsruhe GER, round 1, 2024. Carlsen wins with White in 51 moves. Opening: French Defense: Winawer.',
    pgn: `[Event "GRENKE Chess Playoffs 1-2"]
[Site "Karlsruhe GER"]
[Date "2024.04.01"]
[Round "1"]
[White "Magnus Carlsen"]
[Black "R. Rapport"]
[Result "1-0"]
[WhiteElo "2830"]
[BlackElo "2719"]
[ECO "C19"]

1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Qc7 8. Bd3 Qa5 9. Bd2 c4 10. Be2 Rg8 11. a4 Nbc6 12. Qh3 h6 13. Bh5 Bd7 14. Ne2 g6 15. Bg4 h5 16. Bf3 Nf5 17. g4 hxg4 18. Bxg4 O-O-O 19. Bxf5 exf5 20. Bg5 Rde8 21. Kd2 Rh8 22. Qf3 Nd8 23. Bf6 Rh6 24. h4 Ne6 25. h5 g5 26. Rae1 f4 27. Reg1 Rg8 28. Nxf4 Rxf6 29. exf6 Nxf4 30. h6 Ne6 31. h7 Rh8 32. Qe3 Qd8 33. Rxg5 Nxg5 34. Qxg5 Kc7 35. Qg7 Be6 36. Re1 Kb6 37. Re5 Qc8 38. f4 a6 39. Kc1 Ka7 40. f5 Bd7 41. a5 Qf8 42. Kb2 Qc8 43. Rxd5 Bc6 44. Re5 Bd7 45. Qxf7 Bxf5 46. Rc5 Qe6 47. Qxe6 Bxe6 48. Rc7 Bf5 49. Rg7 Bxh7 50. f7 Bd3 51. cxd3 1-0`
  },
  {
    id: 'caruana-carlsen-2024',
    rank: 93,
    title: 'vs. Caruana, 12th Norway Chess 2024',
    event: '12th Norway Chess 2024',
    year: 2024,
    white: 'F. Caruana',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '12th Norway Chess 2024, Stavanger NOR, 2024. Carlsen wins with Black in 66 moves. Opening: Two Knights Defense.',
    pgn: `[Event "12th Norway Chess 2024"]
[Site "Stavanger NOR"]
[Date "2024.05.30"]
[Round "4.1"]
[White "F. Caruana"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2805"]
[BlackElo "2830"]
[ECO "C50"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Bc5 5. O-O d6 6. c3 a6 7. a4 Ba7 8. h3 h6 9. Be3 Bxe3 10. fxe3 Be6 11. Bxe6 fxe6 12. Nbd2 O-O 13. Rf2 Qe7 14. Qb3 Rab8 15. Raf1 Nd8 16. Qd1 b5 17. axb5 axb5 18. Nh2 Nf7 19. Ng4 Nd7 20. d4 c5 21. Qe2 c4 22. Nh2 Nf6 23. Ng4 Nd7 24. Nh2 Ra8 25. b3 cxb3 26. Nxb3 Rac8 27. Qd3 Nf6 28. Nd2 Qc7 29. Qxb5 Qxc3 30. Nhf3 Qxe3 31. dxe5 dxe5 32. Nxe5 Ng5 33. Qd3 Qc5 34. Nef3 Rcd8 35. Qb1 Nh5 36. Qc1 Qa7 37. Qa1 Qb6 38. Qb1 Qc5 39. Qc1 Qe7 40. Nxg5 Rxf2 41. Rxf2 Qxg5 42. Qc3 Ng3 43. Kh2 Rxd2 44. Qxg3 Rxf2 45. Qxf2 Qe5+ 46. Kg1 Qxe4 47. Qa7 h5 48. Qe7 Qe1+ 49. Kh2 Qe5+ 50. Kg1 Kh7 51. Qe8 h4 52. Qe7 Qd4+ 53. Kh1 Qa1+ 54. Kh2 Qf6 55. Qe8 Kh6 56. Kg1 e5 57. Qa4 Qf4 58. Qc6+ Kg5 59. Qc7 Qd4+ 60. Kf1 Kf4 61. Qxg7 Ke3 62. Kg1 e4 63. Qh6+ Ke2+ 64. Kh1 e3 65. Qa6+ Kf2 66. Kh2 e2 0-1`
  },
  {
    id: 'le-carlsen-2024',
    rank: 94,
    title: 'vs. Le, 45th Olympiad 2024',
    event: '45th Olympiad 2024',
    year: 2024,
    white: 'Quang Le',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '45th Olympiad 2024, Budapest HUN, 2024. Carlsen wins with Black in 45 moves. Opening: Indian Game.',
    pgn: `[Event "45th Olympiad 2024"]
[Site "Budapest HUN"]
[Date "2024.09.19"]
[Round "8.6"]
[White "Quang Le"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2741"]
[BlackElo "2832"]
[ECO "D52"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. Bg5 Nbd7 6. e3 h6 7. Bh4 Be7 8. Rc1 O-O 9. a3 a6 10. cxd5 exd5 11. Qc2 Ne8 12. Bg3 Bd6 13. Bd3 Bxg3 14. hxg3 Ndf6 15. Ne5 Nd6 16. f3 Re8 17. Ne2 Nd7 18. Rh5 f6 19. Nxd7 Bxd7 20. Kf2 f5 21. Re1 Rxe3 22. Kxe3 Qe8+ 23. Kf2 Qxh5 24. Qc5 Qg6 25. Qb6 Qf6 26. Qc7 Be8 27. Nf4 Rc8 28. Qxc8 Nxc8 29. Rxe8+ Kf7 30. Rxc8 Qxd4+ 31. Kf1 g5 32. Rf8+ Ke7 33. Ng6+ Kd6 34. Bxf5 Qxb2 35. f4 Qxa3 36. Kf2 a5 37. Ne5 a4 38. Rf7 Qb2+ 39. Kf1 Qb5+ 40. Bd3 Qb3 41. Bf5 a3 42. Nd3 Qxd3+ 43. Bxd3 a2 44. Rxb7 a1=Q+ 45. Ke2 Qg1 0-1`
  },
  {
    id: 'carlsen-gukesh-2025',
    rank: 95,
    title: 'vs. Gukesh, 13th Norway Chess 2025',
    event: '13th Norway Chess 2025',
    year: 2025,
    white: 'Magnus Carlsen',
    black: 'D. Gukesh',
    result: '1-0',
    significance: '13th Norway Chess 2025, Stavanger NOR, 2025. Carlsen wins with White in 55 moves. Opening: Indian Game.',
    pgn: `[Event "13th Norway Chess 2025"]
[Site "Stavanger NOR"]
[Date "2025.05.26"]
[Round "1.3"]
[White "Magnus Carlsen"]
[Black "D. Gukesh"]
[Result "1-0"]
[WhiteElo "2837"]
[BlackElo "2787"]
[ECO "A45"]

1. d4 Nf6 2. Nc3 d5 3. Bf4 c5 4. e3 Bg4 5. Be2 Bxe2 6. Ncxe2 Nc6 7. Nf3 e6 8. c3 Be7 9. Ng3 O-O 10. Qe2 h6 11. Rd1 Qa5 12. a3 Rfd8 13. h4 Qa4 14. Ne5 Nxe5 15. Bxe5 Nd7 16. Bf4 Qa6 17. Qf3 Bd6 18. Nh5 Bxf4 19. Qxf4 e5 20. Qg3 Qg6 21. Qxg6 fxg6 22. Ng3 exd4 23. cxd4 c4 24. Ne2 b5 25. Nc3 Nf6 26. Rb1 Rab8 27. f3 a5 28. b4 cxb3 29. Rxb3 b4 30. axb4 Rxb4 31. Ra3 Re8 32. Kd2 Rb2+ 33. Kd3 Rxg2 34. Rxa5 Rg3 35. Rf1 g5 36. hxg5 Rxg5 37. Rfa1 h5 38. Ra8 Rxa8 39. Rxa8+ Kh7 40. e4 dxe4+ 41. fxe4 h4 42. e5 h3 43. exf6 h2 44. f7 Rg3+ 45. Kd2 h1=Q 46. f8=Q Qh6+ 47. Kc2 Qg6+ 48. Kb2 Qb6+ 49. Ka2 Rg2+ 50. Ka3 Qb2+ 51. Ka4 Qxc3 52. Qh8+ Kg6 53. Ra6+ Kf5 54. Qf8+ Ke4 55. Re6+ 1-0`
  },
  {
    id: 'carlsen-erigaisi-2025',
    rank: 96,
    title: 'vs. Erigaisi, 13th Norway Chess 2025',
    event: '13th Norway Chess 2025',
    year: 2025,
    white: 'Magnus Carlsen',
    black: 'Arjun Erigaisi',
    result: '1-0',
    significance: '13th Norway Chess 2025, Stavanger NOR, 2025. Carlsen wins with White in 48 moves. Opening: English Opening: Symmetrical.',
    pgn: `[Event "13th Norway Chess 2025"]
[Site "Stavanger NOR"]
[Date "2025.05.29"]
[Round "4.1"]
[White "Magnus Carlsen"]
[Black "Arjun Erigaisi"]
[Result "1-0"]
[WhiteElo "2837"]
[BlackElo "2782"]
[ECO "A36"]

1. c4 c5 2. g3 g6 3. Bg2 Bg7 4. Nc3 Nc6 5. Rb1 Nf6 6. a3 a5 7. d3 e6 8. Nf3 O-O 9. Be3 Qe7 10. Na4 d6 11. O-O Rb8 12. d4 cxd4 13. Nxd4 Nxd4 14. Bxd4 b5 15. cxb5 Rxb5 16. Nc3 Rb8 17. Qa4 Bb7 18. Bxb7 Qxb7 19. Qxa5 e5 20. Be3 d5 21. Bg5 d4 22. Bxf6 Bxf6 23. Nd5 Bg5 24. Nb4 Bd2 25. Qxe5 Bxb4 26. axb4 Qxb4 27. Rfd1 Rfe8 28. Qf4 Rxe2 29. Rxd4 Qb7 30. Qf6 Re6 31. Rd8+ Rxd8 32. Qxd8+ Kg7 33. Qd4+ Kg8 34. b4 h5 35. b5 Rb6 36. Re1 Qb8 37. Re8+ Qxe8 38. Qxb6 Qe1+ 39. Kg2 Qe4+ 40. Kf1 Qd3+ 41. Ke1 Qc3+ 42. Ke2 Qc2+ 43. Ke3 Qc3+ 44. Ke4 Qc4+ 45. Ke5 Kg7 46. h4 Qd3 47. Qc5 Qf5+ 48. Kd6 1-0`
  },
  {
    id: 'gukesh-carlsen-2025',
    rank: 97,
    title: 'vs. Gukesh, 13th Norway Chess 2025',
    event: '13th Norway Chess 2025',
    year: 2025,
    white: 'D. Gukesh',
    black: 'Magnus Carlsen',
    result: '1-0',
    significance: '13th Norway Chess 2025, Stavanger NOR, 2025. Carlsen loses with Black in 62 moves. Opening: Ruy Lopez: Berlin Defense.',
    pgn: `[Event "13th Norway Chess 2025"]
[Site "Stavanger NOR"]
[Date "2025.06.01"]
[Round "6.3"]
[White "D. Gukesh"]
[Black "Magnus Carlsen"]
[Result "1-0"]
[WhiteElo "2787"]
[BlackElo "2837"]
[ECO "C65"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. O-O d6 7. h3 a6 8. Ba4 h6 9. Re1 b5 10. Bc2 Bb6 11. Nbd2 Ne7 12. a4 Rb8 13. d4 Ng6 14. Nf1 c5 15. Ng3 cxd4 16. cxd4 bxa4 17. Bxa4 Bb7 18. d5 a5 19. Be3 Bc8 20. b3 Bxe3 21. Rxe3 Nf4 22. Bc6 Rb4 23. Qc2 g6 24. Kh1 Ba6 25. Qa2 Bd3 26. Nd2 h5 27. Qxa5 Qxa5 28. Rxa5 h4 29. Ra4 Rfb8 30. Ra2 Kg7 31. Ra7 Rd4 32. Nf3 hxg3 33. fxg3 Nxh3 34. gxh3 Bxe4 35. Kh2 Rd1 36. g4 Bxd5 37. Bxd5 Nxd5 38. Re2 Nf4 39. Rc2 Kf6 40. h4 Ke6 41. Ng5+ Kd5 42. Ra5+ Kd4 43. Ra4+ Kd3 44. Rf2 f6 45. Rf3+ Ke2 46. Ra2+ Rd2 47. Rxd2+ Kxd2 48. Ne4+ Ke2 49. Kg3 d5 50. Nxf6 Rf8 51. Rf2+ Ke1 52. Nd7 Ne2+ 53. Rxe2+ Kxe2 54. Nxf8 d4 55. Ne6 d3 56. Nc5 Ke3 57. Na4 e4 58. h5 gxh5 59. gxh5 Kd2 60. Nb2 e3 61. Nc4+ Ke2 62. Kf4 1-0`
  },
  {
    id: 'gukesh-carlsen-2026',
    rank: 98,
    title: 'vs. Gukesh, 14th Norway Chess 2026',
    event: '14th Norway Chess 2026',
    year: 2026,
    white: 'D. Gukesh',
    black: 'Magnus Carlsen',
    result: '0-1',
    significance: '14th Norway Chess 2026, Oslo NOR, 2026. Carlsen wins with Black in 42 moves. Opening: Queen\'s Gambit Declined: Exchange.',
    pgn: `[Event "14th Norway Chess 2026"]
[Site "Oslo NOR"]
[Date "2026.05.28"]
[Round "4.2"]
[White "D. Gukesh"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2732"]
[BlackElo "2840"]
[ECO "D35"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 exd5 5. Bg5 Bb4 6. Nf3 Qd6 7. Nd2 c6 8. Qc2 h6 9. Nb5 Qe7 10. Bxf6 gxf6 11. Nc3 Nd7 12. e3 Nb6 13. Bd3 Rg8 14. g3 Bh3 15. a3 Bxc3 16. bxc3 Nc8 17. c4 dxc4 18. Qxc4 Nd6 19. Qb4 a5 20. Qc3 Rg5 21. Be2 Rc8 22. f3 c5 23. Kf2 Rd5 24. Qb2 cxd4 25. exd4 Kf8 26. Rhe1 Be6 27. Rad1 f5 28. Nf1 f4 29. Bd3 Qf6 30. Be4 Rb5 31. Qd2 Bb3 32. Rc1 Rxc1 33. Qxc1 Qxd4+ 34. Kg2 Be6 35. Qxf4 Rb2+ 36. Kh1 Qf2 37. Qxd6+ Kg7 38. Qe5+ f6 39. Qxb2 Qxb2 40. Rb1 Qxa3 41. Rxb7+ Kf8 42. g4 a4 0-1`
  },
  {
    id: 'carlsen-firouzja-2026',
    rank: 99,
    title: 'vs. Firouzja, 14th Norway Chess 2026',
    event: '14th Norway Chess 2026',
    year: 2026,
    white: 'Magnus Carlsen',
    black: 'Alireza Firouzja',
    result: '1-0',
    significance: '14th Norway Chess 2026, Oslo NOR, 2026. Carlsen wins with White in 55 moves. Opening: Ruy Lopez: Morphy Defense.',
    pgn: `[Event "14th Norway Chess 2026"]
[Site "Oslo NOR"]
[Date "2026.05.31"]
[Round "6.2"]
[White "Magnus Carlsen"]
[Black "Alireza Firouzja"]
[Result "1-0"]
[WhiteElo "2840"]
[BlackElo "2759"]
[ECO "C77"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. Nc3 Be7 6. O-O b5 7. Bb3 O-O 8. d3 d6 9. a3 Na5 10. Ba2 Be6 11. Bxe6 fxe6 12. b4 Nc6 13. Bd2 Qe8 14. Ne2 Nh5 15. c3 Qg6 16. Ng3 Nf4 17. a4 Qf7 18. d4 g5 19. axb5 axb5 20. Rxa8 Rxa8 21. dxe5 dxe5 22. Bxf4 exf4 23. Qd7 fxg3 24. Qxc6 gxf2+ 25. Kxf2 Rf8 26. Kg1 Bd6 27. Qxb5 g4 28. Nd2 Bf4 29. g3 Be3+ 30. Kg2 Qg7 31. Qd3 Bb6 32. Rxf8+ Qxf8 33. Qe2 h5 34. h3 Qg7 35. hxg4 hxg4 36. c4 c6 37. Nf1 Kf8 38. Nh2 Qc3 39. Nxg4 Qxb4 40. Ne5 Qd6 41. Qh5 Ke7 42. Qh7+ Ke8 43. Qg8+ Ke7 44. Qg7+ Ke8 45. Kh3 Bd4 46. Qh8+ Ke7 47. Nxc6+ Qxc6 48. Qxd4 Kf7 49. c5 Qb5 50. Kh4 Kg6 51. Qe5 Qc4 52. Qg5+ Kf7 53. Kh5 Qc3 54. e5 Qc2 55. Qf6+ 1-0`
  },
  {
    id: 'carlsen-gukesh-2026',
    rank: 100,
    title: 'vs. Gukesh, 14th Norway Chess 2026',
    event: '14th Norway Chess 2026',
    year: 2026,
    white: 'Magnus Carlsen',
    black: 'D. Gukesh',
    result: '1-0',
    significance: '14th Norway Chess 2026, Oslo NOR, 2026. Carlsen wins with White in 65 moves. Opening: Caro-Kann Defense.',
    pgn: `[Event "14th Norway Chess 2026"]
[Site "Oslo NOR"]
[Date "2026.06.05"]
[Round "10.2"]
[White "Magnus Carlsen"]
[Black "D. Gukesh"]
[Result "1-0"]
[WhiteElo "2840"]
[BlackElo "2732"]
[ECO "B10"]

1. e4 c6 2. c4 d5 3. exd5 cxd5 4. cxd5 Nf6 5. Nc3 Nxd5 6. Nf3 Nc6 7. Bb5 e6 8. O-O Be7 9. d4 O-O 10. Re1 Bd7 11. Bd3 Rc8 12. Nxd5 exd5 13. Ne5 Bf6 14. Bf4 g6 15. Qb3 Na5 16. Qb4 Be6 17. Rad1 Re8 18. h3 Be7 19. Qa4 Qb6 20. Nd7 Bxd7 21. Qxd7 Nc6 22. Qxd5 Red8 23. Qb5 Bf6 24. Qxb6 axb6 25. Be4 Rxd4 26. Rxd4 Nxd4 27. Bxb7 Rc2 28. Bh6 Ne6 29. Rc1 Rxc1+ 30. Bxc1 Nc5 31. Bd5 Na4 32. Kf1 Nxb2 33. Ke2 Kf8 34. Be3 Ke7 35. Kd2 Na4 36. Kd3 Be5 37. Bb3 Nc5+ 38. Kc4 f5 39. Kb5 f4 40. Bd2 Kd7 41. Kxb6 Ne4 42. Bc1 Nxf2 43. Bd5 Bd4+ 44. Kb5 g5 45. Kc4 Bb6 46. Bf3 Nh1 47. Bd2 Ng3 48. a4 Kc7 49. a5 Bf2 50. Kd5 h5 51. Bc3 Kb7 52. Bf6 g4 53. hxg4 hxg4 54. Bxg4 Nf1 55. a6+ Ka7 56. Be2 Nd2 57. Bd4+ Bxd4 58. Kxd4 f3 59. Bxf3 Kxa6 60. Bd5 Kb6 61. g4 Nf1 62. g5 Ng3 63. Ke5 Kc7 64. g6 Nh5 65. Bf3 1-0`
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
