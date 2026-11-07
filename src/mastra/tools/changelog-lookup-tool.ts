import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import releaseNotes from "../../../data/release-notes.json";

export const changelogLookupTool = createTool({
  id: "changelog-lookup",
  description:
    "Returns the local release-note records, optionally filtered by title.",
  inputSchema: z.object({
    title: z
      .string()
      .describe(
        "Release title to filter by, e.g. 'API Pagination Update'. Pass 'all' to return every release note.",
      ),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      technicalChange: z.string(),
      releaseDate: z.string(),
    }),
  ),
  execute: async ({ title }) => {
    const notes = releaseNotes.map(({ expected, ...rest }) => rest);
    if (!title || title.trim().toLowerCase() === "all") return notes;
    return notes.filter((n) =>
      n.title.toLowerCase().includes(title.toLowerCase()),
    );
  },
});
