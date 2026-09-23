import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { customerLookupTool } from "../tools/customer-lookup-tool";

const loadAccount = createStep({
  id: "load-account",
  inputSchema: z.object({ accountName: z.string() }),
  outputSchema: z.object({ accountName: z.string(), account: z.any() }),
  execute: async ({ inputData }) => {
    const account = await customerLookupTool.execute!(
      { accountName: inputData.accountName },
      {} as any,
    );
    return { accountName: inputData.accountName, account };
  },
});

const assessRisk = createStep({
  id: "assess-risk",
  inputSchema: z.object({ accountName: z.string(), account: z.any() }),
  outputSchema: z.object({
    accountName: z.string(),
    riskAssessment: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent("accountRiskAgent");
    const response = await agent.generate(
      `Assess churn risk for ${inputData.accountName} given this account data: ${JSON.stringify(
        inputData.account,
      )}`,
    );
    return {
      accountName: inputData.accountName,
      riskAssessment: response.text,
    };
  },
});

const returnRetentionPlan = createStep({
  id: "return-retention-plan",
  inputSchema: z.object({
    accountName: z.string(),
    riskAssessment: z.string(),
  }),
  outputSchema: z.object({ retentionPlan: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent("accountRiskAgent");
    const response = await agent.generate(
      `Based on this risk assessment for ${inputData.accountName}, write a concrete retention plan: ${inputData.riskAssessment}`,
    );
    return { retentionPlan: response.text };
  },
});

export const renewalReviewWorkflow = createWorkflow({
  id: "renewal-review-workflow",
  inputSchema: z.object({ accountName: z.string() }),
  outputSchema: z.object({ retentionPlan: z.string() }),
})
  .then(loadAccount)
  .then(assessRisk)
  .then(returnRetentionPlan)
  .commit();
