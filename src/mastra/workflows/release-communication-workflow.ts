import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { changelogLookupTool } from "../tools/changelog-lookup-tool";

const selectChange = createStep({
  id: "select-change",
  inputSchema: z.object({ releaseTitle: z.string() }),
  outputSchema: z.object({
    title: z.string(),
    technicalChange: z.string(),
  }),
  execute: async ({ inputData }) => {
    const notes = await changelogLookupTool.execute!(
      { title: inputData.releaseTitle },
      {} as any,
    );
    if (!Array.isArray(notes) || notes.length === 0) {
      throw new Error(`No release note found for: ${inputData.releaseTitle}`);
    }
    return { title: notes[0].title, technicalChange: notes[0].technicalChange };
  },
});

const createCustomerCopy = createStep({
  id: "create-customer-copy",
  inputSchema: z.object({ title: z.string(), technicalChange: z.string() }),
  outputSchema: z.object({
    title: z.string(),
    technicalChange: z.string(),
    customerCopy: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent("releaseSummaryAgent");
    const response = await agent.generate(
      `Write a customer-facing summary for: ${inputData.title}. Technical change: ${inputData.technicalChange}`,
    );
    return { ...inputData, customerCopy: response.text };
  },
});

const createInternalActionItems = createStep({
  id: "create-internal-action-items",
  inputSchema: z.object({
    title: z.string(),
    technicalChange: z.string(),
    customerCopy: z.string(),
  }),
  outputSchema: z.object({
    customerCopy: z.string(),
    internalActionItems: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent("releaseSummaryAgent");
    const response = await agent.generate(
      `Create internal action items for support and engineering for this release: ${inputData.title}. Technical change: ${inputData.technicalChange}`,
    );
    return {
      customerCopy: inputData.customerCopy,
      internalActionItems: response.text,
    };
  },
});

export const releaseCommunicationWorkflow = createWorkflow({
  id: "release-communication-workflow",
  inputSchema: z.object({ releaseTitle: z.string() }),
  outputSchema: z.object({
    customerCopy: z.string(),
    internalActionItems: z.string(),
  }),
})
  .then(selectChange)
  .then(createCustomerCopy)
  .then(createInternalActionItems)
  .commit();
