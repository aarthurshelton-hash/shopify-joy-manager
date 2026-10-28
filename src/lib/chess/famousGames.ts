// Famous historical chess games. Every game except those marked "unverified" was matched
// against the pgnmentor.com player archives (players, year, and full move sequence).

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
    event: 'Hoogovens',
    year: 1999,
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    description: 'Considered one of the greatest games ever played. Kasparov sacrifices his rook and queen in a brilliant attacking display.',
    source: 'pgnmentor.com/players/Kasparov.zip',
    pgn: `[Event "Hoogovens"]
[Site "Wijk aan Zee"]
[Date "1999.01.20"]
[Round "4"]
[White "Garry Kasparov"]
[Black "Veselin Topalov"]
[Result "1-0"]
[WhiteElo "2812"]
[BlackElo "2700"]
[ECO "B07"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`
  },
  {
    id: 'byrne-fischer-1956',
    title: 'The Game of the Century',
    event: 'New York Rosenwald',
    year: 1956,
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    description: 'A 13-year-old Bobby Fischer stuns the chess world with a queen sacrifice that leads to a spectacular victory.',
    source: 'pgnmentor.com/players/Fischer.zip',
    pgn: `[Event "New York Rosenwald"]
[Site "New York"]
[Date "1956.??.??"]
[Round "?"]
[White "Donald Byrne"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "D97"]

1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1`
  },
  {
    id: 'anderssen-kieseritzky-1851',
    title: 'The Immortal Game',
    event: 'London \'Immortal game\'',
    year: 1851,
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    description: 'The most famous chess game ever played. Anderssen sacrifices both rooks and his queen to deliver checkmate.',
    source: 'pgnmentor.com/players/Anderssen.zip',
    pgn: `[Event "London 'Immortal game'"]
[Site "London"]
[Date "1851.??.??"]
[Round "?"]
[White "Adolf Anderssen"]
[Black "Lionel Kieseritzky"]
[Result "1-0"]
[ECO "C33"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`
  },
  {
    id: 'deep-blue-kasparov-1997',
    title: "Deep Blue's Final Blow",
    event: 'New York man vs machine',
    year: 1997,
    white: 'Deep Blue',
    black: 'Garry Kasparov',
    description: 'The decisive final game where Deep Blue clinched the historic match against the world champion.',
    source: 'pgnmentor.com/players/Kasparov.zip',
    pgn: `[Event "New York man vs machine"]
[Site "New York"]
[Date "1997.??.??"]
[Round "6"]
[White "Deep Blue"]
[Black "Garry Kasparov"]
[Result "1-0"]
[BlackElo "2785"]
[ECO "B17"]

1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Ng5 Ngf6 6. Bd3 e6 7. N1f3 h6 8. Nxe6 Qe7 9. O-O fxe6 10. Bg6+ Kd8 11. Bf4 b5 12. a4 Bb7 13. Re1 Nd5 14. Bg3 Kc8 15. axb5 cxb5 16. Qd3 Bc6 17. Bf5 exf5 18. Rxe7 Bxe7 19. c4 1-0`
  },
  {
    id: 'spassky-fischer-1972',
    title: 'Fischer Strikes Back',
    event: 'World Championship 28th',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    description: "Fischer's brilliant victory over Spassky in Game 5, featuring powerful positional play.",
    source: 'pgnmentor.com/players/Fischer.zip',
    pgn: `[Event "World Championship 28th"]
[Site "Reykjavik"]
[Date "1972.??.??"]
[Round "5"]
[White "Boris Spassky"]
[Black "Bobby Fischer"]
[Result "0-1"]
[WhiteElo "2660"]
[BlackElo "2785"]
[ECO "E41"]

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
    source: 'unverified (legal PGN, no archive match)',
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
    event: 'Paris it',
    year: 1858,
    white: 'Paul Morphy',
    black: 'Duke of Brunswick & Count Isouard',
    description: 'The most famous informal game ever played. Morphy demonstrated perfect development and a stunning queen sacrifice.',
    source: 'pgnmentor.com/players/Morphy.zip',
    pgn: `[Event "Paris it"]
[Site "Paris"]
[Date "1858.??.??"]
[Round "?"]
[White "Paul Morphy"]
[Black "Duke of Brunswick & Count Isouard"]
[Result "1-0"]
[ECO "C41"]

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
    source: 'unverified (legal PGN, no archive match)',
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
    event: 'WCh 2013',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Viswanathan Anand',
    description: 'Game 5 from the 2013 World Championship where Carlsen displayed masterful endgame technique.',
    source: 'pgnmentor.com/players/Carlsen.zip',
    pgn: `[Event "WCh 2013"]
[Site "Chennai IND"]
[Date "2013.11.15"]
[Round "5"]
[White "Magnus Carlsen"]
[Black "Viswanathan Anand"]
[Result "1-0"]
[WhiteElo "2870"]
[BlackElo "2775"]
[ECO "D31"]

1. c4 e6 2. d4 d5 3. Nc3 c6 4. e4 dxe4 5. Nxe4 Bb4+ 6. Nc3 c5 7. a3 Ba5 8. Nf3 Nf6 9. Be3 Nc6 10. Qd3 cxd4 11. Nxd4 Ng4 12. O-O-O Nxe3 13. fxe3 Bc7 14. Nxc6 bxc6 15. Qxd8+ Bxd8 16. Be2 Ke7 17. Bf3 Bd7 18. Ne4 Bb6 19. c5 f5 20. cxb6 fxe4 21. b7 Rab8 22. Bxe4 Rxb7 23. Rhf1 Rb5 24. Rf4 g5 25. Rf3 h5 26. Rdf1 Be8 27. Bc2 Rc5 28. Rf6 h4 29. e4 a5 30. Kd2 Rb5 31. b3 Bh5 32. Kc3 Rc5+ 33. Kb2 Rd8 34. R1f2 Rd4 35. Rh6 Bd1 36. Bb1 Rb5 37. Kc3 c5 38. Rb2 e5 39. Rg6 a4 40. Rxg5 Rxb3+ 41. Rxb3 Bxb3 42. Rxe5+ Kd6 43. Rh5 Rd1 44. e5+ Kd5 45. Bh7 Rc1+ 46. Kb2 Rg1 47. Bg8+ Kc6 48. Rh6+ Kd7 49. Bxb3 axb3 50. Kxb3 Rxg2 51. Rxh4 Ke6 52. a4 Kxe5 53. a5 Kd6 54. Rh7 Kd5 55. a6 c4+ 56. Kc3 Ra2 57. a7 Kc5 58. h4 1-0`
  },
  {
    id: 'botvinnik-capablanca-1938',
    title: 'Botvinnik Brilliance',
    event: 'AVRO',
    year: 1938,
    white: 'Mikhail Botvinnik',
    black: 'Jose Raul Capablanca',
    description: 'A stunning victory by Botvinnik against the former world champion, featuring a beautiful queen sacrifice.',
    source: 'pgnmentor.com/players/Botvinnik.zip',
    pgn: `[Event "AVRO"]
[Site "Amsterdam"]
[Date "1938.??.??"]
[Round "?"]
[White "Mikhail Botvinnik"]
[Black "Jose Raul Capablanca"]
[Result "1-0"]
[ECO "E49"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5 exd5 8. Bd3 O-O 9. Ne2 b6 10. O-O Ba6 11. Bxa6 Nxa6 12. Bb2 Qd7 13. a4 Rfe8 14. Qd3 c4 15. Qc2 Nb8 16. Rae1 Nc6 17. Ng3 Na5 18. f3 Nb3 19. e4 Qxa4 20. e5 Nd7 21. Qf2 g6 22. f4 f5 23. exf6 Nxf6 24. f5 Rxe1 25. Rxe1 Re8 26. Re6 Rxe6 27. fxe6 Kg7 28. Qf4 Qe8 29. Qe5 Qe7 30. Ba3 Qxa3 31. Nh5+ gxh5 32. Qg5+ Kf8 33. Qxf6+ Kg8 34. e7 Qc1+ 35. Kf2 Qc2+ 36. Kg3 Qd3+ 37. Kh4 Qe4+ 38. Kxh5 Qe2+ 39. Kh4 Qe4+ 40. g4 Qe1+ 41. Kh5 1-0`
  },
  {
    id: 'alekhine-capablanca-1927',
    title: 'The Marathon Match',
    event: 'World Championship 13th',
    year: 1927,
    white: 'Alexander Alekhine',
    black: 'Jose Raul Capablanca',
    description: 'The decisive 34th game of their epic World Championship match, ending Capablanca\'s reign.',
    source: 'pgnmentor.com/players/Capablanca.zip',
    pgn: `[Event "World Championship 13th"]
[Site "Buenos Aires"]
[Date "1927.??.??"]
[Round "34"]
[White "Alexander Alekhine"]
[Black "Jose Raul Capablanca"]
[Result "1-0"]
[ECO "D51"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6 6. a3 Be7 7. Nf3 O-O 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. Ne4 N5f6 12. Ng3 c5 13. O-O Nb6 14. Ba2 cxd4 15. Nxd4 g6 16. Rc1 Bd7 17. Qe2 Rac8 18. e4 e5 19. Nf3 Kg7 20. h3 h6 21. Qd2 Be6 22. Bxe6 Qxe6 23. Qa5 Nc4 24. Qxa7 Nxb2 25. Rxc8 Rxc8 26. Qxb7 Nc4 27. Qb4 Ra8 28. Ra1 Qc6 29. a4 Nxe4 30. Nxe5 Qd6 31. Qxc4 Qxe5 32. Re1 Nd6 33. Qc1 Qf6 34. Ne4 Nxe4 35. Rxe4 Rb8 36. Re2 Ra8 37. Ra2 Ra5 38. Qc7 Qa6 39. Qc3+ Kh7 40. Rd2 Qb6 41. Rd7 Qb1+ 42. Kh2 Qb8+ 43. g3 Rf5 44. Qd4 Qe8 45. Rd5 Rf3 46. h4 Qh8 47. Qb6 Qa1 48. Kg2 Rf6 49. Qd4 Qxd4 50. Rxd4 Kg7 51. a5 Ra6 52. Rd5 Rf6 53. Rd4 Ra6 54. Ra4 Kf6 55. Kf3 Ke5 56. Ke3 h5 57. Kd3 Kd5 58. Kc3 Kc5 59. Ra2 Kb5 60. Kb3 Kc5 61. Kc3 Kb5 62. Kd4 Rd6+ 63. Ke5 Re6+ 64. Kf4 Ka6 65. Kg5 Re5+ 66. Kh6 Rf5 67. f4 Rc5 68. Ra3 Rc7 69. Kg7 Rd7 70. f5 gxf5 71. Kh6 f4 72. gxf4 Rd5 73. Kg7 Rf5 74. Ra4 Kb5 75. Re4 Ka6 76. Kh6 Rxa5 77. Re5 Ra1 78. Kxh5 Rg1 79. Rg5 Rh1 80. Rf5 Kb6 81. Rxf7 Kc6 82. Re7 1-0`
  },
  {
    id: 'anderssen-dufresne-1852',
    title: 'The Evergreen Game',
    event: 'Berlin \'Evergreen\'',
    year: 1852,
    white: 'Adolf Anderssen',
    black: 'Jean Dufresne',
    description: 'Another Anderssen masterpiece with a stunning queen sacrifice leading to an elegant checkmate.',
    source: 'pgnmentor.com/players/Anderssen.zip',
    pgn: `[Event "Berlin 'Evergreen'"]
[Site "Berlin"]
[Date "1852.??.??"]
[Round "?"]
[White "Adolf Anderssen"]
[Black "Jean Dufresne"]
[Result "1-0"]
[ECO "C52"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7# 1-0`
  },
  {
    id: 'karpov-kasparov-1985',
    title: 'The Octopus Knight',
    event: 'World Championship 32th-KK2',
    year: 1985,
    white: 'Anatoly Karpov',
    black: 'Garry Kasparov',
    description: 'Game 16 of their legendary 1985 match, where Kasparov\'s knight dominated from d3.',
    source: 'pgnmentor.com/players/Kasparov.zip',
    pgn: `[Event "World Championship 32th-KK2"]
[Site "Moscow"]
[Date "1985.??.??"]
[Round "16"]
[White "Anatoly Karpov"]
[Black "Garry Kasparov"]
[Result "0-1"]
[WhiteElo "2720"]
[BlackElo "2700"]
[ECO "B44"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 d5 9. cxd5 exd5 10. exd5 Nb4 11. Be2 Bc5 12. O-O O-O 13. Bf3 Bf5 14. Bg5 Re8 15. Qd2 b5 16. Rad1 Nd3 17. Nab1 h6 18. Bh4 b4 19. Na4 Bd6 20. Bg3 Rc8 21. b3 g5 22. Bxd6 Qxd6 23. g3 Nd7 24. Bg2 Qf6 25. a3 a5 26. axb4 axb4 27. Qa2 Bg6 28. d6 g4 29. Qd2 Kg7 30. f3 Qxd6 31. fxg4 Qd4+ 32. Kh1 Nf6 33. Rf4 Ne4 34. Qxd3 Nf2+ 35. Rxf2 Bxd3 36. Rfd2 Qe3 37. Rxd3 Rc1 38. Nb2 Qf2 39. Nd2 Rxd1+ 40. Nxd1 Re1+ 0-1`
  },
  {
    id: 'short-timman-1991',
    title: "Short's King Walk",
    event: 'Tilburg',
    year: 1991,
    white: 'Nigel Short',
    black: 'Jan Timman',
    description: 'Famous for Short marching his king up the board in a daring attack that won brilliantly.',
    source: 'pgnmentor.com/players/Short.zip',
    pgn: `[Event "Tilburg"]
[Site "Tilburg"]
[Date "1991.??.??"]
[Round "4"]
[White "Nigel Short"]
[Black "Jan Timman"]
[Result "1-0"]
[WhiteElo "2660"]
[BlackElo "2630"]
[ECO "B04"]

1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 g6 5. Bc4 Nb6 6. Bb3 Bg7 7. Qe2 Nc6 8. O-O O-O 9. h3 a5 10. a4 dxe5 11. dxe5 Nd4 12. Nxd4 Qxd4 13. Re1 e6 14. Nd2 Nd5 15. Nf3 Qc5 16. Qe4 Qb4 17. Bc4 Nb6 18. b3 Nxc4 19. bxc4 Re8 20. Rd1 Qc5 21. Qh4 b6 22. Be3 Qc6 23. Bh6 Bh8 24. Rd8 Bb7 25. Rad1 Bg7 26. R8d7 Rf8 27. Bxg7 Kxg7 28. R1d4 Rae8 29. Qf6+ Kg8 30. h4 h5 31. Kh2 Rc8 32. Kg3 Rce8 33. Kf4 Bc8 34. Kg5 1-0`
  },
  {
    id: 'fischer-spassky-1972-g6',
    title: 'Fischer\'s Masterpiece',
    event: 'World Championship 28th',
    year: 1972,
    white: 'Bobby Fischer',
    black: 'Boris Spassky',
    description: 'Game 6 of the Match of the Century, considered by many as the greatest game ever played.',
    source: 'pgnmentor.com/players/Fischer.zip',
    pgn: `[Event "World Championship 28th"]
[Site "Reykjavik"]
[Date "1972.??.??"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Boris Spassky"]
[Result "1-0"]
[WhiteElo "2785"]
[BlackElo "2660"]
[ECO "D59"]

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
    source: 'unverified (legal PGN, no archive match)',
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
    event: 'Lodz1',
    year: 1907,
    white: 'Georg Rotlewi',
    black: 'Akiba Rubinstein',
    description: 'A stunning queen sacrifice by Rubinstein creates one of the most beautiful combinations ever.',
    source: 'pgnmentor.com/players/Rubinstein.zip',
    pgn: `[Event "Lodz1"]
[Site "Lodz"]
[Date "1907.??.??"]
[Round "?"]
[White "Georg Rotlewi"]
[Black "Akiba Rubinstein"]
[Result "0-1"]
[ECO "D40"]

1. d4 d5 2. Nf3 e6 3. e3 c5 4. c4 Nc6 5. Nc3 Nf6 6. dxc5 Bxc5 7. a3 a6 8. b4 Bd6 9. Bb2 O-O 10. Qd2 Qe7 11. Bd3 dxc4 12. Bxc4 b5 13. Bd3 Rd8 14. Qe2 Bb7 15. O-O Ne5 16. Nxe5 Bxe5 17. f4 Bc7 18. e4 Rac8 19. e5 Bb6+ 20. Kh1 Ng4 21. Be4 Qh4 22. g3 Rxc3 23. gxh4 Rd2 24. Qxd2 Bxe4+ 25. Qg2 Rh3 0-1`
  },
  {
    id: 'larsen-spassky-1970',
    title: 'Spassky\'s Double Bishop Sacrifice',
    event: 'Belgrade URS-World',
    year: 1970,
    white: 'Bent Larsen',
    black: 'Boris Spassky',
    description: 'Spassky destroys Larsen with a stunning double bishop sacrifice on h2 and g2.',
    source: 'pgnmentor.com/players/Spassky.zip',
    pgn: `[Event "Belgrade URS-World"]
[Site "Belgrade"]
[Date "1970.??.??"]
[Round "2.1"]
[White "Bent Larsen"]
[Black "Boris Spassky"]
[Result "0-1"]
[ECO "A01"]

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
    source: 'unverified (legal PGN, no archive match)',
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
    id: 'spassky-bronstein-1960',
    title: 'The King\'s Gambit Immortal',
    event: 'URS-ch27',
    year: 1960,
    white: 'Boris Spassky',
    black: 'David Bronstein',
    description: 'A brilliant King\'s Gambit game showcasing the romantic style of chess.',
    source: 'pgnmentor.com/players/Spassky.zip',
    pgn: `[Event "URS-ch27"]
[Site "Leningrad"]
[Date "1960.??.??"]
[Round "?"]
[White "Boris Spassky"]
[Black "David Bronstein"]
[Result "1-0"]
[ECO "C36"]

1. e4 e5 2. f4 exf4 3. Nf3 d5 4. exd5 Bd6 5. Nc3 Ne7 6. d4 O-O 7. Bd3 Nd7 8. O-O h6 9. Ne4 Nxd5 10. c4 Ne3 11. Bxe3 fxe3 12. c5 Be7 13. Bc2 Re8 14. Qd3 e2 15. Nd6 Nf8 16. Nxf7 exf1=Q+ 17. Rxf1 Bf5 18. Qxf5 Qd7 19. Qf4 Bf6 20. N3e5 Qe7 21. Bb3 Bxe5 22. Nxe5+ Kh7 23. Qe4+ 1-0`
  },
  // =====================================================
  // HISTORICAL ERA (1500-1900) - Early Masters
  // =====================================================
  {
    id: 'zukertort-blackburne-1883',
    title: 'The Brilliancy Prize',
    event: 'London',
    year: 1883,
    white: 'Johannes Zukertort',
    black: 'Joseph Henry Blackburne',
    description: 'Won the brilliancy prize at London 1883, considered one of the greatest games of the 19th century.',
    source: 'pgnmentor.com/players/Blackburne.zip',
    pgn: `[Event "London"]
[Site "London"]
[Date "1883.??.??"]
[Round "?"]
[White "Johannes Zukertort"]
[Black "Joseph Henry Blackburne"]
[Result "1-0"]
[ECO "A13"]

1. c4 e6 2. e3 Nf6 3. Nf3 b6 4. Be2 Bb7 5. O-O d5 6. d4 Bd6 7. Nc3 O-O 8. b3 Nbd7 9. Bb2 Qe7 10. Nb5 Ne4 11. Nxd6 cxd6 12. Nd2 Ndf6 13. f3 Nxd2 14. Qxd2 dxc4 15. Bxc4 d5 16. Bd3 Rfc8 17. Rae1 Rc7 18. e4 Rac8 19. e5 Ne8 20. f4 g6 21. Re3 f5 22. exf6 Nxf6 23. f5 Ne4 24. Bxe4 dxe4 25. fxg6 Rc2 26. gxh7+ Kh8 27. d5+ e5 28. Qb4 R8c5 29. Rf8+ Kxh7 30. Qxe4+ Kg7 31. Bxe5+ Kxf8 32. Bg7+ Kg8 33. Qxe7 1-0`
  },
  // =====================================================
  // GOLDEN AGE (1900-1950)
  // =====================================================
  // =====================================================
  // SOVIET ERA (1950-1980)
  // =====================================================
  // =====================================================
  // MODERN ERA (1980-2010)
  // =====================================================
  {
    id: 'gelfand-anand-2012',
    title: 'World Championship Drama',
    event: 'WCh 2012',
    year: 2012,
    white: 'Boris Gelfand',
    black: 'Viswanathan Anand',
    description: 'A key game from the closely contested 2012 World Championship match.',
    source: 'pgnmentor.com/players/Anand.zip',
    pgn: `[Event "WCh 2012"]
[Site "Moscow RUS"]
[Date "2012.05.20"]
[Round "7"]
[White "Boris Gelfand"]
[Black "Viswanathan Anand"]
[Result "1-0"]
[WhiteElo "2727"]
[BlackElo "2791"]
[ECO "D45"]

1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 a6 6. c5 Nbd7 7. Qc2 b6 8. cxb6 Nxb6 9. Bd2 c5 10. Rc1 cxd4 11. exd4 Bd6 12. Bg5 O-O 13. Bd3 h6 14. Bh4 Bb7 15. O-O Qb8 16. Bg3 Rc8 17. Qe2 Bxg3 18. hxg3 Qd6 19. Rc2 Nbd7 20. Rfc1 Rab8 21. Na4 Ne4 22. Rxc8+ Bxc8 23. Qc2 g5 24. Qc7 Qxc7 25. Rxc7 f6 26. Bxe4 dxe4 27. Nd2 f5 28. Nc4 Nf6 29. Nc5 Nd5 30. Ra7 Nb4 31. Ne5 Nc2 32. Nc6 Rxb2 33. Rc7 Rb1+ 34. Kh2 e3 35. Rxc8+ Kh7 36. Rc7+ Kh8 37. Ne5 e2 38. Nxe6 1-0`
  },
  // =====================================================
  // CONTEMPORARY ERA (2010-Present)
  // =====================================================
  // =====================================================
  // SPECIAL GAMES
  // =====================================================
  {
    id: 'amant-staunton-1843',
    title: 'Amant vs Staunton',
    event: '5th Match Game, Paris',
    year: 1843,
    white: 'Pierre de Saint Amant',
    black: 'Howard Staunton',
    description: 'Saint-Amant resigns in this unofficial world championship match game with Staunton, in which Staunton remarked, "The latter portion of this game is conducted with remarkable skill by both parties."',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Staunton.zip',
    pgn: `[Event "Paris m"]
[Site "Paris"]
[Date "1843.??.??"]
[Round "5"]
[White "Pierre de Saint Amant"]
[Black "Howard Staunton"]
[Result "0-1"]
[ECO "C00"]

1. e4 c5 2. f4 e6 3. Nf3 Nc6 4. c3 d5 5. e5 Qb6 6. Bd3 Bd7 7. Bc2 Rc8 8. O-O Nh6 9. h3 Be7 10. Kh2 f5 11. a3 a5 12. a4 Nf7 13. d4 h6 14. Re1 g6 15. Na3 cxd4 16. Nxd4 Nxd4 17. cxd4 g5 18. Nb5 Bxb5 19. axb5 Rc4 20. Bd3 Rc8 21. Be2 gxf4 22. Rf1 Ng5 23. Bxf4 Ne4 24. Rc1 Rxc1 25. Qxc1 Kd7 26. Qe3 Bg5 27. Bd3 Rg8 28. Bxe4 dxe4 29. Bxg5 hxg5 30. Qb3 g4 31. Rd1 gxh3 32. Qxh3 Qd8 33. d5 Kc8 34. Qc3+ Kb8 35. d6 f4 36. Qc5 e3 37. Qc2 Qh4+ 38. Kg1 Rc8 39. Qe2 Rh8 0-1`
  },
  {
    id: 'paulsen-morphy-1857',
    title: 'Paulsen vs Morphy',
    event: 'New York',
    year: 1857,
    white: 'Louis Paulsen',
    black: 'Paul Morphy',
    description: 'Morphy gains an advantage in development and transforms it into a powerful kingside attack with a queen sacrifice.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Paulsen.zip',
    pgn: `[Event "USA-01.Congress"]
[Site "New York"]
[Date "1857.??.??"]
[Round "6"]
[White "Louis Paulsen"]
[Black "Paul Morphy"]
[Result "0-1"]
[ECO "C48"]

1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bc5 5. O-O O-O 6. Nxe5 Re8 7. Nxc6 dxc6 8. Bc4 b5 9. Be2 Nxe4 10. Nxe4 Rxe4 11. Bf3 Re6 12. c3 Qd3 13. b4 Bb6 14. a4 bxa4 15. Qxa4 Bd7 16. Ra2 Rae8 17. Qa6 Qxf3 18. gxf3 Rg6+ 19. Kh1 Bh3 20. Rd1 Bg2+ 21. Kg1 Bxf3+ 22. Kf1 Bg2+ 23. Kg1 Bh3+ 24. Kh1 Bxf2 25. Qf1 Bxf1 26. Rxf1 Re2 27. Ra1 Rh6 28. d4 Be3 0-1`
  },
  {
    id: 'steinitz-mongredien-1862',
    title: 'Steinitz vs Mongredien',
    event: 'London',
    year: 1862,
    white: 'Wilhelm Steinitz',
    black: 'Augustus Mongredien',
    description: 'Steinitz won the tournament\'s brilliancy prize for this game.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Steinitz.zip',
    pgn: `[Event "London mt"]
[Site "London"]
[Date "1862.??.??"]
[Round "?"]
[White "Wilhelm Steinitz"]
[Black "Augustus Mongredien"]
[Result "1-0"]
[ECO "B01"]

1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd8 4. d4 e6 5. Nf3 Nf6 6. Bd3 Be7 7. O-O O-O 8. Be3 b6 9. Ne5 Bb7 10. f4 Nbd7 11. Qe2 Nd5 12. Nxd5 exd5 13. Rf3 f5 14. Rh3 g6 15. g4 fxg4 16. Rxh7 Nxe5 17. fxe5 Kxh7 18. Qxg4 Rg8 19. Qh5+ Kg7 20. Qh6+ Kf7 21. Qh7+ Ke6 22. Qh3+ Kf7 23. Rf1+ Ke8 24. Qe6 Rg7 25. Bg5 Qd7 26. Bxg6+ Rxg6 27. Qxg6+ Kd8 28. Rf8+ Qe8 29. Qxe8# 1-0`
  },
  {
    id: 'pillsbury-tarrasch-1895',
    title: 'Pillsbury vs Tarrasch',
    event: 'Hastings',
    year: 1895,
    white: 'Harry Nelson Pillsbury',
    black: 'Siegbert Tarrasch',
    description: 'Pillsbury\'s kingside attack breaks through by a single tempo against the strong Tarrasch\'s queenside play.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Pillsbury.zip',
    pgn: `[Event "Hastings"]
[Site "Hastings"]
[Date "1895.??.??"]
[Round "?"]
[White "Harry Nelson Pillsbury"]
[Black "Siegbert Tarrasch"]
[Result "1-0"]
[ECO "D55"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. Nf3 Nbd7 6. Rc1 O-O 7. e3 b6 8. cxd5 exd5 9. Bd3 Bb7 10. O-O c5 11. Re1 c4 12. Bb1 a6 13. Ne5 b5 14. f4 Re8 15. Qf3 Nf8 16. Ne2 Ne4 17. Bxe7 Rxe7 18. Bxe4 dxe4 19. Qg3 f6 20. Ng4 Kh8 21. f5 Qd7 22. Rf1 Rd8 23. Rf4 Qd6 24. Qh4 Rde8 25. Nc3 Bd5 26. Nf2 Qc6 27. Rf1 b4 28. Ne2 Qa4 29. Ng4 Nd7 30. R4f2 Kg8 31. Nc1 c3 32. b3 Qc6 33. h3 a5 34. Nh2 a4 35. g4 axb3 36. axb3 Ra8 37. g5 Ra3 38. Ng4 Bxb3 39. Rg2 Kh8 40. gxf6 gxf6 41. Nxb3 Rxb3 42. Nh6 Rg7 43. Rxg7 Kxg7 44. Qg3+ Kxh6 45. Kh1 Qd5 46. Rg1 Qxf5 47. Qh4+ Qh5 48. Qf4+ Qg5 49. Rxg5 fxg5 50. Qd6+ Kh5 51. Qxd7 c2 52. Qxh7# 1-0`
  },
  {
    id: 'pillsbury-gunsberg-1895',
    title: 'Pillsbury vs Gunsberg',
    event: 'Hastings',
    year: 1895,
    white: 'Harry Nelson Pillsbury',
    black: 'Isidor Gunsberg',
    description: 'In the final round of this prestigious tournament, Pillsbury secures overall victory by triumphing in an instructive endgame.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Pillsbury.zip',
    pgn: `[Event "Hastings"]
[Site "Hastings"]
[Date "1895.??.??"]
[Round "?"]
[White "Harry Nelson Pillsbury"]
[Black "Isidor Gunsberg"]
[Result "1-0"]
[ECO "D94"]

1. d4 d5 2. c4 c6 3. e3 g6 4. Nc3 Bg7 5. Nf3 Nf6 6. Bd3 O-O 7. Ne5 dxc4 8. Bxc4 Nd5 9. f4 Be6 10. Qb3 b5 11. Bxd5 Bxd5 12. Nxd5 Qxd5 13. Qxd5 cxd5 14. Nd3 Nd7 15. Bd2 Rfc8 16. Ke2 e6 17. Rhc1 Bf8 18. Rxc8 Rxc8 19. Rc1 Rxc1 20. Bxc1 Bd6 21. Bd2 Kf8 22. Bb4 Ke7 23. Bc5 a6 24. b4 f6 25. g4 Bxc5 26. bxc5 Nb8 27. f5 g5 28. Nb4 a5 29. c6 Kd6 30. fxe6 Nxc6 31. Nxc6 Kxc6 32. e4 dxe4 33. d5+ Kd6 34. Ke3 b4 35. Kxe4 a4 36. Kd4 h5 37. gxh5 a3 38. Kc4 f5 39. h6 f4 40. h7 1-0`
  },
  {
    id: 'lasker-napier-1904',
    title: 'Lasker vs Napier',
    event: 'Cambridge Springs',
    year: 1904,
    white: 'Emanuel Lasker',
    black: 'William Ewart Napier',
    description: 'Both players show great ingenuity. After a complicated web of tactics, Lasker simplifies into a winning endgame.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Lasker.zip',
    pgn: `[Event "Cambridge Springs"]
[Site "Cambridge"]
[Date "1904.??.??"]
[Round "3"]
[White "Emanuel Lasker"]
[Black "William Ewart Napier"]
[Result "1-0"]
[ECO "B72"]

1. e4 c5 2. Nc3 Nc6 3. Nf3 g6 4. d4 cxd4 5. Nxd4 Bg7 6. Be3 d6 7. h3 Nf6 8. g4 O-O 9. g5 Ne8 10. h4 Nc7 11. f4 e5 12. Nde2 d5 13. exd5 Nd4 14. Nxd4 Nxd5 15. Nf5 Nxc3 16. Qxd8 Rxd8 17. Ne7+ Kh8 18. h5 Re8 19. Bc5 gxh5 20. Bc4 exf4 21. Bxf7 Ne4 22. Bxe8 Bxb2 23. Rb1 Bc3+ 24. Kf1 Bg4 25. Bxh5 Bxh5 26. Rxh5 Ng3+ 27. Kg2 Nxh5 28. Rxb7 a5 29. Rb3 Bg7 30. Rh3 Ng3 31. Kf3 Ra6 32. Kxf4 Ne2+ 33. Kf5 Nc3 34. a3 Na4 35. Be3 1-0`
  },
  {
    id: 'rubinstein-lasker-1909',
    title: 'Rubinstein vs Lasker',
    event: 'Saint Petersburg',
    year: 1909,
    white: 'Akiba Rubinstein',
    black: 'Emanuel Lasker',
    description: 'Rubinstein\'s brilliant play culminates in 18.Qc1!!, subsequently forcing Lasker to enter a rook endgame down a pawn that Rubinstein wins in masterly fashion.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Rubinstein.zip',
    pgn: `[Event "St Petersburg"]
[Site "St Petersburg"]
[Date "1909.??.??"]
[Round "?"]
[White "Akiba Rubinstein"]
[Black "Emanuel Lasker"]
[Result "1-0"]
[ECO "D32"]

1. d4 d5 2. Nf3 Nf6 3. c4 e6 4. Bg5 c5 5. cxd5 exd5 6. Nc3 cxd4 7. Nxd4 Nc6 8. e3 Be7 9. Bb5 Bd7 10. Bxf6 Bxf6 11. Nxd5 Bxd4 12. exd4 Qg5 13. Bxc6 Bxc6 14. Ne3 O-O-O 15. O-O Rhe8 16. Rc1 Rxe3 17. Rxc6+ bxc6 18. Qc1 Rxd4 19. fxe3 Rd7 20. Qxc6+ Kd8 21. Rf4 f5 22. Qc5 Qe7 23. Qxe7+ Kxe7 24. Rxf5 Rd1+ 25. Kf2 Rd2+ 26. Kf3 Rxb2 27. Ra5 Rb7 28. Ra6 Kf8 29. e4 Rc7 30. h4 Kf7 31. g4 Kf8 32. Kf4 Ke7 33. h5 h6 34. Kf5 Kf7 35. e5 Rb7 36. Rd6 Ke7 37. Ra6 Kf7 38. Rd6 Kf8 39. Rc6 Kf7 40. a3 1-0`
  },
  {
    id: 'levitsky-marshall-1912',
    title: 'Levitsky vs Marshall',
    event: 'Breslau',
    year: 1912,
    white: 'Stepan Levitsky',
    black: 'Frank Marshall',
    description: 'Marshall\'s final move against Levitsky places his queen en prise in three different ways. The spectators are said to have showered the board with gold coins.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Marshall.zip',
    pgn: `[Event "DSB-18.Kongress"]
[Site "Breslau"]
[Date "1912.??.??"]
[Round "6"]
[White "Stepan Levitsky"]
[Black "Frank Marshall"]
[Result "0-1"]
[ECO "B40"]

1. e4 e6 2. d4 d5 3. Nc3 c5 4. Nf3 Nc6 5. exd5 exd5 6. Be2 Nf6 7. O-O Be7 8. Bg5 O-O 9. dxc5 Be6 10. Nd4 Bxc5 11. Nxe6 fxe6 12. Bg4 Qd6 13. Bh3 Rae8 14. Qd2 Bb4 15. Bxf6 Rxf6 16. Rad1 Qc5 17. Qe2 Bxc3 18. bxc3 Qxc3 19. Rxd5 Nd4 20. Qh5 Ref8 21. Re5 Rh6 22. Qg5 Rxh3 23. Rc5 Qg3 0-1`
  },
  {
    id: 'lasker-capablanca-1914',
    title: 'Lasker vs Capablanca',
    event: 'St Petersburg',
    year: 1914,
    white: 'Emanuel Lasker',
    black: 'José Raúl Capablanca',
    description: 'Lasker defeats Capablanca in a positional game where his winning strategy seemed to flow right from the opening to the end.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Lasker.zip',
    pgn: `[Event "St Petersburg f"]
[Site "St Petersburg"]
[Date "1914.??.??"]
[Round "?"]
[White "Emanuel Lasker"]
[Black "José Raúl Capablanca"]
[Result "1-0"]
[ECO "C68"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. d4 exd4 6. Qxd4 Qxd4 7. Nxd4 Bd6 8. Nc3 Ne7 9. O-O O-O 10. f4 Re8 11. Nb3 f6 12. f5 b6 13. Bf4 Bb7 14. Bxd6 cxd6 15. Nd4 Rad8 16. Ne6 Rd7 17. Rad1 Nc8 18. Rf2 b5 19. Rfd2 Rde7 20. b4 Kf7 21. a3 Ba8 22. Kf2 Ra7 23. g4 h6 24. Rd3 a5 25. h4 axb4 26. axb4 Rae7 27. Kf3 Rg8 28. Kf4 g6 29. Rg3 g5+ 30. Kf3 Nb6 31. hxg5 hxg5 32. Rh3 Rd7 33. Kg3 Ke8 34. Rdh1 Bb7 35. e5 dxe5 36. Ne4 Nd5 37. N6c5 Bc8 38. Nxd7 Bxd7 39. Rh7 Rf8 40. Ra1 Kd8 41. Ra8+ Bc8 42. Nc5 1-0`
  },
  {
    id: 'rubinstein-vidmar-1918',
    title: 'Rubinstein vs Vidmar',
    event: 'Berlin',
    year: 1918,
    white: 'Akiba Rubinstein',
    black: 'Milan Vidmar',
    description: 'Vidmar surprises Rubinstein by playing the Budapest Gambit, leading to a brilliant victory.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Rubinstein.zip',
    pgn: `[Event "Berlin"]
[Site "Berlin"]
[Date "1918.??.??"]
[Round "?"]
[White "Akiba Rubinstein"]
[Black "Milan Vidmar"]
[Result "0-1"]
[ECO "A52"]

1. d4 Nf6 2. c4 e5 3. dxe5 Ng4 4. Bf4 Nc6 5. Nf3 Bb4+ 6. Nc3 Qe7 7. Qd5 Bxc3+ 8. bxc3 Qa3 9. Rc1 f6 10. exf6 Nxf6 11. Qd2 d6 12. Nd4 O-O 13. e3 Nxd4 14. cxd4 Ne4 15. Qc2 Qa5+ 16. Ke2 Rxf4 17. exf4 Bf5 18. Qb2 Re8 19. Kf3 Nd2+ 20. Kg3 Ne4+ 21. Kh4 Re6 22. Be2 Rh6+ 23. Bh5 Rxh5+ 24. Kxh5 Bg6+ 0-1`
  },
  {
    id: 'capablanca-marshall-1918',
    title: 'Capablanca vs Marshall',
    event: 'New York',
    year: 1918,
    white: 'José Raúl Capablanca',
    black: 'Frank Marshall',
    description: 'In the main line of the Ruy Lopez, Marshall surprises Capablanca with a bold pawn sacrifice. Capablanca accepts the challenge, fully aware of the fierce attack he is about to face.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Capablanca.zip',
    pgn: `[Event "New York"]
[Site "New York"]
[Date "1918.??.??"]
[Round "?"]
[White "José Raúl Capablanca"]
[Black "Frank Marshall"]
[Result "1-0"]
[ECO "C89"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 Nf6 12. Re1 Bd6 13. h3 Ng4 14. Qf3 Qh4 15. d4 Nxf2 16. Re2 Bg4 17. hxg4 Bh2+ 18. Kf1 Bg3 19. Rxf2 Qh1+ 20. Ke2 Bxf2 21. Bd2 Bh4 22. Qh3 Rae8+ 23. Kd3 Qf1+ 24. Kc2 Bf2 25. Qf3 Qg1 26. Bd5 c5 27. dxc5 Bxc5 28. b4 Bd6 29. a4 a5 30. axb5 axb4 31. Ra6 bxc3 32. Nxc3 Bb4 33. b6 Bxc3 34. Bxc3 h6 35. b7 Re3 36. Bxf7+ 1-0`
  },
  {
    id: 'alekhine-bogoljubow-1922',
    title: 'Alekhine vs Bogoljubow',
    event: 'Pistyan',
    year: 1922,
    white: 'Alexander Alekhine',
    black: 'Efim Bogoljubow',
    description: 'This game between Alekhine and Bogoljubow is referred to in the famous novella The Royal Game by Stefan Zweig. In the story, the position after 38.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Alekhine.zip',
    pgn: `[Event "Bad Pistyan"]
[Site "Bad Pistyan"]
[Date "1922.??.??"]
[Round "15"]
[White "Alexander Alekhine"]
[Black "Efim Bogoljubow"]
[Result "1/2-1/2"]
[ECO "C84"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Nc3 b5 7. Bb3 d6 8. a4 b4 9. Nd5 Na5 10. Ba2 Nxd5 11. Bxd5 c6 12. Ba2 c5 13. c3 Rb8 14. Bd5 O-O 15. d4 exd4 16. cxd4 c4 17. Be3 Be6 18. Bxe6 fxe6 19. d5 e5 20. Rc1 Qd7 21. Ng5 Bxg5 22. Bxg5 Rbc8 23. Qe2 h6 24. Bh4 Rf7 25. Bg3 Qxa4 26. f4 exf4 27. Bxf4 Qb5 28. Bxh6 c3 29. Qg4 Qd7 30. Qxd7 Rxd7 31. bxc3 bxc3 32. Bd2 Rdc7 33. Bf4 Nb3 34. Bxd6 Rf7 35. Rxf7 Nxc1 36. Rf1 Nd3 37. Ba3 c2 38. d6 Kh7 39. h4 Rc4 40. e5 Nxe5 41. Bb2 Rc8 42. Rc1 Nd7 43. Kf2 Kg6 44. Ke3 Rc6 45. Bd4 Nf6 46. Kd3 Rxd6 47. Rxc2 1/2-1/2`
  },
  {
    id: 'bogoljubow-alekhine-1922',
    title: 'Bogoljubow vs Alekhine',
    event: 'Hastings',
    year: 1922,
    white: 'Efim Bogoljubow',
    black: 'Alexander Alekhine',
    description: 'Irving Chernev called this the greatest game of chess ever played, adding: "Alekhine\'s subtle strategy involves manoeuvres which encompass the entire chessboard as a battlefield. There are exciting plots and counterplots.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Bogoljubow.zip',
    pgn: `[Event "Hastings"]
[Site "Hastings"]
[Date "1922.??.??"]
[Round "?"]
[White "Efim Bogoljubow"]
[Black "Alexander Alekhine"]
[Result "0-1"]
[ECO "A90"]

1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Bb4+ 5. Bd2 Bxd2+ 6. Nxd2 Nc6 7. Ngf3 O-O 8. O-O d6 9. Qb3 Kh8 10. Qc3 e5 11. e3 a5 12. b3 Qe8 13. a3 Qh5 14. h4 Ng4 15. Ng5 Bd7 16. f3 Nf6 17. f4 e4 18. Rfd1 h6 19. Nh3 d5 20. Nf1 Ne7 21. a4 Nc6 22. Rd2 Nb4 23. Bh1 Qe8 24. Rg2 dxc4 25. bxc4 Bxa4 26. Nf2 Bd7 27. Nd2 b5 28. Nd1 Nd3 29. Rxa5 b4 30. Rxa8 bxc3 31. Rxe8 c2 32. Rxf8+ Kh7 33. Nf2 c1=Q+ 34. Nf1 Ne1 35. Rh2 Qxc4 36. Rb8 Bb5 37. Rxb5 Qxb5 38. g4 Nf3+ 39. Bxf3 exf3 40. gxf5 Qe2 41. d5 Kg8 42. h5 Kh7 43. e4 Nxe4 44. Nxe4 Qxe4 45. d6 cxd6 46. f6 gxf6 47. Rd2 Qe2 48. Rxe2 fxe2 49. Kf2 exf1=Q+ 50. Kxf1 Kg7 51. Kf2 Kf7 52. Ke3 Ke6 53. Ke4 d5+ 0-1`
  },
  {
    id: 'reti-capablanca-1924',
    title: 'Réti vs Capablanca',
    event: 'New York',
    year: 1924,
    white: 'Richard Réti',
    black: 'José Raúl Capablanca',
    description: 'The game that ended Capablanca\'s eight-year run without a single loss in tournament play.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Reti.zip',
    pgn: `[Event "New York"]
[Site "New York"]
[Date "1924.??.??"]
[Round "?"]
[White "Richard Réti"]
[Black "José Raúl Capablanca"]
[Result "1-0"]
[ECO "A15"]

1. Nf3 Nf6 2. c4 g6 3. b4 Bg7 4. Bb2 O-O 5. g3 b6 6. Bg2 Bb7 7. O-O d6 8. d3 Nbd7 9. Nbd2 e5 10. Qc2 Re8 11. Rfd1 a5 12. a3 h6 13. Nf1 c5 14. b5 Nf8 15. e3 Qc7 16. d4 Be4 17. Qc3 exd4 18. exd4 N6d7 19. Qd2 cxd4 20. Bxd4 Qxc4 21. Bxg7 Kxg7 22. Qb2+ Kg8 23. Rxd6 Qc5 24. Rad1 Ra7 25. Ne3 Qh5 26. Nd4 Bxg2 27. Kxg2 Qe5 28. Nc4 Qc5 29. Nc6 Rc7 30. Ne3 Ne5 31. R1d5 1-0`
  },
  {
    id: 'capablanca-tartakower-1924',
    title: 'Capablanca vs Tartakower',
    event: 'New York',
    year: 1924,
    white: 'José Raúl Capablanca',
    black: 'Savielly Tartakower',
    description: 'One of the most famous and instructive endgames ever played, Capablanca sacrifices two pawns with check to support his passed pawn.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Capablanca.zip',
    pgn: `[Event "New York"]
[Site "New York"]
[Date "1924.??.??"]
[Round "?"]
[White "José Raúl Capablanca"]
[Black "Savielly Tartakower"]
[Result "1-0"]
[ECO "A85"]

1. d4 e6 2. Nf3 f5 3. c4 Nf6 4. Bg5 Be7 5. Nc3 O-O 6. e3 b6 7. Bd3 Bb7 8. O-O Qe8 9. Qe2 Ne4 10. Bxe7 Nxc3 11. bxc3 Qxe7 12. a4 Bxf3 13. Qxf3 Nc6 14. Rfb1 Rae8 15. Qh3 Rf6 16. f4 Na5 17. Qf3 d6 18. Re1 Qd7 19. e4 fxe4 20. Qxe4 g6 21. g3 Kf8 22. Kg2 Rf7 23. h4 d5 24. cxd5 exd5 25. Qxe8+ Qxe8 26. Rxe8+ Kxe8 27. h5 Rf6 28. hxg6 hxg6 29. Rh1 Kf8 30. Rh7 Rc6 31. g4 Nc4 32. g5 Ne3+ 33. Kf3 Nf5 34. Bxf5 gxf5 35. Kg3 Rxc3+ 36. Kh4 Rf3 37. g6 Rxf4+ 38. Kg5 Re4 39. Kf6 Kg8 40. Rg7+ Kh8 41. Rxc7 Re8 42. Kxf5 Re4 43. Kf6 Rf4+ 44. Ke5 Rg4 45. g7+ Kg8 46. Rxa7 Rg1 47. Kxd5 Rc1 48. Kd6 Rc2 49. d5 Rc1 50. Rc7 Ra1 51. Kc6 Rxa4 52. d6 1-0`
  },
  {
    id: 'reti-alekhine-1925',
    title: 'Réti vs Alekhine',
    event: 'Baden-Baden',
    year: 1925,
    white: 'Richard Réti',
    black: 'Alexander Alekhine',
    description: 'Alekhine initiates a stunning combination and foresees the final position resulting more than 15 moves later.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Reti.zip',
    pgn: `[Event "Baden-Baden"]
[Site "Baden-Baden"]
[Date "1925.??.??"]
[Round "?"]
[White "Richard Réti"]
[Black "Alexander Alekhine"]
[Result "0-1"]
[ECO "A00"]

1. g3 e5 2. Nf3 e4 3. Nd4 d5 4. d3 exd3 5. Qxd3 Nf6 6. Bg2 Bb4+ 7. Bd2 Bxd2+ 8. Nxd2 O-O 9. c4 Na6 10. cxd5 Nb4 11. Qc4 Nbxd5 12. N2b3 c6 13. O-O Re8 14. Rfd1 Bg4 15. Rd2 Qc8 16. Nc5 Bh3 17. Bf3 Bg4 18. Bg2 Bh3 19. Bf3 Bg4 20. Bh1 h5 21. b4 a6 22. Rc1 h4 23. a4 hxg3 24. hxg3 Qc7 25. b5 axb5 26. axb5 Re3 27. Nf3 cxb5 28. Qxb5 Nc3 29. Qxb7 Qxb7 30. Nxb7 Nxe2+ 31. Kh2 Ne4 32. Rc4 Nxf2 33. Bg2 Be6 34. Rcc2 Ng4+ 35. Kh3 Ne5+ 36. Kh2 Rxf3 37. Rxe2 Ng4+ 38. Kh3 Ne3+ 39. Kh2 Nxc2 40. Bxf3 Nd4 41. Rf2 Nxf3+ 42. Rxf3 Bd5 0-1`
  },
  {
    id: 'euwe-alekhine-1935',
    title: 'Euwe vs Alekhine',
    event: '26th Match Game, Zandvoort',
    year: 1935,
    white: 'Max Euwe',
    black: 'Alexander Alekhine',
    description: 'This decisive game from the 1935 match for the world championship was dubbed \'The Pearl of Zandvoort\' by Tartakower.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Euwe.zip',
    pgn: `[Event "World Championship 16th"]
[Site "NLD"]
[Date "1935.??.??"]
[Round "26"]
[White "Max Euwe"]
[Black "Alexander Alekhine"]
[Result "1-0"]
[ECO "E18"]

1. d4 e6 2. c4 f5 3. g3 Bb4+ 4. Bd2 Be7 5. Bg2 Nf6 6. Nc3 O-O 7. Nf3 Ne4 8. O-O b6 9. Qc2 Bb7 10. Ne5 Nxc3 11. Bxc3 Bxg2 12. Kxg2 Qc8 13. d5 d6 14. Nd3 e5 15. Kh1 c6 16. Qb3 Kh8 17. f4 e4 18. Nb4 c5 19. Nc2 Nd7 20. Ne3 Bf6 21. Nxf5 Bxc3 22. Nxd6 Qb8 23. Nxe4 Bf6 24. Nd2 g5 25. e4 gxf4 26. gxf4 Bd4 27. e5 Qe8 28. e6 Rg8 29. Nf3 Qg6 30. Rg1 Bxg1 31. Rxg1 Qf6 32. Ng5 Rg7 33. exd7 Rxd7 34. Qe3 Re7 35. Ne6 Rf8 36. Qe5 Qxe5 37. fxe5 Rf5 38. Re1 h6 39. Nd8 Rf2 40. e6 Rd2 41. Nc6 Re8 42. e7 b5 43. Nd8 Kg7 44. Nb7 Kf6 45. Re6+ Kg5 46. Nd6 Rxe7 47. Ne4+ 1-0`
  },
  {
    id: 'geller-euwe-1953',
    title: 'Geller vs Euwe',
    event: 'Zurich',
    year: 1953,
    white: 'Efim Geller',
    black: 'Max Euwe',
    description: 'Geller\'s attack seems to be sweeping Euwe off the board, but the former World Champion has everything under control, uncorking an amazing sacrifice on move 22 to begin a counterattack that wins the game in only four more moves.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Geller.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Zuerich"]
[Date "1953.??.??"]
[Round "2"]
[White "Efim Geller"]
[Black "Max Euwe"]
[Result "0-1"]
[ECO "E28"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. a3 Bxc3+ 6. bxc3 b6 7. Bd3 Bb7 8. f3 Nc6 9. Ne2 O-O 10. O-O Na5 11. e4 Ne8 12. Ng3 cxd4 13. cxd4 Rc8 14. f4 Nxc4 15. f5 f6 16. Rf4 b5 17. Rh4 Qb6 18. e5 Nxe5 19. fxe6 Nxd3 20. Qxd3 Qxe6 21. Qxh7+ Kf7 22. Bh6 Rh8 23. Qxh8 Rc2 24. Rc1 Rxg2+ 25. Kf1 Qb3 26. Ke1 Qf3 0-1`
  },
  {
    id: 'botvinnik-smyslov-1954',
    title: 'Botvinnik vs Smyslov',
    event: '14th Match Game, Moscow',
    year: 1954,
    white: 'Mikhail Botvinnik',
    black: 'Vasily Smyslov',
    description: 'Smyslov sacrifices his queen for three minor pieces and coordinates them superbly to force Botvinnik\'s capitulation.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Botvinnik.zip',
    pgn: `[Event "World Championship 20th"]
[Site "Moscow"]
[Date "1954.??.??"]
[Round "14"]
[White "Mikhail Botvinnik"]
[Black "Vasily Smyslov"]
[Result "0-1"]
[ECO "E68"]

1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 O-O 5. Nc3 d6 6. Nf3 Nbd7 7. O-O e5 8. e4 c6 9. Be3 Ng4 10. Bg5 Qb6 11. h3 exd4 12. Na4 Qa6 13. hxg4 b5 14. Nxd4 bxa4 15. Nxc6 Qxc6 16. e5 Qxc4 17. Bxa8 Nxe5 18. Rc1 Qb4 19. a3 Qxb2 20. Qxa4 Bb7 21. Rb1 Nf3+ 22. Kh1 Bxa8 23. Rxb2 Nxg5+ 24. Kh2 Nf3+ 25. Kh3 Bxb2 26. Qxa7 Be4 27. a4 Kg7 28. Rd1 Be5 29. Qe7 Rc8 30. a5 Rc2 31. Kg2 Nd4+ 32. Kf1 Bf3 33. Rb1 Nc6 0-1`
  },
  {
    id: 'sliwa-bronstein-1957',
    title: 'Immortal Losing Game',
    event: 'Gotha',
    year: 1957,
    white: 'Bogdan Śliwa',
    black: 'David Bronstein',
    description: 'Known as the "Immortal Losing Game". Bronstein has a lost game, but sets some elegant traps in attempting to snatch victory from the jaws of defeat.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Bronstein.zip',
    pgn: `[Event "Gotha"]
[Site "Gotha"]
[Date "1957.??.??"]
[Round "?"]
[White "Bogdan Śliwa"]
[Black "David Bronstein"]
[Result "1-0"]
[ECO "A81"]

1. d4 f5 2. g3 Nf6 3. Bg2 g6 4. Bg5 Bg7 5. Nc3 Nc6 6. Qd2 d6 7. h4 e6 8. O-O-O h6 9. Bf4 Bd7 10. e4 fxe4 11. Nxe4 Nd5 12. Ne2 Qe7 13. c4 Nb6 14. c5 dxc5 15. Bxc7 O-O 16. Bd6 Qf7 17. Bxf8 Rxf8 18. dxc5 Nd5 19. f4 Rd8 20. N2c3 Ndb4 21. Nd6 Qf8 22. Nxb7 Nd4 23. Nxd8 Bb5 24. Nxe6 Bd3 25. Bd5 Qf5 26. Nxd4+ Qxd5 27. Nc2 Bxc3 28. bxc3 Qxa2 29. cxb4 1-0`
  },
  {
    id: 'fischer-petrosian-1959',
    title: 'Fischer vs Petrosian',
    event: 'Zagreb',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Tigran Petrosian',
    description: 'The only prominent game in which four queens were on board for as many as seven moves. The game ended with a draw by agreement.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Fischer.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "16"]
[White "Bobby Fischer"]
[Black "Tigran Petrosian"]
[Result "1/2-1/2"]
[ECO "B11"]

1. e4 c6 2. Nc3 d5 3. Nf3 Bg4 4. h3 Bxf3 5. Qxf3 Nf6 6. d3 e6 7. g3 Bb4 8. Bd2 d4 9. Nb1 Bxd2+ 10. Nxd2 e5 11. Bg2 c5 12. O-O Nc6 13. Qe2 Qe7 14. f4 O-O-O 15. a3 Ne8 16. b4 cxb4 17. Nc4 f6 18. fxe5 fxe5 19. axb4 Nc7 20. Na5 Nb5 21. Nxc6 bxc6 22. Rf2 g6 23. h4 Kb7 24. h5 Qxb4 25. Rf7+ Kb6 26. Qf2 a5 27. c4 Nc3 28. Rf1 a4 29. Qf6 Qc5 30. Rxh7 Rdf8 31. Qxg6 Rxf1+ 32. Bxf1 Rxh7 33. Qxh7 a3 34. h6 a2 35. Qg8 a1=Q 36. h7 Qd6 37. h8=Q Qa7 38. g4 Kc5 39. Qf8 Qae7 40. Qa8 Kb4 41. Qh2 Kb3 42. Qa1 Qa3 43. Qxa3+ Kxa3 44. Qh6 Qf7 45. Kg2 Kb3 46. Qd2 Qh7 47. Kg3 Qxe4 48. Qf2 Qh1 1/2-1/2`
  },
  {
    id: 'tal-botvinnik-1960',
    title: 'Tal vs Botvinnik',
    event: '1st Match Game, Moscow',
    year: 1960,
    white: 'Mikhail Tal',
    black: 'Mikhail Botvinnik',
    description: 'Tal\'s critics said his daring, complicated style would fail against the ironclad logic of Botvinnik, known as the father of Soviet chess, but it succeeded and Tal became the youngest World Champion ever.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Tal.zip',
    pgn: `[Event "World Championship 23th"]
[Site "Moscow"]
[Date "1960.??.??"]
[Round "1"]
[White "Mikhail Tal"]
[Black "Mikhail Botvinnik"]
[Result "1-0"]
[ECO "C18"]

1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Qc7 7. Qg4 f5 8. Qg3 Ne7 9. Qxg7 Rg8 10. Qxh7 cxd4 11. Kd1 Bd7 12. Qh5+ Ng6 13. Ne2 d3 14. cxd3 Ba4+ 15. Ke1 Qxe5 16. Bg5 Nc6 17. d4 Qc7 18. h4 e5 19. Rh3 Qf7 20. dxe5 Ncxe5 21. Re3 Kd7 22. Rb1 b6 23. Nf4 Rae8 24. Rb4 Bc6 25. Qd1 Nxf4 26. Rxf4 Ng6 27. Rd4 Rxe3+ 28. fxe3 Kc7 29. c4 dxc4 30. Bxc4 Qg7 31. Bxg8 Qxg8 32. h5 1-0`
  },
  {
    id: 'byrne-fischer-1963',
    title: 'Byrne vs Fischer',
    event: 'New York',
    year: 1963,
    white: 'Robert Byrne',
    black: 'Bobby Fischer',
    description: 'Future world champion Fischer executes a deep sacrificial attack to win in this miniature. Many of the players in the press room thought Fischer\'s position was hopeless and were surprised when they heard Byrne had resigned.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Byrne.zip',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1963.??.??"]
[Round "3"]
[White "Robert Byrne"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "D71"]

1. d4 Nf6 2. c4 g6 3. g3 c6 4. Bg2 d5 5. cxd5 cxd5 6. Nc3 Bg7 7. e3 O-O 8. Nge2 Nc6 9. O-O b6 10. b3 Ba6 11. Ba3 Re8 12. Qd2 e5 13. dxe5 Nxe5 14. Rfd1 Nd3 15. Qc2 Nxf2 16. Kxf2 Ng4+ 17. Kg1 Nxe3 18. Qd2 Nxg2 19. Kxg2 d4 20. Nxd4 Bb7+ 21. Kf1 Qd7 0-1`
  },
  {
    id: 'portisch-tal-1964',
    title: 'Portisch vs Tal',
    event: 'Amsterdam Interzonal',
    year: 1964,
    white: 'Lajos Portisch',
    black: 'Mikhail Tal',
    description: 'One of Tal\'s most famous games, in which he over-presses and finds himself a rook down in a lost position, but keeps setting problems until Portisch makes a mistake and allows the Magician from Riga to escape with a draw.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Portisch.zip',
    pgn: `[Event "Amsterdam Interzonal"]
[Site "Amsterdam"]
[Date "1964.??.??"]
[Round "2"]
[White "Lajos Portisch"]
[Black "Mikhail Tal"]
[Result "1/2-1/2"]
[ECO "E62"]

1. Nf3 Nf6 2. g3 d6 3. d4 g6 4. Bg2 Bg7 5. O-O O-O 6. c4 Bg4 7. Nc3 Qc8 8. Re1 Re8 9. Qb3 Nc6 10. d5 Na5 11. Qa4 b6 12. Nd2 Bd7 13. Qc2 c6 14. b4 Nxc4 15. Nxc4 cxd5 16. Na3 d4 17. Bxa8 Qxa8 18. Ncb5 Rc8 19. Qd1 Ne4 20. f3 a6 21. Nxd4 Qd5 22. Be3 Rc3 23. Ndc2 Qf5 24. g4 Qe6 25. Bd4 h5 26. Bxg7 hxg4 27. Nd4 Qd5 28. fxe4 Qxe4 29. Nf3 Qe3+ 30. Kh1 Bc6 31. Rf1 Rxa3 32. Qc1 gxf3 33. Qxc6 Qxe2 34. Rg1 Kxg7 35. Rae1 Qd2 36. Rd1 Qe2 37. Rde1 Qd2 1/2-1/2`
  },
  {
    id: 'geller-smyslov-1965',
    title: 'Geller vs Smyslov',
    event: '5th Match Game, Moscow',
    year: 1965,
    white: 'Efim Geller',
    black: 'Vasily Smyslov',
    description: 'Though he never managed to play for the World Championship, Efim Geller had a lifetime plus score in over 200 games against world champions, here crushing Smyslov with a queen sacrifice that the former champion couldn\'t accept.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Geller.zip',
    pgn: `[Event "Candidats qf4"]
[Site "Moscow"]
[Date "1965.??.??"]
[Round "5"]
[White "Efim Geller"]
[Black "Vasily Smyslov"]
[Result "1-0"]
[ECO "D87"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 O-O 9. O-O Nc6 10. Be3 Qc7 11. Rc1 Rd8 12. f4 e6 13. Kh1 b6 14. f5 Na5 15. Bd3 exf5 16. exf5 Bb7 17. Qd2 Re8 18. Ng3 Qc6 19. Rf2 Rad8 20. Bh6 Bh8 21. Qf4 Rd7 22. Ne4 c4 23. Bc2 Rde7 24. Rcf1 Rxe4 25. fxg6 f6 26. Qg5 Qd7 27. Kg1 Bg7 28. Rxf6 Rg4 29. gxh7+ Kh8 30. Bxg7+ Qxg7 31. Qxg4 1-0`
  },
  {
    id: 'petrosian-spassky-1966',
    title: 'Petrosian vs Spassky',
    event: '10th Match Game, Moscow',
    year: 1966,
    white: 'Tigran Petrosian',
    black: 'Boris Spassky',
    description: 'Petrosian, the master of the exchange sacrifice, performs two in one game with the World Championship on the line.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Petrosian.zip',
    pgn: `[Event "World Championship 26th"]
[Site "Moscow"]
[Date "1966.??.??"]
[Round "10"]
[White "Tigran Petrosian"]
[Black "Boris Spassky"]
[Result "1-0"]
[ECO "E66"]

1. Nf3 Nf6 2. g3 g6 3. c4 Bg7 4. Bg2 O-O 5. O-O Nc6 6. Nc3 d6 7. d4 a6 8. d5 Na5 9. Nd2 c5 10. Qc2 e5 11. b3 Ng4 12. e4 f5 13. exf5 gxf5 14. Nd1 b5 15. f3 e4 16. Bb2 exf3 17. Bxf3 Bxb2 18. Qxb2 Ne5 19. Be2 f4 20. gxf4 Bh3 21. Ne3 Bxf1 22. Rxf1 Ng6 23. Bg4 Nxf4 24. Rxf4 Rxf4 25. Be6+ Rf7 26. Ne4 Qh4 27. Nxd6 Qg5+ 28. Kh1 Ra7 29. Bxf7+ Rxf7 30. Qh8+ 1-0`
  },
  {
    id: 'fischer-stein-1967',
    title: 'Fischer vs Stein',
    event: 'Sousse Interzonal',
    year: 1967,
    white: 'Bobby Fischer',
    black: 'Leonid Stein',
    description: 'Fischer is in top form, leading the tournament and winning this slugfest with a three-time Soviet champion, but then abruptly withdraws over a scheduling dispute, putting his World Championship aspirations on hold for three years.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Fischer.zip',
    pgn: `[Event "Sousse Interzonal+"]
[Site "Sousse"]
[Date "1967.??.??"]
[Round "7"]
[White "Bobby Fischer"]
[Black "Leonid Stein"]
[Result "1-0"]
[ECO "C92"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Bb7 10. d4 Na5 11. Bc2 Nc4 12. b3 Nb6 13. Nbd2 Nbd7 14. b4 exd4 15. cxd4 a5 16. bxa5 c5 17. e5 dxe5 18. dxe5 Nd5 19. Ne4 Nb4 20. Bb1 Rxa5 21. Qe2 Nb6 22. Nfg5 Bxe4 23. Qxe4 g6 24. Qh4 h5 25. Qg3 Nc4 26. Nf3 Kg7 27. Qf4 Rh8 28. e6 f5 29. Bxf5 Qf8 30. Be4 Qxf4 31. Bxf4 Re8 32. Rad1 Ra6 33. Rd7 Rxe6 34. Ng5 Rf6 35. Bf3 Rxf4 36. Ne6+ Kf6 37. Nxf4 Ne5 38. Rb7 Bd6 39. Kf1 Nc2 40. Re4 Nd4 41. Rb6 Rd8 42. Nd5+ Kf5 43. Ne3+ Ke6 44. Be2 Kd7 45. Bxb5+ Nxb5 46. Rxb5 Kc6 47. a4 Bc7 48. Ke2 g5 49. g3 Ra8 50. Rb2 Rf8 51. f4 gxf4 52. gxf4 Nf7 53. Re6+ Nd6 54. f5 Ra8 55. Rd2 Rxa4 56. f6 1-0`
  },
  {
    id: 'spassky-petrosian-1969',
    title: 'Spassky vs Petrosian',
    event: '19th Match Game, Moscow',
    year: 1969,
    white: 'Boris Spassky',
    black: 'Tigran Petrosian',
    description: 'Having fought his way to a World Championship rematch with Petrosian, Spassky wins the match decisively.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Spassky.zip',
    pgn: `[Event "World Championship 27th"]
[Site "Moscow"]
[Date "1969.??.??"]
[Round "19"]
[White "Boris Spassky"]
[Black "Tigran Petrosian"]
[Result "1-0"]
[ECO "B94"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 Nbd7 7. Bc4 Qa5 8. Qd2 h6 9. Bxf6 Nxf6 10. O-O-O e6 11. Rhe1 Be7 12. f4 O-O 13. Bb3 Re8 14. Kb1 Bf8 15. g4 Nxg4 16. Qg2 Nf6 17. Rg1 Bd7 18. f5 Kh8 19. Rdf1 Qd8 20. fxe6 fxe6 21. e5 dxe5 22. Ne4 Nh5 23. Qg6 exd4 24. Ng5 1-0`
  },
  {
    id: 'bronstein-ljubojevic-1973',
    title: 'Bronstein vs Ljubojević',
    event: 'Petropolis Interzonal',
    year: 1973,
    white: 'David Bronstein',
    black: 'Ljubomir Ljubojević',
    description: 'Bronstein, who had played a match for the world championship before his grandmaster opponent could walk, turns back the clock, sacrifices both rooks, and wins.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Bronstein.zip',
    pgn: `[Event "Petropolis Interzonal"]
[Site "Petropolis"]
[Date "1973.??.??"]
[Round "11"]
[White "David Bronstein"]
[Black "Ljubomir Ljubojević"]
[Result "1-0"]
[WhiteElo "2585"]
[BlackElo "2570"]
[ECO "B03"]

1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. f4 dxe5 6. fxe5 c5 7. d5 e6 8. Nc3 exd5 9. cxd5 c4 10. Nf3 Bg4 11. Qd4 Bxf3 12. gxf3 Bb4 13. Bxc4 O-O 14. Rg1 g6 15. Bg5 Qc7 16. Bb3 Bc5 17. Qf4 Bxg1 18. d6 Qc8 19. Ke2 Bc5 20. Ne4 N8d7 21. Rc1 Qc6 22. Rxc5 Nxc5 23. Nf6+ Kh8 24. Qh4 Qb5+ 25. Ke3 h5 26. Nxh5 Qxb3+ 27. axb3 Nd5+ 28. Kd4 Ne6+ 29. Kxd5 Nxg5 30. Nf6+ Kg7 31. Qxg5 Rfd8 32. e6 fxe6+ 33. Kxe6 Rf8 34. d7 a5 35. Ng4 Ra6+ 36. Ke5 Rf5+ 37. Qxf5 gxf5 38. d8=Q fxg4 39. Qd7+ Kh6 40. Qxb7 Rg6 41. f4 1-0`
  },
  {
    id: 'karpov-spassky-1974',
    title: 'Karpov vs Spassky',
    event: '9th Match Game, Leningrad',
    year: 1974,
    white: 'Anatoly Karpov',
    black: 'Boris Spassky',
    description: 'Former World Champion Spassky can\'t cope with future world champion Karpov\'s subtle, seemingly effortless positional mastery.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Karpov.zip',
    pgn: `[Event "Candidats sf1"]
[Site "Leningrad"]
[Date "1974.??.??"]
[Round "9"]
[White "Anatoly Karpov"]
[Black "Boris Spassky"]
[Result "1-0"]
[WhiteElo "2700"]
[BlackElo "2650"]
[ECO "B83"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Be2 Be7 7. O-O O-O 8. f4 Nc6 9. Be3 Bd7 10. Nb3 a5 11. a4 Nb4 12. Bf3 Bc6 13. Nd4 g6 14. Rf2 e5 15. Nxc6 bxc6 16. fxe5 dxe5 17. Qf1 Qc8 18. h3 Nd7 19. Bg4 h5 20. Bxd7 Qxd7 21. Qc4 Bh4 22. Rd2 Qe7 23. Rf1 Rfd8 24. Nb1 Qb7 25. Kh2 Kg7 26. c3 Na6 27. Re2 Rf8 28. Nd2 Bd8 29. Nf3 f6 30. Rd2 Be7 31. Qe6 Rad8 32. Rxd8 Bxd8 33. Rd1 Nb8 34. Bc5 Rh8 35. Rxd8 1-0`
  },
  {
    id: 'tatai-karpov-1977',
    title: 'Tatai vs Karpov',
    event: 'Las Palmas',
    year: 1977,
    white: 'Stefano Tatai',
    black: 'Anatoly Karpov',
    description: 'World Champion Karpov dominated tournament chess in the 1970s with his signature style of elegant positional play crowned by crisp tactics, like in this game where he places his queen en prise to a pawn.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Karpov.zip',
    pgn: `[Event "Las Palmas"]
[Site "Las Palmas"]
[Date "1977.??.??"]
[Round "13"]
[White "Stefano Tatai"]
[Black "Anatoly Karpov"]
[Result "0-1"]
[WhiteElo "2480"]
[BlackElo "2690"]
[ECO "A34"]

1. Nf3 c5 2. c4 Nf6 3. Nc3 d5 4. cxd5 Nxd5 5. g3 g6 6. Bg2 Bg7 7. Qa4+ Nc6 8. Ng5 e6 9. Nge4 Nb6 10. Qb5 c4 11. Na4 O-O 12. Nxb6 axb6 13. Qxc4 e5 14. Qc2 Nd4 15. Qb1 f5 16. Nc3 e4 17. d3 b5 18. Be3 b4 19. Nd1 Re8 20. dxe4 fxe4 21. Bxd4 Qxd4 22. a3 Bg4 23. Qc2 Qd3 24. exd3 exd3+ 25. Kd2 Re2+ 26. Kxd3 Rd8+ 27. Kc4 Rxc2+ 28. Kxb4 Rcd2 29. f3 Bf8+ 30. Ka5 Bd7 0-1`
  },
  {
    id: 'karpov-miles-1980',
    title: 'Karpov vs Miles',
    event: 'European Team Championship, Skara',
    year: 1980,
    white: 'Anatoly Karpov',
    black: 'Tony Miles',
    description: 'England\'s iconoclastic first grandmaster Miles uses a provocative opening to score his most famous win against the world champion.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Karpov.zip',
    pgn: `[Event "EU-chT"]
[Site "Skara"]
[Date "1980.??.??"]
[Round "1"]
[White "Anatoly Karpov"]
[Black "Tony Miles"]
[Result "0-1"]
[WhiteElo "2725"]
[BlackElo "2545"]
[ECO "B00"]

1. e4 a6 2. d4 b5 3. Nf3 Bb7 4. Bd3 Nf6 5. Qe2 e6 6. a4 c5 7. dxc5 Bxc5 8. Nbd2 b4 9. e5 Nd5 10. Ne4 Be7 11. O-O Nc6 12. Bd2 Qc7 13. c4 bxc3 14. Nxc3 Nxc3 15. Bxc3 Nb4 16. Bxb4 Bxb4 17. Rac1 Qb6 18. Be4 O-O 19. Ng5 h6 20. Bh7+ Kh8 21. Bb1 Be7 22. Ne4 Rac8 23. Qd3 Rxc1 24. Rxc1 Qxb2 25. Re1 Qxe5 26. Qxd7 Bb4 27. Re3 Qd5 28. Qxd5 Bxd5 29. Nc3 Rc8 30. Ne2 g5 31. h4 Kg7 32. hxg5 hxg5 33. Bd3 a5 34. Rg3 Kf6 35. Rg4 Bd6 36. Kf1 Be5 37. Ke1 Rh8 38. f4 gxf4 39. Nxf4 Bc6 40. Ne2 Rh1+ 41. Kd2 Rh2 42. g3 Bf3 43. Rg8 Rg2 44. Ke1 Bxe2 45. Bxe2 Rxg3 46. Ra8 Bc7 0-1`
  },
  {
    id: 'kasparov-gavrikov-1981',
    title: 'Kasparov vs Gavrikov',
    event: 'USSR Championship, Frunze',
    year: 1981,
    white: 'Garry Kasparov',
    black: 'Viktor Gavrikov',
    description: 'One of future world champion Kasparov\'s dynamic, attacking wins from his first Soviet Championship victory at age 18 that heralded the arrival of a new contender for the World Chess Championship.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Kasparov.zip',
    pgn: `[Event "URS-ch49"]
[Site "Frunze"]
[Date "1981.??.??"]
[Round "?"]
[White "Garry Kasparov"]
[Black "Viktor Gavrikov"]
[Result "1-0"]
[WhiteElo "2630"]
[BlackElo "2365"]
[ECO "D34"]

1. d4 d5 2. c4 e6 3. Nf3 c5 4. cxd5 exd5 5. g3 Nc6 6. Bg2 Nf6 7. O-O Be7 8. dxc5 Bxc5 9. Bg5 O-O 10. Nc3 d4 11. Bxf6 Qxf6 12. Nd5 Qd8 13. Nd2 a6 14. Rc1 Ba7 15. Nc4 Rb8 16. Nf4 b5 17. Nd6 Qxd6 18. Rxc6 Qd8 19. Qc2 a5 20. Rc1 Re8 21. Bd5 Bb6 22. Qb3 Re7 23. Bf3 Re5 24. Bh5 g6 25. Bxg6 hxg6 26. Rxg6+ Kf8 27. Rh6 Ke7 28. Rcc6 Rf5 29. Qf3 Bc7 30. Qe4+ Re5 31. Ng6+ fxg6 32. Rh7+ Kf8 33. Qxg6 1-0`
  },
  {
    id: 'kavalek-kasparov-1982',
    title: 'Kavalek vs Kasparov',
    event: 'Bugojno',
    year: 1982,
    white: 'Lubomir Kavalek',
    black: 'Garry Kasparov',
    description: 'By 1982, Kasparov was already ranked #2 in the world and was dominating the world\'s best players. He would win 15 consecutive tournaments between 1981 and 1990.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Kasparov.zip',
    pgn: `[Event "Bugojno"]
[Site "Bugojno"]
[Date "1982.??.??"]
[Round "?"]
[White "Lubomir Kavalek"]
[Black "Garry Kasparov"]
[Result "0-1"]
[WhiteElo "2595"]
[BlackElo "2630"]
[ECO "E90"]

1. c4 g6 2. Nc3 Bg7 3. d4 Nf6 4. e4 d6 5. Nf3 O-O 6. h3 e5 7. d5 Na6 8. Be3 Nh5 9. Nh2 Qe8 10. Be2 Nf4 11. Bf3 f5 12. h4 Qe7 13. g3 Nb4 14. Qb3 Nfd3+ 15. Ke2 f4 16. Bd2 fxg3 17. fxg3 Rxf3 18. Nxf3 Bg4 19. Raf1 Rf8 20. Nd1 Qf7 21. Be3 Bxf3+ 22. Kd2 Qd7 23. Rhg1 Qh3 24. a3 Bxe4 25. Rxf8+ Bxf8 26. axb4 Qh2+ 27. Kc3 Nc1 0-1`
  },
  {
    id: 'karpov-geller-1983',
    title: 'Karpov vs Geller',
    event: 'USSR Championship, Moscow',
    year: 1983,
    white: 'Anatoly Karpov',
    black: 'Efim Geller',
    description: 'Although Garry Kasparov\'s star was rising in the early 1980s, world champion Karpov was still in top form, here using a queen sacrifice to checkmate veteran grandmaster Geller on the way to his second Soviet Championship title.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Karpov.zip',
    pgn: `[Event "URS-ch50"]
[Site "Moscow"]
[Date "1983.??.??"]
[Round "?"]
[White "Anatoly Karpov"]
[Black "Efim Geller"]
[Result "1-0"]
[WhiteElo "2710"]
[BlackElo "2575"]
[ECO "C88"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. d3 Bb7 9. Nbd2 h6 10. Nf1 Re8 11. Ne3 Bf8 12. Bd2 d6 13. a4 Nd7 14. c3 Ne7 15. Qb1 Nc5 16. Bc2 d5 17. exd5 Nxd5 18. Ng4 Nf4 19. Bxf4 exf4 20. Nge5 Bd6 21. d4 Bxe5 22. Nxe5 Qg5 23. f3 Rad8 24. axb5 axb5 25. Ra7 Bd5 26. Rxc7 Na6 27. Ra7 Nc5 28. Bh7+ Kf8 29. b4 Na4 30. Qd3 Bc4 31. Qxc4 1-0`
  },
  {
    id: 'portisch-pinter-1984',
    title: 'Portisch vs Pintér',
    event: 'Hungarian Championship, Budapest',
    year: 1984,
    white: 'Lajos Portisch',
    black: 'József Pintér',
    description: 'Pintér plays the game of his life against his famous opponent, sacrificing a piece in a queenless middlegame to draw Portisch\'s king into deadly crossfire.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Portisch.zip',
    pgn: `[Event "HUN-ch"]
[Site "HUN"]
[Date "1984.??.??"]
[Round "4"]
[White "Lajos Portisch"]
[Black "József Pintér"]
[Result "0-1"]
[WhiteElo "2625"]
[BlackElo "2515"]
[ECO "D41"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c5 5. cxd5 Nxd5 6. e4 Nxc3 7. bxc3 cxd4 8. cxd4 Nc6 9. Bc4 b5 10. Be2 Bb4+ 11. Bd2 Qa5 12. Bxb4 Qxb4+ 13. Qd2 Bb7 14. a3 Qxd2+ 15. Kxd2 a6 16. a4 b4 17. a5 Rd8 18. Ke3 f5 19. exf5 exf5 20. Bc4 Ke7 21. d5 Kf6 22. dxc6 Rhe8+ 23. Kf4 Re4+ 24. Kg3 Bc8 25. Rac1 Rg4+ 26. Kh3 f4 27. Ne5 Kg5 28. Nf7+ Kh5 29. Be2 Rd3+ 30. g3 f3 31. Rc5+ Rg5+ 32. g4+ Bxg4+ 33. Kg3 fxe2+ 0-1`
  },
  {
    id: 'kasparov-karpov-1986',
    title: 'Kasparov vs Karpov',
    event: '16th Match Game, Leningrad',
    year: 1986,
    white: 'Garry Kasparov',
    black: 'Anatoly Karpov',
    description: 'The most spectacular game of their third world championship match hangs in the balance until Kasparov\'s diabolical 37th move blows Karpov\'s defence away.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Kasparov.zip',
    pgn: `[Event "World Championship 33th-KK3"]
[Site "London/Leningrad"]
[Date "1986.??.??"]
[Round "16"]
[White "Garry Kasparov"]
[Black "Anatoly Karpov"]
[Result "1-0"]
[WhiteElo "2740"]
[BlackElo "2705"]
[ECO "C92"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Bb7 10. d4 Re8 11. Nbd2 Bf8 12. a4 h6 13. Bc2 exd4 14. cxd4 Nb4 15. Bb1 c5 16. d5 Nd7 17. Ra3 c4 18. Nd4 Qf6 19. N2f3 Nc5 20. axb5 axb5 21. Nxb5 Rxa3 22. Nxa3 Ba6 23. Re3 Rb8 24. e5 dxe5 25. Nxe5 Nbd3 26. Ng4 Qb6 27. Rg3 g6 28. Bxh6 Qxb2 29. Qf3 Nd7 30. Bxf8 Kxf8 31. Kh2 Rb3 32. Bxd3 cxd3 33. Qf4 Qxa3 34. Nh6 Qe7 35. Rxg6 Qe5 36. Rg8+ Ke7 37. d6+ Ke6 38. Re8+ Kd5 39. Rxe5+ Nxe5 40. d7 Rb8 41. Nxf7 1-0`
  },
  {
    id: 'kasparov-karpov-1987',
    title: 'Kasparov vs Karpov',
    event: '24th Match Game, Seville',
    year: 1987,
    white: 'Garry Kasparov',
    black: 'Anatoly Karpov',
    description: 'Trailing by a point before the final game of their fourth World Championship match, Kasparov surprises Karpov by beginning quietly in Karpov\'s own style. With Karpov running low on time, Kasparov ratchets up the tension by sacrificing a pawn for an attack.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Kasparov.zip',
    pgn: `[Event "World Championship 34th-KK4"]
[Site "Sevilla"]
[Date "1987.??.??"]
[Round "24"]
[White "Garry Kasparov"]
[Black "Anatoly Karpov"]
[Result "1-0"]
[WhiteElo "2740"]
[BlackElo "2700"]
[ECO "A14"]

1. c4 e6 2. Nf3 Nf6 3. g3 d5 4. b3 Be7 5. Bg2 O-O 6. O-O b6 7. Bb2 Bb7 8. e3 Nbd7 9. Nc3 Ne4 10. Ne2 a5 11. d3 Bf6 12. Qc2 Bxb2 13. Qxb2 Nd6 14. cxd5 Bxd5 15. d4 c5 16. Rfd1 Rc8 17. Nf4 Bxf3 18. Bxf3 Qe7 19. Rac1 Rfd8 20. dxc5 Nxc5 21. b4 axb4 22. Qxb4 Qa7 23. a3 Nf5 24. Rb1 Rxd1+ 25. Rxd1 Qc7 26. Nd3 h6 27. Rc1 Ne7 28. Qb5 Nf5 29. a4 Nd6 30. Qb1 Qa7 31. Ne5 Nxa4 32. Rxc8+ Nxc8 33. Qd1 Ne7 34. Qd8+ Kh7 35. Nxf7 Ng6 36. Qe8 Qe7 37. Qxa4 Qxf7 38. Be4 Kg8 39. Qb5 Nf8 40. Qxb6 Qf6 41. Qb5 Qe7 42. Kg2 g6 43. Qa5 Qg7 44. Qc5 Qf7 45. h4 h5 46. Qc6 Qe7 47. Bd3 Qf7 48. Qd6 Kg7 49. e4 Kg8 50. Bc4 Kg7 51. Qe5+ Kg8 52. Qd6 Kg7 53. Bb5 Kg8 54. Bc6 Qa7 55. Qb4 Qc7 56. Qb7 Qd8 57. e5 Qa5 58. Be8 Qc5 59. Qf7+ Kh8 60. Ba4 Qd5+ 61. Kh2 Qc5 62. Bb3 Qc8 63. Bd1 Qc5 64. Kg2 1-0`
  },
  {
    id: 'piket-kasparov-1989',
    title: 'Piket vs Kasparov',
    event: 'Tilburg',
    year: 1989,
    white: 'Jeroen Piket',
    black: 'Garry Kasparov',
    description: 'A typically devastating performance by Kasparov, whose dominance of super-tournaments in 1989 increased his rating to 2800, the first to reach that number.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Kasparov.zip',
    pgn: `[Event "Tilburg"]
[Site "Tilburg"]
[Date "1989.??.??"]
[Round "8"]
[White "Jeroen Piket"]
[Black "Garry Kasparov"]
[Result "0-1"]
[WhiteElo "2540"]
[BlackElo "2775"]
[ECO "E99"]

1. d4 Nf6 2. Nf3 g6 3. c4 Bg7 4. Nc3 O-O 5. e4 d6 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. Be3 f5 11. f3 f4 12. Bf2 g5 13. b4 Nf6 14. c5 Ng6 15. cxd6 cxd6 16. Rc1 Rf7 17. a4 Bf8 18. a5 Bd7 19. Nb5 g4 20. Nc7 g3 21. Nxa8 Nh5 22. Kh1 gxf2 23. Rxf2 Ng3+ 24. Kg1 Qxa8 25. Bc4 a6 26. Qd3 Qa7 27. b5 axb5 28. Bxb5 Nh1 0-1`
  },
  {
    id: 'karpov-kasparov-1990',
    title: 'Karpov vs Kasparov',
    event: 'World Chess Championship, Lyon, 23rd Match Game',
    year: 1990,
    white: 'Anatoly Karpov',
    black: 'Garry Kasparov',
    description: 'The 5th world championship match between the two dominant players of the 1980s ends with Karpov winning the last decisive game but Kasparov winning the match to remain world champion.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Karpov.zip',
    pgn: `[Event "World Championship 35th-KK5"]
[Site "Lyon/New York"]
[Date "1990.??.??"]
[Round "23"]
[White "Anatoly Karpov"]
[Black "Garry Kasparov"]
[Result "1-0"]
[WhiteElo "2730"]
[BlackElo "2800"]
[ECO "E87"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 e5 7. d5 Nh5 8. Qd2 Qh4+ 9. g3 Qe7 10. O-O-O f5 11. exf5 gxf5 12. Nh3 Na6 13. Rg1 Nf6 14. Nf2 Kh8 15. Be2 Bd7 16. Bg5 Nc5 17. g4 e4 18. fxe4 fxe4 19. Be3 Na4 20. g5 Nxc3 21. bxc3 Ng8 22. Ng4 c5 23. dxc6 Bxc6 24. h4 d5 25. cxd5 Bxd5 26. Qxd5 Rac8 27. Qd6 Rxc3+ 28. Kb1 Qf7 29. Bd4 1-0`
  },
  {
    id: 'tal-lautier-1992',
    title: 'Tal vs Lautier',
    event: 'Barcelona',
    year: 1992,
    white: 'Mikhail Tal',
    black: 'Joël Lautier',
    description: 'In his final tournament before his death at age 55, the Magician from Riga produces one last masterpiece against a grandmaster from the next generation.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Tal.zip',
    pgn: `[Event "Barcelona"]
[Site "Barcelona"]
[Date "1992.??.??"]
[Round "?"]
[White "Mikhail Tal"]
[Black "Joël Lautier"]
[Result "1-0"]
[WhiteElo "2525"]
[BlackElo "2580"]
[ECO "A46"]

1. d4 Nf6 2. Nf3 e6 3. g3 b5 4. Bg2 Bb7 5. O-O c5 6. Bg5 Qb6 7. a4 a6 8. Nc3 Ne4 9. Nxe4 Bxe4 10. axb5 Qxb5 11. Qd2 f6 12. Bf4 Qb7 13. c4 cxd4 14. Qxd4 e5 15. Bxe5 fxe5 16. Qxe5+ Be7 17. Nd4 Bxg2 18. Nf5 Qb4 19. Kxg2 Nc6 20. Qxg7 O-O-O 21. Rxa6 Qb7 22. Rfa1 Nb4+ 23. Kg1 Nxa6 24. Qxe7 Qb6 25. Qa3 Rhf8 26. Nd6+ Kc7 27. Qxa6 Ra8 28. Qxb6+ Kxb6 29. Rd1 Ra2 30. Rd2 Kc6 31. f3 Rfa8 32. Nb5 R8a4 33. Rc2 Kc5 34. Nc3 Ra1+ 35. Kf2 Rxc4 36. Rd2 Ra7 37. e4 Kc6 38. Ke3 Rb7 39. Rc2 d6 40. Kd3 Rc5 41. f4 Rb4 42. g4 Kd7 43. g5 Ke6 44. h4 d5 45. Nxd5 Rxc2 46. Nxb4 Rxb2 47. Nc2 Rb3+ 48. Kc4 Rh3 49. Nd4+ Kf7 50. f5 Rxh4 51. Kd5 Rg4 52. Nf3 Rg3 53. Ne5+ Kg8 54. f6 Rxg5 55. Ke6 Rg1 56. f7+ Kg7 57. Nd7 Rf1 58. f8=Q+ Rxf8 59. Nxf8 h6 60. Nd7 h5 61. Ne5 h4 62. Nf3 1-0`
  },
  {
    id: 'ivanchuk-anand-1992',
    title: 'Ivanchuk vs Anand',
    event: 'Linares, 1st Match Game',
    year: 1992,
    white: 'Vasyl Ivanchuk',
    black: 'Viswanathan Anand',
    description: 'Anand breaks all principles of positional chess by getting doubled pawns and trading his good bishop, only to reveal the deep idea later in the game, managing to create 2 passed pawns and eventually winning.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Ivanchuk.zip',
    pgn: `[Event "Linares m"]
[Site "Linares"]
[Date "1992.??.??"]
[Round "1"]
[White "Vasyl Ivanchuk"]
[Black "Viswanathan Anand"]
[Result "0-1"]
[WhiteElo "2720"]
[BlackElo "2690"]
[ECO "B66"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd2 a6 8. O-O-O h6 9. Be3 Nxd4 10. Bxd4 b5 11. f3 Qa5 12. a3 e5 13. Be3 Be6 14. Kb1 Be7 15. g4 Rb8 16. Nd5 Qxd2 17. Nxf6+ gxf6 18. Rxd2 h5 19. Rg1 hxg4 20. fxg4 Bc4 21. b3 Bxf1 22. Rxf1 Rh3 23. Re2 Kd7 24. g5 Ke6 25. gxf6 Bxf6 26. Bd2 Be7 27. Be1 f6 28. Bg3 d5 29. exd5+ Kxd5 30. Rf5 Kc6 31. Ref2 Rh6 32. Kb2 Kd7 33. Re2 Bd6 34. Rf3 Rc8 35. Be1 Ke6 36. Rd3 Rh7 37. Rg3 Bc5 38. Ka2 Rd7 39. Rc3 Rcc7 40. h4 Rd1 41. Bf2 Bd6 42. Rg3 e4 43. Rxe4+ Be5 44. Rxe5+ fxe5 45. Kb2 Rd2 0-1`
  },
  {
    id: 'short-kasparov-1993',
    title: 'Short vs Kasparov',
    event: 'PCA World Championship, London, 8th Match Game',
    year: 1993,
    white: 'Nigel Short',
    black: 'Garry Kasparov',
    description: 'Although the match was one-sided, the games were hard-fought. In this game, Short exposes Kasparov\'s king with a shower of sacrifices but can\'t land the knockout blow.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Short.zip',
    pgn: `[Event "PCA-World Championship"]
[Site "London"]
[Date "1993.??.??"]
[Round "8"]
[White "Nigel Short"]
[Black "Garry Kasparov"]
[Result "1/2-1/2"]
[WhiteElo "2655"]
[BlackElo "2805"]
[ECO "B86"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 Nbd7 8. f4 Nc5 9. e5 dxe5 10. fxe5 Nfd7 11. Bf4 b5 12. Qg4 h5 13. Qg3 h4 14. Qg4 g5 15. O-O-O Qe7 16. Nc6 Nxb3+ 17. axb3 Qc5 18. Ne4 Qxc6 19. Bxg5 Bb7 20. Rd6 Bxd6 21. Nxd6+ Kf8 22. Rf1 Nxe5 23. Qxe6 Qd5 24. Rxf7+ Nxf7 25. Be7+ Kg7 26. Qf6+ Kh7 27. Nxf7 Qh5 28. Ng5+ Kg8 29. Qe6+ Kg7 30. Qf6+ Kg8 31. Qe6+ Kg7 32. Bf6+ Kh6 33. Nf7+ Kh7 34. Ng5+ Kh6 35. Bxh8+ Qg6 36. Nf7+ Kh7 37. Qe7 Qxg2 38. Be5 Qf1+ 39. Kd2 Qf2+ 40. Kd3 Qf3+ 41. Kd2 Qf2+ 1/2-1/2`
  },
  {
    id: 'shirov-polgar-1994',
    title: 'Shirov vs Polgár',
    event: 'Buenos Aires',
    year: 1994,
    white: 'Alexey Shirov',
    black: 'Judit Polgár',
    description: 'The attacking prowess of the strongest woman chess player of all time is on full display as she rips Shirov\'s position apart with her pawns and routs his army with her knights.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Shirov.zip',
    pgn: `[Event "Buenos Aires Sicilian"]
[Site "Buenos Aires"]
[Date "1994.??.??"]
[Round "8"]
[White "Alexey Shirov"]
[Black "Judit Polgár"]
[Result "0-1"]
[WhiteElo "2740"]
[BlackElo "2630"]
[ECO "B54"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 d6 6. g4 a6 7. Be3 Nge7 8. Nb3 b5 9. f4 Bb7 10. Qf3 g5 11. fxg5 Ne5 12. Qg2 b4 13. Ne2 h5 14. gxh5 Nf5 15. Bf2 Qxg5 16. Na5 Ne3 17. Qg3 Qxg3 18. Nxg3 Nxc2+ 19. Kd1 Nxa1 20. Nxb7 b3 21. axb3 Nxb3 22. Kc2 Nc5 23. Nxc5 dxc5 24. Be1 Nf3 25. Bc3 Nd4+ 26. Kd3 Bd6 27. Bg2 Be5 28. Kc4 Ke7 29. Ra1 Nc6 0-1`
  },
  {
    id: 'topalov-kramnik-1995',
    title: 'Topalov vs Kramnik',
    event: 'Belgrade',
    year: 1995,
    white: 'Veselin Topalov',
    black: 'Vladimir Kramnik',
    description: 'Foreshadowing their bitter rivalry a decade later, two future World Champions refuse to draw and throw everything at each other until only one is left standing.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Topalov.zip',
    pgn: `[Event "Belgrade Invest"]
[Site "Belgrade"]
[Date "1995.??.??"]
[Round "6"]
[White "Veselin Topalov"]
[Black "Vladimir Kramnik"]
[Result "0-1"]
[WhiteElo "2670"]
[BlackElo "2730"]
[ECO "B57"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 Qb6 7. Ndb5 a6 8. Be3 Qa5 9. Nd4 Ne5 10. Bd3 Neg4 11. Bc1 g6 12. Nb3 Qb6 13. Qe2 Bg7 14. f4 Nh5 15. Nd5 Qd8 16. Bd2 e6 17. Ba5 Qh4+ 18. g3 Nxg3 19. Nc7+ Ke7 20. hxg3 Qxg3+ 21. Kd1 Nf2+ 22. Kd2 Nxh1 23. Nxa8 Qxf4+ 24. Qe3 Qh2+ 25. Qe2 Qf4+ 26. Qe3 Qh2+ 27. Qe2 Bh6+ 28. Kc3 Qe5+ 29. Kb4 Ng3 30. Qe1 Bg7 31. Nb6 d5 32. Ka4 Bd7+ 33. Nxd7 b5+ 34. Kb4 Kxd7 35. Bb6 Qxb2 36. exd5 Rc8 37. dxe6+ Ke8 38. Bc5 Bc3+ 39. Qxc3 a5+ 40. Kxb5 Qxc3 0-1`
  },
  {
    id: 'topalov-shirov-1998',
    title: 'Topalov vs Shirov',
    event: 'Linares',
    year: 1998,
    white: 'Veselin Topalov',
    black: 'Alexey Shirov',
    description: 'Though known for his attacking play, Shirov produces "the best move of all time" on move 47 of a quiet endgame to score a seemingly impossible win. Tim Krabbé ranked Shirov\'s 47...',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Topalov.zip',
    pgn: `[Event "Linares"]
[Site "Linares"]
[Date "1998.03.04"]
[Round "10"]
[White "Veselin Topalov"]
[Black "Alexey Shirov"]
[Result "0-1"]
[WhiteElo "2740"]
[BlackElo "2710"]
[ECO "D85"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bb5+ c6 8. Ba4 O-O 9. Ne2 Nd7 10. O-O e5 11. f3 Qe7 12. Be3 Rd8 13. Qc2 Nb6 14. Bb3 Be6 15. Rad1 Nc4 16. Bc1 b5 17. f4 exd4 18. Nxd4 Bg4 19. Rde1 Qc5 20. Kh1 a5 21. h3 Bd7 22. a4 bxa4 23. Ba2 Be8 24. e5 Nb6 25. f5 Nd5 26. Bd2 Nb4 27. Qxa4 Nxa2 28. Qxa2 Bxe5 29. fxg6 hxg6 30. Bg5 Rd5 31. Re3 Qd6 32. Qe2 Bd7 33. c4 Bxd4 34. cxd5 Bxe3 35. Qxe3 Re8 36. Qc3 Qxd5 37. Bh6 Re5 38. Rf3 Qc5 39. Qa1 Bf5 40. Re3 f6 41. Rxe5 Qxe5 42. Qa2+ Qd5 43. Qxd5+ cxd5 44. Bd2 a4 45. Bc3 Kf7 46. h4 Ke6 47. Kg1 Bh3 48. gxh3 Kf5 49. Kf2 Ke4 50. Bxf6 d4 51. Be7 Kd3 52. Bc5 Kc4 53. Be7 Kb3 0-1`
  },
  {
    id: 'kasparov-kramnik-2000',
    title: 'Kasparov vs Kramnik',
    event: 'Classical World Chess Championship, 3rd Match Game, London',
    year: 2000,
    white: 'Garry Kasparov',
    black: 'Vladimir Kramnik',
    description: 'Kramnik revives the Berlin Defence, which had fallen out of favor, and in the most popular variation of which the queens are exchanged on move 8.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Kasparov.zip',
    pgn: `[Event "Braingames WCC"]
[Site "London ENG"]
[Date "2000.10.12"]
[Round "3"]
[White "Garry Kasparov"]
[Black "Vladimir Kramnik"]
[Result "1/2-1/2"]
[WhiteElo "2849"]
[BlackElo "2770"]
[ECO "C67"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 Bd7 10. b3 h6 11. Bb2 Kc8 12. Rad1 b6 13. Ne2 c5 14. c4 Bc6 15. Nf4 Kb7 16. Nd5 Ne7 17. Rfe1 Rg8 18. Nf4 g5 19. Nh5 Rg6 20. Nf6 Bg7 21. Rd3 Bxf3 22. Rxf3 Bxf6 23. exf6 Nc6 24. Rd3 Rf8 25. Re4 Kc8 26. f4 gxf4 27. Rxf4 Re8 28. Bc3 Re2 29. Rf2 Re4 30. Rh3 a5 31. Rh5 a4 32. bxa4 Rxc4 33. Bd2 Rxa4 34. Rxh6 Rg8 35. Rh7 Rxa2 36. Rxf7 Ne5 37. Rg7 Rf8 38. h3 c4 39. Re7 Nd3 40. f7 Nxf2 41. Re8+ Kd7 42. Rxf8 Ke7 43. Rc8 Kxf7 44. Rxc7+ Ke6 45. Be3 Nd1 46. Bxb6 c3 47. h4 Ra6 48. Bd4 Ra4 49. Bxc3 Nxc3 50. Rxc3 Rxh4 51. Rf3 Rh5 52. Kf2 Rg5 53. Rf8 Ke5 1/2-1/2`
  },
  {
    id: 'ponomariov-ivanchuk-2002',
    title: 'Ponomariov vs Ivanchuk',
    event: 'FIDE World Championship Tournament, Final Match, 5th Game, Moscow',
    year: 2002,
    white: 'Ruslan Ponomariov',
    black: 'Vassily Ivanchuk',
    description: 'Down a point in the World Championship final, Ivanchuk has a large advantage but can\'t find a winning continuation.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Ivanchuk.zip',
    pgn: `[Event "FIDE WCh KO Final"]
[Site "Moscow RUS"]
[Date "2002.01.21"]
[Round "7.5"]
[White "Ruslan Ponomariov"]
[Black "Vassily Ivanchuk"]
[Result "1-0"]
[WhiteElo "2727"]
[BlackElo "2717"]
[ECO "C88"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. h3 Bb7 9. d3 d6 10. a3 Nb8 11. Nbd2 Nbd7 12. Nf1 Re8 13. Ng3 c6 14. Nh2 d5 15. Qf3 g6 16. Ba2 Bf8 17. Bg5 h6 18. Bd2 Bg7 19. Ng4 Nxg4 20. hxg4 Nc5 21. Rad1 Rc8 22. Nf1 Ne6 23. Qg3 Kh7 24. Nh2 f6 25. Nf3 c5 26. Qh2 Nd4 27. Nxd4 cxd4 28. c3 dxc3 29. bxc3 dxe4 30. dxe4 Qe7 31. a4 bxa4 32. Qh3 Red8 33. Qf3 Rc7 34. Bc1 Rcd7 35. Bb1 Qe6 36. Rxd7 Rxd7 37. Bc2 Bc6 38. Rd1 Qa2 39. Rxd7 Bxd7 40. Qd1 Bb5 41. Be3 Qc4 42. Kh2 Bc6 43. Qa1 Bf8 44. Bb1 a3 45. f3 Qb3 46. Qa2 Ba4 47. Kg3 Kg7 48. Qd2 g5 49. Ba2 Qb7 50. Qd3 Be8 51. Qd5 Qxd5 52. exd5 a5 53. c4 Bb4 54. c5 Kf8 55. Kf2 Bb5 56. c6 Ke7 57. Ba7 Kd8 58. Bb6+ Kc8 59. Ke3 a4 60. Ke4 Be2 61. Kf5 e4 62. Ke6 exf3 63. d6 Bxd6 64. Kxd6 1-0`
  },
  {
    id: 'kramnik-leko-2004',
    title: 'Kramnik vs Leko',
    event: 'Classical World Chess Championship, 14th Match Game, Brissago',
    year: 2004,
    white: 'Vladimir Kramnik',
    black: 'Peter Leko',
    description: 'Needing only a draw to win the World Championship, Leko plays too passively and pays the price.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Kramnik.zip',
    pgn: `[Event "WCh"]
[Site "Brissago SUI"]
[Date "2004.10.18"]
[Round "14"]
[White "Vladimir Kramnik"]
[Black "Peter Leko"]
[Result "1-0"]
[WhiteElo "2770"]
[BlackElo "2741"]
[ECO "B12"]

1. e4 c6 2. d4 d5 3. e5 Bf5 4. h4 h6 5. g4 Bd7 6. Nd2 c5 7. dxc5 e6 8. Nb3 Bxc5 9. Nxc5 Qa5+ 10. c3 Qxc5 11. Nf3 Ne7 12. Bd3 Nbc6 13. Be3 Qa5 14. Qd2 Ng6 15. Bd4 Nxd4 16. cxd4 Qxd2+ 17. Kxd2 Nf4 18. Rac1 h5 19. Rhg1 Bc6 20. gxh5 Nxh5 21. b4 a6 22. a4 Kd8 23. Ng5 Be8 24. b5 Nf4 25. b6 Nxd3 26. Kxd3 Rc8 27. Rxc8+ Kxc8 28. Rc1+ Bc6 29. Nxf7 Rxh4 30. Nd6+ Kd8 31. Rg1 Rh3+ 32. Ke2 Ra3 33. Rxg7 Rxa4 34. f4 Ra2+ 35. Kf3 Ra3+ 36. Kg4 Rd3 37. f5 Rxd4+ 38. Kg5 exf5 39. Kf6 Rg4 40. Rc7 Rh4 41. Nf7+ 1-0`
  },
  {
    id: 'anand-topalov-2005',
    title: 'Anand vs Topalov',
    event: 'Sofia',
    year: 2005,
    white: 'Viswanathan Anand',
    black: 'Veselin Topalov',
    description: 'Shocking in its complexity, this game finally ended in a hard-fought draw and was called "23rd-century chess" by Vladimir Kramnik.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Anand.zip',
    pgn: `[Event "Mtel Masters"]
[Site "Sofia BUL"]
[Date "2005.05.12"]
[Round "1"]
[White "Viswanathan Anand"]
[Black "Veselin Topalov"]
[Result "1/2-1/2"]
[WhiteElo "2785"]
[BlackElo "2778"]
[ECO "B80"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e6 7. f3 b5 8. g4 h6 9. Qd2 b4 10. Na4 Nbd7 11. O-O-O Ne5 12. b3 Bd7 13. Nb2 d5 14. Bf4 Nxf3 15. Nxf3 Nxe4 16. Qd4 f6 17. Bd3 Bc5 18. Bxe4 Bxd4 19. Bg6+ Kf8 20. Rxd4 a5 21. Re1 Be8 22. Nh4 e5 23. Rd2 a4 24. bxa4 Kg8 25. Bg3 d4 26. Rd3 h5 27. Bxe8 Qxe8 28. g5 Rc8 29. g6 Rh6 30. Rxd4 Rxg6 31. Nxg6 Qxg6 32. Rd2 Rc3 33. Red1 Kh7 34. Kb1 Qf5 35. Be1 Ra3 36. Rd6 Rh3 37. a5 Rxh2 38. Rc1 Qe4 39. a6 Qa8 40. Bxb4 h4 41. Bc5 h3 42. Nd3 Rd2 43. Rb6 h2 44. Nf2 Qd5 45. Be3 Re2 46. Rb3 f5 47. a7 Rxe3 48. Rxe3 Qb7+ 49. Rb3 Qxa7 50. Nh1 f4 51. c4 e4 52. c5 e3 53. c6 e2 54. c7 Qxc7 55. Rxc7 e1=Q+ 56. Rc1 Qe4+ 57. Ka1 Qd4+ 58. Kb1 Qe4+ 59. Ka1 Qd4+ 60. Kb1 Qe4+ 1/2-1/2`
  },
  {
    id: 'karjakin-anand-2006',
    title: 'Karjakin vs Anand',
    event: 'Corus chess tournament, Round 1, Wijk aan Zee',
    year: 2006,
    white: 'Sergey Karjakin',
    black: 'Viswanathan Anand',
    description: 'Anand played a brilliant combination against Karjakin, beginning with the sacrifice of a knight, followed by a sacrifice of a bishop, and finally a rook mating with just a rook and a queen.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Karjakin.zip',
    pgn: `[Event "Corus A"]
[Site "Wijk aan Zee NED"]
[Date "2006.01.14"]
[Round "1"]
[White "Sergey Karjakin"]
[Black "Viswanathan Anand"]
[Result "0-1"]
[WhiteElo "2660"]
[BlackElo "2792"]
[ECO "B90"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 b4 13. Ne2 Ne8 14. f4 a5 15. f5 a4 16. Nbd4 exd4 17. Nxd4 b3 18. Kb1 bxc2+ 19. Nxc2 Bb3 20. axb3 axb3 21. Na3 Ne5 22. h4 Ra5 23. Qc3 Qa8 24. Bg2 Nc7 25. Qxc7 Rc8 26. Qxe7 Nc4 27. g6 hxg6 28. fxg6 Nxa3+ 29. bxa3 Rxa3 30. gxf7+ Kh7 31. f8=N+ Rxf8 32. Qxf8 Ra1+ 33. Kb2 Ra2+ 34. Kc3 Qa5+ 35. Kd3 Qb5+ 36. Kd4 Ra4+ 37. Kc3 Qc4+ 0-1`
  },
  {
    id: 'aronian-anand-2013',
    title: 'Anand\'s Immortal',
    event: 'Wijk aan Zee',
    year: 2013,
    white: 'Levon Aronian',
    black: 'Viswanathan Anand',
    description: 'Known as "Anand\'s Immortal". In this game, reigning world champion Anand exhibits a combination with a rook sacrifice and two more offered sacrifices to beat Aronian, then ranked No. 3 in the world.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Aronian.zip',
    pgn: `[Event "75th Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2013.01.15"]
[Round "4.5"]
[White "Levon Aronian"]
[Black "Viswanathan Anand"]
[Result "0-1"]
[WhiteElo "2802"]
[BlackElo "2772"]
[ECO "D47"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bd6 9. O-O O-O 10. Qc2 Bb7 11. a3 Rc8 12. Ng5 c5 13. Nxh7 Ng4 14. f4 cxd4 15. exd4 Bc5 16. Be2 Nde5 17. Bxg4 Bxd4+ 18. Kh1 Nxg4 19. Nxf8 f5 20. Ng6 Qf6 21. h3 Qxg6 22. Qe2 Qh5 23. Qd3 Be3 0-1`
  },
  {
    id: 'carlsen-karjakin-2016',
    title: 'Carlsen vs Karjakin',
    event: 'World Championship, Game 16, New York',
    year: 2016,
    white: 'Magnus Carlsen',
    black: 'Sergey Karjakin',
    description: 'Carlsen retains his title with a beautiful move to end a World Chess Championship match.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Carlsen.zip',
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
    id: 'bai-ding-2017',
    title: 'Bai vs Ding',
    event: 'China',
    year: 2017,
    white: 'Bai Jinshi',
    black: 'Ding Liren',
    description: 'Ding creates a stunning tactical crush of young compatriot Bai in just 32 moves with the black pieces, sacrificing his queen and culminating in a spectacular king hunt.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Ding.zip',
    pgn: `[Event "TCh-CHN 2017"]
[Site "China CHN"]
[Date "2017.11.04"]
[Round "18.4"]
[White "Bai Jinshi"]
[Black "Ding Liren"]
[Result "0-1"]
[WhiteElo "2553"]
[BlackElo "2774"]
[ECO "E21"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 O-O 5. Bg5 c5 6. e3 cxd4 7. Qxd4 Nc6 8. Qd3 h6 9. Bh4 d5 10. Rd1 g5 11. Bg3 Ne4 12. Nd2 Nc5 13. Qc2 d4 14. Nf3 e5 15. Nxe5 dxc3 16. Rxd8 cxb2+ 17. Ke2 Rxd8 18. Qxb2 Na4 19. Qc2 Nc3+ 20. Kf3 Rd4 21. h3 h5 22. Bh2 g4+ 23. Kg3 Rd2 24. Qb3 Ne4+ 25. Kh4 Be7+ 26. Kxh5 Kg7 27. Bf4 Bf5 28. Bh6+ Kh7 29. Qxb7 Rxf2 30. Bg5 Rh8 31. Nxf7 Bg6+ 32. Kxg4 Ne5+ 0-1`
  },
  {
    id: 'firouzja-murali-2019',
    title: 'Firouzja vs Murali',
    event: 'Xingtai',
    year: 2019,
    white: 'Alireza Firouzja',
    black: 'Karthikeyan Murali',
    description: 'Karthikeyan sacrifices his queen for a knight and a bishop on move 9 in a known position against the prodigy Firouzja, leaving the latter\'s pieces uncoordinated and without decent squares.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Firouzja.zip',
    pgn: `[Event "18th Asian Continental"]
[Site "Xingtai CHN"]
[Date "2019.06.11"]
[Round "5.1"]
[White "Alireza Firouzja"]
[Black "Karthikeyan Murali"]
[Result "0-1"]
[WhiteElo "2682"]
[BlackElo "2593"]
[ECO "E71"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. h3 O-O 6. Be3 c5 7. Nf3 Qa5 8. Nd2 cxd4 9. Nb3 Qxc3+ 10. bxc3 dxe3 11. f3 Nh5 12. Qc1 Bh6 13. g4 Nf4 14. Kd1 Ne6 15. Kc2 Nc6 16. h4 Bf4 17. Qd1 Ne5 18. Nc1 Bd7 19. a4 Rac8 20. Ne2 Bh6 21. g5 Bg7 22. Bh3 Nxf3 23. Qd3 Ne5 24. Qxe3 Nxc4 25. Qf2 Rc5 26. Rhb1 Bc6 27. Bg2 f5 28. gxf6 Bxf6 29. Rf1 Bxc3 30. Qxc5 Nxc5 31. Rxf8+ Kxf8 32. Kxc3 Ne5 33. a5 Nxe4+ 34. Bxe4 Bxe4 35. Nd4 Bd5 36. Nb5 a6 37. Nc7 Bc6 38. Rf1+ Kg7 39. Ne6+ Kh6 40. Rf8 Kh5 41. Rh8 h6 42. Rh7 Kxh4 43. Rxh6+ Kg4 44. Nd4 Kg5 45. Rh2 Bd5 46. Re2 Kf4 47. Rf2+ Nf3 48. Re2 e5 49. Nc2 Be4 50. Ne3 d5 51. Kb4 Nd4 52. Re1 Kf3 0-1`
  },
  {
    id: 'nepomniachtchi-ding-2023',
    title: 'Nepomniachtchi vs Ding',
    event: 'World Chess Championship, Game 18',
    year: 2023,
    white: 'Ian Nepomniachtchi',
    black: 'Ding Liren',
    description: 'In a winner-take-all tiebreak game, Ding avoids a draw with a risky self-pin on move 46. Both players make errors in the subsequent play, but Nepomniachtchi makes the last one, as Ding breaks through to become the 17th undisputed World Chess Champion.',
    source: 'en.wikipedia.org/wiki/List_of_chess_games; moves: pgnmentor.com/players/Nepomniachtchi.zip',
    pgn: `[Event "WCh Rapid TB 2023"]
[Site "Astana KAZ"]
[Date "2023.04.30"]
[Round "4.1"]
[White "Ian Nepomniachtchi"]
[Black "Ding Liren"]
[Result "0-1"]
[WhiteElo "2795"]
[BlackElo "2788"]
[ECO "C84"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d3 b5 7. Bb3 d6 8. a4 Bd7 9. h3 O-O 10. Be3 Na5 11. Ba2 bxa4 12. Nc3 Rb8 13. Bb1 Qe8 14. b3 c5 15. Nxa4 Nc6 16. Nc3 a5 17. Nd2 Be6 18. Nc4 d5 19. exd5 Nxd5 20. Bd2 Nxc3 21. Bxc3 Bxc4 22. bxc4 Bd8 23. Bd2 Bc7 24. c3 f5 25. Re1 Rd8 26. Ra2 Qg6 27. Qe2 Qd6 28. g3 Rde8 29. Qf3 e4 30. dxe4 Ne5 31. Qg2 Nd3 32. Bxd3 Qxd3 33. exf5 Rxe1+ 34. Bxe1 Qxc4 35. Ra1 Rxf5 36. Bd2 h6 37. Qc6 Rf7 38. Re1 Kh7 39. Be3 Be5 40. Qe8 Bxc3 41. Rc1 Rf6 42. Qd7 Qe2 43. Qd5 Bb4 44. Qe4+ Kg8 45. Qd5+ Kh7 46. Qe4+ Rg6 47. Qf5 c4 48. h4 Qd3 49. Qf3 Rf6 50. Qg4 c3 51. Rd1 Qg6 52. Qc8 Rc6 53. Qa8 Rd6 54. Rxd6 Qxd6 55. Qe4+ Qg6 56. Qc4 Qb1+ 57. Kh2 a4 58. Bd4 a3 59. Qc7 Qg6 60. Qc4 c2 61. Be3 Bd6 62. Kg2 h5 63. Kf1 Be5 64. g4 hxg4 65. h5 Qf5 66. Qd5 g3 67. f4 a2 68. Qxa2 Bxf4 0-1`
  },
  {
    id: 'steinitz-lasker-1899',
    title: 'Steinitz vs Lasker, 1899',
    event: 'London, round 27',
    year: 1899,
    white: 'William Steinitz',
    black: 'Emanuel Lasker',
    description: 'London, round 27, 1899. Emanuel Lasker wins in 30 moves. Opening: Vienna Gambit. Listed as a notable game on Wikipedia (Emanuel Lasker).',
    source: 'en.wikipedia.org/wiki/Emanuel_Lasker; moves: pgnmentor.com/players/Steinitz.zip',
    pgn: `[Event "London"]
[Site "London"]
[Date "1899.??.??"]
[Round "27"]
[White "William Steinitz"]
[Black "Emanuel Lasker"]
[Result "0-1"]
[ECO "C29"]

1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. d3 Nc6 5. fxe5 Nxe5 6. d4 Ng6 7. exd5 Nxd5 8. Nxd5 Qxd5 9. Nf3 Bg4 10. Be2 O-O-O 11. c3 Bd6 12. O-O Rhe8 13. h3 Bd7 14. Ng5 Nh4 15. Nf3 Nxg2 16. Kxg2 Bxh3+ 17. Kf2 f6 18. Rg1 g5 19. Bxg5 fxg5 20. Rxg5 Qe6 21. Qd3 Bf4 22. Rh1 Bxg5 23. Nxg5 Qf6+ 24. Bf3 Bf5 25. Nxh7 Qg6 26. Qb5 c6 27. Qa5 Re7 28. Rh5 Bg4 29. Rg5 Qc2+ 30. Kg3 Bxf3 0-1`
  },
  {
    id: 'lasker-capablanca-1921',
    title: 'Lasker vs Capablanca, 1921',
    event: 'World Championship 12th, round 10',
    year: 1921,
    white: 'Emanuel Lasker',
    black: 'Jose Capablanca',
    description: 'World Championship 12th, round 10, 1921. Jose Capablanca wins in 68 moves. Opening: Queen\'s Gambit Declined. Listed as a notable game on Wikipedia (José Raúl Capablanca).',
    source: 'en.wikipedia.org/wiki/José_Raúl_Capablanca; moves: pgnmentor.com/players/Lasker.zip',
    pgn: `[Event "World Championship 12th"]
[Site "Havana"]
[Date "1921.??.??"]
[Round "10"]
[White "Emanuel Lasker"]
[Black "Jose Capablanca"]
[Result "0-1"]
[ECO "D61"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Qc2 c5 8. Rd1 Qa5 9. Bd3 h6 10. Bh4 cxd4 11. exd4 dxc4 12. Bxc4 Nb6 13. Bb3 Bd7 14. O-O Rac8 15. Ne5 Bb5 16. Rfe1 Nbd5 17. Bxd5 Nxd5 18. Bxe7 Nxe7 19. Qb3 Bc6 20. Nxc6 bxc6 21. Re5 Qb6 22. Qc2 Rfd8 23. Ne2 Rd5 24. Rxd5 cxd5 25. Qd2 Nf5 26. b3 h5 27. h3 h4 28. Qd3 Rc6 29. Kf1 g6 30. Qb1 Qb4 31. Kg1 a5 32. Qb2 a4 33. Qd2 Qxd2 34. Rxd2 axb3 35. axb3 Rb6 36. Rd3 Ra6 37. g4 hxg3 38. fxg3 Ra2 39. Nc3 Rc2 40. Nd1 Ne7 41. Nc3 Rc1+ 42. Kf2 Nc6 43. Nd1 Rb1 44. Ke2 Rxb3 45. Ke3 Rb4 46. Nc3 Ne7 47. Ne2 Nf5+ 48. Kf2 g5 49. g4 Nd6 50. Ng1 Ne4+ 51. Kf1 Rb1+ 52. Kg2 Rb2+ 53. Kf1 Rf2+ 54. Ke1 Ra2 55. Kf1 Kg7 56. Re3 Kg6 57. Rd3 f6 58. Re3 Kf7 59. Rd3 Ke7 60. Re3 Kd6 61. Rd3 Rf2+ 62. Ke1 Rg2 63. Kf1 Ra2 64. Re3 e5 65. Rd3 exd4 66. Rxd4 Kc5 67. Rd1 d4 68. Rc1+ Kd5 0-1`
  },
  {
    id: 'petrosian-smyslov-1949',
    title: 'Petrosian vs Smyslov, 1949',
    event: 'URS-ch17',
    year: 1949,
    white: 'Tigran Petrosian',
    black: 'Vassily Smyslov',
    description: 'URS-ch17, 1949. Vassily Smyslov wins in 46 moves. Opening: Sicilian Najdorf. Listed as a notable game on Wikipedia (Vasily Smyslov).',
    source: 'en.wikipedia.org/wiki/Vasily_Smyslov; moves: pgnmentor.com/players/Petrosian.zip',
    pgn: `[Event "URS-ch17"]
[Site "Moscow"]
[Date "1949.??.??"]
[Round "?"]
[White "Tigran Petrosian"]
[Black "Vassily Smyslov"]
[Result "0-1"]
[ECO "B84"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e6 7. O-O Be7 8. Be3 O-O 9. f4 Qc7 10. f5 e5 11. Nb3 b5 12. a3 Bb7 13. Bf3 Rd8 14. Nd2 Nbd7 15. Kh1 Rac8 16. Qe2 Nb6 17. Qf2 Nc4 18. Nxc4 Qxc4 19. Bg5 h6 20. Bxf6 Bxf6 21. Rad1 Qc5 22. Be2 Qxf2 23. Rxf2 d5 24. Nxd5 Bxd5 25. exd5 Rxc2 26. b3 e4 27. g4 e3 28. Rg2 Rd2 29. Rxd2 exd2 30. Bd1 Rxd5 31. Kg1 Kf8 32. Kf1 Bg5 33. a4 h5 34. h3 h4 35. axb5 axb5 36. Rf2 Ke7 37. Rf3 Re5 38. Be2 Rd5 39. Bd1 Kf6 40. Rc3 Bf4 41. Ke2 Kg5 42. Rf3 b4 43. Kf1 Re5 44. Be2 Be3 45. Bd1 Kf6 46. Be2 Re4 0-1`
  },
  {
    id: 'spassky-fischer-1966',
    title: 'Spassky vs Fischer, 1966',
    event: 'Santa Monica, round 8',
    year: 1966,
    white: 'Boris Spassky',
    black: 'Robert Fischer',
    description: 'Santa Monica, round 8, 1966. Boris Spassky wins in 50 moves. Opening: Grünfeld Defense: Exchange Variation. Listed as a notable game on Wikipedia (Boris Spassky).',
    source: 'en.wikipedia.org/wiki/Boris_Spassky; moves: pgnmentor.com/players/Spassky.zip',
    pgn: `[Event "Santa Monica"]
[Site "Santa Monica"]
[Date "1966.??.??"]
[Round "8"]
[White "Boris Spassky"]
[Black "Robert Fischer"]
[Result "1-0"]
[ECO "D87"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 Nc6 9. Be3 O-O 10. O-O Qc7 11. Rc1 Rd8 12. Qe1 e6 13. f4 Na5 14. Bd3 f5 15. Rd1 b6 16. Qf2 cxd4 17. Bxd4 Bxd4 18. cxd4 Bb7 19. Ng3 Qf7 20. d5 fxe4 21. dxe6 Qxe6 22. f5 Qf7 23. Bxe4 Rxd1 24. Rxd1 Rf8 25. Bb1 Qf6 26. Qc2 Kh8 27. fxg6 hxg6 28. Qd2 Kg7 29. Rf1 Qe7 30. Qd4+ Rf6 31. Ne4 Bxe4 32. Bxe4 Qc5 33. Qxc5 Rxf1+ 34. Kxf1 bxc5 35. h4 Nc4 36. Ke2 Ne5 37. Ke3 Kf6 38. Kf4 Nf7 39. Ke3 g5 40. h5 Nh6 41. Kd3 Ke5 42. Ba8 Kd6 43. Kc4 g4 44. a4 Ng8 45. a5 Nh6 46. Be4 g3 47. Kb5 Ng8 48. Bb1 Nh6 49. Ka6 Kc6 50. Ba2 1-0`
  },
  {
    id: 'botvinnik-chekhover-1935',
    title: 'Botvinnik vs Chekhover, 1935',
    event: 'Moscow, round 16',
    year: 1935,
    white: 'Mikhail Botvinnik',
    black: 'Vitaly Chekhover',
    description: 'Moscow, round 16, 1935. Mikhail Botvinnik wins in 43 moves. Opening: Réti Opening: Advance Variation. Listed as a notable game on Wikipedia (Mikhail Botvinnik).',
    source: 'en.wikipedia.org/wiki/Mikhail_Botvinnik; moves: pgnmentor.com/players/Botvinnik.zip',
    pgn: `[Event "Moscow"]
[Site "Moscow"]
[Date "1935.??.??"]
[Round "16"]
[White "Mikhail Botvinnik"]
[Black "Vitaly Chekhover"]
[Result "1-0"]
[ECO "A13"]

1. Nf3 d5 2. c4 e6 3. b3 Nf6 4. Bb2 Be7 5. e3 O-O 6. Be2 c6 7. O-O Nbd7 8. Nc3 a6 9. Nd4 dxc4 10. bxc4 Nc5 11. f4 Qc7 12. Nf3 Rd8 13. Qc2 Ncd7 14. d4 c5 15. Ne5 b6 16. Bd3 cxd4 17. exd4 Bb7 18. Qe2 Nf8 19. Nd1 Ra7 20. Nf2 Qb8 21. Nh3 h6 22. Ng5 hxg5 23. fxg5 N8d7 24. Nxf7 Kxf7 25. g6+ Kg8 26. Qxe6+ Kh8 27. Qh3+ Kg8 28. Bf5 Nf8 29. Be6+ Nxe6 30. Qxe6+ Kh8 31. Qh3+ Kg8 32. Rxf6 Bxf6 33. Qh7+ Kf8 34. Re1 Be5 35. Qh8+ Ke7 36. Qxg7+ Kd6 37. Qxe5+ Kd7 38. Qf5+ Kc6 39. d5+ Kc5 40. Ba3+ Kxc4 41. Qe4+ Kc3 42. Bb4+ Kb2 43. Qb1# 1-0`
  },
  {
    id: 'petrosian-pachman-1961',
    title: 'Petrosian vs Pachman, 1961',
    event: 'Bled, round 6',
    year: 1961,
    white: 'Tigran Petrosian',
    black: 'Ludek Pachman',
    description: 'Bled, round 6, 1961. Tigran Petrosian wins in 21 moves. Opening: Réti Opening. Listed as a notable game on Wikipedia (Tigran Petrosian).',
    source: 'en.wikipedia.org/wiki/Tigran_Petrosian; moves: pgnmentor.com/players/Petrosian.zip',
    pgn: `[Event "Bled"]
[Site "Bled"]
[Date "1961.??.??"]
[Round "6"]
[White "Tigran Petrosian"]
[Black "Ludek Pachman"]
[Result "1-0"]
[ECO "A04"]

1. Nf3 c5 2. g3 Nc6 3. Bg2 g6 4. O-O Bg7 5. d3 e6 6. e4 Nge7 7. Re1 O-O 8. e5 d6 9. exd6 Qxd6 10. Nbd2 Qc7 11. Nb3 Nd4 12. Bf4 Qb6 13. Ne5 Nxb3 14. Nc4 Qb5 15. axb3 a5 16. Bd6 Bf6 17. Qf3 Kg7 18. Re4 Rd8 19. Qxf6+ Kxf6 20. Be5+ Kg5 21. Bg7 1-0`
  },
  {
    id: 'tal-tolush-1957',
    title: 'Tal vs Tolush, 1957',
    event: 'URS-ch24, round 21',
    year: 1957,
    white: 'Mihail Tal',
    black: 'Alexander Tolush',
    description: 'URS-ch24, round 21, 1957. Mihail Tal wins in 42 moves. Opening: English Opening: Anglo-Indian. Listed as a notable game on Wikipedia (Mikhail Tal).',
    source: 'en.wikipedia.org/wiki/Mikhail_Tal; moves: pgnmentor.com/players/Tal.zip',
    pgn: `[Event "URS-ch24"]
[Site "Moscow"]
[Date "1957.??.??"]
[Round "21"]
[White "Mihail Tal"]
[Black "Alexander Tolush"]
[Result "1-0"]
[ECO "E81"]

1. c4 Nf6 2. Nc3 g6 3. e4 d6 4. d4 Bg7 5. f3 e5 6. Nge2 Nbd7 7. Bg5 c6 8. Qd2 O-O 9. d5 c5 10. g4 a6 11. Ng3 Re8 12. h4 Qa5 13. Bh6 Nf8 14. h5 Qc7 15. Bd3 b5 16. O-O-O bxc4 17. Bb1 Bh8 18. Rdg1 Rb8 19. Nf5 N6d7 20. Bg5 Bg7 21. Nxg7 Kxg7 22. Bh6+ Kg8 23. f4 exf4 24. Qxf4 Qd8 25. hxg6 Nxg6 26. Qh2 Nde5 27. Bf4 Nf8 28. Qh6 Neg6 29. Bg5 f6 30. e5 Rxe5 31. Bxg6 Rb7 32. Ne4 fxg5 33. Rf1 Rxe4 34. Bxe4 Rg7 35. Rf6 Bxg4 36. Rhf1 Nd7 37. Rxd6 Qe7 38. Rxa6 Kh8 39. Bxh7 Nb8 40. Bf5+ Kg8 41. Be6+ Bxe6 42. Rxe6 1-0`
  },
  {
    id: 'gligoric-fischer-1961',
    title: 'Gligoric vs Fischer, 1961',
    event: 'Bled, round 1',
    year: 1961,
    white: 'Svetozar Gligoric',
    black: 'Robert Fischer',
    description: 'Bled, round 1, 1961. Drawn in 33 moves. Opening: King\'s Indian Defense: Mar del Plata. Listed as a notable game on Wikipedia (Bobby Fischer).',
    source: 'en.wikipedia.org/wiki/Bobby_Fischer; moves: pgnmentor.com/players/Gligoric.zip',
    pgn: `[Event "Bled"]
[Site "Bled"]
[Date "1961.??.??"]
[Round "1"]
[White "Svetozar Gligoric"]
[Black "Robert Fischer"]
[Result "1/2-1/2"]
[ECO "E98"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. Nd3 f5 11. exf5 Nxf5 12. f3 Nf6 13. Nf2 Nd4 14. Nfe4 Nh5 15. Bg5 Qd7 16. g3 h6 17. Be3 c5 18. Bxd4 exd4 19. Nb5 a6 20. Nbxd6 d3 21. Qxd3 Bd4+ 22. Kg2 Nxg3 23. Nxc8 Nxf1 24. Nb6 Qc7 25. Rxf1 Qxb6 26. b4 Qxb4 27. Rb1 Qa5 28. Nxc5 Qxc5 29. Qxg6+ Bg7 30. Rxb7 Qd4 31. Bd3 Rf4 32. Qe6+ Kh8 33. Qg6 1/2-1/2`
  },
  {
    id: 'aronian-kramnik-2018',
    title: 'Aronian vs Kramnik, 2018',
    event: 'FIDE Candidates 2018',
    year: 2018,
    white: 'L. Aronian',
    black: 'V. Kramnik',
    description: 'FIDE Candidates 2018, 2018. V. Kramnik wins in 27 moves. Opening: Ruy Lopez: Berlin Defense. Listed as a notable game on Wikipedia (Vladimir Kramnik).',
    source: 'en.wikipedia.org/wiki/Vladimir_Kramnik; moves: pgnmentor.com/players/Aronian.zip',
    pgn: `[Event "FIDE Candidates 2018"]
[Site "Berlin GER"]
[Date "2018.03.12"]
[Round "3.4"]
[White "L. Aronian"]
[Black "V. Kramnik"]
[Result "0-1"]
[WhiteElo "2794"]
[BlackElo "2800"]
[ECO "C65"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. Bxc6 dxc6 6. O-O Qe7 7. h3 Rg8 8. Kh1 Nh5 9. c3 g5 10. Nxe5 g4 11. d4 Bd6 12. g3 Bxe5 13. dxe5 Qxe5 14. Qd4 Qe7 15. h4 c5 16. Qc4 Be6 17. Qb5+ c6 18. Qa4 f5 19. Bg5 Rxg5 20. hxg5 f4 21. Qd1 Rd8 22. Qc1 fxg3 23. Na3 Rd3 24. Rd1 Bd5 25. f3 gxf3 26. exd5 Qe2 27. Re1 g2+ 0-1`
  },
  {
    id: 'karpov-unzicker-1974',
    title: 'Karpov vs Unzicker, 1974',
    event: 'Nice olm fin-A, round 3',
    year: 1974,
    white: 'Anatoly Karpov',
    black: 'Wolfgang Unzicker',
    description: 'Nice olm fin-A, round 3, 1974. Anatoly Karpov wins in 44 moves. Opening: Ruy Lopez: Closed Defense. Listed as a notable game on Wikipedia (Anatoly Karpov).',
    source: 'en.wikipedia.org/wiki/Anatoly_Karpov; moves: pgnmentor.com/players/Karpov.zip',
    pgn: `[Event "Nice olm fin-A"]
[Site "Nice"]
[Date "1974.??.??"]
[Round "3"]
[White "Anatoly Karpov"]
[Black "Wolfgang Unzicker"]
[Result "1-0"]
[WhiteElo "2700"]
[BlackElo "2535"]
[ECO "C98"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Nc6 13. d5 Nd8 14. a4 Rb8 15. axb5 axb5 16. b4 Nb7 17. Nf1 Bd7 18. Be3 Ra8 19. Qd2 Rfc8 20. Bd3 g6 21. Ng3 Bf8 22. Ra2 c4 23. Bb1 Qd8 24. Ba7 Ne8 25. Bc2 Nc7 26. Rea1 Qe7 27. Bb1 Be8 28. Ne2 Nd8 29. Nh2 Bg7 30. f4 f6 31. f5 g5 32. Bc2 Bf7 33. Ng3 Nb7 34. Bd1 h6 35. Bh5 Qe8 36. Qd1 Nd8 37. Ra3 Kf8 38. R1a2 Kg8 39. Ng4 Kf8 40. Ne3 Kg8 41. Bxf7+ Nxf7 42. Qh5 Nd8 43. Qg6 Kh8 44. Nh5 1-0`
  },
  {
    id: 'anand-bologan-2000',
    title: 'Anand vs Bologan, 2000',
    event: 'FIDE WCh KO',
    year: 2000,
    white: 'V. Anand',
    black: 'V. Bologan',
    description: 'FIDE WCh KO, 2000. V. Anand wins in 42 moves. Opening: Ruy Lopez: Closed Defense. Listed as a notable game on Wikipedia (Viswanathan Anand).',
    source: 'en.wikipedia.org/wiki/Viswanathan_Anand; moves: pgnmentor.com/players/Anand.zip',
    pgn: `[Event "FIDE WCh KO"]
[Site "New Delhi IND"]
[Date "2000.12.01"]
[Round "2.2"]
[White "V. Anand"]
[Black "V. Bologan"]
[Result "1-0"]
[WhiteElo "2762"]
[BlackElo "2641"]
[ECO "C95"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 c5 15. d5 c4 16. Bg5 Qc7 17. Nf5 Kh8 18. g4 Ng8 19. Qd2 Nc5 20. Be3 Bc8 21. Ng3 Rb8 22. Kg2 a5 23. a3 Ne7 24. Rh1 Ng6 25. g5 b4 26. axb4 axb4 27. cxb4 Na6 28. Ra4 Nf4+ 29. Bxf4 exf4 30. Nh5 Qb6 31. Qxf4 Nxb4 32. Bb1 Rb7 33. Ra3 Rc7 34. Rd1 Na6 35. Nd4 Qxb2 36. Rg3 c3 37. Nf6 Re5 38. g6 fxg6 39. Nd7 Be7 40. Nxe5 dxe5 41. Qf7 h6 42. Qe8+ 1-0`
  },
  {
    id: 'carlsen-ernst-2004',
    title: 'Carlsen vs Ernst, 2004',
    event: 'GMC, round 12',
    year: 2004,
    white: 'M. Carlsen',
    black: 'S. Ernst',
    description: 'GMC, round 12, 2004. M. Carlsen wins in 29 moves. Opening: Caro-Kann: Classical. Listed as a notable game on Wikipedia (Magnus Carlsen).',
    source: 'en.wikipedia.org/wiki/Magnus_Carlsen; moves: pgnmentor.com/players/Carlsen.zip',
    pgn: `[Event "GMC"]
[Site "Wijk aan Zee NED"]
[Date "2004.01.24"]
[Round "12"]
[White "M. Carlsen"]
[Black "S. Ernst"]
[Result "1-0"]
[WhiteElo "2484"]
[BlackElo "2474"]
[ECO "B19"]

1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 e6 11. Bf4 Ngf6 12. O-O-O Be7 13. Ne4 Qa5 14. Kb1 O-O 15. Nxf6+ Nxf6 16. Ne5 Rad8 17. Qe2 c5 18. Ng6 fxg6 19. Qxe6+ Kh8 20. hxg6 Ng8 21. Bxh6 gxh6 22. Rxh6+ Nxh6 23. Qxe7 Nf7 24. gxf7 Kg7 25. Rd3 Rd6 26. Rg3+ Rg6 27. Qe5+ Kxf7 28. Qf5+ Rf6 29. Qd7# 1-0`
  },
  {
    id: 'gukesh-carlsen-2025',
    title: 'Gukesh vs Carlsen, 2025',
    event: '13th Norway Chess 2025',
    year: 2025,
    white: 'D. Gukesh',
    black: 'M. Carlsen',
    description: '13th Norway Chess 2025, 2025. D. Gukesh wins in 62 moves. Opening: Ruy Lopez: Berlin Defense. Listed as a notable game on Wikipedia (Gukesh Dommaraju).',
    source: 'en.wikipedia.org/wiki/Gukesh_Dommaraju; moves: pgnmentor.com/players/Gukesh.zip',
    pgn: `[Event "13th Norway Chess 2025"]
[Site "Stavanger NOR"]
[Date "2025.06.01"]
[Round "6.3"]
[White "D. Gukesh"]
[Black "M. Carlsen"]
[Result "1-0"]
[WhiteElo "2787"]
[BlackElo "2837"]
[ECO "C65"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. O-O d6 7. h3 a6 8. Ba4 h6 9. Re1 b5 10. Bc2 Bb6 11. Nbd2 Ne7 12. a4 Rb8 13. d4 Ng6 14. Nf1 c5 15. Ng3 cxd4 16. cxd4 bxa4 17. Bxa4 Bb7 18. d5 a5 19. Be3 Bc8 20. b3 Bxe3 21. Rxe3 Nf4 22. Bc6 Rb4 23. Qc2 g6 24. Kh1 Ba6 25. Qa2 Bd3 26. Nd2 h5 27. Qxa5 Qxa5 28. Rxa5 h4 29. Ra4 Rfb8 30. Ra2 Kg7 31. Ra7 Rd4 32. Nf3 hxg3 33. fxg3 Nxh3 34. gxh3 Bxe4 35. Kh2 Rd1 36. g4 Bxd5 37. Bxd5 Nxd5 38. Re2 Nf4 39. Rc2 Kf6 40. h4 Ke6 41. Ng5+ Kd5 42. Ra5+ Kd4 43. Ra4+ Kd3 44. Rf2 f6 45. Rf3+ Ke2 46. Ra2+ Rd2 47. Rxd2+ Kxd2 48. Ne4+ Ke2 49. Kg3 d5 50. Nxf6 Rf8 51. Rf2+ Ke1 52. Nd7 Ne2+ 53. Rxe2+ Kxe2 54. Nxf8 d4 55. Ne6 d3 56. Nc5 Ke3 57. Na4 e4 58. h5 gxh5 59. gxh5 Kd2 60. Nb2 e3 61. Nc4+ Ke2 62. Kf4 1-0`
  },
  {
    id: 'johner-nimzowitsch-1926',
    title: 'Johner vs Nimzowitsch, 1926',
    event: 'Dresden, round 2',
    year: 1926,
    white: 'Paul Johner',
    black: 'Aaron Nimzowitsch',
    description: 'Dresden, round 2, 1926. Aaron Nimzowitsch wins in 40 moves. Opening: Nimzo-Indian Defense. Listed as a notable game on Wikipedia (Aron Nimzowitsch).',
    source: 'en.wikipedia.org/wiki/Aron_Nimzowitsch; moves: pgnmentor.com/players/Nimzowitsch.zip',
    pgn: `[Event "Dresden"]
[Site "Dresden"]
[Date "1926.??.??"]
[Round "2"]
[White "Paul Johner"]
[Black "Aaron Nimzowitsch"]
[Result "0-1"]
[ECO "E50"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 c5 6. Nf3 Nc6 7. O-O Bxc3 8. bxc3 d6 9. Nd2 b6 10. Nb3 e5 11. f4 e4 12. Be2 Qd7 13. h3 Ne7 14. Qe1 h5 15. Bd2 Qf5 16. Kh2 Qh7 17. a4 Nf5 18. g3 a5 19. Rg1 Nh6 20. Bf1 Bd7 21. Bc1 Rac8 22. d5 Kh8 23. Nd2 Rg8 24. Bg2 g5 25. Nf1 Rg7 26. Ra2 Nf5 27. Bh1 Rcg8 28. Qd1 gxf4 29. exf4 Bc8 30. Qb3 Ba6 31. Re2 Nh4 32. Re3 Bc8 33. Qc2 Bxh3 34. Bxe4 Bf5 35. Bxf5 Nxf5 36. Re2 h4 37. Rgg2 hxg3+ 38. Kg1 Qh3 39. Ne3 Nh4 40. Kf1 Re8 0-1`
  },
  {
    id: 'rubinstein-hromadka-1923',
    title: 'Rubinstein vs Hromadka, 1923',
    event: 'Maehrisch Ostrau, round 4',
    year: 1923,
    white: 'Akiba Rubinstein',
    black: 'Karel Hromadka',
    description: 'Maehrisch Ostrau, round 4, 1923. Akiba Rubinstein wins in 29 moves. Opening: King\'s Gambit Declined. Listed as a notable game on Wikipedia (Akiba Rubinstein).',
    source: 'en.wikipedia.org/wiki/Akiba_Rubinstein; moves: pgnmentor.com/players/Rubinstein.zip',
    pgn: `[Event "Maehrisch Ostrau"]
[Site "Maehrisch Ostrau"]
[Date "1923.??.??"]
[Round "4"]
[White "Akiba Rubinstein"]
[Black "Karel Hromadka"]
[Result "1-0"]
[ECO "C30"]

1. e4 e5 2. f4 Bc5 3. Nf3 d6 4. Nc3 Nf6 5. Bc4 Nc6 6. d3 Bg4 7. h3 Bxf3 8. Qxf3 Nd4 9. Qg3 Qe7 10. fxe5 dxe5 11. Kd1 c6 12. a4 Rg8 13. Rf1 h6 14. Ne2 O-O-O 15. Nxd4 Bxd4 16. c3 Bb6 17. a5 Bc7 18. Be3 Kb8 19. Kc2 Ka8 20. Rf3 Nd5 21. Bg1 Nf4 22. Qf2 Bb8 23. g3 Nxh3 24. Rxf7 Qd6 25. Qb6 Rd7 26. Bc5 Rxf7 27. Bxd6 Rf2+ 28. Qxf2 Nxf2 29. Bc5 1-0`
  },
  {
    id: 'keres-alekhine-1937',
    title: 'Keres vs Alekhine, 1937',
    event: 'Margate, round 7',
    year: 1937,
    white: 'Paul Keres',
    black: 'Alexander Alekhine',
    description: 'Margate, round 7, 1937. Paul Keres wins in 23 moves. Opening: Ruy Lopez: Morphy Defense. Listed as a notable game on Wikipedia (Paul Keres).',
    source: 'en.wikipedia.org/wiki/Paul_Keres; moves: pgnmentor.com/players/Keres.zip',
    pgn: `[Event "Margate"]
[Site "Margate"]
[Date "1937.??.??"]
[Round "7"]
[White "Paul Keres"]
[Black "Alexander Alekhine"]
[Result "1-0"]
[ECO "C71"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. c4 Bd7 6. Nc3 g6 7. d4 Bg7 8. Be3 Nf6 9. dxe5 dxe5 10. Bc5 Nh5 11. Nd5 Nf4 12. Nxf4 exf4 13. e5 g5 14. Qd5 Bf8 15. Bxf8 Rxf8 16. O-O-O Qe7 17. Bxc6 Bxc6 18. Qd3 Bd7 19. Nxg5 O-O-O 20. Nf3 f6 21. exf6 Rxf6 22. Rhe1 Qb4 23. Qxd7+ 1-0`
  },
  {
    id: 'reti-rubinstein-1923',
    title: 'Reti vs Rubinstein, 1923',
    event: 'Karlsbad',
    year: 1923,
    white: 'Richard Reti',
    black: 'Akiba Rubinstein',
    description: 'Karlsbad, 1923. Richard Reti wins in 50 moves. Opening: Réti Opening. Listed as a notable game on Wikipedia (Richard Réti).',
    source: 'en.wikipedia.org/wiki/Richard_Réti; moves: pgnmentor.com/players/Reti.zip',
    pgn: `[Event "Karlsbad"]
[Site "Karlsbad"]
[Date "1923.??.??"]
[Round "?"]
[White "Richard Reti"]
[Black "Akiba Rubinstein"]
[Result "1-0"]
[ECO "A07"]

1. Nf3 d5 2. g3 Nf6 3. Bg2 g6 4. c4 d4 5. d3 Bg7 6. b4 O-O 7. Nbd2 c5 8. Nb3 cxb4 9. Bb2 Nc6 10. Nbxd4 Nxd4 11. Bxd4 b6 12. a3 Bb7 13. Bb2 bxa3 14. Rxa3 Qc7 15. Qa1 Ne8 16. Bxg7 Nxg7 17. O-O Ne6 18. Rb1 Bc6 19. d4 Be4 20. Rd1 a5 21. d5 Nc5 22. Nd4 Bxg2 23. Kxg2 Rfd8 24. Nc6 Rd6 25. Re3 Re8 26. Qe5 f6 27. Qb2 e5 28. Qb5 Kf7 29. Rb1 Nd7 30. f3 Rc8 31. Rd3 e4 32. fxe4 Ne5 33. Qxb6 Nxc6 34. c5 Rd7 35. dxc6 Rxd3 36. Qxc7+ Rxc7 37. exd3 Rxc6 38. Rb7+ Ke8 39. d4 Ra6 40. Rb6 Ra8 41. Rxf6 a4 42. Rf2 a3 43. Ra2 Kd7 44. d5 g5 45. Kf3 Ra4 46. Ke3 h5 47. h4 gxh4 48. gxh4 Ke7 49. Kf4 Kd7 50. Kf5 1-0`
  },
  {
    id: 'pachman-bronstein-1946',
    title: 'Pachman vs Bronstein, 1946',
    event: 'Moscow-Prague, round 2',
    year: 1946,
    white: 'Ludek Pachman',
    black: 'David Bronstein',
    description: 'Moscow-Prague, round 2, 1946. David Bronstein wins in 31 moves. Opening: Indian Game. Listed as a notable game on Wikipedia (David Bronstein).',
    source: 'en.wikipedia.org/wiki/David_Bronstein; moves: pgnmentor.com/players/Bronstein.zip',
    pgn: `[Event "Moscow-Prague"]
[Site "Moscow"]
[Date "1946.??.??"]
[Round "2"]
[White "Ludek Pachman"]
[Black "David Bronstein"]
[Result "0-1"]
[ECO "E68"]

1. d4 Nf6 2. c4 d6 3. Nc3 e5 4. Nf3 Nbd7 5. g3 g6 6. Bg2 Bg7 7. O-O O-O 8. b3 Re8 9. e4 exd4 10. Nxd4 Nc5 11. Re1 a5 12. Bb2 a4 13. Rc1 c6 14. Ba1 axb3 15. axb3 Qb6 16. h3 Nfd7 17. Rb1 Nf8 18. Kh2 h5 19. Re2 h4 20. Rd2 Rxa1 21. Rxa1 Bxd4 22. Rxd4 Nxb3 23. Rxd6 Qxf2 24. Ra2 Qxg3+ 25. Kh1 Qxc3 26. Ra3 Bxh3 27. Rxb3 Bxg2+ 28. Kxg2 Qxc4 29. Rd4 Qe6 30. Rxb7 Ra8 31. Qe2 h3+ 0-1`
  },
  {
    id: 'larsen-spassky-1964',
    title: 'Larsen vs Spassky, 1964',
    event: 'Amsterdam Interzonal, round 22',
    year: 1964,
    white: 'Bent Larsen',
    black: 'Boris Spassky',
    description: 'Amsterdam Interzonal, round 22, 1964. Bent Larsen wins in 60 moves. Opening: Bird\'s Opening: Dutch Variation. Listed as a notable game on Wikipedia (Bent Larsen).',
    source: 'en.wikipedia.org/wiki/Bent_Larsen; moves: pgnmentor.com/players/Larsen.zip',
    pgn: `[Event "Amsterdam Interzonal"]
[Site "Amsterdam"]
[Date "1964.??.??"]
[Round "22"]
[White "Bent Larsen"]
[Black "Boris Spassky"]
[Result "1-0"]
[ECO "A03"]

1. f4 d5 2. Nf3 Nf6 3. e3 g6 4. b4 Bg7 5. Bb2 O-O 6. Be2 Bg4 7. O-O c6 8. a4 Nbd7 9. Na3 Bxf3 10. Bxf3 Re8 11. d4 Ne4 12. Bxe4 dxe4 13. Nc4 Nb6 14. Na5 Nd5 15. Qe1 Qd7 16. c4 Nf6 17. b5 Qc7 18. Rb1 Ng4 19. bxc6 b6 20. Qe2 f5 21. Nb3 Qxc6 22. d5 Qxa4 23. Bxg7 Kxg7 24. Nd4 Rec8 25. h3 Nf6 26. Rfc1 Qd7 27. g4 Kf7 28. g5 Ne8 29. Qa2 Nd6 30. h4 Qe8 31. Ne6 Qh8 32. h5 h6 33. Rb2 gxh5 34. Rh2 hxg5 35. Nxg5+ Ke8 36. c5 Rxc5 37. Rxc5 bxc5 38. Qa4+ Kf8 39. Rg2 Re8 40. Qd7 Qh6 41. Qxa7 Qh8 42. Qd7 Qh6 43. Ne6+ Kf7 44. Ng5+ Kf8 45. Kh2 h4 46. Ne6+ Kf7 47. Ng5+ Kf8 48. Kh3 c4 49. Ne6+ Kf7 50. Ng5+ Kf8 51. Rg1 c3 52. Qe6 Qxe6 53. dxe6 Kg7 54. Nxe4+ Kh6 55. Nxc3 Ne4 56. Nxe4 fxe4 57. Kxh4 Ra8 58. f5 Ra2 59. Rg8 Rf2 60. Rf8 1-0`
  },
  {
    id: 'ivanchuk-kasparov-1991',
    title: 'Ivanchuk vs Kasparov, 1991',
    event: 'Linares, round 1',
    year: 1991,
    white: 'Vassily Ivanchuk',
    black: 'Gary Kasparov',
    description: 'Linares, round 1, 1991. Vassily Ivanchuk wins in 38 moves. Opening: Sicilian Defense. Listed as a notable game on Wikipedia (Vasyl Ivanchuk).',
    source: 'en.wikipedia.org/wiki/Vasyl_Ivanchuk; moves: pgnmentor.com/players/Ivanchuk.zip',
    pgn: `[Event "Linares"]
[Site "Linares"]
[Date "1991.??.??"]
[Round "1"]
[White "Vassily Ivanchuk"]
[Black "Gary Kasparov"]
[Result "1-0"]
[WhiteElo "2695"]
[BlackElo "2800"]
[ECO "B51"]

1. e4 c5 2. Nf3 d6 3. Bb5+ Nd7 4. d4 Nf6 5. O-O cxd4 6. Qxd4 a6 7. Bxd7+ Bxd7 8. Bg5 h6 9. Bxf6 gxf6 10. c4 e6 11. Nc3 Rc8 12. Kh1 h5 13. a4 h4 14. h3 Be7 15. b4 a5 16. b5 Qc7 17. Nd2 Qc5 18. Qd3 Rg8 19. Rae1 Qg5 20. Rg1 Qf4 21. Ref1 b6 22. Ne2 Qh6 23. c5 Rxc5 24. Nc4 Kf8 25. Nxb6 Be8 26. f4 f5 27. exf5 Rxf5 28. Rc1 Kg7 29. g4 Rc5 30. Rxc5 dxc5 31. Nc8 Bf8 32. Qd8 Qg6 33. f5 Qh6 34. g5 Qh5 35. Rg4 exf5 36. Nf4 Qh8 37. Qf6+ Kh7 38. Rxh4+ 1-0`
  },
  {
    id: 'polgar-anand-1999',
    title: 'Polgar vs Anand, 1999',
    event: 'Dos Hermanas, round 1',
    year: 1999,
    white: 'Judit Polgar',
    black: 'Viswanathan Anand',
    description: 'Dos Hermanas, round 1, 1999. Judit Polgar wins in 34 moves. Opening: Sicilian Najdorf. Listed as a notable game on Wikipedia (Judit Polgár).',
    source: 'en.wikipedia.org/wiki/Judit_Polgár; moves: pgnmentor.com/players/PolgarJ.zip',
    pgn: `[Event "Dos Hermanas"]
[Site "Dos Hermanas"]
[Date "1999.04.06"]
[Round "1"]
[White "Judit Polgar"]
[Black "Viswanathan Anand"]
[Result "1-0"]
[WhiteElo "2677"]
[BlackElo "2781"]
[ECO "B81"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e6 7. g4 e5 8. Nf5 g6 9. g5 gxf5 10. exf5 d5 11. Qf3 d4 12. O-O-O Nbd7 13. Bd2 dxc3 14. Bxc3 Bg7 15. Rg1 O-O 16. gxf6 Qxf6 17. Qe3 Kh8 18. f4 Qb6 19. Qg3 Qh6 20. Rd6 f6 21. Bd2 e4 22. Bc4 b5 23. Be6 Ra7 24. Rc6 a5 25. Be3 Rb7 26. Bd5 Rb8 27. Rc7 b4 28. b3 Rb5 29. Bc6 Rxf5 30. Rxc8 Rxc8 31. Bxd7 Rcc5 32. Bxf5 Rxf5 33. Rd1 Kg8 34. Qg2 1-0`
  },
  {
    id: 'stein-petrosian-1961',
    title: 'Stein vs Petrosian, 1961',
    event: 'URS-ch28',
    year: 1961,
    white: 'Leonid Stein',
    black: 'Tigran Petrosian',
    description: 'URS-ch28, 1961. Leonid Stein wins in 26 moves. Opening: French Defense: Winawer. Listed as a notable game on Wikipedia (Leonid Stein).',
    source: 'en.wikipedia.org/wiki/Leonid_Stein; moves: pgnmentor.com/players/Stein.zip',
    pgn: `[Event "URS-ch28"]
[Site "Moscow"]
[Date "1961.??.??"]
[Round "?"]
[White "Leonid Stein"]
[Black "Tigran Petrosian"]
[Result "1-0"]
[ECO "C18"]

1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Nf5 8. Bd3 h5 9. Qf4 Nc6 10. Ne2 Nce7 11. Ng3 Ng6 12. Qd2 Bd7 13. Rb1 Rb8 14. O-O c4 15. Be2 Nxg3 16. fxg3 h4 17. Bg4 hxg3 18. hxg3 Qe7 19. a4 Bxa4 20. Ra1 b5 21. Ba3 Qd7 22. Rf2 Rb7 23. Raf1 Qd8 24. Qd1 Rh6 25. Bc1 Rh7 26. Bxe6 1-0`
  },
  {
    id: 'kotov-geller-1949',
    title: 'Kotov vs Geller, 1949',
    event: 'URS-ch17',
    year: 1949,
    white: 'Alexander Kotov',
    black: 'Efim Geller',
    description: 'URS-ch17, 1949. Efim Geller wins in 40 moves. Opening: King\'s Indian Defense. Listed as a notable game on Wikipedia (Efim Geller).',
    source: 'en.wikipedia.org/wiki/Efim_Geller; moves: pgnmentor.com/players/Geller.zip',
    pgn: `[Event "URS-ch17"]
[Site "Moscow"]
[Date "1949.??.??"]
[Round "?"]
[White "Alexander Kotov"]
[Black "Efim Geller"]
[Result "0-1"]
[ECO "E68"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. g3 O-O 5. Bg2 d6 6. Nf3 Nbd7 7. O-O e5 8. e4 exd4 9. Nxd4 Nc5 10. f3 Nfd7 11. Be3 c6 12. Qd2 a5 13. Rad1 Ne5 14. b3 a4 15. Nde2 axb3 16. Bxc5 Nxc4 17. Qc1 bxa2 18. Nxa2 Qa5 19. Qxc4 Be6 20. Qc1 dxc5 21. Nac3 b5 22. Nb1 b4 23. Nf4 Bb3 24. Rd6 c4 25. Rxc6 c3 26. Nd5 Bxd5 27. exd5 Qxd5 28. f4 Qd4+ 29. Kh1 Ra2 30. Bf3 Rb2 31. f5 Be5 32. Qe1 Rd8 33. Be4 Kg7 34. f6+ Kg8 35. Ra6 h5 36. Ra5 h4 37. Bxg6 Rxh2+ 38. Kxh2 Bxg3+ 39. Qxg3 hxg3+ 40. Kh3 fxg6 0-1`
  },
  {
    id: 'schlechter-steinitz-1898',
    title: 'Schlechter vs Steinitz, 1898',
    event: 'DSB-11. Kongress, round 11',
    year: 1898,
    white: 'Carl Schlechter',
    black: 'William Steinitz',
    description: 'DSB-11. Kongress, round 11, 1898. Carl Schlechter wins in 24 moves. Opening: Vienna Game: Max Lange Defense. Listed as a notable game on Wikipedia (Carl Schlechter).',
    source: 'en.wikipedia.org/wiki/Carl_Schlechter; moves: pgnmentor.com/players/Schlechter.zip',
    pgn: `[Event "DSB-11. Kongress"]
[Site "Koeln"]
[Date "1898.??.??"]
[Round "11"]
[White "Carl Schlechter"]
[Black "William Steinitz"]
[Result "1-0"]
[ECO "C28"]

1. e4 e5 2. Nc3 Nc6 3. Bc4 Nf6 4. d3 Na5 5. Nge2 Nxc4 6. dxc4 d6 7. O-O Be6 8. b3 c6 9. Qd3 Be7 10. Bg5 h6 11. Bxf6 Bxf6 12. Rad1 Be7 13. c5 dxc5 14. Qg3 Bd6 15. Qxg7 Ke7 16. Nf4 Rg8 17. Ng6+ Kd7 18. Rxd6+ Kxd6 19. Rd1+ Bd5 20. Qxe5+ Kd7 21. Nxd5 cxd5 22. Rxd5+ Kc6 23. Ne7+ Kb6 24. Rd6+ 1-0`
  },
  {
    id: 'chigorin-zukertort-1883',
    title: 'Chigorin vs Zukertort, 1883',
    event: 'London, round 1',
    year: 1883,
    white: 'Mikhail Chigorin',
    black: 'Johannes Zukertort',
    description: 'London, round 1, 1883. Johannes Zukertort wins in 29 moves. Opening: Ruy Lopez: Berlin Defense. Listed as a notable game on Wikipedia (Johannes Zukertort).',
    source: 'en.wikipedia.org/wiki/Johannes_Zukertort; moves: pgnmentor.com/players/Chigorin.zip',
    pgn: `[Event "London"]
[Site "London"]
[Date "1883.??.??"]
[Round "1"]
[White "Mikhail Chigorin"]
[Black "Johannes Zukertort"]
[Result "0-1"]
[ECO "C67"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Be7 6. d5 Nd6 7. Bxc6 dxc6 8. dxc6 f6 9. cxb7 Bxb7 10. Be3 O-O 11. Nbd2 Nf7 12. Qe2 f5 13. Nb3 f4 14. Bc5 e4 15. Nfd4 f3 16. Qb5 Qc8 17. Rfd1 Ba6 18. Qa4 Ng5 19. Nxf3 exf3 20. Rd7 fxg2 21. Rxe7 Nh3+ 22. Kxg2 Nf4+ 23. Kf3 Qh3+ 24. Ke4 Bb7+ 25. Kd4 Ne6+ 26. Kc4 Rf4+ 27. Nd4 Nxc5 28. Kxc5 Qh5+ 29. Kc4 Rxd4+ 0-1`
  },
  {
    id: 'najdorf-stahlberg-1938',
    title: 'Najdorf vs Stahlberg, 1938',
    event: 'Lodz',
    year: 1938,
    white: 'Miguel Najdorf',
    black: 'Gideon Stahlberg',
    description: 'Lodz, 1938. Miguel Najdorf wins in 46 moves. Opening: Queen\'s Pawn Game. Listed as a notable game on Wikipedia (Miguel Najdorf).',
    source: 'en.wikipedia.org/wiki/Miguel_Najdorf; moves: pgnmentor.com/players/Najdorf.zip',
    pgn: `[Event "Lodz"]
[Site "Lodz"]
[Date "1938.??.??"]
[Round "?"]
[White "Miguel Najdorf"]
[Black "Gideon Stahlberg"]
[Result "1-0"]
[ECO "D40"]

1. d4 d5 2. Nf3 Nf6 3. c4 e6 4. Nc3 c5 5. e3 Nc6 6. a3 Ne4 7. Bd3 Nxc3 8. bxc3 Be7 9. O-O dxc4 10. Bxc4 O-O 11. e4 b6 12. Be3 Bb7 13. Qe2 Na5 14. Bd3 c4 15. Bc2 f5 16. exf5 exf5 17. Ne5 Bd5 18. Qh5 Qc8 19. a4 Nb7 20. f3 Nd6 21. Rfe1 Qb7 22. Bc1 Rae8 23. Re2 Qc8 24. Bf4 Rf6 25. Rae1 g6 26. Qh3 Bf8 27. Qg3 Rfe6 28. h4 Bg7 29. h5 Nf7 30. hxg6 hxg6 31. Kf2 Nxe5 32. Bxe5 Qd7 33. Rh1 Bxe5 34. Rxe5 Qg7 35. f4 Rxe5 36. fxe5 Be6 37. Bd1 a6 38. Bf3 b5 39. axb5 axb5 40. Qg5 Bf7 41. Bc6 Rb8 42. Qe7 b4 43. cxb4 c3 44. Qd6 Rf8 45. e6 Be8 46. e7 1-0`
  },
  {
    id: 'reshevsky-capablanca-1935',
    title: 'Reshevsky vs Capablanca, 1935',
    event: 'Margate, round 4',
    year: 1935,
    white: 'Samuel Reshevsky',
    black: 'Jose Capablanca',
    description: 'Margate, round 4, 1935. Samuel Reshevsky wins in 56 moves. Opening: Indian Game. Listed as a notable game on Wikipedia (Samuel Reshevsky).',
    source: 'en.wikipedia.org/wiki/Samuel_Reshevsky; moves: pgnmentor.com/players/Reshevsky.zip',
    pgn: `[Event "Margate"]
[Site "Margate"]
[Date "1935.??.??"]
[Round "4"]
[White "Samuel Reshevsky"]
[Black "Jose Capablanca"]
[Result "1-0"]
[ECO "D62"]

1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. Bg5 Nbd7 5. cxd5 exd5 6. e3 Be7 7. Bd3 O-O 8. Qc2 c5 9. Nf3 c4 10. Bf5 Re8 11. O-O g6 12. Bh3 Nf8 13. Bxc8 Rxc8 14. Bxf6 Bxf6 15. b3 Qa5 16. b4 Qd8 17. Qa4 a6 18. b5 Re6 19. Rab1 Rb8 20. Rb2 Be7 21. bxa6 Rxa6 22. Qc2 Ne6 23. Rfb1 Ra7 24. a4 Nc7 25. Ne5 Qe8 26. f4 f6 27. Ng4 Qd7 28. h3 Kg7 29. Nf2 Ba3 30. Ra2 Bd6 31. Nfd1 f5 32. Nb5 Ra5 33. Nxc7 Bxc7 34. Nc3 Qd6 35. Qf2 b6 36. Qf3 Rd8 37. Rab2 Qe7 38. Rb4 Rd7 39. Kh1 Bd8 40. g4 fxg4 41. hxg4 Qd6 42. Kg1 Bc7 43. Kf2 Rf7 44. g5 Bd8 45. Ke2 Bxg5 46. Rxb6 Qa3 47. Kd2 Be7 48. Rb7 Rxa4 49. Qxd5 Ra5 50. Qxc4 Rh5 51. Kd3 Qa8 52. Qe6 Qa3 53. Rd7 Rhf5 54. Rb3 Qa1 55. Rxe7 Qf1+ 56. Kd2 1-0`
  },
  {
    id: 'nezhmetdinov-tal-1961',
    title: 'Nezhmetdinov vs Tal, 1961',
    event: 'URS-ch29, round 15',
    year: 1961,
    white: 'Rashid Nezhmetdinov',
    black: 'Mihail Tal',
    description: 'URS-ch29, round 15, 1961. Rashid Nezhmetdinov wins in 29 moves. Opening: Sicilian Scheveningen: Classical. Listed as a notable game on Wikipedia (Rashid Nezhmetdinov).',
    source: 'en.wikipedia.org/wiki/Rashid_Nezhmetdinov; moves: pgnmentor.com/players/Tal.zip',
    pgn: `[Event "URS-ch29"]
[Site "Baku"]
[Date "1961.??.??"]
[Round "15"]
[White "Rashid Nezhmetdinov"]
[Black "Mihail Tal"]
[Result "1-0"]
[ECO "B84"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. Be2 a6 7. O-O Qc7 8. f4 Nbd7 9. g4 b5 10. a3 Bb7 11. Bf3 Nc5 12. Qe2 e5 13. Nf5 g6 14. fxe5 dxe5 15. Nh6 Ne6 16. Bg2 Bg7 17. Rxf6 Bxf6 18. Nd5 Qd8 19. Qf2 Nf4 20. Bxf4 exf4 21. e5 Bxe5 22. Re1 f6 23. Nxf6+ Qxf6 24. Qd4 Kf8 25. Rxe5 Qd8 26. Rf5+ gxf5 27. Qxh8+ Ke7 28. Qg7+ Ke6 29. gxf5+ 1-0`
  },
  {
    id: 'portisch-szabo-1958',
    title: 'Portisch vs Szabo, 1958',
    event: 'HUN-ch, round 15',
    year: 1958,
    white: 'Lajos Portisch',
    black: 'Laszlo Szabo',
    description: 'HUN-ch, round 15, 1958. Lajos Portisch wins in 28 moves. Opening: Grünfeld Defense: Exchange Variation. Listed as a notable game on Wikipedia (Lajos Portisch).',
    source: 'en.wikipedia.org/wiki/Lajos_Portisch; moves: pgnmentor.com/players/Portisch.zip',
    pgn: `[Event "HUN-ch"]
[Site "Budapest"]
[Date "1958.??.??"]
[Round "15"]
[White "Lajos Portisch"]
[Black "Laszlo Szabo"]
[Result "1-0"]
[ECO "D70"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nb6 6. Be3 Bg7 7. h3 O-O 8. Nf3 c6 9. Be2 Be6 10. O-O Bc4 11. Qd2 N8d7 12. Bh6 e5 13. Bxg7 Kxg7 14. Bxc4 Nxc4 15. Qe2 exd4 16. Nxd4 Ncb6 17. Rad1 Qh4 18. f4 Nf6 19. Qf3 Kg8 20. e5 Nfd5 21. Ne4 Nc4 22. Rc1 Ncb6 23. Nd6 Rab8 24. Rce1 f6 25. Ne6 fxe5 26. Nxf8 Rxf8 27. Rxe5 Nxf4 28. Nf5 1-0`
  },
  {
    id: 'spielmann-tartakower-1923',
    title: 'Spielmann vs Tartakower, 1923',
    event: 'Copenhagen',
    year: 1923,
    white: 'Rudolf Spielmann',
    black: 'Saviely Tartakower',
    description: 'Copenhagen, 1923. Saviely Tartakower wins in 33 moves. Opening: Caro-Kann: Exchange Variation. Listed as a notable game on Wikipedia (Savielly Tartakower).',
    source: 'en.wikipedia.org/wiki/Savielly_Tartakower; moves: pgnmentor.com/players/Spielmann.zip',
    pgn: `[Event "Copenhagen"]
[Site "Copenhagen"]
[Date "1923.??.??"]
[Round "?"]
[White "Rudolf Spielmann"]
[Black "Saviely Tartakower"]
[Result "0-1"]
[ECO "B13"]

1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c3 Nc6 5. Bf4 Nf6 6. Nd2 g6 7. Ngf3 Bg7 8. h3 Ne4 9. Nxe4 dxe4 10. Nd2 f5 11. Bc4 e5 12. dxe5 Nxe5 13. Bxe5 Bxe5 14. Qb3 Qb6 15. Bb5+ Ke7 16. Nc4 Qc5 17. Nxe5 Qxe5 18. O-O-O Be6 19. Bc4 Bxc4 20. Qxc4 Rhd8 21. Qb4+ Kf6 22. Qxb7 Qf4+ 23. Kb1 Qxf2 24. Qc6+ Kg5 25. h4+ Kg4 26. Rdf1 Qb6 27. Qc4 Rd2 28. b4 Qe3 29. Rh3 Qb6 30. Rhf3 Rxg2 31. Rf4+ Kg3 32. Qd5 Rc8 33. Qd7 Qa6 0-1`
  },
  {
    id: 'flohr-euwe-1932',
    title: 'Flohr vs Euwe, 1932',
    event: 'Amsterdam/Karlsbad m, round 1',
    year: 1932,
    white: 'Salo Flohr',
    black: 'Max Euwe',
    description: 'Amsterdam/Karlsbad m, round 1, 1932. Salo Flohr wins in 46 moves. Opening: Slav Defense: Three Knights. Listed as a notable game on Wikipedia (Salo Flohr).',
    source: 'en.wikipedia.org/wiki/Salo_Flohr; moves: pgnmentor.com/players/Flohr.zip',
    pgn: `[Event "Amsterdam/Karlsbad m"]
[Site "Amsterdam"]
[Date "1932.??.??"]
[Round "1"]
[White "Salo Flohr"]
[Black "Max Euwe"]
[Result "1-0"]
[ECO "D36"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 Nbd7 6. cxd5 exd5 7. e3 Be7 8. Bd3 O-O 9. Qc2 Re8 10. O-O Nf8 11. Ne5 Ng4 12. Bxe7 Qxe7 13. Nxg4 Bxg4 14. Rfe1 Rad8 15. Ne2 Rd6 16. Ng3 Rh6 17. Bf5 Qg5 18. Bxg4 Qxg4 19. h3 Qd7 20. b4 Ne6 21. Rab1 Nc7 22. a4 a6 23. Nf1 Re7 24. Nh2 Rhe6 25. Nf3 f6 26. Nd2 Re8 27. Nb3 R6e7 28. Nc5 Qc8 29. Rec1 Rd8 30. Nd3 Qb8 31. Nf4 Ne6 32. Nxe6 Rxe6 33. b5 axb5 34. axb5 cxb5 35. Rxb5 b6 36. Qb3 Qd6 37. Rb1 Rd7 38. Rxb6 Qxb6 39. Qxb6 Rxb6 40. Rxb6 Kf7 41. Kh2 Ke7 42. Kg3 Ra7 43. Kf4 g6 44. g4 Ra2 45. Rb7+ Ke6 46. Kg3 1-0`
  },
  {
    id: 'fine-botvinnik-1938',
    title: 'Fine vs Botvinnik, 1938',
    event: 'AVRO',
    year: 1938,
    white: 'Reuben Fine',
    black: 'Mikhail Botvinnik',
    description: 'AVRO, 1938. Reuben Fine wins in 31 moves. Opening: French Defense: Winawer. Listed as a notable game on Wikipedia (Reuben Fine).',
    source: 'en.wikipedia.org/wiki/Reuben_Fine; moves: pgnmentor.com/players/Botvinnik.zip',
    pgn: `[Event "AVRO"]
[Site "Holland"]
[Date "1938.??.??"]
[Round "?"]
[White "Reuben Fine"]
[Black "Mikhail Botvinnik"]
[Result "1-0"]
[ECO "C17"]

1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. dxc5 Ne7 6. Nf3 Nbc6 7. Bd3 d4 8. a3 Ba5 9. b4 Nxb4 10. axb4 Bxb4 11. Bb5+ Nc6 12. Bxc6+ bxc6 13. Ra4 Bxc3+ 14. Bd2 f6 15. O-O O-O 16. Bxc3 dxc3 17. Qe1 a5 18. Qxc3 Ba6 19. Rfa1 Bb5 20. Rd4 Qe7 21. Rd6 a4 22. Qe3 Ra7 23. Nd2 a3 24. c4 Ba4 25. exf6 Qxf6 26. Rxa3 Re8 27. h3 Raa8 28. Nf3 Qb2 29. Ne5 Qb1+ 30. Kh2 Qf5 31. Qg3 1-0`
  },
  {
    id: 'euwe-lasker-1934',
    title: 'Euwe vs Lasker, 1934',
    event: 'Zuerich',
    year: 1934,
    white: 'Max Euwe',
    black: 'Emanuel Lasker',
    description: 'Zuerich, 1934. Emanuel Lasker wins in 50 moves. Opening: Queen\'s Gambit Declined. Listed as a notable game on Wikipedia (Emanuel Lasker).',
    source: 'en.wikipedia.org/wiki/Emanuel_Lasker; moves: pgnmentor.com/players/Euwe.zip',
    pgn: `[Event "Zuerich"]
[Site "Zuerich"]
[Date "1934.??.??"]
[Round "?"]
[White "Max Euwe"]
[Black "Emanuel Lasker"]
[Result "0-1"]
[ECO "D64"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6 6. Nf3 Be7 7. Qc2 O-O 8. a3 Re8 9. Rc1 dxc4 10. Bxc4 Nd5 11. Bxe7 Qxe7 12. Ne4 N5f6 13. Ng3 c5 14. O-O cxd4 15. Nxd4 Nb6 16. Ba2 Rb8 17. e4 Rd8 18. Rfd1 Bd7 19. e5 Ne8 20. Bb1 g6 21. Qe4 Ba4 22. b3 Bd7 23. a4 Nd5 24. Bd3 Rbc8 25. Bc4 Bc6 26. Nxc6 bxc6 27. Rd3 Nb4 28. Rf3 Rc7 29. h4 Rcd7 30. h5 Qg5 31. Re1 Rd4 32. hxg6 hxg6 33. Qe2 Rd2 34. Qf1 Nc2 35. Ne4 Qxe5 36. Nf6+ Qxf6 37. Rxf6 Nxf6 38. Rc1 Ne4 39. Be2 Nd4 40. Bf3 Nxf2 41. Qc4 Nd3 42. Rf1 Ne5 43. Qb4 Nexf3+ 44. gxf3 Ne2+ 45. Kh2 Nf4+ 46. Kh1 R2d4 47. Qe7 Kg7 48. Qc7 R8d5 49. Re1 Rg5 50. Qxc6 Rd8 0-1`
  },
  {
    id: 'capablanca-spielmann-1927',
    title: 'Capablanca vs Spielmann, 1927',
    event: 'New York, round 3',
    year: 1927,
    white: 'Jose Capablanca',
    black: 'Rudolf Spielmann',
    description: 'New York, round 3, 1927. Jose Capablanca wins in 26 moves. Opening: Queen\'s Pawn Game. Listed as a notable game on Wikipedia (José Raúl Capablanca).',
    source: 'en.wikipedia.org/wiki/José_Raúl_Capablanca; moves: pgnmentor.com/players/Capablanca.zip',
    pgn: `[Event "New York"]
[Site "New York"]
[Date "1927.??.??"]
[Round "3"]
[White "Jose Capablanca"]
[Black "Rudolf Spielmann"]
[Result "1-0"]
[ECO "D38"]

1. d4 d5 2. Nf3 e6 3. c4 Nd7 4. Nc3 Ngf6 5. Bg5 Bb4 6. cxd5 exd5 7. Qa4 Bxc3+ 8. bxc3 O-O 9. e3 c5 10. Bd3 c4 11. Bc2 Qe7 12. O-O a6 13. Rfe1 Qe6 14. Nd2 b5 15. Qa5 Ne4 16. Nxe4 dxe4 17. a4 Qd5 18. axb5 Qxg5 19. Bxe4 Rb8 20. bxa6 Rb5 21. Qc7 Nb6 22. a7 Bh3 23. Reb1 Rxb1+ 24. Rxb1 f5 25. Bf3 f4 26. exf4 1-0`
  },
  {
    id: 'smyslov-geller-1951',
    title: 'Smyslov vs Geller, 1951',
    event: 'URS-ch19',
    year: 1951,
    white: 'Vassily Smyslov',
    black: 'Efim Geller',
    description: 'URS-ch19, 1951. Vassily Smyslov wins in 48 moves. Opening: Sicilian Defense: Closed. Listed as a notable game on Wikipedia (Vasily Smyslov).',
    source: 'en.wikipedia.org/wiki/Vasily_Smyslov; moves: pgnmentor.com/players/Smyslov.zip',
    pgn: `[Event "URS-ch19"]
[Site "Moscow"]
[Date "1951.??.??"]
[Round "?"]
[White "Vassily Smyslov"]
[Black "Efim Geller"]
[Result "1-0"]
[ECO "B26"]

1. e4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6 6. Be3 Rb8 7. Qd2 b5 8. Nd1 b4 9. h3 e6 10. Ne2 Nd4 11. O-O Ne7 12. Nxd4 cxd4 13. Bh6 O-O 14. Bxg7 Kxg7 15. f4 e5 16. b3 Qc7 17. a3 Nc6 18. Nb2 f6 19. f5 a5 20. h4 bxa3 21. Rxa3 Nb4 22. Nc4 gxf5 23. Rxa5 fxe4 24. dxe4 Be6 25. Rfa1 Bxc4 26. Ra7 Rb7 27. Rxb7 Qxb7 28. bxc4 Nc6 29. Kh2 Ra8 30. Rf1 Ra2 31. Rxf6 Qe7 32. Qh6+ Kg8 33. c5 Rxc2 34. cxd6 Qg7 35. d7 Qxh6 36. Rxh6 Nd8 37. Rd6 Kf7 38. g4 Ke7 39. Rd5 Nf7 40. g5 Rc6 41. Bh3 Rd6 42. Kg2 Rxd5 43. exd5 Nd6 44. h5 Ne4 45. g6 hxg6 46. hxg6 Nf6 47. d6+ Kd8 48. g7 1-0`
  },
  {
    id: 'spassky-fischer-1970',
    title: 'Spassky vs Fischer, 1970',
    event: 'Siegen olm, round 14',
    year: 1970,
    white: 'Boris Spassky',
    black: 'Robert Fischer',
    description: 'Siegen olm, round 14, 1970. Boris Spassky wins in 39 moves. Opening: Grünfeld Defense: Exchange Variation. Listed as a notable game on Wikipedia (Boris Spassky).',
    source: 'en.wikipedia.org/wiki/Boris_Spassky; moves: pgnmentor.com/players/Spassky.zip',
    pgn: `[Event "Siegen olm"]
[Site "Siegen"]
[Date "1970.??.??"]
[Round "14"]
[White "Boris Spassky"]
[Black "Robert Fischer"]
[Result "1-0"]
[ECO "D87"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 Nc6 9. Be3 O-O 10. O-O Qc7 11. Rc1 Rd8 12. h3 b6 13. f4 e6 14. Qe1 Na5 15. Bd3 f5 16. g4 fxe4 17. Bxe4 Bb7 18. Ng3 Nc4 19. Bxb7 Qxb7 20. Bf2 Qc6 21. Qe2 cxd4 22. cxd4 b5 23. Ne4 Bxd4 24. Ng5 Bxf2+ 25. Rxf2 Rd6 26. Re1 Qb6 27. Ne4 Rd4 28. Nf6+ Kh8 29. Qxe6 Rd6 30. Qe4 Rf8 31. g5 Rd2 32. Rf1 Qc7 33. Rxd2 Nxd2 34. Qd4 Rd8 35. Nd5+ Kg8 36. Rf2 Nc4 37. Re2 Rd6 38. Re8+ Kf7 39. Rf8+ 1-0`
  },
  {
    id: 'keres-botvinnik-1941',
    title: 'Keres vs Botvinnik, 1941',
    event: 'Leningrad/Moscow, round 1',
    year: 1941,
    white: 'Paul Keres',
    black: 'Mikhail Botvinnik',
    description: 'Leningrad/Moscow, round 1, 1941. Mikhail Botvinnik wins in 22 moves. Opening: Nimzo-Indian Defense: Classical. Listed as a notable game on Wikipedia (Mikhail Botvinnik).',
    source: 'en.wikipedia.org/wiki/Mikhail_Botvinnik; moves: pgnmentor.com/players/Keres.zip',
    pgn: `[Event "Leningrad/Moscow"]
[Site "Leningrad"]
[Date "1941.??.??"]
[Round "1"]
[White "Paul Keres"]
[Black "Mikhail Botvinnik"]
[Result "0-1"]
[ECO "E35"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. cxd5 exd5 6. Bg5 h6 7. Bh4 c5 8. O-O-O Bxc3 9. Qxc3 g5 10. Bg3 cxd4 11. Qxd4 Nc6 12. Qa4 Bf5 13. e3 Rc8 14. Bd3 Qd7 15. Kb1 Bxd3+ 16. Rxd3 Qf5 17. e4 Nxe4 18. Ka1 O-O 19. Rd1 b5 20. Qxb5 Nd4 21. Qd3 Nc2+ 22. Kb1 Nb4 0-1`
  },
  {
    id: 'spassky-tal-1958',
    title: 'Spassky vs Tal, 1958',
    event: 'URS-ch25',
    year: 1958,
    white: 'Boris Spassky',
    black: 'Mihail Tal',
    description: 'URS-ch25, 1958. Mihail Tal wins in 73 moves. Opening: Nimzo-Indian Defense. Listed as a notable game on Wikipedia (Mikhail Tal).',
    source: 'en.wikipedia.org/wiki/Mikhail_Tal; moves: pgnmentor.com/players/Spassky.zip',
    pgn: `[Event "URS-ch25"]
[Site "Riga"]
[Date "1958.??.??"]
[Round "?"]
[White "Boris Spassky"]
[Black "Mihail Tal"]
[Result "0-1"]
[ECO "E26"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. a3 Bxc3+ 5. bxc3 c5 6. e3 Nc6 7. Bd3 e5 8. Ne2 e4 9. Bb1 b6 10. Ng3 Ba6 11. f3 Bxc4 12. Nf5 O-O 13. Nd6 Bd3 14. Bxd3 exd3 15. Qxd3 cxd4 16. cxd4 Ne8 17. Nf5 d5 18. a4 Nd6 19. Nxd6 Qxd6 20. Ba3 Nb4 21. Qb3 a5 22. O-O Rfc8 23. Rac1 Qe6 24. Bxb4 axb4 25. Kf2 Qd6 26. h3 Kf8 27. Rc2 Rxc2+ 28. Qxc2 g6 29. Rc1 Qd7 30. Qc6 Qxc6 31. Rxc6 Ra6 32. a5 b3 33. axb6 b2 34. b7 b1=Q 35. Rc8+ Kg7 36. b8=Q Ra2+ 37. Kg3 Qe1+ 38. Kh2 Qxe3 39. Rg8+ Kf6 40. Qd6+ Qe6 41. Qf4+ Qf5 42. Qd6+ Qe6 43. Qg3 Qe3 44. h4 Re2 45. Qd6+ Qe6 46. Qf4+ Qf5 47. Qh6 Ke7 48. Qf8+ Kf6 49. Qg7+ Ke7 50. Ra8 Qd7 51. Qf8+ Kf6 52. Ra6+ Re6 53. Qh8+ Ke7 54. Ra8 Re1 55. Kg3 h5 56. Kf2 Re6 57. Rc8 Rd6 58. Qf8+ Kf6 59. Re8 Re6 60. Qh8+ Kf5 61. Qh6 Kf6 62. Qh8+ Kf5 63. Rd8 Qc6 64. Rc8 Qa6 65. Kg3 Qd6+ 66. Kh3 Re1 67. g3 Rg1 68. f4 Re1 69. Rc2 Qe6 70. Rf2 Rh1+ 71. Kg2 Qe4+ 72. Rf3 Kg4 73. Qc8+ f5 0-1`
  },
  {
    id: 'fischer-taimanov-1971',
    title: 'Fischer vs Taimanov, 1971',
    event: 'Candidats qf3, round 4',
    year: 1971,
    white: 'Robert Fischer',
    black: 'Mark Taimanov',
    description: 'Candidats qf3, round 4, 1971. Robert Fischer wins in 71 moves. Opening: Sicilian Defense: Old Sicilian. Listed as a notable game on Wikipedia (Bobby Fischer).',
    source: 'en.wikipedia.org/wiki/Bobby_Fischer; moves: pgnmentor.com/players/Fischer.zip',
    pgn: `[Event "Candidats qf3"]
[Site "Vancouver"]
[Date "1971.??.??"]
[Round "4"]
[White "Robert Fischer"]
[Black "Mark Taimanov"]
[Result "1-0"]
[WhiteElo "2740"]
[BlackElo "2620"]
[ECO "B47"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Qc7 5. Nc3 e6 6. g3 a6 7. Bg2 Nf6 8. O-O Nxd4 9. Qxd4 Bc5 10. Bf4 d6 11. Qd2 h6 12. Rad1 e5 13. Be3 Bg4 14. Bxc5 dxc5 15. f3 Be6 16. f4 Rd8 17. Nd5 Bxd5 18. exd5 e4 19. Rfe1 Rxd5 20. Rxe4+ Kd8 21. Qe2 Rxd1+ 22. Qxd1+ Qd7 23. Qxd7+ Kxd7 24. Re5 b6 25. Bf1 a5 26. Bc4 Rf8 27. Kg2 Kd6 28. Kf3 Nd7 29. Re3 Nb8 30. Rd3+ Kc7 31. c3 Nc6 32. Re3 Kd6 33. a4 Ne7 34. h3 Nc6 35. h4 h5 36. Rd3+ Kc7 37. Rd5 f5 38. Rd2 Rf6 39. Re2 Kd7 40. Re3 g6 41. Bb5 Rd6 42. Ke2 Kd8 43. Rd3 Kc7 44. Rxd6 Kxd6 45. Kd3 Ne7 46. Be8 Kd5 47. Bf7+ Kd6 48. Kc4 Kc6 49. Be8+ Kb7 50. Kb5 Nc8 51. Bc6+ Kc7 52. Bd5 Ne7 53. Bf7 Kb7 54. Bb3 Ka7 55. Bd1 Kb7 56. Bf3+ Kc7 57. Ka6 Nc8 58. Bd5 Ne7 59. Bc4 Nc6 60. Bf7 Ne7 61. Be8 Kd8 62. Bxg6 Nxg6 63. Kxb6 Kd7 64. Kxc5 Ne7 65. b4 axb4 66. cxb4 Nc8 67. a5 Nd6 68. b5 Ne4+ 69. Kb6 Kc8 70. Kc6 Kb8 71. b6 1-0`
  },
  {
    id: 'karpov-sax-1983',
    title: 'Karpov vs Sax, 1983',
    event: 'Linares',
    year: 1983,
    white: 'Anatoly Karpov',
    black: 'Gyula Sax',
    description: 'Linares, 1983. Anatoly Karpov wins in 39 moves. Opening: Sicilian Defense. Listed as a notable game on Wikipedia (Anatoly Karpov).',
    source: 'en.wikipedia.org/wiki/Anatoly_Karpov; moves: pgnmentor.com/players/Karpov.zip',
    pgn: `[Event "Linares"]
[Site "Linares"]
[Date "1983.??.??"]
[Round "?"]
[White "Anatoly Karpov"]
[Black "Gyula Sax"]
[Result "1-0"]
[WhiteElo "2710"]
[BlackElo "2560"]
[ECO "B81"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. g4 h6 7. Rg1 Be7 8. Be3 Nc6 9. Qe2 Bd7 10. h4 Nxd4 11. Bxd4 e5 12. Be3 Bc6 13. Qd3 Qa5 14. O-O-O Nxe4 15. Nxe4 d5 16. Qb3 dxe4 17. Bc4 Rf8 18. Rd5 Bxd5 19. Bxd5 Rd8 20. Bc4 Bb4 21. c3 b5 22. Be2 Bd6 23. Qd5 Ke7 24. Bc5 Bxc5 25. Qxe5+ Kd7 26. Qxc5 Qc7 27. Qf5+ Ke7 28. Qxe4+ Kd7 29. Qf5+ Ke7 30. Re1 Rd6 31. Bc4+ Kd8 32. Bxb5 a6 33. Ba4 g6 34. Qf3 Kc8 35. Re7 Rd1+ 36. Kxd1 Qxe7 37. Qa8+ Kc7 38. Qa7+ Kd6 39. Qb6+ 1-0`
  },
  {
    id: 'carlsen-kasparov-2004',
    title: 'Carlsen vs Kasparov, 2004',
    event: 'Rapid, round 1',
    year: 2004,
    white: 'M. Carlsen',
    black: 'G. Kasparov',
    description: 'Rapid, round 1, 2004. Drawn in 52 moves. Opening: Slav Defense: Three Knights. Listed as a notable game on Wikipedia (Magnus Carlsen).',
    source: 'en.wikipedia.org/wiki/Magnus_Carlsen; moves: pgnmentor.com/players/Carlsen.zip',
    pgn: `[Event "Rapid"]
[Site "Reykjavik ISL"]
[Date "2004.03.18"]
[Round "1.1"]
[White "M. Carlsen"]
[Black "G. Kasparov"]
[Result "1/2-1/2"]
[WhiteElo "2484"]
[BlackElo "2831"]
[ECO "D52"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 Nbd7 6. e3 Qa5 7. Nd2 Bb4 8. Qc2 O-O 9. Be2 e5 10. O-O exd4 11. Nb3 Qb6 12. exd4 dxc4 13. Bxc4 a5 14. a4 Qc7 15. Rae1 h6 16. Bh4 Bd6 17. h3 Nb6 18. Bxf6 Nxc4 19. Ne4 Bh2+ 20. Kh1 Nd6 21. Kxh2 Nxe4+ 22. Be5 Nd6 23. Qc5 Rd8 24. d5 Qd7 25. Nd4 Nf5 26. dxc6 bxc6 27. Nxc6 Re8 28. Rd1 Qe6 29. Rfe1 Bb7 30. Nd4 Nxd4 31. Qxd4 Qg6 32. Qg4 Qxg4 33. hxg4 Bc6 34. b3 f6 35. Bc3 Rxe1 36. Rxe1 Bd5 37. Rb1 Kf7 38. Kg3 Rb8 39. b4 axb4 40. Bxb4 Bc4 41. a5 Ba6 42. f3 Kg6 43. Kf4 h5 44. gxh5+ Kxh5 45. Rh1+ Kg6 46. Bc5 Rb2 47. Kg3 Ra2 48. Bb6 Kf7 49. Rc1 g5 50. Rc7+ Kg6 51. Rc6 Bf1 52. Bf2 1/2-1/2`
  },
  {
    id: 'gukesh-firouzja-2024',
    title: 'Gukesh vs Firouzja, 2024',
    event: 'FIDE Candidates 2024',
    year: 2024,
    white: 'D. Gukesh',
    black: 'Alireza Firouzja',
    description: 'FIDE Candidates 2024, 2024. D. Gukesh wins in 63 moves. Opening: Ruy Lopez: Berlin Defense. Listed as a notable game on Wikipedia (Gukesh Dommaraju).',
    source: 'en.wikipedia.org/wiki/Gukesh_Dommaraju; moves: pgnmentor.com/players/Gukesh.zip',
    pgn: `[Event "FIDE Candidates 2024"]
[Site "Toronto CAN"]
[Date "2024.04.20"]
[Round "13.4"]
[White "D. Gukesh"]
[Black "Alireza Firouzja"]
[Result "1-0"]
[WhiteElo "2743"]
[BlackElo "2760"]
[ECO "C65"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. O-O Nd4 6. Nxd4 Bxd4 7. Nd2 c6 8. Bc4 d6 9. c3 Bb6 10. Bb3 a5 11. Nc4 Ba7 12. Ne3 O-O 13. Qf3 d5 14. Bc2 g6 15. Re1 Be6 16. exd5 cxd5 17. h3 Re8 18. Ba4 e4 19. dxe4 dxe4 20. Qe2 Re7 21. Nf1 Qc7 22. Bb3 a4 23. Bxe6 Rxe6 24. Be3 a3 25. c4 Nh5 26. g3 Bc5 27. b3 f5 28. Bxc5 Qxc5 29. Rad1 Rf8 30. Rd5 Qe7 31. f4 Nf6 32. Rd2 g5 33. Ne3 gxf4 34. gxf4 Qf7 35. Kh2 Nh5 36. Qf2 Rg6 37. Rd5 Ng7 38. Red1 Rh6 39. Rg1 Rg6 40. Rgd1 Rh6 41. Rg1 Rg6 42. Qh4 Rxg1 43. Kxg1 Kh8 44. Kf2 Rg8 45. Qg5 Qg6 46. Qxg6 hxg6 47. Rd6 Re8 48. Rxg6 Ne6 49. Nd5 Nd4 50. Rb6 Nc2 51. Rxb7 Re6 52. Re7 Rh6 53. c5 Nd4 54. Kg2 Rg6+ 55. Kf2 Rh6 56. b4 Rxh3 57. Kg2 Rh6 58. Rb7 Kg8 59. b5 Kf8 60. b6 Rg6+ 61. Kf2 Rh6 62. Rc7 Rh2+ 63. Kg3 1-0`
  },
  {
    id: 'reti-nimzowitsch-1928',
    title: 'Reti vs Nimzowitsch, 1928',
    event: 'Berlin Tageblatt',
    year: 1928,
    white: 'Richard Reti',
    black: 'Aaron Nimzowitsch',
    description: 'Berlin Tageblatt, 1928. Aaron Nimzowitsch wins in 57 moves. Opening: Nimzo-Indian Defense: Classical. Listed as a notable game on Wikipedia (Aron Nimzowitsch).',
    source: 'en.wikipedia.org/wiki/Aron_Nimzowitsch; moves: pgnmentor.com/players/Reti.zip',
    pgn: `[Event "Berlin Tageblatt"]
[Site "Berlin"]
[Date "1928.??.??"]
[Round "?"]
[White "Richard Reti"]
[Black "Aaron Nimzowitsch"]
[Result "0-1"]
[ECO "E34"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. e3 c5 6. Nf3 Nc6 7. a3 Bxc3+ 8. bxc3 b6 9. Bd3 O-O 10. cxd5 exd5 11. O-O c4 12. Be2 Bg4 13. Re1 Bh5 14. Nd2 Bg6 15. Qd1 b5 16. f3 a5 17. e4 dxe4 18. Nxe4 Bxe4 19. fxe4 Nxe4 20. Qc2 f5 21. Bf3 Qf6 22. Rb1 b4 23. cxb4 Qxd4+ 24. Be3 Qd3 25. Qxd3 cxd3 26. b5 Ne5 27. Bxe4 fxe4 28. Bd4 Nc4 29. Rxe4 Nxa3 30. Re7 Rf4 31. Be5 Nxb1 32. Bxf4 Rd8 33. b6 d2 34. Bxd2 Nxd2 35. b7 Rf8 36. h3 Nc4 37. Re6 a4 38. Ra6 Ne5 39. Rxa4 Rb8 40. Rb4 Kf7 41. Kh2 Ke7 42. Rh4 h6 43. Rb4 Nf7 44. Rg4 g5 45. Re4+ Kf6 46. Rb4 Nd6 47. h4 Rxb7 48. hxg5+ hxg5 49. Ra4 Rb3 50. g3 Nf5 51. g4 Nh4 52. Ra5 Rc3 53. Ra8 Ke5 54. Rf8 Ke4 55. Rf7 Rd3 56. Rf8 Ng6 57. Rf5 Rd5 0-1`
  },
  {
    id: 'rubinstein-schlechter-1912',
    title: 'Rubinstein vs Schlechter, 1912',
    event: 'San Sebastian, round 13',
    year: 1912,
    white: 'Akiba Rubinstein',
    black: 'Carl Schlechter',
    description: 'San Sebastian, round 13, 1912. Akiba Rubinstein wins in 39 moves. Opening: Queen\'s Pawn Game. Listed as a notable game on Wikipedia (Akiba Rubinstein).',
    source: 'en.wikipedia.org/wiki/Akiba_Rubinstein; moves: pgnmentor.com/players/Rubinstein.zip',
    pgn: `[Event "San Sebastian"]
[Site "San Sebastian"]
[Date "1912.??.??"]
[Round "13"]
[White "Akiba Rubinstein"]
[Black "Carl Schlechter"]
[Result "1-0"]
[ECO "D41"]

1. d4 d5 2. Nf3 Nf6 3. c4 e6 4. Nc3 c5 5. cxd5 Nxd5 6. e4 Nxc3 7. bxc3 cxd4 8. cxd4 Bb4+ 9. Bd2 Qa5 10. Rb1 Bxd2+ 11. Qxd2 Qxd2+ 12. Kxd2 O-O 13. Bb5 a6 14. Bd3 Rd8 15. Rhc1 b5 16. Rc7 Nd7 17. Ke3 Nf6 18. Ne5 Bd7 19. g4 h6 20. f4 Be8 21. g5 hxg5 22. fxg5 Nh7 23. h4 Rdc8 24. Rbc1 Rxc7 25. Rxc7 Rd8 26. Ra7 f6 27. gxf6 gxf6 28. Ng4 Bh5 29. Nh6+ Kh8 30. Be2 Be8 31. Rxa6 Kg7 32. Ng4 f5 33. Ra7+ Kh8 34. Ne5 fxe4 35. Bxb5 Nf6 36. Bxe8 Rxe8 37. Kf4 Kg8 38. Kg5 Rf8 39. Kg6 1-0`
  },
  {
    id: 'keres-capablanca-1938',
    title: 'Keres vs Capablanca, 1938',
    event: 'AVRO',
    year: 1938,
    white: 'Paul Keres',
    black: 'Jose Capablanca',
    description: 'AVRO, 1938. Paul Keres wins in 38 moves. Opening: French Defense: Tarrasch Variation. Listed as a notable game on Wikipedia (Paul Keres).',
    source: 'en.wikipedia.org/wiki/Paul_Keres; moves: pgnmentor.com/players/Keres.zip',
    pgn: `[Event "AVRO"]
[Site "Holland"]
[Date "1938.??.??"]
[Round "?"]
[White "Paul Keres"]
[Black "Jose Capablanca"]
[Result "1-0"]
[ECO "C09"]

1. e4 e6 2. d4 d5 3. Nd2 c5 4. exd5 exd5 5. Ngf3 Nc6 6. Bb5 Qe7+ 7. Be2 cxd4 8. O-O Qc7 9. Nb3 Bd6 10. Nbxd4 a6 11. b3 Nge7 12. Bb2 O-O 13. Nxc6 bxc6 14. c4 Be6 15. Qc2 dxc4 16. Bxc4 Bxc4 17. Qxc4 Rfb8 18. h3 Rb5 19. Rac1 Rc8 20. Rfd1 Ng6 21. Nd4 Rb6 22. Ne6 Qb8 23. Ng5 Rb7 24. Qg4 Bf4 25. Rc4 Rb5 26. Nxf7 Re8 27. g3 Qc8 28. Rxf4 Qxg4 29. Rxg4 Kxf7 30. Rd7+ Re7 31. Rxe7+ Kxe7 32. Bxg7 Ra5 33. a4 Rc5 34. Rb4 Ke6 35. Kg2 h5 36. Rc4 Rxc4 37. bxc4 Kd6 38. f4 1-0`
  },
  {
    id: 'reti-alekhine-1924',
    title: 'Reti vs Alekhine, 1924',
    event: 'New York',
    year: 1924,
    white: 'Richard Reti',
    black: 'Alexander Alekhine',
    description: 'New York, 1924. Richard Reti wins in 31 moves. Opening: Réti Opening. Listed as a notable game on Wikipedia (Richard Réti).',
    source: 'en.wikipedia.org/wiki/Richard_Réti; moves: pgnmentor.com/players/Reti.zip',
    pgn: `[Event "New York"]
[Site "New York"]
[Date "1924.??.??"]
[Round "?"]
[White "Richard Reti"]
[Black "Alexander Alekhine"]
[Result "1-0"]
[ECO "A48"]

1. Nf3 g6 2. d4 Nf6 3. Bf4 Bg7 4. h3 c5 5. e3 b6 6. Nbd2 Bb7 7. Bd3 O-O 8. O-O d6 9. c3 Nbd7 10. Qe2 Rc8 11. a4 Re8 12. Ba6 Qc7 13. a5 cxd4 14. exd4 e5 15. dxe5 dxe5 16. Be3 Nd5 17. axb6 axb6 18. Bxb7 Qxb7 19. Rfd1 e4 20. Nd4 f5 21. Nb5 f4 22. Nd6 Qc6 23. Nxe8 Rxe8 24. Qc4 Ne5 25. Qxc6 Nxc6 26. Nc4 Nxc3 27. bxc3 fxe3 28. Nxe3 Bxc3 29. Rac1 Nd4 30. Kf1 Nb5 31. Rd5 1-0`
  },
  {
    id: 'bronstein-boleslavsky-1950',
    title: 'Bronstein vs Boleslavsky, 1950',
    event: 'Candidats Playoff 1pl, round 1',
    year: 1950,
    white: 'David Bronstein',
    black: 'Isaak Boleslavsky',
    description: 'Candidats Playoff 1pl, round 1, 1950. David Bronstein wins in 32 moves. Opening: Grünfeld Defense: Exchange Variation. Listed as a notable game on Wikipedia (David Bronstein).',
    source: 'en.wikipedia.org/wiki/David_Bronstein; moves: pgnmentor.com/players/Bronstein.zip',
    pgn: `[Event "Candidats Playoff 1pl"]
[Site "Moscow"]
[Date "1950.??.??"]
[Round "1"]
[White "David Bronstein"]
[Black "Isaak Boleslavsky"]
[Result "1-0"]
[ECO "D89"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 c5 7. Bc4 Bg7 8. Ne2 O-O 9. O-O cxd4 10. cxd4 Nc6 11. Be3 Bg4 12. f3 Na5 13. Bd3 Be6 14. d5 Bxa1 15. Qxa1 f6 16. Bh6 Qb6+ 17. Kh1 Rfd8 18. Rb1 Qc5 19. Bd2 b6 20. Bb4 Qc7 21. Rc1 Qb7 22. Qb1 Rab8 23. dxe6 Nc6 24. Bc3 Ne5 25. Bb5 Rbc8 26. Bxe5 Rxc1+ 27. Qxc1 fxe5 28. Bd7 Qa6 29. Ng3 Qxa2 30. h4 Rf8 31. Qg5 Rf6 32. Qxf6 1-0`
  },
  {
    id: 'bronstein-larsen-1964',
    title: 'Bronstein vs Larsen, 1964',
    event: 'Amsterdam Interzonal, round 19',
    year: 1964,
    white: 'David Bronstein',
    black: 'Bent Larsen',
    description: 'Amsterdam Interzonal, round 19, 1964. Bent Larsen wins in 30 moves. Opening: King\'s Indian Defense. Listed as a notable game on Wikipedia (Bent Larsen).',
    source: 'en.wikipedia.org/wiki/Bent_Larsen; moves: pgnmentor.com/players/Bronstein.zip',
    pgn: `[Event "Amsterdam Interzonal"]
[Site "Amsterdam"]
[Date "1964.??.??"]
[Round "19"]
[White "David Bronstein"]
[Black "Bent Larsen"]
[Result "0-1"]
[ECO "E75"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 c5 7. d5 e6 8. Nf3 h6 9. Bf4 exd5 10. exd5 Re8 11. Nd2 Nh5 12. Bg3 Bg4 13. O-O Nxg3 14. hxg3 Bxe2 15. Nxe2 Bxb2 16. Rb1 Bg7 17. Rxb7 Nd7 18. Nf4 Nb6 19. Re1 Bc3 20. Ne4 Bxe1 21. Ne6 Bxf2+ 22. Kxf2 fxe6 23. Qg4 Rf8+ 24. Kg1 Rf6 25. Qh3 Qf8 26. Ng5 Rf1+ 27. Kh2 Rf5 28. Nxe6 Rh5 29. Qxh5 gxh5 30. Nxf8 Rxf8 0-1`
  },
  {
    id: 'polgar-berkes-2003',
    title: 'Polgar vs Berkes, 2003',
    event: 'It, round 7',
    year: 2003,
    white: 'J. Polgar',
    black: 'F. Berkes',
    description: 'It, round 7, 2003. J. Polgar wins in 24 moves. Opening: French Defense: Classical. Listed as a notable game on Wikipedia (Judit Polgár).',
    source: 'en.wikipedia.org/wiki/Judit_Polgár; moves: pgnmentor.com/players/PolgarJ.zip',
    pgn: `[Event "It"]
[Site "Budapest HUN"]
[Date "2003.04.18"]
[Round "7"]
[White "J. Polgar"]
[Black "F. Berkes"]
[Result "1-0"]
[WhiteElo "2715"]
[BlackElo "2578"]
[ECO "C11"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 dxe4 5. Nxe4 Be7 6. Bxf6 Bxf6 7. Nf3 O-O 8. Qd2 Nd7 9. O-O-O Be7 10. Bd3 b6 11. Neg5 h6 12. Bh7+ Kh8 13. Be4 hxg5 14. g4 Rb8 15. h4 g6 16. hxg5+ Kg7 17. Qf4 Bb7 18. Rh7+ Kxh7 19. Qh2+ Kg8 20. Rh1 Bxg5+ 21. Nxg5 Qxg5+ 22. f4 Qxf4+ 23. Qxf4 Bxe4 24. Qxe4 1-0`
  },
  {
    id: 'stein-portisch-1962',
    title: 'Stein vs Portisch, 1962',
    event: 'Stockholm Interzonal, round 12',
    year: 1962,
    white: 'Leonid Stein',
    black: 'Lajos Portisch',
    description: 'Stockholm Interzonal, round 12, 1962. Leonid Stein wins in 21 moves. Opening: Sicilian Defense. Listed as a notable game on Wikipedia (Leonid Stein).',
    source: 'en.wikipedia.org/wiki/Leonid_Stein; moves: pgnmentor.com/players/Stein.zip',
    pgn: `[Event "Stockholm Interzonal"]
[Site "Stockholm"]
[Date "1962.??.??"]
[Round "12"]
[White "Leonid Stein"]
[Black "Lajos Portisch"]
[Result "1-0"]
[ECO "B42"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nf6 6. O-O Qc7 7. Nd2 Nc6 8. Nxc6 bxc6 9. f4 Bc5+ 10. Kh1 d6 11. Nf3 e5 12. fxe5 dxe5 13. Nh4 O-O 14. Nf5 Be6 15. Qe2 a5 16. Bc4 Kh8 17. Bg5 Nd7 18. Rad1 Nb6 19. Nxg7 Bxc4 20. Bf6 Be7 21. Qf3 1-0`
  },
  {
    id: 'petrosian-geller-1949',
    title: 'Petrosian vs Geller, 1949',
    event: 'URS-ch17',
    year: 1949,
    white: 'Tigran Petrosian',
    black: 'Efim Geller',
    description: 'URS-ch17, 1949. Efim Geller wins in 27 moves. Opening: Indian Game. Listed as a notable game on Wikipedia (Efim Geller).',
    source: 'en.wikipedia.org/wiki/Efim_Geller; moves: pgnmentor.com/players/Petrosian.zip',
    pgn: `[Event "URS-ch17"]
[Site "Moscow"]
[Date "1949.??.??"]
[Round "?"]
[White "Tigran Petrosian"]
[Black "Efim Geller"]
[Result "0-1"]
[ECO "E94"]

1. d4 Nf6 2. Nf3 g6 3. c4 Bg7 4. Nc3 O-O 5. e4 d6 6. Be2 e5 7. d5 Nbd7 8. O-O Nc5 9. Nd2 a5 10. Qc2 Bh6 11. Nb3 Bxc1 12. Nxc5 Bh6 13. Nd3 Nd7 14. a3 f5 15. b4 Nf6 16. Nb2 fxe4 17. c5 axb4 18. axb4 Rxa1 19. Rxa1 Bf5 20. Qb3 e3 21. f3 e4 22. Nc4 exf3 23. Bxf3 Ng4 24. g3 Qf6 25. Bg2 Bd3 26. h3 Qf2+ 27. Kh1 Qxg3 0-1`
  },
  {
    id: 'najdorf-keres-1939',
    title: 'Najdorf vs Keres, 1939',
    event: 'Buenos Aires Circulo',
    year: 1939,
    white: 'Miguel Najdorf',
    black: 'Paul Keres',
    description: 'Buenos Aires Circulo, 1939. Miguel Najdorf wins in 26 moves. Opening: Slav Defense. Listed as a notable game on Wikipedia (Miguel Najdorf).',
    source: 'en.wikipedia.org/wiki/Miguel_Najdorf; moves: pgnmentor.com/players/Najdorf.zip',
    pgn: `[Event "Buenos Aires Circulo"]
[Site "Buenos Aires"]
[Date "1939.??.??"]
[Round "?"]
[White "Miguel Najdorf"]
[Black "Paul Keres"]
[Result "1-0"]
[ECO "D94"]

1. d4 d5 2. c4 c6 3. e3 Nf6 4. Nf3 g6 5. Bd3 Bg7 6. O-O O-O 7. Nc3 dxc4 8. Bxc4 Nbd7 9. Qe2 Ne8 10. Bb3 e5 11. Nxe5 Nxe5 12. dxe5 Bxe5 13. f4 Bg7 14. e4 Be6 15. Bxe6 fxe6 16. e5 Nc7 17. Be3 Nd5 18. Ne4 b6 19. Rad1 Qe7 20. g3 Rad8 21. a3 Nc7 22. Rd6 c5 23. f5 exf5 24. Bg5 Qxe5 25. Bxd8 Ne6 26. Bf6 1-0`
  },
  {
    id: 'lasker-reshevsky-1936',
    title: 'Lasker vs Reshevsky, 1936',
    event: 'Nottingham',
    year: 1936,
    white: 'Emanuel Lasker',
    black: 'Samuel Reshevsky',
    description: 'Nottingham, 1936. Samuel Reshevsky wins in 22 moves. Opening: Queen\'s Gambit Accepted. Listed as a notable game on Wikipedia (Samuel Reshevsky).',
    source: 'en.wikipedia.org/wiki/Samuel_Reshevsky; moves: pgnmentor.com/players/Lasker.zip',
    pgn: `[Event "Nottingham"]
[Site "Nottingham"]
[Date "1936.??.??"]
[Round "?"]
[White "Emanuel Lasker"]
[Black "Samuel Reshevsky"]
[Result "0-1"]
[ECO "D27"]

1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. Nc3 a6 7. O-O b5 8. Bd3 cxd4 9. exd4 Bb7 10. Bg5 Be7 11. Qe2 O-O 12. Rad1 Nbd7 13. Ne5 Nd5 14. Bc1 Nxc3 15. bxc3 Nf6 16. a4 Qd5 17. Nf3 Rfc8 18. Bb2 Ne4 19. Rc1 Ng5 20. axb5 axb5 21. Bxb5 Nxf3+ 22. gxf3 Qg5+ 0-1`
  },
  {
    id: 'portisch-gligoric-1960',
    title: 'Portisch vs Gligoric, 1960',
    event: 'Madrid zt, round 6',
    year: 1960,
    white: 'Lajos Portisch',
    black: 'Svetozar Gligoric',
    description: 'Madrid zt, round 6, 1960. Lajos Portisch wins in 61 moves. Opening: King\'s Indian Defense: Mar del Plata. Listed as a notable game on Wikipedia (Lajos Portisch).',
    source: 'en.wikipedia.org/wiki/Lajos_Portisch; moves: pgnmentor.com/players/Portisch.zip',
    pgn: `[Event "Madrid zt"]
[Site "Madrid"]
[Date "1960.??.??"]
[Round "6"]
[White "Lajos Portisch"]
[Black "Svetozar Gligoric"]
[Result "1-0"]
[ECO "E99"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. f3 f5 11. g4 f4 12. Bd2 g5 13. Nd3 h5 14. h3 Rf6 15. Kf2 Rh6 16. Rh1 Ng6 17. Qg1 Nf6 18. Ke1 c5 19. a3 b6 20. b4 Bd7 21. bxc5 bxc5 22. Rb1 Rb8 23. Kf2 Bf8 24. Rxb8 Qxb8 25. Qb1 Qc7 26. Kg1 Be7 27. Nb5 Qb6 28. a4 a6 29. a5 Qb8 30. Nc3 Qxb1+ 31. Nxb1 Kf7 32. Bc3 hxg4 33. hxg4 Rxh1+ 34. Kxh1 Bxg4 35. fxg4 Nxe4 36. Kg1 Ng3 37. Bd1 e4 38. Nc1 Bf6 39. Ne2 Nxe2+ 40. Bxe2 Nh4 41. Bd1 e3 42. Be1 Bd4 43. Kh2 Kf6 44. Na3 Ng6 45. Be2 Bb2 46. Nb5 Ke7 47. Na7 Kd7 48. Nc6 Ne5 49. Nxe5+ dxe5 50. Bf3 Bc1 51. Kg2 Bd2 52. Kf1 Bc1 53. Ke2 Kd6 54. Kd3 Bb2 55. Be4 Ba3 56. Bf3 Bb4 57. Bc3 Ke7 58. Bxe5 Bxa5 59. Ke4 Bd2 60. Bd1 a5 61. Kf3 1-0`
  },
  {
    id: 'tartakower-rubinstein-1925',
    title: 'Tartakower vs Rubinstein, 1925',
    event: 'Moscow',
    year: 1925,
    white: 'Saviely Tartakower',
    black: 'Akiba Rubinstein',
    description: 'Moscow, 1925. Saviely Tartakower wins in 37 moves. Opening: Vienna Game: Max Lange Defense. Listed as a notable game on Wikipedia (Savielly Tartakower).',
    source: 'en.wikipedia.org/wiki/Savielly_Tartakower; moves: pgnmentor.com/players/Tartakower.zip',
    pgn: `[Event "Moscow"]
[Site "Moscow"]
[Date "1925.??.??"]
[Round "?"]
[White "Saviely Tartakower"]
[Black "Akiba Rubinstein"]
[Result "1-0"]
[ECO "C28"]

1. e4 e5 2. Nc3 Nc6 3. Bc4 Nf6 4. d3 Bc5 5. Be3 d6 6. Bxc5 dxc5 7. Nge2 Na5 8. Bb3 Nxb3 9. axb3 O-O 10. O-O Ng4 11. h3 Nh6 12. f4 exf4 13. Nxf4 f6 14. Qf3 Nf7 15. Rf2 Ne5 16. Qg3 c6 17. Nh5 Qe7 18. Raf1 Kh8 19. Nd1 Bd7 20. Ne3 Rad8 21. Nf5 Bxf5 22. exf5 Qd7 23. Rf4 Rfe8 24. Kh1 Re7 25. Re4 Rde8 26. Qh4 Kg8 27. Qf2 b6 28. Rfe1 Kh8 29. R1e3 Kg8 30. Rg3 Kh8 31. Rxg7 Rxg7 32. Nxf6 Qe7 33. Nxe8 Qxe8 34. Qf4 Re7 35. f6 Ng6 36. Rxe7 Nxe7 37. f7 1-0`
  },
  {
    id: 'botvinnik-flohr-1933',
    title: 'Botvinnik vs Flohr, 1933',
    event: 'Moscow/Leningrad m, round 1',
    year: 1933,
    white: 'Mikhail Botvinnik',
    black: 'Salo Flohr',
    description: 'Moscow/Leningrad m, round 1, 1933. Salo Flohr wins in 40 moves. Opening: Caro-Kann: Panov-Botvinnik Attack. Listed as a notable game on Wikipedia (Salo Flohr).',
    source: 'en.wikipedia.org/wiki/Salo_Flohr; moves: pgnmentor.com/players/Botvinnik.zip',
    pgn: `[Event "Moscow/Leningrad m"]
[Site "Leningrad"]
[Date "1933.??.??"]
[Round "1"]
[White "Mikhail Botvinnik"]
[Black "Salo Flohr"]
[Result "0-1"]
[ECO "B13"]

1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 Nc6 6. Bg5 dxc4 7. d5 Ne5 8. Qd4 Nd3+ 9. Bxd3 cxd3 10. Bxf6 exf6 11. Qxd3 Bd6 12. Nge2 O-O 13. O-O Re8 14. Rad1 Bg4 15. Rd2 a6 16. Ng3 Rc8 17. h3 Bd7 18. Rfd1 g6 19. Re2 Rxe2 20. Ngxe2 f5 21. Nd4 Qe7 22. Qd2 Re8 23. Nf3 Qf6 24. Re1 Rxe1+ 25. Nxe1 b5 26. a3 Kg7 27. Nf3 Bc8 28. Kf1 Bb7 29. b4 Kf8 30. Ke2 a5 31. Qd4 Qxd4 32. Nxd4 axb4 33. Ncxb5 bxa3 34. Nxd6 a2 35. Nc2 Ba6+ 36. Ke3 Ke7 37. Nxf7 Kxf7 38. Kd4 Bf1 39. h4 Bxg2 40. Kc5 f4 0-1`
  },
  {
    id: 'fine-flohr-1938',
    title: 'Fine vs Flohr, 1938',
    event: 'AVRO',
    year: 1938,
    white: 'Reuben Fine',
    black: 'Salo Flohr',
    description: 'AVRO, 1938. Reuben Fine wins in 28 moves. Opening: French Defense: Winawer. Listed as a notable game on Wikipedia (Reuben Fine).',
    source: 'en.wikipedia.org/wiki/Reuben_Fine; moves: pgnmentor.com/players/Flohr.zip',
    pgn: `[Event "AVRO"]
[Site "Holland"]
[Date "1938.??.??"]
[Round "?"]
[White "Reuben Fine"]
[Black "Salo Flohr"]
[Result "1-0"]
[ECO "C17"]

1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. Bd2 Ne7 6. Nf3 Nf5 7. dxc5 Bxc5 8. Bd3 Nh4 9. O-O Nc6 10. Re1 h6 11. Na4 Bf8 12. Rc1 Bd7 13. Nxh4 Qxh4 14. c4 dxc4 15. Rxc4 Qd8 16. Qh5 Ne7 17. Rd4 g6 18. Qf3 Qc7 19. Nc3 Nf5 20. Nb5 Qb6 21. Rxd7 Kxd7 22. g4 Nh4 23. Qxf7+ Be7 24. Bb4 Rae8 25. Bxe7 Rxe7 26. Qf6 a6 27. Rd1 axb5 28. Be4+ 1-0`
  },
  {
    id: 'capablanca-lilienthal-1936',
    title: 'Capablanca vs Lilienthal, 1936',
    event: 'Moscow',
    year: 1936,
    white: 'Jose Capablanca',
    black: 'Andor Lilienthal',
    description: 'Moscow, 1936. Jose Capablanca wins in 54 moves. Opening: Réti Opening: Advance Variation. Listed as a notable game on Wikipedia (José Raúl Capablanca).',
    source: 'en.wikipedia.org/wiki/José_Raúl_Capablanca; moves: pgnmentor.com/players/Capablanca.zip',
    pgn: `[Event "Moscow"]
[Site "Moscow"]
[Date "1936.??.??"]
[Round "?"]
[White "Jose Capablanca"]
[Black "Andor Lilienthal"]
[Result "1-0"]
[ECO "A12"]

1. Nf3 d5 2. c4 c6 3. b3 Bf5 4. Bb2 e6 5. g3 Nf6 6. Bg2 Nbd7 7. O-O h6 8. d3 Be7 9. Nbd2 O-O 10. Rc1 a5 11. a3 Re8 12. Rc2 Bh7 13. Qa1 Bf8 14. Re1 Qb6 15. Bh3 Bc5 16. Rf1 Bf8 17. Rcc1 Rad8 18. Rfe1 Bc5 19. Rf1 Bf8 20. Bg2 Bd6 21. Ne5 Bxe5 22. Bxe5 Nxe5 23. Qxe5 Nd7 24. Qb2 Nf6 25. b4 axb4 26. Qxb4 Qxb4 27. axb4 Ra8 28. Ra1 Nd7 29. Nb3 Kf8 30. Ra5 dxc4 31. dxc4 Nb6 32. Rxa8 Rxa8 33. Na5 Ra7 34. Rd1 Ke8 35. Nxb7 Rxb7 36. Bxc6+ Rd7 37. c5 Ke7 38. Bxd7 Nxd7 39. c6 Nb6 40. c7 Bf5 41. Rd8 e5 42. Rb8 Nc8 43. b5 Kd6 44. b6 Ne7 45. Rf8 Bc8 46. Rxf7 Nd5 47. Rxg7 Nxb6 48. Rh7 Nd5 49. Rxh6+ Kxc7 50. e4 Ne7 51. f3 Kd7 52. h4 Ke8 53. Rf6 Ng8 54. Rc6 1-0`
  },
  {
    id: 'keres-smyslov-1953',
    title: 'Keres vs Smyslov, 1953',
    event: 'Candidats Tournament, round 24',
    year: 1953,
    white: 'Paul Keres',
    black: 'Vassily Smyslov',
    description: 'Candidats Tournament, round 24, 1953. Vassily Smyslov wins in 28 moves. Opening: English Opening: Anglo-Indian. Listed as a notable game on Wikipedia (Vasily Smyslov).',
    source: 'en.wikipedia.org/wiki/Vasily_Smyslov; moves: pgnmentor.com/players/Keres.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Zuerich"]
[Date "1953.??.??"]
[Round "24"]
[White "Paul Keres"]
[Black "Vassily Smyslov"]
[Result "0-1"]
[ECO "E14"]

1. c4 Nf6 2. Nc3 e6 3. Nf3 c5 4. e3 Be7 5. b3 O-O 6. Bb2 b6 7. d4 cxd4 8. exd4 d5 9. Bd3 Nc6 10. O-O Bb7 11. Rc1 Rc8 12. Re1 Nb4 13. Bf1 Ne4 14. a3 Nxc3 15. Rxc3 Nc6 16. Ne5 Nxe5 17. Rxe5 Bf6 18. Rh5 g6 19. Rch3 dxc4 20. Rxh7 c3 21. Qc1 Qxd4 22. Qh6 Rfd8 23. Bc1 Bg7 24. Qg5 Qf6 25. Qg4 c2 26. Be2 Rd4 27. f4 Rd1+ 28. Bxd1 Qd4+ 0-1`
  },
  {
    id: 'spassky-fischer-1972-2',
    title: 'Spassky vs Fischer, 1972',
    event: 'World Championship 28th, round 11',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Robert Fischer',
    description: 'World Championship 28th, round 11, 1972. Boris Spassky wins in 31 moves. Opening: Sicilian Najdorf: Poisoned Pawn. Listed as a notable game on Wikipedia (Boris Spassky).',
    source: 'en.wikipedia.org/wiki/Boris_Spassky; moves: pgnmentor.com/players/Spassky.zip',
    pgn: `[Event "World Championship 28th"]
[Site "Reykjavik"]
[Date "1972.??.??"]
[Round "11"]
[White "Boris Spassky"]
[Black "Robert Fischer"]
[Result "1-0"]
[WhiteElo "2660"]
[BlackElo "2785"]
[ECO "B97"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2 9. Nb3 Qa3 10. Bxf6 gxf6 11. Be2 h5 12. O-O Nc6 13. Kh1 Bd7 14. Nb1 Qb4 15. Qe3 d5 16. exd5 Ne7 17. c4 Nf5 18. Qd3 h4 19. Bg4 Nd6 20. N1d2 f5 21. a3 Qb6 22. c5 Qb5 23. Qc3 fxg4 24. a4 h3 25. axb5 hxg2+ 26. Kxg2 Rh3 27. Qf6 Nf5 28. c6 Bc8 29. dxe6 fxe6 30. Rfe1 Be7 31. Rxe6 1-0`
  },
  {
    id: 'denker-botvinnik-1945',
    title: 'Denker vs Botvinnik, 1945',
    event: 'USA-URS radio-m, round 1',
    year: 1945,
    white: 'Arnold Denker',
    black: 'Mikhail Botvinnik',
    description: 'USA-URS radio-m, round 1, 1945. Mikhail Botvinnik wins in 25 moves. Opening: Queen\'s Gambit Declined. Listed as a notable game on Wikipedia (Mikhail Botvinnik).',
    source: 'en.wikipedia.org/wiki/Mikhail_Botvinnik; moves: pgnmentor.com/players/Botvinnik.zip',
    pgn: `[Event "USA-URS radio-m"]
[Site "URS"]
[Date "1945.??.??"]
[Round "1"]
[White "Arnold Denker"]
[Black "Mikhail Botvinnik"]
[Result "0-1"]
[ECO "D44"]

1. d4 d5 2. c4 e6 3. Nc3 c6 4. Nf3 Nf6 5. Bg5 dxc4 6. e4 b5 7. e5 h6 8. Bh4 g5 9. Nxg5 hxg5 10. Bxg5 Nbd7 11. exf6 Bb7 12. Be2 Qb6 13. O-O O-O-O 14. a4 b4 15. Ne4 c5 16. Qb1 Qc7 17. Ng3 cxd4 18. Bxc4 Qc6 19. f3 d3 20. Qc1 Bc5+ 21. Kh1 Qd6 22. Qf4 Rxh2+ 23. Kxh2 Rh8+ 24. Qh4 Rxh4+ 25. Bxh4 Qf4 0-1`
  },
  {
    id: 'tal-smyslov-1959',
    title: 'Tal vs Smyslov, 1959',
    event: 'Candidats Tournament, round 8',
    year: 1959,
    white: 'Mihail Tal',
    black: 'Vassily Smyslov',
    description: 'Candidats Tournament, round 8, 1959. Mihail Tal wins in 26 moves. Opening: Caro-Kann Defense. Listed as a notable game on Wikipedia (Mikhail Tal).',
    source: 'en.wikipedia.org/wiki/Mikhail_Tal; moves: pgnmentor.com/players/Tal.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "8"]
[White "Mihail Tal"]
[Black "Vassily Smyslov"]
[Result "1-0"]
[ECO "B10"]

1. e4 c6 2. d3 d5 3. Nd2 e5 4. Ngf3 Nd7 5. d4 dxe4 6. Nxe4 exd4 7. Qxd4 Ngf6 8. Bg5 Be7 9. O-O-O O-O 10. Nd6 Qa5 11. Bc4 b5 12. Bd2 Qa6 13. Nf5 Bd8 14. Qh4 bxc4 15. Qg5 Nh5 16. Nh6+ Kh8 17. Qxh5 Qxa2 18. Bc3 Nf6 19. Qxf7 Qa1+ 20. Kd2 Rxf7 21. Nxf7+ Kg8 22. Rxa1 Kxf7 23. Ne5+ Ke6 24. Nxc6 Ne4+ 25. Ke3 Bb6+ 26. Bd4 1-0`
  },
  {
    id: 'fischer-petrosian-1971',
    title: 'Fischer vs Petrosian, 1971',
    event: 'Candidats final, round 7',
    year: 1971,
    white: 'Robert Fischer',
    black: 'Tigran Petrosian',
    description: 'Candidats final, round 7, 1971. Robert Fischer wins in 34 moves. Opening: Sicilian Defense. Listed as a notable game on Wikipedia (Bobby Fischer).',
    source: 'en.wikipedia.org/wiki/Bobby_Fischer; moves: pgnmentor.com/players/Fischer.zip',
    pgn: `[Event "Candidats final"]
[Site "Buenos Aires"]
[Date "1971.??.??"]
[Round "7"]
[White "Robert Fischer"]
[Black "Tigran Petrosian"]
[Result "1-0"]
[WhiteElo "2760"]
[BlackElo "2640"]
[ECO "B42"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nc6 6. Nxc6 bxc6 7. O-O d5 8. c4 Nf6 9. cxd5 cxd5 10. exd5 exd5 11. Nc3 Be7 12. Qa4+ Qd7 13. Re1 Qxa4 14. Nxa4 Be6 15. Be3 O-O 16. Bc5 Rfe8 17. Bxe7 Rxe7 18. b4 Kf8 19. Nc5 Bc8 20. f3 Rea7 21. Re5 Bd7 22. Nxd7+ Rxd7 23. Rc1 Rd6 24. Rc7 Nd7 25. Re2 g6 26. Kf2 h5 27. f4 h4 28. Kf3 f5 29. Ke3 d4+ 30. Kd2 Nb6 31. Ree7 Nd5 32. Rf7+ Ke8 33. Rb7 Nxb4 34. Bc4 1-0`
  },
  {
    id: 'carlsen-topalov-2009',
    title: 'Carlsen vs Topalov, 2009',
    event: '5th MTel Masters, round 1',
    year: 2009,
    white: 'M. Carlsen',
    black: 'V. Topalov',
    description: '5th MTel Masters, round 1, 2009. M. Carlsen wins in 36 moves. Opening: Slav Defense: Three Knights. Listed as a notable game on Wikipedia (Magnus Carlsen).',
    source: 'en.wikipedia.org/wiki/Magnus_Carlsen; moves: pgnmentor.com/players/Carlsen.zip',
    pgn: `[Event "5th MTel Masters"]
[Site "Sofia BUL"]
[Date "2009.05.13"]
[Round "1"]
[White "M. Carlsen"]
[Black "V. Topalov"]
[Result "1-0"]
[WhiteElo "2770"]
[BlackElo "2812"]
[ECO "D43"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 h6 6. Bxf6 Qxf6 7. e3 Nd7 8. Bd3 dxc4 9. Bxc4 g6 10. O-O Bg7 11. e4 O-O 12. e5 Qe7 13. Qe2 b5 14. Bd3 Bb7 15. Be4 Rfd8 16. Rac1 Rab8 17. Rfd1 a6 18. h4 Ba8 19. Rc2 Rdc8 20. Rdc1 Qf8 21. a4 c5 22. axb5 cxd4 23. Nxd4 Bxe4 24. Nxe4 Rxc2 25. Rxc2 axb5 26. Nc6 Rb6 27. f4 Qa8 28. Ne7+ Kh7 29. h5 Ra6 30. hxg6+ fxg6 31. Rc7 Ra1+ 32. Kf2 Qd8 33. Qd3 Qxe7 34. Rxd7 Qh4+ 35. Kf3 Qh5+ 36. Kg3 1-0`
  },
  {
    id: 'gukesh-yi-2024',
    title: 'Gukesh vs Yi, 2024',
    event: '45th Olympiad 2024, round 7',
    year: 2024,
    white: 'D. Gukesh',
    black: 'Wei Yi',
    description: '45th Olympiad 2024, round 7, 2024. D. Gukesh wins in 80 moves. Opening: Sicilian Defense. Listed as a notable game on Wikipedia (Gukesh Dommaraju).',
    source: 'en.wikipedia.org/wiki/Gukesh_Dommaraju; moves: pgnmentor.com/players/Gukesh.zip',
    pgn: `[Event "45th Olympiad 2024"]
[Site "Budapest HUN"]
[Date "2024.09.18"]
[Round "7.1"]
[White "D. Gukesh"]
[Black "Wei Yi"]
[Result "1-0"]
[WhiteElo "2764"]
[BlackElo "2762"]
[ECO "B50"]

1. e4 c5 2. Nf3 d6 3. Nc3 Nf6 4. Be2 e5 5. Bc4 Be7 6. d3 Nc6 7. Bg5 O-O 8. Bxf6 Bxf6 9. Nd5 Be6 10. Qd2 a6 11. O-O b5 12. Bb3 Kh8 13. a3 Rb8 14. h3 g6 15. c3 Bg7 16. Ba2 f5 17. Ng5 Bg8 18. exf5 gxf5 19. f4 c4 20. dxc4 bxc4 21. Bxc4 exf4 22. Nf3 Na5 23. Ba2 Nb3 24. Bxb3 Rxb3 25. Nxf4 Qb6+ 26. Rf2 Rb8 27. Rd1 Rxb2 28. Qxb2 Qxb2 29. Rxb2 Rxb2 30. Rxd6 a5 31. Rd8 Bxc3 32. Nd5 Rb1+ 33. Kf2 Rd1 34. Rxg8+ Kxg8 35. Nxc3 Rc1 36. Nb5 Rc2+ 37. Kf1 Kf7 38. Nfd4 Rc1+ 39. Ke2 Kf6 40. Nd6 Rc3 41. N6b5 Rc1 42. Ke3 Rg1 43. Kf2 Rc1 44. Ne2 Rb1 45. Nbc3 Rb3 46. a4 Ke5 47. g3 Rb6 48. Ke3 Rb4 49. Kd3 h6 50. Ke3 Rb3 51. Kd3 Rb4 52. Ng1 Rb8 53. Nf3+ Kf6 54. Nd4 Rd8 55. Ke3 Rc8 56. Kd3 Rd8 57. Ne2 Rb8 58. Nf4 Rb1 59. Nd5+ Ke5 60. Nc3 Rh1 61. Nf3+ Kd6 62. h4 Rh3 63. Ne2 f4 64. Nfg1 Rh1 65. gxf4 Rxh4 66. Nf3 Rh1 67. f5 h5 68. Nc3 h4 69. Ne4+ Kd7 70. Ne5+ Kd8 71. f6 h3 72. f7 Rf1 73. Ng5 h2 74. Ngf3 Ke7 75. Nxh2 Ra1 76. Nhg4 Ra3+ 77. Kd2 Rxa4 78. Nh6 Ra2+ 79. Ke3 Ra3+ 80. Ke4 1-0`
  },
  {
    id: 'euwe-keres-1940',
    title: 'Euwe vs Keres, 1940',
    event: 'NLD m 3940, round 9',
    year: 1940,
    white: 'Max Euwe',
    black: 'Paul Keres',
    description: 'NLD m 3940, round 9, 1940. Paul Keres wins in 34 moves. Opening: Queen\'s Indian Defense: Classical. Listed as a notable game on Wikipedia (Paul Keres).',
    source: 'en.wikipedia.org/wiki/Paul_Keres; moves: pgnmentor.com/players/Euwe.zip',
    pgn: `[Event "NLD m 3940"]
[Site "NLD"]
[Date "1940.??.??"]
[Round "9"]
[White "Max Euwe"]
[Black "Paul Keres"]
[Result "0-1"]
[ECO "E19"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. Nc3 Ne4 8. Qc2 Nxc3 9. Qxc3 d6 10. Qc2 f5 11. Ne1 Qc8 12. e4 Nd7 13. d5 fxe4 14. Qxe4 Nc5 15. Qe2 Bf6 16. Bh3 Re8 17. Be3 Qd8 18. Bxc5 exd5 19. Be6+ Kh8 20. Rd1 dxc5 21. Ng2 d4 22. f4 d3 23. Rxd3 Qxd3 24. Qxd3 Bd4+ 25. Rf2 Rxe6 26. Kf1 Rae8 27. f5 Re5 28. f6 gxf6 29. Rd2 Bc8 30. Nf4 Re3 31. Qb1 Rf3+ 32. Kg2 Rxf4 33. gxf4 Rg8+ 34. Kf3 Bg4+ 0-1`
  },
  {
    id: 'bronstein-botvinnik-1951',
    title: 'Bronstein vs Botvinnik, 1951',
    event: 'World Championship 19th, round 22',
    year: 1951,
    white: 'David Bronstein',
    black: 'Mikhail Botvinnik',
    description: 'World Championship 19th, round 22, 1951. David Bronstein wins in 38 moves. Listed as a notable game on Wikipedia (David Bronstein).',
    source: 'en.wikipedia.org/wiki/David_Bronstein; moves: pgnmentor.com/players/Bronstein.zip',
    pgn: `[Event "World Championship 19th"]
[Site "Moscow"]
[Date "1951.??.??"]
[Round "22"]
[White "David Bronstein"]
[Black "Mikhail Botvinnik"]
[Result "1-0"]
[ECO "A91"]

1. d4 e6 2. c4 f5 3. g3 Nf6 4. Bg2 Be7 5. Nc3 O-O 6. e3 d5 7. Nge2 c6 8. b3 Ne4 9. O-O Nd7 10. Bb2 Ndf6 11. Qd3 g5 12. cxd5 exd5 13. f3 Nxc3 14. Bxc3 g4 15. fxg4 Nxg4 16. Bh3 Nh6 17. Nf4 Bd6 18. b4 a6 19. a4 Qe7 20. Rab1 b5 21. Bg2 Ng4 22. Bd2 Nf6 23. Rb2 Bd7 24. Ra1 Ne4 25. Be1 Rfe8 26. Qb3 Kh8 27. Rba2 Qf8 28. Nd3 Rab8 29. axb5 axb5 30. Ra7 Re7 31. Ne5 Be8 32. g4 fxg4 33. Bxe4 dxe4 34. Bh4 Rxe5 35. dxe5 Bxe5 36. Rf1 Qg8 37. Bg3 Bg7 38. Qxg8+ 1-0`
  },
  {
    id: 'gligoric-larsen-1965',
    title: 'Gligoric vs Larsen, 1965',
    event: 'Zagreb, round 3',
    year: 1965,
    white: 'Svetozar Gligoric',
    black: 'Bent Larsen',
    description: 'Zagreb, round 3, 1965. Bent Larsen wins in 24 moves. Opening: Sicilian Defense. Listed as a notable game on Wikipedia (Bent Larsen).',
    source: 'en.wikipedia.org/wiki/Bent_Larsen; moves: pgnmentor.com/players/Gligoric.zip',
    pgn: `[Event "Zagreb"]
[Site "Zagreb"]
[Date "1965.??.??"]
[Round "3"]
[White "Svetozar Gligoric"]
[Black "Bent Larsen"]
[Result "0-1"]
[ECO "B83"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 d6 6. Be3 Nf6 7. Be2 Be7 8. O-O O-O 9. f4 Bd7 10. Qe1 Nxd4 11. Bxd4 Bc6 12. Bd3 Nd7 13. Rd1 e5 14. fxe5 dxe5 15. Bf2 Bc5 16. Bc4 Qb6 17. Nd5 Qxb2 18. Bxc5 Nxc5 19. Rxf7 Rxf7 20. Ne7+ Kf8 21. Bxf7 Qb6 22. Qh4 Nxe4+ 23. Kf1 Kxf7 24. Nxc6 Qxc6 0-1`
  },
  {
    id: 'polgar-short-1994',
    title: 'Polgar vs Short, 1994',
    event: 'PCA/Intel-GP, round 1',
    year: 1994,
    white: 'Judit Polgar',
    black: 'Nigel Short',
    description: 'PCA/Intel-GP, round 1, 1994. Judit Polgar wins in 33 moves. Opening: French Defense: Classical. Listed as a notable game on Wikipedia (Judit Polgár).',
    source: 'en.wikipedia.org/wiki/Judit_Polgár; moves: pgnmentor.com/players/PolgarJ.zip',
    pgn: `[Event "PCA/Intel-GP"]
[Site "New York"]
[Date "1994.??.??"]
[Round "1"]
[White "Judit Polgar"]
[Black "Nigel Short"]
[Result "1-0"]
[WhiteElo "2630"]
[BlackElo "2655"]
[ECO "C11"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. Nce2 c5 6. c3 Nc6 7. f4 cxd4 8. cxd4 f5 9. Nf3 Nb6 10. h3 Be7 11. g4 Bh4+ 12. Nxh4 Qxh4+ 13. Kd2 Qf2 14. b3 Nxd4 15. Kc3 Qf3+ 16. Kb2 Qxh1 17. Nxd4 Qh2+ 18. Kb1 O-O 19. a4 a5 20. Ra2 Qg3 21. Rg2 Qc3 22. gxf5 exf5 23. Bb2 Qc7 24. e6 Rf6 25. Nxf5 Rg6 26. Be5 Qd8 27. Nxg7 d4 28. f5 Rxg2 29. Bxg2 Qg5 30. Qh5 Qxh5 31. Nxh5 Ra6 32. Bxd4 Na8 33. Bd5 1-0`
  },
  {
    id: 'spassky-stein-1964',
    title: 'Spassky vs Stein, 1964',
    event: 'URS-ch31 playoff-1pl, round 1',
    year: 1964,
    white: 'Boris Spassky',
    black: 'Leonid Stein',
    description: 'URS-ch31 playoff-1pl, round 1, 1964. Leonid Stein wins in 33 moves. Opening: Grünfeld Defense: Exchange Variation. Listed as a notable game on Wikipedia (Leonid Stein).',
    source: 'en.wikipedia.org/wiki/Leonid_Stein; moves: pgnmentor.com/players/Spassky.zip',
    pgn: `[Event "URS-ch31 playoff-1pl"]
[Site "URS"]
[Date "1964.??.??"]
[Round "1"]
[White "Boris Spassky"]
[Black "Leonid Stein"]
[Result "0-1"]
[ECO "D86"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 O-O 8. Ne2 Nc6 9. h4 Na5 10. Bb3 c5 11. h5 Nxb3 12. axb3 cxd4 13. cxd4 Bd7 14. hxg6 hxg6 15. Qd3 Qb6 16. Bd2 Rfc8 17. Ra5 a6 18. Rc5 Rxc5 19. dxc5 Qc7 20. Bc3 e5 21. b4 Rd8 22. Qg3 Bb5 23. f4 Qd7 24. Kf2 Bxe2 25. Kxe2 a5 26. Kf2 axb4 27. Bxe5 Bxe5 28. fxe5 Qd4+ 29. Kf3 Qd3+ 30. Kf4 Qd2+ 31. Kg4 Rd4 32. Rf1 Rxe4+ 33. Kh3 Qh6+ 0-1`
  },
  {
    id: 'geller-sokolsky-1950',
    title: 'Geller vs Sokolsky, 1950',
    event: 'URS-ch18',
    year: 1950,
    white: 'Efim Geller',
    black: 'Alexey Sokolsky',
    description: 'URS-ch18, 1950. Efim Geller wins in 25 moves. Opening: French Defense: Winawer. Listed as a notable game on Wikipedia (Efim Geller).',
    source: 'en.wikipedia.org/wiki/Efim_Geller; moves: pgnmentor.com/players/Geller.zip',
    pgn: `[Event "URS-ch18"]
[Site "Moscow"]
[Date "1950.??.??"]
[Round "?"]
[White "Efim Geller"]
[Black "Alexey Sokolsky"]
[Result "1-0"]
[ECO "C18"]

1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 cxd4 8. Bd3 Qc7 9. Ne2 dxc3 10. Qxg7 Rg8 11. Qxh7 Qxe5 12. Bf4 Qf6 13. h4 Nbc6 14. Bg5 Qe5 15. Qh6 Bd7 16. Qf6 Rc8 17. f4 Qe3 18. h5 e5 19. h6 e4 20. Bb5 Rxg5 21. h7 Bg4 22. Qxg5 Qd2+ 23. Kf1 Bxe2+ 24. Bxe2 Nd4 25. h8=Q+ 1-0`
  },
  {
    id: 'guimard-najdorf-1941',
    title: 'Guimard vs Najdorf, 1941',
    event: 'Buenos Aires Circulo, round 12',
    year: 1941,
    white: 'Carlos Guimard',
    black: 'Miguel Najdorf',
    description: 'Buenos Aires Circulo, round 12, 1941. Miguel Najdorf wins in 51 moves. Opening: Slav Defense: Main Line. Listed as a notable game on Wikipedia (Miguel Najdorf).',
    source: 'en.wikipedia.org/wiki/Miguel_Najdorf; moves: pgnmentor.com/players/Najdorf.zip',
    pgn: `[Event "Buenos Aires Circulo"]
[Site "Buenos Aires"]
[Date "1941.??.??"]
[Round "12"]
[White "Carlos Guimard"]
[Black "Miguel Najdorf"]
[Result "0-1"]
[ECO "D94"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 g6 5. cxd5 cxd5 6. Nc3 Bg7 7. Bb5+ Nbd7 8. Qb3 e6 9. O-O O-O 10. Bd3 Nb8 11. Ne5 Nfd7 12. f4 Nxe5 13. fxe5 a6 14. Bd2 Nc6 15. Rf3 b5 16. Raf1 Bd7 17. Ne2 a5 18. Qd1 b4 19. Qe1 f6 20. exf6 Rxf6 21. Rxf6 Bxf6 22. Qf2 Kg7 23. Nf4 Bh4 24. g3 Bf6 25. Qf3 Qe7 26. h4 Rf8 27. Kg2 Qe8 28. Be1 Bd8 29. Bb5 Kg8 30. Qd1 Ne7 31. Bxd7 Qxd7 32. Qd3 Bc7 33. a3 Bd6 34. axb4 axb4 35. Qa6 Nf5 36. Bf2 Rc8 37. Qd3 Bxf4 38. exf4 Qc6 39. Qe2 Kf7 40. Re1 h5 41. Ra1 Qc2 42. Ra7+ Ne7 43. Qe5 Qe4+ 44. Qxe4 dxe4 45. Be1 Rc2+ 46. Kf1 Kf6 47. Bxb4 Nd5 48. Bd6 Kf5 49. b4 Kg4 50. Ke1 Kf3 51. Ra3+ Ne3 0-1`
  },
  {
    id: 'botvinnik-reshevsky-1948',
    title: 'Botvinnik vs Reshevsky, 1948',
    event: 'World Championship 18th, round 14',
    year: 1948,
    white: 'Mikhail Botvinnik',
    black: 'Samuel Reshevsky',
    description: 'World Championship 18th, round 14, 1948. Samuel Reshevsky wins in 42 moves. Opening: Nimzo-Indian Defense: Huebner. Listed as a notable game on Wikipedia (Samuel Reshevsky).',
    source: 'en.wikipedia.org/wiki/Samuel_Reshevsky; moves: pgnmentor.com/players/Botvinnik.zip',
    pgn: `[Event "World Championship 18th"]
[Site "NLD/URS"]
[Date "1948.??.??"]
[Round "14"]
[White "Mikhail Botvinnik"]
[Black "Samuel Reshevsky"]
[Result "0-1"]
[ECO "E29"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. a3 Bxc3+ 6. bxc3 Nc6 7. Bd3 O-O 8. Ne2 b6 9. e4 Ne8 10. Be3 d6 11. O-O Na5 12. Ng3 Ba6 13. Qe2 Qd7 14. f4 f5 15. Rae1 g6 16. Rd1 Qf7 17. e5 Rc8 18. Rfe1 dxe5 19. dxe5 Ng7 20. Nf1 Rfd8 21. Bf2 Nh5 22. Bg3 Qe8 23. Ne3 Qa4 24. Qa2 Nxg3 25. hxg3 h5 26. Be2 Kf7 27. Kf2 Qb3 28. Qxb3 Nxb3 29. Bd3 Ke7 30. Ke2 Na5 31. Rd2 Rc7 32. g4 Rcd7 33. gxf5 gxf5 34. Red1 h4 35. Ke1 Nb3 36. Nd5+ exd5 37. Bxf5 Nxd2 38. Rxd2 dxc4 39. Bxd7 Rxd7 40. Rf2 Ke6 41. Rf3 Rd3 42. Ke2 0-1`
  },
  {
    id: 'portisch-stein-1964',
    title: 'Portisch vs Stein, 1964',
    event: 'Amsterdam Interzonal, round 4',
    year: 1964,
    white: 'Lajos Portisch',
    black: 'Leonid Stein',
    description: 'Amsterdam Interzonal, round 4, 1964. Lajos Portisch wins in 38 moves. Opening: Benoni Defense. Listed as a notable game on Wikipedia (Lajos Portisch).',
    source: 'en.wikipedia.org/wiki/Lajos_Portisch; moves: pgnmentor.com/players/Portisch.zip',
    pgn: `[Event "Amsterdam Interzonal"]
[Site "Amsterdam"]
[Date "1964.??.??"]
[Round "4"]
[White "Lajos Portisch"]
[Black "Leonid Stein"]
[Result "1-0"]
[ECO "E92"]

1. d4 Nf6 2. c4 c5 3. d5 d6 4. Nc3 g6 5. e4 Bg7 6. Nf3 O-O 7. Be2 e5 8. Bg5 h6 9. Bd2 Nh5 10. Qc1 Kh7 11. h4 Nf4 12. Bxf4 exf4 13. Qxf4 f5 14. Qd2 fxe4 15. Nxe4 Qe7 16. Bd3 Bg4 17. O-O-O Bxf3 18. gxf3 Nd7 19. f4 Qf7 20. h5 Qxf4 21. hxg6+ Kg8 22. Qxf4 Rxf4 23. Nxd6 Ne5 24. b3 Rxf2 25. Bc2 b6 26. Nf5 b5 27. Rde1 Re8 28. d6 Bf6 29. cxb5 h5 30. Rhg1 Rxf5 31. Bxf5 Kg7 32. d7 Rd8 33. Re4 h4 34. Rd1 Nf3 35. Re8 Bg5+ 36. Kb1 Nd4 37. Bh3 Kxg6 38. Rg1 1-0`
  },
  {
    id: 'tartakower-mieses-1925',
    title: 'Tartakower vs Mieses, 1925',
    event: 'Baden-Baden',
    year: 1925,
    white: 'Saviely Tartakower',
    black: 'Jacques Mieses',
    description: 'Baden-Baden, 1925. Saviely Tartakower wins in 15 moves. Opening: Dutch Defense. Listed as a notable game on Wikipedia (Savielly Tartakower).',
    source: 'en.wikipedia.org/wiki/Savielly_Tartakower; moves: pgnmentor.com/players/Tartakower.zip',
    pgn: `[Event "Baden-Baden"]
[Site "Baden-Baden"]
[Date "1925.??.??"]
[Round "?"]
[White "Saviely Tartakower"]
[Black "Jacques Mieses"]
[Result "1-0"]
[ECO "A82"]

1. d4 f5 2. e4 fxe4 3. Nc3 Nf6 4. g4 d5 5. g5 Ng8 6. f3 exf3 7. Qxf3 e6 8. Bd3 g6 9. Nge2 Qe7 10. Bf4 c6 11. Be5 Bg7 12. Qg3 Na6 13. O-O Bd7 14. Bd6 Qd8 15. Qf4 1-0`
  },
  {
    id: 'flohr-kashdan-1933',
    title: 'Flohr vs Kashdan, 1933',
    event: 'Folkestone ol, round 15',
    year: 1933,
    white: 'Salo Flohr',
    black: 'Isaac Kashdan',
    description: 'Folkestone ol, round 15, 1933. Salo Flohr wins in 30 moves. Opening: English Opening: Anglo-Indian. Listed as a notable game on Wikipedia (Salo Flohr).',
    source: 'en.wikipedia.org/wiki/Salo_Flohr; moves: pgnmentor.com/players/Flohr.zip',
    pgn: `[Event "Folkestone ol"]
[Site "Folkestone"]
[Date "1933.??.??"]
[Round "15"]
[White "Salo Flohr"]
[Black "Isaac Kashdan"]
[Result "1-0"]
[ECO "A18"]

1. c4 Nf6 2. Nc3 e6 3. e4 d5 4. e5 d4 5. exf6 dxc3 6. bxc3 Qxf6 7. d4 b6 8. Nf3 Bb7 9. Be2 Nd7 10. O-O Bd6 11. Bg5 Qf5 12. Qa4 c6 13. c5 bxc5 14. dxc5 Qxc5 15. Rfd1 Be7 16. Rxd7 Kxd7 17. Be3 Qa3 18. Qd4+ Ke8 19. Qxg7 Rf8 20. Ng5 Rd8 21. Bh5 Bxg5 22. Bxg5 Rd5 23. c4 Rxg5 24. Qxg5 Kd7 25. Rd1+ Kc8 26. Bxf7 Kb8 27. Bxe6 Qxa2 28. Rd8+ Kc7 29. Qe7+ Kb6 30. c5+ 1-0`
  },
  {
    id: 'kan-capablanca-1936',
    title: 'Kan vs Capablanca, 1936',
    event: 'Moscow',
    year: 1936,
    white: 'Ilia Kan',
    black: 'Jose Capablanca',
    description: 'Moscow, 1936. Jose Capablanca wins in 57 moves. Opening: Vienna Game. Listed as a notable game on Wikipedia (José Raúl Capablanca).',
    source: 'en.wikipedia.org/wiki/José_Raúl_Capablanca; moves: pgnmentor.com/players/Capablanca.zip',
    pgn: `[Event "Moscow"]
[Site "Moscow"]
[Date "1936.??.??"]
[Round "?"]
[White "Ilia Kan"]
[Black "Jose Capablanca"]
[Result "0-1"]
[ECO "C25"]

1. e4 e5 2. Nc3 Bc5 3. Nf3 d6 4. Na4 Bb6 5. Nxb6 axb6 6. d4 exd4 7. Qxd4 Qf6 8. Bg5 Qxd4 9. Nxd4 Bd7 10. Bc4 Ne7 11. O-O Ng6 12. a3 O-O 13. Rad1 Nc6 14. Nxc6 bxc6 15. Bd2 Ra4 16. Bd3 Ne5 17. Bc3 f6 18. f3 Re8 19. Rf2 Bc8 20. Bf1 Ba6 21. Bxa6 Rxa6 22. Bxe5 fxe5 23. Rd3 b5 24. Rfd2 c5 25. Kf2 Ra4 26. Ke3 Kf7 27. Rd1 Ke6 28. Kd2 Rb8 29. Rc3 g5 30. h3 h5 31. Rh1 Rd4+ 32. Ke2 Rg8 33. Rd3 Ra4 34. Rhd1 g4 35. hxg4 hxg4 36. Ke3 Rh8 37. Rb3 Rh2 38. Rd2 Rd4 39. Re2 c6 40. Rc3 g3 41. Rd3 Rh1 42. f4 Rf1 43. f5+ Kf6 44. c3 Rxd3+ 45. Kxd3 d5 46. b3 c4+ 47. bxc4 bxc4+ 48. Ke3 Ra1 49. Kf3 Rxa3 50. Kxg3 Rxc3+ 51. Kh4 Rc1 52. g4 Rh1+ 53. Kg3 d4 54. Ra2 d3 55. Kg2 Re1 56. Kf2 Rxe4 57. Kf3 0-1`
  },
  {
    id: 'smyslov-botvinnik-1954',
    title: 'Smyslov vs Botvinnik, 1954',
    event: 'World Championship 20th, round 9',
    year: 1954,
    white: 'Vassily Smyslov',
    black: 'Mikhail Botvinnik',
    description: 'World Championship 20th, round 9, 1954. Vassily Smyslov wins in 25 moves. Opening: French Defense: Winawer. Listed as a notable game on Wikipedia (Vasily Smyslov).',
    source: 'en.wikipedia.org/wiki/Vasily_Smyslov; moves: pgnmentor.com/players/Smyslov.zip',
    pgn: `[Event "World Championship 20th"]
[Site "Moscow"]
[Date "1954.??.??"]
[Round "9"]
[White "Vassily Smyslov"]
[Black "Mikhail Botvinnik"]
[Result "1-0"]
[ECO "C17"]

1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Ba5 6. b4 cxd4 7. Qg4 Ne7 8. bxa5 dxc3 9. Qxg7 Rg8 10. Qxh7 Nd7 11. Nf3 Nf8 12. Qd3 Qxa5 13. h4 Bd7 14. Bg5 Rc8 15. Nd4 Nf5 16. Rb1 Rc4 17. Nxf5 exf5 18. Rxb7 Re4+ 19. Qxe4 dxe4 20. Rb8+ Bc8 21. Bb5+ Qxb5 22. Rxb5 Ne6 23. Bf6 Rxg2 24. h5 Ba6 25. h6 1-0`
  },
  {
    id: 'karpov-spassky-1974-2',
    title: 'Karpov vs Spassky, 1974',
    event: 'Candidats sf1, round 1',
    year: 1974,
    white: 'Anatoly Karpov',
    black: 'Boris Spassky',
    description: 'Candidats sf1, round 1, 1974. Boris Spassky wins in 63 moves. Opening: Sicilian Scheveningen: Classical. Listed as a notable game on Wikipedia (Boris Spassky).',
    source: 'en.wikipedia.org/wiki/Boris_Spassky; moves: pgnmentor.com/players/Karpov.zip',
    pgn: `[Event "Candidats sf1"]
[Site "Leningrad"]
[Date "1974.??.??"]
[Round "1"]
[White "Anatoly Karpov"]
[Black "Boris Spassky"]
[Result "0-1"]
[WhiteElo "2700"]
[BlackElo "2650"]
[ECO "B83"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. Be2 Be7 7. O-O O-O 8. f4 Nc6 9. Be3 e5 10. Nb3 a5 11. a4 Nb4 12. Bf3 Be6 13. Kh1 Qc7 14. Rf2 Rfd8 15. Rd2 Bc4 16. Nb5 Bxb5 17. axb5 a4 18. Nc1 d5 19. fxe5 Nxe4 20. c3 Nxd2 21. Bxd2 Qxe5 22. cxb4 Qxb2 23. Nd3 Qd4 24. Ra3 Qb6 25. Qe2 Re8 26. Bxd5 Bxb4 27. Bxf7+ Kxf7 28. Qf3+ Kg8 29. Bxb4 Qxb5 30. h3 Rad8 31. Bd2 Qd5 32. Qf2 b5 33. Ba5 Rd7 34. Nf4 Rf7 35. Rf3 Qc4 36. Bd2 b4 37. Qb6 b3 38. Kh2 Qc2 39. Bc3 Qe4 40. Qd6 h6 41. Bb2 Qc2 42. Qd5 Qf5 43. Qc6 Qd7 44. Qg6 Ree7 45. Qa6 Qb7 46. Qxa4 Re4 47. Qxb3 Rb4 48. Qe6 Rxb2 49. Rg3 Rb6 50. Qe8+ Kh7 51. Qe3 Rd6 52. Qc5 Qc7 53. Qb4 Qd7 54. Nh5 Rg6 55. Rxg6 Kxg6 56. Ng3 Qd3 57. h4 Kh7 58. h5 Rd7 59. Qc5 Rd4 60. Qe7 Rg4 61. Qe5 Rh4+ 62. Kg1 Qd1+ 63. Kf2 Qd4+ 0-1`
  },
  {
    id: 'botvinnik-portisch-1968',
    title: 'Botvinnik vs Portisch, 1968',
    event: 'Monte Carlo, round 7',
    year: 1968,
    white: 'Mikhail Botvinnik',
    black: 'Lajos Portisch',
    description: 'Monte Carlo, round 7, 1968. Mikhail Botvinnik wins in 26 moves. Opening: English Opening: Reversed Sicilian. Listed as a notable game on Wikipedia (Mikhail Botvinnik).',
    source: 'en.wikipedia.org/wiki/Mikhail_Botvinnik; moves: pgnmentor.com/players/Botvinnik.zip',
    pgn: `[Event "Monte Carlo"]
[Site "Monte Carlo"]
[Date "1968.??.??"]
[Round "7"]
[White "Mikhail Botvinnik"]
[Black "Lajos Portisch"]
[Result "1-0"]
[ECO "A29"]

1. c4 e5 2. Nc3 Nf6 3. g3 d5 4. cxd5 Nxd5 5. Bg2 Be6 6. Nf3 Nc6 7. O-O Nb6 8. d3 Be7 9. a3 a5 10. Be3 O-O 11. Na4 Nxa4 12. Qxa4 Bd5 13. Rfc1 Re8 14. Rc2 Bf8 15. Rac1 Nb8 16. Rxc7 Bc6 17. R1xc6 bxc6 18. Rxf7 h6 19. Rb7 Qc8 20. Qc4+ Kh8 21. Nh4 Qxb7 22. Ng6+ Kh7 23. Be4 Bd6 24. Nxe5+ g6 25. Bxg6+ Kg7 26. Bxh6+ 1-0`
  },
  {
    id: 'fischer-tal-1959',
    title: 'Fischer vs Tal, 1959',
    event: 'Candidats Tournament, round 27',
    year: 1959,
    white: 'Robert Fischer',
    black: 'Mihail Tal',
    description: 'Candidats Tournament, round 27, 1959. Mihail Tal wins in 51 moves. Opening: Sicilian Najdorf. Listed as a notable game on Wikipedia (Mikhail Tal).',
    source: 'en.wikipedia.org/wiki/Mikhail_Tal; moves: pgnmentor.com/players/Fischer.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "27"]
[White "Robert Fischer"]
[Black "Mihail Tal"]
[Result "0-1"]
[ECO "B87"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 b5 8. f4 b4 9. Na4 Nxe4 10. O-O g6 11. f5 gxf5 12. Nxf5 Rg8 13. Bd5 Ra7 14. Bxe4 exf5 15. Bxf5 Re7 16. Bxc8 Qxc8 17. Bf4 Qc6 18. Qf3 Qxa4 19. Bxd6 Qc6 20. Bxb8 Qb6+ 21. Kh1 Qxb8 22. Qc6+ Rd7 23. Rae1+ Be7 24. Rxf7 Kxf7 25. Qe6+ Kf8 26. Qxd7 Qd6 27. Qb7 Rg6 28. c3 a5 29. Qc8+ Kg7 30. Qc4 Bd8 31. cxb4 axb4 32. g3 Qc6+ 33. Re4 Qxc4 34. Rxc4 Rb6 35. Kg2 Kf6 36. Kf3 Ke5 37. Ke3 Bg5+ 38. Ke2 Kd5 39. Kd3 Bf6 40. Rc2 Be5 41. Re2 Rf6 42. Rc2 Rf3+ 43. Ke2 Rf7 44. Kd3 Bd4 45. a3 b3 46. Rc8 Bxb2 47. Rd8+ Kc6 48. Rb8 Rf3+ 49. Kc4 Rc3+ 50. Kb4 Ba1 51. a4 b2 0-1`
  },
  {
    id: 'spassky-fischer-1972-3',
    title: 'Spassky vs Fischer, 1972',
    event: 'World Championship 28th, round 13',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Robert Fischer',
    description: 'World Championship 28th, round 13, 1972. Robert Fischer wins in 74 moves. Opening: Alekhine\'s Defense: Modern Variation. Listed as a notable game on Wikipedia (Bobby Fischer).',
    source: 'en.wikipedia.org/wiki/Bobby_Fischer; moves: pgnmentor.com/players/Spassky.zip',
    pgn: `[Event "World Championship 28th"]
[Site "Reykjavik"]
[Date "1972.??.??"]
[Round "13"]
[White "Boris Spassky"]
[Black "Robert Fischer"]
[Result "0-1"]
[WhiteElo "2660"]
[BlackElo "2785"]
[ECO "B04"]

1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 g6 5. Bc4 Nb6 6. Bb3 Bg7 7. Nbd2 O-O 8. h3 a5 9. a4 dxe5 10. dxe5 Na6 11. O-O Nc5 12. Qe2 Qe8 13. Ne4 Nbxa4 14. Bxa4 Nxa4 15. Re1 Nb6 16. Bd2 a4 17. Bg5 h6 18. Bh4 Bf5 19. g4 Be6 20. Nd4 Bc4 21. Qd2 Qd7 22. Rad1 Rfe8 23. f4 Bd5 24. Nc5 Qc8 25. Qc3 e6 26. Kh2 Nd7 27. Nd3 c5 28. Nb5 Qc6 29. Nd6 Qxd6 30. exd6 Bxc3 31. bxc3 f6 32. g5 hxg5 33. fxg5 f5 34. Bg3 Kf7 35. Ne5+ Nxe5 36. Bxe5 b5 37. Rf1 Rh8 38. Bf6 a3 39. Rf4 a2 40. c4 Bxc4 41. d7 Bd5 42. Kg3 Ra3+ 43. c3 Rha8 44. Rh4 e5 45. Rh7+ Ke6 46. Re7+ Kd6 47. Rxe5 Rxc3+ 48. Kf2 Rc2+ 49. Ke1 Kxd7 50. Rexd5+ Kc6 51. Rd6+ Kb7 52. Rd7+ Ka6 53. R7d2 Rxd2 54. Kxd2 b4 55. h4 Kb5 56. h5 c4 57. Ra1 gxh5 58. g6 h4 59. g7 h3 60. Be7 Rg8 61. Bf8 h2 62. Kc2 Kc6 63. Rd1 b3+ 64. Kc3 h1=Q 65. Rxh1 Kd5 66. Kb2 f4 67. Rd1+ Ke4 68. Rc1 Kd3 69. Rd1+ Ke2 70. Rc1 f3 71. Bc5 Rxg7 72. Rxc4 Rd7 73. Re4+ Kf1 74. Bd4 f2 0-1`
  },
  {
    id: 'carlsen-gelfand-2011',
    title: 'Carlsen vs Gelfand, 2011',
    event: '6th Tal Memorial, round 2',
    year: 2011,
    white: 'M. Carlsen',
    black: 'B. Gelfand',
    description: '6th Tal Memorial, round 2, 2011. M. Carlsen wins in 38 moves. Opening: Slav Defense: Main Line. Listed as a notable game on Wikipedia (Magnus Carlsen).',
    source: 'en.wikipedia.org/wiki/Magnus_Carlsen; moves: pgnmentor.com/players/Carlsen.zip',
    pgn: `[Event "6th Tal Memorial"]
[Site "Moscow RUS"]
[Date "2011.11.17"]
[Round "2"]
[White "M. Carlsen"]
[Black "B. Gelfand"]
[Result "1-0"]
[WhiteElo "2826"]
[BlackElo "2744"]
[ECO "D12"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bf5 5. Nc3 e6 6. Nh4 Bg6 7. Nxg6 hxg6 8. Bd3 Nbd7 9. O-O Bd6 10. h3 dxc4 11. Bxc4 Nb6 12. Bb3 e5 13. Qc2 Qe7 14. Bd2 O-O-O 15. d5 e4 16. dxc6 Qe5 17. f4 exf3 18. Rxf3 Ng4 19. cxb7+ Kb8 20. hxg4 Rh1+ 21. Kf2 Rxa1 22. Ne2 Bc5 23. Bc3 Qe7 24. g5 Rdd1 25. Ng3 Bd6 26. Qe2 Rg1 27. Qd3 Bc7 28. Ne4 Raf1+ 29. Ke2 Rxf3 30. gxf3 f5 31. gxf6 gxf6 32. Bxf6 Qh7 33. Qb5 Rg2+ 34. Kd3 Qd7+ 35. Qxd7 Nxd7 36. Bd5 Be5 37. f4 Bc7 38. Bc6 1-0`
  },
  {
    id: 'keres-sajtar-1954',
    title: 'Keres vs Sajtar, 1954',
    event: 'Amsterdam olm',
    year: 1954,
    white: 'Paul Keres',
    black: 'Jaroslav Sajtar',
    description: 'Amsterdam olm, 1954. Paul Keres wins in 20 moves. Opening: Sicilian Najdorf. Listed as a notable game on Wikipedia (Paul Keres).',
    source: 'en.wikipedia.org/wiki/Paul_Keres; moves: pgnmentor.com/players/Keres.zip',
    pgn: `[Event "Amsterdam olm"]
[Site "Amsterdam"]
[Date "1954.??.??"]
[Round "?"]
[White "Paul Keres"]
[Black "Jaroslav Sajtar"]
[Result "1-0"]
[ECO "B94"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 Nbd7 7. Bc4 e6 8. O-O Qc7 9. Bxe6 fxe6 10. Nxe6 Qc4 11. Nd5 Kf7 12. Bxf6 Kxe6 13. Bc3 Nf6 14. Bxf6 gxf6 15. Nb6 Qc6 16. Nxa8 Be7 17. a4 b6 18. Qd5+ Kd7 19. Ra3 Bd8 20. Nxb6+ 1-0`
  },
  {
    id: 'reshevsky-bronstein-1953',
    title: 'Reshevsky vs Bronstein, 1953',
    event: 'Candidats Tournament, round 13',
    year: 1953,
    white: 'Samuel Reshevsky',
    black: 'David Bronstein',
    description: 'Candidats Tournament, round 13, 1953. David Bronstein wins in 65 moves. Opening: King\'s Indian Defense: Fianchetto. Listed as a notable game on Wikipedia (David Bronstein).',
    source: 'en.wikipedia.org/wiki/David_Bronstein; moves: pgnmentor.com/players/Reshevsky.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Zuerich"]
[Date "1953.??.??"]
[Round "13"]
[White "Samuel Reshevsky"]
[Black "David Bronstein"]
[Result "0-1"]
[ECO "E69"]

1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 O-O 5. Nc3 d6 6. Nf3 Nbd7 7. O-O e5 8. e4 Re8 9. h3 exd4 10. Nxd4 Nc5 11. Re1 a5 12. Qc2 c6 13. Be3 Nfd7 14. Rad1 a4 15. Nde2 Qa5 16. Bf1 Ne5 17. Nd4 a3 18. f4 Ned7 19. b3 Na6 20. Bf2 Ndc5 21. Re3 Nb4 22. Qe2 Bd7 23. e5 dxe5 24. fxe5 Rad8 25. g4 Ne6 26. Bh4 Nxd4 27. Rxd4 Qc5 28. Rde4 Bh6 29. Kh1 Be6 30. g5 Bg7 31. Rf4 Bf5 32. Ne4 Bxe4+ 33. Rfxe4 Na6 34. e6 fxe6 35. Rxe6 Rf8 36. Re7 Bd4 37. R3e6 Qf5 38. Re8 Nc5 39. Rxd8 Nxe6 40. Rxf8+ Kxf8 41. Bg3 Qxg5 42. Qxe6 Qxg3 43. Qc8+ Ke7 44. Qg4 Qc3 45. Kg2 Qb2+ 46. Qe2+ Kd6 47. Kf3 Bc5 48. Ke4 Qd4+ 49. Kf3 Qf6+ 50. Kg2 Kc7 51. Qf3 Qb2+ 52. Qe2 Qd4 53. Kf3 h5 54. Kg2 g5 55. Kg3 Qf4+ 56. Kg2 g4 57. hxg4 hxg4 58. Kh1 Kb6 59. Kg2 Kc7 60. Kh1 Bd6 61. Kg1 Kb6 62. Qg2 Bc5+ 63. Kh1 Qh6+ 64. Qh2 Qe3 65. b4 Bd4 0-1`
  },
  {
    id: 'fischer-larsen-1966',
    title: 'Fischer vs Larsen, 1966',
    event: 'Santa Monica, round 6',
    year: 1966,
    white: 'Robert Fischer',
    black: 'Bent Larsen',
    description: 'Santa Monica, round 6, 1966. Bent Larsen wins in 30 moves. Opening: Ruy Lopez: Open Defense. Listed as a notable game on Wikipedia (Bent Larsen).',
    source: 'en.wikipedia.org/wiki/Bent_Larsen; moves: pgnmentor.com/players/Fischer.zip',
    pgn: `[Event "Santa Monica"]
[Site "Santa Monica"]
[Date "1966.??.??"]
[Round "6"]
[White "Robert Fischer"]
[Black "Bent Larsen"]
[Result "0-1"]
[ECO "C82"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Bc5 10. Nbd2 O-O 11. Bc2 Bf5 12. Nb3 Bg4 13. Nxc5 Nxc5 14. Re1 Re8 15. Be3 Ne6 16. Qd3 g6 17. Bh6 Ne7 18. Nd4 Bf5 19. Nxf5 Nxf5 20. Bd2 Qh4 21. Qf1 Nc5 22. g3 Qc4 23. Qg2 Nd3 24. Bxd3 Qxd3 25. Bg5 c6 26. g4 Ng7 27. Re3 Qd2 28. b3 b4 29. Qh3 bxc3 30. Qh6 Ne6 0-1`
  },
  {
    id: 'polgar-kasparov-2002',
    title: 'Polgar vs Kasparov, 2002',
    event: 'RUS vs. ROW, round 5',
    year: 2002,
    white: 'J. Polgar',
    black: 'G. Kasparov',
    description: 'RUS vs. ROW, round 5, 2002. J. Polgar wins in 42 moves. Opening: Ruy Lopez: Berlin Defense. Listed as a notable game on Wikipedia (Judit Polgár).',
    source: 'en.wikipedia.org/wiki/Judit_Polgár; moves: pgnmentor.com/players/PolgarJ.zip',
    pgn: `[Event "RUS vs. ROW"]
[Site "Moscow RUS"]
[Date "2002.09.09"]
[Round "5"]
[White "J. Polgar"]
[Black "G. Kasparov"]
[Result "1-0"]
[WhiteElo "2681"]
[BlackElo "2838"]
[ECO "C67"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 h6 10. Rd1+ Ke8 11. h3 Be7 12. Ne2 Nh4 13. Nxh4 Bxh4 14. Be3 Bf5 15. Nd4 Bh7 16. g4 Be7 17. Kg2 h5 18. Nf5 Bf8 19. Kf3 Bg6 20. Rd2 hxg4+ 21. hxg4 Rh3+ 22. Kg2 Rh7 23. Kg3 f6 24. Bf4 Bxf5 25. gxf5 fxe5 26. Re1 Bd6 27. Bxe5 Kd7 28. c4 c5 29. Bxd6 cxd6 30. Re6 Rah8 31. Rexd6+ Kc8 32. R2d5 Rh3+ 33. Kg2 Rh2+ 34. Kf3 R2h3+ 35. Ke4 b6 36. Rc6+ Kb8 37. Rd7 Rh2 38. Ke3 Rf8 39. Rcc7 Rxf5 40. Rb7+ Kc8 41. Rdc7+ Kd8 42. Rxg7 Kc8 1-0`
  },
  {
    id: 'stein-benko-1970',
    title: 'Stein vs Benko, 1970',
    event: 'Caracas, round 11',
    year: 1970,
    white: 'Leonid Stein',
    black: 'Pal Benko',
    description: 'Caracas, round 11, 1970. Leonid Stein wins in 36 moves. Opening: Sicilian Sveshnikov. Listed as a notable game on Wikipedia (Leonid Stein).',
    source: 'en.wikipedia.org/wiki/Leonid_Stein; moves: pgnmentor.com/players/Stein.zip',
    pgn: `[Event "Caracas"]
[Site "Caracas"]
[Date "1970.??.??"]
[Round "11"]
[White "Leonid Stein"]
[Black "Pal Benko"]
[Result "1-0"]
[ECO "B33"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Bxf6 gxf6 9. Na3 d5 10. Nxd5 Bxa3 11. bxa3 Be6 12. Bc4 Qa5+ 13. Qd2 Qxd2+ 14. Kxd2 O-O-O 15. Rad1 f5 16. f3 Rhg8 17. g3 Kb8 18. Ke3 Nd4 19. Bb3 fxe4 20. fxe4 f5 21. Ne7 f4+ 22. gxf4 exf4+ 23. Kxf4 Rgf8+ 24. Nf5 Bxf5 25. exf5 Rxf5+ 26. Ke4 Rh5 27. h4 Nc6 28. Rxd8+ Nxd8 29. Kf4 Kc7 30. Kg4 Re5 31. Rf1 h5+ 32. Kf4 Rc5 33. Rg1 Kd6 34. Rg5 Rc3 35. Rxh5 Ne6+ 36. Ke4 1-0`
  },
  {
    id: 'botvinnik-geller-1952',
    title: 'Botvinnik vs Geller, 1952',
    event: 'Budapest, round 2',
    year: 1952,
    white: 'Mikhail Botvinnik',
    black: 'Efim Geller',
    description: 'Budapest, round 2, 1952. Efim Geller wins in 47 moves. Opening: King\'s Indian Defense: Fianchetto. Listed as a notable game on Wikipedia (Efim Geller).',
    source: 'en.wikipedia.org/wiki/Efim_Geller; moves: pgnmentor.com/players/Botvinnik.zip',
    pgn: `[Event "Budapest"]
[Site "Budapest"]
[Date "1952.??.??"]
[Round "2"]
[White "Mikhail Botvinnik"]
[Black "Efim Geller"]
[Result "0-1"]
[ECO "E69"]

1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 O-O 5. Nc3 d6 6. Nf3 Nbd7 7. O-O e5 8. e4 exd4 9. Nxd4 Nc5 10. h3 Re8 11. Re1 a5 12. Qc2 a4 13. Be3 c6 14. Rad1 Qa5 15. a3 Nfd7 16. Bf1 Re7 17. f4 Nf6 18. Bf2 Bd7 19. e5 dxe5 20. fxe5 Ne8 21. Nf3 Bf5 22. Qe2 h5 23. Bd4 Nc7 24. Qf2 N7e6 25. Be3 Rae8 26. Nh4 Bxe5 27. Nxf5 gxf5 28. Qxf5 Ng7 29. Qf2 Bxc3 30. bxc3 Ne4 31. Qf4 Nxc3 32. Rc1 Na2 33. Rcd1 Nc3 34. Rc1 Ne4 35. Re2 Qf5 36. g4 hxg4 37. hxg4 Qg6 38. Rg2 Ng5 39. Qxg5 Rxe3 40. Qxg6 fxg6 41. c5 Ne6 42. Rb2 Re7 43. Bc4 Kg7 44. Bxe6 R7xe6 45. g5 Rb3 46. Rxb3 axb3 47. Rd1 Re2 0-1`
  },
  {
    id: 'najdorf-botvinnik-1946',
    title: 'Najdorf vs Botvinnik, 1946',
    event: 'Groningen, round 19',
    year: 1946,
    white: 'Miguel Najdorf',
    black: 'Mikhail Botvinnik',
    description: 'Groningen, round 19, 1946. Miguel Najdorf wins in 40 moves. Listed as a notable game on Wikipedia (Miguel Najdorf).',
    source: 'en.wikipedia.org/wiki/Miguel_Najdorf; moves: pgnmentor.com/players/Najdorf.zip',
    pgn: `[Event "Groningen"]
[Site "Groningen"]
[Date "1946.??.??"]
[Round "19"]
[White "Miguel Najdorf"]
[Black "Mikhail Botvinnik"]
[Result "1-0"]
[ECO "E35"]

1. d4 e6 2. c4 Nf6 3. Nc3 Bb4 4. Qc2 d5 5. cxd5 exd5 6. a3 Bxc3+ 7. bxc3 c5 8. Nf3 Qa5 9. Nd2 Bd7 10. Nb3 Qa4 11. Qb2 Na6 12. e3 c4 13. Nd2 O-O 14. Be2 b5 15. Bd1 Qa5 16. Bc2 Rfe8 17. O-O Rab8 18. Nf3 Qc7 19. Ne5 Be6 20. f3 Nc5 21. Bd2 Na4 22. Qb1 Rb6 23. Qe1 Nd7 24. Qh4 Nf8 25. e4 f6 26. Ng4 Ng6 27. Qh5 Qf7 28. Rae1 Rbb8 29. Ne3 Ne7 30. Qh4 f5 31. g4 f4 32. exd5 Ng6 33. dxe6 Rxe6 34. Bxg6 hxg6 35. Ng2 Rbe8 36. Rxe6 Rxe6 37. Nxf4 Rf6 38. Qg5 Nxc3 39. Bxc3 Rxf4 40. Kg2 1-0`
  },
  {
    id: 'reshevsky-petrosian-1953',
    title: 'Reshevsky vs Petrosian, 1953',
    event: 'Candidats Tournament, round 2',
    year: 1953,
    white: 'Samuel Reshevsky',
    black: 'Tigran Petrosian',
    description: 'Candidats Tournament, round 2, 1953. Drawn in 41 moves. Opening: Nimzo-Indian Defense: Main Line. Listed as a notable game on Wikipedia (Samuel Reshevsky).',
    source: 'en.wikipedia.org/wiki/Samuel_Reshevsky; moves: pgnmentor.com/players/Reshevsky.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Zuerich"]
[Date "1953.??.??"]
[Round "2"]
[White "Samuel Reshevsky"]
[Black "Tigran Petrosian"]
[Result "1/2-1/2"]
[ECO "E58"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 b6 10. cxd5 exd5 11. Bb2 c4 12. Bc2 Bg4 13. Qe1 Ne4 14. Nd2 Nxd2 15. Qxd2 Bh5 16. f3 Bg6 17. e4 Qd7 18. Rae1 dxe4 19. fxe4 Rfe8 20. Qf4 b5 21. Bd1 Re7 22. Bg4 Qe8 23. e5 a5 24. Re3 Rd8 25. Rfe1 Re6 26. a4 Ne7 27. Bxe6 fxe6 28. Qf1 Nd5 29. Rf3 Bd3 30. Rxd3 cxd3 31. Qxd3 b4 32. cxb4 axb4 33. a5 Ra8 34. Ra1 Qc6 35. Bc1 Qc7 36. a6 Qb6 37. Bd2 b3 38. Qc4 h6 39. h3 b2 40. Rb1 Kh8 41. Be1 1/2-1/2`
  },
  {
    id: 'portisch-petrosian-1967',
    title: 'Portisch vs Petrosian, 1967',
    event: 'Moscow',
    year: 1967,
    white: 'Lajos Portisch',
    black: 'Tigran Petrosian',
    description: 'Moscow, 1967. Lajos Portisch wins in 24 moves. Opening: Slav Defense. Listed as a notable game on Wikipedia (Lajos Portisch).',
    source: 'en.wikipedia.org/wiki/Lajos_Portisch; moves: pgnmentor.com/players/Portisch.zip',
    pgn: `[Event "Moscow"]
[Site "Moscow"]
[Date "1967.??.??"]
[Round "?"]
[White "Lajos Portisch"]
[Black "Tigran Petrosian"]
[Result "1-0"]
[ECO "D13"]

1. d4 d5 2. c4 c6 3. cxd5 cxd5 4. Nc3 Nf6 5. Nf3 Nc6 6. Bf4 e6 7. e3 Bd6 8. Bg3 O-O 9. Bd3 Re8 10. Ne5 Bxe5 11. dxe5 Nd7 12. f4 Qb6 13. O-O Qxe3+ 14. Kh1 Qb6 15. Qh5 Nf8 16. Rf3 Ng6 17. Bf2 Qd8 18. Nb5 Nce7 19. Nd6 Bd7 20. Bh4 Qb6 21. Rh3 h6 22. Bf6 Qxb2 23. Rf1 Nf5 24. Bxf5 1-0`
  },
  {
    id: 'alekhine-tartakower-1933',
    title: 'Alekhine vs Tartakower, 1933',
    event: 'Folkestone ol, round 2',
    year: 1933,
    white: 'Alexander Alekhine',
    black: 'Saviely Tartakower',
    description: 'Folkestone ol, round 2, 1933. Saviely Tartakower wins in 74 moves. Opening: Indian Game. Listed as a notable game on Wikipedia (Savielly Tartakower).',
    source: 'en.wikipedia.org/wiki/Savielly_Tartakower; moves: pgnmentor.com/players/Alekhine.zip',
    pgn: `[Event "Folkestone ol"]
[Site "Folkestone"]
[Date "1933.??.??"]
[Round "2"]
[White "Alexander Alekhine"]
[Black "Saviely Tartakower"]
[Result "0-1"]
[ECO "D58"]

1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. Bg5 Be7 5. e3 h6 6. Bh4 O-O 7. Nf3 b6 8. Qc2 Bb7 9. Rd1 Nbd7 10. cxd5 exd5 11. Bd3 Nh5 12. Bg3 c5 13. Bf5 c4 14. Qa4 Ndf6 15. Ne5 g6 16. Bb1 a6 17. Qc2 b5 18. O-O b4 19. Ne2 Qe8 20. Nf4 Nxg3 21. hxg3 Bd6 22. Rfe1 Rc8 23. e4 dxe4 24. Nxc4 Bxf4 25. gxf4 Qe6 26. b3 Qg4 27. Qd2 Qh4 28. Qe3 Ng4 29. Qg3 Qxg3 30. fxg3 f5 31. d5 Rfd8 32. d6 Rc5 33. Rd4 Bd5 34. Red1 Bxc4 35. Rxc4 Ne3 36. Rxc5 Nxd1 37. Rc6 Nc3 38. Bc2 Ne2+ 39. Kf2 Nd4 40. Rc4 Rxd6 41. g4 Kg7 42. gxf5 gxf5 43. Bxe4 fxe4 44. Ke3 Nc6 45. Kxe4 Kf6 46. g4 Ke6 47. Rc5 Kd7 48. g5 hxg5 49. fxg5 Rd4+ 50. Ke3 Rh4 51. Rf5 Rh2 52. g6 Rxa2 53. Rg5 Rb2 54. g7 Rxb3+ 55. Kf2 Ne7 56. Rd5+ Ke6 57. Rd8 Kf7 58. Rd7 Kxg7 59. Rxe7+ Kf6 60. Ra7 Ra3 61. Rb7 a5 62. Rb5 Ke6 63. Ke2 Kd6 64. Kd2 Kc6 65. Rh5 Kb6 66. Kc2 Rc3+ 67. Kb2 Rc5 68. Rh8 Kb5 69. Rb8+ Ka4 70. Rh8 Rg5 71. Rh2 Rg3 72. Rh8 Rg2+ 73. Ka1 Ka3 74. Rh3+ b3 0-1`
  },
  {
    id: 'flohr-keres-1935',
    title: 'Flohr vs Keres, 1935',
    event: 'Warsaw ol, round 15',
    year: 1935,
    white: 'Salo Flohr',
    black: 'Paul Keres',
    description: 'Warsaw ol, round 15, 1935. Salo Flohr wins in 20 moves. Opening: Indian Game. Listed as a notable game on Wikipedia (Salo Flohr).',
    source: 'en.wikipedia.org/wiki/Salo_Flohr; moves: pgnmentor.com/players/Flohr.zip',
    pgn: `[Event "Warsaw ol"]
[Site "Warsaw"]
[Date "1935.??.??"]
[Round "15"]
[White "Salo Flohr"]
[Black "Paul Keres"]
[Result "1-0"]
[ECO "D37"]

1. d4 Nf6 2. Nf3 e6 3. c4 d5 4. Nc3 Nbd7 5. Bf4 c6 6. e3 Be7 7. Bd3 O-O 8. O-O a6 9. c5 Re8 10. Na4 Ne4 11. Bxe4 dxe4 12. Nd2 e5 13. dxe5 Bxc5 14. Nxe4 Bb6 15. Nxb6 Qxb6 16. Nd6 Re6 17. Qh5 g6 18. Qh4 f6 19. Rad1 fxe5 20. Nxc8 1-0`
  },
  {
    id: 'smyslov-bronstein-1956',
    title: 'Smyslov vs Bronstein, 1956',
    event: 'Candidats Tournament, round 16',
    year: 1956,
    white: 'Vassily Smyslov',
    black: 'David Bronstein',
    description: 'Candidats Tournament, round 16, 1956. Vassily Smyslov wins in 57 moves. Opening: English Opening. Listed as a notable game on Wikipedia (Vasily Smyslov).',
    source: 'en.wikipedia.org/wiki/Vasily_Smyslov; moves: pgnmentor.com/players/Smyslov.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Amsterdam"]
[Date "1956.??.??"]
[Round "16"]
[White "Vassily Smyslov"]
[Black "David Bronstein"]
[Result "1-0"]
[ECO "A34"]

1. c4 Nf6 2. Nf3 c5 3. g3 d5 4. Bg2 Nc6 5. cxd5 Nxd5 6. Nc3 Nf6 7. O-O e6 8. b3 Be7 9. Bb2 O-O 10. Rc1 Qa5 11. Na4 Rd8 12. Qc2 Nb4 13. Qb1 Nfd5 14. a3 Na6 15. e4 Nf6 16. Bc3 Qb5 17. Rfd1 c4 18. Bxf6 Bxf6 19. Rxc4 Qa5 20. e5 Be7 21. Nc3 Bd7 22. b4 Qxa3 23. b5 Nb4 24. Ng5 Bxg5 25. Qxb4 Qxb4 26. Rxb4 Be8 27. d4 Rac8 28. Rb3 b6 29. d5 exd5 30. Nxd5 Kf8 31. Ra1 Bd2 32. e6 Bg5 33. h4 fxe6 34. Rf3+ Kg8 35. Bh3 Bd7 36. Rxa7 exd5 37. Rxd7 Bf6 38. Be6+ Kf8 39. Rf7+ Ke8 40. Rb7 Rc1+ 41. Kg2 Rd6 42. Bf5 g6 43. Bd3 Be7 44. Re3 Rd7 45. Rxb6 d4 46. Rf3 Bd6 47. Ra6 Ke7 48. Ra8 Bc5 49. Rh8 Kd6 50. Rc8 Kd5 51. h5 Rc3 52. hxg6 hxg6 53. Rc6 Rb7 54. Rxg6 Rxd3 55. Rxd3 Kc4 56. Rd1 d3 57. Rc1+ 1-0`
  },
  {
    id: 'bilek-tal-1967',
    title: 'Bilek vs Tal, 1967',
    event: 'Moscow',
    year: 1967,
    white: 'Istvan Bilek',
    black: 'Mihail Tal',
    description: 'Moscow, 1967. Mihail Tal wins in 30 moves. Opening: Réti Opening: King\'s Indian Attack. Listed as a notable game on Wikipedia (Mikhail Tal).',
    source: 'en.wikipedia.org/wiki/Mikhail_Tal; moves: pgnmentor.com/players/Tal.zip',
    pgn: `[Event "Moscow"]
[Site "Moscow"]
[Date "1967.??.??"]
[Round "?"]
[White "Istvan Bilek"]
[Black "Mihail Tal"]
[Result "0-1"]
[ECO "A05"]

1. Nf3 Nf6 2. g3 b5 3. Bg2 Bb7 4. O-O e6 5. d3 d5 6. Nbd2 Be7 7. e4 O-O 8. Qe2 c5 9. Re1 Nc6 10. c3 a5 11. exd5 exd5 12. d4 Qb6 13. dxc5 Bxc5 14. Nb3 Rfe8 15. Qc2 d4 16. Qf5 Rxe1+ 17. Nxe1 Re8 18. Nf3 Bd6 19. Bg5 Ne4 20. Re1 Ne7 21. Bxe7 g6 22. Qh3 dxc3 23. Rxe4 cxb2 24. Re1 Rxe7 25. Rb1 a4 26. Nbd4 Bxf3 27. Nxf3 Re2 28. Rf1 Rxf2 29. Qc8+ Kg7 30. Qc3+ f6 0-1`
  },
  {
    id: 'fischer-spassky-1992',
    title: 'Fischer vs Spassky, 1992',
    event: 'St Stefan/Belgrade m, round 1',
    year: 1992,
    white: 'Robert Fischer',
    black: 'Boris Spassky',
    description: 'St Stefan/Belgrade m, round 1, 1992. Robert Fischer wins in 50 moves. Opening: Ruy Lopez: Closed Defense. Listed as a notable game on Wikipedia (Bobby Fischer).',
    source: 'en.wikipedia.org/wiki/Bobby_Fischer; moves: pgnmentor.com/players/Fischer.zip',
    pgn: `[Event "St Stefan/Belgrade m"]
[Site "Belgrade"]
[Date "1992.??.??"]
[Round "1"]
[White "Robert Fischer"]
[Black "Boris Spassky"]
[Result "1-0"]
[WhiteElo "2785"]
[BlackElo "2560"]
[ECO "C95"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. Bg5 h6 16. Bd2 Bg7 17. a4 c5 18. d5 c4 19. b4 Nh7 20. Be3 h5 21. Qd2 Rf8 22. Ra3 Ndf6 23. Rea1 Qd7 24. R1a2 Rfc8 25. Qc1 Bf8 26. Qa1 Qe8 27. Nf1 Be7 28. N1d2 Kg7 29. Nb1 Nxe4 30. Bxe4 f5 31. Bc2 Bxd5 32. axb5 axb5 33. Ra7 Kf6 34. Nbd2 Rxa7 35. Rxa7 Ra8 36. g4 hxg4 37. hxg4 Rxa7 38. Qxa7 f4 39. Bxf4 exf4 40. Nh4 Bf7 41. Qd4+ Ke6 42. Nf5 Bf8 43. Qxf4 Kd7 44. Nd4 Qe1+ 45. Kg2 Bd5+ 46. Be4 Bxe4+ 47. Nxe4 Be7 48. Nxb5 Nf8 49. Nbxd6 Ne6 50. Qe5 1-0`
  },
  {
    id: 'carlsen-anand-2012',
    title: 'Carlsen vs Anand, 2012',
    event: '5th Final Masters, round 9',
    year: 2012,
    white: 'M. Carlsen',
    black: 'V. Anand',
    description: '5th Final Masters, round 9, 2012. M. Carlsen wins in 30 moves. Opening: Sicilian Defense. Listed as a notable game on Wikipedia (Magnus Carlsen).',
    source: 'en.wikipedia.org/wiki/Magnus_Carlsen; moves: pgnmentor.com/players/Carlsen.zip',
    pgn: `[Event "5th Final Masters"]
[Site "Sao Paulo/Bilbao BRA/ESP"]
[Date "2012.10.12"]
[Round "9"]
[White "M. Carlsen"]
[Black "V. Anand"]
[Result "1-0"]
[WhiteElo "2843"]
[BlackElo "2780"]
[ECO "B52"]

1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7 4. Bxd7+ Qxd7 5. c4 Nf6 6. Nc3 g6 7. d4 cxd4 8. Nxd4 Bg7 9. f3 Qc7 10. b3 Qa5 11. Bb2 Nc6 12. O-O O-O 13. Nce2 Rfd8 14. Bc3 Qb6 15. Kh1 d5 16. Nxc6 bxc6 17. Qe1 Rdc8 18. e5 Ne8 19. e6 fxe6 20. Nf4 Bxc3 21. Qxc3 d4 22. Qd2 c5 23. Rae1 Ng7 24. g4 Rc6 25. Nh3 Ne8 26. Qh6 Nf6 27. Ng5 d3 28. Re5 Kh8 29. Rd1 Qa6 30. a4 1-0`
  },
  {
    id: 'keres-botvinnik-1956',
    title: 'Keres vs Botvinnik, 1956',
    event: 'Alekhine mem',
    year: 1956,
    white: 'Paul Keres',
    black: 'Mikhail Botvinnik',
    description: 'Alekhine mem, 1956. Paul Keres wins in 34 moves. Opening: Sicilian Defense: Old Sicilian. Listed as a notable game on Wikipedia (Paul Keres).',
    source: 'en.wikipedia.org/wiki/Paul_Keres; moves: pgnmentor.com/players/Keres.zip',
    pgn: `[Event "Alekhine mem"]
[Site "Moscow"]
[Date "1956.??.??"]
[Round "?"]
[White "Paul Keres"]
[Black "Mikhail Botvinnik"]
[Result "1-0"]
[ECO "B63"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bg5 e6 7. Qd2 h6 8. Bxf6 gxf6 9. O-O-O a6 10. f4 h5 11. Kb1 Bd7 12. Be2 Qb6 13. Nb3 O-O-O 14. Rhf1 Na5 15. Rf3 Nxb3 16. axb3 Kb8 17. Na4 Qa7 18. f5 Be7 19. fxe6 fxe6 20. Rxf6 Rh7 21. Rg6 b5 22. Nc3 Qc5 23. Na2 Ka7 24. Nb4 Rf8 25. Bf3 h4 26. h3 Bc8 27. Nd3 Qc7 28. Nf4 Rf6 29. Bg4 Rxg6 30. Nxg6 Bb7 31. Bxe6 Bd8 32. Bd5 Bxd5 33. Qxd5 Rf7 34. e5 1-0`
  },
  {
    id: 'bronstein-keres-1955',
    title: 'Bronstein vs Keres, 1955',
    event: 'Gothenburg Interzonal, round 7',
    year: 1955,
    white: 'David Bronstein',
    black: 'Paul Keres',
    description: 'Gothenburg Interzonal, round 7, 1955. David Bronstein wins in 39 moves. Opening: Nimzo-Indian Defense: Huebner. Listed as a notable game on Wikipedia (David Bronstein).',
    source: 'en.wikipedia.org/wiki/David_Bronstein; moves: pgnmentor.com/players/Bronstein.zip',
    pgn: `[Event "Gothenburg Interzonal"]
[Site "Gothenburg"]
[Date "1955.??.??"]
[Round "7"]
[White "David Bronstein"]
[Black "Paul Keres"]
[Result "1-0"]
[ECO "E41"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Bd3 b6 6. Ne2 Bb7 7. O-O cxd4 8. exd4 O-O 9. d5 h6 10. Bc2 Na6 11. Nb5 exd5 12. a3 Be7 13. Ng3 dxc4 14. Bxh6 gxh6 15. Qd2 Nh7 16. Qxh6 f5 17. Nxf5 Rxf5 18. Bxf5 Nf8 19. Rad1 Bg5 20. Qh5 Qf6 21. Nd6 Bc6 22. Qg4 Kh8 23. Be4 Bh6 24. Bxc6 dxc6 25. Qxc4 Nc5 26. b4 Nce6 27. Qxc6 Rb8 28. Ne4 Qg6 29. Rd6 Bg7 30. f4 Qg4 31. h3 Qe2 32. Ng3 Qe3+ 33. Kh2 Nd4 34. Qd5 Re8 35. Nh5 Ne2 36. Nxg7 Qg3+ 37. Kh1 Nxf4 38. Qf3 Ne2 39. Rh6+ 1-0`
  },
  {
    id: 'larsen-petrosian-1966',
    title: 'Larsen vs Petrosian, 1966',
    event: 'Santa Monica, round 7',
    year: 1966,
    white: 'Bent Larsen',
    black: 'Tigran Petrosian',
    description: 'Santa Monica, round 7, 1966. Bent Larsen wins in 30 moves. Opening: Sicilian Defense: Accelerated Dragon. Listed as a notable game on Wikipedia (Bent Larsen).',
    source: 'en.wikipedia.org/wiki/Bent_Larsen; moves: pgnmentor.com/players/Larsen.zip',
    pgn: `[Event "Santa Monica"]
[Site "Santa Monica"]
[Date "1966.??.??"]
[Round "7"]
[White "Bent Larsen"]
[Black "Tigran Petrosian"]
[Result "1-0"]
[ECO "B39"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Be3 Bg7 6. c4 Nf6 7. Nc3 Ng4 8. Qxg4 Nxd4 9. Qd1 Ne6 10. Qd2 d6 11. Be2 Bd7 12. O-O O-O 13. Rad1 Bc6 14. Nd5 Re8 15. f4 Nc7 16. f5 Na6 17. Bg4 Nc5 18. fxg6 hxg6 19. Qf2 Rf8 20. e5 Bxe5 21. Qh4 Bxd5 22. Rxd5 Ne6 23. Rf3 Bf6 24. Qh6 Bg7 25. Qxg6 Nf4 26. Rxf4 fxg6 27. Be6+ Rf7 28. Rxf7 Kh8 29. Rg5 b5 30. Rg3 1-0`
  },
  {
    id: 'stein-smyslov-1972',
    title: 'Stein vs Smyslov, 1972',
    event: 'URS-chT Moscow',
    year: 1972,
    white: 'Leonid Stein',
    black: 'Vassily Smyslov',
    description: 'URS-chT Moscow, 1972. Leonid Stein wins in 35 moves. Opening: English Opening: Anglo-Indian. Listed as a notable game on Wikipedia (Leonid Stein).',
    source: 'en.wikipedia.org/wiki/Leonid_Stein; moves: pgnmentor.com/players/Stein.zip',
    pgn: `[Event "URS-chT Moscow"]
[Site "Moscow"]
[Date "1972.??.??"]
[Round "?"]
[White "Leonid Stein"]
[Black "Vassily Smyslov"]
[Result "1-0"]
[WhiteElo "2620"]
[BlackElo "2620"]
[ECO "A17"]

1. c4 Nf6 2. Nc3 e6 3. Nf3 b6 4. e4 Bb7 5. Qe2 Bb4 6. e5 Ng8 7. d4 d6 8. a3 Bxc3+ 9. bxc3 Ne7 10. h4 Nd7 11. h5 Bxf3 12. Qxf3 dxe5 13. h6 gxh6 14. Bxh6 exd4 15. Bg7 Rg8 16. Rxh7 Nf5 17. Bxd4 c5 18. g4 cxd4 19. gxf5 e5 20. Qd5 Rf8 21. cxd4 Rc8 22. Rd1 Qe7 23. Bg2 Rg8 24. Qb7 Rxc4 25. dxe5 Qxe5+ 26. Kf1 Qb5 27. Kg1 Qc6 28. Qxc6 Rxc6 29. Rh8 Rg6 30. fxg6 Rxh8 31. Bc6 Rg8 32. Bxd7+ Ke7 33. Bf5 fxg6 34. Rd7+ Kf6 35. Bd3 1-0`
  },
  {
    id: 'geller-keres-1959',
    title: 'Geller vs Keres, 1959',
    event: 'URS-ch26, round 2',
    year: 1959,
    white: 'Efim Geller',
    black: 'Paul Keres',
    description: 'URS-ch26, round 2, 1959. Efim Geller wins in 38 moves. Opening: Nimzo-Indian Defense. Listed as a notable game on Wikipedia (Efim Geller).',
    source: 'en.wikipedia.org/wiki/Efim_Geller; moves: pgnmentor.com/players/Geller.zip',
    pgn: `[Event "URS-ch26"]
[Site "Tbilisi"]
[Date "1959.??.??"]
[Round "2"]
[White "Efim Geller"]
[Black "Paul Keres"]
[Result "1-0"]
[ECO "E45"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Ne2 Ba6 6. Ng3 h5 7. h4 Bb7 8. Bd2 a6 9. Qc2 d5 10. cxd5 Nxd5 11. Nxd5 Bxd2+ 12. Qxd2 Qxd5 13. Rc1 Nc6 14. Be2 O-O-O 15. Bf3 Qd7 16. O-O Ne7 17. Bxb7+ Kxb7 18. Rc3 e5 19. Rfc1 exd4 20. Rxc7+ Qxc7 21. Rxc7+ Kxc7 22. exd4 Nd5 23. Qd3 g6 24. Qxa6 Rd7 25. Ne4 Re8 26. Nc3 Nxc3 27. bxc3 Re6 28. a4 Rc6 29. a5 b5 30. Qxb5 Rxc3 31. Qb6+ Kc8 32. a6 Rcc7 33. d5 Rd8 34. d6 Rc1+ 35. Kh2 Kd7 36. Qb7+ Kxd6 37. Qxf7 Rc5 38. Qf6+ 1-0`
  },
  {
    id: 'najdorf-boleslavsky-1946',
    title: 'Najdorf vs Boleslavsky, 1946',
    event: 'Groningen, round 2',
    year: 1946,
    white: 'Miguel Najdorf',
    black: 'Isaak Boleslavsky',
    description: 'Groningen, round 2, 1946. Miguel Najdorf wins in 37 moves. Opening: Indian Game. Listed as a notable game on Wikipedia (Miguel Najdorf).',
    source: 'en.wikipedia.org/wiki/Miguel_Najdorf; moves: pgnmentor.com/players/Najdorf.zip',
    pgn: `[Event "Groningen"]
[Site "Groningen"]
[Date "1946.??.??"]
[Round "2"]
[White "Miguel Najdorf"]
[Black "Isaak Boleslavsky"]
[Result "1-0"]
[ECO "A53"]

1. d4 Nf6 2. c4 d6 3. Nc3 e5 4. dxe5 dxe5 5. Qxd8+ Kxd8 6. Nf3 Nfd7 7. g3 f6 8. Bg2 Na6 9. O-O c6 10. b3 Kc7 11. Bb2 Nac5 12. b4 Ne6 13. c5 Be7 14. Ne4 b6 15. cxb6+ Nxb6 16. a3 Na4 17. Bc1 Ba6 18. Re1 Rhd8 19. Be3 Nb6 20. Bh3 Nf8 21. Rac1 Nfd7 22. Be6 Bb5 23. Nfd2 Na4 24. Nb3 Ndb6 25. Na5 Re8 26. Bh3 Rad8 27. Rc2 Rd5 28. Nxc6 Bxc6 29. Rec1 Kb8 30. Rxc6 Red8 31. Kg2 Rd1 32. R1c2 Nd5 33. Bc5 Nab6 34. Be6 Ra1 35. Rd2 Kb7 36. Bxe7 Re8 37. Rxd5 1-0`
  },
  {
    id: 'szabo-reshevsky-1953',
    title: 'Szabo vs Reshevsky, 1953',
    event: 'Candidats Tournament, round 19',
    year: 1953,
    white: 'Laszlo Szabo',
    black: 'Samuel Reshevsky',
    description: 'Candidats Tournament, round 19, 1953. Drawn in 27 moves. Opening: Indian Game. Listed as a notable game on Wikipedia (Samuel Reshevsky).',
    source: 'en.wikipedia.org/wiki/Samuel_Reshevsky; moves: pgnmentor.com/players/Reshevsky.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Zuerich"]
[Date "1953.??.??"]
[Round "19"]
[White "Laszlo Szabo"]
[Black "Samuel Reshevsky"]
[Result "1/2-1/2"]
[ECO "D42"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c5 5. cxd5 Nxd5 6. e3 Nc6 7. Bd3 Nxc3 8. bxc3 Be7 9. Qc2 g6 10. h4 h5 11. Rb1 Rb8 12. Be4 Qc7 13. O-O Bd7 14. d5 exd5 15. Bxd5 Bf6 16. Ng5 Nd8 17. c4 Bc6 18. Ne4 Bg7 19. Bb2 O-O 20. Nf6+ Bxf6 21. Bxf6 Bxd5 22. cxd5 Qd6 23. Qc3 Qxd5 24. Rfd1 Qf5 25. e4 Qe6 26. Bg7 b6 27. Bxf8 Kxf8 1/2-1/2`
  },
  {
    id: 'larsen-portisch-1968',
    title: 'Larsen vs Portisch, 1968',
    event: 'Candidats qf3, round 4',
    year: 1968,
    white: 'Bent Larsen',
    black: 'Lajos Portisch',
    description: 'Candidats qf3, round 4, 1968. Lajos Portisch wins in 39 moves. Opening: English Opening. Listed as a notable game on Wikipedia (Lajos Portisch).',
    source: 'en.wikipedia.org/wiki/Lajos_Portisch; moves: pgnmentor.com/players/Larsen.zip',
    pgn: `[Event "Candidats qf3"]
[Site "Porec"]
[Date "1968.??.??"]
[Round "4"]
[White "Bent Larsen"]
[Black "Lajos Portisch"]
[Result "0-1"]
[ECO "D61"]

1. c4 e6 2. Nc3 d5 3. d4 Be7 4. Nf3 Nf6 5. Bg5 O-O 6. e3 Nbd7 7. Qc2 h6 8. Bh4 c5 9. cxd5 cxd4 10. Nxd4 Nxd5 11. Bxe7 Nxe7 12. Be2 Nf6 13. O-O Qb6 14. Rfd1 Bd7 15. Qb3 Qxb3 16. Nxb3 Rfd8 17. Kf1 Kf8 18. Rac1 Be8 19. Bf3 Bc6 20. Bxc6 Nxc6 21. Nc5 Rxd1+ 22. Rxd1 Ke7 23. Nxb7 Rb8 24. Nd6 Rxb2 25. Nc8+ Ke8 26. Rd6 Ne5 27. Ra6 Nd3 28. Nd6+ Kf8 29. h3 Rxf2+ 30. Kg1 Rc2 31. Ncb5 Nd5 32. Ra3 Rd2 33. Rxa7 Rd1+ 34. Kh2 Nxe3 35. Rxf7+ Kg8 36. a4 Rd2 37. Kg3 Rxg2+ 38. Kh4 Ne5 39. Rb7 Ng6+ 0-1`
  },
  {
    id: 'flohr-capablanca-1936',
    title: 'Flohr vs Capablanca, 1936',
    event: 'Nottingham',
    year: 1936,
    white: 'Salo Flohr',
    black: 'Jose Capablanca',
    description: 'Nottingham, 1936. Salo Flohr wins in 64 moves. Opening: Indian Game. Listed as a notable game on Wikipedia (Salo Flohr).',
    source: 'en.wikipedia.org/wiki/Salo_Flohr; moves: pgnmentor.com/players/Flohr.zip',
    pgn: `[Event "Nottingham"]
[Site "Nottingham"]
[Date "1936.??.??"]
[Round "?"]
[White "Salo Flohr"]
[Black "Jose Capablanca"]
[Result "1-0"]
[ECO "D59"]

1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Nxe7 10. Be2 Bb7 11. O-O Nd7 12. Qa4 a6 13. Rfd1 Nd5 14. Rac1 Rc8 15. Nxd5 exd5 16. Bd3 c5 17. dxc5 Nxc5 18. Qd4 Re8 19. Bf5 Rc7 20. Qf4 Rce7 21. Nd4 a5 22. Bd3 Re5 23. Bb5 R8e7 24. Qf3 Rg5 25. Qe2 Rg6 26. Bd3 Rf6 27. Bb1 Ba6 28. Qh5 Bb7 29. a3 a4 30. Qg4 Re5 31. Nf3 Re7 32. Nd4 Re5 33. Nf3 Re7 34. Qg3 Ba6 35. Nd4 Rd7 36. Bf5 Rc7 37. Bb1 Qc8 38. Nf5 Rg6 39. Nd6 Rxg3 40. Nxc8 Rxg2+ 41. Kxg2 Rxc8 42. Ba2 Rc6 43. Bxd5 Rg6+ 44. Kh1 Nd3 45. Rc2 Rd6 46. Bf3 Rf6 47. Be4 Rd6 48. Bxd3 Bxd3 49. f3 Bxc2 50. Rxd6 b5 51. Kg2 Bb3 52. Rb6 Bc4 53. Kg3 Kf8 54. Kf4 Ke7 55. Ke5 Be2 56. f4 Bc4 57. Rb7+ Kf8 58. f5 f6+ 59. Kf4 h5 60. e4 Be2 61. e5 fxe5+ 62. Kxe5 Bc4 63. Kf4 h4 64. Kg5 1-0`
  },
  {
    id: 'smyslov-tal-1959',
    title: 'Smyslov vs Tal, 1959',
    event: 'Candidats Tournament, round 1',
    year: 1959,
    white: 'Vassily Smyslov',
    black: 'Mihail Tal',
    description: 'Candidats Tournament, round 1, 1959. Vassily Smyslov wins in 65 moves. Opening: Sicilian Najdorf. Listed as a notable game on Wikipedia (Vasily Smyslov).',
    source: 'en.wikipedia.org/wiki/Vasily_Smyslov; moves: pgnmentor.com/players/Smyslov.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "1"]
[White "Vassily Smyslov"]
[Black "Mihail Tal"]
[Result "1-0"]
[ECO "B92"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Be3 Qc7 10. a4 Be6 11. a5 Qc6 12. Bf3 Nbd7 13. Nd5 Bxd5 14. exd5 Qb5 15. Qd3 Rfc8 16. Rfc1 Qxd3 17. cxd3 g6 18. Rc3 Rxc3 19. bxc3 Rc8 20. c4 e4 21. dxe4 Rxc4 22. Nd2 Rc2 23. Bd1 Rc3 24. Kf1 Nc5 25. Bd4 Rd3 26. Bxc5 dxc5 27. Ke2 Rxd2+ 28. Kxd2 Nxe4+ 29. Kc2 Nd6 30. Be2 Bf6 31. Rb1 Kf8 32. Kb3 Ke7 33. Bd3 Kd7 34. f4 Bd4 35. Rf1 Be3 36. f5 Bd2 37. fxg6 hxg6 38. Ra1 Ke7 39. Ra2 Bb4 40. h4 Kf6 41. g4 Be1 42. h5 Kg5 43. Ra1 Bd2 44. Rh1 gxh5 45. gxh5 c4+ 46. Bxc4 Kh6 47. Rf1 Kxh5 48. Rf6 Ne4 49. Be2+ Kg5 50. Rxf7 Be3 51. Re7 Kf4 52. Bd3 Nd6 53. Kb4 b6 54. axb6 Bxb6 55. Bxa6 Bd4 56. Re6 Be5 57. Kc5 Nf7 58. Bd3 Bb2 59. Bg6 Ng5 60. Re8 Ba3+ 61. Kc6 Nf3 62. Re4+ Kg5 63. Bh7 Kh6 64. Bf5 Kg5 65. Bg4 1-0`
  },
  {
    id: 'spassky-tal-1973',
    title: 'Spassky vs Tal, 1973',
    event: 'Tallinn',
    year: 1973,
    white: 'Boris Spassky',
    black: 'Mihail Tal',
    description: 'Tallinn, 1973. Mihail Tal wins in 38 moves. Opening: Nimzo-Indian Defense. Listed as a notable game on Wikipedia (Mikhail Tal).',
    source: 'en.wikipedia.org/wiki/Mikhail_Tal; moves: pgnmentor.com/players/Spassky.zip',
    pgn: `[Event "Tallinn"]
[Site "Tallinn"]
[Date "1973.??.??"]
[Round "?"]
[White "Boris Spassky"]
[Black "Mihail Tal"]
[Result "0-1"]
[ECO "E30"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Bg5 h6 5. Bh4 c5 6. d5 b5 7. dxe6 fxe6 8. cxb5 d5 9. e3 O-O 10. Nf3 Qa5 11. Bxf6 Rxf6 12. Qd2 a6 13. bxa6 Nc6 14. Be2 d4 15. exd4 Rxf3 16. Bxf3 cxd4 17. O-O dxc3 18. bxc3 Bxc3 19. Qd6 Rxa6 20. Bxc6 Bb4 21. Qb8 Rxc6 22. Rac1 Bc5 23. Rc2 Qa4 24. Qb3 Qf4 25. Qg3 Qf5 26. Rfc1 Bb7 27. Qf3 Qg5 28. Qb3 Rc7 29. g3 Bxf2+ 30. Kxf2 Qf6+ 31. Ke1 Qe5+ 32. Kf1 Ba6+ 33. Kg1 Qd4+ 34. Kg2 Qe4+ 35. Kg1 Bb7 36. h4 Qh1+ 37. Kf2 Rf7+ 38. Ke2 Qe4+ 0-1`
  },
  {
    id: 'carlsen-gelfand-2013',
    title: 'Carlsen vs Gelfand, 2013',
    event: 'FIDE Candidates',
    year: 2013,
    white: 'M. Carlsen',
    black: 'B. Gelfand',
    description: 'FIDE Candidates, 2013. M. Carlsen wins in 48 moves. Opening: Sicilian Rossolimo. Listed as a notable game on Wikipedia (Magnus Carlsen).',
    source: 'en.wikipedia.org/wiki/Magnus_Carlsen; moves: pgnmentor.com/players/Carlsen.zip',
    pgn: `[Event "FIDE Candidates"]
[Site "London ENG"]
[Date "2013.03.27"]
[Round "10.2"]
[White "M. Carlsen"]
[Black "B. Gelfand"]
[Result "1-0"]
[WhiteElo "2872"]
[BlackElo "2740"]
[ECO "B30"]

1. e4 c5 2. Nf3 Nc6 3. Bb5 e6 4. O-O Nge7 5. Re1 a6 6. Bf1 d5 7. exd5 Nxd5 8. d4 Nf6 9. Be3 cxd4 10. Nxd4 Bd7 11. c4 Nxd4 12. Bxd4 Bc6 13. Nc3 Be7 14. a3 a5 15. Qd3 O-O 16. Rad1 Qc7 17. Be5 Qb6 18. Qg3 Rfd8 19. Rxd8+ Qxd8 20. Rd1 Qb6 21. Bd4 Qb3 22. Rd3 Qc2 23. b4 axb4 24. axb4 Nh5 25. Qe5 Bf6 26. Qxh5 Bxd4 27. Rxd4 Qxc3 28. Qa5 Rf8 29. Qb6 e5 30. Rd1 g6 31. b5 Be4 32. Qf6 h5 33. h4 Bf5 34. Rd5 Qc1 35. Qxe5 Be6 36. Rd4 Ra8 37. Qe2 Kh7 38. Rd1 Qc3 39. Qe4 Ra1 40. Rxa1 Qxa1 41. c5 Qc3 42. Qxb7 Qe1 43. b6 Bc4 44. Qf3 Qxf1+ 45. Kh2 Qb1 46. b7 Qb5 47. c6 Bd5 48. Qg3 1-0`
  },
  {
    id: 'keres-walther-1964',
    title: 'Keres vs Walther, 1964',
    event: 'Tel Aviv olm prel, round 1',
    year: 1964,
    white: 'Paul Keres',
    black: 'Edgar Walther',
    description: 'Tel Aviv olm prel, round 1, 1964. Paul Keres wins in 36 moves. Opening: King\'s Indian Defense: Classical. Listed as a notable game on Wikipedia (Paul Keres).',
    source: 'en.wikipedia.org/wiki/Paul_Keres; moves: pgnmentor.com/players/Keres.zip',
    pgn: `[Event "Tel Aviv olm prel"]
[Site "Tel Aviv"]
[Date "1964.??.??"]
[Round "1"]
[White "Paul Keres"]
[Black "Edgar Walther"]
[Result "1-0"]
[ECO "E93"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. d5 Nbd7 8. Bg5 h6 9. Bh4 g5 10. Bg3 Nh5 11. h4 g4 12. Nh2 Nxg3 13. fxg3 h5 14. O-O Bh6 15. Bd3 c6 16. Kh1 Nf6 17. Bc2 cxd5 18. cxd5 Ne8 19. Qe2 Ng7 20. Rf2 f5 21. exf5 Nxf5 22. Bxf5 Bxf5 23. Raf1 Bg6 24. Nxg4 hxg4 25. Qxg4 Kh7 26. h5 Bd3 27. Rxf8 Bxf8 28. Rf3 Bc2 29. Ne4 Kh8 30. Rf7 Qe8 31. Nxd6 Qa4 32. Qg5 Qa6 33. Qxe5+ Kg8 34. Rf6 Qd3 35. Kh2 Qh7 36. Qe6+ 1-0`
  },
  {
    id: 'aloni-bronstein-1956',
    title: 'Aloni vs Bronstein, 1956',
    event: 'Moscow olm fin-A, round 2',
    year: 1956,
    white: 'Izak Aloni',
    black: 'David Bronstein',
    description: 'Moscow olm fin-A, round 2, 1956. David Bronstein wins in 29 moves. Opening: King\'s Indian Defense: Sämisch. Listed as a notable game on Wikipedia (David Bronstein).',
    source: 'en.wikipedia.org/wiki/David_Bronstein; moves: pgnmentor.com/players/Bronstein.zip',
    pgn: `[Event "Moscow olm fin-A"]
[Site "Moscow"]
[Date "1956.??.??"]
[Round "2"]
[White "Izak Aloni"]
[Black "David Bronstein"]
[Result "0-1"]
[ECO "E85"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 e5 6. Nge2 O-O 7. Be3 Nbd7 8. Qd2 a6 9. g4 exd4 10. Nxd4 c5 11. Nc2 Ne5 12. Be2 Be6 13. Na3 Nfd7 14. O-O-O b5 15. cxb5 axb5 16. Ncxb5 c4 17. Qxd6 Qa5 18. Bd4 Rfc8 19. Bc3 Nd3+ 20. Bxd3 Bxc3 21. Nxc3 cxd3 22. Rxd3 Ne5 23. Re3 Rd8 24. Qe7 Rd7 25. Qf6 Qc5 26. Nc2 Nd3+ 27. Rxd3 Rxd3 28. a3 Qf2 29. Re1 Rd2 0-1`
  },
  {
    id: 'tal-larsen-1969',
    title: 'Tal vs Larsen, 1969',
    event: 'Eersel cm-3pl, round 6',
    year: 1969,
    white: 'Mihail Tal',
    black: 'Bent Larsen',
    description: 'Eersel cm-3pl, round 6, 1969. Bent Larsen wins in 41 moves. Opening: Sicilian Richter-Rauzer. Listed as a notable game on Wikipedia (Bent Larsen).',
    source: 'en.wikipedia.org/wiki/Bent_Larsen; moves: pgnmentor.com/players/Tal.zip',
    pgn: `[Event "Eersel cm-3pl"]
[Site "Eersel"]
[Date "1969.??.??"]
[Round "6"]
[White "Mihail Tal"]
[Black "Bent Larsen"]
[Result "0-1"]
[ECO "B65"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd2 Be7 8. O-O-O O-O 9. f4 Nxd4 10. Qxd4 Qa5 11. Bc4 Bd7 12. Kb1 Bc6 13. Rhf1 h6 14. Bh4 Qh5 15. g3 g5 16. fxg5 hxg5 17. Rxf6 Bxf6 18. Qxf6 gxh4 19. gxh4 Kh7 20. e5 dxe5 21. Rf1 Qg6 22. Qxe5 f5 23. Bd3 Qf6 24. Qe3 Rad8 25. Ne2 a6 26. Nf4 e5 27. Nh3 e4 28. Ng5+ Kh8 29. Qe2 Qh6 30. Bc4 f4 31. Nf7+ Rxf7 32. Bxf7 f3 33. Qc4 Qf6 34. Qb3 Qd4 35. a3 e3 36. Rc1 e2 37. Qe6 Qf4 38. Qe7 Qxc1+ 39. Ka2 Qg1 40. Qxd8+ Kh7 41. Bc4 0-1`
  },
  {
    id: 'ljubojevic-stein-1973',
    title: 'Ljubojevic vs Stein, 1973',
    event: 'Las Palmas, round 13',
    year: 1973,
    white: 'Ljubomir Ljubojevic',
    black: 'Leonid Stein',
    description: 'Las Palmas, round 13, 1973. Leonid Stein wins in 25 moves. Opening: Larsen\'s Opening. Listed as a notable game on Wikipedia (Leonid Stein).',
    source: 'en.wikipedia.org/wiki/Leonid_Stein; moves: pgnmentor.com/players/Stein.zip',
    pgn: `[Event "Las Palmas"]
[Site "Las Palmas"]
[Date "1973.??.??"]
[Round "13"]
[White "Ljubomir Ljubojevic"]
[Black "Leonid Stein"]
[Result "0-1"]
[WhiteElo "2550"]
[BlackElo "2620"]
[ECO "A01"]

1. b3 e5 2. Bb2 d6 3. e3 Nf6 4. c4 g6 5. d4 Bg7 6. Nc3 exd4 7. Qxd4 O-O 8. Nf3 Nbd7 9. Be2 Nc5 10. Rd1 Ng4 11. Qd2 Nxf2 12. O-O Nxd1 13. Bxd1 Bg4 14. h3 Bxf3 15. Bxf3 a5 16. Nd5 c6 17. Bxg7 Kxg7 18. Qd4+ f6 19. Nf4 Qe7 20. Kh1 Rfe8 21. Qd2 Qxe3 22. Qxd6 Qe5 23. Qd2 Rad8 24. Qxa5 Ne4 25. Ne6+ Qxe6 0-1`
  },
  {
    id: 'geller-fischer-1962',
    title: 'Geller vs Fischer, 1962',
    event: 'Candidats Tournament, round 2',
    year: 1962,
    white: 'Efim Geller',
    black: 'Robert Fischer',
    description: 'Candidats Tournament, round 2, 1962. Efim Geller wins in 41 moves. Opening: Sicilian Najdorf. Listed as a notable game on Wikipedia (Efim Geller).',
    source: 'en.wikipedia.org/wiki/Efim_Geller; moves: pgnmentor.com/players/Geller.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Curacao"]
[Date "1962.??.??"]
[Round "2"]
[White "Efim Geller"]
[Black "Robert Fischer"]
[Result "1-0"]
[ECO "B92"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Be3 Qc7 10. a4 Be6 11. a5 Nbd7 12. Nd5 Nxd5 13. exd5 Bf5 14. c4 Bg6 15. Rc1 Nc5 16. Nxc5 dxc5 17. b4 Rac8 18. Qb3 Bd6 19. Rfd1 Qe7 20. bxc5 Bxc5 21. Bxc5 Rxc5 22. Ra1 Rd8 23. Ra4 Bf5 24. Rb4 Bc8 25. Rb6 Rd6 26. Qb4 Qc7 27. Rxd6 Qxd6 28. Rb1 Qc7 29. Qa4 Bd7 30. Qa3 Rxa5 31. Rxb7 Qxb7 32. Qxa5 g6 33. h3 Qb1+ 34. Kh2 Bf5 35. Qc3 Qe4 36. Bf3 Qd4 37. Qxd4 exd4 38. g4 Bc8 39. c5 a5 40. c6 Kf8 41. d6 1-0`
  },
  {
    id: 'najdorf-eliskases-1947',
    title: 'Najdorf vs Eliskases, 1947',
    event: 'Mar del Plata, round 8',
    year: 1947,
    white: 'Miguel Najdorf',
    black: 'Erich Eliskases',
    description: 'Mar del Plata, round 8, 1947. Miguel Najdorf wins in 49 moves. Opening: Indian Game. Listed as a notable game on Wikipedia (Miguel Najdorf).',
    source: 'en.wikipedia.org/wiki/Miguel_Najdorf; moves: pgnmentor.com/players/Najdorf.zip',
    pgn: `[Event "Mar del Plata"]
[Site "Mar del Plata"]
[Date "1947.??.??"]
[Round "8"]
[White "Miguel Najdorf"]
[Black "Erich Eliskases"]
[Result "1-0"]
[ECO "D65"]

1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. Bg5 Nbd7 5. e3 Be7 6. Nf3 O-O 7. Rc1 a6 8. cxd5 exd5 9. Bd3 c6 10. Qc2 Re8 11. O-O Nf8 12. h3 g6 13. Ne5 N6d7 14. Bf4 Nxe5 15. Bxe5 Bd6 16. Bxd6 Qxd6 17. Na4 Ne6 18. Nc5 Nxc5 19. Qxc5 Qf6 20. b4 Bf5 21. Bxf5 Qxf5 22. a4 g5 23. Qb6 Re7 24. b5 axb5 25. axb5 cxb5 26. Rc5 Kg7 27. Qxb5 Rd8 28. Qa5 Red7 29. Rfc1 g4 30. hxg4 Qxg4 31. Rb5 Kh8 32. Qb6 Rd6 33. Qc7 Rg8 34. g3 Qe6 35. Re1 b6 36. e4 dxe4 37. Rxe4 Qf6 38. d5 h5 39. Kg2 Qg6 40. Rf4 Rg7 41. Rh4 Rh7 42. Rbb4 Qf6 43. Rhf4 Qd8 44. Qc3+ Kg8 45. Rbc4 Qf8 46. Rc8 Rd8 47. Rfc4 Rh6 48. Rxd8 Qxd8 49. Rc8 1-0`
  },
  {
    id: 'reshevsky-geller-1953',
    title: 'Reshevsky vs Geller, 1953',
    event: 'Candidats Tournament, round 24',
    year: 1953,
    white: 'Samuel Reshevsky',
    black: 'Efim Geller',
    description: 'Candidats Tournament, round 24, 1953. Drawn in 60 moves. Opening: Nimzo-Indian Defense: Classical. Listed as a notable game on Wikipedia (Samuel Reshevsky).',
    source: 'en.wikipedia.org/wiki/Samuel_Reshevsky; moves: pgnmentor.com/players/Reshevsky.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Zuerich"]
[Date "1953.??.??"]
[Round "24"]
[White "Samuel Reshevsky"]
[Black "Efim Geller"]
[Result "1/2-1/2"]
[ECO "E35"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. cxd5 exd5 6. Bg5 h6 7. Bxf6 Qxf6 8. a3 Bxc3+ 9. Qxc3 O-O 10. e3 c6 11. Ne2 Bf5 12. Nf4 Nd7 13. Be2 Rfe8 14. O-O Nf8 15. b4 Ne6 16. Nh5 Qg6 17. Ng3 Rac8 18. Rac1 Ng5 19. b5 Ne4 20. Qa5 c5 21. Nxf5 Qxf5 22. dxc5 b6 23. Qxa7 bxc5 24. Bd3 c4 25. Bxe4 Qxe4 26. Rfd1 c3 27. Qd4 Rc4 28. Qxd5 c2 29. Rd2 Qxd5 30. Rxd5 Ra8 31. b6 Rb8 32. Rd6 Ra4 33. Rxc2 Rxa3 34. h3 Rb3 35. Rcc6 Rb2 36. e4 h5 37. e5 h4 38. Rd4 R2xb6 39. Rxb6 Rxb6 40. Rxh4 Rb1+ 41. Kh2 Re1 42. f4 Re3 43. Rg4 Kh7 44. Rg3 Re2 45. h4 Re4 46. Rf3 f6 47. exf6 gxf6 48. Kg3 Kg6 49. Ra3 f5 50. Ra6+ Kh5 51. Rf6 Re3+ 52. Kf2 Ra3 53. g3 Rf3+ 54. Ke2 Rxg3 55. Rxf5+ Kxh4 56. Kf2 Ra3 57. Rg5 Rb3 58. Rg1 Kh5 59. Ke2 Ra3 60. f5 Ra5 1/2-1/2`
  },
  {
    id: 'portisch-bronstein-1969',
    title: 'Portisch vs Bronstein, 1969',
    event: 'Monte Carlo',
    year: 1969,
    white: 'Lajos Portisch',
    black: 'David Bronstein',
    description: 'Monte Carlo, 1969. Lajos Portisch wins in 20 moves. Opening: Queen\'s Gambit. Listed as a notable game on Wikipedia (Lajos Portisch).',
    source: 'en.wikipedia.org/wiki/Lajos_Portisch; moves: pgnmentor.com/players/Portisch.zip',
    pgn: `[Event "Monte Carlo"]
[Site "Monte Carlo"]
[Date "1969.??.??"]
[Round "?"]
[White "Lajos Portisch"]
[Black "David Bronstein"]
[Result "1-0"]
[ECO "D06"]

1. d4 d5 2. c4 c5 3. cxd5 Nf6 4. e4 Nxe4 5. dxc5 Nxc5 6. Nf3 e6 7. Nc3 exd5 8. Qxd5 Qe7+ 9. Be3 Nc6 10. Bb5 Bd7 11. O-O Ne6 12. Ne5 Nxe5 13. Qxe5 Bxb5 14. Nxb5 a6 15. Rad1 Rd8 16. Bb6 Rxd1 17. Rxd1 f6 18. Qf5 g6 19. Nc7+ Kf7 20. Qd5 1-0`
  },
  {
    id: 'bronstein-flohr-1944',
    title: 'Bronstein vs Flohr, 1944',
    event: 'URS-ch13',
    year: 1944,
    white: 'David Bronstein',
    black: 'Salo Flohr',
    description: 'URS-ch13, 1944. Salo Flohr wins in 35 moves. Opening: Ruy Lopez: Open Defense. Listed as a notable game on Wikipedia (Salo Flohr).',
    source: 'en.wikipedia.org/wiki/Salo_Flohr; moves: pgnmentor.com/players/Bronstein.zip',
    pgn: `[Event "URS-ch13"]
[Site "Moscow"]
[Date "1944.??.??"]
[Round "?"]
[White "David Bronstein"]
[Black "Salo Flohr"]
[Result "0-1"]
[ECO "C82"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Bc5 10. Nbd2 O-O 11. Bc2 Bf5 12. Nb3 Bg4 13. Nxc5 Nxc5 14. Re1 Bh5 15. Bg5 Bxf3 16. Qxf3 Qxg5 17. Qxd5 Nd7 18. Qxc6 Nxe5 19. Qe4 Ng6 20. g3 f5 21. Qe6+ Kh8 22. Rad1 Rf6 23. Qe3 f4 24. Qe4 Raf8 25. Rd5 Qh6 26. g4 f3 27. Rh5 Qd2 28. h3 h6 29. Rd1 Qe2 30. g5 Re6 31. Qxe2 fxe2 32. Re1 Nf4 33. Rh4 h5 34. g6 Re5 35. f3 Rg5+ 0-1`
  },
  {
    id: 'fischer-smyslov-1959',
    title: 'Fischer vs Smyslov, 1959',
    event: 'Candidats Tournament, round 21',
    year: 1959,
    white: 'Robert Fischer',
    black: 'Vassily Smyslov',
    description: 'Candidats Tournament, round 21, 1959. Vassily Smyslov wins in 48 moves. Opening: Sicilian Defense. Listed as a notable game on Wikipedia (Vasily Smyslov).',
    source: 'en.wikipedia.org/wiki/Vasily_Smyslov; moves: pgnmentor.com/players/Fischer.zip',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "21"]
[White "Robert Fischer"]
[Black "Vassily Smyslov"]
[Result "0-1"]
[ECO "B87"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 Be7 7. O-O a6 8. Bb3 b5 9. f4 O-O 10. f5 b4 11. Nce2 e5 12. Nf3 Bb7 13. Ng3 Nxe4 14. Nxe4 Bxe4 15. Qe1 Bxf3 16. Rxf3 Nc6 17. Qe4 Nd4 18. Rh3 Bf6 19. Bd5 Rc8 20. c3 bxc3 21. bxc3 Nb5 22. Bd2 Rc5 23. Kh1 Qd7 24. Bb3 d5 25. Qf3 Nd6 26. Rf1 Ne4 27. Qh5 h6 28. Bxh6 gxh6 29. Bc2 Bg5 30. f6 Rb8 31. Bxe4 dxe4 32. Rg3 Qf5 33. Kg1 Qg6 34. Qe2 Rc6 35. h4 Rxf6 36. Rxf6 Qxf6 37. Qh5 Qf4 38. Kh2 Kg7 39. hxg5 hxg5 40. Qxg5+ Qxg5 41. Rxg5+ Kf6 42. Rh5 Rb1 43. Kg3 Rf1 44. Rh4 Kf5 45. Rh5+ Ke6 46. Rh6+ f6 47. Rh4 e3 48. Re4 f5 0-1`
  },
];

// =========== MAGNUS CARLSEN LEGENDARY COLLECTION ===========
// Games from the "Carlsen in Color" book - available as Legendary Game Cards

export const carlsenLegendaryGames: FamousGame[] = [
  {
    id: 'carlsen-nepo-wc-2021',
    title: 'The 136-Move Epic',
    event: 'WCh 2021',
    year: 2021,
    white: 'Magnus Carlsen',
    black: 'Ian Nepomniachtchi',
    description: 'The longest World Championship game ever - 136 moves, nearly 8 hours of intense play.',
    source: 'pgnmentor.com/players/Carlsen.zip',
    pgn: `[Event "WCh 2021"]
[Site "Dubai UAE"]
[Date "2021.12.03"]
[Round "6"]
[White "Magnus Carlsen"]
[Black "Ian Nepomniachtchi"]
[Result "1-0"]
[WhiteElo "2855"]
[BlackElo "2782"]
[ECO "D02"]

1. d4 Nf6 2. Nf3 d5 3. g3 e6 4. Bg2 Be7 5. O-O O-O 6. b3 c5 7. dxc5 Bxc5 8. c4 dxc4 9. Qc2 Qe7 10. Nbd2 Nc6 11. Nxc4 b5 12. Nce5 Nb4 13. Qb2 Bb7 14. a3 Nc6 15. Nd3 Bb6 16. Bg5 Rfd8 17. Bxf6 gxf6 18. Rac1 Nd4 19. Nxd4 Bxd4 20. Qa2 Bxg2 21. Kxg2 Qb7+ 22. Kg1 Qe4 23. Qc2 a5 24. Rfd1 Kg7 25. Rd2 Rac8 26. Qxc8 Rxc8 27. Rxc8 Qd5 28. b4 a4 29. e3 Be5 30. h4 h5 31. Kh2 Bb2 32. Rc5 Qd6 33. Rd1 Bxa3 34. Rxb5 Qd7 35. Rc5 e5 36. Rc2 Qd5 37. Rdd2 Qb3 38. Ra2 e4 39. Nc5 Qxb4 40. Nxe4 Qb3 41. Rac2 Bf8 42. Nc5 Qb5 43. Nd3 a3 44. Nf4 Qa5 45. Ra2 Bb4 46. Rd3 Kh6 47. Rd1 Qa4 48. Rda1 Bd6 49. Kg1 Qb3 50. Ne2 Qd3 51. Nd4 Kh7 52. Kh2 Qe4 53. Rxa3 Qxh4+ 54. Kg1 Qe4 55. Ra4 Be5 56. Ne2 Qc2 57. R1a2 Qb3 58. Kg2 Qd5+ 59. f3 Qd1 60. f4 Bc7 61. Kf2 Bb6 62. Ra1 Qb3 63. Re4 Kg7 64. Re8 f5 65. Raa8 Qb4 66. Rac8 Ba5 67. Rc1 Bb6 68. Re5 Qb3 69. Re8 Qd5 70. Rcc8 Qh1 71. Rc1 Qd5 72. Rb1 Ba7 73. Re7 Bc5 74. Re5 Qd3 75. Rb7 Qc2 76. Rb5 Ba7 77. Ra5 Bb6 78. Rab5 Ba7 79. Rxf5 Qd3 80. Rxf7+ Kxf7 81. Rb7+ Kg6 82. Rxa7 Qd5 83. Ra6+ Kh7 84. Ra1 Kg6 85. Nd4 Qb7 86. Ra2 Qh1 87. Ra6+ Kf7 88. Nf3 Qb1 89. Rd6 Kg7 90. Rd5 Qa2+ 91. Rd2 Qb1 92. Re2 Qb6 93. Rc2 Qb1 94. Nd4 Qh1 95. Rc7+ Kf6 96. Rc6+ Kf7 97. Nf3 Qb1 98. Ng5+ Kg7 99. Ne6+ Kf7 100. Nd4 Qh1 101. Rc7+ Kf6 102. Nf3 Qb1 103. Rd7 Qb2+ 104. Rd2 Qb1 105. Ng1 Qb4 106. Rd1 Qb3 107. Rd6+ Kg7 108. Rd4 Qb2+ 109. Ne2 Qb1 110. e4 Qh1 111. Rd7+ Kg8 112. Rd4 Qh2+ 113. Ke3 h4 114. gxh4 Qh3+ 115. Kd2 Qxh4 116. Rd3 Kf8 117. Rf3 Qd8+ 118. Ke3 Qa5 119. Kf2 Qa7+ 120. Re3 Qd7 121. Ng3 Qd2+ 122. Kf3 Qd1+ 123. Re2 Qb3+ 124. Kg2 Qb7 125. Rd2 Qb3 126. Rd5 Ke7 127. Re5+ Kf7 128. Rf5+ Ke8 129. e5 Qa2+ 130. Kh3 Qe6 131. Kh4 Qh6+ 132. Nh5 Qh7 133. e6 Qg6 134. Rf7 Kd8 135. f5 Qg1 136. Ng7 1-0`
  },
  {
    id: 'carlsen-anand-wc-2013-showdown',
    title: 'The Anand Showdown',
    event: 'WCh 2013',
    year: 2013,
    white: 'Viswanathan Anand',
    black: 'Magnus Carlsen',
    description: 'Game 9 - Carlsen defends brilliantly and clinches the world title.',
    source: 'pgnmentor.com/players/Carlsen.zip',
    pgn: `[Event "WCh 2013"]
[Site "Chennai IND"]
[Date "2013.11.21"]
[Round "9"]
[White "Viswanathan Anand"]
[Black "Magnus Carlsen"]
[Result "0-1"]
[WhiteElo "2775"]
[BlackElo "2870"]
[ECO "E25"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. f3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5 exd5 8. e3 c4 9. Ne2 Nc6 10. g4 O-O 11. Bg2 Na5 12. O-O Nb3 13. Ra2 b5 14. Ng3 a5 15. g5 Ne8 16. e4 Nxc1 17. Qxc1 Ra6 18. e5 Nc7 19. f4 b4 20. axb4 axb4 21. Rxa6 Nxa6 22. f5 b3 23. Qf4 Nc7 24. f6 g6 25. Qh4 Ne8 26. Qh6 b2 27. Rf4 b1=Q+ 28. Nf1 Qe1 0-1`
  },
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
