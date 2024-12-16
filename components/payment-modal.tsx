import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PaymentModal({ isOpen, onClose, onConfirm }: PaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4">Out of Credits</h2>
        <p className="text-gray-600 mb-6">
          You've run out of credits. Purchase 60 more credits for $4.99 to continue using the service.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200"
          >
            Purchase Credits
          </Button>
        </div>
      </Card>
    </div>
  );
}