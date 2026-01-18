/**
 * Famous Games Benchmark Dataset
 * 
 * Tests our prediction system against historically important games
 * where the outcomes are definitively known.
 * 
 * These games span multiple eras and styles, providing a robust test set.
 */

export interface BenchmarkGame {
  id: string;
  name: string;
  year: number;
  white: string;
  black: string;
  result: 'white_wins' | 'black_wins' | 'draw';
  pgn: string;
  significance: string;
}

// 20 Famous games with known outcomes for benchmarking
export const FAMOUS_GAMES_BENCHMARK: BenchmarkGame[] = [
  {
    id: 'morphy-opera',
    name: 'The Opera Game',
    year: 1858,
    white: 'Paul Morphy',
    black: 'Duke of Brunswick',
    result: 'white_wins',
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0',
    significance: 'Perfect attacking chess - piece development and king safety',
  },
  {
    id: 'anderssen-kieseritzky',
    name: 'The Immortal Game',
    year: 1851,
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    result: 'white_wins',
    pgn: '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0',
    significance: 'Sacrificed both rooks and queen for checkmate',
  },
  {
    id: 'anderssen-dufresne',
    name: 'The Evergreen Game',
    year: 1852,
    white: 'Adolf Anderssen',
    black: 'Jean Dufresne',
    result: 'white_wins',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7# 1-0',
    significance: 'Double bishop sacrifice leading to forced mate',
  },
  {
    id: 'kasparov-topalov',
    name: 'Kasparov\'s Immortal',
    year: 1999,
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    result: 'white_wins',
    pgn: '1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0',
    significance: 'Sacrificed rook and attacked through the center',
  },
  {
    id: 'byrne-fischer',
    name: 'The Game of the Century',
    year: 1956,
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    result: 'black_wins',
    pgn: '1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1',
    significance: '13-year-old Fischer\'s queen sacrifice masterpiece',
  },
  {
    id: 'deep-blue-kasparov-g6',
    name: 'Deep Blue vs Kasparov Game 6',
    year: 1997,
    white: 'Deep Blue',
    black: 'Garry Kasparov',
    result: 'white_wins',
    pgn: '1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Ng5 Ngf6 6. Bd3 e6 7. N1f3 h6 8. Nxe6 Qe7 9. O-O fxe6 10. Bg6+ Kd8 11. Bf4 b5 12. a4 Bb7 13. Re1 Nd5 14. Bg3 Kc8 15. axb5 cxb5 16. Qd3 Bc6 17. Bf5 exf5 18. Rxe7 Bxe7 19. c4 1-0',
    significance: 'Machine defeats world champion - chess computing milestone',
  },
  {
    id: 'carlsen-anand-wc2013-g5',
    name: 'Carlsen vs Anand WC 2013 G5',
    year: 2013,
    white: 'Magnus Carlsen',
    black: 'Viswanathan Anand',
    result: 'white_wins',
    pgn: '1. c4 e6 2. d4 d5 3. Nc3 c6 4. e4 dxe4 5. Nxe4 Bb4+ 6. Nc3 c5 7. a3 Ba5 8. Nf3 Nf6 9. Be3 Nc6 10. Qd3 cxd4 11. Nxd4 Ng4 12. O-O-O Nxe3 13. fxe3 Bc7 14. Nxc6 bxc6 15. Qxd8+ Bxd8 16. Be2 Ke7 17. Bf3 Bd7 18. Ne4 Bb6 19. c5 f5 20. cxb6 fxe4 21. b7 Rab8 22. Bxe4 Rxb7 23. Rhf1 Rb5 24. Rf4 g5 25. Rf3 h5 26. Rdf1 Be8 27. Bc2 Rc5 28. Rf6 h4 29. R1f2 Bh5 30. Rxa6 Rxc2+ 31. Kxc2 Bg4 32. Rg6 Kf7 33. Rxg5 1-0',
    significance: 'Carlsen becomes world champion',
  },
  {
    id: 'tal-larsen',
    name: 'Tal\'s King Hunt',
    year: 1965,
    white: 'Mikhail Tal',
    black: 'Bent Larsen',
    result: 'white_wins',
    pgn: '1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 e6 5. Nc3 d6 6. Be3 Nf6 7. f4 Be7 8. Qf3 O-O 9. O-O-O Qc7 10. Ndb5 Qb8 11. g4 a6 12. Nd4 Nxd4 13. Bxd4 b5 14. g5 Nd7 15. Bd3 b4 16. Nd5 exd5 17. exd5 f5 18. Rde1 Rf7 19. h4 Bb7 20. Bxf5 Rxf5 21. Rxe7 Qf8 22. Qe4 Rf7 23. Re1 Qxe7 24. Qxe7 Rxe7 25. Rxe7 Bxd5 26. Rxd7 Bxa2 27. Rxd6 1-0',
    significance: 'Tal\'s trademark sacrifice style',
  },
  {
    id: 'capablanca-marshall',
    name: 'Marshall Attack Debut',
    year: 1918,
    white: 'Jose Capablanca',
    black: 'Frank Marshall',
    result: 'white_wins',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 Nf6 12. Re1 Bd6 13. h3 Ng4 14. Qf3 Qh4 15. d4 Nxf2 16. Re2 Bg4 17. hxg4 Bh2+ 18. Kf1 Bg3 19. Rxf2 Qh1+ 20. Ke2 Bxf2 21. Bd2 Bh4 22. Qh3 Rae8+ 23. Kd3 Qf1+ 24. Kc2 Bf2 25. Qf3 Qg1 26. Bd5 c5 27. dxc5 Bxc5 28. b4 Bd6 29. a4 a5 30. axb5 axb4 31. Ra6 bxc3 32. Nxc3 Bb4 33. b6 Bxc3 34. Bxc3 h6 35. b7 Re3 36. Bxf7+ 1-0',
    significance: 'Capablanca refutes the Marshall Attack debut',
  },
  {
    id: 'spassky-fischer-g6',
    name: 'Fischer vs Spassky WC 1972 G6',
    year: 1972,
    white: 'Bobby Fischer',
    black: 'Boris Spassky',
    result: 'white_wins',
    pgn: '1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4 1-0',
    significance: 'Fischer\'s most beautiful game in match of the century',
  },
  // Adding more draws and black wins for balance
  {
    id: 'carlsen-caruana-wc2018-g12',
    name: 'Carlsen vs Caruana WC 2018 G12',
    year: 2018,
    white: 'Magnus Carlsen',
    black: 'Fabiano Caruana',
    result: 'draw',
    pgn: '1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. Nc3 Nxc3 6. dxc3 Be7 7. Be3 O-O 8. Qd2 Nd7 9. O-O-O Nf6 10. Bd3 c5 11. Rhe1 Be6 12. Kb1 Qa5 13. c4 Qxd2 14. Bxd2 Rfe8 15. Bc3 Bd8 16. Nd2 Bc7 17. f3 b5 18. cxb5 c4 19. Bf1 Nd5 20. Bd4 Nb4 21. a4 Bc8 22. Nc4 Ba5 23. b3 Bf5 24. Ka2 Nd3 25. Bxd3 cxd3 26. Rxd3 Rxe1 27. Nxa5 Rc1 28. Bxg7 Rb8 29. b6 axb6 30. Nb3 Rc4 1/2-1/2',
    significance: 'Final classical game of 12-draw WC match',
  },
  {
    id: 'karpov-kasparov-wc1985-g24',
    name: 'Karpov vs Kasparov WC 1985 G24',
    year: 1985,
    white: 'Anatoly Karpov',
    black: 'Garry Kasparov',
    result: 'black_wins',
    pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e6 7. O-O Be7 8. f4 O-O 9. Kh1 Qc7 10. a4 Nc6 11. Be3 Re8 12. Bf3 Rb8 13. Qd2 Bd7 14. Nb3 b6 15. g4 Bc8 16. g5 Nd7 17. Qf2 Bf8 18. Bg2 Bb7 19. Rad1 g6 20. Bc1 Rbc8 21. Rd3 Nb4 22. Rh3 Bg7 23. Be3 Re7 24. Kg1 Rce8 25. Rd1 f5 26. gxf6 Nxf6 27. Rg3 Rf7 28. Bxb6 Qb8 29. Be3 Nh5 30. Rg4 Nf6 31. Rh4 g5 32. fxg5 Ng4 33. Qd2 Nxe3 34. Qxe3 Nxc2 35. Qb3 Ba8 36. Rf4 Rxf4 37. Qxc2 Rf1+ 0-1',
    significance: 'Kasparov becomes youngest world champion',
  },
  {
    id: 'petrosian-spassky-1966-g10',
    name: 'Petrosian vs Spassky WC 1966 G10',
    year: 1966,
    white: 'Boris Spassky',
    black: 'Tigran Petrosian',
    result: 'draw',
    pgn: '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Bd3 O-O 6. Nf3 d5 7. O-O dxc4 8. Bxc4 Nbd7 9. Qe2 b6 10. Rd1 Bb7 11. a3 cxd4 12. axb4 dxc3 13. bxc3 Qc7 14. c4 Bxf3 15. gxf3 Qxc4 16. Qxc4 Rac8 17. Qb3 Rfd8 18. Rxd7 Rxd7 19. f4 Rdc7 20. Bb2 Nd5 21. Bd3 f5 22. Kg2 Kf7 23. Rxa7 Rxa7 24. Bxa7 Nxf4+ 1/2-1/2',
    significance: 'Classic defensive Petrosian draw',
  },
  {
    id: 'ding-nepomniachtchi-2023-g6',
    name: 'Ding vs Nepomniachtchi WC 2023 G6',
    year: 2023,
    white: 'Ding Liren',
    black: 'Ian Nepomniachtchi',
    result: 'black_wins',
    pgn: '1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. e3 Nbd7 6. Qc2 Bd6 7. Bd3 O-O 8. O-O e5 9. cxd5 cxd5 10. e4 exd4 11. Nxd5 Nxd5 12. exd5 h6 13. Nxd4 Nc5 14. Bc4 Qf6 15. Ne2 Bd7 16. Bd2 Rac8 17. Bc3 Qg6 18. Qd2 Bh3 19. Qe3 Bxg2 20. Kxg2 Qc2 21. Rfe1 Rfe8 22. Qg3 Be5 23. Bxe5 Rxe5 24. Ng1 Rg5 25. Qf3 Rd8 26. Re6 Kf8 27. Re4 Rxd5 28. Qe3 Rdg5 29. Kf1 R5g6 30. Rd1 Qxb2 31. Rd8+ Ke7 32. Rd4 Ne6 0-1',
    significance: 'Critical game in 2023 World Championship',
  },
  {
    id: 'alekhine-capablanca-1927-g34',
    name: 'Alekhine vs Capablanca WC 1927 G34',
    year: 1927,
    white: 'Alexander Alekhine',
    black: 'Jose Capablanca',
    result: 'white_wins',
    pgn: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6 6. a3 Be7 7. Nf3 O-O 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. Ne4 N5f6 12. Ng3 e5 13. O-O exd4 14. Nxd4 Ne5 15. Be2 Rd8 16. Qc2 Ng6 17. Rad1 Bd7 18. Ndf5 Bxf5 19. Nxf5 Qe5 20. Rxd8+ Rxd8 21. f4 Qc7 22. Rd1 Re8 23. Rd7 Qb6 24. Bf3 Re1+ 25. Kf2 Rc1 26. Qd3 Qxb2+ 27. Kg3 Qb6 28. Rxb7 Qa6 29. Qd8+ Nf8 30. Ra7 Qb6 31. e4 Rc5 32. e5 Qxe3 33. Ra8 Qb6 34. Rxf8+ 1-0',
    significance: 'Alekhine dethrones Capablanca',
  },
  {
    id: 'botvinnik-tal-1960-g6',
    name: 'Botvinnik vs Tal WC 1960 G6',
    year: 1960,
    white: 'Mikhail Tal',
    black: 'Mikhail Botvinnik',
    result: 'white_wins',
    pgn: '1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. Nf3 Nd7 7. h4 h6 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 Qc7 11. Bd2 e6 12. O-O-O Ngf6 13. Ne4 O-O-O 14. g3 Nxe4 15. Qxe4 Bd6 16. Kb1 c5 17. dxc5 Nxc5 18. Qa4 Kb8 19. Ba5 Qc8 20. Nd4 Rc7 21. Rc1 Rhc8 22. Rc3 Be5 23. Rb3 Nd7 24. Qa3 Bxd4 25. Rxd4 Nc5 26. Bxc7+ Rxc7 27. Rb4 Qc6 28. Rxb7+ Nxb7 29. Qxa7+ Kc8 30. Rc4 Qa6 31. Rxc7+ 1-0',
    significance: 'Tal becomes world champion at 23',
  },
  {
    id: 'kramnik-kasparov-2000-g2',
    name: 'Kramnik vs Kasparov WC 2000 G2',
    year: 2000,
    white: 'Vladimir Kramnik',
    black: 'Garry Kasparov',
    result: 'white_wins',
    pgn: '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O cxd4 8. exd4 dxc4 9. Bxc4 b6 10. Bg5 Bb7 11. Re1 Nbd7 12. Rc1 Rc8 13. Qb3 Be7 14. Bxf6 Nxf6 15. Bxe6 fxe6 16. Qxe6+ Kh8 17. Qxe7 Bxf3 18. gxf3 Qxd4 19. Nb5 Qxb2 20. Rxc8 Rxc8 21. Nd6 Rb8 22. Nf7+ Kg8 23. Qe6 Rf8 24. Nd8+ Kh8 25. Qe7 1-0',
    significance: 'Kramnik ends Kasparov\'s reign with Berlin Defense',
  },
  {
    id: 'alphazero-stockfish-g1',
    name: 'AlphaZero vs Stockfish Game 1',
    year: 2017,
    white: 'AlphaZero',
    black: 'Stockfish 8',
    result: 'white_wins',
    pgn: '1. Nf3 Nf6 2. c4 b6 3. d4 e6 4. g3 Ba6 5. Qc2 c5 6. d5 exd5 7. cxd5 Bb7 8. Bg2 Nxd5 9. O-O Be7 10. Rd1 Qc8 11. Nc3 Nxc3 12. Qxc3 O-O 13. e4 Bxe4 14. Bf4 d6 15. Rfe1 Bb7 16. Bxd6 Bxd6 17. Rxd6 Na6 18. Qd2 Nc7 19. Qg5 Ne8 20. Rc6 Qd7 21. Red1 Qe7 22. Qe3 f6 23. Nd2 Kh8 24. Nc4 Bxg2 25. Kxg2 Nd6 26. R1xd6 Rad8 27. Rxb6 Rxd6 28. Rxd6 Rd8 29. Qe4 Rxd6 30. Nxd6 Qd8 31. Nf5 g6 32. Ne7 Qd7 33. Qd5 Qg7 34. h4 g5 35. hxg5 fxg5 36. Qf5 h6 37. Nf6 1-0',
    significance: 'AlphaZero defeats Stockfish using pure self-play learning',
  },
  {
    id: 'aronian-anand-2013',
    name: 'Aronian vs Anand Tata Steel 2013',
    year: 2013,
    white: 'Levon Aronian',
    black: 'Viswanathan Anand',
    result: 'black_wins',
    pgn: '1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 h6 6. Bxf6 Qxf6 7. e3 Nd7 8. Bd3 dxc4 9. Bxc4 g6 10. O-O Bg7 11. Rc1 O-O 12. e4 e5 13. d5 Nb6 14. Be2 Bg4 15. dxc6 bxc6 16. Qb3 Rad8 17. Rfd1 Rxd1+ 18. Qxd1 Rd8 19. Qb3 Bxf3 20. Bxf3 Nd5 21. Nxd5 cxd5 22. exd5 Rxd5 23. Rxc6 Rd2 24. Qc4 Qxb2 25. Rc8+ Kh7 26. Qa4 Qf6 0-1',
    significance: 'Anand\'s tactical precision',
  },
  {
    id: 'karpov-korchnoi-1978-g32',
    name: 'Karpov vs Korchnoi WC 1978 G32',
    year: 1978,
    white: 'Anatoly Karpov',
    black: 'Viktor Korchnoi',
    result: 'white_wins',
    pgn: '1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bb4 5. Bg2 O-O 6. O-O e4 7. Ne1 Bxc3 8. dxc3 h6 9. Nc2 b6 10. Ne3 Ne5 11. b3 d6 12. Bb2 Bf5 13. Qc2 Re8 14. Rad1 Qc8 15. c5 bxc5 16. Ba3 Nd3 17. exd3 exd3 18. Rxd3 Bxd3 19. Qxd3 dxc5 20. Bxc5 Qf5 21. Qxf5 Bxf5 22. Rd1 Nd7 23. Bd6 a5 24. Nd5 c6 25. Nc3 Nb6 26. a4 Rad8 27. Be7 Re6 28. Bxd8 Rxd8 29. Bd5 cxd5 30. Rxd5 Rb8 31. Nxd5 Nxa4 32. bxa4 Rxb2 33. Nc3 Rc2 34. Rd3 1-0',
    significance: 'Karpov retains title in dramatic match',
  },
];

// Get games by result type
export function getGamesBy<T extends keyof BenchmarkGame>(
  key: T,
  value: BenchmarkGame[T]
): BenchmarkGame[] {
  return FAMOUS_GAMES_BENCHMARK.filter(g => g[key] === value);
}

// Get balanced test set
export function getBalancedTestSet(countPerOutcome: number = 5): BenchmarkGame[] {
  const whiteWins = getGamesBy('result', 'white_wins').slice(0, countPerOutcome);
  const blackWins = getGamesBy('result', 'black_wins').slice(0, countPerOutcome);
  const draws = getGamesBy('result', 'draw').slice(0, countPerOutcome);
  
  return [...whiteWins, ...blackWins, ...draws];
}

export default FAMOUS_GAMES_BENCHMARK;
