// CommonJS module-resolution rescue preloaded into the `ttsx` runtime child.
//
// `ttsx` type-checks and builds each fixture from source, then runs the emit
// under the original source URLs. tsgo's emit substitutes the fixtures'
// `@api` path alias (and friends) with a *relative* specifier that carries a
// `.js` extension (nodenext requires explicit extensions), e.g.
// `require("../../../api/index.js")`. On disk only `../../../api/index.ts`
// exists, because the SDK is generated as TypeScript and served from source.
//
// ttsc's own runtime hooks already rescue that `.js` -> `.ts` mismatch, but
// only in their ESM `resolve` hook. The fixtures load as CommonJS (no
// `type: "module"`), so they go through `Module._resolveFilename`, which ttsc
// leaves untouched. This preload patches that one CJS seam the same way:
// when a relative `.js`/`.jsx`/`.mjs`/`.cjs` require fails, probe for the
// TypeScript source the runtime hooks can actually compile.
//
// Scope is deliberately narrow — only relative specifiers, only after the
// real resolver throws MODULE_NOT_FOUND — so a genuinely missing module still
// surfaces its original error.

const Module = require("module");
const fs = require("fs");
const path = require("path");

const EXTENSION_MAP = {
  ".js": [".ts", ".tsx"],
  ".jsx": [".tsx"],
  ".mjs": [".mts"],
  ".cjs": [".cts"],
};

const isRelative = (specifier) =>
  specifier.startsWith("./") || specifier.startsWith("../");

const original = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  try {
    return original.call(this, request, parent, ...rest);
  } catch (error) {
    if (
      error &&
      error.code === "MODULE_NOT_FOUND" &&
      typeof request === "string" &&
      isRelative(request) &&
      parent &&
      typeof parent.filename === "string"
    ) {
      const extension = path.extname(request);
      const alternatives = EXTENSION_MAP[extension];
      if (alternatives !== undefined) {
        const base = path.resolve(
          path.dirname(parent.filename),
          request.slice(0, request.length - extension.length),
        );
        for (const alternative of alternatives) {
          const candidate = base + alternative;
          if (fs.existsSync(candidate)) return candidate;
        }
      }
    }
    throw error;
  }
};
