import { NextResponse } from "next/server";
import { comments, getNextCommentId, type Comment } from "@/lib/data";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  await delay(800);

  const { content } = (await request.json()) as { content: string };
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const comment: Comment = {
    id: getNextCommentId(),
    taskId,
    userName: "You",
    content: content.trim(),
    createdAt: new Date(),
  };
  comments.push(comment);
  return NextResponse.json(comment, { status: 201 });
}
