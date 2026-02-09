import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req, context) {
  const { id } = await context.params;

  const result = await pool.query(
    `
    SELECT content, files
    FROM pages
    WHERE id = $1 AND expires_at > NOW()
    `,
    [id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    content: result.rows[0].content,
    files: result.rows[0].files || [],
  });
}

export async function PUT(req, context) {
  const { id } = await context.params;
  const { content, files } = await req.json();

  await pool.query(
    `
    UPDATE pages
    SET content = $1, files = $2
    WHERE id = $3
    `,
    [content, JSON.stringify(files || []), id]
  );

  return NextResponse.json({ success: true });
}
