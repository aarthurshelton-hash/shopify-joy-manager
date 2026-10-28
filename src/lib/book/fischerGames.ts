// "Fischer in Color" - Bobby Fischer's Top 100 Games
// A coffee table art book by En Pensent
// Rendered in the Egyptian palette to honor his legendary status

export interface FischerGame {
  id: string;
  rank: number; // 1-100
  title: string;
  event: string;
  year: number;
  white: string;
  black: string;
  result: string;
  significance: string;
  pgn: string;
  haiku?: string;
}

// Selection: Bobby Fischer's classical wins from the pgnmentor.com archive, weighted by event
// (World Championship > Candidates > Interzonal > Olympiad > elite events) and opponent strength,
// plus games listed as notable on Wikipedia; capped per year and opponent; ordered chronologically.
// Every PGN is replayed with chess.js. Rank = chronological position.
export const fischerTop100: FischerGame[] = [
  {
    id: 'byrne-fischer-1956',
    rank: 1,
    title: 'The Game of the Century',
    event: 'New York Rosenwald',
    year: 1956,
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'A 13-year-old Fischer stuns the chess world with a queen sacrifice that leads to a spectacular victory.',
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
    id: 'fischer-feuerstein-1957',
    rank: 2,
    title: 'vs. Feuerstein, USA-ch 1957',
    event: 'USA-ch',
    year: 1957,
    white: 'Bobby Fischer',
    black: 'Arthur Feuerstein',
    result: '1-0',
    significance: 'USA-ch, New York, round 1, 1957. Fischer wins with White in 44 moves. Opening: Sicilian Defense.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1957.??.??"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Arthur Feuerstein"]
[Result "1-0"]
[ECO "A08"]

1. e4 c5 2. Nf3 e6 3. g3 Nf6 4. d3 d5 5. Nbd2 Be7 6. Bg2 O-O 7. O-O Nc6 8. Re1 Qc7 9. Qe2 Rd8 10. e5 Ne8 11. c3 b5 12. Nf1 b4 13. Bf4 Qa5 14. c4 Nc7 15. h4 Qb6 16. h5 b3 17. a3 dxc4 18. dxc4 Ba6 19. N1h2 Rac8 20. h6 g6 21. Bg5 Nd4 22. Qe3 Bxg5 23. Qxg5 Ne8 24. Ng4 Nf5 25. Rac1 Qc7 26. Nd2 Rd4 27. Nxb3 Rxc4 28. Rcd1 Ra4 29. Re4 Bb5 30. Rc1 Qb6 31. Nd2 Rxe4 32. Nxe4 Bd3 33. Ngf6+ Kh8 34. g4 Bxe4 35. Bxe4 Nd4 36. Nxe8 Qd8 37. Qxd8 Rxd8 38. Nd6 Ne2+ 39. Kf1 Nxc1 40. Nxf7+ Kg8 41. Nxd8 Nb3 42. Ke2 Nd4+ 43. Kd3 Kf8 44. Nc6 1-0`
  },
  {
    id: 'bernstein-fischer-1957',
    rank: 3,
    title: 'vs. Bernstein, USA-ch 1957',
    event: 'USA-ch',
    year: 1957,
    white: 'Sidney Bernstein',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'USA-ch, New York, round 4, 1957. Fischer wins with Black in 44 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1957.??.??"]
[Round "4"]
[White "Sidney Bernstein"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "B99"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Nbd7 9. O-O-O Qc7 10. g4 b5 11. Bg2 Bb7 12. Rhe1 b4 13. Nd5 exd5 14. exd5 Kf8 15. Nf5 Re8 16. Qe3 Bd8 17. Qd4 Bc8 18. Bh4 Nc5 19. Nxg7 Kxg7 20. g5 Bf5 21. gxf6+ Kh6 22. Qc4 Nd7 23. Qxc7 Bxc7 24. Bf3 Bd8 25. Bg5+ Kg6 26. Rg1 Bxf6 27. Bh4+ Kh6 28. Bxf6 Nxf6 29. Rg5 Be4 30. Rf1 Bg6 31. Rfg1 Re3 32. Bd1 Ne4 33. R5g2 f5 34. Be2 a5 35. h4 Rh3 36. h5 Bxh5 37. Bd3 Bg6 38. Rf1 Rf8 39. Kd1 Nf6 40. Re1 Nxd5 41. Rf2 Re3 42. Rg1 Re7 43. Kd2 Kg7 44. Rf3 0-1`
  },
  {
    id: 'fischer-bisguier-1957',
    rank: 4,
    title: 'vs. Bisguier, USA-ch 1957',
    event: 'USA-ch',
    year: 1957,
    white: 'Bobby Fischer',
    black: 'Arthur Bisguier',
    result: '1-0',
    significance: 'USA-ch, New York, round 5, 1957. Fischer wins with White in 41 moves. Opening: French Defense: Winawer.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1957.??.??"]
[Round "5"]
[White "Bobby Fischer"]
[Black "Arthur Bisguier"]
[Result "1-0"]
[ECO "C16"]

1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 b6 5. a3 Bxc3+ 6. bxc3 Qd7 7. Qg4 f5 8. Qg3 Ba6 9. Bxa6 Nxa6 10. Ne2 O-O-O 11. a4 Kb7 12. O-O Qf7 13. c4 Ne7 14. Bg5 dxc4 15. Qc3 Nd5 16. Qxc4 Ra8 17. Bd2 f4 18. Ra3 g5 19. a5 c6 20. axb6 axb6 21. Qb3 Nac7 22. c4 Rxa3 23. Qxa3 Ra8 24. Qb3 Ne7 25. Nc3 Qf5 26. Qb4 Nc8 27. Na4 f3 28. Nc5+ Kb8 29. Nd7+ Kb7 30. Qb3 Qg4 31. Nc5+ Kb8 32. g3 Qxd4 33. Be3 Qa1 34. Rb1 Ra3 35. Nd7+ Kb7 36. Qd1 Qa2 37. Nxb6 Nxb6 38. Rxb6+ Kc8 39. Qxf3 Qxc4 40. Qf8+ Kd7 41. Qxa3 1-0`
  },
  {
    id: 'fischer-sherwin-1957',
    rank: 5,
    title: 'vs. Sherwin, USA-ch 1957',
    event: 'USA-ch',
    year: 1957,
    white: 'Bobby Fischer',
    black: 'James Sherwin',
    result: '1-0',
    significance: 'USA-ch, New York, round 7, 1957. Fischer wins with White in 36 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1957.??.??"]
[Round "7"]
[White "Bobby Fischer"]
[Black "James Sherwin"]
[Result "1-0"]
[ECO "B87"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. O-O b5 8. Bb3 b4 9. Nb1 Bd7 10. Be3 Nc6 11. f3 Be7 12. c3 bxc3 13. Nxc6 Bxc6 14. Nxc3 O-O 15. Rc1 Qb8 16. Nd5 exd5 17. Rxc6 dxe4 18. fxe4 Qb5 19. Rb6 Qe5 20. Bd4 Qg5 21. Qf3 Nd7 22. Rb7 Ne5 23. Qe2 Bf6 24. Kh1 a5 25. Bd5 Rac8 26. Bc3 a4 27. Ra7 Ng4 28. Rxa4 Bxc3 29. bxc3 Rxc3 30. Rxf7 Rc1+ 31. Qf1 h5 32. Qxc1 Qh4 33. Rxf8+ Kh7 34. h3 Qg3 35. hxg4 h4 36. Be6 1-0`
  },
  {
    id: 'kramer-fischer-1957',
    rank: 6,
    title: 'vs. Kramer, USA-ch 1957',
    event: 'USA-ch',
    year: 1957,
    white: 'George Kramer',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'USA-ch, New York, round 8, 1957. Fischer wins with Black in 32 moves. Opening: Réti Opening: King\'s Indian Attack.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1957.??.??"]
[Round "8"]
[White "George Kramer"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "A04"]

1. Nf3 Nf6 2. g3 g6 3. Bg2 Bg7 4. O-O O-O 5. d3 d6 6. e4 c5 7. c3 Nc6 8. Ne1 Rb8 9. f4 Ne8 10. Be3 Bd7 11. Nd2 b5 12. e5 dxe5 13. Bxc5 exf4 14. Rxf4 Nc7 15. Rf1 b4 16. Qc2 bxc3 17. bxc3 Nb5 18. d4 Rc8 19. Qb2 Nxc3 20. Qxc3 Nxd4 21. Qb4 Ne2+ 22. Kh1 Rxc5 23. Qxc5 Bxa1 24. Nef3 Bg7 25. Re1 Nc3 26. Qxa7 Be6 27. a3 Qd6 28. Qa5 Bd5 29. Nb1 Ra8 30. Qb4 Qxb4 31. axb4 Bxf3 32. Nxc3 Bxg2+ 0-1`
  },
  {
    id: 'fischer-mednis-1957',
    rank: 7,
    title: 'vs. Mednis, USA-ch 1957',
    event: 'USA-ch',
    year: 1957,
    white: 'Bobby Fischer',
    black: 'Edmar Mednis',
    result: '1-0',
    significance: 'USA-ch, New York, round 9, 1957. Fischer wins with White in 39 moves. Opening: Pirc Defense.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1957.??.??"]
[Round "9"]
[White "Bobby Fischer"]
[Black "Edmar Mednis"]
[Result "1-0"]
[ECO "B07"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Bg5 Bg7 5. Qd2 h6 6. Bf4 c6 7. O-O-O Qa5 8. Kb1 g5 9. Bg3 Nh5 10. Bc4 b5 11. Bb3 Nd7 12. f4 Nxg3 13. hxg3 g4 14. e5 d5 15. f5 Nb6 16. Qf4 e6 17. Qxg4 Bf8 18. fxe6 Bxe6 19. Qf3 O-O-O 20. Nh3 Rg8 21. Qf2 Nc4 22. Bxc4 bxc4 23. Ka1 Rd7 24. Nb1 Rb7 25. c3 Rb6 26. Rd2 Kd7 27. Nf4 Be7 28. Rxh6 Rf8 29. Qf3 Ra6 30. a3 Rb8 31. Nxe6 fxe6 32. Rxe6 Bxa3 33. Nxa3 Kxe6 34. Qg4+ Ke7 35. Rf2 Re8 36. Qg5+ Kd7 37. Rf7+ Kc8 38. Qf5+ Kb8 39. Qd7 1-0`
  },
  {
    id: 'lombardy-fischer-1957',
    rank: 8,
    title: 'vs. Lombardy, USA-ch 1957',
    event: 'USA-ch',
    year: 1957,
    white: 'William Lombardy',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'USA-ch, New York, round 10, 1957. Fischer wins with Black in 53 moves. Opening: King\'s Indian Defense.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1957.??.??"]
[Round "10"]
[White "William Lombardy"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "E60"]

1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O Nc6 7. d5 Na5 8. Nfd2 c5 9. a3 b6 10. b4 Nb7 11. Bb2 a5 12. b5 e5 13. dxe6 fxe6 14. e4 e5 15. Nc3 Rb8 16. Nd5 Be6 17. a4 Nd7 18. Ra3 Bh6 19. f4 exf4 20. Nxf4 Bf7 21. Nd5 Bxd5 22. cxd5 Rxf1+ 23. Bxf1 Bg7 24. Bxg7 Kxg7 25. Nc4 Ne5 26. Nxe5 dxe5 27. Qg4 Qe7 28. Rd3 Nd6 29. Qe6 Re8 30. Bh3 Qc7 31. Qd7+ Qxd7 32. Bxd7 Rd8 33. Bc6 Nxe4 34. Re3 Nd2 35. Re2 Nc4 36. Re4 Nb2 37. Kf2 Nd1+ 38. Ke1 Nc3 39. Rxe5 Nxa4 40. Re7+ Kh6 41. Kd2 c4 42. Re4 Nc5 43. Re7 Na4 44. h4 Rf8 45. d6 c3+ 46. Kc2 Rf2+ 47. Kb3 Rb2+ 48. Kxa4 c2 49. Re1 Rb4+ 50. Ka3 Rb1 51. Be4 Rxe1 52. Bxc2 Re6 53. d7 Rd6 0-1`
  },
  {
    id: 'fischer-dicamillo-1957',
    rank: 9,
    title: 'vs. Di Camillo, USA-ch 1957',
    event: 'USA-ch',
    year: 1957,
    white: 'Bobby Fischer',
    black: 'Attilio Di Camillo',
    result: '1-0',
    significance: 'USA-ch, New York, round 11, 1957. Fischer wins with White in 69 moves. Opening: Réti Opening.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1957.??.??"]
[Round "11"]
[White "Bobby Fischer"]
[Black "Attilio Di Camillo"]
[Result "1-0"]
[ECO "E02"]

1. Nf3 Nc6 2. d4 d5 3. g3 Nf6 4. Bg2 e6 5. O-O Be7 6. c4 dxc4 7. Qa4 Bd7 8. Qxc4 Na5 9. Qc2 Rc8 10. Nc3 c5 11. dxc5 Bxc5 12. e4 Nc6 13. e5 Nb4 14. Qd2 Nfd5 15. a3 Nxc3 16. axb4 Bxb4 17. bxc3 Bxc3 18. Qa2 Bxa1 19. Qxa1 O-O 20. Qxa7 Bc6 21. Ba3 Re8 22. Bd6 Ra8 23. Qe3 Ra4 24. Nd2 Bxg2 25. Kxg2 Qa5 26. Rb1 Qd5+ 27. Nf3 Rc8 28. Qb6 h6 29. Qxb7 Qxb7 30. Rxb7 Rc2 31. Rb5 Raa2 32. Bc5 Rab2 33. Ra5 Ra2 34. Rb5 Rab2 35. Ra5 Ra2 36. Rxa2 Rxa2 37. Bd6 Rb2 38. Nd4 Ra2 39. Nb3 Ra4 40. Nc5 Ra2 41. Nd7 Ra4 42. Nc5 Rc4 43. Kf3 Rc3+ 44. Ke4 Rc2 45. Nd3 Re2+ 46. Kf3 Rc2 47. h4 Rc3 48. Ke4 Rc6 49. Bc5 Ra6 50. h5 Ra4+ 51. Bd4 Ra2 52. g4 Re2+ 53. Be3 Ra2 54. f4 g6 55. hxg6 fxg6 56. Nc5 Kf7 57. f5 gxf5+ 58. gxf5 exf5+ 59. Kxf5 h5 60. Ne4 Ra5 61. Bg5 Rd5 62. Nf6 Rd1 63. Nxh5 Rd5 64. Nf6 Ra5 65. Ne4 Rd5 66. Nd6+ Kf8 67. Ke6 Rd1 68. Be7+ Kg7 69. Kd7 Ra1 1-0`
  },
  {
    id: 'fuster-fischer-1958',
    rank: 10,
    title: 'vs. Fuster, Portoroz Interzonal 1958',
    event: 'Portoroz Interzonal',
    year: 1958,
    white: 'Geza Fuster',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Portoroz Interzonal, round 2, 1958. Fischer wins with Black in 36 moves. Opening: King\'s Indian Defense: Sämisch.',
    pgn: `[Event "Portoroz Interzonal"]
[Site "Portoroz"]
[Date "1958.??.??"]
[Round "2"]
[White "Geza Fuster"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "E86"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 e5 6. Nge2 O-O 7. Be3 c6 8. Qd2 Nbd7 9. d5 cxd5 10. Nxd5 Nxd5 11. Qxd5 Nc5 12. O-O-O Qa5 13. Qxd6 Ne6 14. a3 b5 15. Bd2 Qa4 16. Qb4 Rb8 17. Qxa4 bxa4 18. Bb4 Rd8 19. Rxd8+ Nxd8 20. Nc3 Bd7 21. Bd6 Ra8 22. c5 Nb7 23. Bb5 Bxb5 24. Nxb5 Nxc5 25. Bxc5 Rc8 26. Nxa7 Rxc5+ 27. Kb1 Bh6 28. Rd1 Kg7 29. g4 Be3 30. h4 h5 31. gxh5 gxh5 32. Rd3 Rc1+ 33. Ka2 Bxa7 34. Rd7 Bd4 35. f4 Rc2 36. Ka1 Rd2 0-1`
  },
  {
    id: 'fischer-kalme-1958',
    rank: 11,
    title: 'vs. Kalme, USA-ch 1958',
    event: 'USA-ch',
    year: 1958,
    white: 'Bobby Fischer',
    black: 'G. Kalme',
    result: '1-0',
    significance: 'USA-ch, New York, round 2, 1958. Fischer wins with White in 57 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1958.??.??"]
[Round "2"]
[White "Bobby Fischer"]
[Black "G. Kalme"]
[Result "1-0"]
[ECO "C98"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d6 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Nc6 13. dxc5 dxc5 14. Nf1 Be6 15. Ne3 Rad8 16. Qe2 g6 17. Ng5 Bc8 18. a4 c4 19. axb5 axb5 20. b3 b4 21. Qxc4 h6 22. Nd5 Nxd5 23. exd5 hxg5 24. Qxc6 Qxc6 25. dxc6 bxc3 26. Rxe5 Bf6 27. Rea5 Rfe8 28. Bxg5 Bxg5 29. Rxg5 Rd2 30. Rc1 Ree2 31. Bxg6 fxg6 32. Rxc3 Kh7 33. b4 Re1+ 34. Kh2 Rxf2 35. b5 Rb2 36. Kg3 Kh6 37. Rcc5 Re3+ 38. Kf4 Reb3 39. Rgd5 Rxg2 40. Rd8 Be6 41. Ke5 Bxh3 42. Rh8+ Kg7 43. Rxh3 Rxh3 44. c7 Rh8 45. Rd5 Re2+ 46. Kd6 Kf6 47. b6 Rb2 48. Kc6 Rc8 49. Rd8 Rc2+ 50. Kb7 R8xc7+ 51. bxc7 Kf5 52. c8=Q+ Rxc8 53. Rxc8 g5 54. Kc6 g4 55. Kd5 Kf4 56. Kd4 Kf3 57. Kd3 1-0`
  },
  {
    id: 'fischer-weinstein-1958',
    rank: 12,
    title: 'vs. Weinstein, USA-ch 1958',
    event: 'USA-ch',
    year: 1958,
    white: 'Bobby Fischer',
    black: 'Raymond Weinstein',
    result: '1-0',
    significance: 'USA-ch, New York, round 4, 1958. Fischer wins with White in 58 moves. Opening: Sicilian Defense.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1958.??.??"]
[Round "4"]
[White "Bobby Fischer"]
[Black "Raymond Weinstein"]
[Result "1-0"]
[ECO "B88"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bc4 e6 7. O-O Be7 8. Bb3 O-O 9. f4 Bd7 10. Be3 Nxd4 11. Bxd4 Bc6 12. Qe2 b5 13. Nxb5 Bxb5 14. Qxb5 Nxe4 15. f5 Bf6 16. Qd3 d5 17. Bxf6 Nxf6 18. c4 dxc4 19. Qxd8 Rfxd8 20. Bxc4 e5 21. Rfe1 e4 22. Rad1 g6 23. fxg6 hxg6 24. h3 Kf8 25. Kf2 Ke7 26. Ke3 Rdc8 27. b3 Rc5 28. Rf1 Rac8 29. Rf2 R5c6 30. Rdf1 Rd6 31. Rf4 Rcd8 32. h4 Rh8 33. g3 Rh7 34. Ke2 Rh8 35. a3 Rg8 36. g4 g5 37. Rf5 gxh4 38. g5 Nh5 39. Re5+ Kd8 40. Rxf7 Ng3+ 41. Ke3 h3 42. Ree7 h2 43. Rxa7 Rc6 44. Rfd7+ Kc8 45. Rh7 Kb8 46. Rab7+ Kc8 47. Bxg8 h1=Q 48. Rxh1 Rc3+ 49. Kd2 Rd3+ 50. Kc2 Kxb7 51. Re1 Rd8 52. Bc4 Rh8 53. g6 Rh2+ 54. Kc3 Rh3 55. Re3 Ne2+ 56. Kd2 Rxe3 57. Kxe3 Ng3 58. Kf4 1-0`
  },
  {
    id: 'fischer-reshevsky-1958',
    rank: 13,
    title: 'vs. Reshevsky, USA-ch 1958',
    event: 'USA-ch',
    year: 1958,
    white: 'Bobby Fischer',
    black: 'Samuel Reshevsky',
    result: '1-0',
    significance: 'USA-ch, New York, round 6, 1958. Fischer wins with White in 42 moves. Opening: Sicilian Defense: Accelerated Dragon.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1958.??.??"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Samuel Reshevsky"]
[Result "1-0"]
[ECO "B35"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 Na5 9. e5 Ne8 10. Bxf7+ Kxf7 11. Ne6 dxe6 12. Qxd8 Nc6 13. Qd2 Bxe5 14. O-O Nd6 15. Bf4 Nc4 16. Qe2 Bxf4 17. Qxc4 Kg7 18. Ne4 Bc7 19. Nc5 Rf6 20. c3 e5 21. Rad1 Nd8 22. Nd7 Rc6 23. Qh4 Re6 24. Nc5 Rf6 25. Ne4 Rf4 26. Qxe7+ Rf7 27. Qa3 Nc6 28. Nd6 Bxd6 29. Rxd6 Bf5 30. b4 Rff8 31. b5 Nd8 32. Rd5 Nf7 33. Rc5 a6 34. b6 Be4 35. Re1 Bc6 36. Rxc6 bxc6 37. b7 Rab8 38. Qxa6 Nd8 39. Rb1 Rf7 40. h3 Rfxb7 41. Rxb7+ Rxb7 42. Qa8 1-0`
  },
  {
    id: 'sanguineti-fischer-1958',
    rank: 14,
    title: 'vs. Sanguineti, Portoroz Interzonal 1958',
    event: 'Portoroz Interzonal',
    year: 1958,
    white: 'Raul Sanguineti',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Portoroz Interzonal, round 9, 1958. Fischer wins with Black in 25 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "Portoroz Interzonal"]
[Site "Portoroz"]
[Date "1958.??.??"]
[Round "9"]
[White "Raul Sanguineti"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "B93"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. f4 e5 7. Nf3 Qc7 8. Bd3 Nbd7 9. O-O b5 10. Qe1 Bb7 11. Nh4 g6 12. Nf3 Bg7 13. Qh4 O-O 14. fxe5 dxe5 15. Bh6 Nh5 16. Bxg7 Kxg7 17. Rad1 Nf4 18. Rf2 f6 19. Rfd2 Nc5 20. Bf1 b4 21. Nd5 Bxd5 22. exd5 Ne4 23. Qe1 Nxd2 24. Qxd2 Nxd5 25. c4 bxc3 0-1`
  },
  {
    id: 'fischer-sherwin-1958',
    rank: 15,
    title: 'vs. Sherwin, Portoroz Interzonal 1958',
    event: 'Portoroz Interzonal',
    year: 1958,
    white: 'Bobby Fischer',
    black: 'James Sherwin',
    result: '1-0',
    significance: 'Portoroz Interzonal, round 14, 1958. Fischer wins with White in 90 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "Portoroz Interzonal"]
[Site "Portoroz"]
[Date "1958.??.??"]
[Round "14"]
[White "Bobby Fischer"]
[Black "James Sherwin"]
[Result "1-0"]
[ECO "C92"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 a5 10. d3 Bb7 11. Nbd2 a4 12. Bc2 Nb8 13. Nf1 c5 14. d4 cxd4 15. cxd4 Nc6 16. Ng3 g6 17. Bd2 Re8 18. d5 Na5 19. b3 Bc8 20. bxa4 bxa4 21. Bxa4 Bd7 22. Bxd7 Nxd7 23. Bb4 Qb6 24. a3 Nc5 25. Qe2 Reb8 26. Nd2 Nab3 27. Nxb3 Nxb3 28. Rab1 Nd4 29. Qd3 Qa6 30. Qxa6 Rxa6 31. Rb2 Rba8 32. Ra1 Ra4 33. Nf1 Nb5 34. Bd2 Rxa3 35. Rxa3 Nxa3 36. Rb7 Kf8 37. Ne3 Rc8 38. f3 h5 39. Bb4 Nc2 40. Nxc2 Rxc2 41. Rb6 Ke8 42. Bxd6 Bxd6 43. Rxd6 h4 44. Ra6 Rc1+ 45. Kh2 g5 46. Ra2 Rf1 47. Ra6 Rd1 48. Rb6 Ke7 49. Rb2 Rf1 50. Rb3 Rd1 51. g4 Rd2+ 52. Kg1 Rd1+ 53. Kf2 Rd2+ 54. Ke3 Rh2 55. Rb7+ Kf6 56. Rb6+ Ke7 57. Rb7+ Kf6 58. Rb6+ Ke7 59. Rh6 Rxh3 60. d6+ Kd7 61. Rf6 Rh2 62. Rxf7+ Kxd6 63. Rf6+ Ke7 64. Rg6 h3 65. Rxg5 Ke6 66. Rh5 Kf6 67. Kd3 Kg6 68. Rh8 Kg7 69. Rh4 Kg6 70. Rh5 Kf6 71. Ke3 Ke6 72. f4 exf4+ 73. Kxf4 Rh1 74. Kg3 Re1 75. Kxh3 Rxe4 76. Rf5 Ra4 77. Rf8 Ke7 78. Rf3 Ke6 79. Kh4 Ra8 80. g5 Rh8+ 81. Kg4 Ke7 82. g6 Rf8 83. Rf5 Rh8 84. Kg5 Rh1 85. Rf2 Rh3 86. g7 Rg3+ 87. Kh6 Rh3+ 88. Kg6 Rg3+ 89. Kh7 Rh3+ 90. Kg8 1-0`
  },
  {
    id: 'degreiff-fischer-1958',
    rank: 16,
    title: 'vs. De Greiff, Portoroz Interzonal 1958',
    event: 'Portoroz Interzonal',
    year: 1958,
    white: 'Boris De Greiff',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Portoroz Interzonal, round 15, 1958. Fischer wins with Black in 35 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "Portoroz Interzonal"]
[Site "Portoroz"]
[Date "1958.??.??"]
[Round "15"]
[White "Boris De Greiff"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "B93"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. f4 e5 7. Nf3 Qc7 8. Bd3 Nbd7 9. a4 b6 10. O-O Bb7 11. Kh1 g6 12. Qe1 Bg7 13. fxe5 dxe5 14. Qh4 O-O 15. Ng5 h6 16. Nh3 g5 17. Bxg5 hxg5 18. Nxg5 Rfd8 19. Nd5 Bxd5 20. exd5 Nf8 21. c4 Rd6 22. Rae1 Re8 23. h3 Qe7 24. Ne4 Nxe4 25. Qxe4 Rf6 26. Rf5 Rxf5 27. Qxf5 a5 28. b3 Rd8 29. Rf1 Rd6 30. Qg4 Rf6 31. Rf5 Rxf5 32. Bxf5 Qf6 33. Qe4 Ng6 34. g3 Ne7 35. Bh7+ 0-1`
  },
  {
    id: 'fischer-cardoso-1958',
    rank: 17,
    title: 'vs. Cardoso, Portoroz Interzonal 1958',
    event: 'Portoroz Interzonal',
    year: 1958,
    white: 'Bobby Fischer',
    black: 'Radolfo Cardoso',
    result: '1-0',
    significance: 'Portoroz Interzonal, round 20, 1958. Fischer wins with White in 62 moves. Opening: Caro-Kann Defense.',
    pgn: `[Event "Portoroz Interzonal"]
[Site "Portoroz"]
[Date "1958.??.??"]
[Round "20"]
[White "Bobby Fischer"]
[Black "Radolfo Cardoso"]
[Result "1-0"]
[ECO "B10"]

1. e4 c6 2. Nc3 d5 3. Nf3 dxe4 4. Nxe4 Bg4 5. h3 Bxf3 6. Qxf3 Nd7 7. Ng5 Ngf6 8. Qb3 e6 9. Qxb7 Nd5 10. Ne4 Nb4 11. Kd1 f5 12. c3 Rb8 13. Qxa7 fxe4 14. cxb4 Bxb4 15. Qd4 O-O 16. Bc4 Nc5 17. Qxd8 Rbxd8 18. Rf1 Rd4 19. b3 Bxd2 20. Ke2 Bxc1 21. Raxc1 Rfd8 22. Rfd1 Kf8 23. Rxd4 Rxd4 24. Rd1 Rxd1 25. Kxd1 Ke7 26. Kd2 Kd6 27. Kc3 Nd7 28. Kd4 Nf6 29. a4 c5+ 30. Ke3 g5 31. Be2 Kc6 32. Bc4 e5 33. a5 h6 34. Kd2 h5 35. Ke3 h4 36. Be2 Kb7 37. Bc4 Kc6 38. Ke2 Kb7 39. Kd2 Kc6 40. Ke3 Kb7 41. Kd2 Kc7 42. g4 Kc6 43. Kc3 Ne8 44. b4 Nd6 45. Bf1 cxb4+ 46. Kxb4 Nc8 47. Bg2 Kd5 48. a6 Na7 49. Ka5 Kc5 50. Bxe4 Nb5 51. Bg2 Na7 52. Ka4 Nb5 53. Kb3 Kb6 54. Kc4 Kxa6 55. Kd5 Kb6 56. Kxe5 Kc7 57. Kf6 Nc3 58. Kxg5 Nd1 59. f4 Kd6 60. Kxh4 Ke6 61. Kg5 Kf7 62. f5 1-0`
  },
  {
    id: 'keres-fischer-1959',
    rank: 18,
    title: 'vs. Keres, Candidats Tournament 1959',
    event: 'Candidats Tournament',
    year: 1959,
    white: 'Paul Keres',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Candidats Tournament, Bled/Zagreb/Belgrade, round 1, 1959. Fischer wins with Black in 53 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "1"]
[White "Paul Keres"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "B99"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. Be2 b5 11. Bxf6 Nxf6 12. e5 Bb7 13. exf6 Bxf3 14. Bxf3 Bxf6 15. Bxa8 d5 16. Bxd5 Bxd4 17. Rxd4 exd5 18. Nxd5 Qc5 19. Re1+ Kf8 20. c3 h5 21. f5 Rh6 22. f6 gxf6 23. Nf4 h4 24. Rd8+ Kg7 25. Ree8 Qg1+ 26. Kd2 Qf2+ 27. Ne2 Rg6 28. g3 f5 29. Rg8+ Kf6 30. Rxg6+ fxg6 31. gxh4 Qxh2 32. Rd4 Qh1 33. Kc2 Ke5 34. a4 Qf1 35. Nc1 Qg2+ 36. Kb3 bxa4+ 37. Ka3 Qc2 38. Nd3+ Kf6 39. Nc5 Qc1 40. Rxa4 Qe3 41. Nxa6 f4 42. Rd4 Kf5 43. Nb4 Qe7 44. Kb3 Qxh4 45. Nd3 g5 46. c4 Qg3 47. c5 f3 48. Kc4 f2 49. Nxf2 Qxf2 50. c6 Qxb2 51. Kc5 Qc3+ 52. Kd5 g4 53. Rc4 Qe5# 0-1`
  },
  {
    id: 'fischer-gligoric-1959',
    rank: 19,
    title: 'vs. Gligoric, Candidats Tournament 1959',
    event: 'Candidats Tournament',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Svetozar Gligoric',
    result: '1-0',
    significance: 'Candidats Tournament, Bled/Zagreb/Belgrade, round 4, 1959. Fischer wins with White in 32 moves. Opening: Sicilian Defense: Old Sicilian.',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "4"]
[White "Bobby Fischer"]
[Black "Svetozar Gligoric"]
[Result "1-0"]
[ECO "B57"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 Bd7 7. Bb3 g6 8. f3 Na5 9. Bg5 Bg7 10. Qd2 h6 11. Be3 Rc8 12. O-O-O Nc4 13. Qe2 Nxe3 14. Qxe3 O-O 15. g4 Qa5 16. h4 e6 17. Nde2 Rc6 18. g5 hxg5 19. hxg5 Nh5 20. f4 Rfc8 21. Kb1 Qb6 22. Qf3 Rc5 23. Qd3 Bxc3 24. Nxc3 Nxf4 25. Qf3 Nh5 26. Rxh5 gxh5 27. Qxh5 Be8 28. Qh6 Rxc3 29. bxc3 Rxc3 30. g6 fxg6 31. Rh1 Qd4 32. Qh7+ 1-0`
  },
  {
    id: 'fischer-benko-1959',
    rank: 20,
    title: 'vs. Benko, Candidats Tournament 1959',
    event: 'Candidats Tournament',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Pal Benko',
    result: '1-0',
    significance: 'Candidats Tournament, Bled/Zagreb/Belgrade, round 10, 1959. Fischer wins with White in 27 moves. Opening: Sicilian Defense: Old Sicilian.',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "10"]
[White "Bobby Fischer"]
[Black "Pal Benko"]
[Result "1-0"]
[ECO "B57"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 Qb6 7. Nde2 e6 8. O-O Be7 9. Bb3 O-O 10. Kh1 Na5 11. Bg5 Qc5 12. f4 b5 13. Ng3 b4 14. e5 dxe5 15. Bxf6 gxf6 16. Nce4 Qd4 17. Qh5 Nxb3 18. Qh6 exf4 19. Nh5 f5 20. Rad1 Qe5 21. Nef6+ Bxf6 22. Nxf6+ Qxf6 23. Qxf6 Nc5 24. Qg5+ Kh8 25. Qe7 Ba6 26. Qxc5 Bxf1 27. Rxf1 1-0`
  },
  {
    id: 'keres-fischer-1959-2',
    rank: 21,
    title: 'vs. Keres, Candidats Tournament 1959',
    event: 'Candidats Tournament',
    year: 1959,
    white: 'Paul Keres',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Candidats Tournament, Bled/Zagreb/Belgrade, round 15, 1959. Fischer wins with Black in 27 moves. Opening: Indian Game.',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "15"]
[White "Paul Keres"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "A48"]

1. d4 Nf6 2. Nf3 g6 3. Bf4 Bg7 4. Nbd2 c5 5. c3 cxd4 6. cxd4 d5 7. Bxb8 Rxb8 8. Qa4+ Bd7 9. Qxa7 Ne4 10. e3 Nxd2 11. Nxd2 e5 12. Nb3 O-O 13. Qc5 Rc8 14. Qb4 Re8 15. Be2 exd4 16. Nxd4 Qh4 17. Qxb7 Bxd4 18. Qxd7 Bxb2 19. Rd1 Bc3+ 20. Kf1 d4 21. exd4 Qe4 22. Qg4 Qc2 23. g3 Qxa2 24. Bb5 Qd5 25. Bxe8 Qxh1+ 26. Ke2 Rxe8+ 27. Kd3 Be1 0-1`
  },
  {
    id: 'fischer-petrosian-1959',
    rank: 22,
    title: 'Fischer vs Petrosian',
    event: 'Candidats Tournament',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Tigran Petrosian',
    result: '1/2-1/2',
    significance: 'The only prominent game in which four queens were on board for as many as seven moves. The game ended with a draw by agreement.',
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
    id: 'fischer-smyslov-1959',
    rank: 23,
    title: 'vs. Smyslov, Candidats Tournament 1959',
    event: 'Candidats Tournament',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Vassily Smyslov',
    result: '0-1',
    significance: 'Candidats Tournament, Bled/Zagreb/Belgrade, round 21, 1959. Fischer loses with White in 48 moves. Opening: Sicilian Defense.',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "21"]
[White "Bobby Fischer"]
[Black "Vassily Smyslov"]
[Result "0-1"]
[ECO "B87"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 Be7 7. O-O a6 8. Bb3 b5 9. f4 O-O 10. f5 b4 11. Nce2 e5 12. Nf3 Bb7 13. Ng3 Nxe4 14. Nxe4 Bxe4 15. Qe1 Bxf3 16. Rxf3 Nc6 17. Qe4 Nd4 18. Rh3 Bf6 19. Bd5 Rc8 20. c3 bxc3 21. bxc3 Nb5 22. Bd2 Rc5 23. Kh1 Qd7 24. Bb3 d5 25. Qf3 Nd6 26. Rf1 Ne4 27. Qh5 h6 28. Bxh6 gxh6 29. Bc2 Bg5 30. f6 Rb8 31. Bxe4 dxe4 32. Rg3 Qf5 33. Kg1 Qg6 34. Qe2 Rc6 35. h4 Rxf6 36. Rxf6 Qxf6 37. Qh5 Qf4 38. Kh2 Kg7 39. hxg5 hxg5 40. Qxg5+ Qxg5 41. Rxg5+ Kf6 42. Rh5 Rb1 43. Kg3 Rf1 44. Rh4 Kf5 45. Rh5+ Ke6 46. Rh6+ f6 47. Rh4 e3 48. Re4 f5 0-1`
  },
  {
    id: 'fischer-benko-1959-2',
    rank: 24,
    title: 'vs. Benko, Candidats Tournament 1959',
    event: 'Candidats Tournament',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Pal Benko',
    result: '1-0',
    significance: 'Candidats Tournament, Bled/Zagreb/Belgrade, round 24, 1959. Fischer wins with White in 39 moves. Opening: Caro-Kann Defense.',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "24"]
[White "Bobby Fischer"]
[Black "Pal Benko"]
[Result "1-0"]
[ECO "B11"]

1. e4 c6 2. Nc3 d5 3. Nf3 Bg4 4. h3 Bxf3 5. Qxf3 Nf6 6. d3 e6 7. g3 Bb4 8. Bd2 d4 9. Nb1 Qb6 10. b3 a5 11. a3 Bxd2+ 12. Nxd2 Qc5 13. Qd1 h5 14. h4 Nbd7 15. Bg2 Ng4 16. O-O g5 17. b4 Qe7 18. Nf3 gxh4 19. Nxh4 Nde5 20. Qd2 Rg8 21. Qf4 f6 22. bxa5 Rxa5 23. Rfb1 b5 24. Nf3 Ra4 25. Bh3 Nxf3+ 26. Qxf3 Kd7 27. Kg2 Qg7 28. Rb4 Rga8 29. Rxa4 Rxa4 30. Bxg4 hxg4 31. Qf4 Ra8 32. Rh1 Rg8 33. a4 bxa4 34. Rb1 e5 35. Rb7+ Kd6 36. Rxg7 exf4 37. Rxg8 f3+ 38. Kh1 Kc5 39. Rb8 1-0`
  },
  {
    id: 'fischer-tal-1959',
    rank: 25,
    title: 'vs. Tal, Candidats Tournament 1959',
    event: 'Candidats Tournament',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Mihail Tal',
    result: '0-1',
    significance: 'Candidats Tournament, Bled/Zagreb/Belgrade, round 27, 1959. Fischer loses with White in 51 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "27"]
[White "Bobby Fischer"]
[Black "Mihail Tal"]
[Result "0-1"]
[ECO "B87"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 b5 8. f4 b4 9. Na4 Nxe4 10. O-O g6 11. f5 gxf5 12. Nxf5 Rg8 13. Bd5 Ra7 14. Bxe4 exf5 15. Bxf5 Re7 16. Bxc8 Qxc8 17. Bf4 Qc6 18. Qf3 Qxa4 19. Bxd6 Qc6 20. Bxb8 Qb6+ 21. Kh1 Qxb8 22. Qc6+ Rd7 23. Rae1+ Be7 24. Rxf7 Kxf7 25. Qe6+ Kf8 26. Qxd7 Qd6 27. Qb7 Rg6 28. c3 a5 29. Qc8+ Kg7 30. Qc4 Bd8 31. cxb4 axb4 32. g3 Qc6+ 33. Re4 Qxc4 34. Rxc4 Rb6 35. Kg2 Kf6 36. Kf3 Ke5 37. Ke3 Bg5+ 38. Ke2 Kd5 39. Kd3 Bf6 40. Rc2 Be5 41. Re2 Rf6 42. Rc2 Rf3+ 43. Ke2 Rf7 44. Kd3 Bd4 45. a3 b3 46. Rc8 Bxb2 47. Rd8+ Kc6 48. Rb8 Rf3+ 49. Kc4 Rc3+ 50. Kb4 Ba1 51. a4 b2 0-1`
  },
  {
    id: 'smyslov-fischer-1959',
    rank: 26,
    title: 'vs. Smyslov, Candidats Tournament 1959',
    event: 'Candidats Tournament',
    year: 1959,
    white: 'Vassily Smyslov',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Candidats Tournament, Bled/Zagreb/Belgrade, round 28, 1959. Fischer wins with Black in 54 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "Candidats Tournament"]
[Site "Bled/Zagreb/Belgrade"]
[Date "1959.??.??"]
[Round "28"]
[White "Vassily Smyslov"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "B99"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. g4 b5 11. Bxf6 Nxf6 12. g5 Nd7 13. Bh3 b4 14. Nce2 Bb7 15. Kb1 Nc5 16. Ng3 d5 17. f5 dxe4 18. Qg4 exf5 19. Ndxf5 g6 20. Nxe7 Qxe7 21. Qf4 O-O 22. Rd6 Rad8 23. Rf6 Rd5 24. Bg4 Nd7 25. Rf1 e3 26. b3 Rd2 27. Bxd7 Rxd7 28. Re1 Re8 29. h4 Qc5 30. Qc4 Qxc4 31. bxc4 Rd4 32. c5 Rxh4 33. c6 Bc8 34. Rd6 Rc4 35. Kb2 Kg7 36. Kb3 Rg4 37. Ne2 Re6 38. Red1 Rg2 39. Nf4 Rxd6 40. Rxd6 Rd2 41. Rd3 Rf2 42. Rd4 e2 43. Nd3 Bf5 44. c7 Rf3 45. c8=Q Bxc8 46. Re4 Bf5 47. Rxe2 Bxd3 48. cxd3 Rxd3+ 49. Kxb4 Rd5 50. Rg2 h6 51. gxh6+ Kxh6 52. a4 g5 53. Rc2 Rd6 54. Kc5 Re6 0-1`
  },
  {
    id: 'fischer-berliner-1960',
    rank: 27,
    title: 'vs. Berliner, USA-ch 1960',
    event: 'USA-ch',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'Hans Berliner',
    result: '1-0',
    significance: 'USA-ch, New York, round 5, 1960. Fischer wins with White in 36 moves. Opening: Alekhine\'s Defense.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1960.??.??"]
[Round "5"]
[White "Bobby Fischer"]
[Black "Hans Berliner"]
[Result "1-0"]
[ECO "B03"]

1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. exd6 cxd6 6. Nc3 g6 7. Bd3 Bg7 8. Nge2 Nc6 9. Be3 O-O 10. O-O e5 11. d5 Ne7 12. b3 Nd7 13. Ne4 Nf5 14. Bg5 f6 15. Bd2 Nc5 16. Nxc5 dxc5 17. Bxf5 Bxf5 18. f4 exf4 19. Nxf4 Qd6 20. Nh5 Rae8 21. Nxg7 Kxg7 22. Bf4 Qd7 23. Qd2 Rf7 24. Bh6+ Kg8 25. Rae1 Rfe7 26. Rxe7 Qxe7 27. h3 Qe4 28. Qf2 Qe7 29. g4 Bd3 30. Rd1 Be4 31. d6 Qe5 32. Bf4 Qc3 33. d7 Rd8 34. Qe2 Qf3 35. Qxf3 Bxf3 36. Bc7 1-0`
  },
  {
    id: 'szabo-fischer-1960',
    rank: 28,
    title: 'vs. Szabo, Leipzig olm fin-A 1960',
    event: 'Leipzig olm fin-A',
    year: 1960,
    white: 'Laszlo Szabo',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Leipzig olm fin-A, round 6, 1960. Fischer wins with Black in 24 moves. Opening: King\'s Indian Defense.',
    pgn: `[Event "Leipzig olm fin-A"]
[Site "Leipzig"]
[Date "1960.??.??"]
[Round "6"]
[White "Laszlo Szabo"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "E70"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 O-O 5. Bg5 d6 6. Qd2 c5 7. d5 e6 8. Bd3 exd5 9. Nxd5 Be6 10. Ne2 Bxd5 11. exd5 Nbd7 12. O-O Ne5 13. f4 Nxd3 14. Qxd3 h6 15. Bh4 Re8 16. Rae1 Qb6 17. Bxf6 Bxf6 18. f5 g5 19. b3 Qa5 20. Rc1 Qxa2 21. Rc2 Re3 22. Qxe3 Qxc2 23. Kh1 a5 24. h4 a4 0-1`
  },
  {
    id: 'fischer-euwe-1960',
    rank: 29,
    title: 'vs. Euwe, Leipzig olm fin-A 1960',
    event: 'Leipzig olm fin-A',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'Max Euwe',
    result: '1-0',
    significance: 'Leipzig olm fin-A, round 7, 1960. Fischer wins with White in 36 moves. Opening: Caro-Kann: Panov-Botvinnik Attack.',
    pgn: `[Event "Leipzig olm fin-A"]
[Site "Leipzig"]
[Date "1960.??.??"]
[Round "7"]
[White "Bobby Fischer"]
[Black "Max Euwe"]
[Result "1-0"]
[ECO "B13"]

1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 Nc6 6. Nf3 Bg4 7. cxd5 Nxd5 8. Qb3 Bxf3 9. gxf3 e6 10. Qxb7 Nxd4 11. Bb5+ Nxb5 12. Qc6+ Ke7 13. Qxb5 Nxc3 14. bxc3 Qd7 15. Rb1 Rd8 16. Be3 Qxb5 17. Rxb5 Rd7 18. Ke2 f6 19. Rd1 Rxd1 20. Kxd1 Kd7 21. Rb8 Kc6 22. Bxa7 g5 23. a4 Bg7 24. Rb6+ Kd5 25. Rb7 Bf8 26. Rb8 Bg7 27. Rb5+ Kc6 28. Rb6+ Kd5 29. a5 f5 30. Bb8 Rc8 31. a6 Rxc3 32. Rb5+ Kc4 33. Rb7 Bd4 34. Rc7+ Kd3 35. Rxc3+ Kxc3 36. Be5 1-0`
  },
  {
    id: 'fischer-olafsson-1960',
    rank: 30,
    title: 'vs. Olafsson, Mar del Plata 1960',
    event: 'Mar del Plata',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'Fridrik Olafsson',
    result: '1-0',
    significance: 'Mar del Plata, round 7, 1960. Fischer wins with White in 42 moves. Opening: Sicilian Defense.',
    pgn: `[Event "Mar del Plata"]
[Site "Mar del Plata"]
[Date "1960.??.??"]
[Round "7"]
[White "Bobby Fischer"]
[Black "Fridrik Olafsson"]
[Result "1-0"]
[ECO "B52"]

1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7 4. Bxd7+ Qxd7 5. O-O Nc6 6. Qe2 g6 7. c3 Bg7 8. Rd1 e5 9. Na3 Nge7 10. d4 cxd4 11. cxd4 exd4 12. Nb5 O-O 13. Nfxd4 d5 14. Nb3 a6 15. Nc3 d4 16. Na4 Rae8 17. Bf4 Nd5 18. Bg3 Qe7 19. Nac5 Kh8 20. Re1 Nb6 21. Rac1 f5 22. Qd2 Qf7 23. exf5 gxf5 24. Nd3 Nd5 25. Bd6 Rg8 26. Na5 Nxa5 27. Rxe8 Rxe8 28. Qxa5 h6 29. g3 Kh7 30. Nf4 Nxf4 31. Bxf4 Qe6 32. Bd2 Rc8 33. Re1 Qf7 34. Re7 Qg6 35. Rxb7 f4 36. Qd5 Re8 37. Bxf4 Re1+ 38. Kg2 Qd3 39. Kh3 Qg6 40. Rd7 h5 41. Kg2 h4 42. Rd6 1-0`
  },
  {
    id: 'fischer-unzicker-1960',
    rank: 31,
    title: 'vs. Unzicker, Leipzig olm prel 1960',
    event: 'Leipzig olm prel',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'Wolfgang Unzicker',
    result: '1-0',
    significance: 'Leipzig olm prel, round 9, 1960. Fischer wins with White in 55 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "Leipzig olm prel"]
[Site "Leipzig"]
[Date "1960.??.??"]
[Round "9"]
[White "Bobby Fischer"]
[Black "Wolfgang Unzicker"]
[Result "1-0"]
[ECO "C96"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 cxd4 12. cxd4 Bb7 13. Nbd2 Nc6 14. d5 Nb4 15. Bb1 a5 16. Nf1 Na6 17. Ng3 Bc8 18. Bd3 Bd7 19. Be3 Qb8 20. Rc1 Bd8 21. Qe2 Qb7 22. Nh2 Nb4 23. Bb1 Bb6 24. Bg5 Bd8 25. Qf3 Ne8 26. Be3 Bb6 27. Bd2 Nf6 28. Ng4 Nxg4 29. hxg4 Rac8 30. Nf5 Bxf5 31. Qxf5 Bd4 32. a3 Na6 33. b4 axb4 34. axb4 Bb2 35. Rxc8 Rxc8 36. Qf3 Qb6 37. Rd1 Bd4 38. g3 Rc4 39. Bd3 Rc7 40. Kg2 Bc3 41. Be3 Qb8 42. Rh1 Qc8 43. Bxb5 Nxb4 44. Qd1 Bd4 45. Bxd4 exd4 46. g5 Qb8 47. Qh5 Qxb5 48. Qxh7+ Kf8 49. Qh8+ Ke7 50. Qxg7 Nxd5 51. Qxd4 Nc3 52. Qf6+ Kd7 53. g6 Nxe4 54. Qxf7+ Kc8 55. g7 1-0`
  },
  {
    id: 'fischer-pachman-1960',
    rank: 32,
    title: 'vs. Pachman, Leipzig olm fin-A 1960',
    event: 'Leipzig olm fin-A',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'Ludek Pachman',
    result: '1-0',
    significance: 'Leipzig olm fin-A, round 10, 1960. Fischer wins with White in 43 moves. Opening: French Defense: Classical.',
    pgn: `[Event "Leipzig olm fin-A"]
[Site "Leipzig"]
[Date "1960.??.??"]
[Round "10"]
[White "Bobby Fischer"]
[Black "Ludek Pachman"]
[Result "1-0"]
[ECO "C11"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 dxe4 5. Nxe4 Be7 6. Bxf6 Bxf6 7. Nf3 Nd7 8. Bc4 O-O 9. O-O c6 10. Qe2 b6 11. Rad1 Qc7 12. Nxf6+ Nxf6 13. Qe5 Qe7 14. c3 Bb7 15. Rfe1 Rfd8 16. Ng5 h6 17. Ne4 Nxe4 18. Rxe4 Qd6 19. Qh5 c5 20. Rg4 Kf8 21. Rd3 cxd4 22. Rgxd4 Qc7 23. Qh4 Rxd4 24. Qxd4 Re8 25. Bb5 Bc6 26. a4 Bxb5 27. axb5 f6 28. c4 Rc8 29. b3 Re8 30. f4 Ke7 31. h3 Rc8 32. Kf1 Ra8 33. Kg1 a5 34. Qe4 Rd8 35. Rg3 Kf7 36. Qh7 Rg8 37. Qg6+ Ke7 38. Qxg7+ Rxg7 39. Rxg7+ Kd6 40. Rxc7 Kxc7 41. g4 Kd6 42. h4 e5 43. g5 1-0`
  },
  {
    id: 'uhlmann-fischer-1960',
    rank: 33,
    title: 'vs. Uhlmann, Leipzig olm fin-A 1960',
    event: 'Leipzig olm fin-A',
    year: 1960,
    white: 'Wolfgang Uhlmann',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Leipzig olm fin-A, round 11, 1960. Fischer wins with Black in 43 moves. Opening: King\'s Indian Defense.',
    pgn: `[Event "Leipzig olm fin-A"]
[Site "Leipzig"]
[Date "1960.??.??"]
[Round "11"]
[White "Wolfgang Uhlmann"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "E79"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 O-O 5. Be2 d6 6. f4 c5 7. Nf3 cxd4 8. Nxd4 Nc6 9. Be3 Ng4 10. Bxg4 Bxd4 11. Bxd4 Bxg4 12. Qd2 Nxd4 13. Qxd4 e5 14. fxe5 Qh4+ 15. Qf2 Qxf2+ 16. Kxf2 dxe5 17. Rac1 Rad8 18. Nd5 Be6 19. Rhd1 f5 20. exf5 gxf5 21. Rd2 Kf7 22. Rcd1 Rd7 23. Nc3 Rfd8 24. Rxd7+ Rxd7 25. Rxd7+ Bxd7 26. b4 b6 27. a4 Be6 28. c5 bxc5 29. bxc5 Ke7 30. Kg3 Kd7 31. Kh4 Kc6 32. Kg5 e4 33. g4 fxg4 34. Nxe4 a5 35. Kf4 Bb3 36. Ke3 Bxa4 37. Kd2 h6 38. Nf6 Kxc5 39. Nxg4 h5 40. Ne3 Kd4 41. Nf1 Ke5 42. Ke3 Bb3 43. Ng3 0-1`
  },
  {
    id: 'bisguier-fischer-1960',
    rank: 34,
    title: 'vs. Bisguier, USA-ch 1960',
    event: 'USA-ch',
    year: 1960,
    white: 'Arthur Bisguier',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'USA-ch, New York, round 11, 1960. Fischer wins with Black in 41 moves. Opening: King\'s Indian Defense.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1960.??.??"]
[Round "11"]
[White "Arthur Bisguier"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "E90"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 O-O 5. Bf4 c5 6. d5 d6 7. e4 Qa5 8. Bd3 Bg4 9. O-O Nbd7 10. h3 Bxf3 11. Qxf3 Ne5 12. Qe2 Nxd3 13. Qxd3 a6 14. Bd2 Nd7 15. b3 Qc7 16. f4 b5 17. cxb5 Qb6 18. Kh2 axb5 19. Nxb5 Bxa1 20. Rxa1 Rfc8 21. Qc4 Qa6 22. a4 Nb6 23. Qc2 c4 24. b4 c3 25. Nxc3 Qc4 26. b5 Qd4 27. Be1 Nc4 28. Qf2 Ne3 29. Rd1 Qxc3 30. Bxc3 Nxd1 31. Qd4 Nxc3 32. b6 Rc5 33. e5 Rxa4 34. b7 Rxd4 35. b8=Q+ Kg7 36. exd6 exd6 37. Qxd6 Rcxd5 38. Qc7 Ne2 39. f5 Rxf5 40. Qa7 Rfd5 41. Qa1 Nf4 0-1`
  },
  {
    id: 'gligoric-fischer-1961',
    rank: 35,
    title: 'vs. Gligoric, Bled 1961',
    event: 'Bled',
    year: 1961,
    white: 'Svetozar Gligoric',
    black: 'Bobby Fischer',
    result: '1/2-1/2',
    significance: 'Bled, round 1, 1961. Drawn in 33 moves. Opening: King\'s Indian Defense: Mar del Plata.',
    pgn: `[Event "Bled"]
[Site "Bled"]
[Date "1961.??.??"]
[Round "1"]
[White "Svetozar Gligoric"]
[Black "Bobby Fischer"]
[Result "1/2-1/2"]
[ECO "E98"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. Nd3 f5 11. exf5 Nxf5 12. f3 Nf6 13. Nf2 Nd4 14. Nfe4 Nh5 15. Bg5 Qd7 16. g3 h6 17. Be3 c5 18. Bxd4 exd4 19. Nb5 a6 20. Nbxd6 d3 21. Qxd3 Bd4+ 22. Kg2 Nxg3 23. Nxc8 Nxf1 24. Nb6 Qc7 25. Rxf1 Qxb6 26. b4 Qxb4 27. Rb1 Qa5 28. Nxc5 Qxc5 29. Qxg6+ Bg7 30. Rxb7 Qd4 31. Bd3 Rf4 32. Qe6+ Kh8 33. Qg6 1/2-1/2`
  },
  {
    id: 'fischer-tal-1961',
    rank: 36,
    title: 'vs. Tal, Bled 1961',
    event: 'Bled',
    year: 1961,
    white: 'Bobby Fischer',
    black: 'Mihail Tal',
    result: '1-0',
    significance: 'Bled, round 2, 1961. Fischer wins with White in 47 moves. Opening: Sicilian Defense: Old Sicilian.',
    pgn: `[Event "Bled"]
[Site "Bled"]
[Date "1961.??.??"]
[Round "2"]
[White "Bobby Fischer"]
[Black "Mihail Tal"]
[Result "1-0"]
[ECO "B47"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 e6 5. Nc3 Qc7 6. g3 Nf6 7. Ndb5 Qb8 8. Bf4 Ne5 9. Be2 Bc5 10. Bxe5 Qxe5 11. f4 Qb8 12. e5 a6 13. exf6 axb5 14. fxg7 Rg8 15. Ne4 Be7 16. Qd4 Ra4 17. Nf6+ Bxf6 18. Qxf6 Qc7 19. O-O-O Rxa2 20. Kb1 Ra6 21. Bxb5 Rb6 22. Bd3 e5 23. fxe5 Rxf6 24. exf6 Qc5 25. Bxh7 Qg5 26. Bxg8 Qxf6 27. Rhf1 Qxg7 28. Bxf7+ Kd8 29. Be6 Qh6 30. Bxd7 Bxd7 31. Rf7 Qxh2 32. Rdxd7+ Ke8 33. Rde7+ Kd8 34. Rd7+ Kc8 35. Rc7+ Kd8 36. Rfd7+ Ke8 37. Rd1 b5 38. Rb7 Qh5 39. g4 Qh3 40. g5 Qf3 41. Re1+ Kf8 42. Rxb5 Kg7 43. Rb6 Qg3 44. Rd1 Qc7 45. Rdd6 Qc8 46. b3 Kh7 47. Ra6 1-0`
  },
  {
    id: 'fischer-olafsson-1961',
    rank: 37,
    title: 'vs. Olafsson, Bled 1961',
    event: 'Bled',
    year: 1961,
    white: 'Bobby Fischer',
    black: 'Fridrik Olafsson',
    result: '1-0',
    significance: 'Bled, round 4, 1961. Fischer wins with White in 38 moves. Opening: Sicilian Defense.',
    pgn: `[Event "Bled"]
[Site "Bled"]
[Date "1961.??.??"]
[Round "4"]
[White "Bobby Fischer"]
[Black "Fridrik Olafsson"]
[Result "1-0"]
[ECO "B35"]

1. e4 c5 2. Nf3 g6 3. d4 cxd4 4. Nxd4 Bg7 5. Nc3 Nc6 6. Be3 Nf6 7. Bc4 Qa5 8. O-O d6 9. Nb3 Qc7 10. Be2 O-O 11. f4 a5 12. a4 Nb4 13. Rf2 e5 14. Bf3 Bd7 15. Rd2 Rfd8 16. Kh1 Bc6 17. Qg1 Nd7 18. f5 b6 19. Rad1 Nc5 20. Nb5 Qe7 21. Nxd6 Nxc2 22. Nxc5 Nxe3 23. Qxe3 bxc5 24. Be2 Bxa4 25. b3 Be8 26. Bc4 a4 27. Bd5 Rxd6 28. Bxa8 Rd4 29. fxg6 hxg6 30. bxa4 Bxa4 31. Ra1 Qf8 32. Bd5 Bh6 33. Rxd4 Bxe3 34. Rdxa4 Qh6 35. Rf1 Bf4 36. g3 Qh3 37. Raa1 Bxg3 38. Ra8+ 1-0`
  },
  {
    id: 'fischer-geller-1961',
    rank: 38,
    title: 'vs. Geller, Bled 1961',
    event: 'Bled',
    year: 1961,
    white: 'Bobby Fischer',
    black: 'Efim Geller',
    result: '1-0',
    significance: 'Bled, round 6, 1961. Fischer wins with White in 22 moves. Opening: Ruy Lopez: Morphy Defense.',
    pgn: `[Event "Bled"]
[Site "Bled"]
[Date "1961.??.??"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Efim Geller"]
[Result "1-0"]
[ECO "C72"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. O-O Bg4 6. h3 Bh5 7. c3 Qf6 8. g4 Bg6 9. d4 Bxe4 10. Nbd2 Bg6 11. Bxc6+ bxc6 12. dxe5 dxe5 13. Nxe5 Bd6 14. Nxg6 Qxg6 15. Re1+ Kf8 16. Nc4 h5 17. Nxd6 cxd6 18. Bf4 d5 19. Qb3 hxg4 20. Qb7 gxh3+ 21. Bg3 Rd8 22. Qb4+ 1-0`
  },
  {
    id: 'portisch-fischer-1961',
    rank: 39,
    title: 'vs. Portisch, Bled 1961',
    event: 'Bled',
    year: 1961,
    white: 'Lajos Portisch',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Bled, round 15, 1961. Fischer wins with Black in 47 moves. Opening: Indian Game.',
    pgn: `[Event "Bled"]
[Site "Bled"]
[Date "1961.??.??"]
[Round "15"]
[White "Lajos Portisch"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "D38"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Bb4 5. cxd5 exd5 6. Bg5 h6 7. Bh4 c5 8. e3 Nc6 9. Bb5 Qa5 10. Bxc6+ bxc6 11. Bxf6 Bxc3+ 12. bxc3 Qxc3+ 13. Nd2 gxf6 14. Rc1 Qd3 15. Rxc5 Rg8 16. Qc2 Qxc2 17. Rxc2 Rxg2 18. Rxc6 Rb8 19. h4 Be6 20. Kf1 Rg6 21. Nb3 Rb4 22. f3 a5 23. Rc2 Bf5 24. Rch2 a4 25. Nc5 a3 26. e4 dxe4 27. fxe4 Bg4 28. Kf2 Rxd4 29. Ke3 Rc4 30. Nd3 Be6 31. Rf1 Rg3+ 32. Rf3 Rxf3+ 33. Kxf3 Rc3 34. Ke3 f5 35. Rf2 fxe4 36. Kxe4 Rc4+ 37. Ke5 Ke7 38. h5 Ra4 39. Nc5 Rh4 40. Nxe6 Rxh5+ 41. Kd4 Kxe6 42. Rf3 Rh4+ 43. Kc3 f5 44. Kb3 f4 45. Kc4 Ke5 46. Rxa3 f3+ 47. Kd3 Rf4 0-1`
  },
  {
    id: 'geller-fischer-1962',
    rank: 40,
    title: 'vs. Geller, Candidats Tournament 1962',
    event: 'Candidats Tournament',
    year: 1962,
    white: 'Efim Geller',
    black: 'Bobby Fischer',
    result: '1-0',
    significance: 'Candidats Tournament, Curacao, round 2, 1962. Fischer loses with Black in 41 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "Candidats Tournament"]
[Site "Curacao"]
[Date "1962.??.??"]
[Round "2"]
[White "Efim Geller"]
[Black "Bobby Fischer"]
[Result "1-0"]
[ECO "B92"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Be3 Qc7 10. a4 Be6 11. a5 Nbd7 12. Nd5 Nxd5 13. exd5 Bf5 14. c4 Bg6 15. Rc1 Nc5 16. Nxc5 dxc5 17. b4 Rac8 18. Qb3 Bd6 19. Rfd1 Qe7 20. bxc5 Bxc5 21. Bxc5 Rxc5 22. Ra1 Rd8 23. Ra4 Bf5 24. Rb4 Bc8 25. Rb6 Rd6 26. Qb4 Qc7 27. Rxd6 Qxd6 28. Rb1 Qc7 29. Qa4 Bd7 30. Qa3 Rxa5 31. Rxb7 Qxb7 32. Qxa5 g6 33. h3 Qb1+ 34. Kh2 Bf5 35. Qc3 Qe4 36. Bf3 Qd4 37. Qxd4 exd4 38. g4 Bc8 39. c5 a5 40. c6 Kf8 41. d6 1-0`
  },
  {
    id: 'fischer-portisch-1962',
    rank: 41,
    title: 'vs. Portisch, Stockholm Interzonal 1962',
    event: 'Stockholm Interzonal',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Lajos Portisch',
    result: '1-0',
    significance: 'Stockholm Interzonal, round 4, 1962. Fischer wins with White in 68 moves. Opening: Caro-Kann Defense.',
    pgn: `[Event "Stockholm Interzonal"]
[Site "Stockholm"]
[Date "1962.??.??"]
[Round "4"]
[White "Bobby Fischer"]
[Black "Lajos Portisch"]
[Result "1-0"]
[ECO "B17"]

1. e4 c6 2. Nc3 d5 3. Nf3 dxe4 4. Nxe4 Nd7 5. Bc4 Ngf6 6. Neg5 Nd5 7. d4 h6 8. Ne4 N7b6 9. Bb3 Bf5 10. Ng3 Bh7 11. O-O e6 12. Ne5 Nd7 13. c4 N5f6 14. Bf4 Nxe5 15. Bxe5 Bd6 16. Qe2 O-O 17. Rad1 Qe7 18. Bxd6 Qxd6 19. f4 c5 20. Qe5 Qxe5 21. dxe5 Ne4 22. Rd7 Nxg3 23. hxg3 Be4 24. Ba4 Rad8 25. Rfd1 Rxd7 26. Rxd7 g5 27. Bd1 Bc6 28. Rd6 Rc8 29. Kf2 Kf8 30. Bf3 Bxf3 31. gxf3 gxf4 32. gxf4 Ke7 33. f5 exf5 34. Rxh6 Rd8 35. Ke2 Rg8 36. Kf2 Rd8 37. Ke3 Rd1 38. b3 Re1+ 39. Kf4 Re2 40. Kxf5 Rxa2 41. f4 Re2 42. Rh3 Re1 43. Rd3 Rb1 44. Re3 Rb2 45. e6 a6 46. exf7+ Kxf7 47. Ke5 Rd2 48. Rc3 b6 49. f5 Rd1 50. Rh3 b5 51. Rh7+ Kg8 52. Rb7 bxc4 53. bxc4 Rd4 54. Ke6 Re4+ 55. Kd5 Rf4 56. Kxc5 Rxf5+ 57. Kd6 Rf6+ 58. Ke5 Rf7 59. Rb6 Rc7 60. Kd5 Kf7 61. Rxa6 Ke7 62. Re6+ Kd8 63. Rd6+ Ke7 64. c5 Rc8 65. c6 Rc7 66. Rh6 Kd8 67. Rh8+ Ke7 68. Ra8 1-0`
  },
  {
    id: 'fischer-keres-1962',
    rank: 42,
    title: 'vs. Keres, Candidats Tournament 1962',
    event: 'Candidats Tournament',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Paul Keres',
    result: '1-0',
    significance: 'Candidats Tournament, Curacao, round 7, 1962. Fischer wins with White in 41 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "Candidats Tournament"]
[Site "Curacao"]
[Date "1962.??.??"]
[Round "7"]
[White "Bobby Fischer"]
[Black "Paul Keres"]
[Result "1-0"]
[ECO "C96"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Nd7 12. dxc5 dxc5 13. Nbd2 Qc7 14. Nf1 Nb6 15. Ne3 Rd8 16. Qe2 Be6 17. Nd5 Nxd5 18. exd5 Bxd5 19. Nxe5 Ra7 20. Bf4 Qb6 21. Rad1 g6 22. Ng4 Nc4 23. Bh6 Be6 24. Bb3 Qb8 25. Rxd8+ Bxd8 26. Bxc4 bxc4 27. Qxc4 Qd6 28. Qa4 Qe7 29. Nf6+ Kh8 30. Nd5 Qd7 31. Qe4 Qd6 32. Nf4 Re7 33. Bg5 Re8 34. Bxd8 Rxd8 35. Nxe6 Qxe6 36. Qxe6 fxe6 37. Rxe6 Rd1+ 38. Kh2 Rd2 39. Rb6 Rxf2 40. Rb7 Rf6 41. Kg3 1-0`
  },
  {
    id: 'bisguier-fischer-1962',
    rank: 43,
    title: 'vs. Bisguier, Stockholm Interzonal 1962',
    event: 'Stockholm Interzonal',
    year: 1962,
    white: 'Arthur Bisguier',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Stockholm Interzonal, round 7, 1962. Fischer wins with Black in 54 moves. Opening: Sicilian Defense: Alapin.',
    pgn: `[Event "Stockholm Interzonal"]
[Site "Stockholm"]
[Date "1962.??.??"]
[Round "7"]
[White "Arthur Bisguier"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "B22"]

1. e4 c5 2. c3 Nf6 3. e5 Nd5 4. Nf3 Nc6 5. Na3 g6 6. g3 Bg7 7. Bg2 Nc7 8. Qe2 O-O 9. O-O d6 10. d4 cxd4 11. cxd4 Bg4 12. Rd1 Ne6 13. Qe4 Bf5 14. Qe1 Bg4 15. Qe4 Bxf3 16. Bxf3 d5 17. Qe3 Rc8 18. Bg4 Qb6 19. Bxe6 fxe6 20. b3 g5 21. Bb2 Rf5 22. Rd2 Rcf8 23. Nc2 h6 24. Qe2 Rxf2 25. Qxf2 Rxf2 26. Rxf2 g4 27. Bc1 Qb5 28. Bf4 Qd3 29. Rd2 Qg6 30. Ne1 h5 31. Ng2 Kh7 32. Re1 Nd8 33. Nh4 Qe8 34. h3 gxh3 35. Kh2 Nf7 36. Kxh3 Bh6 37. Rc2 Qg8 38. Rf1 Qg4+ 39. Kh2 Ng5 40. Bxg5 Bxg5 41. Nf3 Be3 42. Re2 Bh6 43. Ref2 Kg8 44. Nh4 Qxd4 45. Rf7 Qg4 46. R1f3 Qg5 47. R3f4 d4 48. Nf3 Qg6 49. Nh4 Qxf7 50. Rxf7 Kxf7 51. Kg2 d3 52. Kf2 Bg7 53. Nf3 Kg6 54. Ke3 Kf5 0-1`
  },
  {
    id: 'fischer-benko-1962',
    rank: 44,
    title: 'vs. Benko, Candidats Tournament 1962',
    event: 'Candidats Tournament',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Pal Benko',
    result: '1-0',
    significance: 'Candidats Tournament, Curacao, round 8, 1962. Fischer wins with White in 39 moves. Opening: French Defense: Classical.',
    pgn: `[Event "Candidats Tournament"]
[Site "Curacao"]
[Date "1962.??.??"]
[Round "8"]
[White "Bobby Fischer"]
[Black "Pal Benko"]
[Result "1-0"]
[ECO "C11"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 dxe4 5. Nxe4 Be7 6. Bxf6 Bxf6 7. Nf3 Nd7 8. Qd2 Be7 9. O-O-O Nf6 10. Bd3 O-O 11. Nxf6+ Bxf6 12. Qf4 c5 13. dxc5 Qa5 14. Qc4 Be7 15. h4 Qxc5 16. Qe4 f5 17. Qe2 b5 18. Ng5 Bf6 19. Nxe6 Bxe6 20. Qxe6+ Kh8 21. Kb1 Qxf2 22. Qxf5 Qxf5 23. Bxf5 g6 24. Bd3 Rad8 25. h5 Kg7 26. hxg6 hxg6 27. Bxb5 Rxd1+ 28. Rxd1 Rb8 29. a4 a6 30. Rd7+ Kh6 31. Rd6 Bxb2 32. Kxb2 axb5 33. a5 Ra8 34. a6 Kh5 35. Kb3 g5 36. Kb4 Kg4 37. Kxb5 Kg3 38. Rd7 g4 39. a7 1-0`
  },
  {
    id: 'fischer-tal-1962',
    rank: 45,
    title: 'vs. Tal, Candidats Tournament 1962',
    event: 'Candidats Tournament',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Mihail Tal',
    result: '1-0',
    significance: 'Candidats Tournament, Curacao, round 11, 1962. Fischer wins with White in 63 moves. Opening: Sicilian Defense: Old Sicilian.',
    pgn: `[Event "Candidats Tournament"]
[Site "Curacao"]
[Date "1962.??.??"]
[Round "11"]
[White "Bobby Fischer"]
[Black "Mihail Tal"]
[Result "1-0"]
[ECO "B32"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 e5 5. Nb5 a6 6. Nd6+ Bxd6 7. Qxd6 Qf6 8. Qd1 Qg6 9. Nc3 Nge7 10. h4 h5 11. Bg5 d5 12. Bxe7 d4 13. Bg5 dxc3 14. bxc3 Qxe4+ 15. Be2 f6 16. Be3 Bg4 17. Qd3 Qxd3 18. cxd3 Bxe2 19. Kxe2 O-O-O 20. Rad1 Ne7 21. d4 Nd5 22. Rc1 Rhe8 23. Rhd1 f5 24. Bg5 Rd7 25. dxe5 Rxe5+ 26. Kf3 Re4 27. Rd3 Rc4 28. Rcd1 Rxc3 29. Rxc3+ Nxc3 30. Rc1 Rc7 31. Bf4 Rc6 32. Be5 Nd5 33. Rd1 Nf6 34. Kf4 g6 35. f3 Nd7 36. Bd6 Rc2 37. g3 Re2 38. Kg5 Re6 39. Bf4 Nf8 40. Rd6 a5 41. Kh6 Re2 42. Rd2 Re7 43. Bd6 Rh7+ 44. Kg5 Rf7 45. Rb2 f4 46. Bxf4 Rf5+ 47. Kh6 b5 48. Bd6 b4 49. g4 Rxf3 50. g5 Ne6 51. Kxg6 Rd3 52. Be5 Re3 53. Kf5 Nf8 54. Rg2 Rf3+ 55. Bf4 Kd7 56. g6 Ne6 57. g7 Rxf4+ 58. Ke5 Rf8 59. gxf8=Q Nxf8 60. Kd5 a4 61. Rg7+ Ke8 62. Kd6 b3 63. a3 1-0`
  },
  {
    id: 'fischer-olafsson-1962',
    rank: 46,
    title: 'vs. Olafsson, Stockholm Interzonal 1962',
    event: 'Stockholm Interzonal',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Fridrik Olafsson',
    result: '1-0',
    significance: 'Stockholm Interzonal, round 15, 1962. Fischer wins with White in 33 moves. Opening: Sicilian Defense.',
    pgn: `[Event "Stockholm Interzonal"]
[Site "Stockholm"]
[Date "1962.??.??"]
[Round "15"]
[White "Bobby Fischer"]
[Black "Fridrik Olafsson"]
[Result "1-0"]
[ECO "B88"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bc4 e6 7. Bb3 Be7 8. f4 O-O 9. Be3 Nxd4 10. Bxd4 b5 11. e5 dxe5 12. fxe5 Nd7 13. O-O b4 14. Ne4 Bb7 15. Nd6 Bxd6 16. exd6 Qg5 17. Qe2 Bd5 18. Rad1 Bxb3 19. axb3 e5 20. Qb5 a6 21. Qxd7 exd4 22. Qf5 Qxf5 23. Rxf5 Rfd8 24. Rxd4 Rac8 25. Rf2 a5 26. Rfd2 f6 27. Rc4 Kf7 28. Rc7+ Kg6 29. Re7 h5 30. d7 Rc7 31. c4 Kh7 32. h4 Kg6 33. Rd5 1-0`
  },
  {
    id: 'fischer-benko-1962-2',
    rank: 47,
    title: 'vs. Benko, Candidats Tournament 1962',
    event: 'Candidats Tournament',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Pal Benko',
    result: '1-0',
    significance: 'Candidats Tournament, Curacao, round 22, 1962. Fischer wins with White in 31 moves. Opening: French Defense: Classical.',
    pgn: `[Event "Candidats Tournament"]
[Site "Curacao"]
[Date "1962.??.??"]
[Round "22"]
[White "Bobby Fischer"]
[Black "Pal Benko"]
[Result "1-0"]
[ECO "C11"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. f4 c5 6. dxc5 Bxc5 7. Qg4 O-O 8. Bd3 f5 9. Qh3 Bxg1 10. Rxg1 Nc5 11. Bd2 Nc6 12. Nb5 Qb6 13. O-O-O Bd7 14. Nd6 Na4 15. Bb5 Nd4 16. Be3 Ne2+ 17. Bxe2 Qxb2+ 18. Kd2 Qb4+ 19. Kc1 Nc3 20. Rde1 Nxa2+ 21. Kd1 Nc3+ 22. Kc1 d4 23. Bf2 Rfc8 24. Bd3 Na2+ 25. Kd1 Nc3+ 26. Kc1 Rc5 27. Qh4 Ra5 28. Kd2 h6 29. g4 fxg4 30. Rxg4 Kh8 31. Qxh6+ 1-0`
  },
  {
    id: 'fischer-geller-1962',
    rank: 48,
    title: 'vs. Geller, Candidats Tournament 1962',
    event: 'Candidats Tournament',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Efim Geller',
    result: '1-0',
    significance: 'Candidats Tournament, Curacao, round 23, 1962. Fischer wins with White in 43 moves. Opening: Sicilian Defense.',
    pgn: `[Event "Candidats Tournament"]
[Site "Curacao"]
[Date "1962.??.??"]
[Round "23"]
[White "Bobby Fischer"]
[Black "Efim Geller"]
[Result "1-0"]
[ECO "B88"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bc4 e6 7. Bb3 Be7 8. O-O Nxd4 9. Qxd4 O-O 10. f4 b6 11. Kh1 Ba6 12. Rf3 d5 13. exd5 Bc5 14. Qa4 Bb7 15. Be3 exd5 16. Bd4 Re8 17. Rd1 Ng4 18. h3 Qh4 19. Rdf1 Bxd4 20. Qxd4 Rad8 21. Nxd5 Bxd5 22. Bxd5 Nf6 23. c4 Rd7 24. Re3 Red8 25. Qe5 h6 26. Bf3 Rd2 27. b4 Rf2 28. Ree1 Rxf3 29. Rxf3 Re8 30. Qxe8+ Nxe8 31. Rxe8+ Kh7 32. c5 Qf6 33. Re1 bxc5 34. bxc5 Qb2 35. Rff1 Qxa2 36. c6 Qa5 37. Rc1 Qc7 38. Rfd1 g5 39. fxg5 Kg6 40. gxh6 Kxh6 41. Rd6+ Kg7 42. Rd4 Kg6 43. Ra4 1-0`
  },
  {
    id: 'fischer-evans-1963',
    rank: 49,
    title: 'vs. Evans, USA-ch 1963',
    event: 'USA-ch',
    year: 1963,
    white: 'Bobby Fischer',
    black: 'Larry Evans',
    result: '1-0',
    significance: 'USA-ch, New York, round 2, 1963. Fischer wins with White in 36 moves. Opening: King\'s Gambit Accepted.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1963.??.??"]
[Round "2"]
[White "Bobby Fischer"]
[Black "Larry Evans"]
[Result "1-0"]
[ECO "C33"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 d6 5. Nc3 Be6 6. Qe2 c6 7. Nf3 Qe7 8. d4 Bxc4 9. Qxc4 g5 10. e5 d5 11. Qd3 Na6 12. Ne2 Nb4 13. Qd1 O-O-O 14. c3 Na6 15. h4 g4 16. Nh2 h5 17. Nxf4 Qxh4 18. Kg1 Nh6 19. Nf1 Qe7 20. Nxh5 Rg8 21. Nfg3 Rg6 22. Nf4 Rg5 23. Be3 Nc7 24. Qd2 Rg8 25. Nfe2 f6 26. exf6 Qxf6 27. Bxh6 Bd6 28. Rf1 Qe6 29. Bf4 Rde8 30. Rh6 Bxf4 31. Qxf4 Qe7 32. Rf6 Ne6 33. Qe5 Ng5 34. Qxe7 Rxe7 35. Rf8+ Rxf8 36. Rxf8+ 1-0`
  },
  {
    id: 'byrne-fischer-1963',
    rank: 50,
    title: 'Byrne vs Fischer',
    event: 'USA-ch',
    year: 1963,
    white: 'Robert Byrne',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Future world champion Fischer executes a deep sacrificial attack to win in this miniature. Many of the players in the press room thought Fischer\'s position was hopeless and were surprised when they heard Byrne had resigned.',
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
    id: 'fischer-bisguier-1963',
    rank: 51,
    title: 'vs. Bisguier, USA-ch 1963',
    event: 'USA-ch',
    year: 1963,
    white: 'Bobby Fischer',
    black: 'Arthur Bisguier',
    result: '1-0',
    significance: 'USA-ch, New York, round 4, 1963. Fischer wins with White in 35 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1963.??.??"]
[Round "4"]
[White "Bobby Fischer"]
[Black "Arthur Bisguier"]
[Result "1-0"]
[ECO "C98"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d6 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Nc6 13. dxc5 dxc5 14. Nf1 Rd8 15. Qe2 Nh5 16. g3 g6 17. h4 Be6 18. Ne3 f6 19. Nd5 Qb7 20. Nxe7+ Qxe7 21. Nh2 Ng7 22. Ng4 c4 23. Qf3 Bxg4 24. Qxg4 Ne6 25. h5 Kh8 26. Kg2 g5 27. Be3 Nf4+ 28. Kh2 Nd3 29. Bxd3 cxd3 30. Red1 Rd7 31. Rd2 Na5 32. b3 Qd6 33. Rad1 Re8 34. Rxd3 Qxd3 35. Qxd7 1-0`
  },
  {
    id: 'reshevsky-fischer-1963',
    rank: 52,
    title: 'vs. Reshevsky, USA-ch 1963',
    event: 'USA-ch',
    year: 1963,
    white: 'Samuel Reshevsky',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'USA-ch, New York, round 5, 1963. Fischer wins with Black in 47 moves. Opening: English Opening: Symmetrical.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1963.??.??"]
[Round "5"]
[White "Samuel Reshevsky"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "D32"]

1. c4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. e3 d5 7. cxd5 exd5 8. Be2 Bd6 9. O-O O-O 10. Nf3 Bg4 11. g3 Bb4 12. Bd2 Ne4 13. a3 Bxc3 14. Bxc3 Nxc3 15. bxc3 Rc8 16. Rb1 b6 17. Rb5 Qe7 18. a4 Be6 19. Qa1 Qf6 20. Kg2 Na5 21. Nd4 Nb7 22. Rb4 Nd6 23. a5 Ne4 24. axb6 axb6 25. Qb2 Nxc3 26. Ba6 Rc5 27. Kg1 Bh3 28. Ra1 b5 29. Bxb5 Nxb5 30. Rxb5 Rxb5 31. Qxb5 Qe5 32. Re1 h5 33. Nc6 Qc3 34. Rb1 Qc2 35. Ne7+ Kh8 36. Nxd5 Rc8 37. Nc3 Rxc3 38. Qxh5+ Kg8 39. Rb8+ Rc8 40. Rxc8+ Bxc8 41. Kf1 Ba6+ 42. Ke1 Qc3+ 43. Kd1 Qd3+ 44. Kc1 Qc3+ 45. Kd1 Bc4 46. Qf3 Bb3+ 47. Ke2 Qc4+ 0-1`
  },
  {
    id: 'byrne-fischer-1963-2',
    rank: 53,
    title: 'vs. Byrne, USA-ch 1963',
    event: 'USA-ch',
    year: 1963,
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'USA-ch, New York, round 9, 1963. Fischer wins with Black in 46 moves. Opening: Hungarian Opening.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1963.??.??"]
[Round "9"]
[White "Donald Byrne"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "B20"]

1. g3 c5 2. Bg2 Nc6 3. d3 g6 4. e4 Bg7 5. f4 e6 6. Nf3 Nge7 7. O-O Rb8 8. Nbd2 d6 9. a4 O-O 10. c3 a6 11. g4 b5 12. axb5 axb5 13. Nh4 b4 14. c4 Nd4 15. g5 Bd7 16. Nb3 Qc7 17. Nxd4 Bxd4+ 18. Kh1 Bg7 19. Rb1 Ra8 20. Be3 Ra2 21. Qd2 Re8 22. Qf2 Bc6 23. d4 cxd4 24. Bxd4 Bxd4 25. Qxd4 Ba8 26. Ra1 e5 27. Qd2 Rxa1 28. Rxa1 exf4 29. b3 Nc6 30. Qxf4 Nd4 31. Qe3 Nc2 32. Qa7 Qxa7 33. Rxa7 Nd4 34. Rd7 Nxb3 35. Rxd6 Nc5 36. Rb6 b3 37. Kg1 Bxe4 38. Nf3 Ra8 39. Rb5 b2 40. Rxb2 Ra1+ 41. Kf2 Nd3+ 42. Ke3 Nxb2 43. Kxe4 Nxc4 44. Kf4 Ra2 45. Kg3 Ne3 46. Bh3 0-1`
  },
  {
    id: 'fischer-smyslov-1965',
    rank: 54,
    title: 'vs. Smyslov, Capablanca mem 1965',
    event: 'Capablanca mem',
    year: 1965,
    white: 'Bobby Fischer',
    black: 'Vassily Smyslov',
    result: '1-0',
    significance: 'Capablanca mem, Havana, round 2, 1965. Fischer wins with White in 43 moves. Opening: Ruy Lopez: Morphy Defense.',
    pgn: `[Event "Capablanca mem"]
[Site "Havana"]
[Date "1965.??.??"]
[Round "2"]
[White "Bobby Fischer"]
[Black "Vassily Smyslov"]
[Result "1-0"]
[ECO "C77"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. d3 d6 6. c3 Be7 7. Nbd2 O-O 8. Nf1 b5 9. Bb3 d5 10. Qe2 dxe4 11. dxe4 Be6 12. Bxe6 fxe6 13. Ng3 Qd7 14. O-O Rad8 15. a4 Qd3 16. Qxd3 Rxd3 17. axb5 axb5 18. Ra6 Rd6 19. Kh1 Nd7 20. Be3 Rd8 21. h3 h6 22. Rfa1 Ndb8 23. Ra8 Rd1+ 24. Kh2 Rxa1 25. Rxa1 Nd7 26. b4 Kf7 27. Nf1 Bd6 28. g3 Nf6 29. N1d2 Ke7 30. Ra6 Nb8 31. Ra5 c6 32. Kg2 Nbd7 33. Kf1 Rc8 34. Ne1 Ne8 35. Nd3 Nc7 36. c4 bxc4 37. Nxc4 Nb5 38. Ra6 Kf6 39. Bc1 Bb8 40. Bb2 c5 41. Nb6 Nxb6 42. Rxb6 c4 43. Nc5 c3 1-0`
  },
  {
    id: 'evans-fischer-1965',
    rank: 55,
    title: 'vs. Evans, USA-ch 1965',
    event: 'USA-ch',
    year: 1965,
    white: 'Larry Evans',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'USA-ch, New York, round 3, 1965. Fischer wins with Black in 55 moves. Opening: Nimzo-Indian Defense.',
    pgn: `[Event "USA-ch"]
[Site "New York"]
[Date "1965.??.??"]
[Round "3"]
[White "Larry Evans"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "E45"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Ne2 Ba6 6. a3 Bxc3+ 7. Nxc3 d5 8. b3 Nc6 9. Be2 O-O 10. a4 dxc4 11. Ba3 Re8 12. b4 Ne7 13. O-O Ned5 14. Rc1 c6 15. Bf3 b5 16. a5 Qc7 17. Qc2 Rad8 18. Rfd1 Bb7 19. Rd2 Nxc3 20. Qxc3 c5 21. dxc5 Bxf3 22. gxf3 Rxd2 23. Qxd2 Rd8 24. Qe1 Rd3 25. Bb2 Nd5 26. Bc3 f6 27. Ba1 e5 28. Kg2 Qd7 29. Rc2 e4 30. Rc1 exf3+ 31. Kh1 Nxb4 32. Qg1 Kf7 33. Bd4 Nc6 34. Qg3 Nxd4 35. exd4 Rxd4 36. Rg1 g5 37. c6 Qxc6 38. Qb8 Rd7 39. h3 Qe6 40. Rg3 c3 41. Qh8 Qf5 42. Kh2 Rd2 43. Rxf3 Rxf2+ 44. Rxf2 Qxf2+ 45. Kh1 Qf3+ 46. Kh2 Qf4+ 47. Kg1 Qe3+ 48. Kf1 Qxh3+ 49. Ke2 g4 50. a6 Qf3+ 51. Ke1 Qe3+ 52. Kf1 Qd3+ 53. Kf2 g3+ 54. Kg2 Qe4+ 55. Kxg3 Qg6+ 0-1`
  },
  {
    id: 'fischer-szabo-1965',
    rank: 56,
    title: 'vs. Szabo, Capablanca mem 1965',
    event: 'Capablanca mem',
    year: 1965,
    white: 'Bobby Fischer',
    black: 'Laszlo Szabo',
    result: '1-0',
    significance: 'Capablanca mem, Havana, round 8, 1965. Fischer wins with White in 36 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "Capablanca mem"]
[Site "Havana"]
[Date "1965.??.??"]
[Round "8"]
[White "Bobby Fischer"]
[Black "Laszlo Szabo"]
[Result "1-0"]
[ECO "C92"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d6 9. h3 Be6 10. d4 Bxb3 11. axb3 exd4 12. cxd4 Nb4 13. d5 Nd7 14. Na3 Bf6 15. Nc2 c5 16. Nxb4 cxb4 17. Nd4 Bxd4 18. Qxd4 a5 19. Bf4 Nc5 20. Re3 f6 21. Rae1 Qc7 22. Bg3 Nd7 23. Kh2 Rfd8 24. R3e2 Nc5 25. Re3 Nd7 26. Qd3 Rab8 27. Qe2 Rb7 28. Kh1 Nc5 29. f4 Rf8 30. e5 f5 31. Bh4 dxe5 32. fxe5 f4 33. Rf3 Qd7 34. Qd2 Qf5 35. e6 Ne4 36. Qd4 1-0`
  },
  {
    id: 'ivkov-fischer-1966',
    rank: 57,
    title: 'vs. Ivkov, Santa Monica 1966',
    event: 'Santa Monica',
    year: 1966,
    white: 'Borislav Ivkov',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Santa Monica, round 3, 1966. Fischer wins with Black in 42 moves. Opening: Indian Game.',
    pgn: `[Event "Santa Monica"]
[Site "Santa Monica"]
[Date "1966.??.??"]
[Round "3"]
[White "Borislav Ivkov"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "A49"]

1. d4 Nf6 2. Nf3 g6 3. g3 Bg7 4. Bg2 O-O 5. O-O d6 6. Nc3 d5 7. Ne5 c6 8. e4 Be6 9. exd5 cxd5 10. Ne2 Nc6 11. Nf4 Bf5 12. c3 Be4 13. Bh3 Qc7 14. Nfd3 Bxd3 15. Nxd3 e6 16. Bf4 Qd8 17. Re1 Re8 18. Bg2 Nd7 19. h4 h5 20. Bf3 b5 21. a3 a5 22. Qe2 Rc8 23. Bd6 Qb6 24. Be5 Ndxe5 25. Nxe5 Nxe5 26. dxe5 b4 27. axb4 axb4 28. Qe3 Qxe3 29. Rxe3 bxc3 30. bxc3 Rc5 31. Be2 Rec8 32. Ra3 Bf8 33. Rb3 Be7 34. Kg2 Bd8 35. Ba6 Ra8 36. Rf3 Bc7 37. Rb5 Rc4 38. Bb7 Ra3 39. Re3 Kg7 40. Bc8 Raxc3 41. Re1 Rc2 42. Bd7 0-1`
  },
  {
    id: 'fischer-olafsson-1966',
    rank: 58,
    title: 'vs. Olafsson, La Habana olm fin-A 1966',
    event: 'La Habana olm fin-A',
    year: 1966,
    white: 'Bobby Fischer',
    black: 'Fridrik Olafsson',
    result: '1-0',
    significance: 'La Habana olm fin-A, round 4, 1966. Fischer wins with White in 37 moves. Opening: Ruy Lopez: Open Defense.',
    pgn: `[Event "La Habana olm fin-A"]
[Site "La Habana"]
[Date "1966.??.??"]
[Round "4"]
[White "Bobby Fischer"]
[Black "Fridrik Olafsson"]
[Result "1-0"]
[ECO "C83"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Be7 10. Bc2 Bg4 11. h3 Bh5 12. g4 Bg6 13. Bb3 Na5 14. Bxd5 c6 15. Bxe4 Bxe4 16. Qxd8+ Rxd8 17. Nbd2 Bd5 18. Re1 h5 19. Ne4 hxg4 20. hxg4 Nc4 21. Kg2 Be6 22. b3 Nb6 23. Be3 Nd5 24. Kg3 f6 25. Bc5 f5 26. Nd6+ Bxd6 27. exd6 Kd7 28. Ne5+ Kc8 29. Nxc6 f4+ 30. Kg2 Ne3+ 31. Kg1 Bd5 32. Ne7+ Kd7 33. fxe3 Rh1+ 34. Kf2 Rh2+ 35. Kf1 Bf3 36. Ng6 Be4 37. Ne5+ 1-0`
  },
  {
    id: 'fischer-larsen-1966',
    rank: 59,
    title: 'vs. Larsen, Santa Monica 1966',
    event: 'Santa Monica',
    year: 1966,
    white: 'Bobby Fischer',
    black: 'Bent Larsen',
    result: '0-1',
    significance: 'Santa Monica, round 6, 1966. Fischer loses with White in 30 moves. Opening: Ruy Lopez: Open Defense.',
    pgn: `[Event "Santa Monica"]
[Site "Santa Monica"]
[Date "1966.??.??"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Bent Larsen"]
[Result "0-1"]
[ECO "C82"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Bc5 10. Nbd2 O-O 11. Bc2 Bf5 12. Nb3 Bg4 13. Nxc5 Nxc5 14. Re1 Re8 15. Be3 Ne6 16. Qd3 g6 17. Bh6 Ne7 18. Nd4 Bf5 19. Nxf5 Nxf5 20. Bd2 Qh4 21. Qf1 Nc5 22. g3 Qc4 23. Qg2 Nd3 24. Bxd3 Qxd3 25. Bg5 c6 26. g4 Ng7 27. Re3 Qd2 28. b3 b4 29. Qh3 bxc3 30. Qh6 Ne6 0-1`
  },
  {
    id: 'fischer-portisch-1966',
    rank: 60,
    title: 'vs. Portisch, La Habana olm fin-A 1966',
    event: 'La Habana olm fin-A',
    year: 1966,
    white: 'Bobby Fischer',
    black: 'Lajos Portisch',
    result: '1-0',
    significance: 'La Habana olm fin-A, round 6, 1966. Fischer wins with White in 34 moves. Opening: Ruy Lopez: Exchange Variation.',
    pgn: `[Event "La Habana olm fin-A"]
[Site "La Habana"]
[Date "1966.??.??"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Lajos Portisch"]
[Result "1-0"]
[ECO "C69"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O f6 6. d4 exd4 7. Nxd4 c5 8. Nb3 Qxd1 9. Rxd1 Bd6 10. Na5 b5 11. c4 Ne7 12. Be3 f5 13. Nc3 f4 14. e5 Bxe5 15. Bxc5 Bxc3 16. bxc3 Ng6 17. Nc6 Be6 18. cxb5 axb5 19. Na7 Rb8 20. Rdb1 Kf7 21. Nxb5 Rhd8 22. Rb4 Bxa2 23. Nxc7 Rbc8 24. h4 Rd2 25. Bb6 f3 26. Be3 Re2 27. Nb5 Ra8 28. h5 Ne5 29. Rf4+ Ke7 30. Rd1 Rc8 31. Re4 Kf6 32. Rd6+ Kf5 33. Rf4+ Kg5 34. Rxf3+ 1-0`
  },
  {
    id: 'spassky-fischer-1966',
    rank: 61,
    title: 'vs. Spassky, Santa Monica 1966',
    event: 'Santa Monica',
    year: 1966,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    result: '1-0',
    significance: 'Santa Monica, round 8, 1966. Fischer loses with Black in 50 moves. Opening: Grünfeld Defense: Exchange Variation.',
    pgn: `[Event "Santa Monica"]
[Site "Santa Monica"]
[Date "1966.??.??"]
[Round "8"]
[White "Boris Spassky"]
[Black "Bobby Fischer"]
[Result "1-0"]
[ECO "D87"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 Nc6 9. Be3 O-O 10. O-O Qc7 11. Rc1 Rd8 12. Qe1 e6 13. f4 Na5 14. Bd3 f5 15. Rd1 b6 16. Qf2 cxd4 17. Bxd4 Bxd4 18. cxd4 Bb7 19. Ng3 Qf7 20. d5 fxe4 21. dxe6 Qxe6 22. f5 Qf7 23. Bxe4 Rxd1 24. Rxd1 Rf8 25. Bb1 Qf6 26. Qc2 Kh8 27. fxg6 hxg6 28. Qd2 Kg7 29. Rf1 Qe7 30. Qd4+ Rf6 31. Ne4 Bxe4 32. Bxe4 Qc5 33. Qxc5 Rxf1+ 34. Kxf1 bxc5 35. h4 Nc4 36. Ke2 Ne5 37. Ke3 Kf6 38. Kf4 Nf7 39. Ke3 g5 40. h5 Nh6 41. Kd3 Ke5 42. Ba8 Kd6 43. Kc4 g4 44. a4 Ng8 45. a5 Nh6 46. Be4 g3 47. Kb5 Ng8 48. Bb1 Nh6 49. Ka6 Kc6 50. Ba2 1-0`
  },
  {
    id: 'fischer-gligoric-1966',
    rank: 62,
    title: 'vs. Gligoric, La Habana olm fin-A 1966',
    event: 'La Habana olm fin-A',
    year: 1966,
    white: 'Bobby Fischer',
    black: 'Svetozar Gligoric',
    result: '1-0',
    significance: 'La Habana olm fin-A, round 8, 1966. Fischer wins with White in 25 moves. Opening: Ruy Lopez: Exchange Variation.',
    pgn: `[Event "La Habana olm fin-A"]
[Site "La Habana"]
[Date "1966.??.??"]
[Round "8"]
[White "Bobby Fischer"]
[Black "Svetozar Gligoric"]
[Result "1-0"]
[ECO "C69"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O f6 6. d4 Bg4 7. c3 exd4 8. cxd4 Qd7 9. h3 Be6 10. Nc3 O-O-O 11. Bf4 Ne7 12. Rc1 Ng6 13. Bg3 Bd6 14. Na4 Bxg3 15. fxg3 Kb8 16. Nc5 Qd6 17. Qa4 Ka7 18. Nxa6 Bxh3 19. e5 Nxe5 20. dxe5 fxe5 21. Nc5+ Kb8 22. gxh3 e4 23. Nxe4 Qe7 24. Rc3 b5 25. Qc2 1-0`
  },
  {
    id: 'najdorf-fischer-1966',
    rank: 63,
    title: 'vs. Najdorf, La Habana olm fin-A 1966',
    event: 'La Habana olm fin-A',
    year: 1966,
    white: 'Miguel Najdorf',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'La Habana olm fin-A, round 9, 1966. Fischer wins with Black in 53 moves. Opening: Benoni Defense.',
    pgn: `[Event "La Habana olm fin-A"]
[Site "La Habana"]
[Date "1966.??.??"]
[Round "9"]
[White "Miguel Najdorf"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "A79"]

1. d4 Nf6 2. c4 c5 3. d5 g6 4. Nc3 Bg7 5. e4 d6 6. Nf3 O-O 7. Be2 e6 8. O-O exd5 9. cxd5 Re8 10. Nd2 Na6 11. f3 Nc7 12. a4 b6 13. Kh1 Nd7 14. Nc4 Ne5 15. Ne3 f5 16. f4 Nf7 17. exf5 gxf5 18. Bd3 Qf6 19. Ne2 Nh6 20. Ng3 Qg6 21. Qc2 Rf8 22. Bd2 Bd7 23. Rae1 Rae8 24. Be2 Re7 25. Bd3 Bd4 26. b4 Bxe3 27. Bxe3 Rfe8 28. bxc5 bxc5 29. Bd2 Rxe1 30. Rxe1 Rxe1+ 31. Bxe1 Nxd5 32. Bc4 Qe6 33. Bc3 Bc6 34. Qb3 Kf7 35. Qb8 Ng8 36. h3 Nge7 37. Qh8 Qh6 38. Ne2 Bxa4 39. Qa8 Bc6 40. Qxa7 Qe6 41. Qa2 Qe4 42. Bd2 Ke8 43. Ng3 Qd4 44. Kh2 Ne3 45. Bxe3 Qxe3 46. Bg8 Qxf4 47. Qf7+ Kd7 48. Bxh7 Be4 49. Bg6 Qe5 50. Bh5 Bd5 51. Qe8+ Kc7 52. Kg1 Qg7 53. Bd1 Bc6 0-1`
  },
  {
    id: 'pachman-fischer-1966',
    rank: 64,
    title: 'vs. Pachman, La Habana olm fin-A 1966',
    event: 'La Habana olm fin-A',
    year: 1966,
    white: 'Ludek Pachman',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'La Habana olm fin-A, round 11, 1966. Fischer wins with Black in 43 moves. Opening: Indian Game.',
    pgn: `[Event "La Habana olm fin-A"]
[Site "La Habana"]
[Date "1966.??.??"]
[Round "11"]
[White "Ludek Pachman"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "A32"]

1. d4 Nf6 2. Nf3 c5 3. c4 cxd4 4. Nxd4 e6 5. e3 Nc6 6. Be2 d5 7. Nc3 Bc5 8. O-O Bxd4 9. exd4 dxc4 10. Be3 Na5 11. Bxc4 Nxc4 12. Qa4+ Bd7 13. Qxc4 Bc6 14. Bg5 Qa5 15. Qc5 Qxc5 16. dxc5 a5 17. Rfd1 h5 18. h4 Nd7 19. Be3 Ne5 20. Bd4 Nd7 21. b3 Rg8 22. Be3 Ne5 23. f3 Ng6 24. Bf2 Nf4 25. Be3 Nd5 26. Nxd5 Bxd5 27. Rd4 Kd7 28. Rc1 Kc6 29. Rc3 f6 30. f4 Rgd8 31. Kf2 a4 32. Rxa4 Rxa4 33. bxa4 Bxa2 34. Rc2 Bd5 35. Rb2 Ra8 36. Rb4 Ra5 37. g3 Kc7 38. Bd4 Bc6 39. Be3 Bxa4 40. Rd4 Bd7 41. Rd2 Ra8 42. Rb2 Rb8 43. Rd2 0-1`
  },
  {
    id: 'portisch-fischer-1966',
    rank: 65,
    title: 'vs. Portisch, Santa Monica 1966',
    event: 'Santa Monica',
    year: 1966,
    white: 'Lajos Portisch',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Santa Monica, round 11, 1966. Fischer wins with Black in 35 moves. Opening: Nimzo-Indian Defense.',
    pgn: `[Event "Santa Monica"]
[Site "Santa Monica"]
[Date "1966.??.??"]
[Round "11"]
[White "Lajos Portisch"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "E45"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Ne2 Ba6 6. Ng3 Bxc3+ 7. bxc3 d5 8. Qf3 O-O 9. e4 dxe4 10. Nxe4 Nxe4 11. Qxe4 Qd7 12. Ba3 Re8 13. Bd3 f5 14. Qxa8 Nc6 15. Qxe8+ Qxe8 16. O-O Na5 17. Rae1 Bxc4 18. Bxc4 Nxc4 19. Bc1 c5 20. dxc5 bxc5 21. Bf4 h6 22. Re2 g5 23. Be5 Qd8 24. Rfe1 Kf7 25. h3 f4 26. Kh2 a6 27. Re4 Qd5 28. h4 Ne3 29. R1xe3 fxe3 30. Rxe3 Qxa2 31. Rf3+ Ke8 32. Bg7 Qc4 33. hxg5 hxg5 34. Rf8+ Kd7 35. Ra8 Kc6 0-1`
  },
  {
    id: 'fischer-barczay-1967',
    rank: 66,
    title: 'vs. Barczay, Sousse Interzonal+ 1967',
    event: 'Sousse Interzonal+',
    year: 1967,
    white: 'Bobby Fischer',
    black: 'Laszlo Barczay',
    result: '1-0',
    significance: 'Sousse Interzonal+, round 1, 1967. Fischer wins with White in 24 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "Sousse Interzonal+"]
[Site "Sousse"]
[Date "1967.??.??"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Laszlo Barczay"]
[Result "1-0"]
[ECO "C95"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nh4 exd4 12. cxd4 Nb6 13. Nf3 d5 14. e5 Ne4 15. Nbd2 Nxd2 16. Bxd2 Bf5 17. Bc2 Bxc2 18. Qxc2 Rc8 19. b3 Nd7 20. e6 fxe6 21. Rxe6 c5 22. Ba5 Qxa5 23. Rxe7 Qd8 24. Ng5 1-0`
  },
  {
    id: 'fischer-myagmarsuren-1967',
    rank: 67,
    title: 'Sousse Sacrifice',
    event: 'Sousse Interzonal+',
    year: 1967,
    white: 'Bobby Fischer',
    black: 'Lhamsuren Myagmarsuren',
    result: '1-0',
    significance: 'A beautiful sacrificial attack in the Interzonal.',
    pgn: `[Event "Sousse Interzonal+"]
[Site "Sousse"]
[Date "1967.??.??"]
[Round "3"]
[White "Bobby Fischer"]
[Black "Lhamsuren Myagmarsuren"]
[Result "1-0"]
[ECO "A08"]

1. e4 e6 2. d3 d5 3. Nd2 Nf6 4. g3 c5 5. Bg2 Nc6 6. Ngf3 Be7 7. O-O O-O 8. e5 Nd7 9. Re1 b5 10. Nf1 b4 11. h4 a5 12. Bf4 a4 13. a3 bxa3 14. bxa3 Na5 15. Ne3 Ba6 16. Bh3 d4 17. Nf1 Nb6 18. Ng5 Nd5 19. Bd2 Bxg5 20. Bxg5 Qd7 21. Qh5 Rfc8 22. Nd2 Nc3 23. Bf6 Qe8 24. Ne4 g6 25. Qg5 Nxe4 26. Rxe4 c4 27. h5 cxd3 28. Rh4 Ra7 29. Bg2 dxc2 30. Qh6 Qf8 31. Qxh7+ 1-0`
  },
  {
    id: 'cuellargacharna-fischer-1967',
    rank: 68,
    title: 'vs. Cuellar Gacharna, Sousse Interzonal+ 1967',
    event: 'Sousse Interzonal+',
    year: 1967,
    white: 'Miguel Cuellar Gacharna',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Sousse Interzonal+, round 4, 1967. Fischer wins with Black in 41 moves. Opening: Benoni Defense: Main Line.',
    pgn: `[Event "Sousse Interzonal+"]
[Site "Sousse"]
[Date "1967.??.??"]
[Round "4"]
[White "Miguel Cuellar Gacharna"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "A71"]

1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. Nf3 g6 7. e4 Bg7 8. Bg5 h6 9. Bf4 g5 10. Bc1 O-O 11. Nd2 Nbd7 12. Be2 Ne5 13. Nf1 b5 14. Bxb5 Qa5 15. Ng3 c4 16. O-O Rb8 17. Qa4 Qxa4 18. Bxa4 Nd3 19. Bb5 Ng4 20. Nge2 Nxc1 21. Raxc1 Ne5 22. b3 cxb3 23. axb3 a6 24. Ba4 Nd3 25. Rc2 f5 26. Ng3 f4 27. Nge2 f3 28. Ng3 fxg2 29. Kxg2 Bg4 30. Nf5 Nf4+ 31. Kg3 Bxf5 32. exf5 Bxc3 33. Kf3 Be5 34. Ke4 Rb4+ 35. Rc4 Rfb8 36. f6 Kf7 37. Kf5 Rxc4 38. bxc4 Ne2 39. Re1 Nd4+ 40. Kg4 h5+ 41. Kh3 Kxf6 0-1`
  },
  {
    id: 'fischer-sarapu-1967',
    rank: 69,
    title: 'vs. Sarapu, Sousse Interzonal+ 1967',
    event: 'Sousse Interzonal+',
    year: 1967,
    white: 'Bobby Fischer',
    black: 'Ortvin Sarapu',
    result: '1-0',
    significance: 'Sousse Interzonal+, round 5, 1967. Fischer wins with White in 29 moves. Opening: French Defense: Classical.',
    pgn: `[Event "Sousse Interzonal+"]
[Site "Sousse"]
[Date "1967.??.??"]
[Round "5"]
[White "Bobby Fischer"]
[Black "Ortvin Sarapu"]
[Result "1-0"]
[ECO "C11"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 dxe4 5. Nxe4 Nbd7 6. Nxf6+ Nxf6 7. Nf3 c5 8. Bb5+ Bd7 9. Bxd7+ Qxd7 10. Qe2 cxd4 11. O-O-O Bc5 12. Qe5 Be7 13. Nxd4 Rc8 14. f4 O-O 15. Nf5 Qc7 16. Nxe7+ Qxe7 17. Rd2 Rc5 18. Bxf6 gxf6 19. Qe3 Rfc8 20. Rhd1 Qc7 21. c3 Rf5 22. g3 Ra5 23. a3 Qc4 24. Qf3 Qb3 25. Qg4+ Kf8 26. Rd8+ Rxd8 27. Rxd8+ Ke7 28. Qg8 f5 29. Re8+ 1-0`
  },
  {
    id: 'fischer-stein-1967',
    rank: 70,
    title: 'Fischer vs Stein',
    event: 'Sousse Interzonal+',
    year: 1967,
    white: 'Bobby Fischer',
    black: 'Leonid Stein',
    result: '1-0',
    significance: 'Fischer is in top form, leading the tournament and winning this slugfest with a three-time Soviet champion, but then abruptly withdraws over a scheduling dispute, putting his World Championship aspirations on hold for three years.',
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
    id: 'fischer-reshevsky-1967',
    rank: 71,
    title: 'vs. Reshevsky, Sousse Interzonal+ 1967',
    event: 'Sousse Interzonal+',
    year: 1967,
    white: 'Bobby Fischer',
    black: 'Samuel Reshevsky',
    result: '1-0',
    significance: 'Sousse Interzonal+, round 11, 1967. Fischer wins with White in 46 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "Sousse Interzonal+"]
[Site "Sousse"]
[Date "1967.??.??"]
[Round "11"]
[White "Bobby Fischer"]
[Black "Samuel Reshevsky"]
[Result "1-0"]
[ECO "C93"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d6 9. h3 h6 10. d4 Re8 11. Nbd2 Bf8 12. Nf1 Bd7 13. Ng3 Na5 14. Bc2 c5 15. b3 Nc6 16. Be3 cxd4 17. cxd4 Nb4 18. Bb1 a5 19. a3 Na6 20. Bd3 Qc7 21. Qe2 Qb7 22. Rad1 g6 23. Qb2 Qb8 24. Bb1 Kh7 25. dxe5 dxe5 26. Nxe5 Rxe5 27. Bf4 Qb7 28. Bxe5 Ne8 29. Ne2 Nc5 30. Nf4 b4 31. a4 Bc6 32. Nd5 Nd7 33. Bd4 Ng7 34. Bd3 Ne6 35. Bc4 Re8 36. Bf6 Nec5 37. Qc2 Ne6 38. Ba1 Qa7 39. Kh1 Bg7 40. Bxg7 Kxg7 41. Bb5 Bxb5 42. axb5 Rb8 43. Qc6 Nef8 44. e5 Kg8 45. Nf6+ Nxf6 46. exf6 Rb6 1-0`
  },
  {
    id: 'byrne-fischer-1967',
    rank: 72,
    title: 'vs. Byrne, Sousse Interzonal+ 1967',
    event: 'Sousse Interzonal+',
    year: 1967,
    white: 'Robert Byrne',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Sousse Interzonal+, round 12, 1967. Fischer wins with Black in 28 moves. Opening: Sicilian Najdorf.',
    pgn: `[Event "Sousse Interzonal+"]
[Site "Sousse"]
[Date "1967.??.??"]
[Round "12"]
[White "Robert Byrne"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "B87"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 b5 8. f4 Bb7 9. f5 e5 10. Nde2 Nbd7 11. Bg5 Be7 12. Ng3 Rc8 13. O-O h5 14. h4 b4 15. Bxf6 Bxf6 16. Nd5 Bxh4 17. Nxh5 Qg5 18. f6 g6 19. Ng7+ Kd8 20. Rf3 Bg3 21. Qd3 Bh2+ 22. Kf1 Nc5 23. Rh3 Rh4 24. Qf3 Nxb3 25. axb3 Rxh3 26. Qxh3 Bxd5 27. exd5 Qxf6+ 28. Ke1 Qf4 0-1`
  },
  {
    id: 'kholmov-fischer-1967',
    rank: 73,
    title: 'vs. Kholmov, Skopje 1967',
    event: 'Skopje',
    year: 1967,
    white: 'Ratmir Kholmov',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Skopje, round 16, 1967. Fischer wins with Black in 32 moves. Opening: Indian Game.',
    pgn: `[Event "Skopje"]
[Site "Skopje"]
[Date "1967.??.??"]
[Round "16"]
[White "Ratmir Kholmov"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "A49"]

1. d4 Nf6 2. Nf3 g6 3. g3 Bg7 4. Bg2 O-O 5. O-O d6 6. Nc3 Nbd7 7. b3 e5 8. dxe5 dxe5 9. e4 Re8 10. Ba3 c6 11. Bd6 Qa5 12. Qd3 Re6 13. b4 Qa3 14. Bc7 Qxb4 15. Rab1 Qe7 16. Rfd1 Ne8 17. Ba5 Rd6 18. Qe2 Rxd1+ 19. Qxd1 Bf8 20. Nd2 Qa3 21. Nc4 Qc5 22. Bf1 b5 23. Nd2 Qa3 24. Nb3 Nc5 25. Bxb5 cxb5 26. Nxb5 Qa4 27. Nxc5 Qxa5 28. Qd5 Rb8 29. a4 Bh3 30. Qxe5 Rc8 31. Nd3 Qxa4 32. Ne1 a6 0-1`
  },
  {
    id: 'bernstein-fischer-1968',
    rank: 74,
    title: 'vs. Bernstein, Netanya-A 1968',
    event: 'Netanya-A',
    year: 1968,
    white: 'Yaacov Bernstein',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Netanya-A, round 8, 1968. Fischer wins with Black in 25 moves. Opening: Sicilian Defense: Closed.',
    pgn: `[Event "Netanya-A"]
[Site "Netanya"]
[Date "1968.??.??"]
[Round "8"]
[White "Yaacov Bernstein"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "B25"]

1. e4 c5 2. Nc3 d6 3. g3 Nc6 4. Bg2 g6 5. d3 Bg7 6. f4 b6 7. Nf3 Bb7 8. O-O Qd7 9. Be3 f5 10. Qd2 Nf6 11. Kh1 O-O-O 12. Rae1 Kb8 13. Bg1 fxe4 14. dxe4 Ba6 15. Ng5 Bxf1 16. Bxf1 Rhe8 17. Bb5 e5 18. fxe5 Rxe5 19. Bxc6 Qxc6 20. Nf7 Rde8 21. Nxe5 Rxe5 22. Qf4 b5 23. a3 b4 24. axb4 cxb4 25. Bd4 Rf5 0-1`
  },
  {
    id: 'nikolic-fischer-1968',
    rank: 75,
    title: 'vs. Nikolic, Vinkovci 1968',
    event: 'Vinkovci',
    year: 1968,
    white: 'Emil Nikolic',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Vinkovci, round 9, 1968. Fischer wins with Black in 31 moves. Opening: English Opening.',
    pgn: `[Event "Vinkovci"]
[Site "Vinkovci"]
[Date "1968.??.??"]
[Round "9"]
[White "Emil Nikolic"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "E61"]

1. c4 g6 2. Nc3 Bg7 3. g3 e5 4. Bg2 d6 5. e3 Nf6 6. Nge2 O-O 7. O-O c6 8. d4 Re8 9. Rb1 e4 10. b4 Bf5 11. h3 h5 12. Nf4 Nbd7 13. a4 Nf8 14. c5 d5 15. b5 N8h7 16. Bd2 Ng5 17. Rb2 Qd7 18. Kh2 Bh6 19. a5 Bg4 20. hxg4 hxg4 21. Rh1 Nf3+ 22. Bxf3 gxf3 23. Kg1 Bxf4 24. exf4 Kg7 25. f5 Rh8 26. Bh6+ Rxh6 27. Rxh6 Kxh6 28. Qd2+ g5 29. bxc6 Qxf5 30. Nd1 Qh3 31. Ne3 Kg6 0-1`
  },
  {
    id: 'fischer-geller-1968',
    rank: 76,
    title: 'vs. Geller, Netanya-A 1968',
    event: 'Netanya-A',
    year: 1968,
    white: 'Bobby Fischer',
    black: 'Uzi Geller',
    result: '1-0',
    significance: 'Netanya-A, round 11, 1968. Fischer wins with White in 32 moves. Opening: French Defense.',
    pgn: `[Event "Netanya-A"]
[Site "Netanya"]
[Date "1968.??.??"]
[Round "11"]
[White "Bobby Fischer"]
[Black "Uzi Geller"]
[Result "1-0"]
[ECO "A08"]

1. e4 e6 2. d3 d5 3. Nd2 c5 4. g3 Nf6 5. Bg2 Be7 6. Ngf3 O-O 7. O-O Nc6 8. Re1 Qc7 9. e5 Nd7 10. Qe2 b5 11. h4 a5 12. Nf1 Nd4 13. Nxd4 cxd4 14. Bf4 Ra6 15. Nh2 Rc6 16. Rac1 Ba6 17. Bxd5 exd5 18. e6 Qd8 19. exd7 Re6 20. Qg4 f5 21. Qh5 Qxd7 22. Nf3 g6 23. Qh6 Bf6 24. Rxe6 Qxe6 25. Be5 Bxe5 26. Re1 f4 27. Rxe5 Qd7 28. h5 fxg3 29. hxg6 gxf2+ 30. Kxf2 hxg6 31. Qxg6+ Qg7 32. Rg5 1-0`
  },
  {
    id: 'smyslov-fischer-1970',
    rank: 77,
    title: 'vs. Smyslov, Palma de Mallorca Interzonal 1970',
    event: 'Palma de Mallorca Interzonal',
    year: 1970,
    white: 'Vassily Smyslov',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Palma de Mallorca Interzonal, round 2, 1970. Fischer wins with Black in 44 moves. Opening: English Opening.',
    pgn: `[Event "Palma de Mallorca Interzonal"]
[Site "Palma de Mallorca"]
[Date "1970.??.??"]
[Round "2"]
[White "Vassily Smyslov"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "A36"]

1. c4 g6 2. Nc3 Bg7 3. g3 c5 4. Bg2 Nc6 5. b3 e6 6. Bb2 Nge7 7. Na4 Bxb2 8. Nxb2 O-O 9. e3 d5 10. cxd5 Nxd5 11. Ne2 b6 12. d4 Ba6 13. dxc5 Qf6 14. Nc4 Nc3 15. Nxc3 Qxc3+ 16. Kf1 Rfd8 17. Qc1 Bxc4+ 18. bxc4 Qd3+ 19. Kg1 Rac8 20. cxb6 axb6 21. Qb2 Na5 22. h4 Nxc4 23. Qf6 Qf5 24. Qxf5 gxf5 25. h5 Rd2 26. Rc1 Rc5 27. Rh4 Ne5 28. Rxc5 bxc5 29. Ra4 c4 30. h6 Kf8 31. Ra8+ Ke7 32. Rc8 Rxa2 33. Bf1 Rc2 34. Kg2 Ng4 35. Kg1 Rxf2 36. Bxc4 Rf3 37. Kg2 Rxe3 38. Rh8 Nxh6 39. Rxh7 Ng4 40. Bb5 Rb3 41. Bc6 Rb2+ 42. Kg1 Ne5 43. Ba8 Rb8 44. Bh1 0-1`
  },
  {
    id: 'hort-fischer-1970',
    rank: 78,
    title: 'vs. Hort, Palma de Mallorca Interzonal 1970',
    event: 'Palma de Mallorca Interzonal',
    year: 1970,
    white: 'Vlastimil Hort',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Palma de Mallorca Interzonal, round 5, 1970. Fischer wins with Black in 73 moves. Opening: Sicilian Defense: Closed.',
    pgn: `[Event "Palma de Mallorca Interzonal"]
[Site "Palma de Mallorca"]
[Date "1970.??.??"]
[Round "5"]
[White "Vlastimil Hort"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "B50"]

1. e4 c5 2. Nc3 d6 3. Nf3 a6 4. g3 Nc6 5. Bg2 Bg4 6. h3 Bxf3 7. Bxf3 g6 8. d3 Bg7 9. a4 e6 10. Bg2 Nge7 11. O-O O-O 12. Be3 Qa5 13. Bd2 Qc7 14. Qb1 Nd4 15. a5 Nec6 16. Nd1 c4 17. dxc4 Ne5 18. Be3 Nxc4 19. Ra4 Rac8 20. Bxd4 Bxd4 21. Qa2 Bf6 22. c3 Bd8 23. b4 Bf6 24. Re1 Rfd8 25. Qe2 Kg7 26. Ra2 h5 27. h4 Qd7 28. Kh2 Ne5 29. Rc2 Ng4+ 30. Kh1 Rc7 31. Bh3 Ne5 32. Ne3 Qa4 33. Rb1 Nc4 34. Ra2 Qc6 35. Nxc4 Qxc4 36. Qxc4 Rxc4 37. b5 Bxc3 38. bxa6 bxa6 39. Rb6 Rxe4 40. Rxa6 Re1+ 41. Kh2 d5 42. Rc6 Ra1 43. Rxa1 Bxa1 44. a6 Bd4 45. Rc2 Kf6 46. f4 Rb8 47. Ra2 Ba7 48. Bf1 Ke7 49. Kg2 Kd6 50. Bd3 Rb3 51. Be2 f6 52. Rd2 Ra3 53. Bd3 Bb6 54. Rd1 Ra2+ 55. Kf3 Bd4 56. g4 Ra3 57. Kg2 Be3 58. Kf3 Bc5 59. Kg3 e5 60. fxe5+ fxe5 61. Kg2 hxg4 62. Bxg6 Rxa6 63. Kg3 Ke6 64. h5 Be3 65. Kxg4 Ra4+ 66. Kf3 Bh6 67. Rb1 e4+ 68. Kg3 Ra3+ 69. Kg4 Ke5 70. Rb8 Ra1 71. Re8+ Kd4 72. Kf5 Rf1+ 73. Ke6 e3 0-1`
  },
  {
    id: 'reshevsky-fischer-1970',
    rank: 79,
    title: 'vs. Reshevsky, Palma de Mallorca Interzonal 1970',
    event: 'Palma de Mallorca Interzonal',
    year: 1970,
    white: 'Samuel Reshevsky',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Palma de Mallorca Interzonal, round 6, 1970. Fischer wins with Black in 30 moves. Opening: Indian Game.',
    pgn: `[Event "Palma de Mallorca Interzonal"]
[Site "Palma de Mallorca"]
[Date "1970.??.??"]
[Round "6"]
[White "Samuel Reshevsky"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "A32"]

1. d4 Nf6 2. c4 c5 3. Nf3 cxd4 4. Nxd4 e6 5. Nc3 Bb4 6. e3 Ne4 7. Qc2 Nxc3 8. bxc3 Be7 9. Be2 O-O 10. O-O a6 11. f4 d6 12. f5 exf5 13. Nxf5 Bxf5 14. Qxf5 Nd7 15. Bf3 Qc7 16. Rb1 Rab8 17. Bd5 Nf6 18. Ba3 Rfe8 19. Qd3 Nxd5 20. cxd5 b5 21. e4 Bf8 22. Rb4 Re5 23. c4 Rbe8 24. cxb5 axb5 25. Kh1 Qe7 26. Qxb5 Rxe4 27. Rxe4 Qxe4 28. Qd7 Qf4 29. Kg1 Qd4+ 30. Kh1 Qf2 0-1`
  },
  {
    id: 'fischer-larsen-1970',
    rank: 80,
    title: 'vs. Larsen, Palma de Mallorca Interzonal 1970',
    event: 'Palma de Mallorca Interzonal',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Bent Larsen',
    result: '0-1',
    significance: 'Palma de Mallorca Interzonal, round 9, 1970. Fischer loses with White in 52 moves. Opening: Sicilian Defense.',
    pgn: `[Event "Palma de Mallorca Interzonal"]
[Site "Palma de Mallorca"]
[Date "1970.??.??"]
[Round "9"]
[White "Bobby Fischer"]
[Black "Bent Larsen"]
[Result "0-1"]
[ECO "B89"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bc4 e6 7. Bb3 Be7 8. Be3 O-O 9. Qe2 a6 10. O-O-O Qc7 11. g4 Nd7 12. h4 Nc5 13. g5 b5 14. f3 Bd7 15. Qg2 b4 16. Nce2 Nxb3+ 17. axb3 a5 18. g6 fxg6 19. h5 Nxd4 20. Nxd4 g5 21. Bxg5 Bxg5+ 22. Qxg5 h6 23. Qg4 Rf7 24. Rhg1 a4 25. bxa4 e5 26. Ne6 Qc4 27. b3 Qxe6 28. Qxe6 Bxe6 29. Rxd6 Re8 30. Rb6 Rxf3 31. Rxb4 Rc8 32. Kb2 Rf2 33. Rc1 Bf7 34. a5 Ra8 35. Rb5 Bxh5 36. Rxe5 Be2 37. Rc5 h5 38. e5 Bf3 39. Kc3 h4 40. Kd3 Re2 41. Rf1 Rd8+ 42. Kc3 Be4 43. Kb4 Rb8+ 44. Ka3 h3 45. e6 Bxc2 46. b4 Re3+ 47. Kb2 Bd3 48. Ra1 Ba6 49. Rc6 Rxb4+ 50. Kc2 Bb7 51. Rc3 Re2+ 52. Kd1 Rg2 0-1`
  },
  {
    id: 'fischer-ivkov-1970',
    rank: 81,
    title: 'vs. Ivkov, Palma de Mallorca Interzonal 1970',
    event: 'Palma de Mallorca Interzonal',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Borislav Ivkov',
    result: '1-0',
    significance: 'Palma de Mallorca Interzonal, round 13, 1970. Fischer wins with White in 44 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "Palma de Mallorca Interzonal"]
[Site "Palma de Mallorca"]
[Date "1970.??.??"]
[Round "13"]
[White "Bobby Fischer"]
[Black "Borislav Ivkov"]
[Result "1-0"]
[ECO "C93"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 h6 10. d4 Re8 11. Be3 Bf8 12. Nbd2 Bb7 13. Qb1 Qb8 14. a3 Nd8 15. Bc2 c6 16. b4 Qc7 17. Bd3 Ne6 18. Qc2 Rac8 19. a4 Nd7 20. Qb3 Nf4 21. Bxf4 exf4 22. c4 bxc4 23. Bxc4 d5 24. Bd3 Rb8 25. Qc3 Qb6 26. Reb1 Ba8 27. a5 Qa7 28. e5 Rb7 29. Qxc6 Bxb4 30. Qxa6 Qb8 31. Bc2 Re6 32. Qd3 Nf8 33. Qf5 Ra6 34. Nb3 g6 35. Qxf4 Bc3 36. Nc5 Rxa5 37. Nxb7 Rxa1 38. Rxa1 Ne6 39. Qf6 Bxa1 40. Nd6 Qc7 41. Bxg6 Qc1+ 42. Ne1 Qxe1+ 43. Kh2 Ng5 44. Bxf7+ 1-0`
  },
  {
    id: 'spassky-fischer-1970',
    rank: 82,
    title: 'vs. Spassky, Siegen olm 1970',
    event: 'Siegen olm',
    year: 1970,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    result: '1-0',
    significance: 'Siegen olm, round 14, 1970. Fischer loses with Black in 39 moves. Opening: Grünfeld Defense: Exchange Variation.',
    pgn: `[Event "Siegen olm"]
[Site "Siegen"]
[Date "1970.??.??"]
[Round "14"]
[White "Boris Spassky"]
[Black "Bobby Fischer"]
[Result "1-0"]
[ECO "D87"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 Nc6 9. Be3 O-O 10. O-O Qc7 11. Rc1 Rd8 12. h3 b6 13. f4 e6 14. Qe1 Na5 15. Bd3 f5 16. g4 fxe4 17. Bxe4 Bb7 18. Ng3 Nc4 19. Bxb7 Qxb7 20. Bf2 Qc6 21. Qe2 cxd4 22. cxd4 b5 23. Ne4 Bxd4 24. Ng5 Bxf2+ 25. Rxf2 Rd6 26. Re1 Qb6 27. Ne4 Rd4 28. Nf6+ Kh8 29. Qxe6 Rd6 30. Qe4 Rf8 31. g5 Rd2 32. Rf1 Qc7 33. Rxd2 Nxd2 34. Qd4 Rd8 35. Nd5+ Kg8 36. Rf2 Nc4 37. Re2 Rd6 38. Re8+ Kf7 39. Rf8+ 1-0`
  },
  {
    id: 'uhlmann-fischer-1970',
    rank: 83,
    title: 'vs. Uhlmann, Palma de Mallorca Interzonal 1970',
    event: 'Palma de Mallorca Interzonal',
    year: 1970,
    white: 'Wolfgang Uhlmann',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Palma de Mallorca Interzonal, round 18, 1970. Fischer wins with Black in 34 moves. Opening: Benoni Defense: Main Line.',
    pgn: `[Event "Palma de Mallorca Interzonal"]
[Site "Palma de Mallorca"]
[Date "1970.??.??"]
[Round "18"]
[White "Wolfgang Uhlmann"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "A75"]

1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. Bf4 a6 8. a4 Bg7 9. Nf3 O-O 10. Be2 Bg4 11. O-O Re8 12. h3 Nxe4 13. Nxe4 Rxe4 14. Bg5 Qe8 15. Bd3 Bxf3 16. Qxf3 Rb4 17. Rae1 Be5 18. Qd1 Qxa4 19. Qxa4 Rxa4 20. f4 Bd4+ 21. Kh1 Nd7 22. Re7 Nf6 23. Rxb7 Nh5 24. Kh2 Be3 25. Be2 Bxf4+ 26. Bxf4 Rxf4 27. Rb6 Rxf1 28. Bxf1 Rd8 29. Rxa6 Kg7 30. Bb5 Kf6 31. Bc6 Ke5 32. Ra7 Rf8 33. Re7+ Kd4 34. Rd7 Nf6 0-1`
  },
  {
    id: 'fischer-mecking-1970',
    rank: 84,
    title: 'vs. Mecking, Palma de Mallorca Interzonal 1970',
    event: 'Palma de Mallorca Interzonal',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Henrique Mecking',
    result: '1-0',
    significance: 'Palma de Mallorca Interzonal, round 21, 1970. Fischer wins with White in 42 moves. Opening: Larsen\'s Opening.',
    pgn: `[Event "Palma de Mallorca Interzonal"]
[Site "Palma de Mallorca"]
[Date "1970.??.??"]
[Round "21"]
[White "Bobby Fischer"]
[Black "Henrique Mecking"]
[Result "1-0"]
[ECO "A03"]

1. b3 d5 2. Bb2 c5 3. Nf3 Nc6 4. e3 Nf6 5. Bb5 Bd7 6. O-O e6 7. d3 Be7 8. Bxc6 Bxc6 9. Ne5 Rc8 10. Nd2 O-O 11. f4 Nd7 12. Qg4 Nxe5 13. Bxe5 Bf6 14. Rf3 Qe7 15. Raf1 a5 16. Rg3 Bxe5 17. fxe5 f5 18. exf6 Rxf6 19. Qxg7+ Qxg7 20. Rxf6 Qxg3 21. hxg3 Re8 22. g4 a4 23. Nf3 axb3 24. axb3 Kg7 25. g5 e5 26. Nh4 Bd7 27. Rd6 Be6 28. Kf2 Kf7 29. Rb6 Re7 30. e4 dxe4 31. dxe4 c4 32. b4 Bg4 33. Ke3 Rd7 34. g6+ Kf8 35. gxh7 Rxh7 36. Ng6+ Ke8 37. Nxe5 Bc8 38. Nxc4 Kd8 39. Nd6 Rg7 40. Kf2 Kc7 41. Nxc8 Kxc8 42. Rd6 1-0`
  },
  {
    id: 'gligoric-fischer-1970',
    rank: 85,
    title: 'vs. Gligoric, Palma de Mallorca Interzonal 1970',
    event: 'Palma de Mallorca Interzonal',
    year: 1970,
    white: 'Svetozar Gligoric',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Palma de Mallorca Interzonal, round 22, 1970. Fischer wins with Black in 35 moves. Opening: Indian Game.',
    pgn: `[Event "Palma de Mallorca Interzonal"]
[Site "Palma de Mallorca"]
[Date "1970.??.??"]
[Round "22"]
[White "Svetozar Gligoric"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "A77"]

1. d4 Nf6 2. c4 e6 3. Nc3 c5 4. d5 exd5 5. cxd5 d6 6. Nf3 g6 7. e4 Bg7 8. Be2 O-O 9. O-O Re8 10. Nd2 Nbd7 11. a4 Ne5 12. Qc2 g5 13. Nf3 Nxf3+ 14. Bxf3 h6 15. Bd2 a6 16. Be2 Qe7 17. Rae1 Qe5 18. Kh1 Qd4 19. f3 Nh5 20. Nb5 axb5 21. Bxb5 Qe5 22. Bc3 Qe7 23. Bxe8 Qxe8 24. Bxg7 Kxg7 25. b4 cxb4 26. Qb2+ Qe5 27. Qxb4 Nf4 28. Rd1 b6 29. Rf2 Nd3 30. Qxb6 Nxf2+ 31. Qxf2 Rxa4 32. Kg1 Ra1 33. Qe1 Ra2 34. Qg3 Qb2 35. h4 Ra1 0-1`
  },
  {
    id: 'fischer-petrosian-1971',
    rank: 86,
    title: 'vs. Petrosian, Candidats final 1971',
    event: 'Candidats final',
    year: 1971,
    white: 'Bobby Fischer',
    black: 'Tigran Petrosian',
    result: '1-0',
    significance: 'Candidats final, Buenos Aires, round 1, 1971. Fischer wins with White in 40 moves. Opening: Sicilian Defense.',
    pgn: `[Event "Candidats final"]
[Site "Buenos Aires"]
[Date "1971.??.??"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Tigran Petrosian"]
[Result "1-0"]
[WhiteElo "2760"]
[BlackElo "2640"]
[ECO "B44"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. Bf4 e5 7. Be3 Nf6 8. Bg5 Be6 9. N1c3 a6 10. Bxf6 gxf6 11. Na3 d5 12. exd5 Bxa3 13. bxa3 Qa5 14. Qd2 O-O-O 15. Bc4 Rhg8 16. Rd1 Bf5 17. Bd3 Bxd3 18. Qxd3 Nd4 19. O-O Kb8 20. Kh1 Qxa3 21. f4 Rc8 22. Ne4 Qxd3 23. cxd3 Rc2 24. Rd2 Rxd2 25. Nxd2 f5 26. fxe5 Re8 27. Re1 Nc2 28. Re2 Nd4 29. Re3 Nc2 30. Rh3 Rxe5 31. Nf3 Rxd5 32. Rxh7 Rxd3 33. h4 Ne3 34. Rxf7 Rd1+ 35. Kh2 Ra1 36. h5 f4 37. Rxf4 Rxa2 38. Re4 Nxg2 39. Kg3 Ra5 40. Ne5 1-0`
  },
  {
    id: 'fischer-larsen-1971',
    rank: 87,
    title: 'vs. Larsen, Candidats sf1 1971',
    event: 'Candidats sf1',
    year: 1971,
    white: 'Bobby Fischer',
    black: 'Bent Larsen',
    result: '1-0',
    significance: 'Candidats sf1, Denver, round 1, 1971. Fischer wins with White in 41 moves. Opening: French Defense: Winawer.',
    pgn: `[Event "Candidats sf1"]
[Site "Denver"]
[Date "1971.??.??"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Bent Larsen"]
[Result "1-0"]
[WhiteElo "2760"]
[BlackElo "2660"]
[ECO "C19"]

1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 Ne7 5. a3 Bxc3+ 6. bxc3 c5 7. a4 Nbc6 8. Nf3 Bd7 9. Bd3 Qc7 10. O-O c4 11. Be2 f6 12. Re1 Ng6 13. Ba3 fxe5 14. dxe5 Ncxe5 15. Nxe5 Nxe5 16. Qd4 Ng6 17. Bh5 Kf7 18. f4 Rhe8 19. f5 exf5 20. Qxd5+ Kf6 21. Bf3 Ne5 22. Qd4 Kg6 23. Rxe5 Qxe5 24. Qxd7 Rad8 25. Qxb7 Qe3+ 26. Kf1 Rd2 27. Qc6+ Re6 28. Bc5 Rf2+ 29. Kg1 Rxg2+ 30. Kxg2 Qd2+ 31. Kh1 Rxc6 32. Bxc6 Qxc3 33. Rg1+ Kf6 34. Bxa7 g5 35. Bb6 Qxc2 36. a5 Qb2 37. Bd8+ Ke6 38. a6 Qa3 39. Bb7 Qc5 40. Rb1 c3 41. Bb6 1-0`
  },
  {
    id: 'taimanov-fischer-1971',
    rank: 88,
    title: 'vs. Taimanov, Candidats qf3 1971',
    event: 'Candidats qf3',
    year: 1971,
    white: 'Mark Taimanov',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Candidats qf3, Vancouver, round 1, 1971. Fischer wins with Black in 40 moves. Opening: King\'s Indian Defense: Mar del Plata.',
    pgn: `[Event "Candidats qf3"]
[Site "Vancouver"]
[Date "1971.??.??"]
[Round "1"]
[White "Mark Taimanov"]
[Black "Bobby Fischer"]
[Result "0-1"]
[WhiteElo "2620"]
[BlackElo "2740"]
[ECO "E97"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Bd2 Ne8 10. Rc1 f5 11. exf5 gxf5 12. Ng5 h6 13. Ne6 Bxe6 14. dxe6 Qc8 15. Qb3 c6 16. Bh5 Qxe6 17. Qxb7 Nf6 18. Be2 Rfb8 19. Qa6 Rxb2 20. Rfd1 e4 21. Qa3 Rb7 22. Bf4 d5 23. cxd5 cxd5 24. Nb5 Ng6 25. Nd4 Qd7 26. Qe3 Kh7 27. h3 Rf8 28. Ba6 Rb6 29. Rc7 Qa4 30. Rxg7+ Kxg7 31. Bxh6+ Kf7 32. Be2 Rfb8 33. Nxf5 Rb1 34. Rxb1 Rxb1+ 35. Kh2 Qd7 36. Nd4 Qd6+ 37. g3 Qb4 38. Nc6 Qb6 39. Nxa7 Qxe3 40. Bxe3 Re1 0-1`
  },
  {
    id: 'larsen-fischer-1971',
    rank: 89,
    title: 'vs. Larsen, Candidats sf1 1971',
    event: 'Candidats sf1',
    year: 1971,
    white: 'Bent Larsen',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Candidats sf1, Denver, round 2, 1971. Fischer wins with Black in 54 moves. Opening: English Opening: Symmetrical.',
    pgn: `[Event "Candidats sf1"]
[Site "Denver"]
[Date "1971.??.??"]
[Round "2"]
[White "Bent Larsen"]
[Black "Bobby Fischer"]
[Result "0-1"]
[WhiteElo "2660"]
[BlackElo "2760"]
[ECO "B36"]

1. c4 c5 2. Nf3 g6 3. d4 cxd4 4. Nxd4 Nc6 5. e4 Nf6 6. Nc3 d6 7. Be2 Nxd4 8. Qxd4 Bg7 9. Bg5 h6 10. Be3 O-O 11. Qd2 Kh7 12. O-O Be6 13. f4 Rc8 14. b3 Qa5 15. a3 a6 16. f5 Bd7 17. b4 Qe5 18. Rae1 Bc6 19. Bf4 Nxe4 20. Nxe4 Qxe4 21. Bd3 Qd4+ 22. Kh1 Rce8 23. Be3 Qc3 24. Bxh6 Qxd2 25. Bxd2 Be5 26. Bf4 Bxf4 27. Rxf4 gxf5 28. Rxf5 Kg7 29. Rg5+ Kh6 30. h4 e6 31. Rf1 f5 32. Rb1 Rf7 33. b5 axb5 34. cxb5 Bd7 35. g4 Ra8 36. gxf5 exf5 37. Bc4 Ra4 38. Rc1 Bxb5 39. Bxf7 Rxh4+ 40. Kg2 Kxg5 41. Bd5 Ba6 42. Rd1 Ra4 43. Bf3 Rxa3 44. Rxd6 Ra2+ 45. Kg1 Kf4 46. Bg2 Rb2 47. Rd7 b6 48. Rd8 Be2 49. Bh3 Bg4 50. Bf1 Bf3 51. Rb8 Be4 52. Ba6 Ke3 53. Rc8 Rb1+ 54. Kh2 Kf4 0-1`
  },
  {
    id: 'taimanov-fischer-1971-2',
    rank: 90,
    title: 'vs. Taimanov, Candidats qf3 1971',
    event: 'Candidats qf3',
    year: 1971,
    white: 'Mark Taimanov',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Candidats qf3, Vancouver, round 3, 1971. Fischer wins with Black in 42 moves. Opening: King\'s Indian Defense: Mar del Plata.',
    pgn: `[Event "Candidats qf3"]
[Site "Vancouver"]
[Date "1971.??.??"]
[Round "3"]
[White "Mark Taimanov"]
[Black "Bobby Fischer"]
[Result "0-1"]
[WhiteElo "2620"]
[BlackElo "2740"]
[ECO "E97"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Bd2 Ne8 10. Rc1 f5 11. Qb3 b6 12. exf5 gxf5 13. Ng5 Nf6 14. f4 h6 15. fxe5 dxe5 16. c5 Nfxd5 17. Nxd5 Nxd5 18. cxb6 axb6 19. Rc6 Kh8 20. Nf3 Bb7 21. Rg6 Nf4 22. Bxf4 exf4 23. Rd1 Qe7 24. Re6 Qc5+ 25. Kf1 Rfd8 26. Rxd8+ Rxd8 27. Qa4 Qc1+ 28. Kf2 Bf8 29. b4 Be4 30. Re8 Bc6 31. Qxc6 Qxc6 32. Rxd8 Qf6 33. Rc8 Qe7 34. Kf1 Kh7 35. Nd4 Bg7 36. Nb5 Be5 37. a3 Qd7 38. Ra8 f3 39. gxf3 Bxh2 40. Kg2 Qg7+ 41. Kxh2 Qe5+ 42. Kg1 0-1`
  },
  {
    id: 'fischer-taimanov-1971',
    rank: 91,
    title: 'vs. Taimanov, Candidats qf3 1971',
    event: 'Candidats qf3',
    year: 1971,
    white: 'Bobby Fischer',
    black: 'Mark Taimanov',
    result: '1-0',
    significance: 'Candidats qf3, Vancouver, round 4, 1971. Fischer wins with White in 71 moves. Opening: Sicilian Defense: Old Sicilian.',
    pgn: `[Event "Candidats qf3"]
[Site "Vancouver"]
[Date "1971.??.??"]
[Round "4"]
[White "Bobby Fischer"]
[Black "Mark Taimanov"]
[Result "1-0"]
[WhiteElo "2740"]
[BlackElo "2620"]
[ECO "B47"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Qc7 5. Nc3 e6 6. g3 a6 7. Bg2 Nf6 8. O-O Nxd4 9. Qxd4 Bc5 10. Bf4 d6 11. Qd2 h6 12. Rad1 e5 13. Be3 Bg4 14. Bxc5 dxc5 15. f3 Be6 16. f4 Rd8 17. Nd5 Bxd5 18. exd5 e4 19. Rfe1 Rxd5 20. Rxe4+ Kd8 21. Qe2 Rxd1+ 22. Qxd1+ Qd7 23. Qxd7+ Kxd7 24. Re5 b6 25. Bf1 a5 26. Bc4 Rf8 27. Kg2 Kd6 28. Kf3 Nd7 29. Re3 Nb8 30. Rd3+ Kc7 31. c3 Nc6 32. Re3 Kd6 33. a4 Ne7 34. h3 Nc6 35. h4 h5 36. Rd3+ Kc7 37. Rd5 f5 38. Rd2 Rf6 39. Re2 Kd7 40. Re3 g6 41. Bb5 Rd6 42. Ke2 Kd8 43. Rd3 Kc7 44. Rxd6 Kxd6 45. Kd3 Ne7 46. Be8 Kd5 47. Bf7+ Kd6 48. Kc4 Kc6 49. Be8+ Kb7 50. Kb5 Nc8 51. Bc6+ Kc7 52. Bd5 Ne7 53. Bf7 Kb7 54. Bb3 Ka7 55. Bd1 Kb7 56. Bf3+ Kc7 57. Ka6 Nc8 58. Bd5 Ne7 59. Bc4 Nc6 60. Bf7 Ne7 61. Be8 Kd8 62. Bxg6 Nxg6 63. Kxb6 Kd7 64. Kxc5 Ne7 65. b4 axb4 66. cxb4 Nc8 67. a5 Nd6 68. b5 Ne4+ 69. Kb6 Kc8 70. Kc6 Kb8 71. b6 1-0`
  },
  {
    id: 'taimanov-fischer-1971-3',
    rank: 92,
    title: 'vs. Taimanov, Candidats qf3 1971',
    event: 'Candidats qf3',
    year: 1971,
    white: 'Mark Taimanov',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Candidats qf3, Vancouver, round 5, 1971. Fischer wins with Black in 46 moves. Opening: Grünfeld Defense.',
    pgn: `[Event "Candidats qf3"]
[Site "Vancouver"]
[Date "1971.??.??"]
[Round "5"]
[White "Mark Taimanov"]
[Black "Bobby Fischer"]
[Result "0-1"]
[WhiteElo "2620"]
[BlackElo "2740"]
[ECO "D80"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Bg5 Ne4 5. Bh4 Nxc3 6. bxc3 dxc4 7. e3 Be6 8. Rb1 b6 9. Be2 Bh6 10. Nf3 c6 11. Ne5 Bg7 12. f4 Bd5 13. O-O Nd7 14. Nxc4 O-O 15. a4 c5 16. Ne5 Nxe5 17. dxe5 f6 18. Rb2 Be6 19. Rd2 Qc7 20. Bg4 Qc8 21. Bf3 Rb8 22. Qe2 Rd8 23. Rfd1 Rxd2 24. Qxd2 Qe8 25. exf6 exf6 26. Qd6 Rc8 27. a5 Bf8 28. Qd2 Be7 29. Bd5 Qf7 30. Bxe6 Qxe6 31. Qd7 Kf7 32. Qxa7 bxa5 33. e4 Qc6 34. Rd7 Qxe4 35. h3 a4 36. Bf2 Kf8 37. c4 a3 38. Qxa3 Ra8 39. Qb2 Ke8 40. Qb5 Kf8 41. Rd1 Qxf4 42. Bxc5 Bxc5+ 43. Qxc5+ Kg7 44. Rf1 Qe4 45. Qc7+ Kh6 46. Rxf6 Qd4+ 0-1`
  },
  {
    id: 'petrosian-fischer-1971',
    rank: 93,
    title: 'vs. Petrosian, Candidats final 1971',
    event: 'Candidats final',
    year: 1971,
    white: 'Tigran Petrosian',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Candidats final, Buenos Aires, round 6, 1971. Fischer wins with Black in 66 moves. Opening: Réti Opening.',
    pgn: `[Event "Candidats final"]
[Site "Buenos Aires"]
[Date "1971.??.??"]
[Round "6"]
[White "Tigran Petrosian"]
[Black "Bobby Fischer"]
[Result "0-1"]
[WhiteElo "2640"]
[BlackElo "2760"]
[ECO "A06"]

1. Nf3 c5 2. b3 d5 3. Bb2 f6 4. c4 d4 5. d3 e5 6. e3 Ne7 7. Be2 Nec6 8. Nbd2 Be7 9. O-O O-O 10. e4 a6 11. Ne1 b5 12. Bg4 Bxg4 13. Qxg4 Qc8 14. Qe2 Nd7 15. Nc2 Rb8 16. Rfc1 Qe8 17. Ba3 Bd6 18. Ne1 g6 19. cxb5 axb5 20. Bb2 Nb6 21. Nef3 Ra8 22. a3 Na5 23. Qd1 Qf7 24. a4 bxa4 25. bxa4 c4 26. dxc4 Nbxc4 27. Nxc4 Nxc4 28. Qe2 Nxb2 29. Qxb2 Rfb8 30. Qa2 Bb4 31. Qxf7+ Kxf7 32. Rc7+ Ke6 33. g4 Bc3 34. Ra2 Rc8 35. Rxc8 Rxc8 36. a5 Ra8 37. a6 Ra7 38. Kf1 g5 39. Ke2 Kd6 40. Kd3 Kc5 41. Ng1 Kb5 42. Ne2 Ba5 43. Rb2+ Kxa6 44. Rb1 Rc7 45. Rb2 Be1 46. f3 Ka5 47. Rc2 Rb7 48. Ra2+ Kb5 49. Rb2+ Bb4 50. Ra2 Rc7 51. Ra1 Rc8 52. Ra7 Ba5 53. Rd7 Bb6 54. Rd5+ Bc5 55. Nc1 Ka4 56. Rd7 Bb4 57. Ne2 Kb3 58. Rb7 Ra8 59. Rxh7 Ra1 60. Nxd4+ exd4 61. Kxd4 Rd1+ 62. Ke3 Bc5+ 63. Ke2 Rh1 64. h4 Kc4 65. h5 Rh2+ 66. Ke1 Kd3 0-1`
  },
  {
    id: 'fischer-petrosian-1971-2',
    rank: 94,
    title: 'vs. Petrosian, Candidats final 1971',
    event: 'Candidats final',
    year: 1971,
    white: 'Bobby Fischer',
    black: 'Tigran Petrosian',
    result: '1-0',
    significance: 'Candidats final, Buenos Aires, round 7, 1971. Fischer wins with White in 34 moves. Opening: Sicilian Defense.',
    pgn: `[Event "Candidats final"]
[Site "Buenos Aires"]
[Date "1971.??.??"]
[Round "7"]
[White "Bobby Fischer"]
[Black "Tigran Petrosian"]
[Result "1-0"]
[WhiteElo "2760"]
[BlackElo "2640"]
[ECO "B42"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nc6 6. Nxc6 bxc6 7. O-O d5 8. c4 Nf6 9. cxd5 cxd5 10. exd5 exd5 11. Nc3 Be7 12. Qa4+ Qd7 13. Re1 Qxa4 14. Nxa4 Be6 15. Be3 O-O 16. Bc5 Rfe8 17. Bxe7 Rxe7 18. b4 Kf8 19. Nc5 Bc8 20. f3 Rea7 21. Re5 Bd7 22. Nxd7+ Rxd7 23. Rc1 Rd6 24. Rc7 Nd7 25. Re2 g6 26. Kf2 h5 27. f4 h4 28. Kf3 f5 29. Ke3 d4+ 30. Kd2 Nb6 31. Ree7 Nd5 32. Rf7+ Ke8 33. Rb7 Nxb4 34. Bc4 1-0`
  },
  {
    id: 'spassky-fischer-1972',
    rank: 95,
    title: 'Match Opening Loss',
    event: 'World Championship 28th',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    result: '1-0',
    significance: 'The famous blunder on move 29 in the Poisoned Pawn variation.',
    pgn: `[Event "World Championship 28th"]
[Site "Reykjavik"]
[Date "1972.??.??"]
[Round "1"]
[White "Boris Spassky"]
[Black "Bobby Fischer"]
[Result "1-0"]
[WhiteElo "2660"]
[BlackElo "2785"]
[ECO "E56"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Bb4 5. e3 O-O 6. Bd3 c5 7. O-O Nc6 8. a3 Ba5 9. Ne2 dxc4 10. Bxc4 Bb6 11. dxc5 Qxd1 12. Rxd1 Bxc5 13. b4 Be7 14. Bb2 Bd7 15. Rac1 Rfd8 16. Ned4 Nxd4 17. Nxd4 Ba4 18. Bb3 Bxb3 19. Nxb3 Rxd1+ 20. Rxd1 Rc8 21. Kf1 Kf8 22. Ke2 Ne4 23. Rc1 Rxc1 24. Bxc1 f6 25. Na5 Nd6 26. Kd3 Bd8 27. Nc4 Bc7 28. Nxd6 Bxd6 29. b5 Bxh2 30. g3 h5 31. Ke2 h4 32. Kf3 Ke7 33. Kg2 hxg3 34. fxg3 Bxg3 35. Kxg3 Kd6 36. a4 Kd5 37. Ba3 Ke4 38. Bc5 a6 39. b6 f5 40. Kh4 f4 41. exf4 Kxf4 42. Kh5 Kf5 43. Be3 Ke4 44. Bf2 Kf5 45. Bh4 e5 46. Bg5 e4 47. Be3 Kf6 48. Kg4 Ke5 49. Kg5 Kd5 50. Kf5 a5 51. Bf2 g5 52. Kxg5 Kc4 53. Kf5 Kb4 54. Kxe4 Kxa4 55. Kd5 Kb5 56. Kd6 1-0`
  },
  {
    id: 'spassky-fischer-1972-2',
    rank: 96,
    title: 'Fischer Strikes Back',
    event: 'World Championship 28th',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Fischer\'s brilliant victory over Spassky in Game 5, featuring powerful positional play.',
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
    id: 'fischer-spassky-1972',
    rank: 97,
    title: 'Fischer\'s Masterpiece',
    event: 'World Championship 28th',
    year: 1972,
    white: 'Bobby Fischer',
    black: 'Boris Spassky',
    result: '1-0',
    significance: 'Game 6 of the Match of the Century, considered by many as the greatest game ever played.',
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
    id: 'spassky-fischer-1972-3',
    rank: 98,
    title: 'vs. Spassky, World Championship 28th 1972',
    event: 'World Championship 28th',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    result: '1-0',
    significance: 'World Championship 28th, Reykjavik, round 11, 1972. Fischer loses with Black in 31 moves. Opening: Sicilian Najdorf: Poisoned Pawn.',
    pgn: `[Event "World Championship 28th"]
[Site "Reykjavik"]
[Date "1972.??.??"]
[Round "11"]
[White "Boris Spassky"]
[Black "Bobby Fischer"]
[Result "1-0"]
[WhiteElo "2660"]
[BlackElo "2785"]
[ECO "B97"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2 9. Nb3 Qa3 10. Bxf6 gxf6 11. Be2 h5 12. O-O Nc6 13. Kh1 Bd7 14. Nb1 Qb4 15. Qe3 d5 16. exd5 Ne7 17. c4 Nf5 18. Qd3 h4 19. Bg4 Nd6 20. N1d2 f5 21. a3 Qb6 22. c5 Qb5 23. Qc3 fxg4 24. a4 h3 25. axb5 hxg2+ 26. Kxg2 Rh3 27. Qf6 Nf5 28. c6 Bc8 29. dxe6 fxe6 30. Rfe1 Be7 31. Rxe6 1-0`
  },
  {
    id: 'spassky-fischer-1972-4',
    rank: 99,
    title: 'vs. Spassky, World Championship 28th 1972',
    event: 'World Championship 28th',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'World Championship 28th, Reykjavik, round 13, 1972. Fischer wins with Black in 74 moves. Opening: Alekhine\'s Defense: Modern Variation.',
    pgn: `[Event "World Championship 28th"]
[Site "Reykjavik"]
[Date "1972.??.??"]
[Round "13"]
[White "Boris Spassky"]
[Black "Bobby Fischer"]
[Result "0-1"]
[WhiteElo "2660"]
[BlackElo "2785"]
[ECO "B04"]

1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 g6 5. Bc4 Nb6 6. Bb3 Bg7 7. Nbd2 O-O 8. h3 a5 9. a4 dxe5 10. dxe5 Na6 11. O-O Nc5 12. Qe2 Qe8 13. Ne4 Nbxa4 14. Bxa4 Nxa4 15. Re1 Nb6 16. Bd2 a4 17. Bg5 h6 18. Bh4 Bf5 19. g4 Be6 20. Nd4 Bc4 21. Qd2 Qd7 22. Rad1 Rfe8 23. f4 Bd5 24. Nc5 Qc8 25. Qc3 e6 26. Kh2 Nd7 27. Nd3 c5 28. Nb5 Qc6 29. Nd6 Qxd6 30. exd6 Bxc3 31. bxc3 f6 32. g5 hxg5 33. fxg5 f5 34. Bg3 Kf7 35. Ne5+ Nxe5 36. Bxe5 b5 37. Rf1 Rh8 38. Bf6 a3 39. Rf4 a2 40. c4 Bxc4 41. d7 Bd5 42. Kg3 Ra3+ 43. c3 Rha8 44. Rh4 e5 45. Rh7+ Ke6 46. Re7+ Kd6 47. Rxe5 Rxc3+ 48. Kf2 Rc2+ 49. Ke1 Kxd7 50. Rexd5+ Kc6 51. Rd6+ Kb7 52. Rd7+ Ka6 53. R7d2 Rxd2 54. Kxd2 b4 55. h4 Kb5 56. h5 c4 57. Ra1 gxh5 58. g6 h4 59. g7 h3 60. Be7 Rg8 61. Bf8 h2 62. Kc2 Kc6 63. Rd1 b3+ 64. Kc3 h1=Q 65. Rxh1 Kd5 66. Kb2 f4 67. Rd1+ Ke4 68. Rc1 Kd3 69. Rd1+ Ke2 70. Rc1 f3 71. Bc5 Rxg7 72. Rxc4 Rd7 73. Re4+ Kf1 74. Bd4 f2 0-1`
  },
  {
    id: 'fischer-spassky-1992',
    rank: 100,
    title: 'vs. Spassky, St Stefan/Belgrade m 1992',
    event: 'St Stefan/Belgrade m',
    year: 1992,
    white: 'Bobby Fischer',
    black: 'Boris Spassky',
    result: '1-0',
    significance: 'St Stefan/Belgrade m, round 1, 1992. Fischer wins with White in 50 moves. Opening: Ruy Lopez: Closed Defense.',
    pgn: `[Event "St Stefan/Belgrade m"]
[Site "Belgrade"]
[Date "1992.??.??"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Boris Spassky"]
[Result "1-0"]
[WhiteElo "2785"]
[BlackElo "2560"]
[ECO "C95"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. Bg5 h6 16. Bd2 Bg7 17. a4 c5 18. d5 c4 19. b4 Nh7 20. Be3 h5 21. Qd2 Rf8 22. Ra3 Ndf6 23. Rea1 Qd7 24. R1a2 Rfc8 25. Qc1 Bf8 26. Qa1 Qe8 27. Nf1 Be7 28. N1d2 Kg7 29. Nb1 Nxe4 30. Bxe4 f5 31. Bc2 Bxd5 32. axb5 axb5 33. Ra7 Kf6 34. Nbd2 Rxa7 35. Rxa7 Ra8 36. g4 hxg4 37. hxg4 Rxa7 38. Qxa7 f4 39. Bxf4 exf4 40. Nh4 Bf7 41. Qd4+ Ke6 42. Nf5 Bf8 43. Qxf4 Kd7 44. Nd4 Qe1+ 45. Kg2 Bd5+ 46. Be4 Bxe4+ 47. Nxe4 Be7 48. Nxb5 Nf8 49. Nbxd6 Ne6 50. Qe5 1-0`
  }
];

export default fischerTop100;
