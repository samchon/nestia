const cp = require("child_process");
const fs = require("fs");
const Module = require("module");
const path = require("path");
const vm = require("node:vm");
const { TtscCompiler } = require("ttsc");

const ROOT = path.resolve(__dirname, "../..");
const LIB = path.join(__dirname, "lib");
const NODE = process.execPath;
// Resolve ttsc's real JS entry point and run it with this Node, the way
// tests/test-sdk does. The `node_modules/.bin` shim is a `.cmd` file on Windows,
// and Node refuses to spawn one without `shell: true`, so spawning it there
// returns EINVAL with a null status — which the `fail: true` cases would happily
// mistake for the compiler rejecting their input.
const TTSC = packageBin("ttsc", "ttsc");
const CACHE = path.resolve(
  __dirname,
  process.env.TTSC_CACHE_DIR ??
    path.join(ROOT, "node_modules", ".cache", "ttsc"),
);

const main = () => {
  fs.rmSync(LIB, { recursive: true, force: true });
  fs.mkdirSync(LIB, { recursive: true });

  // Pure option routing belongs to core's in-process Go tests:
  // TestTransformValidationModeProtocols covers all ten request modes, and
  // TestTransformRouteStringify* covers the six response modes. The shared
  // HTTP consumer's test_api_body_validator_variants executes every body
  // helper's acceptance, equality, clone and prune semantics.
  // Core Node units own descriptor version decisions; the shared public HTTP runner owns its single CLI rejection connection.

  // Strict body/query/response schema decisions and their non-strict/valid
  // twins run in TestSourceTransformLlmStrictDiagnosticCases. The following
  // single wrapper connection still checks public --noEmit forwarding and
  // diagnostics; TestBuildNoEmitWeakMapLlmDiagnostic owns all native entry paths.
  measure("llm route no-emit diagnostics", () => {
    compile({
      name: "llm-route-no-emit",
      source: "llm-route",
      plugin: { llm: true },
      noEmit: true,
      fail: true,
      expectedDiagnostics: [
        "src/llm-route.ts:11:4 - error TS(nestia.core.TypedRoute): unsupported type detected",
        "- IArticle.weak: WeakMap",
        "- LLM schema does not support WeakMap type.",
      ],
    });
  });

  measure("disabled transform", () => {
    const file = compile({
      name: "disabled",
      source: "disabled",
      plugin: { enabled: false },
    });
    const captured = load(file);
    assert(
      first(captured["TypedRoute.Get"])?.[0] === undefined,
      "disabled TypedRoute was transformed",
    );
    assert(
      first(captured.TypedBody)?.[0] === undefined,
      "disabled TypedBody was transformed",
    );
  });

  measure("no-transform fallbacks", noTransformFallbacks);

  // The transform envelope, read through ttsc's own programmatic API rather
  // than the CLI. Every other case here reads the *emitted JavaScript*, so none
  // of them can see the envelope's side channels at all: `graph` never reaches a
  // .js file, it reaches the bundler adapter that asked for the transform.
  //
  // What it pins is a correctness property, not a performance one. A bundler
  // erases `import type` from its own module graph, so without `graph` nothing
  // connects `controller.ts`'s generated validator to the DTO in `dto.ts`, and a
  // kept filesystem cache replays the stale module after that type changes.
  measure("transform envelope graph", () => {
    const result = transformEnvelope();
    assert(
      result.type === "success",
      `envelope transform did not succeed (${result.type})`,
    );
    assert(
      result.graph !== undefined,
      "envelope carries no graph section; a consumer falls back to whole-snapshot validation",
    );

    // The transform really ran on the controller, so the graph below describes a
    // program whose output is type-derived rather than a passthrough copy.
    const controller = result.typescript[CONTROLLER_KEY];
    assert(
      controller !== undefined,
      `envelope has no transformed source for ${CONTROLLER_KEY}`,
    );
    assert(
      controller.includes(`expected: "IEnvelopeArticle"`),
      `${CONTROLLER_KEY} carries no validator derived from the DTO:\n${controller}`,
    );

    // Positive: the type-only edge a bundler cannot see, under the same key
    // `typescript` uses so the consumer can join the two sections.
    assert(
      (result.graph.edges[CONTROLLER_KEY] ?? []).includes(DTO_KEY),
      `graph.edges[${CONTROLLER_KEY}] omits ${DTO_KEY}: ${JSON.stringify(
        result.graph.edges[CONTROLLER_KEY],
      )}`,
    );
    // Negative twin: a module of the same program that imports nothing must not
    // inherit that edge. A graph that widened every file's edge set would pass
    // the positive assertion while restoring whole-project invalidation.
    assert(
      !(result.graph.edges[UNRELATED_KEY] ?? []).includes(DTO_KEY),
      `graph.edges[${UNRELATED_KEY}] must not carry ${DTO_KEY}`,
    );
    // The config chain stays a universal input for every file even under a
    // future `dependenciesComplete` narrowing, so a missing entry would let a
    // compiler-option edit go unnoticed by every cached module at once.
    assert(
      result.graph.configs[0] === "lib/envelope.json",
      `graph.configs must start at the project tsconfig: ${JSON.stringify(
        result.graph.configs,
      )}`,
    );
    assert(
      result.graph.configs.includes("tsconfig.base.json"),
      `graph.configs omits the extended base config: ${JSON.stringify(
        result.graph.configs,
      )}`,
    );

    // `dependencies` is the second channel: the declarations the analysis
    // actually read for this file, reported alongside the graph and unioned
    // with it by the consumer.
    assert(
      result.dependencies !== undefined,
      "envelope carries no dependencies section",
    );
    assert(
      (result.dependencies[CONTROLLER_KEY] ?? []).includes(DTO_KEY),
      `dependencies[${CONTROLLER_KEY}] omits ${DTO_KEY}: ${JSON.stringify(
        result.dependencies[CONTROLLER_KEY],
      )}`,
    );
    // Negative twin: a file the transform generated nothing for consulted no
    // declaration, so it gets no entry rather than an empty or inherited one.
    assert(
      result.dependencies[UNRELATED_KEY] === undefined,
      `dependencies must not carry ${UNRELATED_KEY}: ${JSON.stringify(
        result.dependencies[UNRELATED_KEY],
      )}`,
    );
  });

  // Core Go owns exact library provenance decisions. The shared installed
  // HTTP runner executes the original no-DOM user global once, while its
  // existing DOM consumer checks native lookalike rejection and Blob acceptance.

  // The shared installed producer uses the three v11 plugin entries.
  // test_public_legacy_plugins preserves its explicit assert arguments and
  // exactly one SDK metadata application on each of eight authored routes.
};

