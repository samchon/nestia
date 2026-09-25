const cp = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const NODE = process.execPath;
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const PROJECT_CONFIG = "tsconfig.project.json";
// The cli runs as users run it: its built `bin` under plain node, with every
// workspace package served from the built entries its publishConfig exports
// name (the workspace manifests point at TypeScript sources, which plain node
// cannot load). main() builds those packages first. Launching the cli from
// its sources through ttsx instead started a second TypeScript loader and
// re-evaluated the plugin descriptor before every generation.
const CLI = [
  "-r",
  path.join(__dirname, "built-packages.cjs"),
  path.join(ROOT, "packages/cli/bin/index.js"),
];
const TTSC_BIN = packageBin("ttsc", "ttsc");
const TTSX_BIN = packageBin("ttsc", "ttsx");
const BASE_PORT = 37_000;
const WATCH_TIMEOUT = 90_000;

process.env.NODE_OPTIONS = [
  process.env.NODE_OPTIONS ?? "",
  "--no-experimental-detect-module",
]
  .filter(Boolean)
  .join(" ");
// One ttsc cache for every process the harness starts. The children run from
// the repository root (the package build), this directory (the diagnostic
// cohorts), and each feature directory, so a relative TTSC_CACHE_DIR would
// name a different directory in each, some outside the repository, and every
// such process would build the plugins from cold. It is resolved here, once.
process.env.TTSC_CACHE_DIR = path.resolve(
  __dirname,
  process.env.TTSC_CACHE_DIR ?? path.join(ROOT, "node_modules", ".cache", "ttsc"),
);
process.env.NODE_PATH = [
  path.join(ROOT, "node_modules"),
  path.join(ROOT, "node_modules", ".pnpm", "node_modules"),
  process.env.NODE_PATH ?? "",
]
  .filter(Boolean)
  .join(path.delimiter);
delete process.env.npm_config_dir;
delete process.env.npm_config_verify_deps_before_run;

const featureDirectory = (name = "") => path.join(__dirname, "features", name);
// Every error feature names the diagnostic it exists for, with the location
// that reports it, so a feature failing for another reason fails the run
// instead of passing (#1694).
const EXPECTED_ERROR_DIAGNOSTICS = new Map([
  [
    "body-error-get",
    [
      "TypedBodyController.store():",
      "@Body() is not allowed in the GET method.",
    ],
  ],
  [
    "body-error-property",
    [
      'BbsArticlesController.update() from parameter "content":',
      "@Body() must not have a field name.",
    ],
  ],
  [
    "exception-error-bigint",
    [
      "HealthController.get() from exception (status: 499):",
      "does not allow bigint type in JSON.",
    ],
  ],
  [
    "implicit-error",
    [
      "ImplicitController.array() from success:",
      "ImplicitController.matrix() from success:",
      "implicit (unnamed) return type.",
    ],
  ],
  [
    "mcp-error-duplicate-accessor",
    [
      'McpErrorController.first() from @McpRoute("same-name"):',
      'MCP tool name "same-name" conflicts on generated SDK accessor "api.functional.mcp.same_name".',
      'McpErrorController.second() from @McpRoute("same_name"):',
    ],
  ],
  [
    "mcp-error-duplicate-tool-name",
    [
      'McpErrorController.first() from @McpRoute("duplicated_tool"):',
      'McpErrorController.second() from @McpRoute("duplicated_tool"):',
      'Duplicate MCP tool name "duplicated_tool" is not allowed.',
    ],
  ],
  [
    "mcp-error-mixed-http",
    [
      "McpErrorController.run() from run:",
      "@McpRoute must not be combined with HTTP or WebSocket route decorators on the same method.",
    ],
  ],
  [
    "method-error-get-body",
    [
      "MethodController.body():",
      "@Body() is not allowed in the GET method.",
    ],
  ],
  [
    "method-error-head-body",
    [
      "MethodController.body():",
      "@Body() is not allowed in the HEAD method.",
    ],
  ],
  [
    "method-error-head-non-void",
    [
      "MethodController.response() from success:",
      "HEAD method must not have any return value.",
    ],
  ],
  [
    "route-error-implicit",
    [
      "BbsArticlesController.at() from success:",
      "implicit (unnamed) return type.",
    ],
  ],
  [
    "route-invalid-path-error",
    [
      "InvalidRouteController.get() from {parameters}:",
      'invalid path ("/invalid/:")',
    ],
  ],
  [
    "security-error-not-found",
    'target security scheme "undeclared" does not exist. (SecurityController.undeclared() at "GET /undeclared")',
  ],
  [
    "security-error-not-oauth2",
    `target security scheme "bearer" is neither "oauth2" nor "openIdConnect" type, but you've configured the scopes, which OpenAPI 3.0 requires to be empty.`,
  ],
  [
    "security-error-out-of-scopes",
    'target security scheme "oauth2" does not have a specific scope "read:pets".',
  ],
  [
    "query-error-plain",
    [
      "PlainQueryController.nested()",
      "(INestedQuery.filter)",
      "nested object type is not allowed.",
      "PlainQueryController.dynamic()",
      "dynamic property is not allowed.",
      "PlainQueryController.union()",
      "only one object type is allowed.",
      "PlainQueryController.native()",
      "(INativeQuery.tags)",
      "(INativeQuery.when)",
      "PlainQueryController.field()",
      "only atomic or array of atomic types are allowed.",
      "PlainQueryController.fields()",
      "only atomic types are allowed in array.",
      "PlainQueryController.destructured() from parameter of 0 th",
    ],
  ],
  [
    "headers-error-plain",
    [
      "PlainHeadersController.nested()",
      "nested object type is not allowed.",
      "PlainHeadersController.dynamic()",
      "dynamic property is not allowed.",
      "PlainHeadersController.union()",
      "only one object type is allowed.",
      "PlainHeadersController.nullable()",
      "nullable type is not allowed.",
      "PlainHeadersController.native()",
      "(INativeHeaders[\"x-tags\"])",
      "PlainHeadersController.field()",
      "only atomic or array of atomic types are allowed.",
    ],
  ],
  [
    "param-error-plain",
    [
      "PlainParamController.object()",
      "only atomic or constant types are allowed",
      "PlainParamController.native()",
      "PlainParamController.dynamic()",
      "PlainParamController.union()",
      "do not allow union type",
    ],
  ],
  [
    "parameter-error-duplicated-key",
    [
      'Query key "keyword" is declared both by a field parameter and by the query object.',
      'Header "X-Tenant" is declared both by a field parameter and by the headers object.',
      // a contradiction names the function alone, with no dangling "from"
      "DuplicatedController.fields():",
      "Duplicated field names of headers are not allowed.",
    ],
  ],
]);
// Error features whose failure is a transform diagnostic are fixtures of the
// core Go test transform_feature_diagnostic_cohorts_test.go, which transforms
// them in one in-process program; test-sdk does not run them.
const AGGREGATED_ERROR_FEATURES = new Set([
  "form-data-error-nested",
  "query-route-error-nested",
  "websocket-error-invalid-acceptor-arity",
  "websocket-error-invalid-acceptor-import",
  "body-error-generic",
  "body-error-json",
  "headers-error-array",
  "headers-error-atomic",
  "headers-error-property-array",
  "headers-error-property-nullable",
  "headers-error-property-single",
  "headers-error-union-object",
  "headers-error-union-property",
  "param-error-array",
  "param-error-generic",
  "param-error-native",
  "param-error-object",
  "param-error-union",
  "param-error-union-literal",
  "plain-error-any",
  "plain-error-nullable",
  "plain-error-number",
  "plain-error-object",
  "query-error-array",
  "query-error-atomic",
  "query-error-generic",
  "query-error-native",
  "query-error-union-array",
  "query-error-union-literal",
  "query-error-union-object",
  "query-error-union-property",
  "route-error-generic",
  "route-error-json",
  "websocket-error-invalid-acceptor",
  "websocket-error-invalid-driver",
  "websocket-error-invalid-parameter",
  "websocket-error-no-acceptor",
  "mcp-error-extra-parameter",
  "mcp-error-missing-params-decorator",
  "mcp-error-multiple-params",
  "mcp-error-no-params",
  "mcp-error-param-dynamic-properties",
  "mcp-error-param-non-object",
  "mcp-error-return-dynamic-properties",
  "mcp-error-return-non-object",
  "mcp-error-return-union-void-object",
]);

