import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useEnPensentPatterns, generateParticlePattern, getFlowAnimation } from '@/hooks/useEnPensentPatterns';
import { TemporalSignature } from '@/lib/pensent-core/types/core';
import { ChessPieceIcon } from './ChessPieceIcon';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

const chessPieces: { type: PieceType; color: PieceColor }[] = [
  { type: 'k', color: 'w' }, { type: 'q', color: 'w' }, { type: 'r', color: 'w' },
  { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'p', color: 'w' },
  { type: 'k', color: 'b' }, { type: 'q', color: 'b' }, { type: 'r', color: 'b' },
  { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'p', color: 'b' },
];

interface EnPensentParticle {
  id: number;
  piece: { type: PieceType; color: PieceColor };
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  color: string;
  flowAnimation: { x: number[]; y: number[]; duration: number };
}

interface ChessParticlesProps {
  signature?: TemporalSignature | null;
  particleCount?: number;
}

const ChessParticles: React.FC<ChessParticlesProps> = ({ 
  signature,
  particleCount = 12 
}) => {
  const pattern = useEnPensentPatterns(signature);
  
  const particles = useMemo<EnPensentParticle[]>(() => {
    const spatialDistribution = generateParticlePattern(pattern.quadrantWeights, particleCount);
    
    return spatialDistribution.map((pos, i) => {
      const flowAnim = getFlowAnimation(pattern.flowDirection, pattern.momentum);
      const useSecondary = Math.random() > 0.6;
      
      return {
        id: i,
        piece: chessPieces[Math.floor(Math.random() * chessPieces.length)],
        left: pos.x,
        top: pos.y,
        delay: Math.random() * 8,
        duration: flowAnim.duration,
        size: 16 + Math.random() * 24 * (1 + pos.weight),
        opacity: 0.03 + pos.weight * 0.08 * pattern.intensity,
        color: useSecondary ? pattern.secondaryColor : pattern.dominantColor,
        flowAnimation: flowAnim
      };
    });
  }, [pattern, particleCount]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            fontSize: `${particle.size}px`,
            opacity: particle.opacity,
            color: particle.color,
            textShadow: `0 0 ${10 * pattern.intensity}px ${particle.color}40`
          }}
          initial={{ y: 0, x: 0 }}
          animate={{
            y: particle.flowAnimation.y,
            x: particle.flowAnimation.x,
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <ChessPieceIcon type={particle.piece.type} color={particle.piece.color} size={particle.size} hexColor={particle.color} opacity={particle.opacity} />
        </motion.div>
      ))}
      
      {/* En Pensent archetype indicator */}
      {signature ? (
        <motion.div
          className="absolute bottom-2 right-2 text-xs font-mono opacity-20"
          style={{ color: pattern.dominantColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
        >
          {pattern.archetype}
        </motion.div>
      ) : null}
    </div>
  );
};

export default ChessParticles;
