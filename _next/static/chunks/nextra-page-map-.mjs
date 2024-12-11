import meta from "../../../pages/_meta.js";
import docs_meta from "../../../pages/docs/_meta.js";
import docs_core_meta from "../../../pages/docs/core/_meta.js";
import docs_e2e_meta from "../../../pages/docs/e2e/_meta.js";
import docs_sdk_meta from "../../../pages/docs/sdk/_meta.js";
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
        "sidebarTitle": "Typedbody"
      }
    }, {
      name: "TypedException",
      route: "/docs/core/TypedException",
      frontMatter: {
        "sidebarTitle": "Typedexception"
      }
    }, {
      name: "TypedFormData",
      route: "/docs/core/TypedFormData",
      frontMatter: {
        "sidebarTitle": "Typedformdata"
      }
    }, {
      name: "TypedHeaders",
      route: "/docs/core/TypedHeaders",
      frontMatter: {
        "sidebarTitle": "Typedheaders"
      }
    }, {
      name: "TypedParam",
      route: "/docs/core/TypedParam",
      frontMatter: {
        "sidebarTitle": "Typedparam"
      }
    }, {
      name: "TypedQuery",
      route: "/docs/core/TypedQuery",
      frontMatter: {
        "sidebarTitle": "Typedquery"
      }
    }, {
      name: "TypedRoute",
      route: "/docs/core/TypedRoute",
      frontMatter: {
        "sidebarTitle": "Typedroute"
      }
    }, {
      name: "WebSocketRoute",
      route: "/docs/core/WebSocketRoute",
      frontMatter: {
        "sidebarTitle": "Websocketroute"
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
        "sidebarTitle": "Benchmark"
      }
    }, {
      name: "development",
      route: "/docs/e2e/development",
      frontMatter: {
        "sidebarTitle": "Development"
      }
    }, {
      name: "why",
      route: "/docs/e2e/why",
      frontMatter: {
        "sidebarTitle": "Why"
      }
    }]
  }, {
    name: "editor",
    route: "/docs/editor",
    frontMatter: {
      "sidebarTitle": "Editor"
    }
  }, {
    name: "index",
    route: "/docs",
    frontMatter: {
      "sidebarTitle": "Index"
    }
  }, {
    name: "migrate",
    route: "/docs/migrate",
    frontMatter: {
      "sidebarTitle": "Migrate"
    }
  }, {
    name: "pure",
    route: "/docs/pure",
    frontMatter: {
      "sidebarTitle": "Pure"
    }
  }, {
    name: "sdk",
    route: "/docs/sdk",
    children: [{
      data: docs_sdk_meta
    }, {
      name: "e2e",
      route: "/docs/sdk/e2e",
      frontMatter: {
        "sidebarTitle": "E2e"
      }
    }, {
      name: "sdk",
      route: "/docs/sdk/sdk",
      frontMatter: {
        "sidebarTitle": "Sdk"
      }
    }, {
      name: "simulator",
      route: "/docs/sdk/simulator",
      frontMatter: {
        "sidebarTitle": "Simulator"
      }
    }, {
      name: "swagger",
      route: "/docs/sdk/swagger",
      frontMatter: {
        "sidebarTitle": "Swagger"
      }
    }]
  }, {
    name: "setup",
    route: "/docs/setup",
    frontMatter: {
      "sidebarTitle": "Setup"
    }
  }]
}, {
  name: "index",
  route: "/",
  frontMatter: {
    "sidebarTitle": "Index"
  }
}, {
  name: "playground",
  route: "/playground",
  children: [{
    name: "index",
    route: "/playground",
    frontMatter: {
      "sidebarTitle": "Index"
    }
  }]
}];