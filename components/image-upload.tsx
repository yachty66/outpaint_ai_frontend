"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, User } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { PaymentModal } from "@/components/payment-modal";
import { useAuth } from "@/lib/AuthContext";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

export function ImageUpload() {
  const { user, credits, setCredits } = useAuth();
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
    const uploadedImageUrl = searchParams.get("uploadedImage");
    const processedImageUrl = searchParams.get("processedImage");

    console.log("Search params:", Object.fromEntries(searchParams.entries()));

    if (uploadedImageUrl && uploadedImageUrl !== "undefined") {
      setUploadedImage(uploadedImageUrl);
      // Convert the URL back to a File object
      fetch(uploadedImageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "restored-image.png", {
            type: "image/png",
          });
          setCurrentFile(file);
          console.log("Restored file from URL:", file);
        })
        .catch((err) => console.error("Error restoring file:", err));
    }

    if (processedImageUrl && processedImageUrl !== "undefined") {
      setProcessedImage(processedImageUrl);
    }
  }, []);

  useEffect(() => {
    const handleSignOut = () => {
      setUploadedImage(null);
      setProcessedImage(null);
      setCurrentFile(null);
      setError(null);
    };

    window.addEventListener("userSignedOut", handleSignOut);
    return () => window.removeEventListener("userSignedOut", handleSignOut);
  }, []);

  const handleSignIn = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Failed to initiate sign in:", error);
      alert("Failed to sign in. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClick = () => {
    if (!user) {
      handleSignIn();
      return;
    }

    // Only reset the file input value
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

    // Reset states only when we actually have a new file
    setProcessedImage(null);
    setUploadedImage(null);
    setCurrentFile(null);
    setError(null);
    setIsUploading(true);

    // Check file extension
    const validExtensions = [".jpg", ".jpeg", ".png"];
    const fileExtension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."));

    // Check for HEIC explicitly
    if (fileExtension === ".heic") {
      setError("HEIC files are not supported. Please upload a PNG or JPG file");
      setIsUploading(false);
      return;
    }

    if (!validExtensions.includes(fileExtension)) {
      setError("Please upload a PNG or JPG file");
      setIsUploading(false);
      return;
    }

    // Additional MIME type check
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PNG or JPG file");
      setIsUploading(false);
      return;
    }

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
    console.log("calls function for handle outpaint");

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

      // First get the processed image from Python backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/py/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      // Convert base64 to blob
      const base64Response = await fetch(result.processedImage);
      const blob = await base64Response.blob();

      // Create a new FormData for S3 upload
      const s3FormData = new FormData();
      s3FormData.append("file", blob, "outpainted-image.png");

      // Upload to S3
      const s3Response = await fetch("/api/s3/upload", {
        method: "POST",
        body: s3FormData,
      });

      const s3Data = await s3Response.json();

      if (!s3Data.success) {
        throw new Error("Failed to upload processed image to S3");
      }

      // First set the processed image, then clear the uploaded image
      setProcessedImage(s3Data.url);
      setUploadedImage(null);
      await saveGeneration(uploadedImage!, s3Data.url);
      await decrementCredits();
    } catch (error) {
      console.error("Processing failed:", error);
      setError("Failed to process image");
    } finally {
      setIsProcessing(false);
      clearInterval(timer);
      setCountdown(null);
    }
  };

  const handleDownload = async () => {
    if (processedImage) {
      try {
        const response = await fetch(processedImage);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "outpainted-image.png";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error("Download failed:", error);
        setError("Failed to download image");
      }
    }
  };

  const hasCredits = () => credits > 0;

  const decrementCredits = async () => {
    console.log("decrement credits");
    if (!user?.email) return;

    const newCredits = credits - 1;
    const { error } = await supabase
      .from("users")
      .update({ credits: newCredits })
      .eq("email", user.email);

    if (!error) {
      setCredits(newCredits);
    } else {
      console.error("Failed to decrement credits:", error);
    }
  };

  const saveGeneration = async (inputUrl: string, outputUrl: string) => {
    if (!user?.email) return;

    // Get current generations array
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("generations")
      .eq("email", user.email)
      .single();

    if (fetchError) {
      console.error("Error fetching generations:", fetchError);
      return;
    }

    // Create new generation entry
    const newGeneration = {
      input_image: inputUrl,
      output_image: outputUrl,
      created_at: new Date().toISOString(),
    };

    // Append to existing generations or create new array
    const currentGenerations = userData.generations || [];
    const updatedGenerations = [...currentGenerations, newGeneration];

    // Update user's generations
    const { error: updateError } = await supabase
      .from("users")
      .update({ generations: updatedGenerations })
      .eq("email", user.email);

    if (updateError) {
      console.error("Error saving generation:", updateError);
    }
  };

  return (
    <>
      <Card className="w-full max-w-[600px] mx-auto bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1),0_12px_24px_rgba(0,0,0,0.1)] border-0">
        <div className="p-6 flex flex-col items-center gap-3">
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <div className="flex flex-col items-center gap-3 w-full">
            {(uploadedImage || processedImage) && (
              <div className="relative w-full aspect-square mb-3">
                <Image
                  src={processedImage || uploadedImage}
                  alt={processedImage ? "Processed image" : "Uploaded image"}
                  fill
                  className="object-contain rounded-lg"
                />
                {processedImage && (
                  <Button
                    onClick={handleDownload}
                    className="absolute bottom-4 right-4 bg-white hover:bg-gray-100"
                    size="icon"
                    variant="outline"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-col w-full gap-3">
              <Button
                variant="outline"
                className="w-full h-11 border shadow-sm hover:bg-gray-50 text-sm sm:text-base"
                onClick={handleUploadClick}
                disabled={isUploading || isProcessing}
              >
                {!user ? (
                  <>
                    <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    {isProcessing ? "Signing in..." : "Sign in to Upload"}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    {isUploading ? "Uploading..." : "Upload Image (PNG or JPG)"}
                  </>
                )}
              </Button>

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
          </div>

          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </div>
      </Card>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        uploadedImage={uploadedImage}
        processedImage={processedImage}
      />
    </>
  );
}
//4242 4242 4242 4242
