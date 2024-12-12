"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, User } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

export function ImageUpload() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const handleUploadClick = () => {
    if (!user) {
      handleSignIn();
      return;
    }
    document.getElementById("file-upload")?.click();
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
      const previewUrl = URL.createObjectURL(file);
      setUploadedImage(previewUrl);
      setCurrentFile(file);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/py/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response from Python:", data);

      if (!data.success) {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadedImage(null);
      setCurrentFile(null);
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOutpaint = async () => {
    if (!currentFile) return;

    setIsProcessing(true);
    setError(null);
    setCountdown(30); // Start countdown from 45

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

      const response = await fetch(`${apiUrl}/api/py/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      setProcessedImage(result.processedImage);
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

  const handleOutpaintClick = () => {
    if (!user) {
      handleSignIn();
      return;
    }
    handleOutpaint();
  };

  return (
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
              <Button
                variant="outline"
                className="w-full h-11 border shadow-sm hover:bg-gray-50 text-sm sm:text-base"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Download Image
              </Button>
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
            {isProcessing ? (
              countdown ? `Processing... ${countdown}s` : "Processing..."
            ) : (
              "Outpaint"
            )}
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
  );
}
