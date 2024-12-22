import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerEmail?: string;
}

export function PaymentSuccessModal({
  isOpen,
  onClose,
  customerEmail,
}: PaymentSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6 bg-white">
        <div className="flex flex-col items-center text-center gap-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <h2 className="text-xl font-semibold">Payment Successful!</h2>
          <p className="text-gray-600">
            Your credits have been added to your account. You can now continue
            using the service.
          </p>
          {customerEmail && (
            <p className="text-sm text-gray-500">
              Logged in as: {customerEmail}
            </p>
          )}
          <Button
            onClick={onClose}
            className="w-full bg-green-50 hover:bg-green-100 text-green-900 border border-green-200"
          >
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}
