import { NextResponse } from "next/server";
import pool from "@/lib/db";

function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(req) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "No content" },
        { status: 400 }
      );
    }

    const id = generateId();

    await pool.query(
      `
      INSERT INTO pages (id, content, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '31 days')
      `,
      [id, content]
    );

    return NextResponse.json({
      url: `/${id}`,
    });
  } catch (err) {
    console.error("API /create error:", err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
