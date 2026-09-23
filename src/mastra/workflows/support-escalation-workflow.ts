import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { customerLookupTool } from "../tools/customer-lookup-tool";

const validateTicket = createStep({
  id: "validate-ticket",
  inputSchema: z.object({
    ticketText: z.string(),
    accountName: z.string().optional(),
    submittedAt: z.string(),
  }),
  outputSchema: z.object({
    ticketText: z.string(),
    accountName: z.string().optional(),
    submittedAt: z.string(),
    valid: z.boolean(),
  }),
  execute: async ({ inputData }) => ({
    ...inputData,
    valid: inputData.ticketText.trim().length > 0,
  }),
});

const enrichCustomer = createStep({
  id: "enrich-customer",
  inputSchema: z.object({
    ticketText: z.string(),
    accountName: z.string().optional(),
    submittedAt: z.string(),
    valid: z.boolean(),
  }),
  outputSchema: z.object({
    ticketText: z.string(),
    submittedAt: z.string(),
    account: z.any().nullable(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData.accountName) {
      return {
        ticketText: inputData.ticketText,
        submittedAt: inputData.submittedAt,
        account: null,
      };
    }
    const account = await customerLookupTool.execute!(
      { accountName: inputData.accountName },
      {} as any,
    );
    return {
      ticketText: inputData.ticketText,
      submittedAt: inputData.submittedAt,
      account,
    };
  },
});

const classifyUrgency = createStep({
  id: "classify-urgency",
  inputSchema: z.object({
    ticketText: z.string(),
    submittedAt: z.string(),
    account: z.any().nullable(),
  }),
  outputSchema: z.object({ escalationPlan: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent("supportTriageAgent");
    const prompt = `Ticket: ${inputData.ticketText}\nSubmitted at: ${inputData.submittedAt}\nAccount context: ${JSON.stringify(
      inputData.account,
    )}\nClassify this ticket and give an escalation plan.`;
    const response = await agent.generate(prompt);
    return { escalationPlan: response.text };
  },
});

export const supportEscalationWorkflow = createWorkflow({
  id: "support-escalation-workflow",
  inputSchema: z.object({
    ticketText: z.string(),
    accountName: z.string().optional(),
    submittedAt: z.string(),
  }),
  outputSchema: z.object({ escalationPlan: z.string() }),
})
  .then(validateTicket)
  .then(enrichCustomer)
  .then(classifyUrgency)
  .commit();
