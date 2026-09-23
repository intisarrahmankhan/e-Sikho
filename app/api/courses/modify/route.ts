import { NextResponse } from "next/server";

export async function PUT() {
  return NextResponse.json({ message: "Course modify endpoint" });
}
