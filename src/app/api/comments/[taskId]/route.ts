import { NextResponse } from "next/server";
import { comments } from "@/lib/data";
import { delay } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  await delay(350);

  const taskComments = comments
    .filter((c) => c.taskId === taskId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return NextResponse.json(taskComments);
}
