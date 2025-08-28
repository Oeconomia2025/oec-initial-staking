import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useCopyToClipboard() {
  const [isCopying, setIsCopying] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    if (isCopying) return;
    
    setIsCopying(true);
    
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard!",
        description: `${text.slice(0, 10)}...${text.slice(-8)} copied successfully`,
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsCopying(false);
    }
  };

  return { copyToClipboard, isCopying };
}
