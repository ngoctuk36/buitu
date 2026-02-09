import { NextResponse } from "next/server";
import pool from "@/lib/db";

function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(req) {
  try {
    const { content = "", files = [] } = await req.json();

    if (!content && files.length === 0) {
      return NextResponse.json(
        { error: "No content" },
        { status: 400 }
      );
    }

    const id = generateId();

    await pool.query(
      `
      INSERT INTO pages (id, content, files, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '365 days')
      `,
      [id, content, JSON.stringify(files)]
    );

    return NextResponse.json({ url: `/${id}` });
  } catch (err) {
    console.error("Create error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
