
"use client";

import { useState } from "react";
import { Share2, Copy, MessageCircle, Mail, Link } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ShareMaterialModal({ isOpen, onClose, resource }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!resource) return null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/resource/${resource.id}`;
  const shareText = `Check out this resource: ${resource.title} - ${resource.price === 0 ? 'Free' : `₦${resource.price.toLocaleString()}`}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out: ${resource.title}`);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share Resource</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Resource Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-sm mb-1">{resource.title}</h3>
            <p className="text-xs text-gray-600">{resource.department} • Level {resource.level}</p>
            <p className="text-sm font-bold text-blue-600 mt-1">
              {resource.price === 0 ? 'Free' : `₦${resource.price.toLocaleString()}`}
            </p>
          </div>

          {/* Share URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex space-x-2">
              <Input value={shareUrl} readOnly className="text-xs" />
              <Button onClick={handleCopyLink} variant="outline" size="sm">
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Share Options */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleWhatsAppShare} variant="outline" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </Button>
            
            <Button onClick={handleEmailShare} variant="outline" className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </Button>
            
            <Button onClick={handleNativeShare} variant="outline" className="flex items-center space-x-2 col-span-2">
              <Share2 className="w-4 h-4" />
              <span>More Options</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
