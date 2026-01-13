import { motion } from "framer-motion";
import { Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface VisionScannerButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function VisionScannerButton({ 
  variant = "outline", 
  size = "default",
  className = "",
  showLabel = true 
}: VisionScannerButtonProps) {
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant={variant}
              size={size}
              className={className}
              onClick={() => navigate('/vision-scanner')}
            >
              <Scan className={showLabel ? "h-4 w-4 mr-2" : "h-4 w-4"} />
              {showLabel && "Scan Vision"}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Scan any En Pensent visualization to find its page</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
