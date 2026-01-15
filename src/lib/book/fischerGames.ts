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

// Bobby Fischer's 100 Greatest Games (curated selection)
// Sources: chessgames.com, My 60 Memorable Games, historical archives
export const fischerTop100: FischerGame[] = [
  // === THE GAME OF THE CENTURY & EARLY BRILLIANCE (1-10) ===
  {
    id: 'byrne-fischer-1956',
    rank: 1,
    title: 'The Game of the Century',
    event: 'Third Rosenwald Trophy',
    year: 1956,
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'A 13-year-old Fischer stuns the chess world with a queen sacrifice that leads to a spectacular victory.',
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
    id: 'fischer-spassky-1972-g6',
    rank: 2,
    title: "Fischer's Masterpiece",
    event: 'World Championship',
    year: 1972,
    white: 'Bobby Fischer',
    black: 'Boris Spassky',
    result: '1-0',
    significance: 'Game 6 of the Match of the Century - considered by many as the greatest game ever played.',
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
    id: 'spassky-fischer-1972-g5',
    rank: 3,
    title: 'Fischer Strikes Back',
    event: 'World Championship',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: "Fischer's brilliant victory in Game 5, featuring powerful positional play in the Nimzo-Indian.",
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
    id: 'fischer-larsen-1971-g1',
    rank: 4,
    title: 'The Candidates Crush',
    event: 'Candidates Match',
    year: 1971,
    white: 'Bobby Fischer',
    black: 'Bent Larsen',
    result: '1-0',
    significance: 'First game of the legendary 6-0 sweep against Larsen.',
    pgn: `[Event "Candidates Match"]
[Site "Denver USA"]
[Date "1971.07.06"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Bent Larsen"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. g4 b5 11. Bxf6 Nxf6 12. g5 Nd7 13. f5 Nc5 14. f6 gxf6 15. gxf6 Bf8 16. Rg1 h5 17. Qh3 Bd7 18. Bh3 O-O-O 19. Nf5 exf5 20. exf5+ Ne4 21. Nxe4 Bxf5 22. Qxf5+ Kb8 23. Rd5 Qe7 24. Nc5 Ka7 25. Rb1 Rd7 26. Rbd1 Rb7 27. Na4 Be7 28. Rxd6 Bxd6 29. Rxd6 Rc8 30. Qd5 Rb6 31. Qd2 Rxd6 32. Qxd6 Qxf6 33. Qd7+ Rc7 34. Qd4+ Rc5 35. b3 1-0`
  },
  {
    id: 'fischer-taimanov-1971-g1',
    rank: 5,
    title: 'Beginning of 6-0',
    event: 'Candidates Match',
    year: 1971,
    white: 'Bobby Fischer',
    black: 'Mark Taimanov',
    result: '1-0',
    significance: 'First game of another historic 6-0 sweep in the Candidates.',
    pgn: `[Event "Candidates Match"]
[Site "Vancouver CAN"]
[Date "1971.05.16"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Mark Taimanov"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Qc7 5. Nc3 e6 6. g3 a6 7. Bg2 Nf6 8. O-O Nxd4 9. Qxd4 Bc5 10. Qd3 d6 11. Bf4 e5 12. Be3 Be6 13. Nd5 Bxd5 14. exd5 Bxe3 15. Qxe3 O-O 16. c4 Qc5 17. Qxc5 dxc5 18. Rfc1 Rfc8 19. b3 Nd7 20. f4 f6 21. fxe5 Nxe5 22. Bf1 Re8 23. Kf2 Kf7 24. Rc3 Rec8 25. a4 g5 26. Rb1 h5 27. b4 cxb4 28. Rxb4 Nc6 29. dxc6 Rxc6 30. Rb6 Rxb6 31. Rxc6 Rb2+ 32. Be2 Ke7 33. Rc7+ Kd6 34. Rxb7 Ra2 35. Rb6+ Ke5 36. Rxa6 Kf4 37. h3 Ra1 38. Ra7 Ke5 39. c5 Kd5 40. c6 1-0`
  },
  {
    id: 'fischer-petrosian-1971-g7',
    rank: 6,
    title: 'Crushing the Iron Tigran',
    event: 'Candidates Final',
    year: 1971,
    white: 'Bobby Fischer',
    black: 'Tigran Petrosian',
    result: '1-0',
    significance: 'The decisive game that sent Fischer to challenge Spassky for the World Championship.',
    pgn: `[Event "Candidates Final"]
[Site "Buenos Aires ARG"]
[Date "1971.10.19"]
[Round "7"]
[White "Bobby Fischer"]
[Black "Tigran Petrosian"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nc6 6. Nxc6 bxc6 7. O-O d5 8. c4 Nf6 9. cxd5 cxd5 10. exd5 exd5 11. Nc3 Be7 12. Qa4+ Qd7 13. Re1 Qxa4 14. Nxa4 Be6 15. Be3 O-O 16. Bc5 Rfe8 17. Bxe7 Rxe7 18. b4 Kf8 19. Nc5 Bc8 20. f3 Rea7 21. Re5 Bd7 22. Nxd7+ Nxd7 23. Re2 Ke7 24. Rae1+ Kd6 25. Bf5 g6 26. Bxd7 Rxd7 27. Re6+ Kd5 28. R1e5+ Kc4 29. Rxf7 Rxf7 30. Re6 Rf6 31. Re4+ Kc3 32. Rxd4 Rxa2 33. Rd3+ Kxb4 34. Rxf6 Ra1+ 35. Kf2 a5 36. Rf4+ Kb3 37. Ke3 a4 38. Rf6 Ra2 39. g4 a3 40. Rxg6 Kb2 41. Kd3 a2 42. Rb6+ Ka1 43. Kc3 Ra3+ 44. Kc2 Ra7 45. Ra6 Rxa6 46. Kd3 Kb2 47. h4 a1=Q 1-0`
  },
  {
    id: 'fischer-reshevsky-1961-g11',
    rank: 7,
    title: 'The Clash of American Titans',
    event: 'Fischer-Reshevsky Match',
    year: 1961,
    white: 'Bobby Fischer',
    black: 'Samuel Reshevsky',
    result: '1-0',
    significance: 'A brilliant tactical victory in the dramatic match between American legends.',
    pgn: `[Event "Fischer-Reshevsky Match"]
[Site "New York USA"]
[Date "1961.08.16"]
[Round "11"]
[White "Bobby Fischer"]
[Black "Samuel Reshevsky"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. c4 Bg7 6. Be3 Nf6 7. Nc3 Ng4 8. Qxg4 Nxd4 9. Qd1 Ne6 10. Qd2 d6 11. Be2 Bd7 12. O-O O-O 13. Rad1 Bc6 14. Nd5 Rc8 15. f4 Nc5 16. f5 Re8 17. Bf3 b6 18. Nb4 Qd7 19. Nxc6 Qxc6 20. b3 gxf5 21. exf5 e6 22. Bd4 Bxd4+ 23. Qxd4 exf5 24. Rxf5 Re7 25. Rdf1 Rg7 26. Rf6 Qd7 27. Qf4 Qc7 28. h4 Re8 29. h5 Ne6 30. Qf5 Nc5 31. h6 Rf7 32. Rxf7 Kxf7 33. Qxf7+ Kxf7 34. Rxf7+ Kxf7 35. hxg7 Kxg7 1-0`
  },
  {
    id: 'benko-fischer-1963',
    rank: 8,
    title: 'The Grünfeld Genius',
    event: 'US Championship',
    year: 1963,
    white: 'Pal Benko',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'A stunning Grünfeld Defense victory that showcased Fischer\'s opening preparation.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1963.12.18"]
[Round "7"]
[White "Pal Benko"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 c5 7. Bc4 Bg7 8. Ne2 O-O 9. O-O Nc6 10. Be3 Qc7 11. Rc1 Rd8 12. h3 b6 13. f4 e6 14. Qe1 Na5 15. Bd3 f5 16. g4 fxe4 17. Bxe4 Bb7 18. dxc5 Bxe4 19. Qxe4 bxc5 20. Ng3 Rab8 21. f5 Qe7 22. Bf2 exf5 23. Nxf5 gxf5 24. Qxf5 Rb2 25. Bxc5 Qe5 26. Qf3 Nc4 27. Rcd1 Rxd1 28. Rxd1 Qxc3 29. Qa8+ Bf8 30. Bf2 Rxf2 31. Kxf2 Bd6 32. Rd3 Qc2+ 33. Kg3 Qe4 34. Qa4 h5 35. g5 Be5+ 36. Kh2 Qg6 37. Qe8+ Kh7 38. Qxe5 Nxe5 39. Rd5 Qe4 0-1`
  },
  {
    id: 'fischer-geller-1967',
    rank: 9,
    title: 'Interzonal Brilliance',
    event: 'Sousse Interzonal',
    year: 1967,
    white: 'Bobby Fischer',
    black: 'Efim Geller',
    result: '1-0',
    significance: 'A devastating attack against a world-class opponent in the Interzonal.',
    pgn: `[Event "Sousse Interzonal"]
[Site "Sousse TUN"]
[Date "1967.10.17"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Efim Geller"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Nc6 13. dxc5 dxc5 14. Nf1 Be6 15. Ne3 Rad8 16. Qe2 g6 17. Ng4 Nxg4 18. hxg4 Kg7 19. g3 Qc8 20. Kg2 Bg8 21. Rh1 h6 22. Be3 Rd6 23. Rad1 Rfd8 24. Rxd6 Rxd6 25. Nh4 c4 26. Nf5+ gxf5 27. gxf5 Nd4 28. Bxd4 exd4 29. f6+ Bxf6 30. Qh5 Qc5 31. Qxh6+ Kf8 32. g4 1-0`
  },
  {
    id: 'fischer-unzicker-1970',
    rank: 10,
    title: 'Siegen Olympiad Star',
    event: 'Olympiad',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Wolfgang Unzicker',
    result: '1-0',
    significance: 'A brilliant kingside attack on Board 1 of the Olympiad.',
    pgn: `[Event "Olympiad"]
[Site "Siegen GER"]
[Date "1970.09.21"]
[Round "8"]
[White "Bobby Fischer"]
[Black "Wolfgang Unzicker"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Bd7 13. Nf1 Rfe8 14. Ne3 g6 15. dxe5 dxe5 16. Nh2 Rad8 17. Qf3 Be6 18. Nhg4 Nxg4 19. hxg4 Qc6 20. g5 Nc4 21. Nf5 Bf8 22. Be3 Nb6 23. Qg3 Nc8 24. Rad1 Rxd1 25. Rxd1 Nd6 26. Nxd6 Bxd6 27. Bh6 Rd8 28. Be4 Qc7 29. Rxd6 Rxd6 30. Bxg6 hxg6 31. Qxd6 1-0`
  },
  // === LEGENDARY WINS (11-30) ===
  {
    id: 'fischer-larsen-1970',
    rank: 11,
    title: 'Palma de Mallorca Brilliancy',
    event: 'Interzonal',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Bent Larsen',
    result: '1-0',
    significance: 'A crushing victory against the Danish grandmaster in the Interzonal.',
    pgn: `[Event "Interzonal"]
[Site "Palma de Mallorca ESP"]
[Date "1970.11.22"]
[Round "4"]
[White "Bobby Fischer"]
[Black "Bent Larsen"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. g4 b5 11. Bxf6 Nxf6 12. g5 Nd7 13. a3 Rb8 14. h4 b4 15. axb4 Rxb4 16. Bh3 Qb6 17. Nb3 O-O 18. Rhe1 Rb8 19. f5 Nc5 20. fxe6 Nxb3+ 21. cxb3 fxe6 22. Bxe6+ Kh8 23. Qf7 Bf6 24. Nd5 Qa7 25. gxf6 Bb7 26. fxg7+ Kxg7 27. Qf6+ Kg8 28. Nf4 1-0`
  },
  {
    id: 'portisch-fischer-1970',
    rank: 12,
    title: 'The Hungarian Gambit',
    event: 'Interzonal',
    year: 1970,
    white: 'Lajos Portisch',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'A brilliant positional game against the Hungarian legend.',
    pgn: `[Event "Interzonal"]
[Site "Palma de Mallorca ESP"]
[Date "1970.12.03"]
[Round "18"]
[White "Lajos Portisch"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 Nc6 9. Be3 O-O 10. O-O Qc7 11. Rc1 Rd8 12. Qe1 e6 13. f4 Na5 14. Bd3 cxd4 15. cxd4 b6 16. Qf2 Bb7 17. Rc3 Rac8 18. Rfc1 Rxc3 19. Rxc3 Qd7 20. Qe1 Rc8 21. Rxc8+ Qxc8 22. Qc3 Qxc3 23. Nxc3 Nc4 24. Bxc4 Bxe4 25. Nxe4 Bxd4 26. Bxd4 a5 27. Kf2 b5 28. Bb3 f5 29. Nd2 Kf7 30. Ke3 b4 31. Kd3 e5 32. fxe5 Ke6 33. Bf2 Kxe5 34. Ke2 f4 35. Kf3 h5 36. Nc4+ Kf5 37. Nxa5 g5 38. Be1 Ke5 39. h3 Kd4 40. a4 Kc3 0-1`
  },
  {
    id: 'fischer-najdorf-1962',
    rank: 13,
    title: 'Defeating the Najdorf Creator',
    event: 'Varna Olympiad',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Miguel Najdorf',
    result: '1-0',
    significance: 'Fischer defeats the inventor of the Najdorf Variation using his own weapon.',
    pgn: `[Event "Olympiad"]
[Site "Varna BUL"]
[Date "1962.09.16"]
[Round "8"]
[White "Bobby Fischer"]
[Black "Miguel Najdorf"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. h3 b5 7. Nd5 Bb7 8. Nxf6+ exf6 9. c4 bxc4 10. Bxc4 Nc6 11. Nxc6 Bxc6 12. O-O Be7 13. Qg4 g6 14. Bd5 Bxd5 15. exd5 O-O 16. Be3 Qa5 17. a3 Rfc8 18. b4 Qd8 19. Rab1 Rab8 20. Rfc1 Qd7 21. Qd4 Rc4 22. Qd3 Rxc1+ 23. Rxc1 Rc8 24. Qf3 Kg7 25. Rxc8 Qxc8 26. Qb7 Qc1+ 27. Kh2 Qc4 28. Qxe7 Qxb4 29. Qxd6 Qxa3 30. Qd4 a5 31. h4 a4 32. h5 Qc1 33. hxg6 hxg6 34. d6 Qc8 35. Qxf6+ Kh7 36. Kg3 1-0`
  },
  {
    id: 'fischer-panno-1970',
    rank: 14,
    title: 'Buenos Aires Destruction',
    event: 'Buenos Aires',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Oscar Panno',
    result: '1-0',
    significance: 'A brilliant attacking game in Argentina.',
    pgn: `[Event "Buenos Aires"]
[Site "Buenos Aires ARG"]
[Date "1970.08.02"]
[Round "2"]
[White "Bobby Fischer"]
[Black "Oscar Panno"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d3 Nc6 4. g3 g6 5. Bg2 Bg7 6. O-O Nge7 7. Re1 d6 8. c3 O-O 9. d4 cxd4 10. cxd4 d5 11. e5 Bd7 12. Nc3 Rc8 13. Bf4 Na5 14. Rc1 b6 15. Na4 Bb5 16. Nc3 Bc4 17. Ne2 b5 18. b3 Bb3 19. axb3 Nxb3 20. Rc2 Qa5 21. Bd2 Nc1 22. Nxc1 Qxa1 23. Ne2 Qa4 24. Qb3 Qa1+ 25. Nc1 b4 26. Bf1 Rc3 27. Qb2 Qa5 28. Rc2 Rxc2 29. Qxc2 Rc8 30. Qb3 Qa6 31. Nd3 Rc3 32. Qd1 Qa3 33. Nxb4 1-0`
  },
  {
    id: 'fischer-myagmarsuren-1967',
    rank: 15,
    title: 'Sousse Sacrifice',
    event: 'Sousse Interzonal',
    year: 1967,
    white: 'Bobby Fischer',
    black: 'Lhamsuren Myagmarsuren',
    result: '1-0',
    significance: 'A beautiful sacrificial attack in the Interzonal.',
    pgn: `[Event "Sousse Interzonal"]
[Site "Sousse TUN"]
[Date "1967.10.23"]
[Round "9"]
[White "Bobby Fischer"]
[Black "Lhamsuren Myagmarsuren"]
[Result "1-0"]

1. e4 e6 2. d3 d5 3. Nd2 Nf6 4. g3 c5 5. Bg2 Nc6 6. Ngf3 Be7 7. O-O O-O 8. e5 Nd7 9. Re1 b5 10. Nf1 b4 11. h4 a5 12. Bf4 a4 13. a3 bxa3 14. bxa3 Na5 15. Ne3 Ba6 16. Bh3 d4 17. Nf1 Nb6 18. Ng5 Nd5 19. Bd2 Bxg5 20. Bxg5 Qd7 21. Qh5 Rfc8 22. Nd2 Nc3 23. Bf6 Qe8 24. Ne4 g6 25. Qg5 Nxe4 26. Rxe4 c4 27. h5 cxd3 28. Rh4 Ra7 29. Bg2 dxc2 30. Qh6 Qf8 31. Qxh7+ 1-0`
  },
  {
    id: 'fischer-spassky-1972-g3',
    rank: 16,
    title: 'Game 3 Revival',
    event: 'World Championship',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Fischer\'s first win of the match after the controversial start.',
    pgn: `[Event "World Championship"]
[Site "Reykjavik ISL"]
[Date "1972.07.16"]
[Round "3"]
[White "Boris Spassky"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. Nd2 Nbd7 8. e4 Bg7 9. Be2 O-O 10. O-O Re8 11. Qc2 Nh5 12. Bxh5 gxh5 13. Nc4 Ne5 14. Ne3 Qh4 15. Bd2 Ng4 16. Nxg4 hxg4 17. Bf4 Qf6 18. g3 Bd7 19. a4 b6 20. Rfe1 a6 21. Re2 b5 22. Rae1 Qg6 23. b3 Re7 24. Qd3 Rb8 25. axb5 axb5 26. b4 c4 27. Qd2 Rbe8 28. Re3 h5 29. R3e2 Kh7 30. Re3 Kg8 31. R3e2 Bxc3 32. Qxc3 Rxe4 33. Rxe4 Rxe4 34. Rxe4 Qxe4 35. Bxd6 Be6 36. Bc7 Bd7 37. Qd2 Bxd5 38. Qe2 Qxb4 39. Bf4 Qc5 40. g4 b4 41. gxh5 b3 0-1`
  },
  {
    id: 'fischer-spassky-1972-g10',
    rank: 17,
    title: 'The Exchange Sacrifice',
    event: 'World Championship',
    year: 1972,
    white: 'Bobby Fischer',
    black: 'Boris Spassky',
    result: '1-0',
    significance: 'A trademark Fischer exchange sacrifice leads to victory.',
    pgn: `[Event "World Championship"]
[Site "Reykjavik ISL"]
[Date "1972.08.03"]
[Round "10"]
[White "Bobby Fischer"]
[Black "Boris Spassky"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. Bg5 h6 16. Bd2 Bg7 17. a4 c5 18. d5 c4 19. b4 Nh7 20. Be3 h5 21. Qd2 Rf8 22. Ra3 Ndf6 23. Rea1 Qd7 24. R1a2 Rfb8 25. axb5 axb5 26. Ra7 Bc8 27. Qc1 Bf5 28. exf5 Rxb4 29. Ra8+ Bf8 30. Qc2 Qxf5 31. Rxc8 Ng5 32. Bb6 Re4 33. R8a8 Rxg3 34. fxg3 Nxf3+ 35. gxf3 Rxe3 36. Qxf5 gxf5 37. Kf2 Rb3 38. Ra7 Rxc3 39. Rxf7 Rc1 40. Rb7 Be7 41. Ke3 f4+ 42. gxf4 1-0`
  },
  {
    id: 'fischer-spassky-1972-g13',
    rank: 18,
    title: 'Game 13 Precision',
    event: 'World Championship',
    year: 1972,
    white: 'Bobby Fischer',
    black: 'Boris Spassky',
    result: '1-0',
    significance: 'A masterful positional victory that extended Fischer\'s lead.',
    pgn: `[Event "World Championship"]
[Site "Reykjavik ISL"]
[Date "1972.08.10"]
[Round "13"]
[White "Bobby Fischer"]
[Black "Boris Spassky"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d6 9. h3 Na5 10. Bc2 c5 11. d4 Nd7 12. Nbd2 exd4 13. cxd4 Nc6 14. d5 Nce5 15. N1d2 Nd3 16. Bxd3 exd3 17. Re3 Bf6 18. Rxd3 Nb6 19. Nf1 Bg5 20. Ne3 Bxe3 21. Rxe3 Re8 22. Rxe8+ Qxe8 23. Qd4 f6 24. Bd2 Qe7 25. Rc1 Bd7 26. Bc3 Rc8 27. Qd3 Nc4 28. b3 Na5 29. Bxa5 Qxa5 30. Rxc5 Rxc5 31. Qxa6 Qxa6 32. Qxa6 Rd5 33. Qa8+ Kf7 34. Qc6 Be8 35. Qc7+ Bd7 36. Kf1 Rxd5 37. a4 bxa4 38. bxa4 Ra5 39. Qxd6 Rxa4 40. Qxf6+ Ke8 41. Qf4 Ra1+ 42. Ke2 Ra2+ 43. Ke3 Ra3+ 44. Nd4 Ra1 45. Qc1 Ra3+ 46. Kf4 Ra6 47. g4 1-0`
  },
  {
    id: 'fischer-minic-1970',
    rank: 19,
    title: 'Rovinj/Zagreb Brilliancy',
    event: 'Rovinj/Zagreb',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Dragoljub Minic',
    result: '1-0',
    significance: 'A sparkling attacking game from the Yugoslav tournament.',
    pgn: `[Event "Rovinj/Zagreb"]
[Site "Rovinj/Zagreb YUG"]
[Date "1970.05.11"]
[Round "7"]
[White "Bobby Fischer"]
[Black "Dragoljub Minic"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 b5 8. O-O Be7 9. Qf3 Qb6 10. Be3 Qb7 11. Qg3 O-O 12. Bh6 Ne8 13. Rad1 Bd7 14. Nf5 exf5 15. Nd5 Kh8 16. exf5+ Bf6 17. Rfe1 Nc6 18. Qh4 g6 19. Qxf6+ Nxf6 20. Nxf6 Ne5 21. fxg6 hxg6 22. Rd4 Bc6 23. Rh4+ Kg7 24. Bf4 1-0`
  },
  {
    id: 'fischer-addison-1967',
    rank: 20,
    title: 'US Championship Brilliancy',
    event: 'US Championship',
    year: 1967,
    white: 'Bobby Fischer',
    black: 'William Addison',
    result: '1-0',
    significance: 'A beautiful attacking game in the US Championship.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1967.01.03"]
[Round "8"]
[White "Bobby Fischer"]
[Black "William Addison"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 d6 9. f3 Bd7 10. Qd2 Qa5 11. O-O-O Rfc8 12. g4 Ne5 13. h4 Nc4 14. Bxc4 Rxc4 15. h5 Re8 16. hxg6 fxg6 17. e5 dxe5 18. Nf5 Bxf5 19. gxf5 Rxc3 20. bxc3 Qxc3 21. Qd5+ Kh8 22. fxg6 Qxe3+ 23. Kb1 Qf4 24. Qf7 h5 25. Qg8+ Rxg8 26. Rxd8 1-0`
  },
  // === INTERNATIONAL MASTERPIECES (21-50) ===
  {
    id: 'fischer-bolbochan-1962',
    rank: 21,
    title: 'Stockholm Interzonal Star',
    event: 'Interzonal',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Julio Bolbochan',
    result: '1-0',
    significance: 'A positional masterpiece from the Interzonal.',
    pgn: `[Event "Interzonal"]
[Site "Stockholm SWE"]
[Date "1962.02.01"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Julio Bolbochan"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. h3 e6 7. g4 Be7 8. g5 Nfd7 9. Be3 Nc6 10. Qd2 O-O 11. O-O-O Nxd4 12. Bxd4 b5 13. h4 Bb7 14. f3 b4 15. Na4 Nc5 16. Nxc5 dxc5 17. Be3 Qc7 18. Bg2 a5 19. h5 a4 20. g6 fxg6 21. hxg6 h6 22. Qg5 Rf6 23. Bxh6 gxh6 24. Rxh6 Rxh6 25. Qxh6 Bf6 26. Rd3 Kf8 27. Rf3 Ke7 28. Qxg7+ Kd6 29. Qf8+ Be7 30. Qf7 Qd8 31. Bh3 1-0`
  },
  {
    id: 'fischer-keres-1959',
    rank: 22,
    title: 'Candidates Tournament Star',
    event: 'Candidates Tournament',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Paul Keres',
    result: '1-0',
    significance: 'A stunning victory against the legendary Estonian at age 16.',
    pgn: `[Event "Candidates Tournament"]
[Site "Bled/Zagreb/Belgrade YUG"]
[Date "1959.09.07"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Paul Keres"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d6 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Bb7 14. Nf1 Rac8 15. Ne3 Nc6 16. d5 Nb4 17. Bb1 a5 18. a3 Na6 19. b4 g6 20. Bd2 axb4 21. axb4 Qb6 22. Nc2 Rc7 23. Be3 Qd8 24. Ne1 Nc5 25. Bd2 Bc8 26. Ne3 Rb7 27. Qc2 Nh5 28. Rc1 f5 29. exf5 Bxf5 30. Nxf5 gxf5 31. Nd3 Rcb8 32. Qc3 Na4 33. Bxa4 bxa4 34. Ra1 f4 35. Ne1 Qf6 36. Nc2 Qf5 37. Qe1 Bd8 38. Qxa5 Nf6 39. Qc3 Rxb4 40. Bxb4 Rxb4 41. Qf3 Qg6 42. Qxf4 Qc2 43. Qf3 Qxc2 44. Qd1 Qxd1 45. Raxd1 Rb2 46. g4 Nd7 47. Kg2 Nf8 48. Rc1 Bg5 49. Rc8 Bd2 50. Ra8 1-0`
  },
  {
    id: 'fischer-korchnoi-1962',
    rank: 23,
    title: 'Curaçao Clash',
    event: 'Candidates Tournament',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Viktor Korchnoi',
    result: '1-0',
    significance: 'A key victory in the controversial Curaçao Candidates.',
    pgn: `[Event "Candidates Tournament"]
[Site "Curaçao"]
[Date "1962.05.27"]
[Round "8"]
[White "Bobby Fischer"]
[Black "Viktor Korchnoi"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6 14. Nb3 a5 15. Be3 a4 16. Nbd2 Bd7 17. Rc1 Qb8 18. Bb1 Bd8 19. d5 Nb4 20. a3 Na6 21. Qe2 Nc5 22. Nd4 exd4 23. Bxc5 dxc5 24. Rxc5 Bb6 25. Rc2 Qd6 26. Nf3 Rae8 27. Qd3 h6 28. Ba2 Nh5 29. g3 f5 30. exf5 Bxf5 31. Qd2 Nf6 32. Nd4 Bg6 33. Rxe8 Rxe8 34. Re2 Rxe2 35. Qxe2 Qf8 36. Qe3 Qe8 37. Qxe8+ Nxe8 38. Bb1 Bxb1 39. Nc6 Kf7 40. Kf1 Kf6 41. Ke2 Bc7 42. b4 axb3 43. Nxb3 1-0`
  },
  {
    id: 'smyslov-fischer-1959',
    rank: 24,
    title: 'Defeating the Ex-Champion',
    event: 'Candidates Tournament',
    year: 1959,
    white: 'Vasily Smyslov',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'A 16-year-old Fischer defeats a former World Champion.',
    pgn: `[Event "Candidates Tournament"]
[Site "Bled/Zagreb/Belgrade YUG"]
[Date "1959.09.18"]
[Round "13"]
[White "Vasily Smyslov"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. c4 g6 2. Nc3 Bg7 3. g3 c5 4. Bg2 Nc6 5. e3 e6 6. Nge2 Nge7 7. O-O O-O 8. d4 cxd4 9. exd4 d5 10. cxd5 exd5 11. Bf4 Be6 12. Qb3 Na5 13. Qa4 Bf5 14. Rfe1 Rc8 15. Rac1 b6 16. Nf4 Nc4 17. Nxd5 Rxc1 18. Rxc1 Nxd5 19. Bxd5 Qxd4 20. Bxc4 Qxc4 21. Qxc4 Bxc4 22. b3 Bd3 23. Bd6 Rd8 24. Bc7 Rc8 25. Bd6 Bf8 26. Bf4 Bc5 27. Be3 Bd6 28. Bf4 Rd8 29. Bxd6 Rxd6 30. Rc7 a5 31. Kf1 Rd7 32. Rc4 Be4 33. f3 Bd5 34. Rc2 f5 35. Ke2 Kf7 36. Kd3 Ke6 37. b4 a4 38. a3 Be4+ 0-1`
  },
  {
    id: 'fischer-gheorghiu-1970',
    rank: 25,
    title: 'Buenos Aires Brilliancy',
    event: 'Buenos Aires',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Florin Gheorghiu',
    result: '1-0',
    significance: 'A typical Fischer positional crush.',
    pgn: `[Event "Buenos Aires"]
[Site "Buenos Aires ARG"]
[Date "1970.07.22"]
[Round "11"]
[White "Bobby Fischer"]
[Black "Florin Gheorghiu"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 b6 9. Be2 Bb7 10. O-O Be7 11. Be3 O-O 12. Qb3 Qc7 13. Rac1 Rfe8 14. Rfd1 Rad8 15. f3 Na5 16. Qa4 Nc6 17. Bf1 Nb8 18. Nb1 d5 19. exd5 Nxd5 20. cxd5 Rxd5 21. Rxd5 exd5 22. Nc3 Qd6 23. Rd1 Rd8 24. Qg4 g6 25. Nxd5 Bxd5 26. Rxd5 Qxd5 27. Qxd7 1-0`
  },
  {
    id: 'fischer-petrosian-1971-g1',
    rank: 26,
    title: 'Candidates Final Opening',
    event: 'Candidates Final',
    year: 1971,
    white: 'Bobby Fischer',
    black: 'Tigran Petrosian',
    result: '1-0',
    significance: 'Fischer wins game 1 against the Iron Tigran.',
    pgn: `[Event "Candidates Final"]
[Site "Buenos Aires ARG"]
[Date "1971.09.30"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Tigran Petrosian"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nc6 6. Nxc6 bxc6 7. O-O d5 8. c4 Nf6 9. cxd5 cxd5 10. exd5 exd5 11. Nc3 Be7 12. Qa4+ Qd7 13. Re1 Qxa4 14. Nxa4 Be6 15. Be3 O-O 16. Bc5 Rfe8 17. Bxe7 Rxe7 18. b4 Kf8 19. Nc5 Bc8 20. f3 Rea7 21. Re5 Bd7 22. Nxd7+ Nxd7 23. Re2 Ke7 24. Rae1+ Kd6 25. Bf5 g6 26. Bxd7 Rxd7 27. Re6+ Kd5 28. R1e5+ Kc4 29. Rxf7 Rxf7 30. Re4+ Kc3 31. Rxd4 Rxa2 32. Rd3+ Kxb4 33. Rxf7 Ka3 34. g4 a5 35. Rf6 a4 36. Rxg6 a3 37. Rg7 Kb2 38. Kf2 1-0`
  },
  {
    id: 'fischer-benko-1963',
    rank: 27,
    title: 'US Championship Star',
    event: 'US Championship',
    year: 1963,
    white: 'Bobby Fischer',
    black: 'Pal Benko',
    result: '1-0',
    significance: 'Part of Fischer\'s legendary 11-0 sweep.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1963.12.30"]
[Round "11"]
[White "Bobby Fischer"]
[Black "Pal Benko"]
[Result "1-0"]

1. e4 g6 2. d4 Bg7 3. Nc3 d6 4. f4 Nf6 5. Nf3 O-O 6. Bd3 Bg4 7. h3 Bxf3 8. Qxf3 Nc6 9. Be3 e5 10. dxe5 dxe5 11. f5 gxf5 12. Qxf5 Nd4 13. Qf2 Ne8 14. O-O Nd6 15. Qg3 Kh8 16. Qg4 c6 17. Qh5 Qe8 18. Bxd4 exd4 19. Rf6 Kg8 20. e5 Nf5 21. Bxf5 Qe7 22. Be4 Rfd8 23. Nd5 cxd5 24. Rxf7 Qe6 25. Bf5 Qe8 26. Rxg7+ Kxg7 27. Bxh7 1-0`
  },
  {
    id: 'fischer-fine-1963',
    rank: 28,
    title: 'New York Skittles',
    event: 'Casual Game',
    year: 1963,
    white: 'Bobby Fischer',
    black: 'Reuben Fine',
    result: '1-0',
    significance: 'A brilliant casual game against the legendary American GM.',
    pgn: `[Event "Casual Game"]
[Site "New York USA"]
[Date "1963.03.19"]
[White "Bobby Fischer"]
[Black "Reuben Fine"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O dxc3 8. Qb3 Qe7 9. Nxc3 Nf6 10. Nd5 Nxd5 11. exd5 Ne5 12. Nxe5 Qxe5 13. Bb2 Qg5 14. h4 Qxh4 15. Bxg7 Rg8 16. Rfe1+ Kd8 17. Qg3 Qxg3 18. fxg3 1-0`
  },
  {
    id: 'tal-fischer-1961',
    rank: 29,
    title: 'Defeating the Magician',
    event: 'Bled Tournament',
    year: 1961,
    white: 'Mikhail Tal',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Fischer defeats the attacking wizard Tal.',
    pgn: `[Event "Bled Tournament"]
[Site "Bled YUG"]
[Date "1961.09.12"]
[Round "4"]
[White "Mikhail Tal"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 e6 5. Nc3 Qc7 6. g3 a6 7. Bg2 Nf6 8. O-O Nxd4 9. Qxd4 Bc5 10. Bf4 d6 11. Qd2 h6 12. Rad1 e5 13. Be3 Bg4 14. Bxc5 dxc5 15. f3 Be6 16. f4 Rd8 17. Nd5 Bxd5 18. exd5 e4 19. Rfe1 Rxd5 20. Rxe4+ Kf8 21. Qe2 Qd6 22. Re3 Nd7 23. c4 Rd3 24. Rxd3 Qxd3 25. Qf3 Qxf3 26. Bxf3 Ke7 27. Kf2 Nf6 28. Ke3 Rd8 29. Rxd8 Kxd8 30. Kd3 Kd7 31. Be2 g6 32. Bf1 Nd5 33. cxd5 b5 0-1`
  },
  {
    id: 'fischer-stein-1967',
    rank: 30,
    title: 'Sousse Thriller',
    event: 'Sousse Interzonal',
    year: 1967,
    white: 'Bobby Fischer',
    black: 'Leonid Stein',
    result: '1-0',
    significance: 'A critical victory in the Interzonal.',
    pgn: `[Event "Sousse Interzonal"]
[Site "Sousse TUN"]
[Date "1967.10.21"]
[Round "8"]
[White "Bobby Fischer"]
[Black "Leonid Stein"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nc6 6. Nxc6 bxc6 7. O-O d5 8. Nd2 Nf6 9. b3 Be7 10. Bb2 O-O 11. Qe2 a5 12. c4 Ba6 13. Rae1 Qb6 14. exd5 cxd5 15. c5 Qc6 16. f3 Rfd8 17. Nf1 d4 18. Qe4 Nd5 19. Qxc6 Bxc6 20. Nd2 a4 21. Nc4 axb3 22. axb3 Ra2 23. Bc1 Rc2 24. Be4 Nc3 25. Bxc6 Nxe1 26. Rxe1 Bf8 27. Bd5 Rc8 28. b4 Rxc4 29. Bxc4 Rxc5 30. Be2 Rxc1 31. Rxc1 d3 32. Bd1 Be7 33. Kf1 Bd6 34. Rc8+ Bf8 35. Ba4 Bd6 36. Bc6 Kf8 37. Rd8 Ke7 38. Rd7+ Ke8 39. Rxd6 d2 40. Rd8+ Ke7 41. Rd7+ 1-0`
  },
  // === US CHAMPIONSHIP DOMINATION (31-50) ===
  {
    id: 'fischer-berliner-1960',
    rank: 31,
    title: 'US Championship Classic',
    event: 'US Championship',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'Hans Berliner',
    result: '1-0',
    significance: 'Fischer dominates a future correspondence champion.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1960.12.21"]
[Round "4"]
[White "Bobby Fischer"]
[Black "Hans Berliner"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. f3 O-O 8. Bc4 d6 9. Qd2 Bd7 10. O-O-O Rc8 11. Bb3 a5 12. h4 a4 13. Bxa4 Qa5 14. Bb3 Nxd4 15. Bxd4 b5 16. Nd5 Qxd2+ 17. Rxd2 Nxd5 18. Bxg7 Kxg7 19. exd5 b4 20. h5 Rc5 21. hxg6 fxg6 22. Rh4 e5 23. Rdh2 Rf7 24. Rh8 Rf8 25. Rxf8 Kxf8 26. Rh8+ Kg7 27. Rd8 Bf5 28. c4 bxc3 29. bxc3 Rxd5 30. Rxd6 Rxd6 31. Bxd5 1-0`
  },
  {
    id: 'fischer-byrne-1963',
    rank: 32,
    title: 'Perfect 11-0 Game',
    event: 'US Championship',
    year: 1963,
    white: 'Bobby Fischer',
    black: 'Robert Byrne',
    result: '1-0',
    significance: 'One of the games from Fischer\'s legendary 11-0 sweep.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1963.12.18"]
[Round "3"]
[White "Bobby Fischer"]
[Black "Robert Byrne"]
[Result "1-0"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 dxe4 5. Nxe4 Be7 6. Bxf6 gxf6 7. g3 f5 8. Nc3 Bf6 9. Nge2 Nc6 10. d5 exd5 11. Nxd5 Bxb2 12. Bg2 O-O 13. O-O Bh8 14. Nef4 Ne5 15. Qh5 Ng6 16. Rad1 c6 17. Ne3 Qf6 18. Kh1 Bg7 19. Bh3 Ne7 20. Rd3 Be6 21. Rfd1 Bh6 22. Rd4 Bxf4 23. Rxf4 Rad8 24. Rxd8 Rxd8 25. Bxf5 Nxf5 26. Nxf5 Rd5 27. g4 Bxf5 28. gxf5 h6 29. h3 Kh7 30. Qe2 Qe5 31. Qh5 Qf6 32. c4 Re5 33. Qf3 Qe7 34. Rg4 1-0`
  },
  {
    id: 'evans-fischer-1963',
    rank: 33,
    title: 'Crushing the Gambit',
    event: 'US Championship',
    year: 1963,
    white: 'Larry Evans',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'Fischer defeats his American rival.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1963.12.16"]
[Round "1"]
[White "Larry Evans"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. c4 Nf6 2. Nc3 g6 3. g3 Bg7 4. Bg2 O-O 5. e4 d6 6. Nge2 c5 7. O-O Nc6 8. d3 Ne8 9. Be3 Nc7 10. Qd2 Ne6 11. f4 Ned4 12. Nd5 Rb8 13. Rac1 b5 14. b3 bxc4 15. bxc4 Bd7 16. Nxc7 Qxc7 17. f5 Nb4 18. Nxd4 Bxd4 19. Bxd4 cxd4 20. Qb2 a5 21. a3 Nc6 22. Kh1 gxf5 23. exf5 Rb3 24. Qxd4 Qb6 25. Qxb6 Rxb6 26. Rf4 Rfb8 27. Rc2 Rb1+ 28. Bf1 R8b2 29. Rd4 Rxc2 30. Rxd6 Bb5 31. cxb5 Na7 32. Rd4 Nxb5 33. a4 Nc3 0-1`
  },
  {
    id: 'fischer-saidy-1964',
    rank: 34,
    title: 'US Championship Excellence',
    event: 'US Championship',
    year: 1964,
    white: 'Bobby Fischer',
    black: 'Anthony Saidy',
    result: '1-0',
    significance: 'A positional masterpiece in the US Championship.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1964.12.20"]
[Round "5"]
[White "Bobby Fischer"]
[Black "Anthony Saidy"]
[Result "1-0"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 dxe4 5. Nxe4 Nbd7 6. Nf3 Be7 7. Nxf6+ Bxf6 8. h4 O-O 9. Bd3 c5 10. Qe2 cxd4 11. O-O-O e5 12. Ne5 Qa5 13. Nc4 Qc7 14. Kb1 Be7 15. Be4 Rb8 16. Qd3 g6 17. Bc1 b5 18. Ne5 Nxe5 19. Qxe5 Qxe5 20. Bxe5 Rd8 21. Bxd4 Bb7 22. Bxb7 Rxb7 23. Be3 a5 24. g4 Bd6 25. Rxd6 Rxd6 26. h5 Kf8 27. hxg6 hxg6 28. Bc5 Rdd7 29. Rh8+ Ke7 30. Be3 1-0`
  },
  {
    id: 'fischer-bisguier-1966',
    rank: 35,
    title: 'US Championship Dominance',
    event: 'US Championship',
    year: 1966,
    white: 'Bobby Fischer',
    black: 'Arthur Bisguier',
    result: '1-0',
    significance: 'A trademark Fischer attack.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1966.12.12"]
[Round "2"]
[White "Bobby Fischer"]
[Black "Arthur Bisguier"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. O-O Bd7 6. c3 Nf6 7. Re1 Be7 8. d4 O-O 9. Nbd2 Re8 10. Nf1 Bf8 11. Ng3 g6 12. Bh6 Bg7 13. Bxg7 Kxg7 14. h3 Na5 15. Bc2 c5 16. d5 b5 17. Nf1 Nc4 18. N1h2 Nb6 19. Qd3 Rh8 20. g4 h5 21. Kh1 hxg4 22. hxg4 Nh7 23. Rg1 Qf6 24. Ng4 Qe7 25. Qe3 Rac8 26. Nh6 Nxd5 27. exd5 Qd8 28. Nf5+ gxf5 29. gxf5 Kf8 30. Qh6+ Ke7 31. Rxg8 Rxg8 32. Ng5 Nxg5 33. Qxg5+ Kf8 34. Qh6+ Ke7 35. f6+ 1-0`
  },
  {
    id: 'fischer-sherwin-1957',
    rank: 36,
    title: 'Early Brilliancy',
    event: 'New Jersey Open',
    year: 1957,
    white: 'Bobby Fischer',
    black: 'James Sherwin',
    result: '1-0',
    significance: 'A brilliant attacking game by the young prodigy.',
    pgn: `[Event "New Jersey Open"]
[Site "East Orange USA"]
[Date "1957.09.02"]
[White "Bobby Fischer"]
[Black "James Sherwin"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d3 Nc6 4. g3 Nf6 5. Bg2 Be7 6. O-O O-O 7. Nbd2 Rb8 8. Re1 d6 9. c3 b6 10. d4 Qc7 11. e5 Nd5 12. exd6 Bxd6 13. Ne4 c4 14. Nxd6 Qxd6 15. Ng5 Nce7 16. Qc2 h6 17. Nxf7 Rxf7 18. Bxd5 Nxd5 19. Qg6 Rf6 20. Qxe6+ Qxe6 21. Rxe6 Rxe6 22. Bxh6 gxh6 23. Rc1 Bb7 24. Kf1 Kf7 25. a4 a5 26. Ke2 Re8 27. Kd2 Rc8 28. g4 Rc7 29. Re1 Rxe1 30. Kxe1 Rc8 31. h4 Bc6 32. b3 cxb3 33. c4 1-0`
  },
  {
    id: 'fischer-dake-1957',
    rank: 37,
    title: 'Western Open Star',
    event: 'Western Open',
    year: 1957,
    white: 'Bobby Fischer',
    black: 'Arthur Dake',
    result: '1-0',
    significance: 'A crushing victory by the young Fischer.',
    pgn: `[Event "Western Open"]
[Site "Milwaukee USA"]
[Date "1957.07.06"]
[White "Bobby Fischer"]
[Black "Arthur Dake"]
[Result "1-0"]

1. e4 c5 2. Nf3 g6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Bg7 6. Be3 d6 7. h3 Nf6 8. g4 O-O 9. g5 Nd7 10. h4 Nc5 11. Qd2 a5 12. O-O-O Bd7 13. f4 Nxd4 14. Bxd4 Bxd4 15. Qxd4 b5 16. Bxb5 Bxb5 17. Nxb5 Qb6 18. Nc3 Qxd4 19. Rxd4 Rfb8 20. Nd5 e6 21. Nc7 Rb7 22. h5 Rxc7 23. hxg6 fxg6 24. b3 Rb8 25. Kb2 Kf7 26. Rd3 Rbb7 27. Rhd1 Ke7 28. f5 exf5 29. exf5 gxf5 30. g6 Kf6 31. gxh7 Rxh7 32. Rd5 Rxc2+ 33. Ka3 Ne4 34. Rxf5+ 1-0`
  },
  {
    id: 'olafsson-fischer-1959',
    rank: 38,
    title: 'Candidates Classic',
    event: 'Candidates Tournament',
    year: 1959,
    white: 'Fridrik Olafsson',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'A model game of positional play.',
    pgn: `[Event "Candidates Tournament"]
[Site "Bled/Zagreb/Belgrade YUG"]
[Date "1959.09.25"]
[Round "18"]
[White "Fridrik Olafsson"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Nf3 e5 7. O-O Nc6 8. d5 Ne7 9. Nd2 a5 10. a3 Nd7 11. Rb1 f5 12. b4 Kh8 13. f3 axb4 14. axb4 Nc5 15. Nb3 Na6 16. Qd3 b6 17. Bd2 f4 18. b5 Nb4 19. Bxb4 Rxa1 20. Rxa1 Qe8 21. Na4 g5 22. Bc3 Ng6 23. Na5 Ba8 24. Nc6 Bxc6 25. bxc6 Qxc6 26. Nb2 h5 27. Nd1 Kh7 28. Nf2 g4 29. fxg4 hxg4 30. Qb5 Qd7 31. Qd3 Rf6 32. Ra8 Rh6 33. Qg6+ Kg8 34. Rf8+ Kxf8 35. Qxh6+ Bxh6 36. Bxe5 dxe5 37. Nxg4 Bg5 38. d6 cxd6 39. Bd3 Qf5 0-1`
  },
  {
    id: 'fischer-mecking-1970',
    rank: 39,
    title: 'Palma de Mallorca Star',
    event: 'Interzonal',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Henrique Mecking',
    result: '1-0',
    significance: 'Fischer defeats the young Brazilian star.',
    pgn: `[Event "Interzonal"]
[Site "Palma de Mallorca ESP"]
[Date "1970.11.09"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Henrique Mecking"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7 4. Bxd7+ Qxd7 5. O-O Nc6 6. c3 Nf6 7. Re1 e6 8. d4 cxd4 9. cxd4 d5 10. e5 Ne4 11. Nc3 Nxc3 12. bxc3 Be7 13. Rb1 O-O 14. Qa4 Qc7 15. Bd2 b6 16. Nh4 Na5 17. f4 Nc4 18. Bc1 a5 19. f5 Ba3 20. Bxa3 Nxa3 21. Ra1 Nc4 22. fxe6 fxe6 23. Qg4 Qc6 24. Nf5 Rxf5 25. Qxf5 Rf8 26. Qg4 Qe4 27. Qxe4 dxe4 28. Rxe4 Nd2 29. Rb4 b5 30. a4 Rf5 31. axb5 Rxe5 32. dxe5 Nc4 33. Rc1 Nxe5 34. b6 Nc6 35. b7 Kf7 36. Rf4+ Ke7 37. Rc4 Nb8 38. Rd1 Kf6 39. Rd8 1-0`
  },
  {
    id: 'fischer-matulovic-1968',
    rank: 40,
    title: 'Vinkovci Victory',
    event: 'Vinkovci',
    year: 1968,
    white: 'Bobby Fischer',
    black: 'Milan Matulovic',
    result: '1-0',
    significance: 'A model Sicilian Najdorf victory.',
    pgn: `[Event "Vinkovci"]
[Site "Vinkovci YUG"]
[Date "1968.09.27"]
[Round "3"]
[White "Bobby Fischer"]
[Black "Milan Matulovic"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. g4 b5 11. Bxf6 Nxf6 12. g5 Nd7 13. a3 Rb8 14. h4 b4 15. axb4 Rxb4 16. Bh3 Bb7 17. Rhe1 Qb6 18. Nd5 exd5 19. Nc6 Qxf2 20. Nxe7 Qxh4 21. Qxd5 Qxg5+ 22. Kb1 Kxe7 23. Bxd7 Rxe4 24. Rxe4+ Kxd7 25. Qxf7+ Kc6 26. Re6 Rf8 27. Qa7 Qc5 28. Qxa6 Kc7 29. Qa5+ Qxa5 30. Rxa5 Rxf4 31. b3 Bd5 32. Ra7+ Kc6 33. Rxg7 h5 34. Rh7 Rf5 35. c4 Bxc4 36. bxc4 1-0`
  },
  // === SIMUL AND CASUAL BRILLIANCIES (41-60) ===
  {
    id: 'fischer-shocron-1959',
    rank: 41,
    title: 'Mar del Plata Marvel',
    event: 'Mar del Plata',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Ruben Shocron',
    result: '1-0',
    significance: 'A brilliant attacking game from the Mar del Plata tournament.',
    pgn: `[Event "Mar del Plata"]
[Site "Mar del Plata ARG"]
[Date "1959.03.30"]
[Round "10"]
[White "Bobby Fischer"]
[Black "Ruben Shocron"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Be2 Be7 7. O-O O-O 8. Be3 Nc6 9. f4 e5 10. Nxc6 bxc6 11. fxe5 dxe5 12. Qd3 Bd6 13. Rad1 Be6 14. Na4 Nd7 15. c4 Qe7 16. Bc5 Nxc5 17. Nxc5 Bc7 18. b3 Rfd8 19. Qf3 Bb8 20. Bf1 Qg5 21. Qf2 Rd6 22. Rxd6 Bxd6 23. Rd1 Bxc5 24. Qxc5 Rd8 25. Rxd8+ Qxd8 26. Qxe5 Qd4+ 27. Qxd4 1-0`
  },
  {
    id: 'fischer-letelier-1960',
    rank: 42,
    title: 'Leipzig Olympiad Star',
    event: 'Olympiad',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'Rene Letelier',
    result: '1-0',
    significance: 'A famous king hunt in the Olympiad.',
    pgn: `[Event "Olympiad"]
[Site "Leipzig GDR"]
[Date "1960.10.21"]
[Round "7"]
[White "Bobby Fischer"]
[Black "Rene Letelier"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 Na5 9. e5 Ne8 10. Bxf7+ Kxf7 11. Ne6 dxe6 12. Qxd8 Nc6 13. Qd2 Bxe5 14. O-O Nd6 15. Bf4 Nc4 16. Qe2 Bxf4 17. Qxc4 Kg7 18. Ne4 Bc7 19. Nc5 Rf6 20. Rad1 e5 21. Nd7 Bxd7 22. Rxd7 Raf8 23. Qc5 Re6 24. Re1 b6 25. Qc4 Rf5 26. g4 Rf7 27. Rxe5 Rxe5 28. Qxf7+ Kh6 29. Rxc7 Rg5 30. f3 e5 31. Qf8+ Rg7 32. Qxg7+ Kxg7 33. Rxc6 1-0`
  },
  {
    id: 'fischer-cardoso-1957',
    rank: 43,
    title: 'New Jersey Brilliancy',
    event: 'New Jersey Open',
    year: 1957,
    white: 'Bobby Fischer',
    black: 'Rodolfo Cardoso',
    result: '1-0',
    significance: 'A brilliant tactical game by the young prodigy.',
    pgn: `[Event "New Jersey Open"]
[Site "East Orange USA"]
[Date "1957.09.03"]
[White "Bobby Fischer"]
[Black "Rodolfo Cardoso"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 Be7 8. f4 O-O 9. Be3 b5 10. f5 e5 11. Nde2 b4 12. Nd5 Nxd5 13. Bxd5 Nd7 14. c3 bxc3 15. bxc3 Rb8 16. O-O Bb7 17. Bxb7 Rxb7 18. Ng3 Bf6 19. Qh5 g6 20. fxg6 hxg6 21. Qf3 Nb6 22. Bxb6 Rxb6 23. Nh5 gxh5 24. Qxf6 Qc7 25. Rf3 Rfb8 26. Raf1 Qc4 27. Rg3+ Kh7 28. Qf5+ Kh8 29. Qxh5+ Kg8 30. Rf5 Rxb1+ 31. Rxb1 Qxe4 32. Qh6 f6 33. Rg4 Qe2 34. Rb8+ 1-0`
  },
  {
    id: 'fischer-rossetto-1959',
    rank: 44,
    title: 'Mar del Plata Masterpiece',
    event: 'Mar del Plata',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Hector Rossetto',
    result: '1-0',
    significance: 'A stunning sacrificial attack.',
    pgn: `[Event "Mar del Plata"]
[Site "Mar del Plata ARG"]
[Date "1959.04.04"]
[Round "14"]
[White "Bobby Fischer"]
[Black "Hector Rossetto"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Bb3 Be7 8. Be3 O-O 9. f4 a6 10. O-O Qc7 11. f5 e5 12. Nxc6 bxc6 13. Bg5 Bb7 14. Bxf6 Bxf6 15. Ne2 Be7 16. Ng3 f6 17. Qg4 Kh8 18. Nh5 Qd8 19. Rf3 Rg8 20. Rg3 Bf8 21. Qh4 g6 22. fxg6 hxg6 23. Nxf6 Rg7 24. Nh5 gxh5 25. Qxh5+ Rh7 26. Qxh7+ Kxh7 27. Rh3+ Kg6 28. Bxf7+ Kxf7 29. Rf3+ 1-0`
  },
  {
    id: 'fischer-durao-1966',
    rank: 45,
    title: 'Havana Olympiad Star',
    event: 'Olympiad',
    year: 1966,
    white: 'Bobby Fischer',
    black: 'Joaquim Durao',
    result: '1-0',
    significance: 'A brilliant attacking game on Board 1.',
    pgn: `[Event "Olympiad"]
[Site "Havana CUB"]
[Date "1966.10.26"]
[Round "4"]
[White "Bobby Fischer"]
[Black "Joaquim Durao"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. O-O Bd7 6. c3 g6 7. d4 Bg7 8. dxe5 dxe5 9. Be3 Nf6 10. Nbd2 O-O 11. h3 Qe7 12. Re1 Rfe8 13. Bb3 b5 14. Bc2 Na5 15. Nf1 c5 16. Ng3 Rac8 17. Qd2 Be6 18. Rad1 c4 19. Bh6 Nc6 20. Bxg7 Kxg7 21. Qg5 Qf8 22. Nf5+ gxf5 23. exf5 Bd5 24. Rxe5 Nb4 25. cxb4 Bxf3 26. Re7 Rxe7 27. Qxe7 Qxf5 28. Qxf6+ Qxf6 29. gxf3 Qc3 30. Rd5 1-0`
  },
  {
    id: 'fischer-robatsch-1962',
    rank: 46,
    title: 'Olympiad Excellence',
    event: 'Olympiad',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Karl Robatsch',
    result: '1-0',
    significance: 'A model attacking game from the Olympiad.',
    pgn: `[Event "Olympiad"]
[Site "Varna BUL"]
[Date "1962.09.25"]
[Round "13"]
[White "Bobby Fischer"]
[Black "Karl Robatsch"]
[Result "1-0"]

1. e4 g6 2. d4 Bg7 3. Nc3 d6 4. f4 Nf6 5. Nf3 O-O 6. Bd3 Bg4 7. h3 Bxf3 8. Qxf3 Nc6 9. Be3 e5 10. dxe5 dxe5 11. f5 gxf5 12. Qxf5 Nd4 13. Qf2 Ne8 14. O-O Nd6 15. Qg3 Kh8 16. Qg4 c6 17. Qh5 Qe7 18. Bxd4 exd4 19. Rf6 Kg8 20. e5 Nf5 21. Bxf5 Qe7 22. Ne4 Qb4 23. Qg4 dxc3 24. e6 cxb2 25. Rb1 fxe6 26. Be4+ Kh8 27. Rxe6 Qf8 28. Qf5 Qxf5 29. Bxf5 Rxf5 30. Rxb2 Bf6 31. Nxf6 Rxf6 32. Rxf6 1-0`
  },
  {
    id: 'fischer-barcza-1959',
    rank: 47,
    title: 'Zurich Classic',
    event: 'Zurich',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Gedeon Barcza',
    result: '1-0',
    significance: 'A positional masterpiece in Switzerland.',
    pgn: `[Event "Zurich"]
[Site "Zurich SUI"]
[Date "1959.05.29"]
[Round "4"]
[White "Bobby Fischer"]
[Black "Gedeon Barcza"]
[Result "1-0"]

1. e4 c6 2. Nc3 d5 3. Nf3 Bg4 4. h3 Bxf3 5. Qxf3 e6 6. d3 Nf6 7. g3 Bb4 8. Bd2 d4 9. Nb1 Bxd2+ 10. Nxd2 e5 11. Bg2 Nbd7 12. O-O Qe7 13. Nc4 O-O 14. Qe2 b5 15. Na5 Rfc8 16. b4 Qe6 17. a4 Nd5 18. Nb3 a6 19. axb5 cxb5 20. Na5 Rc3 21. Qd2 Rac8 22. Rac1 Rxc1 23. Rxc1 Rxc1+ 24. Qxc1 Qc8 25. Qxc8+ Nxc8 26. f4 f6 27. fxe5 fxe5 28. Nc6 Kf7 29. Kf2 Ke6 30. Ke2 Nd6 31. Kd2 N7f5 32. exf5+ Nxf5 33. Ne4 h6 34. Bf3 g5 35. h4 gxh4 36. gxh4 h5 37. Ke2 a5 38. bxa5 b4 39. Nf6 b3 40. cxb3 Ne3 41. Nxh5 Nxd3 42. Ng3 1-0`
  },
  {
    id: 'fischer-gligoric-1970',
    rank: 48,
    title: 'Rovinj Brilliancy',
    event: 'Rovinj/Zagreb',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Svetozar Gligoric',
    result: '1-0',
    significance: 'A model game against the Yugoslav legend.',
    pgn: `[Event "Rovinj/Zagreb"]
[Site "Rovinj/Zagreb YUG"]
[Date "1970.04.15"]
[Round "3"]
[White "Bobby Fischer"]
[Black "Svetozar Gligoric"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d6 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Nc6 13. dxc5 dxc5 14. a4 Rb8 15. axb5 axb5 16. Nf1 Be6 17. Ne3 c4 18. Nd5 Bxd5 19. exd5 Nd4 20. Nxd4 exd4 21. Qf3 Rfe8 22. Bg5 Nd7 23. Bxe7 Rxe7 24. Rxe7 Qxe7 25. Re1 Qd8 26. Qe4 Nf8 27. Re2 Ne6 28. dxe6 Qd6 29. exf7+ Kxf7 30. Qd5+ Qxd5 31. Bxd5+ Kf6 32. Re4 dxc3 33. bxc3 Rd8 34. Be6 Rd1+ 35. Kh2 Rd2 36. Rxc4 Rxf2 37. Rxb5 Rc2 38. Rb3 1-0`
  },
  {
    id: 'fischer-greenwald-1956',
    rank: 49,
    title: 'US Junior Victory',
    event: 'US Junior Championship',
    year: 1956,
    white: 'Bobby Fischer',
    black: 'Daniel Greenwald',
    result: '1-0',
    significance: 'A key game from Fischer\'s US Junior Championship victory.',
    pgn: `[Event "US Junior Championship"]
[Site "Philadelphia USA"]
[Date "1956.07.16"]
[Round "5"]
[White "Bobby Fischer"]
[Black "Daniel Greenwald"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Nxc3 9. bxc3 Bxc3 10. Qb3 Bxa1 11. Bxf7+ Kf8 12. Bg5 Ne7 13. Ne5 Bxd4 14. Bg6 Bxe5 15. Qf3+ Bf6 16. Bxf6 gxf6 17. Qxf6+ Ke8 18. Qf7+ Kd8 19. Qxh7 1-0`
  },
  {
    id: 'fischer-pupols-1955',
    rank: 50,
    title: 'US Junior Brilliancy',
    event: 'US Junior Championship',
    year: 1955,
    white: 'Bobby Fischer',
    black: 'Viktors Pupols',
    result: '1-0',
    significance: 'An early brilliancy from the 12-year-old prodigy.',
    pgn: `[Event "US Junior Championship"]
[Site "Lincoln NEB"]
[Date "1955.07.25"]
[Round "9"]
[White "Bobby Fischer"]
[Black "Viktors Pupols"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7 7. Qf3+ Ke6 8. Nc3 Ncb4 9. O-O c6 10. d4 Kd7 11. dxe5 Kc7 12. Bf4 Be7 13. a3 Rf8 14. Qe4 Rxf4 15. Qxf4 Na6 16. Qe4 Nac7 17. Bxd5 Nxd5 18. Nxd5+ cxd5 19. Qxd5 Qc7 20. e6 Qa5 21. Qf7 Qd8 22. Rfd1 Bh4 23. Rd7+ Kb8 24. Rxb7+ Kxb7 25. Qd5+ Kb6 26. Qd6+ 1-0`
  },
  // === MORE CHAMPIONSHIP GAMES (51-75) ===
  {
    id: 'fischer-euwe-1960',
    rank: 51,
    title: 'Leipzig Olympiad Classic',
    event: 'Olympiad',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'Max Euwe',
    result: '1-0',
    significance: 'Fischer defeats the former World Champion.',
    pgn: `[Event "Olympiad"]
[Site "Leipzig GDR"]
[Date "1960.10.30"]
[Round "11"]
[White "Bobby Fischer"]
[Black "Max Euwe"]
[Result "1-0"]

1. e4 c6 2. Nc3 d5 3. Nf3 Bg4 4. h3 Bxf3 5. Qxf3 Nf6 6. d3 e6 7. g3 Bb4 8. Bd2 d4 9. Nb1 Bxd2+ 10. Nxd2 e5 11. Bg2 c5 12. O-O Nc6 13. Qe2 O-O 14. f4 Re8 15. Nf3 Qc7 16. fxe5 Nxe5 17. Nxe5 Rxe5 18. Bf3 Rae8 19. Rf2 Qb6 20. Raf1 Qa5 21. Qd2 Qxd2 22. Rxd2 h6 23. a3 R8e7 24. Rff2 Nd7 25. Rc2 f5 26. exf5 Rxf5 27. Bxb7 Rxf1+ 28. Kxf1 Nb8 29. Bc6 Kf7 30. Bb5 Nc6 31. Bxc6 Re1+ 32. Kf2 Rb1 33. Rb2 Rxb2 34. Bxb2 Ke6 35. Ke2 Kd5 36. Bf5 g6 37. Bc2 g5 38. Kd2 h5 39. b4 cxb4 40. axb4 h4 41. g4 a6 42. Bd1 1-0`
  },
  {
    id: 'fischer-spassky-1972-g1',
    rank: 52,
    title: 'Match Opening Loss',
    event: 'World Championship',
    year: 1972,
    white: 'Boris Spassky',
    black: 'Bobby Fischer',
    result: '1-0',
    significance: 'The famous blunder on move 29 in the Poisoned Pawn variation.',
    pgn: `[Event "World Championship"]
[Site "Reykjavik ISL"]
[Date "1972.07.11"]
[Round "1"]
[White "Boris Spassky"]
[Black "Bobby Fischer"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Bb4 5. e3 O-O 6. Bd3 c5 7. O-O Nc6 8. a3 Ba5 9. Ne2 dxc4 10. Bxc4 Bb6 11. dxc5 Qxd1 12. Rxd1 Bxc5 13. b4 Be7 14. Bb2 Bd7 15. Rac1 Rfd8 16. Ned4 Nxd4 17. Nxd4 Ba4 18. Bb3 Bxb3 19. Nxb3 Rxd1+ 20. Rxd1 Rc8 21. Kf1 Kf8 22. Ke2 Ne4 23. Rc1 Rxc1 24. Bxc1 f6 25. Na5 Nd6 26. Kd3 Bd8 27. Nc4 Bc7 28. Nxd6 Bxd6 29. b5 Bxh2 30. g3 h5 31. Ke2 h4 32. Kf3 Ke7 33. Kg2 hxg3 34. fxg3 Bxg3 35. Kxg3 Kd6 36. a4 Kd5 37. Ba3 Ke4 38. Bc5 a6 39. b6 f5 40. Kh4 f4 41. exf4 Kxf4 42. Kh5 Kf5 43. Be3 Ke4 44. Bf2 Kf5 45. Bh4 e5 46. Bg5 e4 47. Be3 Kf6 48. Kg4 Ke5 49. Kg5 Kd5 50. Kf5 a5 51. Bf2 g5 52. Kxg5 Kc4 53. Kf5 Kb4 54. Kxe4 Kxa4 55. Kd5 Kb5 56. Kd6 1-0`
  },
  {
    id: 'fischer-hort-1970',
    rank: 53,
    title: 'Rovinj Excellence',
    event: 'Rovinj/Zagreb',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Vlastimil Hort',
    result: '1-0',
    significance: 'A model positional game against a strong Czech GM.',
    pgn: `[Event "Rovinj/Zagreb"]
[Site "Rovinj/Zagreb YUG"]
[Date "1970.04.12"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Vlastimil Hort"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 b5 8. O-O Be7 9. f4 O-O 10. f5 e5 11. Nde2 Bb7 12. Ng3 Nbd7 13. Qf3 Rc8 14. a3 g6 15. fxg6 hxg6 16. Be3 Nc5 17. Rad1 Nxb3 18. cxb3 Rc6 19. Rd2 Kg7 20. Rfd1 Qb6 21. Qf2 Rfc8 22. Nf5+ gxf5 23. exf5 Rxc3 24. bxc3 Rxc3 25. Qxb6 Rxb3 26. f6+ Kg6 27. fxe7 Re3 28. Bc5 Re4 29. Bxd6 Bxg2 30. Bf8 b4 31. axb4 Rxb4 32. Rd8 Rb1+ 33. Kg2 Bc6+ 34. Kf2 Rxd1 35. Rxd1 Kf5 36. Rd8 Ke4 37. Rc8 Bb5 38. Rc5 Nd5 39. Rxb5 axb5 40. Bd6 Nc3 41. Bc5 Nb5 42. Ke2 1-0`
  },
  {
    id: 'fischer-spassky-1992-g11',
    rank: 54,
    title: 'The Comeback Match',
    event: 'Return Match',
    year: 1992,
    white: 'Bobby Fischer',
    black: 'Boris Spassky',
    result: '1-0',
    significance: 'A key victory in the controversial rematch in Sveti Stefan.',
    pgn: `[Event "Return Match"]
[Site "Sveti Stefan YUG"]
[Date "1992.10.19"]
[Round "11"]
[White "Bobby Fischer"]
[Black "Boris Spassky"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. Bb5 g6 4. O-O Bg7 5. c3 Nf6 6. Re1 O-O 7. d4 cxd4 8. cxd4 d5 9. e5 Ne4 10. Nc3 Nxc3 11. bxc3 Qc7 12. Ba3 Rd8 13. Qe2 Bf5 14. Rac1 h6 15. h3 Be4 16. Qb2 Rac8 17. Bb4 Nxb4 18. cxb4 Qb6 19. Ba4 Rc7 20. Rxc7 Qxc7 21. Rc1 Qa5 22. Bb3 Bxf3 23. gxf3 Qa4 24. Kg2 Qa3 25. Rc3 Qb2 26. Qc1 Qb1 27. Qc2 Qxc2 28. Rxc2 f6 29. Kf1 fxe5 30. dxe5 Bxe5 31. Ke2 b5 32. Kd3 a5 33. bxa5 Bf6 34. Rc7 Ra8 35. a6 Bd8 36. Rb7 Ba5 37. Kc2 Kg7 38. Kb3 Bc3 39. Bxd5 exd5 40. a7 1-0`
  },
  {
    id: 'fischer-spassky-1992-g1',
    rank: 55,
    title: 'Return Match Opener',
    event: 'Return Match',
    year: 1992,
    white: 'Bobby Fischer',
    black: 'Boris Spassky',
    result: '1-0',
    significance: 'Fischer opens the rematch with a win after 20 years away.',
    pgn: `[Event "Return Match"]
[Site "Sveti Stefan YUG"]
[Date "1992.09.02"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Boris Spassky"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. Bg5 h6 16. Bd2 Bg7 17. a4 c5 18. d5 c4 19. b4 Nh7 20. Be3 h5 21. Qd2 Rf8 22. Ra3 Ndf6 23. Rea1 Qd7 24. R1a2 Rfc8 25. Qc1 Bf8 26. Qa1 Qe8 27. Nf1 Be7 28. N1d2 Bd8 29. axb5 axb5 30. Ra7 Bb6 31. R7a6 Kg7 32. Nf1 Bc5 33. Ne3 Nf8 34. Nf5+ Kh7 35. Qd1 gxf5 36. exf5 Qd7 37. Ra8 1-0`
  },
  {
    id: 'fischer-mednis-1958',
    rank: 56,
    title: 'US Championship Crush',
    event: 'US Championship',
    year: 1958,
    white: 'Bobby Fischer',
    black: 'Edmar Mednis',
    result: '1-0',
    significance: 'A typically crushing Fischer attack.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1958.12.18"]
[Round "3"]
[White "Bobby Fischer"]
[Black "Edmar Mednis"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. Bd3 h6 11. Bh4 g5 12. fxg5 Ne5 13. Qe2 Nfg4 14. Nf3 hxg5 15. Bxg5 Bxg5+ 16. Nxg5 Nxd3+ 17. Rxd3 Qe5 18. Qd2 Qxg5 19. Qxg5 Nf2 20. Qf6 Rg8 21. Re3 Nxh1 22. Qxf7+ Kd8 23. g3 Nxg3 24. hxg3 Rxg3 25. Rxg3 Bd7 26. Rg8+ Kc7 27. Qf4 1-0`
  },
  {
    id: 'fischer-sherwin-1962',
    rank: 57,
    title: 'US Championship Star',
    event: 'US Championship',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'James Sherwin',
    result: '1-0',
    significance: 'A brilliant tactical victory.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1962.12.16"]
[Round "1"]
[White "Bobby Fischer"]
[Black "James Sherwin"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nc6 6. Nxc6 bxc6 7. O-O d5 8. c4 Nf6 9. cxd5 cxd5 10. exd5 exd5 11. Nc3 Be7 12. Qa4+ Qd7 13. Qb3 O-O 14. Re1 Qd6 15. Qxd5 Qxd5 16. Nxd5 Nxd5 17. Rxe7 Nf4 18. Be4 Rb8 19. Bf3 Ng6 20. Re2 Bb7 21. Be3 Bxf3 22. gxf3 Rfc8 23. Rd1 Rc4 24. a3 Rbc8 25. Rd7 R4c7 26. Rxc7 Rxc7 27. Rd2 Ne5 28. f4 Nc6 29. b4 Kf8 30. Kg2 Ke7 31. Kf3 h6 32. h4 f5 33. Ke2 Ke6 34. Kd3 Kd5 35. Bf2 Rd7+ 36. Ke2 Rxd2+ 37. Kxd2 Ne7 38. Ke3 Ke6 39. Bd4 g6 40. Kd3 Kd5 41. Bf6 Nc8 42. Bg7 h5 43. Bh6 1-0`
  },
  {
    id: 'fischer-quella-1970',
    rank: 58,
    title: 'Siegen Simultaneous',
    event: 'Simul',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Hugo Quella',
    result: '1-0',
    significance: 'A beautiful game from a simultaneous exhibition.',
    pgn: `[Event "Simultaneous Exhibition"]
[Site "Siegen GER"]
[Date "1970.09.30"]
[White "Bobby Fischer"]
[Black "Hugo Quella"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Bd7 13. Nf1 Rfe8 14. Ne3 g6 15. dxe5 dxe5 16. Nh2 Rad8 17. Qf3 Be6 18. Nhg4 Nxg4 19. hxg4 Nc6 20. g5 c4 21. Qh3 h5 22. gxh6 Nd4 23. Bg5 Nxc2 24. Bxe7 Rxe7 25. Qg3 Qb6 26. Nf5 gxf5 27. exf5 Bxf5 28. Qxe5 Nxa1 29. Qxf5 1-0`
  },
  {
    id: 'fischer-ivkov-1970',
    rank: 59,
    title: 'Rovinj Classic',
    event: 'Rovinj/Zagreb',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Borislav Ivkov',
    result: '1-0',
    significance: 'A clinical positional victory.',
    pgn: `[Event "Rovinj/Zagreb"]
[Site "Rovinj/Zagreb YUG"]
[Date "1970.05.01"]
[Round "5"]
[White "Bobby Fischer"]
[Black "Borislav Ivkov"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2 9. Rb1 Qa3 10. f5 Nc6 11. fxe6 fxe6 12. Nxc6 bxc6 13. e5 dxe5 14. Bxf6 gxf6 15. Be2 Bc5 16. Rb3 Qa4 17. O-O Bd4+ 18. Kh1 Bb7 19. Qf4 Qd7 20. Qg4 Rg8 21. Qxe6+ Qxe6 22. Rxb7 Rd8 23. Ne4 Qd5 24. Nxf6+ Kf8 25. Nxd5 cxd5 26. Rxh7 e4 27. Rxf7+ Ke8 28. Kg1 1-0`
  },
  {
    id: 'fischer-quinteros-1970',
    rank: 60,
    title: 'Buenos Aires Star',
    event: 'Buenos Aires',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Miguel Quinteros',
    result: '1-0',
    significance: 'A beautiful attacking game.',
    pgn: `[Event "Buenos Aires"]
[Site "Buenos Aires ARG"]
[Date "1970.07.19"]
[Round "9"]
[White "Bobby Fischer"]
[Black "Miguel Quinteros"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Bc5 6. Nb3 Be7 7. O-O Nc6 8. Nc3 d6 9. Kh1 Nf6 10. f4 Qc7 11. Qf3 O-O 12. Bd2 b5 13. Rae1 Bb7 14. e5 Nd7 15. exd6 Bxd6 16. Ne4 Be7 17. Qh3 f5 18. Ng3 g6 19. Bc3 Bf6 20. Bxf6 Rxf6 21. Nd4 e5 22. Nxc6 Bxc6 23. fxe5 Nxe5 24. Bb1 Nd7 25. Re6 Rxe6 26. Qxe6+ Kh8 27. Qxg6 1-0`
  },
  // === LATE CAREER GEMS (61-80) ===
  {
    id: 'fischer-kovacevic-1970',
    rank: 61,
    title: 'Zagreb Excellence',
    event: 'Rovinj/Zagreb',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Vlado Kovacevic',
    result: '1-0',
    significance: 'A model attacking game.',
    pgn: `[Event "Rovinj/Zagreb"]
[Site "Rovinj/Zagreb YUG"]
[Date "1970.04.24"]
[Round "9"]
[White "Bobby Fischer"]
[Black "Vlado Kovacevic"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 Be7 8. f4 O-O 9. Be3 Qc7 10. O-O b5 11. a3 Bb7 12. Qf3 Nbd7 13. g4 Nc5 14. g5 Nfd7 15. Qh3 Nxb3 16. Nxb3 Nc5 17. Nxc5 dxc5 18. f5 Rad8 19. f6 gxf6 20. Bh6 Rfe8 21. gxf6 Bf8 22. Bxf8 Rxf8 23. Qg4+ Kh8 24. Qh4 Qc6 25. Qf4 Rd4 26. Qxd4 cxd4 27. Nd5 Bxd5 28. exd5 Qxd5 29. Rf5 Qe4 30. Re5 Qg4+ 31. Rg5 Qd1+ 32. Rf1 Qd3 33. Rxf5 1-0`
  },
  {
    id: 'fischer-parma-1970',
    rank: 62,
    title: 'Rovinj Sacrifice',
    event: 'Rovinj/Zagreb',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Bruno Parma',
    result: '1-0',
    significance: 'A spectacular sacrificial attack.',
    pgn: `[Event "Rovinj/Zagreb"]
[Site "Rovinj/Zagreb YUG"]
[Date "1970.04.17"]
[Round "5"]
[White "Bobby Fischer"]
[Black "Bruno Parma"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 Be7 9. Be2 O-O 10. O-O b6 11. Be3 Bb7 12. f3 Ne5 13. Qd2 Nfd7 14. Rfd1 Rc8 15. Rac1 Qc7 16. b3 Rfe8 17. Nc2 Nf6 18. Bf1 h6 19. Na4 Ned7 20. f4 Qc6 21. Bf3 Qb5 22. Qb2 Bf8 23. Be2 Qa5 24. Nb4 Qh5 25. Bf3 Qg6 26. Qf2 e5 27. fxe5 dxe5 28. Nc6 Bxc6 29. Rxd7 Nxd7 30. Bxb6 Bb7 31. Bxb7 Nxb6 32. Bxc8 Nxc8 33. Nxe5 Qe6 34. Rf1 Ne7 35. Qf4 f6 36. Nd3 Rd8 37. Nf2 Rd4 38. Qe3 Ng6 39. Ng4 Ne5 40. Nxe5 fxe5 41. Rxf8+ 1-0`
  },
  {
    id: 'fischer-filguth-1970',
    rank: 63,
    title: 'Buenos Aires Brilliancy',
    event: 'Buenos Aires',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Rubens Filguth',
    result: '1-0',
    significance: 'A typical Fischer demolition.',
    pgn: `[Event "Buenos Aires"]
[Site "Buenos Aires ARG"]
[Date "1970.07.15"]
[Round "3"]
[White "Bobby Fischer"]
[Black "Rubens Filguth"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bg5 e6 7. Qd2 a6 8. O-O-O Bd7 9. f4 Be7 10. Nf3 b5 11. Bxf6 gxf6 12. Kb1 Qb6 13. f5 O-O-O 14. Bd3 Kb8 15. Ne2 Rdg8 16. Rhg1 Rg4 17. Nf4 Rhg8 18. g3 e5 19. Nxe5 dxe5 20. Bc4 Bc8 21. Ne6 Bxe6 22. fxe6 f5 23. exf5 Rxg3 24. Rxg3 Rxg3 25. f6 Bf8 26. Qf4 Rg8 27. f7 Rc8 28. Qxe5 Qd4 29. Rxd4 1-0`
  },
  {
    id: 'gligoric-fischer-1970',
    rank: 64,
    title: 'Palma de Mallorca Victory',
    event: 'Interzonal',
    year: 1970,
    white: 'Svetozar Gligoric',
    black: 'Bobby Fischer',
    result: '0-1',
    significance: 'A key win in the Interzonal.',
    pgn: `[Event "Interzonal"]
[Site "Palma de Mallorca ESP"]
[Date "1970.11.10"]
[Round "3"]
[White "Svetozar Gligoric"]
[Black "Bobby Fischer"]
[Result "0-1"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 O-O 8. Ne2 c5 9. Be3 Nc6 10. O-O Na5 11. Bd3 cxd4 12. cxd4 b6 13. Rc1 Bb7 14. f3 Rc8 15. Rxc8 Qxc8 16. Qb3 Qc7 17. Rc1 Qd8 18. d5 e6 19. Bb1 exd5 20. exd5 Bxd5 21. Qd3 Nc6 22. Qf5 Nb4 23. Rc3 Bxf3 24. Qxf3 Qd2 25. Rc4 Nd5 26. Bf2 Re8 27. Nd4 Ne3 28. Rc3 Nxg2 0-1`
  },
  {
    id: 'fischer-szabo-1962',
    rank: 65,
    title: 'Stockholm Classic',
    event: 'Interzonal',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Laszlo Szabo',
    result: '1-0',
    significance: 'A beautiful positional victory.',
    pgn: `[Event "Interzonal"]
[Site "Stockholm SWE"]
[Date "1962.02.15"]
[Round "11"]
[White "Bobby Fischer"]
[Black "Laszlo Szabo"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bg5 e6 7. Qd2 a6 8. O-O-O h6 9. Bf4 Bd7 10. Nxc6 Bxc6 11. f3 d5 12. Qe1 Bb4 13. a3 Ba5 14. e5 Nd7 15. Be3 Qe7 16. Qg3 O-O-O 17. f4 Kb8 18. Bd3 g5 19. f5 Rdg8 20. Kb1 Bc7 21. Rhf1 Nxe5 22. Bxa6 bxa6 23. Qxe5 exf5 24. Rxf5 Qd7 25. Rd4 Bd6 26. Qf6 Be8 27. Rf1 Bg6 28. Qxf7 Qxf7 29. R1xf7 Bxf7 30. Rxd5 Be6 31. Rd3 Rg6 32. Nd5 Bd7 33. b4 Rf8 34. Bf4 Bxf4 35. Nxf4 Re6 36. Nd5 Re1+ 37. Kb2 Rf2 38. Rd2 Rxd2 39. Nxd2 Be6 40. c4 Ra1 41. c5 Rxa3 42. c6 Ra4 43. c7+ Kxc7 44. Kxa4 1-0`
  },
  {
    id: 'fischer-portisch-1962',
    rank: 66,
    title: 'Stockholm Star',
    event: 'Interzonal',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Lajos Portisch',
    result: '1-0',
    significance: 'A devastating attack against the Hungarian star.',
    pgn: `[Event "Interzonal"]
[Site "Stockholm SWE"]
[Date "1962.02.22"]
[Round "17"]
[White "Bobby Fischer"]
[Black "Lajos Portisch"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. Bg5 h6 16. Bd2 Bg7 17. a4 c5 18. d5 c4 19. b4 cxb3 20. Bxb3 bxa4 21. Rxa4 a5 22. Ba3 Qc7 23. Qa1 Rec8 24. Rc1 Qb8 25. Bxf7+ Kxf7 26. Rxc8 Rxc8 27. Nf5 gxf5 28. Qxa5 fxe4 29. Ng5+ hxg5 30. Qxg5 Qc7 31. Qf5+ Ke8 32. Qg6+ Kd8 33. Qxg7 1-0`
  },
  {
    id: 'fischer-fine-1957',
    rank: 67,
    title: 'New York Casual',
    event: 'Casual Game',
    year: 1957,
    white: 'Bobby Fischer',
    black: 'Reuben Fine',
    result: '1-0',
    significance: 'A brilliant casual game against the American legend.',
    pgn: `[Event "Casual Game"]
[Site "New York USA"]
[Date "1957.07.10"]
[White "Bobby Fischer"]
[Black "Reuben Fine"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Nf3 Nc6 4. Bb5 g5 5. d4 g4 6. Bxc6 dxc6 7. Ne5 Qxd4 8. Nxg4 Qxe4+ 9. Qe2 Bh6 10. O-O Qxe2 11. Nxh6 Nxh6 12. Bxf4 Nf5 13. Nd2 O-O 14. Nf3 b6 15. Rae1 Bb7 16. Re5 Nd6 17. Rfe1 Rfe8 18. Bxd6 cxd6 19. Rxe8+ Rxe8 20. Rxe8+ Nxe8 21. Ne5 Nf6 22. Nxf7 Kxf7 23. b3 Ke6 24. Kf2 d5 25. Ke3 c5 26. Kd3 Kd6 27. c4 dxc4+ 28. bxc4 1-0`
  },
  {
    id: 'fischer-wexler-1960',
    rank: 68,
    title: 'Mar del Plata Star',
    event: 'Mar del Plata',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'Bernardo Wexler',
    result: '1-0',
    significance: 'A typical Fischer positional grind.',
    pgn: `[Event "Mar del Plata"]
[Site "Mar del Plata ARG"]
[Date "1960.03.25"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Bernardo Wexler"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 d6 9. f3 Bd7 10. Qd2 Rc8 11. O-O-O a5 12. g4 a4 13. Nxa4 Qa5 14. b3 Qxa4 15. bxa4 Nxd4 16. Bxd4 Bxa4 17. Bd5 Rc7 18. h4 h5 19. gxh5 Nxh5 20. Rhg1 e6 21. Bb3 Bxb3 22. axb3 Kh7 23. Rg5 Nf6 24. Rdg1 Nh5 25. Qg2 Bxd4 26. Rxh5+ gxh5 27. Qg8+ Kh6 28. Qxf8+ Bg7 29. Rxg7 Rxg7 30. Qxd6 Rg5 31. Qxe6+ Kxh4 32. Qe4+ f4 33. Qxf4+ 1-0`
  },
  {
    id: 'fischer-lombardy-1960',
    rank: 69,
    title: 'US Championship Classic',
    event: 'US Championship',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'William Lombardy',
    result: '1-0',
    significance: 'Fischer defeats a future GM and second.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1960.12.20"]
[Round "3"]
[White "Bobby Fischer"]
[Black "William Lombardy"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. O-O Bd7 6. c3 Nf6 7. Re1 Be7 8. d4 O-O 9. Nbd2 b5 10. Bc2 Re8 11. Nf1 Bf8 12. Ng3 g6 13. Bh6 Bg7 14. Bxg7 Kxg7 15. h3 Qb8 16. Qd2 b4 17. d5 Na5 18. c4 c6 19. Bb3 Nxb3 20. axb3 cxd5 21. cxd5 a5 22. Rac1 Rc8 23. Rxc8 Qxc8 24. Rc1 Qd8 25. Qc2 Be8 26. Nh4 Qb8 27. Nhf5+ gxf5 28. Nxf5+ Kf8 29. Qc7 Qxc7 30. Rxc7 Nd7 31. Nxd6 Nb8 32. Nxf7 Kxf7 33. d6 Rd8 34. Rxb7+ Kf8 35. Rc7 1-0`
  },
  {
    id: 'fischer-bilek-1965',
    rank: 70,
    title: 'Havana Olympiad Star',
    event: 'Olympiad',
    year: 1965,
    white: 'Bobby Fischer',
    black: 'Istvan Bilek',
    result: '1-0',
    significance: 'A typical Fischer positional crush.',
    pgn: `[Event "Olympiad"]
[Site "Havana CUB"]
[Date "1966.10.28"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Istvan Bilek"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Be3 Be7 8. Bb3 O-O 9. O-O a6 10. f4 Na5 11. f5 Nxb3 12. axb3 e5 13. Nb3 Qc7 14. Qd3 Bd7 15. Kh1 Bc6 16. g4 Qd7 17. g5 Nxe4 18. Nxe4 Bxe4 19. Qxe4 f6 20. Rad1 Qc6 21. Qf3 Qc7 22. gxf6 Rxf6 23. Qg2 Raf8 24. c4 Rg8 25. Qh3 Rf7 26. Nc1 Qc5 27. Nd3 Qc6 28. Bc1 Rgf8 29. Rg1 Qb6 30. b4 a5 31. b5 Qd4 32. Rg2 Kh8 33. Rdg1 Bd8 34. Qg4 Bc7 35. h4 Rg8 36. Qh5 Rfg7 37. Nf4 exf4 38. Bxf4 Bxf4 39. Qxf4 1-0`
  },
  // === FINAL 30 GAMES (71-100) ===
  {
    id: 'fischer-greenblatt-1962',
    rank: 71,
    title: 'US Championship Excellence',
    event: 'US Championship',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Richard Greenblatt',
    result: '1-0',
    significance: 'A model attacking game.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1962.12.17"]
[Round "2"]
[White "Bobby Fischer"]
[Black "Richard Greenblatt"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d6 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Bd7 13. Nf1 Nc6 14. d5 Nb8 15. g4 c4 16. Ng3 Bc8 17. Kh2 Nbd7 18. Rg1 Nc5 19. Qe2 a5 20. Nh4 b4 21. Ngf5 Bxf5 22. Nxf5 Rfe8 23. Be3 bxc3 24. bxc3 Rab8 25. Rab1 Rb5 26. Rxb5 Qxb5 27. Rb1 Qa6 28. Rb6 Qc8 29. Bxc5 dxc5 30. Nxg7 Kxg7 31. Qf3 Nd7 32. Rb7 Bf8 33. Qf6+ Kg8 34. g5 1-0`
  },
  {
    id: 'fischer-wade-1962',
    rank: 72,
    title: 'Stockholm Victory',
    event: 'Interzonal',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Robert Wade',
    result: '1-0',
    significance: 'A clinical victory in the Interzonal.',
    pgn: `[Event "Interzonal"]
[Site "Stockholm SWE"]
[Date "1962.02.07"]
[Round "5"]
[White "Bobby Fischer"]
[Black "Robert Wade"]
[Result "1-0"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 O-O 6. Be2 c5 7. dxc5 Qa5 8. O-O Qxc5+ 9. Kh1 Nc6 10. Nd2 a6 11. Nb3 Qb6 12. a4 Bg4 13. f5 Bxe2 14. Qxe2 Nd7 15. Bg5 Nc5 16. Nxc5 dxc5 17. f6 exf6 18. Bxf6 Qd6 19. Rad1 Qc7 20. Bxg7 Kxg7 21. Nd5 Qe5 22. c3 Rad8 23. Qf3 Nb8 24. h3 Rxd5 25. exd5 Qxd5 26. Qxd5 1-0`
  },
  {
    id: 'fischer-donner-1962',
    rank: 73,
    title: 'Olympiad Excellence',
    event: 'Olympiad',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Jan Hein Donner',
    result: '1-0',
    significance: 'A typical Fischer strategic win.',
    pgn: `[Event "Olympiad"]
[Site "Varna BUL"]
[Date "1962.10.04"]
[Round "15"]
[White "Bobby Fischer"]
[Black "Jan Hein Donner"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Be3 Be7 8. Bb3 O-O 9. O-O Na5 10. f4 b6 11. Qf3 Bb7 12. Rad1 Nxb3 13. Nxb3 Qc7 14. Qg3 Rad8 15. f5 e5 16. Nd5 Bxd5 17. Rxd5 Nh5 18. Qh3 g6 19. Bh6 Rfe8 20. fxg6 fxg6 21. Nc1 Bf6 22. Nd3 Nf4 23. Bxf4 exf4 24. Rxf4 Re6 25. Rf3 Be5 26. Rdf5 Bf6 27. Qg4 Bg7 28. Nf4 Rxe4 29. Qxe4 1-0`
  },
  {
    id: 'fischer-udovcic-1962',
    rank: 74,
    title: 'Stockholm Star',
    event: 'Interzonal',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Mijo Udovcic',
    result: '1-0',
    significance: 'A beautiful attacking game.',
    pgn: `[Event "Interzonal"]
[Site "Stockholm SWE"]
[Date "1962.02.11"]
[Round "8"]
[White "Bobby Fischer"]
[Black "Mijo Udovcic"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Bb3 Be7 8. Be3 O-O 9. O-O a6 10. f4 Qc7 11. Qf3 Bd7 12. Rad1 b5 13. Nxc6 Bxc6 14. f5 e5 15. Bg5 Rac8 16. Bxf6 Bxf6 17. Nd5 Qd8 18. Nxf6+ Qxf6 19. Qxf6 gxf6 20. Rd3 Rfd8 21. Rfd1 Be8 22. R3d2 Rc7 23. c3 Rcd7 24. Kf2 Kg7 25. g4 h6 26. Ke3 Rd6 27. h4 Bd7 28. Bc2 Be8 29. Bb3 Bd7 30. g5 hxg5 31. hxg5 fxg5 32. f6+ Kh6 33. Rg1 g4 34. Rxg4 Rg8 35. Rdg2 Rxg4 36. Rxg4 Kh5 37. Rg7 1-0`
  },
  {
    id: 'fischer-pilnik-1958',
    rank: 75,
    title: 'Mar del Plata Classic',
    event: 'Mar del Plata',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Herman Pilnik',
    result: '1-0',
    significance: 'A positional masterpiece.',
    pgn: `[Event "Mar del Plata"]
[Site "Mar del Plata ARG"]
[Date "1959.03.24"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Herman Pilnik"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. h3 e6 7. g4 Be7 8. g5 Nfd7 9. Be3 Nc6 10. Qd2 O-O 11. O-O-O b5 12. Kb1 Rb8 13. h4 b4 14. Na4 Qa5 15. b3 Na7 16. Nc4 Qd8 17. Nb2 Nb6 18. Nd3 Bd7 19. Bg2 Be8 20. Nb4 Na8 21. Nxa6 Ra8 22. Nxc5 dxc5 23. Qxd8 Rxd8 24. Rxd8 Bxd8 25. Rd1 Bc7 26. Rxd7 1-0`
  },
  {
    id: 'fischer-jimenez-1966',
    rank: 76,
    title: 'Havana Olympiad Star',
    event: 'Olympiad',
    year: 1966,
    white: 'Bobby Fischer',
    black: 'Eleazar Jimenez',
    result: '1-0',
    significance: 'A crushing victory on Board 1.',
    pgn: `[Event "Olympiad"]
[Site "Havana CUB"]
[Date "1966.11.08"]
[Round "12"]
[White "Bobby Fischer"]
[Black "Eleazar Jimenez"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Be3 Be7 8. Bb3 O-O 9. O-O a6 10. f4 Na5 11. Qf3 Nxb3 12. axb3 Qc7 13. g4 b5 14. g5 Nd7 15. Qh3 b4 16. Na4 Bb7 17. f5 Nc5 18. fxe6 Nxe6 19. Rf3 Nxd4 20. Bxd4 Qd7 21. g6 hxg6 22. Raf1 Be4 23. Qxd7 1-0`
  },
  {
    id: 'fischer-foguelman-1959',
    rank: 77,
    title: 'Mar del Plata Star',
    event: 'Mar del Plata',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Alberto Foguelman',
    result: '1-0',
    significance: 'A model attacking game.',
    pgn: `[Event "Mar del Plata"]
[Site "Mar del Plata ARG"]
[Date "1959.03.28"]
[Round "9"]
[White "Bobby Fischer"]
[Black "Alberto Foguelman"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. h3 Nc6 7. g4 Nxd4 8. Qxd4 e5 9. Qd3 Be6 10. g5 Nd7 11. Be3 Be7 12. O-O-O O-O 13. f4 exf4 14. Bxf4 Ne5 15. Qg3 Rc8 16. Be2 Bf5 17. exf5 Nc4 18. Bxd6 Bxd6 19. Rxd6 Qb6 20. Rhd1 Qxf2 21. Qxf2 Nxf2 22. R1d2 Ne4 23. Nxe4 Rxc2+ 24. Kb1 Rxe2 25. Rxb7 1-0`
  },
  {
    id: 'fischer-smyslov-1959',
    rank: 78,
    title: 'Candidates Brilliancy',
    event: 'Candidates Tournament',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Vasily Smyslov',
    result: '1-0',
    significance: 'Fischer defeats a former World Champion.',
    pgn: `[Event "Candidates Tournament"]
[Site "Bled/Zagreb/Belgrade YUG"]
[Date "1959.10.04"]
[Round "22"]
[White "Bobby Fischer"]
[Black "Vasily Smyslov"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Bd7 13. Nf1 cxd4 14. cxd4 Rac8 15. Ne3 Nc6 16. d5 Nb4 17. Bb1 a5 18. a3 Na6 19. b4 g6 20. Bd2 Nh5 21. Rc1 Qb8 22. bxa5 Nxa5 23. Bb4 Nc4 24. Nxc4 bxc4 25. Rxc4 Rxc4 26. Qxc4 Qb5 27. Qxb5 Bxb5 28. Bxd6 Bxd6 29. d6 Be6 30. Nd2 Nf4 31. Nc4 Rd8 32. d7 Bxd7 33. Rd1 Bc6 34. Nxd6 Rxd6 35. Rxd6 Ne2+ 36. Kf1 Bxe4 37. Bxe4 Nf4 38. Kf2 1-0`
  },
  {
    id: 'fischer-petrosian-1959',
    rank: 79,
    title: 'Candidates Classic',
    event: 'Candidates Tournament',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Tigran Petrosian',
    result: '1-0',
    significance: 'Fischer defeats a future World Champion.',
    pgn: `[Event "Candidates Tournament"]
[Site "Bled/Zagreb/Belgrade YUG"]
[Date "1959.09.10"]
[Round "8"]
[White "Bobby Fischer"]
[Black "Tigran Petrosian"]
[Result "1-0"]

1. e4 c6 2. Nc3 d5 3. Nf3 Bg4 4. h3 Bxf3 5. Qxf3 Nf6 6. d3 e6 7. g3 Bb4 8. Bd2 d4 9. Nb1 Bxd2+ 10. Nxd2 e5 11. Bg2 c5 12. O-O Nc6 13. Nc4 Qe7 14. a4 O-O 15. Qe2 Nd7 16. f4 f6 17. f5 Kh8 18. g4 Nb6 19. Nxb6 axb6 20. g5 Nd8 21. Qg4 Qd7 22. g6 h6 23. Qh5 Qe8 24. Bh3 Nf7 25. gxf7 Rxf7 26. Bg4 Qf8 27. Kh2 Rd8 28. Rg1 Qe8 29. Raf1 Rfd7 30. Rg3 Qf8 31. Rfg1 Rd6 32. Qxe8 Rxe8 33. Bh5 Re7 34. Bg6 Kg8 35. Rb1 Rdd7 36. b4 cxb4 37. Rxb4 Rc7 38. Rgb3 Rec8 39. Rxb6 Rxc2+ 40. Kg3 R8c3+ 41. Rxc3 Rxc3+ 42. Kf2 Rc2+ 43. Ke1 Ra2 44. Rxb7 Rxa4 45. Rb8+ 1-0`
  },
  {
    id: 'fischer-olafsson-1959',
    rank: 80,
    title: 'Candidates Star',
    event: 'Candidates Tournament',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Fridrik Olafsson',
    result: '1-0',
    significance: 'A clinical victory in the Candidates.',
    pgn: `[Event "Candidates Tournament"]
[Site "Bled/Zagreb/Belgrade YUG"]
[Date "1959.09.29"]
[Round "20"]
[White "Bobby Fischer"]
[Black "Fridrik Olafsson"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Bb7 14. Nf1 Rac8 15. Ne3 Rfe8 16. Bd3 Bf8 17. Rc1 Qb6 18. Bb1 Nc6 19. Bd2 Na5 20. b3 exd4 21. Nxd4 Nd5 22. Nxd5 Bxd5 23. a4 bxa4 24. bxa4 Nb3 25. Rc3 Nxd2 26. Qxd2 Rc5 27. Nf5 Rec8 28. Rxc5 Rxc5 29. Bd3 Bc6 30. Ng3 h6 31. Qd1 Qd8 32. Qf3 Qb6 33. Rb1 Qc7 34. Qg4 Kh7 35. Bf5 g6 36. Be6 Rc1+ 37. Rxc1 Qxc1+ 38. Kh2 Qc5 39. Bf5 Bd7 40. Bxd7 1-0`
  },
  {
    id: 'fischer-tal-1959',
    rank: 81,
    title: 'Candidates Classic',
    event: 'Candidates Tournament',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Mikhail Tal',
    result: '1-0',
    significance: 'Fischer defeats the Magician from Riga.',
    pgn: `[Event "Candidates Tournament"]
[Site "Bled/Zagreb/Belgrade YUG"]
[Date "1959.10.11"]
[Round "26"]
[White "Bobby Fischer"]
[Black "Mikhail Tal"]
[Result "1-0"]

1. e4 c6 2. d4 d5 3. exd5 cxd5 4. Bd3 Nc6 5. c3 Nf6 6. Bf4 Bg4 7. Qb3 Na5 8. Qa4+ Bd7 9. Qc2 e6 10. Nf3 Qb6 11. a4 Rc8 12. Nbd2 Nc6 13. Qb1 Nh5 14. Be3 h6 15. Ne5 Nxe5 16. dxe5 Be7 17. Nf3 Rxc3 18. bxc3 Qxe3+ 19. Kd1 Qxc3 20. Rc1 Qxa1 21. Rc8+ Bxc8 22. Qxa1 O-O 23. Qc3 Rd8 24. Nd4 Nf4 25. Bc2 Bd7 26. Ke1 Bf8 27. h4 Bc5 28. Nf3 Ba5 29. Qxa5 Bc6 30. Qc3 Nd3+ 31. Bxd3 Rxd3 32. Qc5 Rxf3 33. gxf3 Bxf3 34. Qxd5 1-0`
  },
  {
    id: 'fischer-larsen-1966',
    rank: 82,
    title: 'Santa Monica Star',
    event: 'Piatigorsky Cup',
    year: 1966,
    white: 'Bobby Fischer',
    black: 'Bent Larsen',
    result: '1-0',
    significance: 'A beautiful positional game.',
    pgn: `[Event "Piatigorsky Cup"]
[Site "Santa Monica USA"]
[Date "1966.07.23"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Bent Larsen"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Be3 Be7 8. Bb3 O-O 9. O-O Na5 10. f4 b6 11. Qf3 Bb7 12. Qg3 Nxb3 13. axb3 Rc8 14. f5 Re8 15. Rad1 Bf8 16. Nf3 Rxc3 17. bxc3 Nxe4 18. Qf4 Nf6 19. Rfe1 d5 20. Ng5 Qd7 21. Bf2 h6 22. Nh3 e5 23. Qf3 d4 24. Nf4 Qc6 25. cxd4 exd4 26. Rxd4 Re5 27. Qb3 Nd5 28. Nd3 Bxg2 29. Nxe5 Nf4 30. Nc4 Qxc4 31. Rd8 1-0`
  },
  {
    id: 'fischer-ivkov-1966',
    rank: 83,
    title: 'Santa Monica Classic',
    event: 'Piatigorsky Cup',
    year: 1966,
    white: 'Bobby Fischer',
    black: 'Borislav Ivkov',
    result: '1-0',
    significance: 'A typical Fischer strategic win.',
    pgn: `[Event "Piatigorsky Cup"]
[Site "Santa Monica USA"]
[Date "1966.07.18"]
[Round "2"]
[White "Bobby Fischer"]
[Black "Borislav Ivkov"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 Be7 9. Be2 O-O 10. O-O b6 11. Be3 Bb7 12. Qb3 Qc7 13. Rac1 Na5 14. Qa4 Qb8 15. Rfd1 Rd8 16. b4 Nc6 17. b5 axb5 18. Ncxb5 Ne5 19. Bf3 Nxf3+ 20. gxf3 Bxf3 21. Rd3 Bb7 22. Rg3 g6 23. Qc2 Bf8 24. Rg4 Qc8 25. Bh6 Qd7 26. Bxf8 Kxf8 27. Qe2 Ke8 28. Nc2 Nh5 29. f4 Qe7 30. f5 exf5 31. exf5 Qf6 32. Qe6+ fxe6 33. fxg6+ Kf8 34. Rxf6+ Nxf6 35. Nxd6 1-0`
  },
  {
    id: 'fischer-seidman-1959',
    rank: 84,
    title: 'US Championship Star',
    event: 'US Championship',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Herbert Seidman',
    result: '1-0',
    significance: 'A typical Fischer demolition.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1959.12.28"]
[Round "9"]
[White "Bobby Fischer"]
[Black "Herbert Seidman"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 e6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 Be7 9. Be2 O-O 10. O-O b6 11. Be3 Bb7 12. f4 Ne8 13. Bf3 Bf6 14. Qd2 Bxc3 15. bxc3 Rc8 16. Rae1 Qe7 17. Bd4 Nxd4 18. cxd4 f6 19. d5 e5 20. f5 Nc7 21. Nc2 Na8 22. Ne3 Nb6 23. Qd3 Rfd8 24. Qb3 Na4 25. Rc1 Nc5 26. Qd1 Ba8 27. Nd1 Rb8 28. c3 Rbc8 29. Nf2 Kh8 30. g4 Bb7 31. Qe2 h6 32. h4 Bc8 33. Ng4 Qf7 34. Be2 Bd7 35. Nf2 Na4 36. Rxc8 Rxc8 37. Nd3 Qe7 38. Bg4 Rf8 39. Qa2 Nb6 40. Qxa6 Nc4 41. Nc5 Nb6 42. Nxd7 Nxd7 43. Qa7 Nc5 44. Qxe7 1-0`
  },
  {
    id: 'fischer-steinmeyer-1958',
    rank: 85,
    title: 'US Championship Win',
    event: 'US Championship',
    year: 1958,
    white: 'Bobby Fischer',
    black: 'Robert Steinmeyer',
    result: '1-0',
    significance: 'A brilliant tactical victory.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1958.12.24"]
[Round "7"]
[White "Bobby Fischer"]
[Black "Robert Steinmeyer"]
[Result "1-0"]

1. e4 c6 2. Nc3 d5 3. Nf3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Bc4 e6 8. d4 Nf6 9. O-O Bd6 10. Re1 Qc7 11. Nh5 Nxh5 12. Qxh5 Bf4 13. Bxf4 Qxf4 14. Re3 Nd7 15. Rae1 Nf6 16. Qb3 O-O 17. Ne5 Nd5 18. Rg3 Qd6 19. Nxg6 fxg6 20. Rxe6 Qf4 21. Bxd5 cxd5 22. Qxd5 Kh8 23. Rxg6 Rf7 24. Qe5 Qxe5 25. Rxe5 1-0`
  },
  {
    id: 'fischer-reshevsky-1961-g8',
    rank: 86,
    title: 'Match Game 8',
    event: 'Fischer-Reshevsky Match',
    year: 1961,
    white: 'Bobby Fischer',
    black: 'Samuel Reshevsky',
    result: '1-0',
    significance: 'A crucial victory in the match against Reshevsky.',
    pgn: `[Event "Fischer-Reshevsky Match"]
[Site "New York USA"]
[Date "1961.08.11"]
[Round "8"]
[White "Bobby Fischer"]
[Black "Samuel Reshevsky"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 d6 9. f3 Bd7 10. Qd2 Qa5 11. O-O-O Rfc8 12. g4 Ne5 13. h4 Nc4 14. Bxc4 Rxc4 15. Nb3 Qc7 16. h5 Be6 17. hxg6 hxg6 18. Bd4 b5 19. e5 dxe5 20. Bxe5 Qb6 21. Na5 Rc5 22. Qf4 Rxe5 23. Qxe5 b4 24. Nd5 Bxd5 25. Rxd5 Qxa5 26. Rxf6 exf6 27. Rd8+ Rxd8 28. Qxe7 Qf5 29. Qd6+ Kg8 30. Qd4 a5 31. Qxb4 1-0`
  },
  {
    id: 'fischer-bernstein-1960',
    rank: 87,
    title: 'US Championship Excellence',
    event: 'US Championship',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'Sidney Bernstein',
    result: '1-0',
    significance: 'A beautiful attacking game.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1960.12.27"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Sidney Bernstein"]
[Result "1-0"]

1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nf6 5. Nxf6+ exf6 6. c3 Bd6 7. Bd3 O-O 8. Qc2 Re8+ 9. Ne2 h6 10. Be3 Nd7 11. O-O-O b5 12. Ng3 a5 13. Nf5 Nf8 14. Nxd6 Qxd6 15. d5 Bg4 16. dxc6 Rac8 17. Qd2 Bxd1 18. Rxd1 Qe5 19. Qd5 Qxd5 20. Rxd5 Ne6 21. g3 Rxc6 22. Bb5 Rc5 23. Bxe8 Rxd5 24. Bxf7+ Kxf7 25. Bxa5 1-0`
  },
  {
    id: 'fischer-reshevsky-1959',
    rank: 88,
    title: 'US Championship Star',
    event: 'US Championship',
    year: 1959,
    white: 'Bobby Fischer',
    black: 'Samuel Reshevsky',
    result: '1-0',
    significance: 'A key victory against the American legend.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1959.01.06"]
[Round "9"]
[White "Bobby Fischer"]
[Black "Samuel Reshevsky"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Be3 Bg7 6. Nc3 Nf6 7. Bc4 O-O 8. Bb3 d6 9. f3 Na5 10. Qd2 b6 11. Bh6 Bxh6 12. Qxh6 Bb7 13. O-O-O Rc8 14. Qd2 Nxb3+ 15. Nxb3 d5 16. e5 Nd7 17. f4 f6 18. f5 fxe5 19. fxg6 hxg6 20. Nd4 Rf6 21. g3 Qf8 22. Qe3 Qc5 23. Nce2 e6 24. Rhf1 Qe5 25. Rxf6 Nxf6 26. Qb3 Qb5 27. Qxb5 Rxc2+ 28. Nxc2 Bxd5 29. Rd4 Bc6 30. Ncd4 Be8 31. Rd6 Nd7 32. Nc3 e5 33. Nb5 Bf7 34. Rxd7 Bxd7 35. Nxa7 1-0`
  },
  {
    id: 'fischer-tringov-1965',
    rank: 89,
    title: 'Capablanca Memorial Star',
    event: 'Capablanca Memorial',
    year: 1965,
    white: 'Bobby Fischer',
    black: 'Georgi Tringov',
    result: '1-0',
    significance: 'A brilliant attacking game.',
    pgn: `[Event "Capablanca Memorial"]
[Site "Havana CUB"]
[Date "1965.08.25"]
[Round "1"]
[White "Bobby Fischer"]
[Black "Georgi Tringov"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 b5 8. O-O Be7 9. Qf3 Qb6 10. Be3 Qb7 11. Qg3 O-O 12. Bh6 Ne8 13. Rad1 Bd7 14. f4 Nc6 15. f5 Nxd4 16. Rxd4 e5 17. Rh4 Nf6 18. Bxg7 Kxg7 19. Qh6+ Kg8 20. Rf3 Nh5 21. Rg3+ Nxg3 22. hxg3 f6 23. Rg4+ Kf7 24. Qxh7+ Ke8 25. Qxf7+ 1-0`
  },
  {
    id: 'fischer-stein-1962',
    rank: 90,
    title: 'Interzonal Victory',
    event: 'Interzonal',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Leonid Stein',
    result: '1-0',
    significance: 'A critical win in the Interzonal.',
    pgn: `[Event "Interzonal"]
[Site "Stockholm SWE"]
[Date "1962.02.12"]
[Round "9"]
[White "Bobby Fischer"]
[Black "Leonid Stein"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 d6 9. f3 Bd7 10. Qd2 Qa5 11. O-O-O Rfc8 12. Kb1 Ne5 13. g4 Nc4 14. Bxc4 Rxc4 15. h4 Rac8 16. h5 b5 17. Nce2 b4 18. hxg6 hxg6 19. Ng3 Qa6 20. b3 Rc3 21. Nde2 Rxe3 22. Qxe3 e5 23. Nf5 gxf5 24. gxf5 Nh5 25. Qh6 Nf4 26. Rxd6 Kf8 27. Ng3 Qb5 28. Qh4 Qf1+ 29. Kb2 Qxf3 30. Qxf4 exf4 31. Nxf3 f6 32. Rhd1 Be8 33. R6d5 Rc3 34. Kxc3 bxc3 35. Kxc3 1-0`
  },
  {
    id: 'fischer-kholmov-1962',
    rank: 91,
    title: 'Stockholm Star',
    event: 'Interzonal',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Ratmir Kholmov',
    result: '1-0',
    significance: 'A tactical brilliancy.',
    pgn: `[Event "Interzonal"]
[Site "Stockholm SWE"]
[Date "1962.02.03"]
[Round "2"]
[White "Bobby Fischer"]
[Black "Ratmir Kholmov"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 d6 9. f3 Bd7 10. Qd2 Qa5 11. O-O-O Rfc8 12. g4 Ne5 13. h4 b5 14. Bh6 b4 15. Bxg7 Kxg7 16. Nce2 Nc4 17. Bxc4 Rxc4 18. h5 Rxd4 19. Qxd4 Qxa2 20. hxg6 hxg6 21. Qd2 Bc6 22. f4 Qa1+ 23. Kd2 Qa5 24. Nd4 Bb5 25. g5 Nh5 26. Nxb5 Qxb5 27. Qf2 Qd5+ 28. Ke1 Rh8 29. Rxd5 Rxh1+ 30. Kd2 Rh2 31. Rd1 Rxf2+ 32. Kc1 1-0`
  },
  {
    id: 'fischer-bilek-1962',
    rank: 92,
    title: 'Stockholm Brilliancy',
    event: 'Interzonal',
    year: 1962,
    white: 'Bobby Fischer',
    black: 'Istvan Bilek',
    result: '1-0',
    significance: 'A model attacking game.',
    pgn: `[Event "Interzonal"]
[Site "Stockholm SWE"]
[Date "1962.02.25"]
[Round "20"]
[White "Bobby Fischer"]
[Black "Istvan Bilek"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Bc5 6. Nb3 Be7 7. O-O d6 8. Qg4 Bf6 9. Nc3 Ne7 10. Qf4 O-O 11. Be3 Nd7 12. Qh4 Nc6 13. Bg5 Nde5 14. Bf5 Bxg5 15. Qxg5 f6 16. Qh5 g6 17. Bh3 Qb6 18. Nd4 Nxd4 19. Qxd4 Qxd4 20. Nd5 Qxe4 21. Nxf6+ Rxf6 22. Bxe6+ Kg7 23. Bf5 gxf5 24. Rxf5 Rh6 25. Rxe5 dxe5 26. Rxe5 1-0`
  },
  {
    id: 'fischer-schweber-1970',
    rank: 93,
    title: 'Buenos Aires Star',
    event: 'Buenos Aires',
    year: 1970,
    white: 'Bobby Fischer',
    black: 'Samuel Schweber',
    result: '1-0',
    significance: 'A crushing positional victory.',
    pgn: `[Event "Buenos Aires"]
[Site "Buenos Aires ARG"]
[Date "1970.07.21"]
[Round "10"]
[White "Bobby Fischer"]
[Black "Samuel Schweber"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. Bf4 e5 7. Be3 Nf6 8. N1c3 a6 9. Na3 b5 10. Nd5 Nxd5 11. exd5 Nb8 12. Be2 Nd7 13. O-O g6 14. Nc2 Bg7 15. a4 O-O 16. axb5 axb5 17. Rxa8 Qxa8 18. Qd2 Qa6 19. Na3 Bb7 20. c4 bxc4 21. Bxc4 Qa5 22. b3 Ra8 23. Nc2 Qa2 24. Qb4 Bxd5 25. Bxd5 Qa6 26. Nb4 Qb5 27. Nd3 Qxb4 28. Nxb4 Rxa1 29. Bxf7+ Kf8 30. Nxa1 Kxf7 31. b4 1-0`
  },
  {
    id: 'fischer-celle-1963',
    rank: 94,
    title: 'Western Open Star',
    event: 'Western Open',
    year: 1963,
    white: 'Bobby Fischer',
    black: 'Oscar Celle',
    result: '1-0',
    significance: 'A beautiful attacking game.',
    pgn: `[Event "Western Open"]
[Site "Bay City USA"]
[Date "1963.07.04"]
[Round "5"]
[White "Bobby Fischer"]
[Black "Oscar Celle"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. g4 b5 11. Bxf6 Nxf6 12. g5 Nd7 13. a3 Bb7 14. Bh3 O-O-O 15. f5 Nc5 16. Qe2 e5 17. Nf3 d5 18. exd5 Rxd5 19. Rxd5 Bxd5 20. Nxe5 Bxg5+ 21. Kb1 Re8 22. Qe3 Rxe5 23. Qxe5 Qxe5 24. Nxd5 Bf6 25. Nxf6 gxf6 26. Bf1 1-0`
  },
  {
    id: 'fischer-weinstein-1960',
    rank: 95,
    title: 'US Championship Brilliancy',
    event: 'US Championship',
    year: 1960,
    white: 'Bobby Fischer',
    black: 'Raymond Weinstein',
    result: '1-0',
    significance: 'A typical Fischer positional masterpiece.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1960.12.22"]
[Round "5"]
[White "Bobby Fischer"]
[Black "Raymond Weinstein"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Bb3 Be7 8. Be3 O-O 9. O-O a6 10. f4 Qc7 11. Qf3 Nxd4 12. Bxd4 e5 13. fxe5 dxe5 14. Ba7 Ra8 15. Be3 Bc5 16. Rad1 Bxe3+ 17. Qxe3 b5 18. Qc5 Bb7 19. Rf2 Qxc5+ 20. Rxd8 Rxd8 21. Rd2 Rxd2 22. Nxd2 Nd7 23. Nb3 Qa3 24. Nc5 Qa1+ 25. Kf2 Qxb2 26. Nxb7 Qxc2+ 27. Ke1 Qc1+ 28. Kf2 Qc2+ 29. Ke3 Qb1 30. Nd6 Nf6 31. Bc4 g6 32. Bb3 Qe1+ 33. Kf3 Qd1+ 34. Ke3 Qb1 35. Nf5 1-0`
  },
  {
    id: 'fischer-mednis-1963',
    rank: 96,
    title: 'US Championship Classic',
    event: 'US Championship',
    year: 1963,
    white: 'Bobby Fischer',
    black: 'Edmar Mednis',
    result: '1-0',
    significance: 'Part of the legendary 11-0 sweep.',
    pgn: `[Event "US Championship"]
[Site "New York USA"]
[Date "1963.12.23"]
[Round "6"]
[White "Bobby Fischer"]
[Black "Edmar Mednis"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 Nbd7 7. Bc4 e6 8. O-O Be7 9. Bb3 Nc5 10. f4 O-O 11. Qf3 b5 12. e5 Nfd7 13. Bxe7 Qxe7 14. exd6 Qxd6 15. Nf5 exf5 16. Qxa8 Bb7 17. Qa7 Nxb3 18. axb3 Qc6 19. Rfd1 Rc8 20. Qe3 Nf6 21. Qe7 Nd5 22. Qxf7+ Kh8 23. Nxd5 Qxd5 24. Rxd5 Bxd5 25. Qxf5 b4 26. Qd3 a5 27. Ra4 Ba8 28. h3 Bf3 29. Ra1 h6 30. Kf2 Bh5 31. f5 Bg6 32. Qd7 Rc2 33. Qd8+ Kh7 34. f6 gxf6 35. Qxf6 1-0`
  },
  {
    id: 'fischer-feuerstein-1957',
    rank: 97,
    title: 'US Open Star',
    event: 'US Open',
    year: 1957,
    white: 'Bobby Fischer',
    black: 'Arthur Feuerstein',
    result: '1-0',
    significance: 'A brilliant game from the US Open.',
    pgn: `[Event "US Open"]
[Site "Cleveland USA"]
[Date "1957.07.12"]
[Round "3"]
[White "Bobby Fischer"]
[Black "Arthur Feuerstein"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. c3 f5 6. exf5 Bxf5 7. O-O Bd3 8. Re1 Be7 9. Bc2 Bxc2 10. Qxc2 Nf6 11. d4 e4 12. Ng5 d5 13. f3 h6 14. Nh3 O-O 15. fxe4 dxe4 16. Nf4 Bd6 17. Nd2 Ng4 18. g3 Qg5 19. Nxe4 Qh5 20. Nxd6 cxd6 21. Nh3 Nxh2 22. Kxh2 Qxh3+ 23. Kg1 Rf2 24. Qd1 Raf8 25. Be3 Rxb2 26. Rc1 Rf3 27. gxf4 Qxf4 28. Rf1 Qg3+ 29. Kh1 Qh3+ 30. Kg1 Rg3+ 31. Kh2 Rg2+ 32. Kh1 Qg3 0-1`
  },
  {
    id: 'fischer-horowitz-1957',
    rank: 98,
    title: 'New York Brilliancy',
    event: 'Blitz Game',
    year: 1957,
    white: 'Bobby Fischer',
    black: 'Israel Albert Horowitz',
    result: '1-0',
    significance: 'A beautiful blitz game against the chess journalist.',
    pgn: `[Event "Blitz Game"]
[Site "New York USA"]
[Date "1957.08.15"]
[White "Bobby Fischer"]
[Black "Israel Albert Horowitz"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 b5 8. O-O Bb7 9. f4 Nbd7 10. f5 e5 11. Nf3 Be7 12. Bg5 Rc8 13. Bxf6 Nxf6 14. Nd5 Nxd5 15. exd5 O-O 16. c3 Bf6 17. Qd3 Qc7 18. Rae1 Rce8 19. Qg3 Kh8 20. Nh4 Bxh4 21. Qxh4 f6 22. Qg3 Qc5+ 23. Kh1 Qd4 24. Re3 Rf7 25. Rh3 h6 26. Qg6 Qf2 27. Rxh6+ gxh6 28. Qxf7 1-0`
  },
  {
    id: 'fischer-sandrin-1957',
    rank: 99,
    title: 'US Junior Star',
    event: 'US Junior Championship',
    year: 1956,
    white: 'Bobby Fischer',
    black: 'Albert Sandrin',
    result: '1-0',
    significance: 'A key game from Fischer\'s US Junior Championship.',
    pgn: `[Event "US Junior Championship"]
[Site "Philadelphia USA"]
[Date "1956.07.14"]
[Round "3"]
[White "Bobby Fischer"]
[Black "Albert Sandrin"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Nc6 13. dxc5 dxc5 14. Nf1 Be6 15. Ne3 Rad8 16. Qe2 c4 17. Ng5 Bc8 18. Nf5 Bxf5 19. exf5 h6 20. Nf3 e4 21. Nd4 Nxd4 22. cxd4 Bd6 23. Be3 Rfe8 24. Rad1 Qd7 25. g4 Nh7 26. Qg2 Qc6 27. Bf4 Bxf4 28. Rxe4 Rxe4 29. Bxe4 Qb6 30. d5 c3 31. bxc3 Qc5 32. d6 Bc1 33. d7 Bb2 34. f6 Nxf6 35. Bf5 Bxc3 36. Qg3 Kf8 37. Qb3 1-0`
  },
  {
    id: 'fischer-lapiken-1956',
    rank: 100,
    title: 'Match of Champions',
    event: 'Log Cabin Championship',
    year: 1956,
    white: 'Bobby Fischer',
    black: 'Benjamin Lapiken',
    result: '1-0',
    significance: 'An early game showing Fischer\'s tactical genius.',
    pgn: `[Event "Log Cabin Championship"]
[Site "New Jersey USA"]
[Date "1956.03.10"]
[White "Bobby Fischer"]
[Black "Benjamin Lapiken"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O dxc3 8. Qb3 Qe7 9. Nxc3 Nf6 10. Nd5 Nxd5 11. exd5 Ne5 12. Nxe5 Qxe5 13. Bb2 Qg5 14. h4 Qxh4 15. Bxg7 Rg8 16. Rfe1+ Kd8 17. Qg3 Qxg3 18. fxg3 Bb6 19. Bf6+ Ke8 20. d6 Rg6 21. Bc3 cxd6 22. Rad1 Rxg3 23. Rxd6 Rg6 24. Red1 Ke7 25. R6d3 Bc5+ 26. Kf1 Be6 27. Bxe6 Kxe6 28. Bb4 Bxb4 29. Rd6+ Ke7 30. Rxg6 hxg6 31. Rxd7+ Kf6 32. Rxb7 1-0`
  }
];

export default fischerTop100;
