import meta from "../../../pages/_meta.js";
import docs_meta from "../../../pages/docs/_meta.js";
import docs_core_meta from "../../../pages/docs/core/_meta.js";
import docs_e2e_meta from "../../../pages/docs/e2e/_meta.js";
import docs_sdk_meta from "../../../pages/docs/sdk/_meta.js";
import docs_swagger_meta from "../../../pages/docs/swagger/_meta.js";
export const pageMap = [{
  data: meta
}, {
  name: "docs",
  route: "/docs",
  children: [{
    data: docs_meta
  }, {
    name: "core",
    route: "/docs/core",
    children: [{
      data: docs_core_meta
    }, {
      name: "TypedBody",
      route: "/docs/core/TypedBody",
      frontMatter: {
        "title": "Guide Documents > Core Library > TypedBody"
      }
    }, {
      name: "TypedException",
      route: "/docs/core/TypedException",
      frontMatter: {
        "title": "Guide Documents > Core Library > TypedException"
      }
    }, {
      name: "TypedFormData",
      route: "/docs/core/TypedFormData",
      frontMatter: {
        "title": "Guide Documents > Core Library > TypedFormData"
      }
    }, {
      name: "TypedHeaders",
      route: "/docs/core/TypedHeaders",
      frontMatter: {
        "title": "Guide Documents > Core Library > TypedHeaders"
      }
    }, {
      name: "TypedParam",
      route: "/docs/core/TypedParam",
      frontMatter: {
        "title": "Guide Documents > Core Library > TypedParam"
      }
    }, {
      name: "TypedQuery",
      route: "/docs/core/TypedQuery",
      frontMatter: {
        "title": "Guide Documents > Core Library > TypedQuery"
      }
    }, {
      name: "TypedRoute",
      route: "/docs/core/TypedRoute",
      frontMatter: {
        "title": "Docs > Core Library > TypedRoute"
      }
    }, {
      name: "WebSocketRoute",
      route: "/docs/core/WebSocketRoute",
      frontMatter: {
        "title": "Guide Documents > Core Library > WebSocketRoute"
      }
    }]
  }, {
    name: "e2e",
    route: "/docs/e2e",
    children: [{
      data: docs_e2e_meta
    }, {
      name: "benchmark",
      route: "/docs/e2e/benchmark",
      frontMatter: {
        "title": "Guide Documents > E2E Testing > Benchmark"
      }
    }, {
      name: "development",
      route: "/docs/e2e/development",
      frontMatter: {
        "title": "Guide Documents > E2E Testing > Test Program Development"
      }
    }, {
      name: "why",
      route: "/docs/e2e/why",
      frontMatter: {
        "title": "Guide Documents > E2E Testing > Why E2E Test?"
      }
    }]
  }, {
    name: "editor",
    route: "/docs/editor",
    frontMatter: {
      "title": "Guide Documents > TypeScript Swagger Editor"
    }
  }, {
    name: "index",
    route: "/docs",
    frontMatter: {
      "title": "Guide Documents > Introduction"
    }
  }, {
    name: "migrate",
    route: "/docs/migrate",
    frontMatter: {
      "title": "Guide Documents > Migration from Swagger to NestJS"
    }
  }, {
    name: "pure",
    route: "/docs/pure",
    frontMatter: {
      "title": "Guide Documents > Pure TypeScript Type"
    }
  }, {
    name: "sdk",
    route: "/docs/sdk",
    children: [{
      data: docs_sdk_meta
    }, {
      name: "distribute",
      route: "/docs/sdk/distribute",
      frontMatter: {
        "title": "Guide Documents > S/W Development Kit > Distribution"
      }
    }, {
      name: "e2e",
      route: "/docs/sdk/e2e",
      frontMatter: {
        "title": "Guide Documents > S/W Development Kit > E2E Test Functions"
      }
    }, {
      name: "index",
      route: "/docs/sdk",
      frontMatter: {
        "title": "Guide Documents > S/W Development Kit"
      }
    }, {
      name: "sdk",
      route: "/docs/sdk/sdk",
      frontMatter: {
        "title": "Guide Documents > S/W Development Kit"
      }
    }, {
      name: "simulate",
      route: "/docs/sdk/simulate",
      frontMatter: {
        "title": "Guide Documents > S/W Development Kit > Mockup Simulator"
      }
    }, {
      name: "simulator",
      route: "/docs/sdk/simulator",
      frontMatter: {
        "title": "Guide Documents > S/W Development Kit > Mockup Simulator"
      }
    }, {
      name: "swagger",
      route: "/docs/sdk/swagger",
      frontMatter: {
        "title": "Guide Documents > S/W Development Kit > Swagger Document"
      }
    }]
  }, {
    name: "setup",
    route: "/docs/setup",
    frontMatter: {
      "title": "Guide Documents > Setup"
    }
  }, {
    name: "swagger",
    route: "/docs/swagger",
    children: [{
      data: docs_swagger_meta
    }, {
      name: "chat",
      route: "/docs/swagger/chat",
      frontMatter: {
        "title": "Guide Documents > Swagger Document > AI Chatbot Development"
      }
    }, {
      name: "editor",
      route: "/docs/swagger/editor",
      frontMatter: {
        "title": "Guide Documents > Swagger Document > TypeScript Swagger Editor"
      }
    }, {
      name: "index",
      route: "/docs/swagger",
      frontMatter: {
        "title": "Guide Documents > Swagger Document"
      }
    }, {
      name: "strategy",
      route: "/docs/swagger/strategy",
      frontMatter: {
        "title": "Guide Documents > Swagger Document > Documentation Strategy"
      }
    }]
  }]
}, {
  name: "index",
  route: "/",
  frontMatter: {
    "title": "Home"
  }
}];