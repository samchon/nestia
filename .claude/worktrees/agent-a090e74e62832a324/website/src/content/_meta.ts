import { MetaRecord } from "nextra";

export default {
  index: {
    title: "Introduction",
    type: "page",
    display: "hidden",
    theme: {
      copyPage: false,
      toc: false,
    },
  },
  docs: {
    title: "📖 Guide Documents",
    type: "page",
  },
  blog: {
    display: "hidden",
  },
  "blog-articles": {
    type: "page",
    title: "📝 Blog Articles",
    href: "/blog",
  },
  playground: {
    title: "💻 Playground",
    type: "menu",
    items: {
      boilerplate: {
        title: "📦 Boilerplate",
        href: "https://stackblitz.com/github/samchon/nestia-start?file=README.md&view=editor",
      },
      websocket: {
        title: "📡 WebSocket",
        href: "https://stackblitz.com/~/github.com/samchon/tgrid.example.nestjs?file=src/calculate.test.ts&view=editor",
      },
      chat: {
        title: "🤖 A.I. Chatbot",
        href: "/chat/playground",
      },
    },
  },
  editor: {
    title: "🛠️ Nestia Editor",
    display: "hidden",
    href: "/editor",
  },
} satisfies MetaRecord;
