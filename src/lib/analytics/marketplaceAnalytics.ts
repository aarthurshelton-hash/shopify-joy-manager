import { supabase } from '@/integrations/supabase/client';

export type MarketplaceClickType = 
  | 'listing_card'
  | 'trending_vision'
  | 'claimable_vision'
  | 'book_showcase'
  | 'filter_change'
  | 'category_change'
  | 'sort_change'
  | 'search'
  | 'tab_change'
  | 'claim_button'
  | 'view_details';

interface ClickEvent {
  click_type: MarketplaceClickType;
  listing_id?: string;
  visualization_id?: string;
  section?: string;
  metadata?: Record<string, unknown>;
}

// Track marketplace click analytics
export async function trackMarketplaceClick(event: ClickEvent): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Record as a vision interaction if we have a visualization_id
    if (event.visualization_id) {
      await supabase.rpc('record_vision_interaction', {
        p_visualization_id: event.visualization_id,
        p_interaction_type: `marketplace_${event.click_type}`,
        p_user_id: user?.id || null,
        p_ip_hash: null,
        p_value_cents: null,
      });
    }

    // Also log to security audit for detailed analytics
    await supabase.rpc('log_security_event', {
      p_action_type: `marketplace_click_${event.click_type}`,
      p_action_category: 'analytics',
      p_user_id: user?.id || null,
      p_target_id: event.listing_id || event.visualization_id || null,
      p_target_type: event.listing_id ? 'listing' : event.visualization_id ? 'visualization' : null,
      p_severity: 'info',
      p_metadata: {
        click_type: event.click_type,
        section: event.section,
        ...event.metadata,
      },
    });
  } catch (error) {
    // Fail silently - analytics should not break user experience
    console.debug('Analytics tracking failed:', error);
  }
}

// Track section engagement (e.g., time spent, scroll depth)
export async function trackSectionView(section: string, durationMs?: number): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.rpc('log_security_event', {
      p_action_type: 'marketplace_section_view',
      p_action_category: 'analytics',
      p_user_id: user?.id || null,
      p_severity: 'info',
      p_metadata: {
        section,
        duration_ms: durationMs,
      },
    });
  } catch (error) {
    console.debug('Section view tracking failed:', error);
  }
}

// Get marketplace analytics summary (for admin dashboard)
export async function getMarketplaceAnalytics(days: number = 7): Promise<{
  data: {
    click_type: string;
    count: number;
    unique_users: number;
  }[];
  error: Error | null;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('action_type, user_id')
      .eq('action_category', 'analytics')
      .like('action_type', 'marketplace_%')
      .gte('created_at', startDate.toISOString());
    
    if (error) throw error;
    
    // Aggregate the data
    const aggregated = new Map<string, { count: number; users: Set<string> }>();
    
    (data || []).forEach(row => {
      const clickType = row.action_type.replace('marketplace_click_', '');
      if (!aggregated.has(clickType)) {
        aggregated.set(clickType, { count: 0, users: new Set() });
      }
      const entry = aggregated.get(clickType)!;
      entry.count++;
      if (row.user_id) {
        entry.users.add(row.user_id);
      }
    });
    
    const result = Array.from(aggregated.entries()).map(([click_type, data]) => ({
      click_type,
      count: data.count,
      unique_users: data.users.size,
    }));
    
    return { data: result, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}
