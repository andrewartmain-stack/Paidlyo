import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";

export default defineConfig({
  name: "default",
  title: "Paidlyo pages",
  projectId: "f1ipt922",
  dataset: "production",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
