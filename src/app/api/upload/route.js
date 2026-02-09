import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file" },
        { status: 400 }
      );
    }

    const blob = await put(
      `uploads/${Date.now()}-${file.name}`,
      file,
      {
        access: "public",
      }
    );

    return NextResponse.json({
      url: blob.url,      // 🔥 frontend đang cần cái này
      name: file.name,
      size: file.size,
    });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
