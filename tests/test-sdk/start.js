const cp = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const NODE = process.execPath;
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const PROJECT_CONFIG = "tsconfig.project.json";
// The cli is launched from its TypeScript source through ttsx: the workspace
// packages resolve each other's src/*.ts entries, which plain `node` cannot
// load (`--no-experimental-strip-types`), while ttsx installs runtime hooks
// that propagate to child processes via NODE_OPTIONS.
const CLI_MAIN = path.join(ROOT, "packages/cli/src/index.ts");
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
const TYPESCRIPT_ERROR_FEATURES = new Set([
  "body-error-get",
  "body-error-implicit",
  "method-error-head-non-void",
  "route-invalid-path-error",
  "security-error-not-found",
  "security-error-not-oauth2",
  "security-error-out-of-scopes",
]);
const EXPECTED_ERROR_DIAGNOSTICS = new Map([
  [
    "websocket-error-invalid-acceptor-arity",
    "@WebSocketRoute.Acceptor() must have three type arguments.",
  ],
]);
// One command compiles each compatible native-diagnostic cohort. Each entry
// names its source fixture and exact diagnostic-line count; SDK reflection
// errors remain individual because compilation must succeed before reflection.
const ERROR_DIAGNOSTIC_COHORTS = [
  {
    name: "error-diagnostics",
    config: "features/body-error-generic/error-diagnostics.config.ts",
    project: "features/body-error-generic/tsconfig.json",
    output: ".tmp-error-diagnostics",
    cases: [
      ["body-error-generic", 2],
      ["body-error-json", 1],
      ["headers-error-array", 1],
      ["headers-error-atomic", 1],
      ["headers-error-property-array", 1],
      ["headers-error-property-nullable", 1],
      ["headers-error-property-single", 1],
      ["headers-error-union-object", 1],
      ["headers-error-union-property", 1],
      ["param-error-array", 1],
      ["param-error-generic", 1],
      ["param-error-native", 1],
      ["param-error-object", 1],
      ["param-error-union", 1],
      ["param-error-union-literal", 1],
      ["plain-error-any", 1],
      ["plain-error-nullable", 1],
      ["plain-error-number", 1],
      ["plain-error-object", 1],
      ["query-error-array", 1],
      ["query-error-atomic", 1],
      ["query-error-generic", 1],
      ["query-error-native", 1],
      ["query-error-union-array", 1],
      ["query-error-union-literal", 1],
      ["query-error-union-object", 1],
      ["query-error-union-property", 1],
      ["route-error-generic", 1],
      ["route-error-json", 1],
      ["websocket-error-invalid-acceptor", 1],
      ["websocket-error-invalid-driver", 1],
      ["websocket-error-invalid-parameter", 1],
      ["websocket-error-no-acceptor", 1],
    ],
  },
  {
    name: "mcp-error-diagnostics",
    config: "features/mcp-error-extra-parameter/mcp-error-diagnostics.config.ts",
    project: "features/mcp-error-extra-parameter/tsconfig.json",
    output: ".tmp-mcp-error-diagnostics",
    cases: [
      ["mcp-error-extra-parameter", 1],
      ["mcp-error-missing-params-decorator", 1],
      ["mcp-error-multiple-params", 1],
      ["mcp-error-no-params", 1],
      ["mcp-error-param-dynamic-properties", 2],
      ["mcp-error-param-non-object", 2],
      ["mcp-error-return-dynamic-properties", 1],
      ["mcp-error-return-non-object", 1],
      ["mcp-error-return-union-void-object", 1],
    ],
  },
];
const AGGREGATED_ERROR_FEATURES = new Set(
  ERROR_DIAGNOSTIC_COHORTS.flatMap((cohort) =>
    cohort.cases.map(([name]) => name),
  ),
);

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
  runNode(cwd, TTSX_BIN, [CLI_MAIN, ...args], stdio);

const runNestiaForError = (cwd, args) =>
  new Promise((resolve, reject) => {
    const child = cp.spawn(NODE, [TTSX_BIN, CLI_MAIN, ...args], {
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
            `${[NODE, TTSX_BIN, CLI_MAIN, ...args].join(" ")} unexpectedly succeeded.`,
          ),
        );
      else if (signal !== null)
        reject(
          new Error(
            `${[NODE, TTSX_BIN, CLI_MAIN, ...args].join(" ")} ended with ${signal}.`,
          ),
        );
      else resolve(output);
    });
  });

const runTsc = (cwd, stdio = "ignore") => runNode(cwd, TTSC_BIN, [], stdio);

