import { MetaRecord } from "nextra";

export default {
  // GETTING STARTED
  index: "🙋🏻‍♂️ Introduction",
  tutorial: "🚀 Tutorial",
  setup: "📦 Setup",

  // BACKGROUND
  "-- concepts": {
    type: "separator",
    title: "🧠 Concepts",
  },
  concepts: "Concepts",

  // FEATURE REFERENCE
  "-- features": {
    type: "separator",
    title: "📖 Reference",
  },
  core: "Core Library",
  sdk: "S/W Development Kit",
  swagger: "Swagger Document",
  e2e: "E2E Testing",

  // PROBLEM-SOLVING
  "-- recipes": {
    type: "separator",
    title: "🍳 Recipes",
  },
  recipes: "Recipes & FAQ",

  // APPENDIX
  "-- appendix": {
    type: "separator",
    title: "🔗 Appendix",
  },
  api: {
    title: "⇲ API Documents",
    href: "/api",
  },
  benchmark: {
    title: "⇲ Benchmark Result",
    href: "https://github.com/samchon/nestia/tree/master/benchmark/results/AMD%20Ryzen%209%207940HS%20w%20Radeon%20780M%20Graphics",
  },
  articles: {
    title: "⇲ dev.to Articles",
    href: "https://dev.to/samchon/series/22751",
  },
} satisfies MetaRecord;
