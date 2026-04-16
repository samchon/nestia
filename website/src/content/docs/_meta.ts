import { MetaRecord } from "nextra";

export default {
  // GETTINIG STARTED
  index: "🙋🏻‍♂️ Introduction",
  setup: "📦 Setup",
  pure: "⛲ Pure TypeScript",

  // CORE FEATURES
  "-- features": {
    type: "separator",
    title: "📖 Features",
  },
  core: "Core Library",
  sdk: "S/W Development Kit",
  swagger: "Swagger Document",
  e2e: "E2E Testing",

  // LEGACY PAGES
  migrate: {
    title: "Migration from Swagger",
    display: "hidden",
  },
  editor: {
    title: "TypeScript Swagger Editor",
    display: "hidden",
  },

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
