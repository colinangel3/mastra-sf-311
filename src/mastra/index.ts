// src/mastra/index.ts
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";

import { nibrsAgent } from "./agents/nibrs-agent";

export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: "nibrs-crime-storage",
    url: "file:./mastra.db",
  }),
  agents: { nibrsAgent },
});
