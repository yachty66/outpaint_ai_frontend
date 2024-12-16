"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, User } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { PaymentModal } from "@/components/payment-modal";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

export function ImageUpload() {
  const { user, decrementCredits, hasCredits } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const uploadedImageUrl = searchParams.get('uploadedImage');
    const processedImageUrl = searchParams.get('processedImage');
    
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    console.log('Image URLs from params:', { uploadedImageUrl, processedImageUrl });
    
    if (uploadedImageUrl && uploadedImageUrl !== 'undefined') {
      console.log('Setting uploaded image:', uploadedImageUrl);
      setUploadedImage(uploadedImageUrl);
    }
    if (processedImageUrl && processedImageUrl !== 'undefined') {
      console.log('Setting processed image:', processedImageUrl);
      setProcessedImage(processedImageUrl);
    }
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleUploadClick = () => {
    if (!user) {
      handleSignIn();
      return;
    }
    // Reset the file input value
    const fileInput = document.getElementById(
      "file-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    fileInput?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension
    const validExtensions = [".jpg", ".jpeg", ".png"];
    const fileExtension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."));

    if (!validExtensions.includes(fileExtension)) {
      setError("Please upload a PNG or JPG file");
      return;
    }

    // Additional MIME type check
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PNG or JPG file");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const s3Response = await fetch("/api/s3/upload", {
        method: "POST",
        body: formData,
      });

      if (!s3Response.ok) {
        throw new Error(`HTTP error! status: ${s3Response.status}`);
      }

      const s3Data = await s3Response.json();
      
      if (!s3Data.success) {
        throw new Error(s3Data.message);
      }

      // Use direct URL
      setUploadedImage(s3Data.url);
      setCurrentFile(file);

    } catch (error) {
      console.error("Upload failed:", error);
      setUploadedImage(null);
      setCurrentFile(null);
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOutpaintClick = () => {
    if (!user) {
      handleSignIn();
      return;
    }

    if (!hasCredits()) {
      setIsPaymentModalOpen(true);
      return;
    }

    handleOutpaint();
  };

  const handleOutpaint = async () => {
    if (!currentFile || !hasCredits()) return;

    setIsProcessing(true);
    setError(null);
    setCountdown(30);

    // Set up countdown interval
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const formData = new FormData();
      formData.append("file", currentFile);

      const response = await fetch(`http://localhost:8000/api/py/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      setProcessedImage(result.processedImage);
      // Only decrement credits after successful processing
      decrementCredits();
    } catch (error) {
      console.error("Processing failed:", error);
      setError("Failed to process image");
    } finally {
      setIsProcessing(false);
      clearInterval(timer);
      setCountdown(null);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;

    // Create an anchor element and trigger download
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = "outpainted-image.png"; // Default filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStripeCheckout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const authState = {
        userId: user?.id,
        email: user?.email,
        credits: hasCredits(),
        sessionId: session?.access_token,
        currentPath: window.location.pathname,
        uploadedImage: uploadedImage,  // Direct S3 URL
        processedImage: processedImage // Direct S3 URL
      };

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": user?.id || '',
        },
        body: JSON.stringify({
          authState
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      // Store auth state before redirect
      sessionStorage.setItem('pre-checkout-state', JSON.stringify(authState));

      window.location.href = data.url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      setError("Failed to initiate checkout");
    }
  };

  return (
    <>
      <Card className="w-full max-w-[600px] mx-auto bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1),0_12px_24px_rgba(0,0,0,0.1)] border-0">
        <div className="p-6 flex flex-col items-center gap-3">
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <div className="flex flex-col items-center gap-3 w-full">
            {processedImage ? (
              <>
                <div className="relative w-full aspect-square mb-3">
                  <Image
                    src={processedImage}
                    alt="Processed image"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
                <div className="flex flex-col w-full gap-3">
                  <Button
                    variant="outline"
                    className="w-full h-11 border shadow-sm hover:bg-gray-50 text-sm sm:text-base"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Upload Image (PNG or JPG)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 border shadow-sm hover:bg-gray-50 text-sm sm:text-base"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Download Image
                  </Button>
                </div>
              </>
            ) : uploadedImage ? (
              <div className="relative w-full aspect-square mb-3">
                <Image
                  src={uploadedImage}
                  alt="Uploaded image"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-11 border shadow-sm hover:bg-gray-50 text-sm sm:text-base"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                {!user ? (
                  <>
                    <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Sign in to Upload
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Upload Image (PNG or JPG)
                  </>
                )}
              </Button>
            )}

            <Button
              className="w-full h-11 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 text-sm sm:text-base"
              disabled={!uploadedImage || isProcessing}
              onClick={handleOutpaintClick}
            >
              {isProcessing
                ? countdown
                  ? `Processing... ${countdown}s`
                  : "Processing..."
                : "Outpaint"}
            </Button>
          </div>

          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </div>
      </Card>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={() => {
          setIsPaymentModalOpen(false);
          handleStripeCheckout();
        }}
      />
    </>
  );
}
//4242 4242 4242 4242