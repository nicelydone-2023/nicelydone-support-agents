import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import accountRiskData from "../../../data/account-risk.json";

export const customerLookupTool = createTool({
  id: "customer-lookup",
  description:
    "Returns fake account data (plan, usage, open tickets, renewal date) for a known customer by name.",
  inputSchema: z.object({
    accountName: z
      .string()
      .describe(
        "Customer account name, e.g. 'Acme Corp', 'Northstar Health', 'Brightline Retail'",
      ),
  }),
  outputSchema: z.object({
    accountName: z.string(),
    plan: z.string(),
    usage: z.object({
      percentOfPlanLimit: z.number(),
      monthlyActiveUsers: z.number(),
      trendVsLastMonth: z.string(),
    }),
    openTickets: z.number(),
    renewalDate: z.string(),
    lastQbrDate: z.string(),
  }),
  execute: async ({ accountName }) => {
    const account = accountRiskData.find(
      (a) => a.accountName.toLowerCase() === accountName.toLowerCase(),
    );
    if (!account) {
      throw new Error(`Unknown account: ${accountName}`);
    }
    const { expected, ...accountData } = account;
    return accountData;
  },
});
