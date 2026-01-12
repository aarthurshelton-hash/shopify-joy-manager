-- ================================================
-- MARKETPLACE SEED DATA: 55 Permanent Visions
-- 50 Non-En Pensent + 5 Premium Branded Visions
-- ================================================

-- Create the 5 demo users in auth.users (with minimal data)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, aud, role, instance_id)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'demo1@enpensent.com', crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), '{"display_name": "ChessMaster_Alpha"}'::jsonb, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('b2222222-2222-2222-2222-222222222222', 'demo2@enpensent.com', crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), '{"display_name": "VisionCollector42"}'::jsonb, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('c3333333-3333-3333-3333-333333333333', 'demo3@enpensent.com', crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), '{"display_name": "ArtfulPlayer"}'::jsonb, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('d4444444-4444-4444-4444-444444444444', 'demo4@enpensent.com', crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), '{"display_name": "QueenGambitFan"}'::jsonb, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('e5555555-5555-5555-5555-555555555555', 'demo5@enpensent.com', crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), '{"display_name": "KnightRider_Chess"}'::jsonb, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Create profiles for demo users
INSERT INTO profiles (user_id, display_name, elo_rating) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'ChessMaster_Alpha', 1450),
  ('b2222222-2222-2222-2222-222222222222', 'VisionCollector42', 1320),
  ('c3333333-3333-3333-3333-333333333333', 'ArtfulPlayer', 1280),
  ('d4444444-4444-4444-4444-444444444444', 'QueenGambitFan', 1510),
  ('e5555555-5555-5555-5555-555555555555', 'KnightRider_Chess', 1390)
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, elo_rating = EXCLUDED.elo_rating;

-- ================================================
-- 50 NON-EN PENSENT VISIONS (Off-palette colors)
-- Distributed: 10 per user
-- ================================================

