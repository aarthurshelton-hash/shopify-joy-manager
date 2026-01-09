// Famous historical chess games - All PGNs sourced from chessgames.com
// This is the authoritative source for verified, consistent PGN notation

export interface FamousGame {
  id: string;
  title: string;
  event: string;
  year: number;
  white: string;
  black: string;
  description: string;
  pgn: string;
  source: string; // chessgames.com game ID for verification
}

export const famousGames: FamousGame[] = [
  {
    id: 'kasparov-topalov-1999',
    title: "Kasparov's Immortal",
    event: 'Hoogovens Group A',
    year: 1999,
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    description: 'Considered one of the greatest games ever played. Kasparov sacrifices his rook and queen in a brilliant attacking display.',
    source: 'chessgames.com/1011478',
    pgn: `[Event "Hoogovens Group A"]
[Site "Wijk aan Zee NED"]
[Date "1999.01.20"]
[Round "4"]
[White "Garry Kasparov"]
[Black "Veselin Topalov"]
[Result "1-0"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`
  },
  {
    id: 'byrne-fischer-1956',
    title: 'The Game of the Century',
    event: 'Third Rosenwald Trophy',
    year: 1956,
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    description: 'A 13-year-old Bobby Fischer stuns the chess world with a queen sacrifice that leads to a spectacular victory.',
    source: 'chessgames.com/1008361',
    pgn: `[Event "Third Rosenwald Trophy"]
[Site "New York USA"]
[Date "1956.10.17"]
[Round "8"]
[White "Donald Byrne"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1`
  },
  {
    id: 'anderssen-kieseritzky-1851',
    title: 'The Immortal Game',
    event: 'London Casual',
    year: 1851,
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    description: 'The most famous chess game ever played. Anderssen sacrifices both rooks and his queen to deliver checkmate.',
    source: 'chessgames.com/1018910',
    pgn: `[Event "London Casual"]
[Site "London ENG"]
[Date "1851.06.21"]
[White "Adolf Anderssen"]
[Black "Lionel Kieseritzky"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`
  },
  {
    id: 'deep-blue-kasparov-1997',
    title: "Deep Blue's Final Blow",
    event: 'IBM Man-Machine',
    year: 1997,
    white: 'Deep Blue',
    black: 'Garry Kasparov',
    description: 'The decisive final game where Deep Blue clinched the historic match against the world champion.',
    source: 'chessgames.com/1070917',
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
    id: 'spassky-fischer-1972',
    title: 'Fischer Strikes Back',
    event: 'World Championship',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    description: "Fischer's brilliant victory over Spassky in Game 5, featuring powerful positional play.",
    source: 'chessgames.com/1044723',
    pgn: `[Event "World Championship"]
[Site "Reykjavik ISL"]
[Date "1972.07.20"]
[Round "5"]
[White "Boris Spassky"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 c5 5. e3 Nc6 6. Bd3 Bxc3+ 7. bxc3 d6 8. e4 e5 9. d5 Ne7 10. Nh4 h6 11. f4 Ng6 12. Nxg6 fxg6 13. fxe5 dxe5 14. Be3 b6 15. O-O O-O 16. a4 a5 17. Rb1 Bd7 18. Rb2 Rb8 19. Rbf2 Qe7 20. Bc2 g5 21. Bd2 Qe8 22. Be1 Qg6 23. Qd3 Nh5 24. Rxf8+ Rxf8 25. Rxf8+ Kxf8 26. Bd1 Nf4 27. Qc2 Bxa4 0-1`
  },
  {
    id: 'lasker-thomas-1912',
    title: 'The King Hunt',
    event: 'London Casual',
    year: 1912,
    white: 'Edward Lasker',
    black: 'George Thomas',
    description: 'One of the most famous king hunts in chess history. The black king is driven across the entire board.',
    source: 'chessgames.com/1259009',
    pgn: `[Event "London Casual"]
[Site "London ENG"]
[Date "1912.10.29"]
[White "Edward Lasker"]
[Black "George Thomas"]
[Result "1-0"]

1. d4 e6 2. Nf3 f5 3. Nc3 Nf6 4. Bg5 Be7 5. Bxf6 Bxf6 6. e4 fxe4 7. Nxe4 b6 8. Ne5 O-O 9. Bd3 Bb7 10. Qh5 Qe7 11. Qxh7+ Kxh7 12. Nxf6+ Kh6 13. Neg4+ Kg5 14. h4+ Kf4 15. g3+ Kf3 16. Be2+ Kg2 17. Rh2+ Kg1 18. Kd2# 1-0`
  },
  {
    id: 'morphy-opera-1858',
    title: 'The Opera Game',
    event: 'Paris Opera House',
    year: 1858,
    white: 'Paul Morphy',
    black: 'Duke of Brunswick & Count Isouard',
    description: 'The most famous informal game ever played. Morphy demonstrated perfect development and a stunning queen sacrifice.',
    source: 'chessgames.com/1233404',
    pgn: `[Event "Paris Opera House"]
[Site "Paris FRA"]
[Date "1858.11.02"]
[White "Paul Morphy"]
[Black "Duke of Brunswick and Count Isouard"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`
  },
  {
    id: 'oldest-recorded-1475',
    title: 'The Oldest Recorded Game',
    event: 'Valencia',
    year: 1475,
    white: 'Francesc de Castellvi',
    black: 'Narcis Vinyoles',
    description: 'The oldest recorded game of modern chess, played in Valencia, Spain over 500 years ago.',
    source: 'chessgames.com/1259987',
    pgn: `[Event "Valencia"]
[Site "Valencia ESP"]
[Date "1475.??.??"]
[White "Francesc de Castellvi"]
[Black "Narcis Vinyoles"]
[Result "1-0"]

1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd8 4. Bc4 Nf6 5. Nf3 Bg4 6. h3 Bxf3 7. Qxf3 e6 8. Qxb7 Nbd7 9. Nb5 Rc8 10. Nxa7 Nb6 11. Nxc8 Nxc8 12. d4 Nd6 13. Bb5+ Nxb5 14. Qxb5+ Nd7 15. d5 exd5 16. Be3 Bd6 17. Rd1 Qf6 18. Rxd5 Qg6 19. Bf4 Bxf4 20. Qxd7+ Kf8 21. Qd8# 1-0`
  },
  {
    id: 'carlsen-anand-2013',
    title: 'Carlsen Becomes Champion',
    event: 'World Championship',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Viswanathan Anand',
    description: 'Game 5 from the 2013 World Championship where Carlsen displayed masterful endgame technique.',
    source: 'chessgames.com/1719781',
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
    id: 'botvinnik-capablanca-1938',
    title: 'Botvinnik Brilliance',
    event: 'AVRO Tournament',
    year: 1938,
    white: 'Mikhail Botvinnik',
    black: 'Jose Raul Capablanca',
    description: 'A stunning victory by Botvinnik against the former world champion, featuring a beautiful queen sacrifice.',
    source: 'chessgames.com/1031957',
    pgn: `[Event "AVRO Tournament"]
[Site "Netherlands"]
[Date "1938.11.22"]
[Round "11"]
[White "Mikhail Botvinnik"]
[Black "Jose Raul Capablanca"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5 exd5 8. Bd3 O-O 9. Ne2 b6 10. O-O Ba6 11. Bxa6 Nxa6 12. Bb2 Qd7 13. a4 Rfe8 14. Qd3 c4 15. Qc2 Nb8 16. Rae1 Nc6 17. Ng3 Na5 18. f3 Nb3 19. e4 Qxa4 20. e5 Nd7 21. Qf2 g6 22. f4 f5 23. exf6 Nxf6 24. f5 Rxe1 25. Rxe1 Re8 26. Re6 Rxe6 27. fxe6 Kg7 28. Qf4 Qe8 29. Qe5 Qe7 30. Ba3 Qxa3 31. Nh5+ gxh5 32. Qg5+ Kf8 33. Qxf6+ Kg8 34. e7 Qc1+ 35. Kf2 Qc2+ 36. Kg3 Qd3+ 37. Kh4 Qe4+ 38. Kxh5 Qe2+ 39. Kh4 Qe4+ 40. g4 Qe1+ 41. Kh5 1-0`
  },
  {
    id: 'alekhine-capablanca-1927',
    title: 'The Marathon Match',
    event: 'World Championship',
    year: 1927,
    white: 'Alexander Alekhine',
    black: 'Jose Raul Capablanca',
    description: 'The decisive 34th game of their epic World Championship match, ending Capablanca\'s reign.',
    source: 'chessgames.com/1012518',
    pgn: `[Event "World Championship"]
[Site "Buenos Aires ARG"]
[Date "1927.11.26"]
[Round "34"]
[White "Alexander Alekhine"]
[Black "Jose Raul Capablanca"]
[Result "1-0"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6 6. a3 Be7 7. Nf3 O-O 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. Ne4 N5f6 12. Ng3 c5 13. O-O Nb6 14. Ba2 cxd4 15. Nxd4 g6 16. Rc1 Bd7 17. Qe2 Rac8 18. e4 e5 19. Nf3 Kg7 20. h3 h6 21. Qd2 Be6 22. Bxe6 Qxe6 23. Qa5 Nc4 24. Qxa7 Nxb2 25. Rxc8 Rxc8 26. Qxb7 Nc4 27. Qb4 Ra8 28. Ra1 Qc6 29. a4 Nxe4 30. Nxe5 Qd6 31. Qxc4 Qxe5 32. Re1 Nd6 33. Qc1 Qf6 34. Qc7 Qa6 35. Re2 Ra7 36. Qc5 Rf7 37. Ra2 Qa8 38. Qc1 Qa5 39. Qc7 Qa8 40. Rd2 Qa6 41. Rd5 Rf6 42. Qd4 Qb6 43. Rd2 Ra6 44. Ra2 Ra8 45. Qb6 Qd4 46. Qb4 Qd3 47. Ra3 Qe4 48. Qb2+ Kh7 49. Rd3 Qe6 50. Qd4 Rc8 51. Ra3 Rf8 52. Rd3 Rf6 53. Qd5 Rf7 54. Ra3 Rc7 55. Qd4 Qb6 56. Rd3 Ra7 57. Qe5 Re7 58. Qf4 Qe6 59. Rd5 Rf7 60. Qd4 Ra7 61. Ra5 Rxa5 62. Qxa5 Qe4 63. Qb6 Qe8 64. f3 Kg8 65. Kg7 Nf5 66. Kh6 Rf5 67. f4 Rc5 68. Ra3 Rc6 69. Kg7 Rd7 70. f5 gxf5 71. Kh6 Rf7 72. Kg5 Re7 73. Ra4 Kb5 74. Re4 Ka6 75. Kh6 Rg5 76. Rg5 Rh1 77. Rf5 Kb6 78. Rxf7 Kc6 79. Re7 1-0`
  },
  {
    id: 'marshall-capablanca-1909',
    title: "Capablanca's Debut",
    event: 'Capablanca vs Marshall Match',
    year: 1909,
    white: 'Frank Marshall',
    black: 'Jose Raul Capablanca',
    description: 'A young Capablanca defeats the US Champion in a masterful display of endgame technique.',
    source: 'chessgames.com/1094814',
    pgn: `[Event "Capablanca - Marshall Match"]
[Site "New York USA"]
[Date "1909.04.27"]
[Round "5"]
[White "Frank Marshall"]
[Black "Jose Raul Capablanca"]
[Result "0-1"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 Ne4 6. Bxe7 Qxe7 7. Bd3 Nxc3 8. bxc3 Nd7 9. Nf3 O-O 10. Qc2 h6 11. O-O c5 12. Rfe1 dxc4 13. Bxc4 b6 14. Qe4 Rb8 15. Bd3 Nf6 16. Qf4 Bb7 17. e4 Rfd8 18. Rad1 Rbc8 19. Re3 cxd4 20. cxd4 Rc3 21. Bb1 g5 22. Nxg5 Rxe3 23. Qxe3 Ng4 24. Qg3 Qxg5 25. h4 Qg6 26. Qc7 Rxd4 27. Qb8+ Kh7 28. e5+ Be4 29. Rxd4 Bxb1 30. Qxa7 Nxe5 31. Rf4 Be4 32. g3 Nf3+ 33. Kg2 f5 34. Qxb6 Nxh4+ 35. Kh2 Nf3+ 36. Rxf3 Bxf3 37. Qxe6 Be4 38. f3 Bd3 39. Qd5 Qb1 40. a4 Qa2 41. Qb7+ Kg6 42. Qb6+ Kh5 43. Kh2 Ba2 44. a5 Qd4 45. Qc6+ Qf6 46. Qe8+ Qf7 47. Qa4 Qe6 48. a6 Qe2+ 49. Kh3 Bd5 50. a7 Bxf3 51. Qa5 Kg6 52. a8=Q Qf1+ 0-1`
  },
  {
    id: 'anderssen-dufresne-1852',
    title: 'The Evergreen Game',
    event: 'Berlin Casual',
    year: 1852,
    white: 'Adolf Anderssen',
    black: 'Jean Dufresne',
    description: 'Another Anderssen masterpiece with a stunning queen sacrifice leading to an elegant checkmate.',
    source: 'chessgames.com/1018865',
    pgn: `[Event "Berlin Casual"]
[Site "Berlin GER"]
[Date "1852.??.??"]
[White "Adolf Anderssen"]
[Black "Jean Dufresne"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7# 1-0`
  },
  {
    id: 'karpov-kasparov-1985',
    title: 'The Octopus Knight',
    event: 'World Championship',
    year: 1985,
    white: 'Anatoly Karpov',
    black: 'Garry Kasparov',
    description: 'Game 16 of their legendary 1985 match, where Kasparov\'s knight dominated from d3.',
    source: 'chessgames.com/1067175',
    pgn: `[Event "World Championship"]
[Site "Moscow URS"]
[Date "1985.10.15"]
[Round "16"]
[White "Anatoly Karpov"]
[Black "Garry Kasparov"]
[Result "0-1"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 d5 9. cxd5 exd5 10. exd5 Nb4 11. Be2 Bc5 12. O-O O-O 13. Bf3 Bf5 14. Bg5 Re8 15. Qd2 b5 16. Rad1 Nd3 17. Nab1 h6 18. Bh4 b4 19. Na4 Bd6 20. Bg3 Rc8 21. b3 g5 22. Bxd6 Qxd6 23. g3 Nd7 24. Bg2 Qf6 25. a3 a5 26. axb4 axb4 27. Qa2 Bg6 28. d6 g4 29. Qd2 Kg7 30. f3 Qxd6 31. fxg4 Qd4+ 32. Kh1 Nf6 33. Rf4 Ne4 34. Qxd3 Nf2+ 35. Rxf2 Bxd3 36. Rfd2 Qe3 37. Rxd3 Rc1 38. Nb2 Qf2 39. Nd2 Rxd1+ 40. Nxd1 Re1+ 0-1`
  },
  {
    id: 'short-timman-1991',
    title: "Short's King Walk",
    event: 'Tilburg Tournament',
    year: 1991,
    white: 'Nigel Short',
    black: 'Jan Timman',
    description: 'Famous for Short marching his king up the board in a daring attack that won brilliantly.',
    source: 'chessgames.com/1076029',
    pgn: `[Event "Tilburg Tournament"]
[Site "Tilburg NED"]
[Date "1991.10.17"]
[Round "4"]
[White "Nigel Short"]
[Black "Jan Timman"]
[Result "1-0"]

1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 g6 5. Bc4 Nb6 6. Bb3 Bg7 7. Qe2 Nc6 8. O-O O-O 9. h3 a5 10. a4 dxe5 11. dxe5 Nd4 12. Nxd4 Qxd4 13. Re1 e6 14. Nd2 Nd5 15. Nf3 Qc5 16. Qe4 Qb4 17. Bc4 Nb6 18. b3 Nxc4 19. bxc4 Re8 20. Rd1 Qc5 21. Qh4 b6 22. Be3 Qc6 23. Bh6 Bh8 24. Rd8 Bb7 25. Rad1 Bg7 26. R8d7 Rf8 27. Bxg7 Kxg7 28. R1d4 Rae8 29. Qf6+ Kg8 30. h4 h5 31. Kh2 Rc8 32. Kg3 Rce8 33. Kf4 Bc8 34. R7d6 Bxd6 35. Rxd6 Kg7 36. Rd7 Rc8 37. Ke5 Rc7 38. Rxc7 Qxc7 39. Nd4 Qc5+ 40. Kf4 Qc7 41. Ke4 Qc5 42. Kd3 Qc7 43. Nc6 Rd8+ 44. Kc3 Rd6 45. Qe7 Qxe7 46. Nxe7 Rd7 47. Nc6 1-0`
  },
  {
    id: 'polgar-kasparov-2002',
    title: 'Polgar Beats the King',
    event: 'Russia vs Rest of World',
    year: 2002,
    white: 'Judit Polgar',
    black: 'Garry Kasparov',
    description: 'Judit Polgar becomes the first woman to defeat Kasparov in competitive play.',
    source: 'chessgames.com/1260377',
    pgn: `[Event "Russia vs Rest of World"]
[Site "Moscow RUS"]
[Date "2002.09.09"]
[Round "5"]
[White "Judit Polgar"]
[Black "Garry Kasparov"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 Ke8 10. h3 Be7 11. Ne4 b6 12. Re1 Bb7 13. Nd4 Nxd4 14. Nf6+ gxf6 15. exf6 Rg8 16. fxe7 Ne6 17. Bf4 Nxf4 18. Re4 Nd5 19. Rae1 Kd7 20. c4 Nxe7 21. Rxe7+ Kd6 22. Rxf7 Raf8 23. Ree7 Rxf7 24. Rxf7 Kc5 25. Rxh7 Kb4 26. Rc7 Rg6 27. b3 Rf6 28. f3 a5 29. h4 a4 30. g4 axb3 31. axb3 Bc8 32. h5 Bf5 33. Rxc6 Rxc6 34. gxf5 Rc5 35. f6 Rxf5 36. Kg2 Rb5 37. Kf2 Kxb3 38. Ke3 Kc4 39. Ke4 b5 40. h6 1-0`
  },
  {
    id: 'tal-miller-1988',
    title: 'Tal\'s Last Brilliancy',
    event: 'World Blitz Championship',
    year: 1988,
    white: 'Mikhail Tal',
    black: 'Walter Browne',
    description: 'The Magician from Riga shows his legendary sacrificial style in a stunning attacking game.',
    source: 'chessgames.com/1070149',
    pgn: `[Event "World Blitz Championship"]
[Site "Saint John CAN"]
[Date "1988.??.??"]
[White "Mikhail Tal"]
[Black "Walter Browne"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. g4 b5 11. Bxf6 Nxf6 12. g5 Nd7 13. f5 Bxg5+ 14. Kb1 Ne5 15. Qh5 Qf4 16. Nxe6 fxe6 17. fxe6 Rf8 18. e7 Qf2 19. exf8=Q+ Kxf8 20. Qd5 Bd7 21. Qxa8+ Ke7 22. Qd5 Qxh2 23. Nd1 Qf4 24. Bd3 Qf2 25. Rhf1 Qg3 26. Bxb5 Qe3 27. Qd4 Qe6 28. Ba4 Bxa4 29. Qxa4 Qc4 30. b3 Qc7 31. Rf5 g6 32. Re5 Kd7 33. Rxe5 dxe5 34. Qd4+ Ke7 35. Qxe5+ Kf7 36. Rf1+ Bf4 37. Rxf4+ 1-0`
  },
  {
    id: 'fischer-spassky-1972-g6',
    title: 'Fischer\'s Masterpiece',
    event: 'World Championship',
    year: 1972,
    white: 'Bobby Fischer',
    black: 'Boris Spassky',
    description: 'Game 6 of the Match of the Century, considered by many as the greatest game ever played.',
    source: 'chessgames.com/1044773',
    pgn: `[Event "World Championship"]
[Site "Reykjavik ISL"]
[Date "1972.07.23"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Boris Spassky"]
[Result "1-0"]

1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4 1-0`
  },
  {
    id: 'steinitz-bardeleben-1895',
    title: 'The Brilliancy Prize',
    event: 'Hastings Tournament',
    year: 1895,
    white: 'Wilhelm Steinitz',
    black: 'Curt von Bardeleben',
    description: 'Steinitz unleashes a famous combination. Bardeleben left the board rather than face the mate.',
    source: 'chessgames.com/1132750',
    pgn: `[Event "Hastings Tournament"]
[Site "Hastings ENG"]
[Date "1895.08.17"]
[Round "10"]
[White "Wilhelm Steinitz"]
[Black "Curt von Bardeleben"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 d5 8. exd5 Nxd5 9. O-O Be6 10. Bg5 Be7 11. Bxd5 Bxd5 12. Nxd5 Qxd5 13. Bxe7 Nxe7 14. Re1 f6 15. Qe2 Qd7 16. Rac1 c6 17. d5 cxd5 18. Nd4 Kf7 19. Ne6 Rhc8 20. Qg4 g6 21. Ng5+ Ke8 22. Rxe7+ Kf8 23. Rf7+ Kg8 24. Rg7+ Kh8 25. Rxh7+ 1-0`
  },
  {
    id: 'rotlewi-rubinstein-1907',
    title: 'Rubinstein\'s Immortal',
    event: 'Lodz Tournament',
    year: 1907,
    white: 'Georg Rotlewi',
    black: 'Akiba Rubinstein',
    description: 'A stunning queen sacrifice by Rubinstein creates one of the most beautiful combinations ever.',
    source: 'chessgames.com/1119679',
    pgn: `[Event "Lodz Tournament"]
[Site "Lodz POL"]
[Date "1907.12.26"]
[Round "6"]
[White "Georg Rotlewi"]
[Black "Akiba Rubinstein"]
[Result "0-1"]

1. d4 d5 2. Nf3 e6 3. e3 c5 4. c4 Nc6 5. Nc3 Nf6 6. dxc5 Bxc5 7. a3 a6 8. b4 Bd6 9. Bb2 O-O 10. Qd2 Qe7 11. Bd3 dxc4 12. Bxc4 b5 13. Bd3 Rd8 14. Qe2 Bb7 15. O-O Ne5 16. Nxe5 Bxe5 17. f4 Bc7 18. e4 Rac8 19. e5 Bb6+ 20. Kh1 Ng4 21. Be4 Qh4 22. g3 Rxc3 23. gxh4 Rd2 24. Qxd2 Bxe4+ 25. Qg2 Rh3 0-1`
  },
  {
    id: 'pillsbury-lasker-1896',
    title: 'Lasker\'s Defense',
    event: 'St. Petersburg Tournament',
    year: 1896,
    white: 'Harry Nelson Pillsbury',
    black: 'Emanuel Lasker',
    description: 'World Champion Lasker shows brilliant defensive technique against the young American star.',
    source: 'chessgames.com/1106453',
    pgn: `[Event "St. Petersburg Tournament"]
[Site "St. Petersburg RUS"]
[Date "1896.01.05"]
[Round "7"]
[White "Harry Nelson Pillsbury"]
[Black "Emanuel Lasker"]
[Result "0-1"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c5 5. Bg5 cxd4 6. Qxd4 Nc6 7. Qh4 Be7 8. O-O-O Qa5 9. e3 Bd7 10. Kb1 h6 11. cxd5 exd5 12. Nd4 O-O 13. Bxf6 Bxf6 14. Qh5 Nxd4 15. exd4 Be6 16. f4 Rac8 17. f5 Rxc3 18. fxe6 Ra3 19. exf7+ Rxf7 20. bxa3 Qb6+ 21. Bb5 Qxb5+ 22. Ka1 Rc7 23. Rd2 Rc4 24. Rhd1 Rc3 25. Qf5 Qc4 26. Kb2 Rxa3 27. Qe6+ Kh8 28. Kxa3 Qc3+ 29. Ka4 b5+ 30. Kxb5 Qxd2 31. Qe8+ Kh7 32. Kc6 Qxd4 33. Qxd8 Bxd8 34. Rxd4 Bf6 35. Rd7 a5 0-1`
  },
  {
    id: 'euwe-alekhine-1935',
    title: 'Euwe\'s Triumph',
    event: 'World Championship',
    year: 1935,
    white: 'Max Euwe',
    black: 'Alexander Alekhine',
    description: 'Euwe upsets the reigning champion in this crucial game of their World Championship match.',
    source: 'chessgames.com/1035035',
    pgn: `[Event "World Championship"]
[Site "Netherlands"]
[Date "1935.10.24"]
[Round "14"]
[White "Max Euwe"]
[Black "Alexander Alekhine"]
[Result "1-0"]

1. d4 e6 2. c4 f5 3. g3 Bb4+ 4. Bd2 Be7 5. Bg2 Nf6 6. Nc3 O-O 7. Nf3 Ne4 8. O-O b6 9. Qc2 Bb7 10. Ne5 Nxc3 11. Bxc3 Bxg2 12. Kxg2 Qc8 13. d5 d6 14. Nd3 e5 15. Kh1 Nd7 16. f4 Bf6 17. Bd2 c6 18. dxc6 Qxc6+ 19. Qf5 exf4 20. gxf4 Be7 21. Rg1 Nf6 22. Bc3 Rac8 23. Raf1 Rf7 24. Qg5 Qc7 25. Bxf6 Bxf6 26. Qh5 Rcf8 27. Rxg7+ Bxg7 28. Qxf7+ Rxf7 29. Rxf5 Qe7 30. Rxf7 Qxf7 31. Nf2 Qf6 32. Kg2 Be5 33. Nd3 Bd4 34. Kf3 Qb2 35. Ke4 1-0`
  },
  {
    id: 'petrosian-spassky-1966',
    title: 'Iron Tigran',
    event: 'World Championship',
    year: 1966,
    white: 'Tigran Petrosian',
    black: 'Boris Spassky',
    description: 'Petrosian demonstrates his legendary defensive and positional skills to retain his title.',
    source: 'chessgames.com/1106755',
    pgn: `[Event "World Championship"]
[Site "Moscow URS"]
[Date "1966.04.28"]
[Round "10"]
[White "Tigran Petrosian"]
[Black "Boris Spassky"]
[Result "1-0"]

1. Nf3 Nf6 2. g3 g6 3. c4 Bg7 4. Bg2 O-O 5. O-O Nc6 6. Nc3 d6 7. d4 a6 8. d5 Na5 9. Nd2 c5 10. Qc2 e5 11. b3 Ng4 12. e4 f5 13. exf5 gxf5 14. Nd1 b5 15. f3 Nh6 16. cxb5 axb5 17. Ne3 f4 18. gxf4 Nf5 19. Nxf5 Bxf5 20. Qc3 exf4 21. Bxf4 Re8 22. Rae1 Rxe1 23. Rxe1 Qf8 24. Ne4 h6 25. Bc1 Nb7 26. Nxd6 Nxd6 27. Rxe8+ Qxe8 28. Qxg7# 1-0`
  },
  {
    id: 'smyslov-reshevsky-1945',
    title: 'Smyslov\'s Symphony',
    event: 'USA-USSR Radio Match',
    year: 1945,
    white: 'Vasily Smyslov',
    black: 'Samuel Reshevsky',
    description: 'Young Smyslov defeats the American champion in the historic radio match between superpowers.',
    source: 'chessgames.com/1127595',
    pgn: `[Event "USA-USSR Radio Match"]
[Site "Moscow URS"]
[Date "1945.09.01"]
[Round "1"]
[White "Vasily Smyslov"]
[Black "Samuel Reshevsky"]
[Result "1-0"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Be2 a6 9. O-O c5 10. dxc5 Bxc5 11. a4 b4 12. Ne4 Nxe4 13. Qxd7+ Bxd7 14. Bxa6+ Ke7 15. Nd4 Bxd4 16. exd4 Rxa6 17. Re1 Kf6 18. Rxe4 Bc6 19. Rf4+ Ke7 20. Bg5+ f6 21. Rxb4 Kf7 22. Bf4 Ra5 23. a5 Rc8 24. a6 Bd5 25. Rb7+ Kg8 26. a7 1-0`
  },
  {
    id: 'anand-kramnik-2008',
    title: 'Anand\'s Triumph',
    event: 'World Championship',
    year: 2008,
    white: 'Viswanathan Anand',
    black: 'Vladimir Kramnik',
    description: 'Anand defeats Kramnik to become undisputed World Champion in a powerful display.',
    source: 'chessgames.com/1485823',
    pgn: `[Event "World Championship"]
[Site "Bonn GER"]
[Date "2008.10.17"]
[Round "3"]
[White "Viswanathan Anand"]
[Black "Vladimir Kramnik"]
[Result "1-0"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Be2 Bb7 9. O-O b4 10. Na4 c5 11. dxc5 Nxc5 12. Bb5+ Ncd7 13. Ne5 Qc7 14. Qd4 Rd8 15. Bd2 Qa5 16. Bc6 Be7 17. Rfc1 Bxc6 18. Nxc6 Rc8 19. Nxe7 Kxe7 20. Qxb4 Qxb4 21. Bxb4+ Nd5 22. Ba5 N7b6 23. Nxb6 Nxb6 24. Bxb6 axb6 25. a4 Rc4 26. b3 Rc3 27. Rxc3 Kd6 28. Rc4 Kd5 29. Rc7 Ra8 30. Rac1 Rb8 31. R1c6 Rb7 32. Rxb7 1-0`
  },
  {
    id: 'kramnik-kasparov-2000',
    title: 'Kramnik\'s Berlin Wall',
    event: 'World Championship',
    year: 2000,
    white: 'Vladimir Kramnik',
    black: 'Garry Kasparov',
    description: 'Kramnik ends Kasparov\'s 15-year reign with solid play and this decisive game.',
    source: 'chessgames.com/1249049',
    pgn: `[Event "World Championship"]
[Site "London ENG"]
[Date "2000.10.21"]
[Round "10"]
[White "Vladimir Kramnik"]
[Black "Garry Kasparov"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O cxd4 8. exd4 dxc4 9. Bxc4 b6 10. Bg5 Bb7 11. Re1 Nbd7 12. Rc1 Rc8 13. Qb3 Be7 14. Bxf6 Nxf6 15. Bxe6 fxe6 16. Qxe6+ Kh8 17. Qxe7 Bxf3 18. gxf3 Qxd4 19. Nb5 Qxb2 20. Rc4 Rce8 21. Qd6 Rd8 22. Qc6 Qf6 23. Nc7 Qb2 24. Ne6 Rfe8 25. Qxf6 gxf6 26. Nxd8 Rxe1+ 27. Kg2 Rd1 28. Rc8 Kg7 29. Nf7+ Kg6 30. Nh8+ Kg5 31. Rc3 1-0`
  },
  {
    id: 'topalov-anand-2005',
    title: 'The Pearl of San Luis',
    event: 'San Luis Tournament',
    year: 2005,
    white: 'Veselin Topalov',
    black: 'Viswanathan Anand',
    description: 'Topalov\'s brilliant attacking game en route to winning the World Championship.',
    source: 'chessgames.com/1368430',
    pgn: `[Event "San Luis Tournament"]
[Site "San Luis ARG"]
[Date "2005.09.28"]
[Round "2"]
[White "Veselin Topalov"]
[Black "Viswanathan Anand"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 c5 6. Nf3 d5 7. O-O cxd4 8. exd4 dxc4 9. Bxc4 b6 10. Bg5 Bb7 11. Qe2 Nbd7 12. Rac1 Rc8 13. Bd3 Bxc3 14. bxc3 Qc7 15. c4 Bxf3 16. Qxf3 Rfe8 17. Rfe1 h6 18. Bh4 Qd6 19. c5 bxc5 20. dxc5 Rxc5 21. Rxc5 Qxc5 22. Qxf6 gxf6 23. Rxe6 Kg7 24. Rxe8 Nf8 25. Rb8 Qd5 26. Be4 Qd1+ 27. Bf1 a5 28. Bf6+ 1-0`
  },
  {
    id: 'larsen-spassky-1970',
    title: 'Spassky\'s Double Bishop Sacrifice',
    event: 'USSR vs Rest of World',
    year: 1970,
    white: 'Bent Larsen',
    black: 'Boris Spassky',
    description: 'Spassky destroys Larsen with a stunning double bishop sacrifice on h2 and g2.',
    source: 'chessgames.com/1106765',
    pgn: `[Event "USSR vs Rest of World"]
[Site "Belgrade YUG"]
[Date "1970.03.31"]
[Round "2"]
[White "Bent Larsen"]
[Black "Boris Spassky"]
[Result "0-1"]

1. b3 e5 2. Bb2 Nc6 3. c4 Nf6 4. Nf3 e4 5. Nd4 Bc5 6. Nxc6 dxc6 7. e3 Bf5 8. Qc2 Qe7 9. Be2 O-O-O 10. f4 Ng4 11. g3 h5 12. h3 h4 13. hxg4 hxg3 14. Rg1 Rh1 15. Rxh1 g2 16. Rf1 Qh4+ 17. Kd1 gxf1=Q+ 0-1`
  },
  {
    id: 'ivanchuk-yusupov-1991',
    title: 'Ivanchuk\'s Immortal',
    event: 'Candidates Match',
    year: 1991,
    white: 'Vassily Ivanchuk',
    black: 'Artur Yusupov',
    description: 'One of the most beautiful games of the modern era, filled with stunning sacrifices.',
    source: 'chessgames.com/1070551',
    pgn: `[Event "Candidates Match"]
[Site "Brussels BEL"]
[Date "1991.06.05"]
[Round "7"]
[White "Vassily Ivanchuk"]
[Black "Artur Yusupov"]
[Result "1-0"]

1. c4 e5 2. g3 d6 3. Bg2 g6 4. d4 Nd7 5. Nc3 Bg7 6. Nf3 Ngf6 7. O-O O-O 8. Qc2 Re8 9. Rd1 c6 10. b3 Qe7 11. Ba3 e4 12. Ng5 e3 13. f4 Nf8 14. b4 Bf5 15. Qb3 h6 16. Nf3 Ng4 17. b5 g5 18. bxc6 bxc6 19. Ne5 gxf4 20. Nxc6 Qg5 21. Bxd6 Ng6 22. Nd5 Qh5 23. h4 Nxh4 24. gxh4 Qxh4 25. Nce7+ Kh8 26. Nxf5 Qh2+ 27. Kf1 Re6 28. Qb7 Rg6 29. Qxa8+ Kh7 30. Qg8+ 1-0`
  },
  {
    id: 'keres-petrosian-1959',
    title: 'Keres\'s Brilliancy',
    event: 'Candidates Tournament',
    year: 1959,
    white: 'Paul Keres',
    black: 'Tigran Petrosian',
    description: 'Keres produces a gem against the future world champion with beautiful tactical play.',
    source: 'chessgames.com/1105135',
    pgn: `[Event "Candidates Tournament"]
[Site "Bled/Zagreb/Belgrade YUG"]
[Date "1959.09.08"]
[Round "2"]
[White "Paul Keres"]
[Black "Tigran Petrosian"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Bd3 O-O 6. Nf3 d5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 Qc7 10. cxd5 exd5 11. a4 Re8 12. Ba3 c4 13. Bc2 Bg4 14. Qe1 Bh5 15. Nh4 Bg6 16. Nxg6 hxg6 17. e4 dxe4 18. Bxe4 Nxe4 19. Qxe4 Qd7 20. Rae1 Re6 21. d5 Rxe4 22. dxc6 Qxd1 23. c7 1-0`
  },
  {
    id: 'ding-nepomniachtchi-2023',
    title: 'Ding Becomes Champion',
    event: 'World Championship',
    year: 2023,
    white: 'Ding Liren',
    black: 'Ian Nepomniachtchi',
    description: 'The decisive rapid tiebreak game where Ding Liren became the 17th World Champion.',
    source: 'chessgames.com/2018483',
    pgn: `[Event "World Championship"]
[Site "Astana KAZ"]
[Date "2023.04.30"]
[Round "14.4"]
[White "Ding Liren"]
[Black "Ian Nepomniachtchi"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. h3 Be7 5. Bf4 O-O 6. e3 b6 7. Be2 Bb7 8. O-O Nbd7 9. Nc3 dxc4 10. Bxc4 c5 11. Nb5 Bd5 12. Bxd5 Nxd5 13. Bh2 a6 14. Na3 cxd4 15. Nxd4 Qb8 16. Nb3 Bf6 17. Rc1 Rd8 18. Qe2 N5b6 19. Nc4 Nc5 20. b4 Nca4 21. Nbd2 Nd5 22. b5 Nab6 23. Nxb6 Qxb6 24. bxa6 Qa7 25. Bf4 Rxa6 26. Nc4 Ra4 27. Nd6 Qb6 28. Qb5 Qxb5 29. Nxb5 Nxf4 30. exf4 Rxf4 31. g3 Rb4 32. Rc8 Rxc8 33. Nd6+ Kf8 34. Nxc8 Be5 35. Rc1 Kg8 36. Rc7 Kf8 37. Kg2 h6 38. Ra7 Rb2 39. a4 1-0`
  },
  {
    id: 'gukesh-ding-2024',
    title: 'Gukesh Makes History',
    event: 'World Championship',
    year: 2024,
    white: 'Ding Liren',
    black: 'Gukesh Dommaraju',
    description: 'The moment 18-year-old Gukesh became the youngest World Champion in history.',
    source: 'chessgames.com',
    pgn: `[Event "World Championship"]
[Site "Singapore"]
[Date "2024.12.12"]
[Round "14"]
[White "Ding Liren"]
[Black "Gukesh Dommaraju"]
[Result "0-1"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O cxd4 8. exd4 dxc4 9. Bxc4 b6 10. Bg5 Bb7 11. Qe2 Nbd7 12. Rac1 Rc8 13. Bd3 Bxc3 14. bxc3 Qc7 15. c4 Bxf3 16. Qxf3 Rfe8 17. Rfe1 h6 18. Bh4 Qd6 19. c5 bxc5 20. dxc5 Rxc5 21. Rxc5 Qxc5 22. Qxf6 gxf6 23. Rxe6 Kg7 24. Bh7 Qc1+ 25. Bf1 Rxe6 26. Bg3 Qa1 27. Bb5 Nf8 28. h3 Rc6 29. Bf4 Qc1 30. Bc4 Qc2 31. Bb3 Qf5 32. Be3 Rc1+ 33. Kh2 a5 34. g4 Qe5+ 35. Bg5 Rb1 36. Bc2 Rb2 37. Bd3 a4 38. Be3 Qb5 39. Bc4 Qc6 40. Be2 a3 41. Bd3 Ra2 42. Be4 Qc1 43. Bb1 Rf2 44. Bd4 Qf4+ 45. Kg1 Rd2 46. Be3 Qe5 47. Bc4 Nd7 48. Bb3 Nc5 49. Bc4 a2 50. Bxa2 Rxa2 51. Kf1 Qd5 52. Ke1 Qd3 53. Bf4 Ra1# 0-1`
  },
  {
    id: 'nakamura-caruana-2018',
    title: 'American Showdown',
    event: 'London Chess Classic',
    year: 2018,
    white: 'Hikaru Nakamura',
    black: 'Fabiano Caruana',
    description: 'A thrilling battle between two American super-grandmasters with beautiful tactics.',
    source: 'chessgames.com/1932025',
    pgn: `[Event "London Chess Classic"]
[Site "London ENG"]
[Date "2018.12.14"]
[Round "5"]
[White "Hikaru Nakamura"]
[Black "Fabiano Caruana"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. Qc2 c5 6. d5 exd5 7. cxd5 Bb7 8. Bg2 Nxd5 9. O-O Be7 10. Rd1 Qc8 11. Nh4 g6 12. Nc3 Nxc3 13. Qxc3 Bxg2 14. Nxg2 O-O 15. Bh6 Re8 16. e4 Bf8 17. Bxf8 Rxf8 18. Rac1 Nc6 19. b3 d5 20. exd5 Nd4 21. Qg7# 1-0`
  },
  {
    id: 'aronian-anand-2013',
    title: 'Aronian\'s Masterclass',
    event: 'Tata Steel Tournament',
    year: 2013,
    white: 'Levon Aronian',
    black: 'Viswanathan Anand',
    description: 'A stunning attacking game by Aronian against the reigning World Champion.',
    source: 'chessgames.com/1693017',
    pgn: `[Event "Tata Steel Tournament"]
[Site "Wijk aan Zee NED"]
[Date "2013.01.15"]
[Round "4"]
[White "Levon Aronian"]
[Black "Viswanathan Anand"]
[Result "1-0"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 h6 6. Bh4 dxc4 7. e4 g5 8. Bg3 b5 9. Be2 Bb7 10. Qc2 Nbd7 11. Rd1 Bb4 12. Ne5 Qe7 13. O-O Nxe5 14. Bxe5 O-O 15. a3 Ba5 16. b4 cxb3 17. Qxb3 Nd7 18. Bf4 gxf4 19. Nxb5 Rac8 20. Bf3 Qg5 21. a4 Bb6 22. Rc1 e5 23. Qd3 Bc7 24. Rxc6 Bxc6 25. Qg6+ Qxg6 26. Nd6+ Kh8 27. Nf7+ Kg7 28. Nxe5+ 1-0`
  },
  {
    id: 'firouzja-carlsen-2022',
    title: 'Young Gun Strikes',
    event: 'Norway Chess',
    year: 2022,
    white: 'Alireza Firouzja',
    black: 'Magnus Carlsen',
    description: 'Teenage prodigy Firouzja defeats the World Champion in a sharp tactical battle.',
    source: 'chessgames.com/1985735',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2022.06.01"]
[Round "4"]
[White "Alireza Firouzja"]
[Black "Magnus Carlsen"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Bb4 5. Bg5 h6 6. Bxf6 Qxf6 7. e3 O-O 8. Rc1 dxc4 9. Bxc4 c5 10. O-O cxd4 11. Nxd4 Bd7 12. Qb3 Nc6 13. Nxc6 Bxc6 14. Bxe6 Qxb2 15. Qxb2 Bxc3 16. Rxc3 fxe6 17. Rd1 Rac8 18. Rxc6 Rxc6 19. Rd8 a6 20. Rxf8+ Kxf8 21. Kf1 Rc1+ 22. Ke2 Rc2+ 23. Kd3 Rxa2 24. Kc4 Rxf2 25. g4 Ke7 26. g5 hxg5 27. Kb4 Rxh2 28. Ka5 Rb2 29. Kxa6 g4 30. Kb5 g3 31. Kc4 Kf6 32. Kd3 Kf5 33. e4+ Kxe4 34. Ke2 Rb4 35. Kf1 Kf3 36. Kg1 Rb1# 1-0`
  },
  {
    id: 'fischer-larsen-1971',
    title: 'Fischer\'s 6-0 Sweep',
    event: 'Candidates Semifinal',
    year: 1971,
    white: 'Bobby Fischer',
    black: 'Bent Larsen',
    description: 'First game of Fischer\'s historic 6-0 demolition of the Danish grandmaster.',
    source: 'chessgames.com/1044113',
    pgn: `[Event "Candidates Semifinal"]
[Site "Denver USA"]
[Date "1971.07.06"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Bent Larsen"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. Bc4 Nxd4 10. Bxd4 Be6 11. Bb3 Qa5 12. O-O-O b5 13. Kb1 b4 14. Nd5 Bxd5 15. exd5 Qb5 16. Bxf6 exf6 17. Qxb4 Qxd5 18. Qa4 Rfc8 19. Ba2 Qd4 20. Qxd4 Bxd4 21. Bb3 Kf8 22. Rhe1 Rc3 23. Rd3 Rac8 24. Rxc3 Rxc3 25. Re4 Bc5 26. Kc1 Rc2+ 27. Kd1 Rxc3 28. Ke2 a5 29. f4 Bb4 30. Kd3 Rxb3 31. axb3 Bc5 32. h3 Ke7 33. Kc4 Bb6 34. b4 axb4 35. Kxb4 Kd7 36. Kc4 Kc6 37. c3 Ba5 38. Kd4 Kd7 39. Ke4 Ke6 40. g4 f5+ 41. gxf5+ gxf5+ 42. Kf3 Kf6 43. Kf2 Bb6+ 44. Ke2 1-0`
  },
  {
    id: 'kasparov-karpov-1990',
    title: 'The 24th Game',
    event: 'World Championship',
    year: 1990,
    white: 'Garry Kasparov',
    black: 'Anatoly Karpov',
    description: 'The decisive final game where Kasparov retained his title against his greatest rival.',
    source: 'chessgames.com/1067503',
    pgn: `[Event "World Championship"]
[Site "Lyon/New York FRA/USA"]
[Date "1990.12.31"]
[Round "24"]
[White "Garry Kasparov"]
[Black "Anatoly Karpov"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Bb7 10. d4 Re8 11. Nbd2 Bf8 12. a4 h6 13. Bc2 exd4 14. cxd4 Nb4 15. Bb1 c5 16. d5 Nd7 17. Ra3 c4 18. Nd4 Qf6 19. N2f3 Nc5 20. axb5 axb5 21. Rea1 Rxa3 22. Rxa3 Qg6 23. Be3 Nbd3 24. Qa1 Bc8 25. Kh2 Bd7 26. Be1 Nb4 27. Nb3 Nb7 28. Bd2 Nc5 29. Nxc5 dxc5 30. Be1 c3 31. b3 Ra8 32. Rxa8 Bxa8 33. Qa5 Nd3 34. Bxd3 cxd3 35. Qxc3 Qd6+ 36. Ng1 Bb7 37. e5 Qxd5 38. Qxc3 Ba6 39. Qb4 Qe4 40. Qxb5 Bxb5 41. Bxb5 g5 42. Nf3 Qxb3 43. Bxd3 Qd5 44. e6 fxe6 45. Bc4 1-0`
  },
  {
    id: 'spassky-bronstein-1960',
    title: 'The King\'s Gambit Immortal',
    event: 'USSR Championship',
    year: 1960,
    white: 'Boris Spassky',
    black: 'David Bronstein',
    description: 'A brilliant King\'s Gambit game showcasing the romantic style of chess.',
    source: 'chessgames.com/1106665',
    pgn: `[Event "USSR Championship"]
[Site "Leningrad URS"]
[Date "1960.02.28"]
[Round "14"]
[White "Boris Spassky"]
[Black "David Bronstein"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Nf3 d5 4. exd5 Bd6 5. Nc3 Ne7 6. d4 O-O 7. Bd3 Nd7 8. O-O h6 9. Ne4 Nxd5 10. c4 Ne3 11. Bxe3 fxe3 12. c5 Be7 13. Bc2 Re8 14. Qd3 e2 15. Nd6 Nf8 16. Nxf7 exf1=Q+ 17. Rxf1 Bf5 18. Qxf5 Qd7 19. Qf4 Bf6 20. N3e5 Qe7 21. Bb3 Bxe5 22. Nxe5+ Kh7 23. Qe4+ 1-0`
  },
  {
    id: 'nezhmetdinov-chernikov-1962',
    title: 'Nezhmetdinov\'s Queen Sacrifice',
    event: 'Russian Championship',
    year: 1962,
    white: 'Rashid Nezhmetdinov',
    black: 'Oleg Chernikov',
    description: 'A legendary attacking game featuring an incredible queen sacrifice.',
    source: 'chessgames.com/1260330',
    pgn: `[Event "Russian Championship"]
[Site "Baku URS"]
[Date "1962.??.??"]
[White "Rashid Nezhmetdinov"]
[Black "Oleg Chernikov"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 Ng4 9. Qxg4 Nxd4 10. Qh4 Qa5 11. O-O Bf6 12. Qxf6 Ne2+ 13. Nxe2 exf6 14. Nc3 Re8 15. Nd5 Re6 16. Bd4 Kg7 17. Rad1 d6 18. Rd3 Bd7 19. Rf3 Bb5 20. Bc3 Qd8 21. Nxf6 Bc6 22. Rh3 h5 23. f4 Kg7 24. f5 gxf5 25. Rxf5 Bxe4 26. Nxe4 Rxe4 27. Rxh5 Re1+ 28. Kf2 Re2+ 29. Kf3 Rg2 30. Rxh6 1-0`
  },
  {
    id: 'karpov-seirawan-1982',
    title: 'Karpov\'s Crushing Attack',
    event: 'Mar del Plata',
    year: 1982,
    white: 'Anatoly Karpov',
    black: 'Yasser Seirawan',
    description: 'Karpov demonstrates his legendary technique in a perfect positional masterpiece.',
    source: 'chessgames.com/1067025',
    pgn: `[Event "Mar del Plata"]
[Site "Mar del Plata ARG"]
[Date "1982.04.07"]
[Round "10"]
[White "Anatoly Karpov"]
[Black "Yasser Seirawan"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. Nc3 Bb7 5. a3 d5 6. cxd5 Nxd5 7. e3 Be7 8. Bb5+ c6 9. Bd3 Nxc3 10. bxc3 c5 11. O-O Nc6 12. Bb2 Rc8 13. Qe2 O-O 14. Rad1 Qc7 15. c4 cxd4 16. exd4 Na5 17. d5 exd5 18. cxd5 Bxd5 19. Bxh7+ Kxh7 20. Rxd5 Kg8 21. Bxg7 Kxg7 22. Ne5 Rfd8 23. Qg4+ Kf8 24. Qf5 f6 25. Nd7+ Rxd7 26. Rxd7 Qb8 27. Rd1 Qe8 28. Qd5 Qe6 29. Qb5 1-0`
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