// Envelope keys are project-relative slash paths, and `projectRoot` below
// anchors the project at this workspace so they stay readable and stable while
// the generated tsconfig lives under `lib/` like every other case's.
const CONTROLLER_KEY = "src/envelope/controller.ts";
const DTO_KEY = "src/envelope/dto.ts";
const UNRELATED_KEY = "src/envelope/unrelated.ts";

/**
 * Run the envelope project through ttsc's programmatic transform API and return
 * the raw `ITtscCompilerTransformation`.
 *
 * `projectRoot` is what keeps the keys project-relative: without it the project
 * root would be `lib/`, every source would key as `../src/...`, and the native
 * host drops a key that escapes cwd — the envelope would come back empty and
 * every assertion below would be vacuous.
 */
const transformEnvelope = () => {
  const project = writeProject({
    name: "envelope",
    source: "envelope",
    plugin: { validate: "assert" },
    include: ["../src/envelope"],
  });
  return new TtscCompiler({
    cacheDir: CACHE,
    cwd: __dirname,
    env: { TTSC_CACHE_DIR: CACHE },
    projectRoot: __dirname,
    tsconfig: project,
  }).transform();
};

const compile = (props) => {
  const project = writeProject(props);
  const args = [TTSC, "--cache-dir", CACHE, "-p", project];
  if (props.noEmit === true) args.push("--noEmit");
  const result = cp.spawnSync(NODE, args, {
    cwd: __dirname,
    encoding: "utf8",
    env: {
      ...process.env,
      TTSC_CACHE_DIR: CACHE,
    },
  });
  // A compiler that never started is not a compiler that rejected the input.
  // Check this before the `fail: true` branch, or a spawn failure would satisfy
  // every expected-failure case and the suite would pass vacuously.
  if (result.error !== undefined)
    throw new Error(
      `${props.name}: unable to launch ttsc (${result.error.code ?? "unknown"}): ${result.error.message}`,
    );
  if (props.fail === true) {
    if (result.status === 0)
      throw new Error(`${props.name}: compilation was expected to fail.`);
    const diagnostics =
      `${result.stdout ?? ""}\n${result.stderr ?? ""}`.replaceAll("\\", "/");
    for (const expected of props.expectedDiagnostics ?? [])
      assert(
        diagnostics.includes(expected),
        `${props.name}: diagnostic missing ${JSON.stringify(expected)}\n${diagnostics}`,
      );
    const output = path.join(LIB, props.name);
    assert(
      !fs.existsSync(output),
      `${props.name}: failed compilation published ${output}`,
    );
    return null;
  }
  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(
      `${props.name}: compilation failed (exit ${result.status}).`,
    );
  }
  return path.join(LIB, props.name, `${props.source}.js`);
};

