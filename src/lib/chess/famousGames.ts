// Famous historical chess games for testing and showcase
// These iconic games demonstrate the visualization across different play styles

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
    id: 'fischer-spassky-1972-g6',
    title: 'Game of the Century',
    event: 'World Championship Match, Game 6',
    year: 1972,
    white: 'Bobby Fischer',
    black: 'Boris Spassky',
    description: 'Fischer\'s masterpiece against Spassky. A brilliant positional game that showcased Fischer\'s deep understanding of chess.',
    pgn: `[Event "World Championship Match"]
[Site "Reykjavik ISL"]
[Date "1972.07.23"]
[Round "6"]
[White "Robert James Fischer"]
[Black "Boris Spassky"]
[Result "1-0"]

1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4 1-0`
  },
  {
    id: 'kasparov-deepblue-1997-g2',
    title: 'Deep Blue Shocks the World',
    event: 'Man vs Machine, Game 2',
    year: 1997,
    white: 'Deep Blue (IBM)',
    black: 'Garry Kasparov',
    description: 'The historic game where Deep Blue defeated the world champion, marking a turning point in AI history.',
    pgn: `[Event "IBM Man-Machine"]
[Site "New York USA"]
[Date "1997.05.04"]
[Round "2"]
[White "Deep Blue (Computer)"]
[Black "Garry Kasparov"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 h6 10. d4 Re8 11. Nbd2 Bf8 12. Nf1 Bd7 13. Ng3 Na5 14. Bc2 c5 15. b3 Nc6 16. d5 Ne7 17. Be3 Ng6 18. Qd2 Nh7 19. a4 Nh4 20. Nxh4 Qxh4 21. Qe2 Qd8 22. b4 Qc7 23. Rec1 c4 24. Ra3 Rec8 25. Rca1 Qd8 26. f4 Nf6 27. fxe5 dxe5 28. Qf1 Ne8 29. Qf2 Nd6 30. Bb6 Qe8 31. R3a2 Be7 32. Bc5 Bf8 33. Nf5 Bxf5 34. exf5 f6 35. Bxd6 Bxd6 36. axb5 axb5 37. Be4 Rxa2 38. Qxa2 Qd7 39. Qa7 Rc7 40. Qb6 Rb7 41. Ra8+ Kf7 42. Qa6 Qc7 43. Qc6 Qb6+ 44. Kf1 Rb8 45. Ra6 1-0`
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
    id: 'korchnoi-karpov-1978',
    title: 'Epic Endgame (124 Moves)',
    event: 'World Championship',
    year: 1978,
    white: 'Viktor Korchnoi',
    black: 'Anatoly Karpov',
    description: 'A grueling 124-move marathon from their legendary 1978 World Championship battle. Tests long game visualization.',
    pgn: `[Event "World Championship"]
[Site "Baguio City"]
[Date "1978.08.18"]
[Round "5"]
[White "Viktor Korchnoi"]
[Black "Anatoly Karpov"]
[Result "1/2-1/2"]

1. c4 e6 2. Nc3 d5 3. d4 Be7 4. Nf3 Nf6 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. Qc2 Nc6 9. a3 Qa5 10. Rd1 Be7 11. Be2 dxc4 12. Bxc4 Nh5 13. Be5 f6 14. Bg3 Nxg3 15. hxg3 e5 16. O-O Be6 17. Bxe6+ Qxe6 18. Nd5 Bd6 19. b4 Rad8 20. Qc4 Qxc4 21. Rxc4 Kf7 22. Rfc1 Rc8 23. Kf1 Ne7 24. Rxc8 Rxc8 25. Rxc8 Nxc8 26. Nc3 Nb6 27. Ke2 Ke6 28. Kd3 Kd7 29. Ne4 Be7 30. g4 f5 31. gxf5 Nd5 32. Nc3 Nxc3 33. Kxc3 Kc6 34. Nd2 Kb5 35. Ne4 Bd8 36. Nd6+ Kc6 37. Ne8 g6 38. fxg6 hxg6 39. Nf6 Bf6 40. Ng4 Bd8 41. Kd3 Kd5 42. f3 a6 43. e4+ Kc6 44. Ne3 Bg5 45. Nc4 b5 46. Nd2 Kd6 47. Ke2 Ke6 48. Kf2 Kf6 49. Kg2 Ke6 50. Kh3 Kf6 51. g4 Bd8 52. Nf1 Bg5 53. Ne3 Bd8 54. Nd5+ Ke6 55. Nc7+ Kd7 56. Nxa6 Bc7 57. Nc5+ Kc6 58. Kg3 Bd8 59. Kf2 Bg5 60. Ke2 Bd8 61. Kd3 Bg5 62. Ne6 Bd8 63. Nc5 Bg5 64. Ke2 Bd8 65. Kf2 Bg5 66. Kg3 Bd8 67. Kh4 Bc7 68. g5 Bd8 69. Kg4 Bc7 70. Kf5 Bd8 71. Ne6 Bc7 72. Nc5 Bd8 73. Nd3 Kd6 74. Nf2 Bc7 75. Nh3 Bd8 76. Ng1 Bc7 77. Ne2 Bd8 78. Nc3 Bc7 79. Nd5 Bd8 80. Nb6 Kc6 81. Nc8 Kd7 82. Na7 Bc7 83. Nc6 Bd6 84. a4 bxa4 85. Nxe5+ Bxe5 86. Kxe5 Ke7 87. b5 a3 88. b6 a2 89. b7 a1=Q 90. b8=Q Qa5+ 91. Kf4 Qd2+ 92. Kg3 Qe1+ 93. Kh2 Qxe4 94. Qb4 Qe5+ 95. Kh3 Qf5+ 96. Kh4 Qf6+ 97. Kg4 Qe6+ 98. Kf4 Qf6+ 99. Ke4 Qe6+ 100. Kd4 Qd6+ 101. Kc4 Qc6+ 102. Kd3 Qd5+ 103. Ke2 Qe5+ 104. Kf1 Qf5 105. Qe4 Qc2 106. Kg1 Qc5+ 107. Kh2 Qf2+ 108. Kh3 Qf1+ 109. Kh4 Qf2+ 110. Kh3 Qf1+ 111. Kh2 Qf2+ 112. Kh3 Qf1+ 113. Kg4 Qd1+ 114. Kf4 Qd2+ 115. Ke5 Qc3+ 116. Kf5 Qf3 117. Qe6+ Kf8 118. Qd6+ Kg8 119. Qe6+ Kh7 120. Qe7+ Kh8 121. Qe8+ Kg7 122. Qe7+ Kh8 123. Qe8+ Kg7 124. Qe7+ 1/2-1/2`
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
