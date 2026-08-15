/**
 * Victory Card source data — four canonical games.
 *
 * PGNs and metadata are historical record. Every analytical value shown on a
 * card (archetype, fingerprint, quadrant profile, temporal flow, piece
 * dominance) is computed at build time by the live En Pensent engine from these
 * PGNs. Nothing is hand-authored or estimated.
 */

export const GAMES = [
  {
    id: 'immortal1851',
    title: 'The Immortal Game',
    event: 'London, Casual',
    year: '1851',
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    result: '1-0',
    winner: 'Adolf Anderssen',
    winnerColor: 'white',
    tier: 'champion',
    edition: { number: 1, of: 250 },
    note: 'Two rooks and the queen sacrificed for a mating net.',
    poem: [
      'Both rooks, the queen — all given away,',
      'yet victory blooms from sacrifice.',
    ],
    pgn: '1.e4 e5 2.f4 exf4 3.Bc4 Qh4+ 4.Kf1 b5 5.Bxb5 Nf6 6.Nf3 Qh6 7.d3 Nh5 8.Nh4 Qg5 9.Nf5 c6 10.g4 Nf6 11.Rg1 cxb5 12.h4 Qg6 13.h5 Qg5 14.Qf3 Ng8 15.Bxf4 Qf6 16.Nc3 Bc5 17.Nd5 Qxb2 18.Bd6 Bxg1 19.e5 Qxa1+ 20.Ke2 Na6 21.Nxg7+ Kd8 22.Qf6+ Nxf6 23.Be7#',
  },
  {
    id: 'opera1858',
    title: 'The Opera Game',
    event: 'Paris, Italian Opera House',
    year: '1858',
    white: 'Paul Morphy',
    black: 'Duke Karl / Count Isouard',
    result: '1-0',
    winner: 'Paul Morphy',
    winnerColor: 'white',
    tier: 'champion',
    edition: { number: 2, of: 250 },
    note: 'Seventeen moves of pure development into a rook mate.',
    poem: [
      'Every piece arrives before it strikes —',
      'the curtain falls in seventeen.',
    ],
    pgn: '1.e4 e5 2.Nf3 d6 3.d4 Bg4 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7 8.Nc3 c6 9.Bg5 b5 10.Nxb5 cxb5 11.Bxb5+ Nbd7 12.O-O-O Rd8 13.Rxd7 Rxd7 14.Rd1 Qe6 15.Bxd7+ Nxd7 16.Qb8+ Nxb8 17.Rd8#',
  },
  {
    id: 'kasparov1999',
    title: "Kasparov's Immortal",
    event: 'Wijk aan Zee, Hoogovens',
    year: '1999',
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    result: '1-0',
    winner: 'Garry Kasparov',
    winnerColor: 'white',
    tier: 'champion',
    edition: { number: 3, of: 250 },
    note: 'A king hunt from h8 to a4 across the whole board.',
    poem: [
      'The king is driven half the board,',
      'each check a door that locks behind.',
    ],
    pgn: '1.e4 d6 2.d4 Nf6 3.Nc3 g6 4.Be3 Bg7 5.Qd2 c6 6.f3 b5 7.Nge2 Nbd7 8.Bh6 Bxh6 9.Qxh6 Bb7 10.a3 e5 11.O-O-O Qe7 12.Kb1 a6 13.Nc1 O-O-O 14.Nb3 exd4 15.Rxd4 c5 16.Rd1 Nb6 17.g3 Kb8 18.Na5 Ba8 19.Bh3 d5 20.Qf4+ Ka7 21.Rhe1 d4 22.Nd5 Nbxd5 23.exd5 Qd6 24.Rxd4 cxd4 25.Re7+ Kb6 26.Qxd4+ Kxa5 27.b4+ Ka4 28.Qc3 Qxd5 29.Ra7 Bb7 30.Rxb7 Qc4 31.Qxf6 Kxa3 32.Qxa6+ Kxb4 33.c3+ Kxc3 34.Qa1+ Kd2 35.Qb2+ Kd1 36.Bf1 Rd2 37.Rd7 Rxd7 38.Bxc4 bxc4 39.Qxh8 Rd3 40.Qa8 c3 41.Qa4+ Ke1 42.f4 f5 43.Kc1 Rd2 44.Qa7',
  },
  {
    id: 'century1956',
    title: 'The Game of the Century',
    event: 'New York, Rosenwald',
    year: '1956',
    white: 'Donald Byrne',
    black: 'Robert J. Fischer',
    result: '0-1',
    winner: 'Robert J. Fischer',
    winnerColor: 'black',
    tier: 'champion',
    edition: { number: 4, of: 250 },
    note: 'Thirteen years old, and the queen was the cheapest piece on the board.',
    poem: [
      'A boy gives up his queen and waits —',
      'the board obeys him anyway.',
    ],
    pgn: '1.Nf3 Nf6 2.c4 g6 3.Nc3 Bg7 4.d4 O-O 5.Bf4 d5 6.Qb3 dxc4 7.Qxc4 c6 8.e4 Nbd7 9.Rd1 Nb6 10.Qc5 Bg4 11.Bg5 Na4 12.Qa3 Nxc3 13.bxc3 Nxe4 14.Bxe7 Qb6 15.Bc4 Nxc3 16.Bc5 Rfe8+ 17.Kf1 Be6 18.Bxb6 Bxc4+ 19.Kg1 Ne2+ 20.Kf1 Nxd4+ 21.Kg1 Ne2+ 22.Kf1 Nc3+ 23.Kg1 axb6 24.Qb4 Ra4 25.Qxb6 Nxd1 26.h3 Rxa2 27.Kh2 Nxf2 28.Re1 Rxe1 29.Qd8+ Bf8 30.Nxe1 Bd5 31.Nf3 Ne4 32.Qb8 b5 33.h4 h5 34.Ne5 Kg7 35.Kg1 Bc5+ 36.Kf1 Ng3+ 37.Ke1 Bb4+ 38.Kd1 Bb3+ 39.Kc1 Ne2+ 40.Kb1 Nc3+ 41.Kc1 Rc2#',
  },
];

/** Engine archetype id → human display label. */
export const ARCHETYPE_LABELS = {
  sacrificial_kingside_assault: 'Sacrificial Kingside Assault',
  sacrificial_queenside_break: 'Sacrificial Queenside Break',
  kingside_attack: 'Kingside Attack',
  queenside_expansion: 'Queenside Expansion',
  central_domination: 'Central Domination',
  prophylactic_defense: 'Prophylactic Defense',
  pawn_storm: 'Pawn Storm',
  piece_harmony: 'Piece Harmony',
  opposite_castling: 'Opposite Castling',
  closed_maneuvering: 'Closed Maneuvering',
  open_tactical: 'Open Tactical',
  endgame_technique: 'Endgame Technique',
  sacrificial_attack: 'Sacrificial Attack',
  positional_squeeze: 'Positional Squeeze',
  king_hunt: 'King Hunt',
  tactical_melee: 'Tactical Melee',
  middlegame_complexity: 'Middlegame Complexity',
  unknown: 'Unclassified',
};

export function archetypeLabel(id) {
  return (
    ARCHETYPE_LABELS[id] ||
    String(id)
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}
