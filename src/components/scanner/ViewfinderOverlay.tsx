import { motion } from "framer-motion";

interface ViewfinderOverlayProps {
  scanning?: boolean;
}

export function ViewfinderOverlay({ scanning = false }: ViewfinderOverlayProps) {
  const cornerSize = 40;
  const cornerThickness = 4;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Darkened corners overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/40" style={{
          clipPath: `polygon(
            0 0, 100% 0, 100% 100%, 0 100%, 0 0,
            12.5% 12.5%, 12.5% 87.5%, 87.5% 87.5%, 87.5% 12.5%, 12.5% 12.5%
          )`
        }} />
      </div>
      
      {/* Scanning target area indicator */}
      <div className="absolute left-[12.5%] top-[12.5%] right-[12.5%] bottom-[12.5%]">
        {/* Corner brackets */}
        {/* Top Left */}
        <motion.div
          className="absolute top-0 left-0"
          animate={scanning ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div 
            className="absolute top-0 left-0 bg-primary"
            style={{ width: cornerSize, height: cornerThickness }}
          />
          <div 
            className="absolute top-0 left-0 bg-primary"
            style={{ width: cornerThickness, height: cornerSize }}
          />
        </motion.div>
        
        {/* Top Right */}
        <motion.div
          className="absolute top-0 right-0"
          animate={scanning ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        >
          <div 
            className="absolute top-0 right-0 bg-primary"
            style={{ width: cornerSize, height: cornerThickness }}
          />
          <div 
            className="absolute top-0 right-0 bg-primary"
            style={{ width: cornerThickness, height: cornerSize }}
          />
        </motion.div>
        
        {/* Bottom Left */}
        <motion.div
          className="absolute bottom-0 left-0"
          animate={scanning ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        >
          <div 
            className="absolute bottom-0 left-0 bg-primary"
            style={{ width: cornerSize, height: cornerThickness }}
          />
          <div 
            className="absolute bottom-0 left-0 bg-primary"
            style={{ width: cornerThickness, height: cornerSize }}
          />
        </motion.div>
        
        {/* Bottom Right */}
        <motion.div
          className="absolute bottom-0 right-0"
          animate={scanning ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        >
          <div 
            className="absolute bottom-0 right-0 bg-primary"
            style={{ width: cornerSize, height: cornerThickness }}
          />
          <div 
            className="absolute bottom-0 right-0 bg-primary"
            style={{ width: cornerThickness, height: cornerSize }}
          />
        </motion.div>
        
        {/* Center crosshair (subtle) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-[2px] bg-primary/40" />
          <div className="w-[2px] h-8 bg-primary/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        {/* Scanning animation line */}
        {scanning && (
          <motion.div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
            initial={{ top: 0 }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
      
      {/* Positioning hint text */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/80 text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"
        >
          {scanning ? "Analyzing pattern..." : "Position the visualization within the frame"}
        </motion.p>
      </div>
    </div>
  );
}
