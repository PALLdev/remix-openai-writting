import type { User, Completion } from "@prisma/client";

import { prisma } from "~/db.server";

export function getCompletionListItems({ userId }: { userId: User["id"] }) {
  return prisma.completion.findMany({
    where: { userId },
    select: { id: true, prompt: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

export function createCompletion({
  prompt,
  tokens,
  answer,
  userId,
}: Pick<Completion, "prompt" | "tokens" | "answer"> & {
  userId: User["id"];
}) {
  return prisma.completion.create({
    data: {
      prompt,
      tokens,
      answer,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}
