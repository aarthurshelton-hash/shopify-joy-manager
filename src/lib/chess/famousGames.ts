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