// The SDK's error features, whose failure the generator reports rather than the
// transform, run in one `nestia all` per phase: a report lists every error of
// its phase at once, and a later phase runs only when the earlier ones pass.
// A scoped cohort looks each feature's phrases up in the report blocks of its
// own files, so one feature's message cannot stand in for another's missing
// one; the security report names routes, not files, and its phrases are each
// feature's own.
const SDK_ERROR_COHORTS = [
  {
    name: "sdk-error-reflect",
    scoped: true,
    members: [
      "body-error-get",
      "body-error-property",
      "headers-error-plain",
      "mcp-error-mixed-http",
      "method-error-get-body",
      "method-error-head-body",
      "param-error-plain",
      "parameter-error-duplicated-key",
      "query-error-plain",
      "route-invalid-path-error",
    ],
  },
  {
    name: "sdk-error-validate",
    scoped: true,
    members: [
      "exception-error-bigint",
      "implicit-error",
      "mcp-error-duplicate-accessor",
      "mcp-error-duplicate-tool-name",
      "method-error-head-non-void",
      "route-error-implicit",
    ],
  },
  {
    name: "sdk-error-security",
    scoped: false,
    members: [
      "security-error-not-found",
      "security-error-not-oauth2",
      "security-error-out-of-scopes",
    ],
  },
];
const SDK_COHORT_FEATURES = new Set(
  SDK_ERROR_COHORTS.flatMap((cohort) => cohort.members),
);

const runSdkErrorCohort = async (cohort) => {
  try {
    const output = (
      await runNestiaForError(__dirname, [
        "all",
        "--config",
        `cohorts/${cohort.name}.config.ts`,
        "--project",
        "cohorts/tsconfig.json",
      ])
    )
      .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
      .replaceAll("\\", "/");
    const blocks = output.split(/\r?\n(?=\S)/);
    const failures = cohort.members
      .map((name) => {
        const scope = cohort.scoped
          ? blocks
              .filter((block) =>
                block.split(/\r?\n/)[0].includes(`features/${name}/`),
              )
              .join("\n")
          : output;
        const missing = [EXPECTED_ERROR_DIAGNOSTICS.get(name)]
          .flat()
          .filter((line) => scope.includes(line) === false);
        return missing.length === 0
          ? null
          : `${name}: ${JSON.stringify(missing)}`;
      })
      .filter((failure) => failure !== null);
    if (failures.length !== 0)
      throw new Error(
        `${cohort.name} did not report the expected diagnostic(s):\n${failures.join("\n")}\n${output}`,
      );
  } finally {
    await removePaths(__dirname, [`.tmp-${cohort.name}`]);
  }
};

const run = (file, args, options) =>
  new Promise((resolve, reject) => {
    const child = cp.spawn(file, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...(options.env ?? {}),
      },
      stdio: options.stdio ?? "ignore",
      shell: options.shell ?? false,
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          Object.assign(
            new Error(
              `${[file, ...args].join(" ")} failed with ${
                signal ?? `exit code ${code}`
              }.`,
            ),
            { code, signal },
          ),
        );
    });
  });

function packageBin(name, key) {
  const directory = path.dirname(
    require.resolve(`${name}/package.json`, { paths: [ROOT] }),
  );
  const pack = JSON.parse(
    fs.readFileSync(path.join(directory, "package.json"), "utf8"),
  );
  const location = typeof pack.bin === "string" ? pack.bin : pack.bin?.[key];
  if (location === undefined)
    throw new Error(`Unable to find "${key}" binary from ${name}.`);
  return path.join(directory, location);
}

const runNode = (cwd, script, args, stdio = "ignore", env = undefined) =>
  run(NODE, [script, ...args], { cwd, env, stdio });

const runNestia = (cwd, args, stdio = "ignore") =>
  run(NODE, [...CLI, ...args], { cwd, stdio });