-- User 1: ChessMaster_Alpha (10 visions)
INSERT INTO saved_visualizations (id, user_id, title, image_path, pgn, public_share_id, game_data) VALUES
  ('11111111-0001-0001-0001-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Sunset Clash', 'visualizations/placeholder.png', '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6', 'abc1001', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#2F4F4F", "q": "#556B2F", "r": "#8B4513", "b": "#A0522D", "n": "#6B8E23", "p": "#708090"}, "black": {"k": "#4A0000", "q": "#3D0C02", "r": "#800020", "b": "#722F37", "n": "#960018", "p": "#4E1609"}}}}'),
  ('11111111-0001-0001-0002-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Ocean Depths', 'visualizations/placeholder.png', '1. d4 d5 2. c4 e6 3. Nc3 Nf6', 'abc1002', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#2E8B57", "q": "#3CB371", "r": "#20B2AA", "b": "#48D1CC", "n": "#008B8B", "p": "#5F9EA0"}, "black": {"k": "#191970", "q": "#000080", "r": "#4169E1", "b": "#0000CD", "n": "#6495ED", "p": "#483D8B"}}}}'),
  ('11111111-0001-0001-0003-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Earth Tones', 'visualizations/placeholder.png', '1. e4 c5 2. Nf3 d6 3. d4 cxd4', 'abc1003', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#8B4513", "q": "#A0522D", "r": "#D2691E", "b": "#CD853F", "n": "#DEB887", "p": "#F5DEB3"}, "black": {"k": "#3D2B1F", "q": "#4A3728", "r": "#5D4037", "b": "#6D4C41", "n": "#795548", "p": "#8D6E63"}}}}'),
  ('11111111-0001-0001-0004-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Forest Canopy', 'visualizations/placeholder.png', '1. e4 e6 2. d4 d5 3. Nc3 Bb4', 'abc1004', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#228B22", "q": "#32CD32", "r": "#90EE90", "b": "#98FB98", "n": "#00FA9A", "p": "#7CFC00"}, "black": {"k": "#013220", "q": "#02472A", "r": "#006400", "b": "#355E3B", "n": "#2E8B57", "p": "#3CB371"}}}}'),
  ('11111111-0001-0001-0005-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Copper Age', 'visualizations/placeholder.png', '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7', 'abc1005', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#B87333", "q": "#CD7F32", "r": "#E59866", "b": "#F0B27A", "n": "#EDBB99", "p": "#FAD7A0"}, "black": {"k": "#7B3F00", "q": "#8B4513", "r": "#A0522D", "b": "#CD853F", "n": "#D2691E", "p": "#DEB887"}}}}'),
  ('11111111-0001-0001-0006-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Midnight Purple', 'visualizations/placeholder.png', '1. e4 c6 2. d4 d5 3. Nc3 dxe4', 'abc1006', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#9370DB", "q": "#BA55D3", "r": "#DA70D6", "b": "#EE82EE", "n": "#DDA0DD", "p": "#E6E6FA"}, "black": {"k": "#301934", "q": "#4B0082", "r": "#551A8B", "b": "#663399", "n": "#8B008B", "p": "#9932CC"}}}}'),
  ('11111111-0001-0001-0007-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Rustic Charm', 'visualizations/placeholder.png', '1. Nf3 d5 2. g3 Nf6 3. Bg2 c6', 'abc1007', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#BC8F8F", "q": "#F4A460", "r": "#E9967A", "b": "#FA8072", "n": "#FFA07A", "p": "#FFB6C1"}, "black": {"k": "#800000", "q": "#A52A2A", "r": "#B22222", "b": "#CD5C5C", "n": "#DC143C", "p": "#8B0000"}}}}'),
  ('11111111-0001-0001-0008-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Steel Gray', 'visualizations/placeholder.png', '1. d4 d5 2. Bf4 Nf6 3. e3 c5', 'abc1008', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#708090", "q": "#778899", "r": "#B0C4DE", "b": "#C0C0C0", "n": "#D3D3D3", "p": "#DCDCDC"}, "black": {"k": "#2F4F4F", "q": "#36454F", "r": "#414A4C", "b": "#696969", "n": "#808080", "p": "#A9A9A9"}}}}'),
  ('11111111-0001-0001-0009-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Olive Grove', 'visualizations/placeholder.png', '1. e4 d6 2. d4 Nf6 3. Nc3 g6', 'abc1009', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#808000", "q": "#9ACD32", "r": "#6B8E23", "b": "#556B2F", "n": "#8FBC8F", "p": "#BDB76B"}, "black": {"k": "#3B3C36", "q": "#4A5D23", "r": "#5F6B1F", "b": "#697723", "n": "#778833", "p": "#8B9A46"}}}}'),
  ('11111111-0001-0001-0010-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Slate Dreams', 'visualizations/placeholder.png', '1. c4 e5 2. Nc3 Nf6 3. g3 d5', 'abc1010', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#5F9EA0", "q": "#4682B4", "r": "#6495ED", "b": "#87CEEB", "n": "#ADD8E6", "p": "#B0E0E6"}, "black": {"k": "#1C3A4B", "q": "#274D5E", "r": "#2C5970", "b": "#3A6B82", "n": "#4A7C94", "p": "#5A8DA5"}}}}'
);

-- User 2: VisionCollector42 (10 visions)
INSERT INTO saved_visualizations (id, user_id, title, image_path, pgn, public_share_id, game_data) VALUES
  ('22222222-0002-0002-0001-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Berry Burst', 'visualizations/placeholder.png', '1. e4 e5 2. Bc4 Nf6 3. d3 c6', 'bcd2001', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#8B008B", "q": "#9400D3", "r": "#9932CC", "b": "#BA55D3", "n": "#DA70D6", "p": "#EE82EE"}, "black": {"k": "#4B0082", "q": "#6A0DAD", "r": "#7B68EE", "b": "#9370DB", "n": "#B19CD9", "p": "#D8BFD8"}}}}'),
  ('22222222-0002-0002-0002-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Sandy Beach', 'visualizations/placeholder.png', '1. d4 d5 2. Nf3 Nf6 3. e3 e6', 'bcd2002', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#F4A460", "q": "#FFDEAD", "r": "#FFE4B5", "b": "#FFEFD5", "n": "#FFF8DC", "p": "#FFFAF0"}, "black": {"k": "#8B7355", "q": "#9C8465", "r": "#A68B5B", "b": "#C19A6B", "n": "#D2B48C", "p": "#DEB887"}}}}'),
  ('22222222-0002-0002-0003-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Wine Country', 'visualizations/placeholder.png', '1. e4 c5 2. Nc3 Nc6 3. g3 g6', 'bcd2003', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#722F37", "q": "#8E4585", "r": "#C71585", "b": "#DB7093", "n": "#FF69B4", "p": "#FFB6C1"}, "black": {"k": "#4A0E0E", "q": "#6B1C1C", "r": "#800020", "b": "#960018", "n": "#A52A2A", "p": "#B03060"}}}}'),
  ('22222222-0002-0002-0004-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Mint Fresh', 'visualizations/placeholder.png', '1. Nf3 Nf6 2. c4 c5 3. g3 g6', 'bcd2004', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#98FF98", "q": "#90EE90", "r": "#7FFFD4", "b": "#66CDAA", "n": "#3CB371", "p": "#2E8B57"}, "black": {"k": "#006400", "q": "#228B22", "r": "#32CD32", "b": "#00FF7F", "n": "#00FA9A", "p": "#7CFC00"}}}}'),
  ('22222222-0002-0002-0005-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Mahogany Dreams', 'visualizations/placeholder.png', '1. d4 Nf6 2. Nf3 e6 3. Bf4 b6', 'bcd2005', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#C04000", "q": "#CD5700", "r": "#E07020", "b": "#F08030", "n": "#FF9040", "p": "#FFA050"}, "black": {"k": "#3C1414", "q": "#5C2424", "r": "#6E260E", "b": "#803018", "n": "#964B00", "p": "#A0522D"}}}}'),
  ('22222222-0002-0002-0006-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Arctic Ice', 'visualizations/placeholder.png', '1. e4 e6 2. d3 d5 3. Nd2 Nf6', 'bcd2006', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#E0FFFF", "q": "#AFEEEE", "r": "#B0E0E6", "b": "#87CEFA", "n": "#87CEEB", "p": "#ADD8E6"}, "black": {"k": "#4682B4", "q": "#5F9EA0", "r": "#6495ED", "b": "#4169E1", "n": "#1E90FF", "p": "#00BFFF"}}}}'),
  ('22222222-0002-0002-0007-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Coral Reef', 'visualizations/placeholder.png', '1. c4 Nf6 2. Nc3 e6 3. e4 d5', 'bcd2007', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#FF7F50", "q": "#FF6347", "r": "#FA8072", "b": "#F08080", "n": "#E9967A", "p": "#FFA07A"}, "black": {"k": "#8B0000", "q": "#A52A2A", "r": "#CD5C5C", "b": "#DC143C", "n": "#FF0000", "p": "#FF4500"}}}}'),
  ('22222222-0002-0002-0008-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Lavender Fields', 'visualizations/placeholder.png', '1. d4 d6 2. c4 Nd7 3. Nc3 e5', 'bcd2008', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#E6E6FA", "q": "#D8BFD8", "r": "#DDA0DD", "b": "#EE82EE", "n": "#DA70D6", "p": "#FF00FF"}, "black": {"k": "#800080", "q": "#9400D3", "r": "#9932CC", "b": "#BA55D3", "n": "#8B008B", "p": "#4B0082"}}}}'),
  ('22222222-0002-0002-0009-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Bronze Medal', 'visualizations/placeholder.png', '1. e4 g6 2. d4 Bg7 3. Nc3 d6', 'bcd2009', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#CD7F32", "q": "#B87333", "r": "#A97142", "b": "#996515", "n": "#8C7853", "p": "#8B7355"}, "black": {"k": "#5C4033", "q": "#6B4226", "r": "#7B4A29", "b": "#8B5A2B", "n": "#9B6D30", "p": "#AB8035"}}}}'),
  ('22222222-0002-0002-0010-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Neon Nights', 'visualizations/placeholder.png', '1. e4 c6 2. Nc3 d5 3. Nf3 Bg4', 'bcd2010', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#00FF00", "q": "#00FFFF", "r": "#FF00FF", "b": "#FFFF00", "n": "#FF1493", "p": "#7FFF00"}, "black": {"k": "#006400", "q": "#008B8B", "r": "#8B008B", "b": "#B8860B", "n": "#C71585", "p": "#228B22"}}}}'
);

-- User 3: ArtfulPlayer (10 visions)
INSERT INTO saved_visualizations (id, user_id, title, image_path, pgn, public_share_id, game_data) VALUES
  ('33333333-0003-0003-0001-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Terracotta Army', 'visualizations/placeholder.png', '1. d4 Nf6 2. c4 e6 3. Nf3 b6', 'cde3001', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#E2725B", "q": "#CD5C5C", "r": "#BC8F8F", "b": "#F4A460", "n": "#D2691E", "p": "#DEB887"}, "black": {"k": "#8B4513", "q": "#A0522D", "r": "#6F4E37", "b": "#5D3A1A", "n": "#4A3728", "p": "#3D2B1F"}}}}'),
  ('33333333-0003-0003-0002-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Teal Waters', 'visualizations/placeholder.png', '1. e4 e5 2. Nf3 d6 3. d4 exd4', 'cde3002', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#008080", "q": "#20B2AA", "r": "#40E0D0", "b": "#48D1CC", "n": "#00CED1", "p": "#5F9EA0"}, "black": {"k": "#004D4D", "q": "#006666", "r": "#007F7F", "b": "#009999", "n": "#00B2B2", "p": "#00CCCC"}}}}'),
  ('33333333-0003-0003-0003-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Moss Garden', 'visualizations/placeholder.png', '1. c4 c5 2. Nc3 Nc6 3. g3 g6', 'cde3003', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#8A9A5B", "q": "#8F9779", "r": "#ACB78E", "b": "#BAB86C", "n": "#ADDFAD", "p": "#8FBC8F"}, "black": {"k": "#4A5D23", "q": "#556B2F", "r": "#6B8E23", "b": "#808000", "n": "#9ACD32", "p": "#6B8E23"}}}}'),
  ('33333333-0003-0003-0004-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Plum Blossom', 'visualizations/placeholder.png', '1. d4 d5 2. e3 Nf6 3. Bd3 c5', 'cde3004', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#DDA0DD", "q": "#EE82EE", "r": "#DA70D6", "b": "#FF00FF", "n": "#BA55D3", "p": "#9370DB"}, "black": {"k": "#4B0082", "q": "#6A0DAD", "r": "#8B008B", "b": "#9400D3", "n": "#9932CC", "p": "#800080"}}}}'),
  ('33333333-0003-0003-0005-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Charcoal Sketch', 'visualizations/placeholder.png', '1. Nf3 d5 2. d4 Nf6 3. c4 c6', 'cde3005', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#36454F", "q": "#414A4C", "r": "#4A4A4A", "b": "#555555", "n": "#696969", "p": "#808080"}, "black": {"k": "#1C1C1C", "q": "#2F2F2F", "r": "#3D3D3D", "b": "#4B4B4B", "n": "#595959", "p": "#676767"}}}}'),
  ('33333333-0003-0003-0006-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Salmon Run', 'visualizations/placeholder.png', '1. e4 e5 2. Bc4 Bc5 3. c3 Nf6', 'cde3006', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#FA8072", "q": "#E9967A", "r": "#F08080", "b": "#FFA07A", "n": "#FF7F50", "p": "#FF6347"}, "black": {"k": "#8B0000", "q": "#B22222", "r": "#CD5C5C", "b": "#DC143C", "n": "#DB7093", "p": "#C71585"}}}}'),
  ('33333333-0003-0003-0007-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Indigo Night', 'visualizations/placeholder.png', '1. d4 Nf6 2. Bg5 d5 3. e3 e6', 'cde3007', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#4B0082", "q": "#6F00FF", "r": "#8A2BE2", "b": "#9370DB", "n": "#7B68EE", "p": "#6A5ACD"}, "black": {"k": "#1A0533", "q": "#2E0854", "r": "#3D1F5C", "b": "#4C2882", "n": "#5B3A9F", "p": "#6A4DBD"}}}}'),
  ('33333333-0003-0003-0008-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Peach Sunrise', 'visualizations/placeholder.png', '1. e4 c5 2. c3 d5 3. exd5 Qxd5', 'cde3008', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#FFDAB9", "q": "#FFE4B5", "r": "#FFEBCD", "b": "#FFF8DC", "n": "#FAFAD2", "p": "#FFFACD"}, "black": {"k": "#FF8C00", "q": "#FFA500", "r": "#FFB347", "b": "#FFCC99", "n": "#FFDEAD", "p": "#FFE4C4"}}}}'),
  ('33333333-0003-0003-0009-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Jade Temple', 'visualizations/placeholder.png', '1. d4 d5 2. c4 e6 3. Nc3 c6', 'cde3009', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#00A86B", "q": "#00C78C", "r": "#00FA9A", "b": "#7FFFD4", "n": "#98FF98", "p": "#ADFF2F"}, "black": {"k": "#004B23", "q": "#006633", "r": "#007F5C", "b": "#009966", "n": "#00B37D", "p": "#00CC92"}}}}'),
  ('33333333-0003-0003-0010-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Ash and Ember', 'visualizations/placeholder.png', '1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6', 'cde3010', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#B7410E", "q": "#CC5500", "r": "#E25822", "b": "#FF4500", "n": "#FF6347", "p": "#FF7F50"}, "black": {"k": "#3D0C02", "q": "#4A1004", "r": "#5C1A0A", "b": "#6E260E", "n": "#803000", "p": "#964B00"}}}}'
);

-- User 4: QueenGambitFan (10 visions)
INSERT INTO saved_visualizations (id, user_id, title, image_path, pgn, public_share_id, game_data) VALUES
  ('44444444-0004-0004-0001-444444444444', 'd4444444-4444-4444-4444-444444444444', 'Cherry Blossom', 'visualizations/placeholder.png', '1. d4 d5 2. c4 c6 3. Nf3 Nf6', 'def4001', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#FFB7C5", "q": "#FFC0CB", "r": "#FFD1DC", "b": "#FFDDDD", "n": "#FFE5EC", "p": "#FFF0F5"}, "black": {"k": "#C71585", "q": "#DB7093", "r": "#E75480", "b": "#F08080", "n": "#FF69B4", "p": "#FF1493"}}}}'),
  ('44444444-0004-0004-0002-444444444444', 'd4444444-4444-4444-4444-444444444444', 'Coffee House', 'visualizations/placeholder.png', '1. e4 e5 2. f4 d5 3. exd5 e4', 'def4002', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#6F4E37", "q": "#7B5B3A", "r": "#8B6914", "b": "#A0785A", "n": "#BC8F8F", "p": "#D2B48C"}, "black": {"k": "#3D2B1F", "q": "#4A3728", "r": "#5C4033", "b": "#6E4A3A", "n": "#8B5A2B", "p": "#A0522D"}}}}'),
  ('44444444-0004-0004-0003-444444444444', 'd4444444-4444-4444-4444-444444444444', 'Coral Sunset', 'visualizations/placeholder.png', '1. Nf3 c5 2. c4 Nc6 3. Nc3 g6', 'def4003', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#FF7F50", "q": "#FF6F61", "r": "#FF6347", "b": "#E94E77", "n": "#EC7063", "p": "#F1948A"}, "black": {"k": "#8B0000", "q": "#A52A2A", "r": "#B22222", "b": "#CD5C5C", "n": "#DC143C", "p": "#E74C3C"}}}}'),
  ('44444444-0004-0004-0004-444444444444', 'd4444444-4444-4444-4444-444444444444', 'Emerald City', 'visualizations/placeholder.png', '1. d4 Nf6 2. c4 g6 3. Nc3 d5', 'def4004', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#50C878", "q": "#3CB371", "r": "#2E8B57", "b": "#00FA9A", "n": "#00FF7F", "p": "#98FB98"}, "black": {"k": "#006400", "q": "#008000", "r": "#228B22", "b": "#2E8B57", "n": "#3CB371", "p": "#32CD32"}}}}'),
  ('44444444-0004-0004-0005-444444444444', 'd4444444-4444-4444-4444-444444444444', 'Amber Glow', 'visualizations/placeholder.png', '1. e4 d6 2. d4 g6 3. Nc3 Bg7', 'def4005', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#FFBF00", "q": "#FFC107", "r": "#FFD700", "b": "#FFDF00", "n": "#FFE135", "p": "#FFEC8B"}, "black": {"k": "#B8860B", "q": "#DAA520", "r": "#CD7F32", "b": "#D2691E", "n": "#B87333", "p": "#996515"}}}}'),
  ('44444444-0004-0004-0006-444444444444', 'd4444444-4444-4444-4444-444444444444', 'Blueberry Jam', 'visualizations/placeholder.png', '1. e4 c5 2. Nf3 e6 3. d4 cxd4', 'def4006', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#4F86F7", "q": "#6495ED", "r": "#7B68EE", "b": "#8A2BE2", "n": "#9370DB", "p": "#A9A9F5"}, "black": {"k": "#191970", "q": "#00008B", "r": "#0000CD", "b": "#0000FF", "n": "#1E90FF", "p": "#4169E1"}}}}'),
  ('44444444-0004-0004-0007-444444444444', 'd4444444-4444-4444-4444-444444444444', 'Marsala Wine', 'visualizations/placeholder.png', '1. d4 e6 2. c4 Nf6 3. Nc3 Bb4', 'def4007', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#955251", "q": "#A45A52", "r": "#B16765", "b": "#C68383", "n": "#D4A5A5", "p": "#E8C4C4"}, "black": {"k": "#5E2028", "q": "#722F37", "r": "#7E3A3F", "b": "#8B4748", "n": "#9C575A", "p": "#AD6A6D"}}}}'),
  ('44444444-0004-0004-0008-444444444444', 'd4444444-4444-4444-4444-444444444444', 'Pine Forest', 'visualizations/placeholder.png', '1. c4 e5 2. g3 Nf6 3. Bg2 d5', 'def4008', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#01796F", "q": "#2E8B57", "r": "#355E3B", "b": "#4A7023", "n": "#556B2F", "p": "#6B8E23"}, "black": {"k": "#013220", "q": "#0B3D0B", "r": "#154734", "b": "#1E5631", "n": "#2E7D32", "p": "#388E3C"}}}}'),
  ('44444444-0004-0004-0009-444444444444', 'd4444444-4444-4444-4444-444444444444', 'Mauve Dreams', 'visualizations/placeholder.png', '1. e4 e5 2. Nf3 Nc6 3. d4 exd4', 'def4009', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#E0B0FF", "q": "#D8A2E5", "r": "#CF8FCC", "b": "#C67FBF", "n": "#BD70AE", "p": "#B4619C"}, "black": {"k": "#702963", "q": "#7B3F72", "r": "#865582", "b": "#916B91", "n": "#9C81A1", "p": "#A797B0"}}}}'),
  ('44444444-0004-0004-0010-444444444444', 'd4444444-4444-4444-4444-444444444444', 'Sunset Orange', 'visualizations/placeholder.png', '1. d4 Nf6 2. Nf3 g6 3. Bf4 Bg7', 'def4010', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#FF4500", "q": "#FF5722", "r": "#FF6B35", "b": "#FF7F50", "n": "#FF8C00", "p": "#FFA500"}, "black": {"k": "#8B2500", "q": "#A52A2A", "r": "#B33A00", "b": "#CC4400", "n": "#D35400", "p": "#E55100"}}}}'
);

-- User 5: KnightRider_Chess (10 visions)
INSERT INTO saved_visualizations (id, user_id, title, image_path, pgn, public_share_id, game_data) VALUES
  ('55555555-0005-0005-0001-555555555555', 'e5555555-5555-5555-5555-555555555555', 'Midnight Blue', 'visualizations/placeholder.png', '1. e4 e5 2. Nf3 d6 3. d4 Bg4', 'efg5001', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#191970", "q": "#000080", "r": "#00008B", "b": "#0000CD", "n": "#0000FF", "p": "#4169E1"}, "black": {"k": "#0D0D2B", "q": "#1A1A4A", "r": "#272769", "b": "#343488", "n": "#4141A7", "p": "#4E4EC6"}}}}'),
  ('55555555-0005-0005-0002-555555555555', 'e5555555-5555-5555-5555-555555555555', 'Rose Gold', 'visualizations/placeholder.png', '1. d4 d5 2. c4 e5 3. dxe5 d4', 'efg5002', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#E8B4B8", "q": "#EDC9AF", "r": "#F5D1B9", "b": "#F8DCC5", "n": "#FAE6D2", "p": "#FCF0DF"}, "black": {"k": "#B76E79", "q": "#C08081", "r": "#C99393", "b": "#D2A5A5", "n": "#DBB8B8", "p": "#E4CACA"}}}}'),
  ('55555555-0005-0005-0003-555555555555', 'e5555555-5555-5555-5555-555555555555', 'Sage Wisdom', 'visualizations/placeholder.png', '1. Nf3 Nf6 2. g3 d5 3. Bg2 c6', 'efg5003', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#9DC183", "q": "#ACE1AF", "r": "#B8E0A6", "b": "#C5E1A5", "n": "#D4EDBC", "p": "#E3F4D3"}, "black": {"k": "#4A7023", "q": "#5A8033", "r": "#6A9043", "b": "#7AA053", "n": "#8AB063", "p": "#9AC073"}}}}'),
  ('55555555-0005-0005-0004-555555555555', 'e5555555-5555-5555-5555-555555555555', 'Dusty Rose', 'visualizations/placeholder.png', '1. e4 c5 2. c3 d5 3. exd5 Qxd5', 'efg5004', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#DCAE96", "q": "#E4B8A0", "r": "#ECC2AA", "b": "#F4CCB4", "n": "#FCD6BE", "p": "#FFE0C8"}, "black": {"k": "#BC7A63", "q": "#C48473", "r": "#CC8E83", "b": "#D49893", "n": "#DCA2A3", "p": "#E4ACB3"}}}}'),
  ('55555555-0005-0005-0005-555555555555', 'e5555555-5555-5555-5555-555555555555', 'Copper Patina', 'visualizations/placeholder.png', '1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+', 'efg5005', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#4DB6AC", "q": "#5DBDB3", "r": "#6DC4BA", "b": "#7DCBC1", "n": "#8DD2C8", "p": "#9DD9CF"}, "black": {"k": "#2D7D73", "q": "#3D8780", "r": "#4D918D", "b": "#5D9B9A", "n": "#6DA5A7", "p": "#7DAFB4"}}}}'),
  ('55555555-0005-0005-0006-555555555555', 'e5555555-5555-5555-5555-555555555555', 'Burnt Sienna', 'visualizations/placeholder.png', '1. e4 e5 2. Nf3 Nc6 3. Bb5 f5', 'efg5006', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#E97451", "q": "#EC8664", "r": "#EF9777", "b": "#F2A88A", "n": "#F5B99D", "p": "#F8CAB0"}, "black": {"k": "#A04020", "q": "#AB5030", "r": "#B66040", "b": "#C17050", "n": "#CC8060", "p": "#D79070"}}}}'),
  ('55555555-0005-0005-0007-555555555555', 'e5555555-5555-5555-5555-555555555555', 'Turquoise Sea', 'visualizations/placeholder.png', '1. c4 Nf6 2. g3 e6 3. Bg2 d5', 'efg5007', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#30D5C8", "q": "#40DFD2", "r": "#50E9DC", "b": "#60F3E6", "n": "#70FDF0", "p": "#80FFFA"}, "black": {"k": "#008B8B", "q": "#109595", "r": "#209F9F", "b": "#30A9A9", "n": "#40B3B3", "p": "#50BDBD"}}}}'),
  ('55555555-0005-0005-0008-555555555555', 'e5555555-5555-5555-5555-555555555555', 'Warm Taupe', 'visualizations/placeholder.png', '1. d4 d5 2. Bf4 c5 3. e3 Nc6', 'efg5008', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#B99E8A", "q": "#C4A994", "r": "#CFB49E", "b": "#DABFA8", "n": "#E5CAB2", "p": "#F0D5BC"}, "black": {"k": "#8D7B68", "q": "#978578", "r": "#A18F88", "b": "#AB9998", "n": "#B5A3A8", "p": "#BFADB8"}}}}'),
  ('55555555-0005-0005-0009-555555555555', 'e5555555-5555-5555-5555-555555555555', 'Electric Lime', 'visualizations/placeholder.png', '1. e4 e6 2. d4 d5 3. e5 c5', 'efg5009', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#CCFF00", "q": "#D4FF33", "r": "#DCFF66", "b": "#E4FF99", "n": "#ECFFCC", "p": "#F4FFFF"}, "black": {"k": "#66AA00", "q": "#77BB11", "r": "#88CC22", "b": "#99DD33", "n": "#AAEE44", "p": "#BBFF55"}}}}'),
  ('55555555-0005-0005-0010-555555555555', 'e5555555-5555-5555-5555-555555555555', 'Brick Red', 'visualizations/placeholder.png', '1. d4 Nf6 2. c4 c5 3. d5 b5', 'efg5010', '{"palette": "custom", "visualizationState": {"customColors": {"white": {"k": "#CB4154", "q": "#D55464", "r": "#DF6774", "b": "#E97A84", "n": "#F38D94", "p": "#FDA0A4"}, "black": {"k": "#8B0000", "q": "#9B1010", "r": "#AB2020", "b": "#BB3030", "n": "#CB4040", "p": "#DB5050"}}}}'
);

-- ================================================
-- 5 PREMIUM EN PENSENT BRANDED VISIONS
-- Using official palettes and famous games
-- Owned by CEO: 2029eb39-ff40-416f-8b07-f065964ff8eb
-- ================================================

INSERT INTO saved_visualizations (id, user_id, title, image_path, pgn, public_share_id, game_data) VALUES
  -- Hot & Cold palette with Kasparov's Immortal
  ('eeeeeeee-0001-0001-0001-eeeeeeeeeeee', '2029eb39-ff40-416f-8b07-f065964ff8eb', 'Kasparov''s Immortal - Official En Pensent Edition', 'visualizations/placeholder.png', 
   '1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0',
   'ENPNT01', 
   '{"palette": "hotCold", "brandedVision": true, "visualizationState": {"paletteId": "hotCold"}}'),
  
  -- Medieval palette with Game of the Century
  ('eeeeeeee-0001-0001-0002-eeeeeeeeeeee', '2029eb39-ff40-416f-8b07-f065964ff8eb', 'Game of the Century - Official En Pensent Edition', 'visualizations/placeholder.png',
   '1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1',
   'ENPNT02',
   '{"palette": "medieval", "brandedVision": true, "visualizationState": {"paletteId": "medieval"}}'),
  
  -- Egyptian palette with The Immortal Game
  ('eeeeeeee-0001-0001-0003-eeeeeeeeeeee', '2029eb39-ff40-416f-8b07-f065964ff8eb', 'The Immortal Game - Official En Pensent Edition', 'visualizations/placeholder.png',
   '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0',
   'ENPNT03',
   '{"palette": "egyptian", "brandedVision": true, "visualizationState": {"paletteId": "egyptian"}}'),
  
  -- Japanese palette with The Opera Game
  ('eeeeeeee-0001-0001-0004-eeeeeeeeeeee', '2029eb39-ff40-416f-8b07-f065964ff8eb', 'The Opera Game - Official En Pensent Edition', 'visualizations/placeholder.png',
   '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0',
   'ENPNT04',
   '{"palette": "japanese", "brandedVision": true, "visualizationState": {"paletteId": "japanese"}}'),
  
  -- Cosmic palette with Fischer's Masterpiece
  ('eeeeeeee-0001-0001-0005-eeeeeeeeeeee', '2029eb39-ff40-416f-8b07-f065964ff8eb', 'Fischer''s Masterpiece - Official En Pensent Edition', 'visualizations/placeholder.png',
   '1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4 1-0',
   'ENPNT05',
   '{"palette": "cosmic", "brandedVision": true, "visualizationState": {"paletteId": "cosmic"}}');

-- ================================================
-- VISION SCORES for all 55 visions
-- Non-branded: 0.5-8.0 score range
-- Branded: 100-400 score range
-- ================================================

-- Non-branded vision scores (50 visions with varied realistic engagement)
INSERT INTO vision_scores (visualization_id, view_count, download_hd_count, download_gif_count, trade_count, print_order_count, print_revenue_cents, unique_viewers, total_score) VALUES
  -- User 1 visions
  ('11111111-0001-0001-0001-111111111111', 45, 3, 1, 0, 0, 0, 32, 0.95),
  ('11111111-0001-0001-0002-111111111111', 78, 5, 2, 0, 0, 0, 56, 1.53),
  ('11111111-0001-0001-0003-111111111111', 23, 1, 0, 0, 0, 0, 18, 0.33),
  ('11111111-0001-0001-0004-111111111111', 156, 12, 4, 1, 0, 0, 98, 3.76),
  ('11111111-0001-0001-0005-111111111111', 34, 2, 1, 0, 0, 0, 25, 0.69),
  ('11111111-0001-0001-0006-111111111111', 89, 7, 3, 0, 1, 2500, 67, 4.64),
  ('11111111-0001-0001-0007-111111111111', 12, 0, 0, 0, 0, 0, 10, 0.12),
  ('11111111-0001-0001-0008-111111111111', 203, 15, 6, 2, 1, 3500, 145, 7.88),
  ('11111111-0001-0001-0009-111111111111', 67, 4, 2, 0, 0, 0, 48, 1.37),
  ('11111111-0001-0001-0010-111111111111', 134, 9, 3, 1, 0, 0, 89, 3.19),
  -- User 2 visions
  ('22222222-0002-0002-0001-222222222222', 56, 4, 1, 0, 0, 0, 41, 0.96),
  ('22222222-0002-0002-0002-222222222222', 112, 8, 3, 0, 0, 0, 78, 1.87),
  ('22222222-0002-0002-0003-222222222222', 29, 2, 1, 0, 0, 0, 22, 0.54),
  ('22222222-0002-0002-0004-222222222222', 178, 14, 5, 1, 1, 2900, 123, 6.53),
  ('22222222-0002-0002-0005-222222222222', 41, 3, 1, 0, 0, 0, 31, 0.76),
  ('22222222-0002-0002-0006-222222222222', 95, 6, 2, 0, 0, 0, 68, 1.55),
  ('22222222-0002-0002-0007-222222222222', 18, 1, 0, 0, 0, 0, 14, 0.28),
  ('22222222-0002-0002-0008-222222222222', 167, 11, 4, 1, 0, 0, 112, 3.67),
  ('22222222-0002-0002-0009-222222222222', 73, 5, 2, 0, 0, 0, 52, 1.48),
  ('22222222-0002-0002-0010-222222222222', 145, 10, 4, 1, 1, 3200, 97, 6.45),
  -- User 3 visions
  ('33333333-0003-0003-0001-333333333333', 38, 2, 1, 0, 0, 0, 28, 0.63),
  ('33333333-0003-0003-0002-333333333333', 121, 9, 3, 0, 0, 0, 85, 1.96),
  ('33333333-0003-0003-0003-333333333333', 52, 3, 1, 0, 0, 0, 38, 0.87),
  ('33333333-0003-0003-0004-333333333333', 189, 15, 6, 2, 1, 4100, 134, 9.39),
  ('33333333-0003-0003-0005-333333333333', 27, 1, 0, 0, 0, 0, 21, 0.37),
  ('33333333-0003-0003-0006-333333333333', 84, 6, 2, 0, 0, 0, 61, 1.44),
  ('33333333-0003-0003-0007-333333333333', 15, 1, 0, 0, 0, 0, 12, 0.25),
  ('33333333-0003-0003-0008-333333333333', 156, 12, 4, 1, 0, 0, 105, 3.46),
  ('33333333-0003-0003-0009-333333333333', 63, 4, 2, 0, 0, 0, 46, 1.23),
  ('33333333-0003-0003-0010-333333333333', 198, 16, 7, 2, 2, 5800, 142, 13.73),
  -- User 4 visions
  ('44444444-0004-0004-0001-444444444444', 47, 3, 1, 0, 0, 0, 35, 0.82),
  ('44444444-0004-0004-0002-444444444444', 132, 10, 4, 1, 0, 0, 91, 3.32),
  ('44444444-0004-0004-0003-444444444444', 35, 2, 1, 0, 0, 0, 26, 0.60),
  ('44444444-0004-0004-0004-444444444444', 176, 14, 5, 1, 1, 3700, 121, 7.51),
  ('44444444-0004-0004-0005-444444444444', 58, 4, 1, 0, 0, 0, 43, 0.93),
  ('44444444-0004-0004-0006-444444444444', 103, 7, 3, 0, 0, 0, 74, 1.78),
  ('44444444-0004-0004-0007-444444444444', 21, 1, 1, 0, 0, 0, 16, 0.46),
  ('44444444-0004-0004-0008-444444444444', 144, 11, 4, 1, 0, 0, 98, 3.44),
  ('44444444-0004-0004-0009-444444444444', 76, 5, 2, 0, 0, 0, 55, 1.26),
  ('44444444-0004-0004-0010-444444444444', 167, 13, 5, 1, 1, 4200, 115, 8.17),
  -- User 5 visions
  ('55555555-0005-0005-0001-555555555555', 42, 3, 1, 0, 0, 0, 31, 0.77),
  ('55555555-0005-0005-0002-555555555555', 98, 7, 2, 0, 0, 0, 69, 1.48),
  ('55555555-0005-0005-0003-555555555555', 31, 2, 1, 0, 0, 0, 24, 0.56),
  ('55555555-0005-0005-0004-555555555555', 153, 12, 4, 1, 0, 0, 106, 3.33),
  ('55555555-0005-0005-0005-555555555555', 49, 3, 1, 0, 0, 0, 36, 0.79),
  ('55555555-0005-0005-0006-555555555555', 117, 8, 3, 0, 1, 2800, 82, 5.02),
  ('55555555-0005-0005-0007-555555555555', 19, 1, 0, 0, 0, 0, 15, 0.29),
  ('55555555-0005-0005-0008-555555555555', 171, 13, 5, 1, 1, 3900, 118, 7.96),
  ('55555555-0005-0005-0009-555555555555', 65, 4, 2, 0, 0, 0, 47, 1.15),
  ('55555555-0005-0005-0010-555555555555', 142, 10, 4, 1, 0, 0, 95, 3.42);

-- Premium branded vision scores (high engagement - 100-400 score range)
INSERT INTO vision_scores (visualization_id, view_count, download_hd_count, download_gif_count, trade_count, print_order_count, print_revenue_cents, unique_viewers, total_score) VALUES
  ('eeeeeeee-0001-0001-0001-eeeeeeeeeeee', 1856, 142, 68, 12, 28, 84500, 1423, 147.31),
  ('eeeeeeee-0001-0001-0002-eeeeeeeeeeee', 2134, 167, 82, 15, 35, 105200, 1687, 183.04),
  ('eeeeeeee-0001-0001-0003-eeeeeeeeeeee', 1567, 121, 54, 9, 22, 66800, 1234, 115.17),
  ('eeeeeeee-0001-0001-0004-eeeeeeeeeeee', 1923, 153, 71, 11, 30, 90600, 1512, 159.53),
  ('eeeeeeee-0001-0001-0005-eeeeeeeeeeee', 2456, 198, 96, 18, 42, 126700, 1945, 225.99);

-- ================================================
-- MARKETPLACE LISTINGS for all 55 visions
-- Non-branded: $1.99 - $9.99
-- Branded: $49.99 - $199.99
-- ================================================

-- Non-branded listings (User 1)
INSERT INTO visualization_listings (id, visualization_id, seller_id, price_cents, status) VALUES
  (gen_random_uuid(), '11111111-0001-0001-0001-111111111111', 'a1111111-1111-1111-1111-111111111111', 299, 'active'),
  (gen_random_uuid(), '11111111-0001-0001-0002-111111111111', 'a1111111-1111-1111-1111-111111111111', 499, 'active'),
  (gen_random_uuid(), '11111111-0001-0001-0003-111111111111', 'a1111111-1111-1111-1111-111111111111', 199, 'active'),
  (gen_random_uuid(), '11111111-0001-0001-0004-111111111111', 'a1111111-1111-1111-1111-111111111111', 799, 'active'),
  (gen_random_uuid(), '11111111-0001-0001-0005-111111111111', 'a1111111-1111-1111-1111-111111111111', 349, 'active'),
  (gen_random_uuid(), '11111111-0001-0001-0006-111111111111', 'a1111111-1111-1111-1111-111111111111', 599, 'active'),
  (gen_random_uuid(), '11111111-0001-0001-0007-111111111111', 'a1111111-1111-1111-1111-111111111111', 199, 'active'),
  (gen_random_uuid(), '11111111-0001-0001-0008-111111111111', 'a1111111-1111-1111-1111-111111111111', 999, 'active'),
  (gen_random_uuid(), '11111111-0001-0001-0009-111111111111', 'a1111111-1111-1111-1111-111111111111', 449, 'active'),
  (gen_random_uuid(), '11111111-0001-0001-0010-111111111111', 'a1111111-1111-1111-1111-111111111111', 699, 'active');

-- Non-branded listings (User 2)
INSERT INTO visualization_listings (id, visualization_id, seller_id, price_cents, status) VALUES
  (gen_random_uuid(), '22222222-0002-0002-0001-222222222222', 'b2222222-2222-2222-2222-222222222222', 299, 'active'),
  (gen_random_uuid(), '22222222-0002-0002-0002-222222222222', 'b2222222-2222-2222-2222-222222222222', 549, 'active'),
  (gen_random_uuid(), '22222222-0002-0002-0003-222222222222', 'b2222222-2222-2222-2222-222222222222', 249, 'active'),
  (gen_random_uuid(), '22222222-0002-0002-0004-222222222222', 'b2222222-2222-2222-2222-222222222222', 849, 'active'),
  (gen_random_uuid(), '22222222-0002-0002-0005-222222222222', 'b2222222-2222-2222-2222-222222222222', 349, 'active'),
  (gen_random_uuid(), '22222222-0002-0002-0006-222222222222', 'b2222222-2222-2222-2222-222222222222', 499, 'active'),
  (gen_random_uuid(), '22222222-0002-0002-0007-222222222222', 'b2222222-2222-2222-2222-222222222222', 199, 'active'),
  (gen_random_uuid(), '22222222-0002-0002-0008-222222222222', 'b2222222-2222-2222-2222-222222222222', 749, 'active'),
  (gen_random_uuid(), '22222222-0002-0002-0009-222222222222', 'b2222222-2222-2222-2222-222222222222', 449, 'active'),
  (gen_random_uuid(), '22222222-0002-0002-0010-222222222222', 'b2222222-2222-2222-2222-222222222222', 899, 'active');

-- Non-branded listings (User 3)
INSERT INTO visualization_listings (id, visualization_id, seller_id, price_cents, status) VALUES
  (gen_random_uuid(), '33333333-0003-0003-0001-333333333333', 'c3333333-3333-3333-3333-333333333333', 299, 'active'),
  (gen_random_uuid(), '33333333-0003-0003-0002-333333333333', 'c3333333-3333-3333-3333-333333333333', 599, 'active'),
  (gen_random_uuid(), '33333333-0003-0003-0003-333333333333', 'c3333333-3333-3333-3333-333333333333', 349, 'active'),
  (gen_random_uuid(), '33333333-0003-0003-0004-333333333333', 'c3333333-3333-3333-3333-333333333333', 999, 'active'),
  (gen_random_uuid(), '33333333-0003-0003-0005-333333333333', 'c3333333-3333-3333-3333-333333333333', 249, 'active'),
  (gen_random_uuid(), '33333333-0003-0003-0006-333333333333', 'c3333333-3333-3333-3333-333333333333', 499, 'active'),
  (gen_random_uuid(), '33333333-0003-0003-0007-333333333333', 'c3333333-3333-3333-3333-333333333333', 199, 'active'),
  (gen_random_uuid(), '33333333-0003-0003-0008-333333333333', 'c3333333-3333-3333-3333-333333333333', 699, 'active'),
  (gen_random_uuid(), '33333333-0003-0003-0009-333333333333', 'c3333333-3333-3333-3333-333333333333', 399, 'active'),
  (gen_random_uuid(), '33333333-0003-0003-0010-333333333333', 'c3333333-3333-3333-3333-333333333333', 999, 'active');

-- Non-branded listings (User 4)
INSERT INTO visualization_listings (id, visualization_id, seller_id, price_cents, status) VALUES
  (gen_random_uuid(), '44444444-0004-0004-0001-444444444444', 'd4444444-4444-4444-4444-444444444444', 349, 'active'),
  (gen_random_uuid(), '44444444-0004-0004-0002-444444444444', 'd4444444-4444-4444-4444-444444444444', 699, 'active'),
  (gen_random_uuid(), '44444444-0004-0004-0003-444444444444', 'd4444444-4444-4444-4444-444444444444', 299, 'active'),
  (gen_random_uuid(), '44444444-0004-0004-0004-444444444444', 'd4444444-4444-4444-4444-444444444444', 899, 'active'),
  (gen_random_uuid(), '44444444-0004-0004-0005-444444444444', 'd4444444-4444-4444-4444-444444444444', 399, 'active'),
  (gen_random_uuid(), '44444444-0004-0004-0006-444444444444', 'd4444444-4444-4444-4444-444444444444', 549, 'active'),
  (gen_random_uuid(), '44444444-0004-0004-0007-444444444444', 'd4444444-4444-4444-4444-444444444444', 249, 'active'),
  (gen_random_uuid(), '44444444-0004-0004-0008-444444444444', 'd4444444-4444-4444-4444-444444444444', 749, 'active'),
  (gen_random_uuid(), '44444444-0004-0004-0009-444444444444', 'd4444444-4444-4444-4444-444444444444', 449, 'active'),
  (gen_random_uuid(), '44444444-0004-0004-0010-444444444444', 'd4444444-4444-4444-4444-444444444444', 949, 'active');

-- Non-branded listings (User 5)
INSERT INTO visualization_listings (id, visualization_id, seller_id, price_cents, status) VALUES
  (gen_random_uuid(), '55555555-0005-0005-0001-555555555555', 'e5555555-5555-5555-5555-555555555555', 299, 'active'),
  (gen_random_uuid(), '55555555-0005-0005-0002-555555555555', 'e5555555-5555-5555-5555-555555555555', 499, 'active'),
  (gen_random_uuid(), '55555555-0005-0005-0003-555555555555', 'e5555555-5555-5555-5555-555555555555', 249, 'active'),
  (gen_random_uuid(), '55555555-0005-0005-0004-555555555555', 'e5555555-5555-5555-5555-555555555555', 749, 'active'),
  (gen_random_uuid(), '55555555-0005-0005-0005-555555555555', 'e5555555-5555-5555-5555-555555555555', 349, 'active'),
  (gen_random_uuid(), '55555555-0005-0005-0006-555555555555', 'e5555555-5555-5555-5555-555555555555', 649, 'active'),
  (gen_random_uuid(), '55555555-0005-0005-0007-555555555555', 'e5555555-5555-5555-5555-555555555555', 199, 'active'),
  (gen_random_uuid(), '55555555-0005-0005-0008-555555555555', 'e5555555-5555-5555-5555-555555555555', 899, 'active'),
  (gen_random_uuid(), '55555555-0005-0005-0009-555555555555', 'e5555555-5555-5555-5555-555555555555', 399, 'active'),
  (gen_random_uuid(), '55555555-0005-0005-0010-555555555555', 'e5555555-5555-5555-5555-555555555555', 749, 'active');

-- Premium branded listings (CEO)
INSERT INTO visualization_listings (id, visualization_id, seller_id, price_cents, status) VALUES
  (gen_random_uuid(), 'eeeeeeee-0001-0001-0001-eeeeeeeeeeee', '2029eb39-ff40-416f-8b07-f065964ff8eb', 14999, 'active'),
  (gen_random_uuid(), 'eeeeeeee-0001-0001-0002-eeeeeeeeeeee', '2029eb39-ff40-416f-8b07-f065964ff8eb', 19999, 'active'),
  (gen_random_uuid(), 'eeeeeeee-0001-0001-0003-eeeeeeeeeeee', '2029eb39-ff40-416f-8b07-f065964ff8eb', 9999, 'active'),
  (gen_random_uuid(), 'eeeeeeee-0001-0001-0004-eeeeeeeeeeee', '2029eb39-ff40-416f-8b07-f065964ff8eb', 12999, 'active'),
  (gen_random_uuid(), 'eeeeeeee-0001-0001-0005-eeeeeeeeeeee', '2029eb39-ff40-416f-8b07-f065964ff8eb', 24999, 'active');