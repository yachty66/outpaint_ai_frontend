import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    let buffer: Buffer;
    let contentType: string;
    let fileExtension: string = "png";

    // Check if the request is multipart/form-data or JSON
    const contentTypeHeader = request.headers.get("content-type");
    if (contentTypeHeader?.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      buffer = Buffer.from(await file.arrayBuffer());
      contentType = file.type;
      fileExtension = file.name.split(".").pop() || "png";
    } else {
      // Handle base64 image
      const { base64Image } = await request.json();
      buffer = Buffer.from(base64Image.split(",")[1], "base64");
      contentType = "image/png";
    }

    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Generate direct S3 URL
    const directUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: directUrl,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
