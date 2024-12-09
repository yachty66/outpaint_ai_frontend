"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function ImageUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/py/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("Response from Python:", result);

      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1),0_12px_24px_rgba(0,0,0,0.1)] border-0">
      <div className="p-6 flex flex-col items-center gap-3">
        <Button 
          variant="outline"
          className="w-[600px] h-11 border shadow-sm hover:bg-gray-50 text-base"
          onClick={() => document.getElementById("file-upload")?.click()}
          disabled={isUploading}
        >
          <Upload className="w-5 h-5" />
          Upload Image
        </Button>
        <Button 
          className="w-[600px] h-11 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 text-base"
          disabled={isUploading}
        >
          {isUploading ? "Processing..." : "Outpaint"}
        </Button>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleUpload}
          disabled={isUploading}
        />
      </div>
    </Card>
  );
}