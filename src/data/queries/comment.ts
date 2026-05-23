import "server-only";

import { cache } from "react";
import { cacheTag } from "next/cache";
import { getCommentsByTaskId } from "@/lib/db";
import { delay } from "@/lib/utils";

export const getComments = cache(async (taskId: string) => {
  "use cache";
  cacheTag(`comments-${taskId}`);

  await delay(350);
  return getCommentsByTaskId(taskId);
});