// With the transform off and `doNotThrowTransformError(false)`, a request
// decorator hands the handler the request value as it arrived (#1666): the
// headers object, the query and form-urlencoded body with repeated keys as
// arrays, and the multipart fields and files. The headers used to arrive as an
// array of entries, and the urlencoded and multipart bodies threw.
const noTransformFallbacks = () => {
  const file = compile({
    name: "fallbacks",
    source: "fallbacks",
    plugin: { enabled: false },
  });
  // plain node cannot load the workspace manifests' TypeScript entries, so
  // @nestia/* requests are served from the packages' built lib/
  const result = cp.spawnSync(
    NODE,
    ["-r", path.join(__dirname, "built-packages.cjs"), file],
    { cwd: __dirname, encoding: "utf8" },
  );
  if (result.error !== undefined) throw result.error;
  assert(
    result.status === 0,
    `fallbacks: server script failed (exit ${result.status})\n${result.stdout}\n${result.stderr}`,
  );
  const line = (result.stdout ?? "")
    .split(/\r?\n/)
    .reverse()
    .find((text) => text.startsWith("{"));
  assert(line !== undefined, `fallbacks: no result printed\n${result.stdout}`);
  const output = JSON.parse(line);
  const expect = (key, status, body) =>
    assert(
      output[key].status === status &&
        JSON.stringify(output[key].body) === JSON.stringify(body),
      `fallbacks: ${key} answered ${JSON.stringify(output[key])}`,
    );
  expect("headers", 200, { isArray: false, name: "abc" });
  expect("query", 200, { title: "hello", tags: ["a", "b"] });
  expect("urlencoded", 201, { title: "hello", tags: ["a", "b"] });
  expect("multipart", 201, {
    title: "hello",
    tags: ["a", "b"],
    file: { name: "note.txt", text: "content" },
  });
};

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

const writeProject = (props) => {
  const file = path.join(LIB, `${props.name}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        extends: "../tsconfig.base.json",
        compilerOptions: {
          outDir: `./${props.name}`,
          rootDir: "../src",
          ...props.compilerOptions,
          plugins: props.plugins ?? [
            {
              transform: "typia/lib/transform",
              enabled: false,
            },
            // `@nestia/sdk` is not a standalone ttsc plugin: its Go transform
            // is linked into the `@nestia/core` host as a contributor, so it
            // must not be listed as a separate plugin entry here.
            {
              transform: "@nestia/core/native/transform.cjs",
              ...props.plugin,
            },
          ],
        },
        include: props.include ?? [`../src/${props.source}.ts`],
      },
      null,
      2,
    ),
    "utf8",
  );
  return file;
};

const load = (file) => {
  const captured = {
    TypedBody: [],
    TypedHeaders: [],
    TypedParam: [],
    TypedQuery: [],
    "TypedRoute.Get": [],
    "TypedRoute.Post": [],
  };
  const decorator =
    (key) =>
    (...args) => {
      captured[key].push(args);
      return () => undefined;
    };
  const modules = {
    "@nestia/core": {
      TypedBody: decorator("TypedBody"),
      TypedHeaders: decorator("TypedHeaders"),
      TypedParam: decorator("TypedParam"),
      TypedQuery: decorator("TypedQuery"),
      TypedRoute: {
        Get: decorator("TypedRoute.Get"),
        Post: decorator("TypedRoute.Post"),
      },
    },
    "@nestjs/common": {
      Controller: () => () => undefined,
    },
    "@nestia/sdk": {
      OperationMetadata: () => () => undefined,
    },
  };
  // Evaluate this emitted CommonJS module with explicit decorator doubles.
  // Its typia imports still resolve beside the fixture and execute normally;
  // neither the process loader nor foreign module exports are replaced.
  const requireFromFile = Module.createRequire(file);
  const fixtureModule = { exports: {} };
  vm.compileFunction(
    fs.readFileSync(file, "utf8"),
    ["exports", "require", "module", "__filename", "__dirname"],
    { filename: file },
  ).call(
    fixtureModule.exports,
    fixtureModule.exports,
    (request) => modules[request] ?? requireFromFile(request),
    fixtureModule,
    file,
    path.dirname(file),
  );
  return captured;
};

const first = (array) => array[0];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const measure = (title, task) => {
  const time = Date.now();
  task();
  const elapsed = Date.now() - time;
  console.log(`  - ${title}: ${elapsed.toLocaleString()} ms`);
};

main();
