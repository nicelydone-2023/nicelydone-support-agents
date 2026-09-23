import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { createContentSimilarityScorer } from "@mastra/evals/scorers/prebuilt";
import {
  Observability,
  MastraStorageExporter,
  SensitiveDataFilter,
} from "@mastra/observability";

import { supportTriageAgent } from "./agents/support-triage-agent";
import { releaseSummaryAgent } from "./agents/release-summary-agent";
import { accountRiskAgent } from "./agents/account-risk-agent";

import { supportEscalationWorkflow } from "./workflows/support-escalation-workflow";
import { releaseCommunicationWorkflow } from "./workflows/release-communication-workflow";
import { renewalReviewWorkflow } from "./workflows/renewal-review-workflow";

export const mastra = new Mastra({
  agents: { supportTriageAgent, releaseSummaryAgent, accountRiskAgent },
  workflows: {
    supportEscalationWorkflow,
    releaseCommunicationWorkflow,
    renewalReviewWorkflow,
  },
  storage: new LibSQLStore({
    id: "main-storage",
    url: process.env.TURSO_DATABASE_URL || "file:mastra.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
  scorers: {
    contentSimilarity: createContentSimilarityScorer(),
  },
  observability: new Observability({
    configs: {
      default: {
        serviceName: "nicelydone-support-agents",
        exporters: [new MastraStorageExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