const runNestiaForError = (cwd, args) =>
  new Promise((resolve, reject) => {
    const child = cp.spawn(NODE, [...CLI, ...args], {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks = [];
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.stderr.on("data", (chunk) => chunks.push(chunk));
    child.on("error", reject);
    child.on("close", (code, signal) => {
      const output = Buffer.concat(chunks).toString("utf8");
      if (code === 0)
        reject(
          new Error(
            `${[NODE, ...CLI, ...args].join(" ")} unexpectedly succeeded.`,
          ),
        );
      else if (signal !== null)
        reject(
          new Error(
            `${[NODE, ...CLI, ...args].join(" ")} ended with ${signal}.`,
          ),
        );
      else resolve(output);
    });
  });

const runTsc = (cwd, stdio = "ignore") => runNode(cwd, TTSC_BIN, [], stdio);

const feature = async (name, port) => {
  const cohort = SDK_ERROR_COHORTS.find(
    (candidate) => candidate.name === name,
  );
  if (cohort !== undefined) return runSdkErrorCohort(cohort);
  if (name === "swagger-watch") return runSwaggerWatchFeature();
  if (name === "bundle-preserve") return runBundlePreserveFeature();
  if (name === "cli-argument-diagnostics")
    return runCliArgumentDiagnosticsFeature();
  if (name === "cli-dependencies") return runCliDependenciesFeature();
  if (name === "source-finder-glob") return runSourceFinderGlobFeature();
  if (name === "distribute-cwd-restore")
    return runNode(
      ROOT,
      path.join(__dirname, "distribute-cwd-restore.js"),
      [],
      "inherit",
    );
  if (name === "output-directory-diagnostics")
    return runNode(
      ROOT,
      path.join(__dirname, "output-directory-diagnostics.js"),
      [],
      "inherit",
    );

  const cwd = featureDirectory(name);
  const configFile =
    name === "cli-config" || name === "cli-config-project"
      ? "nestia.configuration.ts"
      : "nestia.config.ts";
  const generate = async (type, mustBeError = false) => {
    const args = [type, ...generationTail(name)];
    if (mustBeError) return runNestia(cwd, args);
    try {
      await runNestia(cwd, args);
    } catch {
      await runNestia(cwd, args, "inherit");
    }
  };

  if (name.includes("error")) {
    const expected = EXPECTED_ERROR_DIAGNOSTICS.get(name);
    if (expected !== undefined) {
      const output = await runNestiaForError(cwd, [
        "all",
        ...generationTail(name),
      ]);
      // each entry must appear: a feature may pin several contradictions,
      // and the report lists them all at once
      const missing = [expected]
        .flat()
        .filter((line) => output.includes(line) === false);
      if (missing.length !== 0)
        throw new Error(
          `${name} did not report its expected diagnostic(s) ${JSON.stringify(missing)}:\n${output}`,
        );
      return;
    }
    throw new Error(
      `${name} is an error feature without an expected diagnostic in EXPECTED_ERROR_DIAGNOSTICS.`,
    );
  }

  await removePaths(cwd, [
    "swagger.json",
    "src/api/functional",
    "src/api/HttpError.ts",
    "src/api/IConnection.ts",
    "src/api/index.ts",
    "src/api/module.ts",
    "src/api/Primitive.ts",
    "src/test/features/api/automated",
    ...(name === "nested-output-directories" ? ["generated"] : []),
  ]);

  if (name.includes("distribute")) return runDistributeFeature(cwd, name);
  else if (name === "all") {
    const config = fs.readFileSync(path.join(cwd, configFile), "utf8");
    {
      const lines = config.split("\r\n").join("\n").split("\n");
      if (lines.some((l) => l.startsWith(`  output:`))) await generate("sdk");
    }
    for (const kind of ["swagger", "e2e"])
      if (config.includes(`${kind}:`)) await generate(kind);
  } else await generate("all");

  if (name === "nested-output-directories")
    assertNestedOutputDirectories(cwd);
  if (name === "native-namespace-methods")
    assertNativeNamespaceMethods(cwd);
  if (name === "native-import-alias") assertNativeImportAlias(cwd);
  if (name === "native-typeguard-provenance")
    assertNativeTypeGuardProvenance(cwd);
  if (name === "websocket-clone") assertWebSocketCloneAlias(cwd);
  assertGeneratedImportsAreExtensionless(cwd);
  if (name === "cli-project" || name === "cli-config-project") return;
  else if (hasTtsxTestFiles(cwd)) {
    // a pass that needed a retry is reported, never passed off as clean: an
    // intermittent failure is a finding
    const failures = [];
    for (let i = 0; i < 3; ++i)
      try {
        await runTtsxTest(cwd, "ignore", port);
        if (failures.length !== 0) reportRetries(name, failures);
        return;
      } catch (error) {
        failures.push(error);
      }
    reportRetries(name, failures);
    await runTtsxTest(cwd, "inherit", port);
  } else {
    try {
      await runTsc(cwd);
    } catch {
      await runTsc(cwd, "inherit");
    }
  }
};

// Regression lock for generators whose configured output path contains more
// than one missing parent directory. Each generator must create the parent of
// its final file location, rather than assuming a shallow output root exists.
//
// 1. Generate the SDK, Swagger document, and E2E suite into generated/**.
// 2. Require a concrete output from each generator before TypeScript checks.
const assertNestedOutputDirectories = (cwd) => {
  const required = [
    path.join(cwd, "generated/sdk/api/functional/index.ts"),
    path.join(cwd, "generated/documents/openapi/swagger.json"),
  ];
  const missing = required.filter((location) => !fs.existsSync(location));
  const e2e = path.join(cwd, "generated/tests/e2e");
  if (hasTypeScriptFile(e2e) === false) missing.push(e2e);
  if (missing.length !== 0)
    throw new Error(
      `nested-output-directories did not create: ${missing
        .map((location) => path.relative(cwd, location))
        .join(", ")}`,
    );
};

const hasTypeScriptFile = (location) => {
  if (!fs.existsSync(location)) return false;
  for (const entry of fs.readdirSync(location)) {
    const next = path.join(location, entry);
    const stats = fs.statSync(next);
    if (stats.isDirectory() && hasTypeScriptFile(next)) return true;
    if (stats.isFile() && entry.endsWith(".ts")) return true;
  }
  return false;
};

// Regression lock for native SDK site collection. The de-duplication key must
// identify a method declaration, not only its class and method spellings:
// separate TypeScript namespaces may intentionally repeat both names.
//
// 1. Generate Swagger from two namespaced controllers with identical names.
// 2. Require both independently decorated route paths in the document.
const assertNativeNamespaceMethods = (cwd) => {
  const swagger = JSON.parse(
    fs.readFileSync(path.join(cwd, "swagger.json"), "utf8"),
  );
  const expected = ["/north/duplicate", "/south/duplicate"];
  const missing = expected.filter(
    (route) => swagger.paths?.[route] === undefined,
  );
  if (missing.length !== 0)
    throw new Error(
      `native-namespace-methods omitted Swagger route(s): ${missing.join(", ")}`,
    );
};

// Regression lock for named TypeScript imports whose local binding differs
// from the source module's exported name. The metadata must preserve both so
// generated SDK declarations import the real export under the local spelling.
//
// 1. Generate an SDK for a controller that uses `IAccount as Account`.
// 2. Require the generated SDK to retain that named-import alias before tsc.
const assertNativeImportAlias = (cwd) => {
  const root = path.join(cwd, "src/api");
  const matcher = /\bIAccount\s+as\s+Account\b/;
  if (hasMatchingTypeScriptFile(root, matcher) === false)
    throw new Error(
      "native-import-alias did not preserve `IAccount as Account` in the generated SDK.",
    );
};

// Regression lock for aliases carried through the WebSocket clone pipeline.
//
// 1. Clone a WebSocket acceptor type imported as `IPrecision as Precision`.
// 2. Require the generated client to import the cloned original under Precision.
const assertWebSocketCloneAlias = (cwd) => {
  const structures = path.join(cwd, "src/api/structures/IPrecision.ts");
  if (
    fs.existsSync(structures) === false ||
    hasMatchingTypeScriptFile(
      path.join(cwd, "src/api/functional"),
      /\bIPrecision\s+as\s+Precision\s*}\s*from\s*["'][^"']*structures\/IPrecision["']/,
    ) === false
  )
    throw new Error(
      "websocket-clone did not preserve `IPrecision as Precision` from its cloned structure.",
    );
};

const hasMatchingTypeScriptFile = (location, matcher) => {
  if (!fs.existsSync(location)) return false;
  for (const entry of fs.readdirSync(location)) {
    const next = path.join(location, entry);
    const stats = fs.statSync(next);
    if (stats.isDirectory() && hasMatchingTypeScriptFile(next, matcher))
      return true;
    if (stats.isFile() && entry.endsWith(".ts")) {
      const content = fs.readFileSync(next, "utf8");
      if (matcher.test(content)) return true;
    }
  }
  return false;
};

// Regression lock for the special TypeGuardError exception schema. Only
// typia's actual declaration receives that synthetic schema: a user's same-
// named interface must retain its own reflected OpenAPI object.
//
// 1. Generate Swagger for a locally declared TypeGuardError exception.
// 2. Require its response to reference the local shape, not TypeGuardErrorany.
const assertNativeTypeGuardProvenance = (cwd) => {
  const swagger = JSON.parse(
    fs.readFileSync(path.join(cwd, "swagger.json"), "utf8"),
  );
  const schema = swagger.paths?.["/provenance/local"]?.get?.responses?.[409]
    ?.content?.["application/json"]?.schema;
  if (schema?.$ref !== "#/components/schemas/TypeGuardError")
    throw new Error(
      "native-typeguard-provenance did not preserve the local TypeGuardError schema.",
    );
  const properties = swagger.components?.schemas?.TypeGuardError?.properties;
  if (properties?.reason?.type !== "string")
    throw new Error(
      "native-typeguard-provenance omitted the local TypeGuardError.reason property.",
    );
  const typia = swagger.paths?.["/provenance/typia"]?.get?.responses?.[400]
    ?.content?.["application/json"]?.schema;
  if (typia?.$ref !== "#/components/schemas/TypeGuardErrorany")
    throw new Error(
      "native-typeguard-provenance did not retain typia's synthetic TypeGuardError schema.",
    );
};

const removePaths = async (cwd, locations) => {
  await Promise.all(
    locations.map((location) =>
      fs.promises.rm(path.join(cwd, location), {
        force: true,
        recursive: true,
      }),
    ),
  );
};

const generationTail = (name) =>
  name === "cli-config-project"
    ? ["--config", "nestia.configuration.ts", "--project", PROJECT_CONFIG]
    : name === "cli-config"
      ? ["--config", "nestia.configuration.ts"]
      : name === "cli-project"
        ? ["--project", PROJECT_CONFIG]
        : [];

const hasTtsxTestFiles = (cwd) => {
  const iterate = (location) => {
    if (!fs.existsSync(location)) return false;
    for (const file of fs.readdirSync(location)) {
      const next = path.join(location, file);
      const stats = fs.statSync(next);
      if (stats.isDirectory() && iterate(next)) return true;
      if (stats.isFile() && file.endsWith(".ts")) return true;
    }
    return false;
  };
  return iterate(path.join(cwd, "src/test/features"));
};

const assertGeneratedImportsAreExtensionless = (cwd) => {
  const root = path.join(cwd, "src/api");
  if (!fs.existsSync(root)) return;

  const failures = [];
  const iterate = (location) => {
    for (const file of fs.readdirSync(location)) {
      const next = path.join(location, file);
      const stats = fs.statSync(next);
      if (stats.isDirectory()) iterate(next);
      else if (stats.isFile() && file.endsWith(".ts")) {
        const content = fs.readFileSync(next, "utf8");
        const matcher =
          /\b(?:from|export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from)\s+["']([^"']+\.(?:[cm]?js|jsx|[cm]?ts|tsx))["']/g;
        for (const match of content.matchAll(matcher))
          if (match[1].startsWith(".") || path.isAbsolute(match[1]))
            failures.push(
              `${path.relative(cwd, next)} imports ${JSON.stringify(match[1])}`,
            );
      }
    }
  };
  iterate(root);
  if (failures.length)
    throw new Error(
      [
        "Generated SDK sources must not include source file extensions in import specifiers.",
        ...failures,
      ].join("\n"),
    );
};

// Regression lock for the `--config` / `--project` value guard. The reader used
// to test whether the WHOLE argument list had one element, which only equals
// "the flag has no value" when the flag is the sole argument. With any other
// token present it read past the end and reported
// `Cannot read properties of undefined (reading 'endsWith')` instead of naming
// the flag the user got wrong. `swagger --watch --config` is the everyday way to
// hit it.
//
// Scenario:
//   1. Invoke the real CLI through ttsx with each malformed spelling.
//   2. Require the flag's own missing-value diagnostic every time.
//   3. Require the control spelling NOT to report a missing value, so a guard
//      that simply always threw would fail here.
const CLI_ARGUMENT_DIAGNOSTIC_CASES = [
  // The case that already worked: flag is the sole argument.
  { args: ["swagger", "--config"], message: "config file must be provided" },
  // The reported defect: a preceding token moves the end of the list.
  {
    args: ["swagger", "--watch", "--config"],
    message: "config file must be provided",
  },
  {
    args: ["sdk", "--project", "tsconfig.json", "--config"],
    message: "config file must be provided",
  },
  // The same guard serves --project.
  { args: ["sdk", "--project"], message: "project file must be provided" },
  {
    args: ["swagger", "--watch", "--project"],
    message: "project file must be provided",
  },
  // A following flag is a missing value, not a badly named file: the diagnostic
  // must name the flag whose value is absent.
  {
    args: ["swagger", "--config", "--watch"],
    message: "config file must be provided",
  },
];

// `nestia sdk` stages the distribution package and installs what it needs;
// the staged package must then compile, emitting `lib/` (#1676). Each run
// starts from a fresh stage, as the composer leaves a configured one alone.
const runDistributeFeature = async (cwd, name) => {
  const config = fs.readFileSync(path.join(cwd, "nestia.config.ts"), "utf8");
  const distribute = config.match(/distribute:\s*"([^"]+)"/)?.[1];
  if (distribute === undefined)
    throw new Error(`${name} configures no distribute location.`);
  const stage = path.join(cwd, distribute);
  await fs.promises.rm(stage, { force: true, recursive: true });
  // quiet like every other feature, and repeated with the output on failure
  const quietly = async (task) => {
    try {
      await task("ignore");
    } catch {
      await task("inherit");
    }
  };
  await quietly((stdio) =>
    runNestia(cwd, ["sdk", ...generationTail(name)], stdio),
  );
  await quietly((stdio) =>
    run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "compile"], {
      cwd: stage,
      stdio,
      shell: process.platform === "win32",
    }),
  );
  if (fs.existsSync(path.join(stage, "lib", "index.js")) === false)
    throw new Error(`${name}: the staged SDK package emitted no lib/index.js.`);

  // A published package must declare every package its code imports. Inside
  // the workspace an undeclared one still resolves from an ancestor
  // node_modules, so the compile alone cannot tell.
  const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
  const staged = read(path.join(stage, "package.json"));
  const undeclared = [...emittedPackageImports(path.join(stage, "lib"))].filter(
    (name) => staged.dependencies?.[name] === undefined,
  );
  if (undeclared.length !== 0)
    throw new Error(
      `${name}: the staged SDK package imports ${undeclared.join(", ")} without declaring it in its dependencies.`,
    );

  // The stage installs exactly the packages the project resolves: typia,
  // ttsc, and TypeScript, and the tgrid and MCP SDK its WebSocket and MCP
  // functions import, whether or not a package exports its package.json.
  for (const dependency of Object.keys({
    ...staged.dependencies,
    ...staged.devDependencies,
  })) {
    if (dependency === "rimraf" || dependency === "@nestia/fetcher") continue;
    const expected = projectVersion(cwd, dependency);
    const actual = read(
      path.join(stage, "node_modules", dependency, "package.json"),
    ).version;
    if (actual !== expected)
      throw new Error(
        `${name}: the staged SDK package installed ${dependency}@${actual}, but the project resolves ${expected}.`,
      );
  }
};

