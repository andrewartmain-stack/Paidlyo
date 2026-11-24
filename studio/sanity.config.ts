import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";
import { productTemplates, structure } from "./structure";

export default defineConfig({
  name: "default",
  title: "Paidlyo pages",
  projectId: "f1ipt922",
  dataset: "production",
  plugins: [structureTool({ structure })],
  schema: { types: schemaTypes, templates: (previous) => [...previous, ...productTemplates] },
});
