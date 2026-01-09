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
    id: 'nikolic-arsovic-1989',
    title: 'The Marathon (269 Moves)',
    event: 'Belgrade Obilic',
    year: 1989,
    white: 'Ivan Nikolic',
    black: 'Goran Arsovic',
    description: 'The longest tournament game in chess history. A grueling 269-move battle that tests the limits of endgame visualization.',
    pgn: `[Event "Belgrade Obilic"]
[Site "Belgrade YUG"]
[Date "1989.02.??"]
[Round "9"]
[White "Ivan Nikolic"]
[Black "Goran Arsovic"]
[Result "1/2-1/2"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 Nbd7 7. O-O e5 8. Re1 Re8 9. Bf1 h6 10. d5 Nh7 11. Rb1 f5 12. Nd2 f4 13. b4 g5 14. Nb3 Bf8 15. Be2 Ndf6 16. c5 g4 17. cxd6 cxd6 18. a3 Ng5 19. Bf1 Re7 20. Qd3 Rg7 21. Kh1 Qe8 22. Nd2 g3 23. fxg3 fxg3 24. Qxg3 Nh3 25. Qf3 Qg6 26. Nc4 Bd7 27. Bd3 Ng5 28. Bxg5 Qxg5 29. Ne3 Re8 30. Ne2 Be7 31. Rbd1 Rf8 32. Nf5 Ng4 33. Neg3 h5 34. Kg1 h4 35. Qxg4 Qxg4 36. Nh6+ Kh7 37. Nxg4 hxg3 38. Ne3 gxh2+ 39. Kxh2 Rh8 40. Rh1 Kg6+ 41. Kg1 Rc8 42. Be2 Rc3 43. Rd3 Rc1+ 44. Nf1 Bd8 45. Rh8 Bb6+ 46. Kh2 Rh7+ 47. Rxh7 Kxh7 48. Nd2 Bg1+ 49. Kh1 Bd4+ 50. Nf1 Bg4 51. Bxg4 Rxf1+ 52. Kh2 Bg1+ 53. Kh3 Re1 54. Bf5+ Kh6 55. Kg4 Re3 56. Rd1 Bh2 57. Rh1 Rg3+ 58. Kh4 Rxg2 59. Kh3 Rg3+ 60. Kxh2 Rxa3 61. Rg1 Ra6 62. Rg6+ Kh5 63. Kg3 Rb6 64. Rg7 Rxb4 65. Bc8 a5 66. Bxb7 a4 67. Bc6 a3 68. Ra7 Rb3+ 69. Kf2 Kg5 70. Ke2 Kf4 71. Ra4 Rh3 72. Kd2 a2 73. Bb5 Rh1 74. Rxa2 Rh2+ 75. Be2 Kxe4 76. Ra5 Kd4 77. Ke1 Rh1+ 78. Kf2 Rc1 79. Bg4 Rc2+ 80. Ke1 e4 81. Be6 Ke5 82. Bg8 Rc8 83. Bf7 Rc7 84. Be6 Rc2 85. Ra8 Rb2 86. Ra6 Rg2 87. Kd1 Rb2 88. Be2 Ke4 89. Rh5 Rb1+ 90. Ke1 Rb2 91. Be2 Ke4 92. Rh8 Ra2 93. Re8 Kd4 94. Rf8 Ke5 95. Kd1 Rd2+ 96. Kc1 Rh2 97. Rf5 Rh1+ 98. Kc2 Rh2 99. Kd1 Rh1+ 100. Kc2 Rh2 101. Kc1 Rh1+ 102. Kc2 Rh2 103. Kd1 Rh1+ 104. Ke2 Rh2+ 105. Kf1 Rb2 106. Be2 Ke4 107. Rh5 Rb1+ 108. Kg2 Rb2 109. Rh4+ Kxd5 110. Kf3 Kc5 111. Kxe3 Rb3+ 112. Bd3 d5 113. Rh8 Ra3 114. Re8 Kd6 115. Kd4 Ra4+ 116. Kc3 Ra3+ 117. Kd4 Ra4+ 118. Ke3 Ra3 119. Rh8 Ke5 120. Rh5+ Kd6 121. Rg5 Rb3 122. Kd2 Rb8 123. Bf1 Re8 124. Kd3 Re5 125. Rg8 Rh5 126. Bg2 Kc5 127. Rf8 Rh6 128. Bf3 Rd6 129. Re8 Rc6 130. Ra8 Rb6 131. Rd8 Rd6 132. Rf8 Ra6 133. Rf5 Rd6 134. Rf8 Ra6 135. Re8 Rc6 136. Ra8 Rb6 137. Ra5+ Rb5 138. Ra1 Rb8 139. Rd1 Rd8 140. Rd2 Rd7 141. Bg2 Rd8 142. Kd3 Ra8 143. Ke3 Re8+ 144. Kd3 Ra8 145. Kc3 Rd8 146. Bf3 Rd7 147. Kd3 Ra7 148. Bg2 Ra8 149. Rc2+ Kd6 150. Rc3 Ra2 151. Bf3 Ra8 152. Rb3 Ra5 153. Ke3 Ke5 154. Rd3 Rb5 155. Kd2 Rc5 156. Bg2 Ra5 157. Bf3 Rc5 158. Bd1 Rc8 159. Bb3 Rc5 160. Rh3 Kf4 161. Kd3 Ke5 162. Rh5+ Kf4 163. Kd4 Rb5 164. Bxd5 Rb4+ 165. Bc4 Ra4 166. Rh7 Kg5 167. Rf7 Kg6 168. Rf1 Kg5 169. Kc5 Ra5+ 170. Kc6 Ra4 171. Bd5 Rf4 172. Re1 Rf6+ 173. Kc5 Rf5 174. Kd4 Kf6 175. Re6+ Kg5 176. Be4 Rf6 177. Re8 Kf4 178. Rh8 Rd6+ 179. Bd5 Rf6 180. Rh1 Kf5 181. Be4+ Ke6 182. Ra1 Kd6 183. Ra5 Re6 184. Bf5 Re1 185. Ra6+ Ke7 186. Be4 Rc1 187. Ke5 Rc5+ 188. Bd5 Rc7 189. Rg6 Rd7 190. Rh6 Kd8 191. Be6 Rd2 192. Rh7 Ke8 193. Kf6 Rf2+ 194. Bf5 Rd2 195. Rc7 Rd6+ 196. Be6 Rd2 197. Ra7 Kf8 198. Rc7 Rd1 199. Rh7 Rd2 200. Rg7 Rd1 201. Rg8+ Kc7 202. Rc8+ Kb6 203. Ke5 Kb7 204. Rc3 Kb6 205. Bd5 Rh1 206. Kd6 Rh6+ 207. Be6 Rh5 208. Ra3 Ra5 209. Rg3 Rh5 210. Rg2 Ka5 211. Rg3 Kb6 212. Rg4 Rb5 213. Bd5 Rc5 214. Rg8 Rc2 215. Rb8+ Ka5 216. Bb3 Rc3 217. Kd5 Rc7 218. Kd4 Rd7+ 219. Bd5 Re7 220. Rb2 Re8 221. Rb7 Ka6 222. Rb1 Ka5 223. Bc4 Rd8+ 224. Kc3 Rh8 225. Rb5+ Ka4 226. Rb6 Rh3+ 227. Bd3 Rh5 228. Re6 Rg5 229. Rh6 Rc5+ 230. Bc4 Rg5 231. Ra6+ Ra5 232. Rh6 Rg5 233. Rh4 Ka5 234. Rh2 Rg3+ 235. Kd4 Rg5 236. Bd5 Ka4 237. Kc5 Rg3 238. Ra2+ Ra3 239. Rb2 Rg3 240. Rh2 Rc3+ 241. Bc4 Rg3 242. Rb2 Rg5+ 243. Bd5 Rg3 244. Rh2 Rc3+ 245. Bc4 Rg3 246. Rh8 Ka3 247. Ra8+ Kb2 248. Ra2+ Kb1 249. Rf2 Kc1 250. Kd4 Kd1 251. Bd3 Rg7 1/2-1/2`
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