// The packages the emitted JavaScript and declarations under `directory`
// import, by package name, leaving out relative paths and Node's built-in
// modules: a consumer loads the first and type-checks against the second.
const emittedPackageImports = (directory) => {
  const output = new Set();
  const visit = (location) => {
    for (const entry of fs.readdirSync(location, { withFileTypes: true })) {
      const file = path.join(location, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith(".js") || entry.name.endsWith(".d.ts"))
        for (const [, specifier] of fs
          .readFileSync(file, "utf8")
          .matchAll(
            /(?:\brequire\(\s*|\bimport\(\s*|\bfrom\s+)["']([^"']+)["']/g,
          )) {
          if (specifier.startsWith(".") || specifier.startsWith("node:"))
            continue;
          const segments = specifier.split("/");
          const name = specifier.startsWith("@")
            ? segments.slice(0, 2).join("/")
            : segments[0];
          if (require("module").builtinModules.includes(name) === false)
            output.add(name);
        }
    }
  };
  visit(directory);
  return output;
};

// The version of the package Node would load from `cwd`, found as Node finds
// it: in the nearest `node_modules` holding it.
const projectVersion = (cwd, name) => {
  for (let directory = cwd; ; directory = path.dirname(directory)) {
    const file = path.join(directory, "node_modules", name, "package.json");
    if (fs.existsSync(file))
      return JSON.parse(fs.readFileSync(file, "utf8")).version;
    if (path.dirname(directory) === directory)
      throw new Error(`${name} is not installed above ${cwd}.`);
  }
};

const runCliArgumentDiagnosticsFeature = async () => {
  const cwd = featureDirectory(`.tmp-cli-arguments-${process.pid}`);
  await fs.promises.rm(cwd, { force: true, recursive: true });
  await fs.promises.mkdir(cwd, { recursive: true });
  try {
    // A CLI that never started is not a CLI that printed the wrong diagnostic.
    // Surface the launch failure as itself, or every assertion below reports a
    // missing message and hides the real cause.
    const invoke = (args) =>
      new Promise((resolve, reject) => {
        const child = cp.spawn(NODE, [...CLI, ...args], {
          cwd,
          env: { ...process.env },
          stdio: ["ignore", "pipe", "pipe"],
        });
        let output = "";
        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");
        child.stdout.on("data", (chunk) => (output += chunk));
        child.stderr.on("data", (chunk) => (output += chunk));
        child.on("error", (error) =>
          reject(
            new Error(
              `cli-argument-diagnostics: unable to launch the cli (${error.code ?? "unknown"}): ${error.message}`,
            ),
          ),
        );
        child.on("exit", () => resolve(output));
      });
    const assert = (condition, message) => {
      if (!condition) throw new Error(`cli-argument-diagnostics: ${message}`);
    };

    for (const { args, message } of CLI_ARGUMENT_DIAGNOSTIC_CASES) {
      const output = await invoke(args);
      assert(
        output.includes(message),
        `"nestia ${args.join(" ")}" must report ${JSON.stringify(message)}, got:\n${output}`,
      );
      assert(
        output.includes("endsWith") === false,
        `"nestia ${args.join(" ")}" must not surface a TypeError, got:\n${output}`,
      );
    }

    // Control: a flag that DOES carry its value must get past the guard. The run
    // still fails afterwards (this directory has no nestia config), which is
    // exactly what distinguishes "value accepted" from "value rejected".
    const control = await invoke(["swagger", "--config", "nestia.config.ts"]);
    assert(
      control.includes("must be provided") === false,
      `a supplied --config value must not be reported as missing, got:\n${control}`,
    );
    assert(
      control.includes("endsWith") === false,
      `a supplied --config value must not surface a TypeError, got:\n${control}`,
    );
  } finally {
    await fs.promises.rm(cwd, { force: true, recursive: true });
  }
};

// A glob `input`, as config-pattern's `src/**/*.controller.ts` was before it
// merged into merged-std, whose config takes the application instead: the
// SDK's source finder expands it to exactly the matching controllers, leaving
// out the directory's other sources.
const runSourceFinderGlobFeature = async () => {
  const { SourceFinder } = require(
    path.join(ROOT, "packages/sdk/lib/utils/SourceFinder.js"),
  );
  const base = featureDirectory("merged-std/src/features/config-pattern");
  const found = (
    await SourceFinder.find({
      include: [`${base}/**/*.controller.ts`],
      filter: async (file) => SourceFinder.isTypeScriptSource(file),
    })
  )
    .map((file) => path.relative(base, file).split(path.sep).join("/"))
    .sort();
  const expected = [
    "routes/health/health.controller.ts",
    "routes/performance/performance.controller.ts",
  ];
  if (JSON.stringify(found) !== JSON.stringify(expected))
    throw new Error(
      `the glob input found ${JSON.stringify(found)}; expected ${JSON.stringify(expected)}`,
    );
};

// `nestia dependencies` installs typia at the release @nestia/core's transform
// links, saved exactly. A bare `typia` would take the latest release, which
// @nestia/core refuses whenever typia publishes ahead of nestia (#1663). A fake
// package manager records the commands in place of installing anything.
const runCliDependenciesFeature = async () => {
  const cwd = featureDirectory(`.tmp-cli-dependencies-${process.pid}`);
  await fs.promises.rm(cwd, { force: true, recursive: true });
  await fs.promises.mkdir(cwd, { recursive: true });
  try {
    const log = path.join(cwd, "commands.jsonl");
    const manager = path.join(cwd, "manager.js");
    await fs.promises.writeFile(
      manager,
      `require("fs").appendFileSync(${JSON.stringify(log)}, JSON.stringify(process.argv.slice(2)) + "\\n");`,
      "utf8",
    );
    await run(
      NODE,
      [
        ...CLI,
        "dependencies",
        "--manager",
        `node ${JSON.stringify(manager)}`,
      ],
      { cwd, stdio: "ignore" },
    );

    const expected = JSON.parse(
      await fs.promises.readFile(
        require.resolve("typia/package.json", {
          paths: [path.join(ROOT, "packages/core")],
        }),
        "utf8",
      ),
    ).version;
    const commands = (await fs.promises.readFile(log, "utf8"))
      .split("\n")
      .filter((line) => line.length !== 0)
      .map((line) => JSON.parse(line));
    const actual = JSON.stringify(commands);
    if (
      actual !==
      JSON.stringify([
        ["install", "@nestia/e2e"],
        ["install", "@nestia/fetcher"],
        ["install", `typia@${expected}`, "-E"],
      ])
    )
      throw new Error(
        `cli-dependencies: "nestia dependencies" must install typia@${expected} exactly, got ${actual}`,
      );
  } finally {
    await fs.promises.rm(cwd, { force: true, recursive: true });
  }
};

const runSwaggerWatchFeature = async () => {
  const cwd = featureDirectory(`.tmp-swagger-watch-${process.pid}`);
  await fs.promises.rm(cwd, { force: true, recursive: true });
  await writeSwaggerWatchFixture(cwd);

  const child = cp.spawn(NODE, [...CLI, "swagger", "--watch"], {
    cwd,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  let exit = null;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  child.on("exit", (code, signal) => {
    exit = { code, signal };
  });

  try {
    const swagger = path.join(cwd, "swagger.json");
    await waitUntil(
      "initial swagger watch generation",
      () => swaggerHasPath(swagger, "/health"),
      () => exit,
      () => output,
    );

    const controller = path.join(cwd, "src/controllers/HealthController.ts");
    const original = fs.readFileSync(controller, "utf8");
    const updated = original.replace(
      "  public get(): void {}",
      [
        "  public get(): void {}",
        "",
        '  @core.TypedRoute.Get("watch")',
        "  public watch(): void {}",
      ].join("\n"),
    );
    if (updated === original)
      throw new Error("Unable to update HealthController.ts watch route.");
    fs.writeFileSync(controller, updated, "utf8");

    await waitUntil(
      "swagger watch regeneration",
      () => swaggerHasPath(swagger, "/health/watch"),
      () => exit,
      () => output,
    );
  } finally {
    await stopChild(child);
    // Windows does not release a watcher's handles the instant the process
    // exits, and rmdir fails while any remain. `maxRetries` is what Node
    // documents for EBUSY / ENOTEMPTY / EPERM; without it a correct teardown
    // still loses a race it cannot see.
    await fs.promises.rm(cwd, {
      force: true,
      recursive: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  }
};

// Regression lock for the SDK bundle scaffold behavior: files that already
// exist in the output directory (`index.ts`, `module.ts`, ...) must never be
// overwritten by `nestia sdk`, so that user customizations survive
// regeneration; only missing files are filled in from the bundle. This
// regressed once (#1471 switched to an unconditional overwrite), which broke
// templates that re-export their own `structures` from `module.ts`.
//
// Scenario:
//   1. Generate into an empty directory -> every bundle file is created.
//   2. Customize module.ts / index.ts and delete HttpError.ts.
//   3. Regenerate -> customized files are byte-identical, HttpError.ts is
//      restored from the bundle.
//   4. The preserved output still compiles.
const BUNDLE_FILES = [
  "HttpError.ts",
  "IConnection.ts",
  "index.ts",
  "module.ts",
  "Primitive.ts",
  "Resolved.ts",
];

const runBundlePreserveFeature = async () => {
  const cwd = featureDirectory(`.tmp-bundle-preserve-${process.pid}`);
  await fs.promises.rm(cwd, { force: true, recursive: true });
  try {
    await writeBundlePreserveFixture(cwd);
    const api = (file) => path.join(cwd, "src/api", file);
    const bundled = (file) =>
      fs.readFileSync(
        path.join(ROOT, "packages/sdk/assets/bundle/api", file),
        "utf8",
      );
    const assert = (condition, message) => {
      if (!condition) throw new Error(`bundle-preserve: ${message}`);
    };
    const generate = async () => {
      try {
        await runNestia(cwd, ["sdk"]);
      } catch {
        await runNestia(cwd, ["sdk"], "inherit");
      }
    };

    // 1. FIRST GENERATION FILLS AN EMPTY DIRECTORY FROM THE BUNDLE
    await generate();
    for (const file of BUNDLE_FILES)
      assert(
        fs.readFileSync(api(file), "utf8") === bundled(file),
        `${file} must be copied from the bundle on first generation.`,
      );

    // 2. CUSTOMIZE SOME FILES AND REMOVE ANOTHER
    const customModule = [
      'export type * from "./IConnection";',
      'export * from "./HttpError";',
      'export type * from "./custom";',
      "",
      'export * as functional from "./functional/index";',
      "",
    ].join("\n");
    const customIndex = [
      'import * as api from "./module";',
      "",
      'export * from "./module";',
      'export type * from "./custom";',
      "",
      "export default api;",
      "",
    ].join("\n");
    fs.writeFileSync(
      api("custom.ts"),
      "export type Custom = { value: string };\n",
    );
    fs.writeFileSync(api("module.ts"), customModule);
    fs.writeFileSync(api("index.ts"), customIndex);
    fs.rmSync(api("HttpError.ts"));

    // 3. REGENERATION PRESERVES USER FILES, RESTORES MISSING ONES
    await generate();
    assert(
      fs.readFileSync(api("module.ts"), "utf8") === customModule,
      "customized module.ts must be preserved.",
    );
    assert(
      fs.readFileSync(api("index.ts"), "utf8") === customIndex,
      "customized index.ts must be preserved.",
    );
    assert(
      fs.readFileSync(api("HttpError.ts"), "utf8") === bundled("HttpError.ts"),
      "missing HttpError.ts must be restored from the bundle.",
    );
    for (const file of ["IConnection.ts", "Primitive.ts", "Resolved.ts"])
      assert(
        fs.readFileSync(api(file), "utf8") === bundled(file),
        `untouched ${file} must stay identical to the bundle.`,
      );

    // 4. THE PRESERVED OUTPUT MUST COMPILE
    try {
      await runTsc(cwd);
    } catch {
      await runTsc(cwd, "inherit");
    }
  } finally {
    await fs.promises.rm(cwd, { force: true, recursive: true });
  }
};

const writeBundlePreserveFixture = async (cwd) => {
  await fs.promises.mkdir(path.join(cwd, "src/controllers"), {
    recursive: true,
  });
  await fs.promises.writeFile(
    path.join(cwd, "package.json"),
    JSON.stringify(
      {
        name: "@nestia/test-sdk-bundle-preserve",
        version: "0.0.0",
        private: true,
      },
      null,
      2,
    ),
    "utf8",
  );
  await fs.promises.writeFile(
    path.join(cwd, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../../../config/tsconfig.json",
        compilerOptions: {
          // This fixture is compiled bare (no ttsx test project), so the
          // workspace-resolved @nestia/core sources join the program and
          // their transformer-only generics must not trip TS6196.
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
        include: ["src"],
      },
      null,
      2,
    ),
    "utf8",
  );
  await fs.promises.writeFile(
    path.join(cwd, "nestia.config.ts"),
    [
      'import { INestiaConfig } from "@nestia/sdk";',
      "",
      "export const NESTIA_CONFIG: INestiaConfig = {",
      '  input: ["src/controllers"],',
      '  output: "src/api",',
      "};",
      "export default NESTIA_CONFIG;",
      "",
    ].join("\n"),
    "utf8",
  );
  await fs.promises.writeFile(
    path.join(cwd, "src/controllers/HealthController.ts"),
    [
      'import core from "@nestia/core";',
      'import { Controller } from "@nestjs/common";',
      "",
      '@Controller("health")',
      "export class HealthController {",
      "  @core.TypedRoute.Get()",
      "  public get(): void {}",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );
};

const writeSwaggerWatchFixture = async (cwd) => {
  await fs.promises.mkdir(path.join(cwd, "src/controllers"), {
    recursive: true,
  });
  await fs.promises.writeFile(
    path.join(cwd, "package.json"),
    JSON.stringify(
      {
        name: "@nestia/test-sdk-swagger-watch",
        version: "0.0.0",
        private: true,
      },
      null,
      2,
    ),
    "utf8",
  );
  await fs.promises.writeFile(
    path.join(cwd, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../../../config/tsconfig.json",
        include: ["src"],
      },
      null,
      2,
    ),
    "utf8",
  );
  await fs.promises.writeFile(
    path.join(cwd, "nestia.config.ts"),
    [
      'import { INestiaConfig } from "@nestia/sdk";',
      "",
      "export const NESTIA_CONFIG: INestiaConfig = {",
      '  input: ["src/controllers"],',
      "  swagger: {",
      '    output: "swagger.json",',
      "    info: {",
      '      title: "Swagger Watch Test",',
      "    },",
      "  },",
      "};",
      "export default NESTIA_CONFIG;",
      "",
    ].join("\n"),
    "utf8",
  );
  await fs.promises.writeFile(
    path.join(cwd, "src/controllers/HealthController.ts"),
    [
      'import core from "@nestia/core";',
      'import { Controller } from "@nestjs/common";',
      "",
      '@Controller("health")',
      "export class HealthController {",
      "  @core.TypedRoute.Get()",
      "  public get(): void {}",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );
};

const swaggerHasPath = (file, accessor) => {
  if (!fs.existsSync(file)) return false;
  const document = JSON.parse(fs.readFileSync(file, "utf8"));
  return document.paths?.[accessor] !== undefined;
};

const waitUntil = async (title, predicate, exit, output) => {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < WATCH_TIMEOUT) {
    const status = exit();
    if (status !== null)
      throw new Error(
        [
          `${title} failed because watch process exited with ${
            status.signal ?? `code ${status.code}`
          }.`,
          output().slice(-4_000),
        ].join("\n"),
      );
    try {
      if (predicate()) return;
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }
  throw new Error(
    [
      `${title} timed out.`,
      lastError instanceof Error ? lastError.message : "",
      output().slice(-4_000),
    ]
      .filter(Boolean)
      .join("\n"),
  );
};

// Stop a child and do not return until it is actually gone.
//
// The previous shape raced the exit against `delay(2000).then(() => kill())`,
// and that second branch resolves as soon as SIGKILL has been *sent*. A child
// that ignores the first signal for two seconds -- a watch-mode compiler in the
// middle of work is entitled to -- therefore let this resolve while the process
// was still shutting down, and callers that delete the child's working
// directory next hit EBUSY on Windows, where an open handle blocks rmdir.
const stopChild = async (child) => {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill();
  await Promise.race([exited, delay(2_000)]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await Promise.race([exited, delay(2_000)]);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runTtsxTest = async (cwd, stdio = "ignore", port = BASE_PORT) => {
  const project = ".ttsx.tsconfig.json";
  const projectFile = path.join(cwd, project);
  fs.writeFileSync(
    projectFile,
    JSON.stringify(
      {
        extends: "./tsconfig.json",
        exclude: [],
        compilerOptions: {
          noUnusedLocals: false,
          noUnusedParameters: false,
          outDir: ".",
          plugins: runtimePlugins(cwd),
          rootDir: ".",
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  try {
    await runNode(
      cwd,
      TTSX_BIN,
      [
        "-P",
        project,
        // Rescue tsgo's `@api`-alias emit (`require("../../../api/index.js")`)
        // back to the `.ts` source under ttsx's CommonJS load path; ttsc only
        // rescues that `.js` -> `.ts` mismatch on its ESM resolve hook.
        "-r",
        path.join(__dirname, "ttsx-cjs-extension-rescue.cjs"),
        "-r",
        "@nestjs/platform-express",
        "src/test/index.ts",
      ],
      stdio,
      {
        NODE_OPTIONS: process.env.NODE_OPTIONS ?? "",
        TEST_SDK_PORT: String(port),
      },
    );
  } finally {
    fs.rmSync(projectFile, { force: true });
  }
};

const runtimePlugins = (cwd) => {
  const core = readProjectPlugins(cwd).find((plugin) =>
    isTransform(plugin, "@nestia/core"),
  );
  return [
    {
      transform: "typia/lib/transform",
      enabled: false,
    },
    normalizePlugin({
      ...(core ?? {}),
      transform: "@nestia/core/native/transform.cjs",
    }),
  ];
};

const readProjectPlugins = (cwd) => {
  const projectFile = path.join(cwd, "tsconfig.json");
  if (!fs.existsSync(projectFile)) return [];
  const parsed = JSON.parse(
    stripTrailingCommas(
      stripJsonComments(fs.readFileSync(projectFile, "utf8")),
    ),
  );
  const plugins = parsed.compilerOptions?.plugins;
  return Array.isArray(plugins)
    ? plugins
        .filter((plugin) => typeof plugin === "object" && plugin !== null)
        .map((plugin) => ({ ...plugin }))
    : [];
};

const stripJsonComments = (input) => {
  let output = "";
  let quoted = false;
  let escaped = false;
  for (let i = 0; i < input.length; ++i) {
    const ch = input[i];
    const next = input[i + 1];
    if (quoted) {
      output += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') quoted = false;
    } else if (ch === '"') {
      quoted = true;
      output += ch;
    } else if (ch === "/" && next === "/") {
      while (i < input.length && input[i] !== "\n") ++i;
      output += "\n";
    } else if (ch === "/" && next === "*") {
      i += 2;
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) {
        output += input[i] === "\n" ? "\n" : " ";
        ++i;
      }
      ++i;
    } else output += ch;
  }
  return output;
};

const stripTrailingCommas = (input) =>
  input.replace(/,\s*([}\]])/g, (_, close) => close);

const normalizePlugin = (plugin) => {
  const output = { ...plugin };
  if (output.enabled === false) delete output.enabled;
  return output;
};

const isTransform = (plugin, name) =>
  typeof plugin.transform === "string" && plugin.transform.includes(name);

const argumentValue = (name) => {
  const index = process.argv.findIndex((str) => str === name);
  return index !== -1 && process.argv.length > index + 1
    ? process.argv[index + 1]
    : undefined;
};

const featureFilter = () => {
  const only = argumentValue("--only");
  if (only !== undefined) return (name) => name.includes(only);
  const from = argumentValue("--from");
  if (from !== undefined) return (name) => name >= from;
  return () => true;
};

// `--shard <index>/<count>` (or TEST_SDK_SHARD) runs one of `count` disjoint
// slices of the selected features, so CI can spread the suite over parallel
// jobs. Every feature falls in exactly one slice: the names are sorted and
// dealt out in turn, which also splits consecutive expensive neighbors such as
// the distribute features.
const featureShard = () => {
  const raw = argumentValue("--shard") ?? process.env.TEST_SDK_SHARD;
  if (raw === undefined) return (names) => names;
  const matched = /^(\d+)\/(\d+)$/.exec(raw);
  const index = matched === null ? NaN : Number(matched[1]);
  const count = matched === null ? NaN : Number(matched[2]);
  if (!(count >= 1 && index >= 1 && index <= count))
    throw new Error(
      `invalid shard ${JSON.stringify(raw)}: expected "<index>/<count>" with 1 <= index <= count.`,
    );
  return (names) =>
    [...names].sort().filter((_, position) => position % count === index - 1);
};

const concurrency = (count) => {
  const fallback = Math.min(
    8,
    Math.max(1, os.availableParallelism?.() ?? os.cpus().length ?? 1),
  );
  const raw =
    argumentValue("--concurrency") ?? process.env.TEST_SDK_CONCURRENCY;
  const value = raw === undefined ? fallback : Number(raw);
  return Math.min(
    count,
    Math.max(1, Number.isFinite(value) ? Math.floor(value) : fallback),
  );
};

const measure = (title) => async (task) => {
  const time = Date.now();
  const output = await task();
  const elapsed = Date.now() - time;
  console.log(`${title ?? ""}: ${elapsed.toLocaleString()} ms`);
  return output;
};

// A feature bounded by a wall-clock limit runs alone after the pool, so the
// limit measures the feature rather than the load of the features beside it:
// swagger-watch's first generation outlasted its limit while up to seven other
// features compiled on the same machine (#1695).
const EXCLUSIVE_FEATURES = new Set(["swagger-watch"]);

// Features whose e2e run failed before one passed, with each failure's reason.
const RETRIED_FEATURES = [];
const reportRetries = (name, failures) => {
  const reasons = failures.map((error) =>
    String(error instanceof Error ? error.message : error)
      .split("\n")[0]
      .slice(0, 200),
  );
  RETRIED_FEATURES.push({ name, reasons });
  console.log(
    `  - ${name}: e2e failed ${failures.length} time(s) before the attempt that decides it: ${reasons.join("; ")}`,
  );
};

const runFeatures = async (names) => {
  const pooled = names.filter((name) => !EXCLUSIVE_FEATURES.has(name));
  const exclusive = names.filter((name) => EXCLUSIVE_FEATURES.has(name));
  const parallel = concurrency(pooled.length);
  console.log(`Test Features (concurrency: ${parallel})`);

  const failures = [];
  const runFeature = async (name, port) => {
    try {
      await measure(`  - ${name}`)(() => feature(name, port));
    } catch (error) {
      failures.push({ name, error });
      console.error(`  - ${name}: failed`);
      console.error(error);
    }
  };
  let cursor = 0;
  const worker = async () => {
    while (cursor < pooled.length) {
      const index = cursor++;
      await runFeature(pooled[index], BASE_PORT + index);
    }
  };

  await Promise.all(Array.from({ length: parallel }, worker));
  for (const [index, name] of exclusive.entries())
    await runFeature(name, BASE_PORT + pooled.length + index);
  for (const { name, reasons } of RETRIED_FEATURES)
    if (process.env.GITHUB_ACTIONS === "true")
      console.log(
        `::warning title=test-sdk retry::${name} passed its e2e run only after ${reasons.length} failure(s): ${reasons.join("; ")}`,
      );
  if (RETRIED_FEATURES.length !== 0)
    console.log(
      `\nFeatures whose e2e run needed a retry: ${RETRIED_FEATURES.map((f) => f.name).join(", ")}`,
    );
  if (failures.length !== 0)
    throw new Error(
      `Failed test-sdk features: ${failures.map((f) => f.name).join(", ")}`,
    );
};

// The packages the cli runs from their builds, with the directory each emits.
const BUILT_PACKAGES = [
  ["fetcher", "lib"],
  ["cli", "bin"],
  ["core", "lib"],
  ["sdk", "lib"],
  ["e2e", "lib"],
];

// With TEST_SDK_SKIP_BUILD=1 the cli runs whatever was built last; a source
// edited since would otherwise go untested while every feature passes.
const assertFreshBuilds = () => {
  const newest = (location) => {
    if (fs.existsSync(location) === false) return -Infinity;
    const stats = fs.statSync(location);
    if (stats.isDirectory() === false) return stats.mtimeMs;
    return Math.max(
      stats.mtimeMs,
      ...fs
        .readdirSync(location)
        .map((entry) => newest(path.join(location, entry))),
    );
  };
  const stale = BUILT_PACKAGES.filter(
    ([name, output]) =>
      newest(path.join(ROOT, "packages", name, "src")) >
      newest(path.join(ROOT, "packages", name, output)),
  ).map(([name]) => name);
  if (stale.length !== 0)
    throw new Error(
      `TEST_SDK_SKIP_BUILD=1, but the sources of ${stale.join(", ")} are newer than their builds. Build them, or unset TEST_SDK_SKIP_BUILD.`,
    );
};

const main = async () => {
  const shard = featureShard();
  if (process.env.TEST_SDK_SKIP_BUILD === "1") assertFreshBuilds();
  else
    await run(
      PNPM,
      [
        "--workspace-concurrency=1",
        ...BUILT_PACKAGES.flatMap(([name]) => ["--filter", `./packages/${name}`]),
        "-r",
        "run",
        "build",
      ],
      {
        cwd: ROOT,
        env: {
          NODE_OPTIONS: "",
        },
        shell: process.platform === "win32",
      },
    );

  await measure("\nTotal Elapsed Time")(async () => {
    const filter = featureFilter();
    const names = (await fs.promises.readdir(featureDirectory()))
      .sort()
      .filter((name) => !name.startsWith(".tmp-"))
      .filter((name) => !AGGREGATED_ERROR_FEATURES.has(name))
      .filter((name) => !SDK_COHORT_FEATURES.has(name))
      .filter(filter);
    for (const cohort of SDK_ERROR_COHORTS)
      if (filter(cohort.name) || cohort.members.some(filter))
        names.push(cohort.name);
    if (filter("swagger-watch")) names.push("swagger-watch");
    if (filter("bundle-preserve")) names.push("bundle-preserve");
    if (filter("cli-argument-diagnostics"))
      names.push("cli-argument-diagnostics");
    if (filter("cli-dependencies")) names.push("cli-dependencies");
    if (filter("source-finder-glob")) names.push("source-finder-glob");
    if (filter("distribute-cwd-restore")) names.push("distribute-cwd-restore");
    if (filter("output-directory-diagnostics"))
      names.push("output-directory-diagnostics");
    await runFeatures(shard(names));
  });
};

main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
