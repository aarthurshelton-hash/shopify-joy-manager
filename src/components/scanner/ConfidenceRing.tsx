import { motion } from "framer-motion";

interface ConfidenceRingProps {
  confidence: number;
  size?: number;
  children?: React.ReactNode;
}

export function ConfidenceRing({ confidence, size = 200, children }: ConfidenceRingProps) {
  // Determine color based on confidence level
  const getColor = () => {
    if (confidence >= 80) return { ring: "stroke-green-500", bg: "bg-green-500/10", text: "text-green-500" };
    if (confidence >= 50) return { ring: "stroke-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-500" };
    return { ring: "stroke-red-500", bg: "bg-red-500/10", text: "text-red-500" };
  };

  const getLabel = () => {
    if (confidence >= 80) return "High Confidence";
    if (confidence >= 50) return "Medium Confidence";
    return "Low Confidence";
  };

  const colors = getColor();
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (confidence / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={colors.ring}
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>

        {/* Inner content */}
        <div className={`absolute inset-2 rounded-full ${colors.bg} overflow-hidden flex items-center justify-center`}>
          {children}
        </div>

        {/* Confidence percentage badge */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-sm font-bold ${colors.bg} ${colors.text} border-2 border-current`}
        >
          {Math.round(confidence)}%
        </motion.div>
      </div>

      {/* Confidence label */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`mt-4 text-sm font-medium ${colors.text}`}
      >
        {getLabel()}
      </motion.p>
    </div>
  );
}
