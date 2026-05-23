import "server-only";

import { cache } from "react";
import { getCommentsByTaskId } from "@/lib/db";
import { delay } from "@/lib/utils";

export const getComments = cache(async (taskId: string) => {
  await delay(350);
  return getCommentsByTaskId(taskId);
});
