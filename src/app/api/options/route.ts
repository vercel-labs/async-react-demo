import { NextResponse } from "next/server";
import { ASSIGNEES, LABELS } from "@/lib/data";
import { delay } from "@/lib/utils";

export async function GET() {
  await delay(600);
  return NextResponse.json({
    assignees: [...ASSIGNEES],
    labels: [...LABELS],
  });
}
