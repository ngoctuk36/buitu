import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/page/[id]
export async function GET(req, context) {
  const { id } = await context.params; // 👈 BẮT BUỘC await

  const result = await pool.query(
    `
    SELECT content
    FROM pages
    WHERE id = $1 AND expires_at > NOW()
    `,
    [id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json(
      { error: "Not found or expired" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    content: result.rows[0].content,
  });
}

// PUT /api/page/[id]
export async function PUT(req, context) {
  const { id } = await context.params; // 👈 BẮT BUỘC await
  const { content } = await req.json();

  const result = await pool.query(
    `
    UPDATE pages
    SET content = $1
    WHERE id = $2 AND expires_at > NOW()
    `,
    [content, id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json(
      { error: "Not found or expired" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