const runDiagnosticCohort = async (cohort) => {
  try {
    const output = await runNestiaForError(__dirname, [
      "all",
      "--config",
      cohort.config,
      "--project",
      cohort.project,
    ]);
    // Native transform diagnostics have one `error TS(...)` line each; unlike
    // TypeScript's CLI they intentionally do not append a summary line. Strip
    // the CLI's color sequences before matching either diagnostic presentation.
    const normalized = output
      .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
      .replaceAll("\\", "/");
    const diagnostics = normalized
      .split(/\r?\n/)
      .filter((line) => / - error TS(?:\([^)]*\)|\d+):/.test(line));
    const expected = cohort.cases.reduce(
      (sum, [, count]) => sum + count,
      0,
    );
    if (diagnostics.length !== expected)
      throw new Error(
        `${cohort.name} reported ${diagnostics.length} compiler errors; expected ${expected}:\n${output}`,
      );
    const mismatch = cohort.cases
      .map(([name, expected]) => {
        const actual = diagnostics.filter((line) =>
          line.includes(`features/${name}/src/controllers/`),
        ).length;
        return actual === expected ? null : `${name}: ${actual}/${expected}`;
      })
      .filter((entry) => entry !== null);
    const unexpected = diagnostics.filter(
      (line) =>
        cohort.cases.some(([name]) =>
          line.includes(`features/${name}/src/controllers/`),
        ) === false,
    );
    if (mismatch.length !== 0 || unexpected.length !== 0)
      throw new Error(
        `${cohort.name} diagnostic mismatch (${mismatch.join(", ") || "none"}); unexpected source(s): ${unexpected.join("; ") || "none"}:\n${output}`,
      );
  } finally {
    await removePaths(__dirname, [cohort.output]);
  }
};

const feature = async (name, port) => {
  const cohort = ERROR_DIAGNOSTIC_COHORTS.find(
    (candidate) => candidate.name === name,
  );
  if (cohort !== undefined) return runDiagnosticCohort(cohort);
  if (name === "swagger-watch") return runSwaggerWatchFeature();
  if (name === "bundle-preserve") return runBundlePreserveFeature();
  if (name === "cli-argument-diagnostics")
    return runCliArgumentDiagnosticsFeature();
  if (name === "distribute-cwd-restore")
    return runNode(
      ROOT,
      path.join(__dirname, "distribute-cwd-restore.js"),
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
      if (output.includes(expected) === false)
        throw new Error(
          `${name} did not report its expected diagnostic:\n${output}`,
        );
      return;
    }
    try {
      if (TYPESCRIPT_ERROR_FEATURES.has(name)) await runTsc(cwd);
      await generate("all", true);
      if (hasTtsxTestFiles(cwd)) await runTtsxTest(cwd, "ignore", port);
    } catch {
      return;
    }
    throw new Error("compile error must be occurred.");
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

  if (name.includes("distribute")) return;
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
    for (let i = 0; i < 3; ++i)
      try {
        await runTtsxTest(cwd, "ignore", port);
        return;
      } catch {}
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
        const child = cp.spawn(NODE, [TTSX_BIN, CLI_MAIN, ...args], {
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

const runSwaggerWatchFeature = async () => {
  const cwd = featureDirectory(`.tmp-swagger-watch-${process.pid}`);
  await fs.promises.rm(cwd, { force: true, recursive: true });
  await writeSwaggerWatchFixture(cwd);

  const child = cp.spawn(NODE, [TTSX_BIN, CLI_MAIN, "swagger", "--watch"], {
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
    await fs.promises.rm(cwd, { force: true, recursive: true });
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

const stopChild = async (child) => {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill();
  await Promise.race([
    exited,
    delay(2_000).then(() => {
      if (child.exitCode === null && child.signalCode === null)
        child.kill("SIGKILL");
    }),
  ]);
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

const runFeatures = async (names) => {
  const parallel = concurrency(names.length);
  console.log(`Test Features (concurrency: ${parallel})`);

  const failures = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < names.length) {
      const index = cursor++;
      const name = names[index];
      try {
        await measure(`  - ${name}`)(() => feature(name, BASE_PORT + index));
      } catch (error) {
        failures.push({ name, error });
        console.error(`  - ${name}: failed`);
        console.error(error);
      }
    }
  };

  await Promise.all(Array.from({ length: parallel }, worker));
  if (failures.length !== 0)
    throw new Error(
      `Failed test-sdk features: ${failures.map((f) => f.name).join(", ")}`,
    );
};

const main = async () => {
  if (process.env.TEST_SDK_SKIP_BUILD !== "1")
    await run(
      PNPM,
      [
        "--workspace-concurrency=1",
        "--filter",
        "@nestia/fetcher",
        "--filter",
        "nestia",
        "--filter",
        "@nestia/core",
        "--filter",
        "@nestia/sdk",
        "--filter",
        "@nestia/e2e",
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
      .filter(filter);
    for (const cohort of ERROR_DIAGNOSTIC_COHORTS)
      if (
        filter(cohort.name) ||
        cohort.cases.some(([name]) => filter(name))
      )
        names.push(cohort.name);
    if (filter("swagger-watch")) names.push("swagger-watch");
    if (filter("bundle-preserve")) names.push("bundle-preserve");
    if (filter("cli-argument-diagnostics"))
      names.push("cli-argument-diagnostics");
    if (filter("distribute-cwd-restore")) names.push("distribute-cwd-restore");
    await runFeatures(names);
  });
};

main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
