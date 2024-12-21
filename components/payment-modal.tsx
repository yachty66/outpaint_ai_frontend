import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadedImage?: string | null;
  processedImage?: string | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  uploadedImage,
  processedImage,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleStripeCheckout = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      if (!user?.email) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          uploadedImage,
          processedImage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to initiate checkout"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4">Out of Credits</h2>
        <p className="text-gray-600 mb-6">
          You've run out of credits. Purchase 50 more credits for $4.99 to
          continue using the service.
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStripeCheckout}
            className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Purchase Credits"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
