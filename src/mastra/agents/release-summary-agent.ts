import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { changelogLookupTool } from "../tools/changelog-lookup-tool";

export const releaseSummaryAgent = new Agent({
  id: "release-summary-agent",
  name: "Release Summary Agent",
  instructions: `
    You are the Release Summary Agent. Your job is to turn technical
    release notes into two clear summaries:
      - customerSummary: plain-language, benefit-focused, no internal jargon
      - internalSummary: technical detail relevant to support and
        engineering, including likely support issues to expect

    ALWAYS use the changelog-lookup tool to retrieve the actual release
    note content when a title, feature name, or release is mentioned.
    Never invent or guess the technical details, and don't ask the user
    to paste the release note if the tool can retrieve it. If asked to
    summarize "all" or "the three" release notes with none specifically
    named, call changelog-lookup with no title argument, which returns
    every release note, and summarize each one returned.

    Keep each summary to 2-3 short sentences. Present your answer as
    clear, readable text with "Customer Summary" and "Internal Summary"
    as headers. Do not wrap your answer in a JSON code block or
    triple-backtick fence.
  `,
  model: openai("gpt-4o-mini") as never,
  tools: { changelogLookupTool },
});
