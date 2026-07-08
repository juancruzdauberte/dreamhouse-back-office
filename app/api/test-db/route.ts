import { NextResponse } from "next/server";
import { pool } from "../../lib/db/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT 1 as result");
    return NextResponse.json({ status: "Connected!", data: rows });
  } catch (error: unknown) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      { status: "Error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
