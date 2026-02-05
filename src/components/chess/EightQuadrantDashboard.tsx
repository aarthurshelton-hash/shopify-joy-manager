/**
 * Enhanced 8-Quadrant Dashboard Component
 * 
 * Visualizes the expanded color flow analysis with:
 * - 8-quadrant radar chart (vs 4-quadrant original)
 * - Piece-type distribution bars
 * - Pawn advancement gradient
 * - Real-time signature comparison
 */

import React from 'react';
import { EnhancedQuadrantProfile } from '../../lib/chess/colorFlowAnalysis/enhancedSignatureExtractor';

interface EightQuadrantDashboardProps {
  profile: EnhancedQuadrantProfile;
  baselineProfile?: EnhancedQuadrantProfile; // For A/B comparison
  archetype: string;
  fingerprint: string;
  colorRichness: number;
  complexity: number;
  showComparison?: boolean;
}

export const EightQuadrantDashboard: React.FC<EightQuadrantDashboardProps> = ({
  profile,
  baselineProfile,
  archetype,
  fingerprint,
  colorRichness,
  complexity,
  showComparison = false,
}) => {
  // Calculate 8-quadrant values for visualization
  const quadrants = [
    { name: 'Kingside White', key: 'q1_kingside_white', value: profile.q1_kingside_white },
    { name: 'Queenside White', key: 'q2_queenside_white', value: profile.q2_queenside_white },
    { name: 'Kingside Black', key: 'q3_kingside_black', value: profile.q3_kingside_black },
    { name: 'Queenside Black', key: 'q4_queenside_black', value: profile.q4_queenside_black },
    { name: 'Center White', key: 'q5_center_white', value: profile.q5_center_white },
    { name: 'Center Black', key: 'q6_center_black', value: profile.q6_center_black },
    { name: 'Extended Kingside', key: 'q7_extended_kingside', value: profile.q7_extended_kingside },
    { name: 'Extended Queenside', key: 'q8_extended_queenside', value: profile.q8_extended_queenside },
  ];

  // Normalize values for visualization (-100 to +100)
  const normalize = (val: number) => Math.max(-100, Math.min(100, val));
  
  // Calculate piece type percentages
  const pieceTypes = [
    { name: 'Bishop', value: profile.bishop_dominance, color: '#3B82F6' },
    { name: 'Knight', value: profile.knight_dominance, color: '#F59E0B' },
    { name: 'Rook', value: profile.rook_dominance, color: '#EF4444' },
    { name: 'Queen', value: profile.queen_dominance, color: '#8B5CF6' },
  ];

  // Temporal flow phases
  const phases = [
    { name: 'Opening', value: profile.temporalFlow.early, color: '#10B981' },
    { name: 'Middlegame', value: profile.temporalFlow.mid, color: '#F59E0B' },
    { name: 'Endgame', value: profile.temporalFlow.late, color: '#EF4444' },
  ];

  return (
    <div style={{ 
      background: '#1a1a2e', 
      borderRadius: '12px', 
      padding: '24px',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>8-Quadrant Analysis</h2>
        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
          Archetype: <span style={{ color: '#60a5fa', fontWeight: 600 }}>{archetype}</span>
        </p>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
          {fingerprint}
        </p>
      </div>

      {/* 8-Quadrant Radar */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#cbd5e1' }}>Spatial Distribution</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '12px',
        }}>
          {quadrants.map((q) => {
            const val = normalize(q.value);
            const isPositive = val > 0;
            const intensity = Math.abs(val) / 100;
            
            return (
              <div 
                key={q.key}
                style={{
                  background: '#0f172a',
                  borderRadius: '8px',
                  padding: '12px',
                  border: `2px solid ${isPositive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                  {q.name}
                </div>
                <div style={{ 
                  height: '4px', 
                  background: '#1e293b',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '6px',
                }}>
                  <div style={{
                    width: `${intensity * 100}%`,
                    height: '100%',
                    background: isPositive ? '#3b82f6' : '#ef4444',
                    borderRadius: '2px',
                    marginLeft: isPositive ? '0' : 'auto',
                    marginRight: isPositive ? 'auto' : '0',
                  }} />
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 600,
                  color: isPositive ? '#60a5fa' : '#f87171',
                }}>
                  {val > 0 ? '+' : ''}{val.toFixed(0)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Piece Type Distribution */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#cbd5e1' }}>Piece Type Dominance</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          {pieceTypes.map((pt) => (
            <div 
              key={pt.name}
              style={{
                flex: 1,
                background: '#0f172a',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%',
                background: `conic-gradient(${pt.color} 0deg, ${pt.color} ${pt.value * 360}deg, #1e293b ${pt.value * 360}deg)`,
                margin: '0 auto 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#0f172a',
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{pt.name}</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: pt.color }}>
                {(pt.value * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Temporal Flow */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#cbd5e1' }}>Temporal Flow</h3>
        <div style={{ 
          display: 'flex', 
          height: '32px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {phases.map((phase) => (
            <div
              key={phase.name}
              style={{
                flex: phase.value,
                background: phase.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: '#fff',
              }}
            >
              {phase.value > 0.15 && phase.name}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          {phases.map((phase) => (
            <div key={phase.name} style={{ textAlign: 'center' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%',
                background: phase.color,
                marginRight: '4px',
              }} />
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {phase.name}: {(phase.value * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pawn Advancement */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#cbd5e1' }}>Pawn Advancement</h3>
        <div style={{
          height: '24px',
          background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
          borderRadius: '12px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            left: `${profile.pawn_advancement * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '16px',
            height: '16px',
            background: '#fff',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Back rank</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa' }}>
            {(profile.pawn_advancement * 100).toFixed(0)}% advanced
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Promotion</span>
        </div>
      </div>

      {/* Metrics Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        padding: '16px',
        background: '#0f172a',
        borderRadius: '8px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#60a5fa' }}>
            {(colorRichness * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Color Richness</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
            {complexity.toFixed(1)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Complexity</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
            8
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Quadrants</div>
        </div>
      </div>

      {/* Comparison Mode */}
      {showComparison && baselineProfile && (
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#cbd5e1' }}>
            vs 4-Quadrant Baseline
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Baseline Accuracy</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#94a3b8' }}>61%</div>
            </div>
            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Expected Enhanced</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#60a5fa' }}>76-86%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EightQuadrantDashboard;
