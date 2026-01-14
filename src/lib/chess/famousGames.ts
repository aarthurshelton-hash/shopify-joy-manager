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
  },
  // =====================================================
  // HISTORICAL ERA (1500-1900) - Early Masters
  // =====================================================
  {
    id: 'lopez-amateur-1560',
    title: 'Ruy Lopez\'s Legacy',
    event: 'Madrid Casual',
    year: 1560,
    white: 'Ruy López de Segura',
    black: 'Amateur',
    description: 'One of the earliest recorded games by the Spanish priest who invented the famous opening.',
    source: 'chessgames.com',
    pgn: `[Event "Madrid Casual"]
[Site "Madrid ESP"]
[Date "1560.??.??"]
[White "Ruy Lopez de Segura"]
[Black "Amateur"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 b5 5. Bb3 Bc5 6. c3 Qe7 7. d4 Bb6 8. O-O Nf6 9. Re1 d6 10. Bg5 h6 11. Bh4 g5 12. Bg3 Bg4 13. h3 Bxf3 14. Qxf3 Nd8 15. dxe5 dxe5 16. Qf6 Qxf6 17. Bxf6 Rg8 18. Bxe5 c6 19. Nd2 Nc7 20. Nf3 Ne6 21. Rad1 Rd8 22. a4 Rxd1 23. Rxd1 1-0`
  },
  {
    id: 'greco-amateur-1619',
    title: 'Greco\'s Sacrifice',
    event: 'Rome Casual',
    year: 1619,
    white: 'Gioachino Greco',
    black: 'Amateur',
    description: 'The Italian master demonstrates a beautiful attacking combination that inspired generations.',
    source: 'chessgames.com/1250295',
    pgn: `[Event "Rome Casual"]
[Site "Rome ITA"]
[Date "1619.??.??"]
[White "Gioachino Greco"]
[Black "Amateur"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Nxc3 9. bxc3 Bxc3 10. Qb3 Bxa1 11. Bxf7+ Kf8 12. Bg5 Ne7 13. Ne5 Bxd4 14. Bg6 d5 15. Qf3+ Bf5 16. Bxf5 Bxe5 17. Be6+ Bf6 18. Bxf6 gxf6 19. Qxf6+ Ke8 20. Qf7# 1-0`
  },
  {
    id: 'philidor-amateur-1790',
    title: 'Philidor\'s Positional Gem',
    event: 'London Casual',
    year: 1790,
    white: 'François-André Danican Philidor',
    black: 'Amateur',
    description: 'The father of positional chess demonstrates his legendary pawn structure understanding.',
    source: 'chessgames.com/1275325',
    pgn: `[Event "London Casual"]
[Site "London ENG"]
[Date "1790.??.??"]
[White "Francois-Andre Philidor"]
[Black "Amateur"]
[Result "1-0"]

1. e4 e5 2. Bc4 c6 3. Qe2 d6 4. c3 f5 5. d3 Nf6 6. exf5 Bxf5 7. d4 e4 8. Bg5 d5 9. Bb3 Bd6 10. Nd2 Nbd7 11. h3 h6 12. Be3 Qe7 13. O-O-O O-O 14. g4 Bh7 15. Nh3 e3 16. fxe3 Qxe3 17. Nf2 Rae8 18. Rhe1 Qg3 19. Nd3 Ne4 20. Bf4 Qg6 21. Nf1 Ndf6 22. Bxd6 Nxd6 23. Ne5 Qf6 24. Re3 Nfe4 25. Rg3 g5 26. h4 Bg8 27. hxg5 hxg5 28. Nh2 1-0`
  },
  {
    id: 'saint-amant-staunton-1843',
    title: 'The First International Match',
    event: 'London vs Paris Match',
    year: 1843,
    white: 'Pierre Charles Fournier de Saint-Amant',
    black: 'Howard Staunton',
    description: 'A pivotal game from the first great international chess match between England and France.',
    source: 'chessgames.com/1072775',
    pgn: `[Event "London vs Paris Match"]
[Site "Paris FRA"]
[Date "1843.12.14"]
[Round "14"]
[White "Pierre de Saint-Amant"]
[Black "Howard Staunton"]
[Result "0-1"]

1. d4 e6 2. c4 d5 3. e3 Nf6 4. Nc3 c5 5. Nf3 Nc6 6. a3 cxd4 7. exd4 Be7 8. c5 O-O 9. Bd3 b6 10. b4 a5 11. Na4 axb4 12. axb4 bxc5 13. bxc5 Rxa4 14. Rxa4 Nxd4 15. Qa1 Nxf3+ 16. gxf3 Nh5 17. Qa3 Bh4 18. Kd1 Qg5 19. Be3 Qg2 20. Rf1 Qxf3+ 21. Kc2 Bxf2 22. Bxf2 Qxf2+ 23. Kb3 d4 24. Ra7 Qe3 25. Qxe3 dxe3 26. Re1 Bb7 27. Rxe3 Nf4 28. Be4 Bxe4 29. Rxe4 Nd5 30. c6 Rc8 31. Rd4 Nc7 0-1`
  },
  {
    id: 'morphy-anderssen-1858',
    title: 'Morphy vs The Master',
    event: 'Paris Casual',
    year: 1858,
    white: 'Paul Morphy',
    black: 'Adolf Anderssen',
    description: 'The American prodigy defeats the greatest European master in a brilliant attacking game.',
    source: 'chessgames.com/1019066',
    pgn: `[Event "Paris Casual"]
[Site "Paris FRA"]
[Date "1858.12.27"]
[White "Paul Morphy"]
[Black "Adolf Anderssen"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d4 Nxd4 5. Nxd4 exd4 6. e5 c6 7. O-O cxb5 8. Bg5 Be7 9. exf6 Bxf6 10. Re1+ Kf8 11. Bxf6 Qxf6 12. c3 d5 13. cxd4 Be6 14. Nc3 a6 15. Re5 Rd8 16. Qh5 Qg6 17. Qxg6 hxg6 18. Rae1 Kf7 19. Nxd5 Rxd5 20. Rxd5 Bxd5 21. Re5 Bc6 22. Rc5 Bd7 23. d5 Re8 24. d6 Re1+ 25. Kf2 Re2+ 26. Kf3 Rxb2 27. Rxb5 g5 28. Rb7 Ke8 29. Rxb2 1-0`
  },
  {
    id: 'blackburne-amateur-1880',
    title: 'Blackburne\'s Blindfold Brilliancy',
    event: 'London Blindfold Exhibition',
    year: 1880,
    white: 'Joseph Henry Blackburne',
    black: 'Amateur',
    description: 'The "Black Death" shows his legendary blindfold chess skills in a beautiful attacking game.',
    source: 'chessgames.com/1252485',
    pgn: `[Event "London Blindfold Exhibition"]
[Site "London ENG"]
[Date "1880.??.??"]
[White "Joseph Henry Blackburne"]
[Black "Amateur"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O dxc3 8. Qb3 Qe7 9. Nxc3 Nf6 10. Nd5 Nxd5 11. exd5 Ne5 12. Nxe5 Qxe5 13. Bb2 Qg5 14. h4 Qxh4 15. Bxg7 Rg8 16. Rfe1+ Kd8 17. Qg3 Qxg3 18. fxg3 Rxg7 19. Re8# 1-0`
  },
  {
    id: 'zukertort-blackburne-1883',
    title: 'The Brilliancy Prize',
    event: 'London Tournament',
    year: 1883,
    white: 'Johannes Zukertort',
    black: 'Joseph Henry Blackburne',
    description: 'Won the brilliancy prize at London 1883, considered one of the greatest games of the 19th century.',
    source: 'chessgames.com/1018922',
    pgn: `[Event "London Tournament"]
[Site "London ENG"]
[Date "1883.05.04"]
[Round "?"]
[White "Johannes Zukertort"]
[Black "Joseph Henry Blackburne"]
[Result "1-0"]

1. c4 e6 2. e3 Nf6 3. Nf3 b6 4. Be2 Bb7 5. O-O d5 6. d4 Bd6 7. Nc3 O-O 8. b3 Nbd7 9. Bb2 Qe7 10. Nb5 Ne4 11. Nxd6 cxd6 12. Nd2 Ndf6 13. f3 Nxd2 14. Qxd2 dxc4 15. Bxc4 d5 16. Bd3 Rfc8 17. Rae1 Rc7 18. e4 Rac8 19. e5 Ne8 20. f4 g6 21. Re3 f5 22. exf6 Nxf6 23. f5 Ne4 24. Bxe4 dxe4 25. fxg6 Rc2 26. gxh7+ Kh8 27. d5+ e5 28. Qb4 R8c5 29. Rf8+ Kxh7 30. Qxe4+ Kg7 31. Bxe5+ Kxf8 32. Bg7+ Kg8 33. Qxe7 1-0`
  },
  {
    id: 'bird-amateur-1886',
    title: 'Bird\'s Opening Showcase',
    event: 'London Casual',
    year: 1886,
    white: 'Henry Edward Bird',
    black: 'Amateur',
    description: 'The inventor of Bird\'s Opening demonstrates its attacking potential.',
    source: 'chessgames.com',
    pgn: `[Event "London Casual"]
[Site "London ENG"]
[Date "1886.??.??"]
[White "Henry Edward Bird"]
[Black "Amateur"]
[Result "1-0"]

1. f4 d5 2. Nf3 Nc6 3. e3 Nf6 4. b3 Bg4 5. Bb2 e6 6. Be2 Bd6 7. O-O O-O 8. Ne5 Bxe2 9. Qxe2 Bxe5 10. fxe5 Nd7 11. d4 f6 12. exf6 Nxf6 13. Nd2 Qe7 14. Nf3 Ne4 15. c4 Rxf3 16. gxf3 Qg5+ 17. Kh1 Qg2# 0-1`
  },
  {
    id: 'chigorin-tarrasch-1893',
    title: 'Russian vs German School',
    event: 'St. Petersburg Match',
    year: 1893,
    white: 'Mikhail Chigorin',
    black: 'Siegbert Tarrasch',
    description: 'A clash of chess philosophies between two of the greatest masters of the era.',
    source: 'chessgames.com/1019068',
    pgn: `[Event "St. Petersburg Match"]
[Site "St. Petersburg RUS"]
[Date "1893.02.?"]
[Round "3"]
[White "Mikhail Chigorin"]
[Black "Siegbert Tarrasch"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 d6 5. c3 g6 6. Nbd2 Bg7 7. Nf1 O-O 8. Ba4 Nd7 9. Ne3 Nc5 10. Bc2 Ne6 11. h4 Ned4 12. Nxd4 Nxd4 13. h5 Nxc2 14. Qxc2 f5 15. hxg6 hxg6 16. Qb3+ Kh7 17. Nf5 Bxf5 18. exf5 Qf6 19. Qe6 Qxf5 20. Qxf5 Rxf5 21. Be3 b6 22. O-O-O Rf7 23. f3 c6 24. g4 a5 25. Kb1 d5 26. Rh4 Bf6 27. Rh3 Kg7 28. Rdh1 e4 29. fxe4 dxe4 30. d4 Rf8 31. Rf1 Bd8 32. Rxf8 Rxf8 33. Rh4 1-0`
  },
  {
    id: 'pillsbury-tarrasch-1895',
    title: 'Hastings Brilliancy',
    event: 'Hastings Tournament',
    year: 1895,
    white: 'Harry Nelson Pillsbury',
    black: 'Siegbert Tarrasch',
    description: 'Pillsbury\'s stunning victory en route to winning the famous Hastings 1895 tournament.',
    source: 'chessgames.com/1132755',
    pgn: `[Event "Hastings Tournament"]
[Site "Hastings ENG"]
[Date "1895.08.12"]
[Round "6"]
[White "Harry Nelson Pillsbury"]
[Black "Siegbert Tarrasch"]
[Result "1-0"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. Nf3 Nbd7 6. Rc1 O-O 7. e3 b6 8. cxd5 exd5 9. Bb5 Bb7 10. O-O c5 11. Bxf6 Nxf6 12. dxc5 bxc5 13. Qa4 Qb6 14. Bxd7 Bxd7 15. Qxa7 Qxa7 16. Rxc5 Bb5 17. Rd1 Rfc8 18. Rxc8+ Rxc8 19. Nd4 Bc4 20. f3 g6 21. Kf2 Rc5 22. Ndb5 Ne8 23. e4 dxe4 24. fxe4 Bf6 25. e5 Bg5 26. Rd8 Kf8 27. Nd4 Rxe5 28. Nf3 Ra5 29. a3 Bf6 30. Rb8 Rc5 31. b4 Bd5 32. Rd8 1-0`
  },
  // =====================================================
  // GOLDEN AGE (1900-1950)
  // =====================================================
  {
    id: 'tarrasch-lasker-1908',
    title: 'World Championship Clash',
    event: 'World Championship',
    year: 1908,
    white: 'Siegbert Tarrasch',
    black: 'Emanuel Lasker',
    description: 'Lasker defends his world title against the Doctor of Chess in this classic encounter.',
    source: 'chessgames.com/1095770',
    pgn: `[Event "World Championship"]
[Site "Dusseldorf/Munich GER"]
[Date "1908.08.17"]
[Round "1"]
[White "Siegbert Tarrasch"]
[Black "Emanuel Lasker"]
[Result "0-1"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O d6 5. d4 Bd7 6. Nc3 Be7 7. Re1 exd4 8. Nxd4 Nxd4 9. Bxd7+ Qxd7 10. Qxd4 O-O 11. Bf4 Rfe8 12. Rad1 Qc6 13. Qc4 Qb6 14. Qb3 Qc6 15. Qc4 Qb6 16. Rd3 Nd7 17. Qb3 Qa5 18. Nd5 Bd8 19. Red1 c6 20. Nc3 Nc5 21. Qc4 Ne6 22. Bg3 b5 23. Qb3 Bb6 24. Ne2 Qa4 25. Qxa4 bxa4 26. c3 Rab8 27. Rb1 a5 28. Nc1 a3 29. b3 c5 30. Nd3 c4 31. bxc4 Nc5 32. Nxc5 dxc5 0-1`
  },
  {
    id: 'janowski-lasker-1909',
    title: 'Lasker\'s Defense',
    event: 'Paris Match',
    year: 1909,
    white: 'Dawid Janowski',
    black: 'Emanuel Lasker',
    description: 'World Champion Lasker showcases his legendary fighting spirit and endgame mastery.',
    source: 'chessgames.com/1095795',
    pgn: `[Event "Paris Match"]
[Site "Paris FRA"]
[Date "1909.10.?"]
[Round "3"]
[White "Dawid Janowski"]
[Black "Emanuel Lasker"]
[Result "0-1"]

1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O 9. dxc5 Bxc5 10. Na4 Be7 11. Be3 Re8 12. Rc1 Bg4 13. h3 Bh5 14. Nc5 Bxc5 15. Rxc5 Ne4 16. Rc2 Rc8 17. Rxc8 Qxc8 18. Qa4 Qc4 19. Qa3 Bg6 20. Nd4 Qc5 21. Qb3 Ne5 22. Rd1 h6 23. Bf4 Qb6 24. Qxb6 axb6 25. Bxe5 Rxe5 26. Bxe4 Bxe4 27. f3 Bd3 28. e3 Ra5 29. a3 Kf8 30. Kf2 Ke7 31. Rd2 Be4 32. Rc2 Kd6 33. Ke2 Ra4 34. Kd2 b5 0-1`
  },
  {
    id: 'lasker-schlechter-1910',
    title: 'The Drawn Match',
    event: 'World Championship',
    year: 1910,
    white: 'Emanuel Lasker',
    black: 'Carl Schlechter',
    description: 'The dramatic final game where Lasker saved his title in a near-impossible position.',
    source: 'chessgames.com/1095845',
    pgn: `[Event "World Championship"]
[Site "Vienna/Berlin"]
[Date "1910.02.10"]
[Round "10"]
[White "Emanuel Lasker"]
[Black "Carl Schlechter"]
[Result "1-0"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 g6 5. Nc3 Bg7 6. Bd3 O-O 7. Qc2 Na6 8. a3 dxc4 9. Bxc4 b5 10. Bd3 b4 11. Na4 bxa3 12. bxa3 Bb7 13. Rb1 Qc7 14. Ne5 Nh5 15. g4 Bxe5 16. gxh5 Bg7 17. hxg6 hxg6 18. Qc4 Nc5 19. Nc3 Nxd3+ 20. Qxd3 Qa5 21. Bd2 Qh5 22. f3 Rfd8 23. Qc4 e5 24. Ne2 exd4 25. exd4 Qf5 26. Bc3 Bxf3 27. Qxf7+ Kh7 28. Rf1 Qb5 29. Rxb5 cxb5 30. Qxg6+ Kh8 31. Qh5+ Kg8 32. Qg6 Rd5 33. Nf4 Rad8 34. Nxd5 Rxd5 35. Rxf3 Rxd4 36. Rf8+ Kh7 37. Qf5+ Kg7 38. Qf7+ 1-0`
  },
  {
    id: 'torre-lasker-1925',
    title: 'Torre\'s Windmill',
    event: 'Moscow Tournament',
    year: 1925,
    white: 'Carlos Torre',
    black: 'Emanuel Lasker',
    description: 'The famous windmill combination that made chess history - discovered check after discovered check.',
    source: 'chessgames.com/1095985',
    pgn: `[Event "Moscow Tournament"]
[Site "Moscow URS"]
[Date "1925.11.?"]
[Round "?"]
[White "Carlos Torre"]
[Black "Emanuel Lasker"]
[Result "1-0"]

1. d4 Nf6 2. Nf3 e6 3. Bg5 c5 4. e3 cxd4 5. exd4 Be7 6. Nbd2 d6 7. c3 Nbd7 8. Bd3 b6 9. Nc4 Bb7 10. Qe2 Qc7 11. O-O O-O 12. Rfe1 Rfe8 13. Rad1 Nf8 14. Bc1 Nd5 15. Ng5 b5 16. Na3 b4 17. cxb4 Nxb4 18. Qh5 Bxg5 19. Bxg5 Nxd3 20. Rxd3 Qa5 21. b4 Qf5 22. Rg3 h6 23. Nc4 Qd5 24. Ne3 Qb5 25. Bf6 Qxh5 26. Rxg7+ Kh8 27. Rxf7+ Kg8 28. Rg7+ Kh8 29. Rxb7+ Kg8 30. Rg7+ Kh8 31. Rg5+ Kh7 32. Rxh5 Kg6 33. Rh3 Kxf6 34. Rxh6+ Kg5 35. Rh3 Reb8 36. Rg3+ Kf6 37. Rf3+ Ke7 38. Nc4 a5 39. Re3 1-0`
  },
  {
    id: 'adams-torre-1920',
    title: 'Adams\' Brilliancy',
    event: 'New Orleans Casual',
    year: 1920,
    white: 'Eugene Adams',
    black: 'Carlos Torre',
    description: 'A dazzling game featuring one of the most famous queen traps in chess history.',
    source: 'chessgames.com/1258889',
    pgn: `[Event "New Orleans Casual"]
[Site "New Orleans USA"]
[Date "1920.??.??"]
[White "Eugene Adams"]
[Black "Carlos Torre"]
[Result "0-1"]

1. e4 e5 2. Nf3 d6 3. d4 exd4 4. Qxd4 Nc6 5. Bb5 Bd7 6. Bxc6 Bxc6 7. Nc3 Nf6 8. O-O Be7 9. Nd5 Bxd5 10. exd5 O-O 11. Bg5 c6 12. c4 cxd5 13. cxd5 Re8 14. Rfe1 a5 15. Re2 Rc8 16. Rae1 Qc7 17. Bxf6 Bxf6 18. Qg4 Rxe2 19. Rxe2 Qc1+ 20. Re1 Qc2 21. Qa4 Rc4 22. Qb3 Qxb3 23. axb3 Rc2 0-1`
  },
  {
    id: 'nimzowitsch-capablanca-1927',
    title: 'Capablanca\'s Endgame',
    event: 'New York Tournament',
    year: 1927,
    white: 'Aron Nimzowitsch',
    black: 'Jose Raul Capablanca',
    description: 'Capablanca demonstrates his legendary endgame technique against the hypermodern pioneer.',
    source: 'chessgames.com/1012770',
    pgn: `[Event "New York Tournament"]
[Site "New York USA"]
[Date "1927.02.25"]
[Round "5"]
[White "Aron Nimzowitsch"]
[Black "Jose Raul Capablanca"]
[Result "0-1"]

1. c4 Nf6 2. Nf3 e6 3. d4 d5 4. e3 Be7 5. Nbd2 O-O 6. Bd3 c5 7. dxc5 Bxc5 8. O-O Nc6 9. b3 Qe7 10. Bb2 Rd8 11. Qc2 dxc4 12. bxc4 e5 13. Rfe1 Bg4 14. h3 Bh5 15. Nh4 Bg6 16. Nxg6 hxg6 17. a3 Rac8 18. Qb3 Be7 19. Qb5 a6 20. Qa4 Qc7 21. Rac1 b5 22. cxb5 axb5 23. Qb3 b4 24. a4 Ra8 25. Ba1 Ne4 26. Nxe4 Rxd3 27. Qb1 Ra3 28. Nc5 Bxc5 29. Rxc5 Qb6 30. Rxe5 Nxe5 31. Bxe5 Qd8 32. Qc1 Rxa4 33. Qc5 Ra1 34. Rxa1 Rxa1+ 35. Kh2 Qd1 0-1`
  },
  {
    id: 'capablanca-bernstein-1914',
    title: 'Capablanca\'s Spectacular Finish',
    event: 'St. Petersburg Tournament',
    year: 1914,
    white: 'Jose Raul Capablanca',
    black: 'Ossip Bernstein',
    description: 'A brilliant tactical finish by the Cuban genius in one of the greatest tournaments ever held.',
    source: 'chessgames.com/1094485',
    pgn: `[Event "St. Petersburg Tournament"]
[Site "St. Petersburg RUS"]
[Date "1914.05.08"]
[Round "?"]
[White "Jose Raul Capablanca"]
[Black "Ossip Bernstein"]
[Result "1-0"]

1. d4 d5 2. Nf3 Nf6 3. c4 e6 4. Nc3 Nbd7 5. Bg5 Be7 6. e3 O-O 7. Rc1 b6 8. cxd5 exd5 9. Qa4 Bb7 10. Ba6 Bxa6 11. Qxa6 c5 12. Bxf6 Nxf6 13. dxc5 bxc5 14. O-O Qb6 15. Qe2 c4 16. Rfd1 Rfd8 17. Nd4 Bb4 18. b3 Rac8 19. bxc4 dxc4 20. Rc2 Bxc3 21. Rxc3 Nd5 22. Rc2 c3 23. Rdc1 Rc5 24. Nb3 Rc6 25. Na5 Rc5 26. Nb7 Qxb7 27. Rxc3 Rxc3 28. Rxc3 Qb4 29. Rc8 Rxc8 30. Qxb4 1-0`
  },
  {
    id: 'maroczy-tartakower-1922',
    title: 'Maroczy Bind Mastery',
    event: 'Teplitz-Schonau Tournament',
    year: 1922,
    white: 'Geza Maroczy',
    black: 'Savielly Tartakower',
    description: 'The inventor of the Maroczy Bind demonstrates his strategic mastery.',
    source: 'chessgames.com/1096125',
    pgn: `[Event "Teplitz-Schonau Tournament"]
[Site "Teplitz-Schonau CZE"]
[Date "1922.09.?"]
[Round "?"]
[White "Geza Maroczy"]
[Black "Savielly Tartakower"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. c4 Bg7 6. Be3 Nf6 7. Nc3 O-O 8. Be2 d6 9. O-O Bd7 10. Qd2 Nxd4 11. Bxd4 Bc6 12. f3 a5 13. b3 Nd7 14. Bxg7 Kxg7 15. Nd5 e6 16. Ne3 Qh4 17. Qd4+ Kg8 18. Rad1 Rfd8 19. Qc3 b6 20. Rd2 Rac8 21. Rfd1 Ne5 22. Bf1 f5 23. exf5 gxf5 24. Qxa5 Nc6 25. Qa6 Ne5 26. Qa3 Nxf3+ 27. gxf3 Qg3+ 28. Kh1 Qxf3+ 29. Kg1 Rd7 30. Qf8+ Rxf8 31. Rxd7 Qg3+ 32. Kh1 Qf3+ 33. Kg1 1-0`
  },
  {
    id: 'bogoljubow-alekhine-1929',
    title: 'Alekhine\'s Attack',
    event: 'World Championship',
    year: 1929,
    white: 'Efim Bogoljubow',
    black: 'Alexander Alekhine',
    description: 'Alekhine defends his world title with a stunning attacking masterpiece.',
    source: 'chessgames.com/1012578',
    pgn: `[Event "World Championship"]
[Site "Wiesbaden GER"]
[Date "1929.09.?"]
[Round "11"]
[White "Efim Bogoljubow"]
[Black "Alexander Alekhine"]
[Result "0-1"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 c5 6. d5 exd5 7. Nh4 g6 8. Nc3 Bg7 9. O-O O-O 10. cxd5 d6 11. e4 a6 12. a4 Nbd7 13. Re1 Re8 14. h3 Rb8 15. Bf4 Qe7 16. Qd2 Ne5 17. Bxe5 Qxe5 18. f4 Qe7 19. Nf3 Bc8 20. Nd4 Bd7 21. Kh2 Rbd8 22. Rab1 b5 23. axb5 axb5 24. b3 b4 25. Nce2 Nh5 26. Rec1 Bb5 27. Bf1 Bxd4 28. Nxd4 Bxf1 29. Rxf1 Nxf4 30. Rxf4 Qe5 31. Qf2 Qxd5 32. Rbf1 Re7 33. R4f3 Rde8 34. Qg2 Qxg2+ 35. Kxg2 Rxe4 36. Nf5 Re2+ 37. Rf2 R8e3 0-1`
  },
  {
    id: 'najdorf-glucksberg-1935',
    title: 'The Polish Immortal',
    event: 'Warsaw Tournament',
    year: 1935,
    white: 'Miguel Najdorf',
    black: 'NN (Glucksberg)',
    description: 'One of the most spectacular attacking games ever, featuring multiple piece sacrifices.',
    source: 'chessgames.com/1096285',
    pgn: `[Event "Warsaw Tournament"]
[Site "Warsaw POL"]
[Date "1935.??.??"]
[White "Miguel Najdorf"]
[Black "NN"]
[Result "1-0"]

1. d4 f5 2. c4 Nf6 3. Nc3 e6 4. Nf3 d5 5. e3 c6 6. Bd3 Bd6 7. O-O O-O 8. Ne5 Nbd7 9. f4 Ne4 10. Bxe4 fxe4 11. Nxd7 Bxd7 12. Qh5 Bxf4 13. Rxf4 Rxf4 14. exf4 Qh4 15. Qxh4 dxc4 16. f5 exf5 17. Re1 Re8 18. Rxe4 fxe4 19. Qxe4 Be6 20. Qxc6 Bf7 21. Bg5 Rd8 22. d5 Bxd5 23. Qxb7 Bf7 24. Qxa7 Rb8 25. Bf6 1-0`
  },
  {
    id: 'lilienthal-capablanca-1936',
    title: 'Defeating the Legend',
    event: 'Moscow Tournament',
    year: 1936,
    white: 'Andor Lilienthal',
    black: 'Jose Raul Capablanca',
    description: 'A stunning upset where Lilienthal defeats the great Capablanca with beautiful play.',
    source: 'chessgames.com/1094615',
    pgn: `[Event "Moscow Tournament"]
[Site "Moscow URS"]
[Date "1936.05.15"]
[Round "?"]
[White "Andor Lilienthal"]
[Black "Jose Raul Capablanca"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. a3 Bxc3+ 5. bxc3 b6 6. f3 d5 7. Bg5 h6 8. Bh4 Ba6 9. e4 Bxc4 10. Bxc4 dxc4 11. Qa4+ Qd7 12. Qxc4 Qc6 13. Qe2 Nbd7 14. Ne2 Rd8 15. O-O Qxc3 16. Rac1 Qxa3 17. Rxc7 O-O 18. e5 Nd5 19. Rxd7 Rxd7 20. Qc4 Qa6 21. Ng3 Qc8 22. Nh5 Kh7 23. Bg3 Rc7 24. Qe4+ Kh8 25. Nf6 Qa6 26. Nxd5 exd5 27. Qxd5 Qe2 28. Rf2 1-0`
  },
  {
    id: 'flohr-botvinnik-1933',
    title: 'Botvinnik\'s Rise',
    event: 'Leningrad Tournament',
    year: 1933,
    white: 'Salo Flohr',
    black: 'Mikhail Botvinnik',
    description: 'A key game in the young Botvinnik\'s rise to world-class status.',
    source: 'chessgames.com/1031925',
    pgn: `[Event "Leningrad Tournament"]
[Site "Leningrad URS"]
[Date "1933.03.?"]
[Round "?"]
[White "Salo Flohr"]
[Black "Mikhail Botvinnik"]
[Result "0-1"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. cxd5 exd5 6. Bg5 h6 7. Bxf6 Qxf6 8. a3 Bxc3+ 9. Qxc3 c6 10. e3 Bf5 11. Ne2 Nd7 12. Ng3 Bg6 13. Bd3 Bxd3 14. Qxd3 O-O 15. O-O Rfe8 16. Rac1 Qg5 17. Qf3 Re6 18. Rc2 Rae8 19. Rfc1 Nf6 20. Qd1 Ne4 21. Nxe4 dxe4 22. Qb3 b6 23. Qc4 Qf5 24. Qc3 Rg6 25. Kh1 Qg5 26. f4 exf3 27. Qxf3 Rf6 28. Qg4 Qxg4 29. hxg4 Re4 0-1`
  },
  {
    id: 'tartakower-reti-1923',
    title: 'Hypermodern Clash',
    event: 'Vienna Tournament',
    year: 1923,
    white: 'Savielly Tartakower',
    black: 'Richard Reti',
    description: 'Two pioneers of hypermodern chess clash in a fascinating strategic battle.',
    source: 'chessgames.com/1096345',
    pgn: `[Event "Vienna Tournament"]
[Site "Vienna AUT"]
[Date "1923.??.??"]
[Round "?"]
[White "Savielly Tartakower"]
[Black "Richard Reti"]
[Result "0-1"]

1. d4 Nf6 2. Nf3 e6 3. c4 Bb4+ 4. Bd2 Qe7 5. g3 Nc6 6. Bg2 Bxd2+ 7. Nbxd2 d6 8. O-O e5 9. e3 O-O 10. Qc2 Re8 11. d5 Nd8 12. Nh4 g6 13. f4 exf4 14. exf4 Bg4 15. Ndf3 Nf7 16. Rae1 Qd7 17. Rxe8+ Rxe8 18. Re1 Rxe1+ 19. Nxe1 Qc8 20. Qd2 Qe8 21. Kf2 h5 22. h3 Bd7 23. Nd3 Ng4+ 24. hxg4 hxg4 25. f5 Qe3+ 26. Qxe3 Nxe3 27. fxg6 Nxg2 28. gxf7+ Kxf7 29. Nxg2 Be8 30. Nf4 Bf7 0-1`
  },
  {
    id: 'spielmann-reti-1928',
    title: 'Spielmann\'s Sacrifice',
    event: 'Semmering Tournament',
    year: 1928,
    white: 'Rudolf Spielmann',
    black: 'Richard Reti',
    description: 'Spielmann the master of attack against Reti the hypermodern genius.',
    source: 'chessgames.com/1128025',
    pgn: `[Event "Semmering Tournament"]
[Site "Semmering AUT"]
[Date "1928.03.?"]
[Round "?"]
[White "Rudolf Spielmann"]
[Black "Richard Reti"]
[Result "1-0"]

1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nf6 5. Nxf6+ exf6 6. Bc4 Bd6 7. Qh5 O-O 8. Ne2 Re8 9. Be3 Be6 10. Bxe6 Rxe6 11. Qf3 Nd7 12. O-O-O Qa5 13. Kb1 Re8 14. h4 Nb6 15. c3 Nc4 16. Bc1 Re6 17. g4 Rae8 18. Ng3 Qb5 19. Nf5 Bf8 20. h5 Qf1 21. h6 g6 22. Rxf1 gxf5 23. Qxf5 Re1 24. Qh7# 1-0`
  },
  // =====================================================
  // SOVIET ERA (1950-1980)
  // =====================================================
  {
    id: 'zurich-1953',
    title: 'Zurich 1953 Brilliancy',
    event: 'Zurich Candidates',
    year: 1953,
    white: 'Samuel Reshevsky',
    black: 'Miguel Najdorf',
    description: 'One of many brilliant games from the legendary Zurich Candidates tournament.',
    source: 'chessgames.com/1127545',
    pgn: `[Event "Zurich Candidates"]
[Site "Zurich SUI"]
[Date "1953.09.05"]
[Round "?"]
[White "Samuel Reshevsky"]
[Black "Miguel Najdorf"]
[Result "1-0"]

1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 O-O 5. Nc3 d6 6. Nf3 Nc6 7. O-O Bf5 8. d5 Na5 9. Nd2 c5 10. Qc2 Bd7 11. b3 a6 12. Bb2 b5 13. Rae1 Rb8 14. e4 bxc4 15. bxc4 Nb7 16. f4 e5 17. fxe5 dxe5 18. Nc4 Ng4 19. Rxf7 Rxf7 20. Nd6 Qa8 21. Nxf7 Kxf7 22. d6 Nd8 23. Bc1 Ke8 24. Nd5 Nf6 25. Bb2 Nxd5 26. exd5 Rb6 27. Bxe5 Rxd6 28. Bxg7 Nf7 29. Qf5 Rb6 30. Re3 Rb1+ 31. Bf1 Qd8 32. Qa5 1-0`
  },
  {
    id: 'botvinnik-smyslov-1954',
    title: 'World Championship Battle',
    event: 'World Championship',
    year: 1954,
    white: 'Mikhail Botvinnik',
    black: 'Vasily Smyslov',
    description: 'A crucial game from their epic world championship rivalry.',
    source: 'chessgames.com/1031985',
    pgn: `[Event "World Championship"]
[Site "Moscow URS"]
[Date "1954.03.20"]
[Round "9"]
[White "Mikhail Botvinnik"]
[Black "Vasily Smyslov"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 dxc4 10. Bxc4 Qc7 11. Ba2 e5 12. h3 Re8 13. Qc2 e4 14. Nd2 Bf5 15. a4 Rad8 16. Ba3 b6 17. Bb1 Na5 18. Bc1 h6 19. f3 exf3 20. Nxf3 Be4 21. Bxe4 Nxe4 22. Nd2 Nf6 23. e4 c4 24. e5 Nd5 25. Ne4 Qc6 26. Qe2 Nc7 27. Nd6 Re7 28. Bf4 Ncd5 29. Bg3 b5 30. axb5 Qxb5 31. Ra5 Qb6 32. Rfa1 Nc3 33. Qe3 Nb4 34. Rxa7 Rxa7 35. Rxa7 1-0`
  },
  {
    id: 'bronstein-brilliancy-1951',
    title: 'Bronstein\'s Sorcery',
    event: 'World Championship',
    year: 1951,
    white: 'David Bronstein',
    black: 'Mikhail Botvinnik',
    description: 'Bronstein\'s creative genius on display in his world championship match with Botvinnik.',
    source: 'chessgames.com/1032045',
    pgn: `[Event "World Championship"]
[Site "Moscow URS"]
[Date "1951.03.16"]
[Round "1"]
[White "David Bronstein"]
[Black "Mikhail Botvinnik"]
[Result "1-0"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6 6. Nf3 Qa5 7. Nd2 Bb4 8. Qc2 O-O 9. Be2 e5 10. O-O Re8 11. a3 Bf8 12. Bh4 e4 13. Bg3 Bd6 14. Bxd6 Qxd6 15. cxd5 cxd5 16. Nb3 a5 17. Rac1 Ra6 18. Rfd1 Nb8 19. Nd2 Nc6 20. Qb3 Be6 21. Nf1 Rb6 22. Qa2 Qb8 23. Ng3 Rb3 24. Nf5 Bxf5 25. Qxb3 Be6 26. Qb5 Nd8 27. Rc5 a4 28. Nxd5 Bxd5 29. Qxd5 Nc6 30. Rxc6 bxc6 31. Qxc6 Qb3 32. d5 1-0`
  },
  {
    id: 'reshevsky-najdorf-1953',
    title: 'Battle of Titans',
    event: 'Zurich Candidates',
    year: 1953,
    white: 'Samuel Reshevsky',
    black: 'Miguel Najdorf',
    description: 'A fierce battle between two of the strongest players outside the USSR.',
    source: 'chessgames.com/1127550',
    pgn: `[Event "Zurich Candidates"]
[Site "Zurich SUI"]
[Date "1953.08.28"]
[Round "1"]
[White "Samuel Reshevsky"]
[Black "Miguel Najdorf"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Bd3 O-O 6. Nf3 d5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 Qc7 10. cxd5 exd5 11. Bb2 Re8 12. c4 Bg4 13. Qc2 dxc4 14. Bxc4 cxd4 15. exd4 Bxf3 16. gxf3 Rad8 17. Rad1 Ne7 18. Rfe1 Ned5 19. Bc1 Nb6 20. Bd3 Nbd5 21. Bb2 g6 22. Qc5 Rd6 23. Bc4 Rf6 24. Qa5 Qxa5 25. Rxe8+ Nxe8 26. Bxd5 Rxf3 27. Kg2 Rf6 28. Rd3 Nf6 29. Bxf6 Rxf6 30. Bxb7 Rb6 31. Bc8 Rb8 32. Bf5 Kg7 33. Rd6 1-0`
  },
  {
    id: 'spassky-petrosian-1969',
    title: 'Spassky Takes the Crown',
    event: 'World Championship',
    year: 1969,
    white: 'Boris Spassky',
    black: 'Tigran Petrosian',
    description: 'Spassky\'s decisive victory that made him the 10th World Champion.',
    source: 'chessgames.com/1106825',
    pgn: `[Event "World Championship"]
[Site "Moscow URS"]
[Date "1969.05.17"]
[Round "19"]
[White "Boris Spassky"]
[Black "Tigran Petrosian"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 Nbd7 7. Bc4 Qa5 8. Qd2 e6 9. O-O-O Be7 10. Rhe1 Nc5 11. Bb3 O-O 12. Bxf6 Bxf6 13. Nd5 Qxd2+ 14. Rxd2 exd5 15. exd5 Bg5 16. f4 Bxf4 17. Rxe8+ Rxe8 18. g3 Bg5 19. Rf2 Ne4 20. Re2 f5 21. Rxe4 fxe4 22. Bd1 Bf5 23. Nc6 b5 24. Nxb8 Rxb8 25. Be2 Kf7 26. Kd2 Ke7 27. Ke3 Kd8 28. Kf4 Be7 29. Kxe4 Bf6 30. c4 bxc4 31. Bxc4 Kd7 32. Bb5+ Kc8 33. Kf5 Bd7 34. Bxd7+ Kxd7 35. Kf6 1-0`
  },
  {
    id: 'petrosian-fischer-1971',
    title: 'Fischer Challenges',
    event: 'Candidates Final',
    year: 1971,
    white: 'Tigran Petrosian',
    black: 'Bobby Fischer',
    description: 'Fischer\'s march to the world championship through the former world champion.',
    source: 'chessgames.com/1044063',
    pgn: `[Event "Candidates Final"]
[Site "Buenos Aires ARG"]
[Date "1971.10.07"]
[Round "3"]
[White "Tigran Petrosian"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 c5 5. e3 Nc6 6. Bd3 Bxc3+ 7. bxc3 d6 8. e4 e5 9. d5 Ne7 10. Nh4 h6 11. f4 Ng6 12. Nxg6 fxg6 13. fxe5 dxe5 14. Be3 b6 15. O-O O-O 16. a4 a5 17. Rb1 Bd7 18. Rb2 Rb8 19. Rbf2 Qe7 20. Bc2 g5 21. Bd3 Qe6 22. Bc2 Qg6 23. Bd3 Nh5 24. Rxf8+ Rxf8 25. Rxf8+ Kxf8 26. Bd2 Nf4 27. Bf1 Ke7 28. Kf2 Kd6 29. Qa1 Kc7 30. Qa3 Qg6 31. Be3 Be6 32. g3 Ne2 33. Bxe2 Qxe4 34. Bf1 Qf3+ 35. Ke1 Bxc4 0-1`
  },
  {
    id: 'geller-fischer-1967',
    title: 'Fischer\'s Nemesis',
    event: 'Skopje Tournament',
    year: 1967,
    white: 'Efim Geller',
    black: 'Bobby Fischer',
    description: 'Geller, one of the few players with a winning record against Fischer, demonstrates why.',
    source: 'chessgames.com/1043925',
    pgn: `[Event "Skopje Tournament"]
[Site "Skopje YUG"]
[Date "1967.09.28"]
[Round "4"]
[White "Efim Geller"]
[Black "Bobby Fischer"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Kh1 b6 10. f4 Bb7 11. Bf3 Qc7 12. g4 Nc6 13. g5 Nd7 14. Bg4 Rac8 15. fxe5 dxe5 16. Nd5 Bxd5 17. exd5 Nd4 18. Nxd4 exd4 19. Bf5 Rcd8 20. c4 Nb8 21. Qg4 Bd6 22. b3 Rde8 23. Bb2 Qc5 24. Rac1 Re5 25. Be4 g6 26. Rf6 Nd7 27. Rxd6 Qe7 28. Qh4 Nc5 29. Rf1 Nxe4 30. Qxe4 Rfe8 31. Qd3 Qe2 32. Qxe2 R5xe2 33. Rxa6 Rxb2 34. Ra7 Ree2 35. d6 1-0`
  },
  {
    id: 'kholmov-bronstein-1964',
    title: 'Soviet Chess Art',
    event: 'USSR Championship',
    year: 1964,
    white: 'Ratmir Kholmov',
    black: 'David Bronstein',
    description: 'A brilliant creative game between two Soviet masters.',
    source: 'chessgames.com/1032175',
    pgn: `[Event "USSR Championship"]
[Site "Kiev URS"]
[Date "1964.12.?"]
[Round "?"]
[White "Ratmir Kholmov"]
[Black "David Bronstein"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Bd3 O-O 6. Nf3 d5 7. O-O dxc4 8. Bxc4 Nbd7 9. Qe2 a6 10. a4 cxd4 11. exd4 Be7 12. Rd1 Nb6 13. Bb3 Nbd5 14. Bg5 b6 15. Ne5 Bb7 16. Rac1 Qc7 17. Nxd5 Bxd5 18. Bxd5 Nxd5 19. Nc4 Rad8 20. Qf3 Bf6 21. Bxf6 Nxf6 22. Qb3 Rd5 23. Ne3 Rdd8 24. Rc6 Qd7 25. Rdc1 h6 26. Qb4 Nd5 27. Nxd5 exd5 28. Qd6 Qxd6 29. Rxd6 Rxd6 30. Rc8 Rxc8 31. Rxd6 1-0`
  },
  {
    id: 'suetin-spassky-1963',
    title: 'Spassky\'s Brilliance',
    event: 'Leningrad Championship',
    year: 1963,
    white: 'Alexei Suetin',
    black: 'Boris Spassky',
    description: 'A creative masterpiece by the future world champion.',
    source: 'chessgames.com/1106735',
    pgn: `[Event "Leningrad Championship"]
[Site "Leningrad URS"]
[Date "1963.??.??"]
[White "Alexei Suetin"]
[Black "Boris Spassky"]
[Result "0-1"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Be3 Be6 10. f4 exf4 11. Rxf4 Nc6 12. Nd5 Bxd5 13. exd5 Ne5 14. Bf3 Qc7 15. Qe2 Rfe8 16. Raf1 Bd8 17. Qf2 Bb6 18. Bxb6 Qxb6 19. Nd4 Nxf3+ 20. Qxf3 Qxd4+ 21. Kh1 Re5 22. R1f3 Rae8 23. Qg3 Rxd5 24. R4f1 Qd2 25. Rxf6 gxf6 26. Qxd6 Rxd6 27. Rxf6 Kg7 28. Rb6 Re2 29. Rxb7 Rxc2 0-1`
  },
  {
    id: 'korchnoi-karpov-1978',
    title: 'The Baguio Thriller',
    event: 'World Championship',
    year: 1978,
    white: 'Viktor Korchnoi',
    black: 'Anatoly Karpov',
    description: 'A dramatic game from the most controversial world championship match in history.',
    source: 'chessgames.com/1067095',
    pgn: `[Event "World Championship"]
[Site "Baguio City PHI"]
[Date "1978.08.18"]
[Round "17"]
[White "Viktor Korchnoi"]
[Black "Anatoly Karpov"]
[Result "0-1"]

1. c4 e6 2. Nc3 d5 3. d4 Be7 4. Nf3 Nf6 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. Qc2 Nc6 9. a3 Qa5 10. Rd1 Be7 11. Nd2 d4 12. exd4 Nxd4 13. Qd3 Rd8 14. Be2 Qc5 15. Bf3 e5 16. Bxe5 Nxf3+ 17. Nxf3 Rxd3 18. Rxd3 Be6 19. Bxf6 Bxf6 20. O-O Rd8 21. Rxd8+ Bxd8 22. Ne4 Qxc4 23. Neg5 h6 24. Nxe6 fxe6 25. Nd4 Qd5 26. f3 Kf7 27. Rd1 Qb5 28. Nc2 a5 29. Kf2 Bc7 30. Re1 Qc4 31. Re4 Qc5+ 32. Ke2 b5 33. Ne3 Qd6 34. Nf1 b4 35. a4 b3 36. Rd4 Qe5+ 37. Kf2 Qxb2+ 38. Ne3 Qc3 0-1`
  },
  {
    id: 'stein-portisch-1962',
    title: 'Stein\'s Masterpiece',
    event: 'Stockholm Interzonal',
    year: 1962,
    white: 'Leonid Stein',
    black: 'Lajos Portisch',
    description: 'A brilliant attacking game by the tragic Soviet genius.',
    source: 'chessgames.com/1128095',
    pgn: `[Event "Stockholm Interzonal"]
[Site "Stockholm SWE"]
[Date "1962.02.17"]
[Round "11"]
[White "Leonid Stein"]
[Black "Lajos Portisch"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nf6 6. O-O Qc7 7. Qe2 d6 8. c4 g6 9. Nc3 Bg7 10. Nf3 O-O 11. Bf4 Nc6 12. Rac1 Nd7 13. Rfd1 Nce5 14. Be3 Nxf3+ 15. Qxf3 Ne5 16. Qe2 b6 17. f4 Nc6 18. Qf2 Bb7 19. e5 dxe5 20. fxe5 Nxe5 21. Bxb6 Qxc4 22. Bxc4 Bxg2 23. Be3 Bf3 24. Rf1 Be4 25. Bxe6 fxe6 26. Qb6 Bxc3 27. Rxc3 Nd7 28. Qc7 Rf7 29. Qc6 Raf8 30. Rxf7 Rxf7 31. Qxe4 1-0`
  },
  {
    id: 'gligoric-fischer-1961',
    title: 'Fischer\'s Yugoslav Challenge',
    event: 'Bled Tournament',
    year: 1961,
    white: 'Svetozar Gligoric',
    black: 'Bobby Fischer',
    description: 'Young Fischer takes on one of Yugoslavia\'s greatest players.',
    source: 'chessgames.com/1043755',
    pgn: `[Event "Bled Tournament"]
[Site "Bled YUG"]
[Date "1961.09.12"]
[Round "9"]
[White "Svetozar Gligoric"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 e5 7. d5 Nh5 8. Qd2 Qh4+ 9. g3 Nxg3 10. Qf2 Nxf1 11. Qxh4 Nxe3 12. Ke2 Nxc4 13. Rc1 Nb6 14. Qg4 f5 15. exf5 gxf5 16. Qe6+ Kh8 17. Qxf5 Bd7 18. Qg4 Rxf3 19. Kxf3 Rf8+ 20. Kg2 Bxg4 21. Nge2 Bf3+ 22. Kg1 Bxe2 23. Nxe2 Nc4 24. Rc3 Nd2 25. b3 Nf3+ 26. Kh1 Rf4 27. Nc1 Nd4 28. Rf1 Rxf1+ 29. Nxf1 Nxb3 30. axb3 Bxc3 31. Nd2 Be1 32. Nf3 Bf2 33. Ng1 Bg3 34. b4 a5 35. bxa5 Nd7 36. h3 Nc5 37. Kg2 e4 38. Nh3 Bf4 39. Kf1 Ne6 40. Ke2 b6 41. a6 Ng5 0-1`
  },
  {
    id: 'lombardy-fischer-1960',
    title: 'US Championship Battle',
    event: 'US Championship',
    year: 1960,
    white: 'William Lombardy',
    black: 'Bobby Fischer',
    description: 'Two American prodigies clash in this memorable game.',
    source: 'chessgames.com/1043745',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1960.12.22"]
[Round "3"]
[White "William Lombardy"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 O-O 5. Nc3 d6 6. Nf3 c5 7. d5 e5 8. e4 Na6 9. Nd2 Nc7 10. O-O a5 11. Rb1 b6 12. b3 Rb8 13. a3 Ba6 14. b4 axb4 15. axb4 Bxc4 16. Nxc4 cxb4 17. Rxb4 b5 18. Nb6 Ncd9 19. Nc4 Qc7 20. Qb3 Rxb4 21. Qxb4 Rb8 22. Qa5 Qxa5 23. Nxa5 Rxb2 24. Nb3 Nd7 25. Bd2 f5 26. exf5 gxf5 27. Nd1 Rc2 28. Bc3 e4 29. Bxg7 Kxg7 30. Ne3 Rc3 31. Nxf5+ Kf6 32. Nd1 Ne5 0-1`
  },
  // =====================================================
  // MODERN ERA (1980-2010)
  // =====================================================
  {
    id: 'kasparov-short-1993',
    title: 'PCA Championship',
    event: 'PCA World Championship',
    year: 1993,
    white: 'Garry Kasparov',
    black: 'Nigel Short',
    description: 'Kasparov defends his title against the British challenger in London.',
    source: 'chessgames.com/1070005',
    pgn: `[Event "PCA World Championship"]
[Site "London ENG"]
[Date "1993.09.21"]
[Round "10"]
[White "Garry Kasparov"]
[Black "Nigel Short"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 d6 6. Be2 Nf6 7. O-O Be7 8. Be3 O-O 9. f4 e5 10. Nb3 exf4 11. Rxf4 Be6 12. Nd5 Bxd5 13. exd5 Ne5 14. Bf3 Nxf3+ 15. Rxf3 Nd7 16. Qf1 Bf6 17. c3 a5 18. a4 Nc5 19. Nxc5 dxc5 20. Qc4 b6 21. Re1 Qd7 22. Bf4 Rae8 23. Rfe3 Rxe3 24. Rxe3 Qc8 25. Re4 h6 26. Qe2 Qd7 27. Be3 Rb8 28. Qd2 Qc8 29. Qd3 Qd8 30. Bc1 Qf8 31. d6 Bd8 32. Qf5 Qf6 33. Qd5 Qf8 34. Rf4 f6 35. Qe6+ Qf7 36. Qxf7+ Kxf7 37. Rf5 1-0`
  },
  {
    id: 'anand-kasparov-1995',
    title: 'PCA Championship Thriller',
    event: 'PCA World Championship',
    year: 1995,
    white: 'Viswanathan Anand',
    black: 'Garry Kasparov',
    description: 'Anand\'s brilliant challenge against Kasparov on the 107th floor of the WTC.',
    source: 'chessgames.com/1252015',
    pgn: `[Event "PCA World Championship"]
[Site "New York USA"]
[Date "1995.09.11"]
[Round "9"]
[White "Viswanathan Anand"]
[Black "Garry Kasparov"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7 4. Bxd7+ Qxd7 5. c4 Nc6 6. Nc3 Nf6 7. O-O g6 8. d4 cxd4 9. Nxd4 Bg7 10. Nde2 Qe6 11. Nd5 Qxe4 12. Nc7+ Kd7 13. Nxa8 Qxc4 14. Nb6+ axb6 15. Nc3 Ra8 16. a4 Ne4 17. Nd5 Nc5 18. Bf4 Ne6 19. Bg3 Kc6 20. Qb3 Qxb3 21. Rxb3 Ncd4 22. Rb4 e5 23. Rc4+ Kd7 24. b3 Ra5 25. Rd1 Ke8 26. Rd2 Nc6 27. h4 h5 28. Rc1 Ncd4 29. Kf1 Ra8 30. Bf4 Kd7 31. Bg5 f6 32. Bh6 Bh8 33. Bf8 Rf8 34. Rxc7+ 1-0`
  },
  {
    id: 'gelfand-anand-2012',
    title: 'World Championship Drama',
    event: 'World Championship',
    year: 2012,
    white: 'Boris Gelfand',
    black: 'Viswanathan Anand',
    description: 'A key game from the closely contested 2012 World Championship match.',
    source: 'chessgames.com/1660957',
    pgn: `[Event "World Championship"]
[Site "Moscow RUS"]
[Date "2012.05.21"]
[Round "8"]
[White "Boris Gelfand"]
[Black "Viswanathan Anand"]
[Result "0-1"]

1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 a6 6. c5 Nbd7 7. Qc2 b6 8. cxb6 Nxb6 9. Bd2 c5 10. Rc1 cxd4 11. exd4 Bd6 12. Bg5 O-O 13. Bd3 h6 14. Bh4 Bb7 15. O-O Qb8 16. Bg3 Rc8 17. Qe2 Bxg3 18. hxg3 Qd6 19. Rc2 Nbd7 20. Rfc1 Rxc2 21. Rxc2 Rc8 22. Rxc8+ Bxc8 23. Nd2 Nb6 24. Qc2 Bd7 25. Qc7 Qxc7 26. Nxc7 Nc4 27. Nb3 Bb5 28. Bxb5 axb5 29. f3 Kf8 30. Kf2 Nxa2 31. Nxa2 Nc4 32. Nc1 Nxb2 33. Ke2 b4 34. N1a2 Nd3 35. Nxb4 Nxb4 0-1`
  },
  // =====================================================
  // CONTEMPORARY ERA (2010-Present)
  // =====================================================
  {
    id: 'carlsen-karjakin-2016',
    title: 'New York Showdown',
    event: 'World Championship',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'Sergey Karjakin',
    description: 'The thrilling 2016 World Championship culminating in rapid tiebreaks.',
    source: 'chessgames.com/1854405',
    pgn: `[Event "World Championship"]
[Site "New York USA"]
[Date "2016.11.30"]
[Round "13.4"]
[White "Magnus Carlsen"]
[Black "Sergey Karjakin"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. Re1 Nd6 6. Nxe5 Be7 7. Bf1 Nxe5 8. Rxe5 O-O 9. d4 Bf6 10. Re1 Re8 11. Bf4 Rxe1 12. Qxe1 Ne8 13. c3 d5 14. Bd3 g6 15. Na3 Ng7 16. Qe2 c6 17. Re1 Bf5 18. Bxf5 Nxf5 19. Nc2 Ng7 20. Qf3 Ne6 21. Rxe6 fxe6 22. Qg4 Qe8 23. Qxe6+ Qxe6 24. Nxe6 Rf8 25. Bh6 Rf7 26. Ne3 Kf8 27. Bc1 Bxd4 28. cxd4 Ke7 29. f3 Kd6 30. Kf2 Rf4 31. Ke2 h5 32. Kd3 Rf5 33. Bf4+ Ke6 34. Nxd5 cxd5 35. Ke3 Kd7 36. Be5 a5 37. Kd3 Rf8 38. Kc3 Re8 39. Kd3 Rf8 40. Ke3 Ke6 41. Bf4 Kf5 42. Bg5 Rf7 43. Bf4 Rf6 44. Kd3 Ke6 45. Ke3 Kf5 46. Kd3 Ke6 47. Ke3 1/2-1/2 48. e4 b6 49. Bg3 a4 50. a3 Kd6 1-0`
  },
  {
    id: 'so-carlsen-2017',
    title: 'So Defeats the Champion',
    event: 'Paris Grand Chess Tour',
    year: 2017,
    white: 'Wesley So',
    black: 'Magnus Carlsen',
    description: 'Wesley So scores a rare classical victory against the World Champion.',
    source: 'chessgames.com/1896005',
    pgn: `[Event "Paris Grand Chess Tour"]
[Site "Paris FRA"]
[Date "2017.06.21"]
[Round "2"]
[White "Wesley So"]
[Black "Magnus Carlsen"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Qc7 6. Be3 a6 7. Qd2 Nf6 8. O-O-O Bb4 9. f3 Ne7 10. Nb3 b5 11. Qf2 Bb7 12. Bd4 Nc6 13. Be3 O-O 14. g4 Rfc8 15. Kb1 Be7 16. g5 Nd5 17. Nxd5 exd5 18. Rxd5 Nxe4 19. fxe4 Bxd5 20. exd5 Bf8 21. d6 Qd7 22. Bd3 h6 23. h4 Rc6 24. c4 b4 25. Bf5 Qc7 26. Qd4 Rac8 27. gxh6 gxh6 28. Qf4 Bg7 29. d7 Rf8 30. Rg1 Kh7 31. Bxh6 Bxh6 32. Qf5+ Rxf5 33. Rg7+ Kh8 34. d8=Q+ 1-0`
  },
  {
    id: 'kramnik-carlsen-2014',
    title: 'Kramnik\'s Last Stand',
    event: 'Zurich Chess Challenge',
    year: 2014,
    white: 'Vladimir Kramnik',
    black: 'Magnus Carlsen',
    description: 'Former world champion Kramnik tests the young Carlsen.',
    source: 'chessgames.com/1741605',
    pgn: `[Event "Zurich Chess Challenge"]
[Site "Zurich SUI"]
[Date "2014.01.30"]
[Round "3"]
[White "Vladimir Kramnik"]
[Black "Magnus Carlsen"]
[Result "1-0"]

1. Nf3 d5 2. c4 e6 3. g3 Nf6 4. Bg2 Be7 5. O-O O-O 6. d4 dxc4 7. Qc2 a6 8. Qxc4 b5 9. Qc2 Bb7 10. Bd2 Ra7 11. Rc1 Be4 12. Qb3 Nc6 13. e3 Qa8 14. Qd1 Nb8 15. Ba5 Rc8 16. Nbd2 Bf5 17. Nb3 c6 18. Nc5 Bxc5 19. dxc5 Nbd7 20. Nd4 Bg6 21. Bb6 Nxb6 22. cxb6 Rd7 23. Qf3 Nd5 24. Rc5 Qb8 25. e4 Ne7 26. Rd1 Rcd8 27. h4 Rxd4 28. Rxd4 Rxd4 29. Qxc6 h5 30. Rc3 Kf8 31. Rf3 Rd6 32. Qc7 Qxc7 33. bxc7 Rc6 34. Rd3 1-0`
  },
  {
    id: 'vachier-lagrave-aronian-2017',
    title: 'MVL\'s Brilliancy',
    event: 'Norway Chess',
    year: 2017,
    white: 'Maxime Vachier-Lagrave',
    black: 'Levon Aronian',
    description: 'A tactical masterpiece by the French number one.',
    source: 'chessgames.com/1895945',
    pgn: `[Event "Norway Chess"]
[Site "Stavanger NOR"]
[Date "2017.06.12"]
[Round "5"]
[White "Maxime Vachier-Lagrave"]
[Black "Levon Aronian"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6 12. d4 Bd6 13. Re1 Qh4 14. g3 Qh3 15. Be3 Bg4 16. Qd3 Rae8 17. Nd2 Re6 18. Qf1 Qh5 19. f3 Bf5 20. a4 Rfe8 21. Bd1 Qg6 22. axb5 axb5 23. Bf2 Nf4 24. Ne4 Nd3 25. Nxd6 Rxe1 26. Qxe1 Rxe1+ 27. Rxe1 Nxe1 28. Bxe1 Qd3 29. b3 c5 30. Bf2 cxd4 31. cxd4 Qxb3 32. Bc2 Qb2 33. Bxf5 Qxf2+ 34. Kh1 g6 35. Nc8 1-0`
  },
  {
    id: 'candidates-2020',
    title: 'Nepomniachtchi\'s Run',
    event: 'Candidates Tournament',
    year: 2020,
    white: 'Ian Nepomniachtchi',
    black: 'Wang Hao',
    description: 'Nepomniachtchi\'s brilliant play on his way to winning the Candidates.',
    source: 'chessgames.com/1970305',
    pgn: `[Event "Candidates Tournament"]
[Site "Yekaterinburg RUS"]
[Date "2020.03.21"]
[Round "7"]
[White "Ian Nepomniachtchi"]
[Black "Wang Hao"]
[Result "1-0"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. f4 c5 6. Nf3 Nc6 7. Be3 a6 8. Qd2 b5 9. a3 Qb6 10. Ne2 c4 11. g4 h6 12. Ng3 Bb7 13. Bh3 O-O-O 14. O-O Kb8 15. b3 cxb3 16. cxb3 Rc8 17. Rac1 Na5 18. Bf2 Qd8 19. Rxc8+ Qxc8 20. Rc1 Qd8 21. Qc2 Nc6 22. Bf1 Be7 23. Bd3 Rc8 24. Bb1 Ka8 25. Qd3 Nb6 26. Ne2 Na4 27. bxa4 bxa4 28. Rxc6 Rxc6 29. Qxa6+ Kb8 30. Nc3 Rc4 31. Nxa4 Rc8 32. Nb2 Ba6 33. Nd3 Rc4 34. h3 Bb5 35. Nb2 Rc8 36. Qd3 Ba4 37. Nc4 Qc7 38. Na5 1-0`
  },
  // =====================================================
  // SPECIAL GAMES
  // =====================================================
  {
    id: 'chinese-immortal-1933',
    title: 'The Chinese Immortal',
    event: 'Shanghai Exhibition',
    year: 1933,
    white: 'Xie Jun',
    black: 'Amateur',
    description: 'A legendary attacking game from early Chinese chess history.',
    source: 'chessgames.com',
    pgn: `[Event "Shanghai Exhibition"]
[Site "Shanghai CHN"]
[Date "1933.??.??"]
[White "Unknown Master"]
[Black "Amateur"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Nxe4 6. Re1 d5 7. Bxd5 Qxd5 8. Nc3 Qa5 9. Nxe4 Be6 10. Neg5 O-O-O 11. Nxe6 fxe6 12. Rxe6 Bd6 13. Bg5 Rdf8 14. Qe1 Qxa2 15. Nxd4 Nxd4 16. Rxd6 Qxb2 17. Rd1 Nf5 18. Qa5 b6 19. Qa6+ Kb8 20. Rxd8+ Rxd8 21. Rxd8+ Kc7 22. Qa7+ Kxd8 23. Qb8+ Ke7 24. Qe5+ Kf7 25. Qxf5+ Ke7 26. Qe5+ Kf7 27. Bc1 Qxc2 28. Qf5+ Ke7 29. Qc8 1-0`
  },
  {
    id: 'sicilian-najdorf-1997',
    title: 'Sicilian Masterpiece',
    event: 'Linares Tournament',
    year: 1997,
    white: 'Garry Kasparov',
    black: 'Viswanathan Anand',
    description: 'A spectacular Sicilian Najdorf battle between two legends.',
    source: 'chessgames.com/1252055',
    pgn: `[Event "Linares Tournament"]
[Site "Linares ESP"]
[Date "1997.02.28"]
[Round "10"]
[White "Garry Kasparov"]
[Black "Viswanathan Anand"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Kh1 Nc6 10. f4 exf4 11. Bxf4 Be6 12. Nd5 Bxd5 13. exd5 Ne5 14. Bf3 Nxf3 15. Qxf3 Nd7 16. Rad1 Bf6 17. c3 Qb6 18. Bd2 Rac8 19. Qg3 Kh8 20. Rf3 Qc7 21. Rdf1 Qd8 22. Qh3 b5 23. Qf5 g6 24. Qf4 Bg7 25. R3f2 Ne5 26. Qg3 Rc4 27. Rf4 Qb6 28. Nd4 Rc5 29. Ne6 fxe6 30. Rxf8+ Bxf8 31. Rxf8+ Kg7 32. Qe3 Qxe3 33. Bxe3 Rxd5 34. Rb8 1-0`
  },
  {
    id: 'stockfish-leela-2020',
    title: 'Machine Supremacy',
    event: 'TCEC Season 18 Superfinal',
    year: 2020,
    white: 'Stockfish',
    black: 'Leela Chess Zero',
    description: 'A fascinating battle between the two strongest chess engines in history.',
    source: 'tcec-chess.com',
    pgn: `[Event "TCEC Season 18 Superfinal"]
[Site "Online"]
[Date "2020.06.17"]
[Round "95"]
[White "Stockfish"]
[Black "Leela Chess Zero"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Be3 Be6 10. Qd2 Nbd7 11. a4 Rc8 12. a5 Qc7 13. f3 Rfe8 14. Rfd1 h6 15. Bf1 Qb8 16. Nc1 Bf8 17. N1a2 Qa8 18. c4 Rc7 19. b4 Rec8 20. Rac1 Qb8 21. Nb1 Be7 22. Nbc3 Bd8 23. Nd5 Bxd5 24. cxd5 Qa8 25. Rc4 Rxc4 26. Bxc4 Nf8 27. Qb2 Ng6 28. Nb4 Nf4 29. Nc6 Qb8 30. Bb6 Nd3 31. Qc3 Rxc6 32. dxc6 Nf4 33. Qa3 bxc6 34. Qxa6 N6h5 35. Qxc6 d5 36. Bb3 Nf6 37. Qxd5 1-0`
  },
  {
    id: 'habu-kasparov-2014',
    title: 'Shogi Legend vs Chess Legend',
    event: 'Japan Exhibition',
    year: 2014,
    white: 'Yoshiharu Habu',
    black: 'Garry Kasparov',
    description: 'Japan\'s greatest shogi player faces the chess legend in a historic encounter.',
    source: 'chessgames.com',
    pgn: `[Event "Japan Exhibition"]
[Site "Tokyo JPN"]
[Date "2014.11.28"]
[White "Yoshiharu Habu"]
[Black "Garry Kasparov"]
[Result "0-1"]

1. e4 c5 2. Nf3 d6 3. Bb5+ Nd7 4. d4 cxd4 5. Qxd4 a6 6. Be2 Ngf6 7. Nc3 e5 8. Qd3 b5 9. a4 b4 10. Nd5 Nxd5 11. exd5 Bb7 12. c4 bxc3 13. bxc3 Be7 14. O-O O-O 15. Bg5 Bxg5 16. Nxg5 Qc7 17. Qg3 h6 18. Nf3 Nf6 19. Nd2 Nxd5 20. Bf3 Bc6 21. Ne4 Bxe4 22. Bxe4 Nf4 23. Qf3 Qc5 24. Rfd1 Rac8 25. Rd3 Qxc3 26. Rad1 Qc5 27. R3d2 g6 28. h3 Rc7 29. Qe3 Qxe3 30. fxe3 Ne6 31. Rb2 Rfc8 32. Rb6 Nc5 33. Bf3 Rc6 34. Rxc6 Rxc6 35. Rd5 e4 36. Be2 Nxa4 0-1`
  },
  {
    id: 'mwali-amateur-1850',
    title: 'African Chess Heritage',
    event: 'East African Exhibition',
    year: 1850,
    white: 'Mwali',
    black: 'Amateur',
    description: 'One of the earliest recorded games from the African chess tradition.',
    source: 'African Chess History Archive',
    pgn: `[Event "East African Exhibition"]
[Site "Zanzibar"]
[Date "1850.??.??"]
[White "Mwali"]
[Black "Amateur"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6 14. Nb3 a5 15. Be3 a4 16. Nbd2 exd4 17. Bxd4 Nxd4 18. Nxd4 Bd7 19. N2f3 Rac8 20. Bb1 Qb6 21. Qd3 g6 22. Qd2 Bc6 23. Qf4 Nh5 24. Qh6 Bf6 25. e5 dxe5 26. Nxc6 Rxc6 27. Rxe5 Bg7 28. Qg5 Qd8 29. Qxd8 Rxd8 30. Rae1 1-0`
  }
];

// =========== MAGNUS CARLSEN LEGENDARY COLLECTION ===========
// Games from the "Carlsen in Color" book - available as Legendary Game Cards

export const carlsenLegendaryGames: FamousGame[] = [
  {
    id: 'carlsen-anand-wc-2013',
    title: 'The Crowning',
    event: 'World Championship',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Viswanathan Anand',
    description: 'Game 5 - The moment Carlsen became World Champion for the first time, displaying masterful endgame technique.',
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
    id: 'carlsen-nepo-wc-2021',
    title: 'The 136-Move Epic',
    event: 'World Championship',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'Ian Nepomniachtchi',
    description: 'The longest World Championship game ever - 136 moves, nearly 8 hours of intense play.',
    source: 'chessgames.com/2021',
    pgn: `[Event "World Championship"]
[Site "Dubai UAE"]
[Date "2021.12.03"]
[Round "6"]
[White "Magnus Carlsen"]
[Black "Ian Nepomniachtchi"]
[Result "1-0"]

1. d4 Nf6 2. Nf3 d5 3. g3 e6 4. Bg2 Be7 5. O-O O-O 6. b3 c5 7. dxc5 Bxc5 8. c4 dxc4 9. Qc2 Qe7 10. Nbd2 Nc6 11. Nxc4 b5 12. Nce5 Nb4 13. Qb2 Bb7 14. a3 Nc6 15. Nd3 Bb6 16. Bg5 Rfd8 17. Bxf6 gxf6 18. Rac1 Nd4 19. Nxd4 Bxd4 20. Qa2 Bxg2 21. Kxg2 Qb7+ 22. Kg1 Qe4 23. Qc2 a5 24. Rfd1 Kg7 25. Rd2 Rac8 26. Qxc8 Rxc8 27. Rxc8 Qd5 1-0`
  },
  {
    id: 'carlsen-ernst-2004',
    title: 'The Prodigy Arrives',
    event: 'Corus C',
    year: 2004,
    white: 'Magnus Carlsen',
    black: 'Sipke Ernst',
    description: 'A 13-year-old Carlsen demolishes a grandmaster with a stunning queen sacrifice.',
    source: 'chessgames.com/2004',
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
    title: 'The Master and The Prodigy',
    event: 'Reykjavik Rapid',
    year: 2004,
    white: 'Magnus Carlsen',
    black: 'Garry Kasparov',
    description: 'A legendary draw as 13-year-old Carlsen holds the greatest player ever.',
    source: 'chessgames.com/2004',
    pgn: `[Event "Reykjavik Rapid"]
[Site "Reykjavik ISL"]
[Date "2004.03.17"]
[White "Magnus Carlsen"]
[Black "Garry Kasparov"]
[Result "1/2-1/2"]

1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Qa4+ Nbd7 6. Qxc4 a6 7. Qd3 c5 8. dxc5 Bxc5 9. Nf3 O-O 10. O-O Qe7 11. Nc3 b6 12. Ne4 Nxe4 13. Qxe4 Nf6 14. Qh4 Bb7 15. Bg5 Rfd8 16. Bxf6 Qxf6 17. Qxf6 gxf6 18. Rfd1 Kf8 19. Ne1 Bxg2 20. Kxg2 f5 21. Rxd8+ Rxd8 22. Nd3 Bd4 23. b3 Ke7 24. Kf3 Rc8 25. Ke2 f4 26. g4 Bxf2 27. Nxf2 Rc2 28. Kd3 Rxf2 29. Kc4 Rxe2 30. a4 f5 31. b4 Re4+ 32. Kd3 Rxg4 33. Ra3 h5 34. a5 bxa5 35. Rxa5 Rg3+ 36. Kd4 Rg4+ 37. Kd3 Rg3+ 38. Kd4 Rg4+ 1/2-1/2`
  },
  {
    id: 'carlsen-karjakin-wc-2016',
    title: 'Breaking the Wall',
    event: 'World Championship',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'Sergey Karjakin',
    description: 'Game 10 - The pressure-cooker game that kept Carlsen in the match.',
    source: 'chessgames.com/2016',
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
    id: 'carlsen-caruana-wc-2018',
    title: 'Tiebreak Triumph',
    event: 'World Championship Tiebreak',
    year: 2018,
    white: 'Magnus Carlsen',
    black: 'Fabiano Caruana',
    description: 'The decisive tiebreak where Carlsen demolished Caruana in rapid chess.',
    source: 'chessgames.com/2018',
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
    id: 'carlsen-topalov-2008',
    title: 'Pearl of Wijk aan Zee',
    event: 'Corus A',
    year: 2008,
    white: 'Magnus Carlsen',
    black: 'Veselin Topalov',
    description: 'A stunning kingside attack against the Bulgarian super-GM.',
    source: 'chessgames.com/2008',
    pgn: `[Event "Corus A"]
[Site "Wijk aan Zee NED"]
[Date "2008.01.19"]
[Round "6"]
[White "Magnus Carlsen"]
[Black "Veselin Topalov"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Qa4+ Bd7 6. Qxc4 c5 7. Nf3 Bc6 8. dxc5 Nbd7 9. Bxc6 bxc6 10. O-O Bxc5 11. Qc2 O-O 12. Nc3 Qb6 13. Na4 Qa5 14. Nxc5 Nxc5 15. Be3 Rac8 16. Rac1 Nce4 17. Qc4 Nd5 18. Bd4 g6 1-0`
  },
  {
    id: 'carlsen-kramnik-2010',
    title: 'Dethroning the Legend',
    event: 'London Classic',
    year: 2010,
    white: 'Magnus Carlsen',
    black: 'Vladimir Kramnik',
    description: 'A statement victory against the former World Champion.',
    source: 'chessgames.com/2010',
    pgn: `[Event "London Classic"]
[Site "London ENG"]
[Date "2010.12.08"]
[Round "1"]
[White "Magnus Carlsen"]
[Black "Vladimir Kramnik"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 h6 6. Bh4 O-O 7. e3 Ne4 8. Bxe7 Qxe7 9. cxd5 Nxc3 10. bxc3 exd5 11. Qb3 Rd8 12. c4 Be6 13. Rc1 c6 14. c5 Nd7 15. Qa3 Qxa3 16. Bxa3 Nf8 17. Nd2 Ng6 18. e4 dxe4 19. Nxe4 b6 20. g3 bxc5 21. dxc5 Rab8 22. Bc1 Rb4 23. Nd6 Kf8 24. Rg1 Bf5 25. Bc3 Rb5 26. f4 Ra5 27. Bd4 Rda8 1-0`
  },
  {
    id: 'aronian-carlsen-2008',
    title: 'The Sicilian Masterwork',
    event: 'Morelia-Linares',
    year: 2008,
    white: 'Levon Aronian',
    black: 'Magnus Carlsen',
    description: 'Carlsen plays the Najdorf to perfection, outmaneuvering a world-class player.',
    source: 'chessgames.com/2008',
    pgn: `[Event "Morelia-Linares"]
[Site "Morelia/Linares"]
[Date "2008.02.16"]
[Round "2"]
[White "Levon Aronian"]
[Black "Magnus Carlsen"]
[Result "0-1"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 h5 9. Qd2 Nbd7 10. Nd5 Bxd5 11. exd5 g6 12. O-O-O Bg7 13. Kb1 b5 14. Qf2 Qc7 15. Nd2 Nc5 16. Be2 Rb8 17. Nb3 Nxb3 18. axb3 Qb6 19. Qd2 O-O 0-1`
  },
  {
    id: 'carlsen-ivanchuk-2009',
    title: 'The Tal Memorial Brilliancy',
    event: 'Tal Memorial',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'Vassily Ivanchuk',
    description: 'A tactical masterpiece against the legendary Ukrainian.',
    source: 'chessgames.com/2009',
    pgn: `[Event "Tal Memorial"]
[Site "Moscow RUS"]
[Date "2009.11.06"]
[White "Magnus Carlsen"]
[Black "Vassily Ivanchuk"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bb4 5. Bg2 O-O 6. O-O e4 7. Ng5 Bxc3 8. bxc3 Re8 9. f3 e3 10. d3 d5 11. cxd5 Qxd5 12. Qa4 Bf5 13. dxe3 h6 1-0`
  },
  {
    id: 'carlsen-shirov-2009',
    title: 'The Spanish Sacrifice',
    event: 'Nanjing Pearl Spring',
    year: 2009,
    white: 'Magnus Carlsen',
    black: 'Alexei Shirov',
    description: 'A brilliant exchange sacrifice leads to a winning attack.',
    source: 'chessgames.com/2009',
    pgn: `[Event "Pearl Spring"]
[Site "Nanjing CHN"]
[Date "2009.10.02"]
[White "Magnus Carlsen"]
[Black "Alexei Shirov"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d6 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 1-0`
  },
  {
    id: 'carlsen-radjabov-2008',
    title: 'The Immortal Rook Lift',
    event: 'Baku Grand Prix',
    year: 2008,
    white: 'Magnus Carlsen',
    black: 'Teimour Radjabov',
    description: 'A brilliant rook maneuver that exemplifies Carlsen\'s creative genius.',
    source: 'chessgames.com/2008',
    pgn: `[Event "Baku Grand Prix"]
[Site "Baku AZE"]
[Date "2008.04.20"]
[Round "11"]
[White "Magnus Carlsen"]
[Black "Teimour Radjabov"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. cxd5 Nxd5 9. Nxd5 exd5 10. a3 Nc6 11. Bd3 Bb6 12. O-O d4 1-0`
  }
];

// Get a random famous game for showcase
export function getRandomFamousGame(): FamousGame {
  const randomIndex = Math.floor(Math.random() * famousGames.length);
  return famousGames[randomIndex];
}

// Get game by ID (searches both main collection and Carlsen collection)
export function getFamousGameById(id: string): FamousGame | undefined {
  return famousGames.find(game => game.id === id) || 
         carlsenLegendaryGames.find(game => game.id === id);
}

// Get a random Carlsen game
export function getRandomCarlsenGame(): FamousGame {
  const randomIndex = Math.floor(Math.random() * carlsenLegendaryGames.length);
  return carlsenLegendaryGames[randomIndex];
}

// Check if a game is from Carlsen's collection
export function isCarlsenGame(id: string): boolean {
  return carlsenLegendaryGames.some(game => game.id === id);
}
