import { NextResponse } from "next/server";
import { comments } from "@/lib/data";
import { delay } from "@/lib/utils";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  await delay(500);

  const idx = comments.findIndex(
    (c) => c.id === commentId && c.userName === "You"
  );
  if (idx >= 0) {
    comments.splice(idx, 1);
  }

  return NextResponse.json({ ok: true });
}
