-- Performance indexes for 10K+ user scalability

-- Index for user's visualizations lookup (My Vision gallery)
CREATE INDEX IF NOT EXISTS idx_saved_visualizations_user_id 
ON saved_visualizations(user_id);

-- Index for orphaned visualizations (null user_id for claiming)
CREATE INDEX IF NOT EXISTS idx_saved_visualizations_orphaned 
ON saved_visualizations(user_id) WHERE user_id IS NULL;

-- Index for active marketplace listings
CREATE INDEX IF NOT EXISTS idx_visualization_listings_status_created 
ON visualization_listings(status, created_at DESC);

-- Index for listing by visualization (checking if already listed)
CREATE INDEX IF NOT EXISTS idx_visualization_listings_viz_status 
ON visualization_listings(visualization_id, status);

-- Index for seller's listings
CREATE INDEX IF NOT EXISTS idx_visualization_listings_seller 
ON visualization_listings(seller_id, status);

-- Index for vision scores lookup
CREATE INDEX IF NOT EXISTS idx_vision_scores_visualization 
ON vision_scores(visualization_id);

-- Index for vision interactions (royalty calculations)
CREATE INDEX IF NOT EXISTS idx_vision_interactions_visualization 
ON vision_interactions(visualization_id, interaction_type);

-- Index for wallet transactions by user
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user 
ON wallet_transactions(user_id, created_at DESC);

-- Index for profiles by user_id (marketplace seller lookup)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id);