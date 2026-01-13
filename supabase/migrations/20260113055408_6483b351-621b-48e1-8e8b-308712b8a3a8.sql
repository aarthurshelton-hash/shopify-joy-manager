-- Enable realtime for marketplace tables for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE visualization_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE vision_scores;