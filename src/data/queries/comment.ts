import "server-only";

import { cache } from "react";
import { cacheTag } from "next/cache";
import { comments } from "@/lib/data";
import { delay } from "@/lib/utils";

export const getComments = cache(async (taskId: string) => {
  "use cache";
  cacheTag(`comments-${taskId}`);

  await delay(350);
  return comments
    .filter((c) => c.taskId === taskId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
});
