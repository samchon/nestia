export default {
  index: {
    title: "Introduction",
    type: "page",
    display: "hidden",
    theme: {
      layout: "full",
    },
  },
  docs: {
    title: "📖 Guide Documents",
    type: "page",
  },
  playground: {
    title: "💻 Playground",
    type: "menu",
    items: {
      boilerplate: {
        title: "📦 Boilerplate",
        href: "https://stackblitz.com/github/samchon/nestia-start?file=README.md&view=editor",
        newWindow: true,
      },
      websocket: {
        title: "📡 WebSocket",
        href: "https://stackblitz.com/~/github.com/samchon/tgrid.example.nestjs?file=src/calculate.test.ts&view=editor",
        newWindow: true,
      },
      chat: {
        title: "📦 A.I. Chatbot",
        href: "/chat/playground",
        newWindow: true,
      },
    },
  },
  editor: {
    title: "🛠️ Nestia Editor",
    display: "hidden",
    href: "/editor/",
  },
};
