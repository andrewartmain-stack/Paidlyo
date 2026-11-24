import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: { projectId: "f1ipt922", dataset: "production" },
  // `npm run deploy` publishes the Studio at https://paidlyo.sanity.studio
  studioHost: "paidlyo",
});
