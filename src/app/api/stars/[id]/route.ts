import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { stars } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userName = cookieStore.get("taskboard-user")?.value;

  if (!userName) {
    return NextResponse.json({ hasStarred: false });
  }

  const hasStarred = stars.some(
    (s) => s.taskId === id && s.userName === userName
  );
  return NextResponse.json({ hasStarred });
}
