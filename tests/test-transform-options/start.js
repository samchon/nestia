const cp = require("child_process");
const fs = require("fs");
const Module = require("module");
const path = require("path");
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
  ROOT,
  process.env.TTSC_CACHE_DIR ?? path.join(ROOT, "node_modules", ".ttsc"),
);

const VALIDATE_CASES = [
  ["assert", "assert"],
  ["is", "is"],
  ["validate", "validate"],
  ["assertEquals", "assert"],
  ["equals", "is"],
  ["validateEquals", "validate"],
  ["assertClone", "assert"],
  ["validateClone", "validate"],
  ["assertPrune", "assert"],
  ["validatePrune", "validate"],
];

const STRINGIFY_CASES = [
  ["assert", "assert"],
  ["is", "is"],
  ["validate", "validate"],
  ["stringify", "stringify"],
  ["validate.log", "validate.log"],
  [null, null],
];

const LLM_CASES = ["llm-body", "llm-query", "llm-route"];

const main = () => {
  fs.rmSync(LIB, { recursive: true, force: true });
  fs.mkdirSync(LIB, { recursive: true });

  measure("validate options", () => {
    for (const [option, expectedType] of VALIDATE_CASES) {
      const file = compile({
        name: `validate-${option}`,
        source: "validate",
        plugin: { validate: option },
      });
      const captured = load(file);
      const body = first(captured.TypedBody)?.[0];
      assert(body?.type === expectedType, `${option}: wrong body validator`);
      assertValidate(option, body);

      // Headers intentionally collapse the ten body modes to assert, is, and
      // validate. Their HTTP decoder creates a fresh object, so clone, prune,
      // and equals do not carry body-validator semantics.
      const headers = first(captured.TypedHeaders)?.[0];
      const expectedHeaderType =
        option === "is" || option === "equals"
          ? "is"
          : option.startsWith("validate")
            ? "validate"
            : "assert";
      assert(
        headers?.type === expectedHeaderType,
        `${option}: wrong headers validator (got ${headers?.type}, expected ${expectedHeaderType})`,
      );

      const param = first(captured.TypedParam);
      const expectValidateParam = option.startsWith("validate");
      assert(
        (param?.[2] === true) === expectValidateParam,
        `${option}: wrong TypedParam validation flag`,
      );

      // TypedQuery shares the assert/is/validate routing with TypedBody but
      // collapses Clone/Prune variants onto the base assert/validate paths
      // (see nestiaCoreGenerateTypedQuery in core_transform.go). Asserting
      // the captured type per mode locks the same routing table integration
      // tests cannot otherwise reach.
      const query = first(captured.TypedQuery)?.[0];
      assert(
        query?.type === expectedType,
        `${option}: wrong TypedQuery validator (got ${query?.type}, expected ${expectedType})`,
      );
    }
  });

  measure("stringify options", () => {
    for (const [option, expectedType] of STRINGIFY_CASES) {
      const file = compile({
        name: `stringify-${option ?? "null"}`,
        source: "stringify",
        plugin: { stringify: option },
      });
      const captured = load(file);
      const route = first(captured["TypedRoute.Get"])?.[0];
      if (expectedType === null) assert(route === null, "null stringify failed");
      else
        assert(
          route?.type === expectedType,
          `${option}: wrong response stringifier`,
        );
    }
  });

  measure("llm strict diagnostics", () => {
    for (const source of LLM_CASES)
      compile({
        name: source,
        source,
        plugin: { llm: { strict: true } },
        fail: true,
        expectedDiagnostics:
          source === "llm-route"
            ? [
                "src/llm-route.ts:11:4 - error TS(nestia.core.TypedRoute): unsupported type detected",
                "- IArticle.weak: WeakMap",
                "- LLM schema does not support WeakMap type.",
              ]
            : undefined,
      });
  });

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

  // Runtime-native identity, decided from the program's own default-library set
  // rather than from a file name. `@nestia/core` hosts typia's transform, so it
  // owes that analysis the classification typia's own host installs; without it
  // the analysis falls back to a `lib.*.d.ts` base-name test and any file that
  // matches the pattern is taken for a runtime authority.
  //
  // The consequence is not cosmetic. A type promoted to native identity loses
  // its members to an `instanceof` check, so a purely user-authored global is
  // validated by a constructor that need not exist at runtime -- a
  // `ReferenceError` where the members would have been checked.
  measure("user-authored global keeps its members", () => {
    const user = loadRaw(
      compile({
        name: "native-global-user",
        source: "native-global/user",
        plugin: {},
        // No DOM, no `@types`, so this program's only `Blob` is the one
        // `lib.custom.d.ts` declares beside it.
        compilerOptions: { lib: ["ESNext"], types: [] },
        include: [
          "../src/native-global/lib.custom.d.ts",
          "../src/native-global/user.ts",
        ],
      }),
    );
    assert(
      user.check({ blob: { customField: "x" } }) === true,
      "a user-authored global Blob was not validated structurally",
    );
    assert(
      user.check({ blob: {} }) === false,
      "a user-authored global Blob accepted a value missing its member",
    );

    // The one-axis twin: same type name, same shape of use, real provenance.
    // `Blob` from `lib.dom.d.ts` is a runtime authority, so it must keep
    // native identity and reject a structural lookalike.
    const runtime = loadRaw(
      compile({
        name: "native-global-runtime",
        source: "native-global/runtime",
        plugin: {},
        compilerOptions: { lib: ["ESNext", "DOM"], types: [] },
      }),
    );
    assert(
      runtime.check({ blob: { customField: "x" } }) === false,
      "a real DOM Blob lost its native identity to a structural check",
    );
    assert(
      runtime.check({ blob: new Blob([]) }) === true,
      "a real DOM Blob rejected an actual Blob instance",
    );
  });

  measure("aliased core imports", () => {
    const file = compile({
      name: "aliases",
      source: "aliases",
      plugin: { validate: "validate" },
    });
    const captured = load(file);
    assert(
      first(captured.TypedBody)?.[0]?.type === "validate",
      "aliased TypedBody was not transformed",
    );
    assert(
      first(captured.TypedParam)?.[2] === true,
      "aliased TypedParam did not receive validation flag",
    );
    assert(
      first(captured.TypedQuery)?.[0]?.type === "validate",
      "aliased TypedQuery was not transformed",
    );
    assert(
      first(captured["TypedRoute.Post"])?.[1]?.type === "assert",
      "aliased TypedRoute.Post was not transformed",
    );
  });
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
  const result = cp.spawnSync(
    NODE,
    args,
    {
      cwd: __dirname,
      encoding: "utf8",
      env: {
        ...process.env,
        TTSC_CACHE_DIR: CACHE,
      },
    },
  );
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
    const diagnostics = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.replaceAll(
      "\\",
      "/",
    );
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
          plugins: [
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
  const decorator = (key) =>
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
  const original = Module._load;
  Module._load = (request, parent, isMain) =>
    modules[request] ?? original.call(Module, request, parent, isMain);
  try {
    delete require.cache[file];
    require(file);
  } finally {
    Module._load = original;
  }
  return captured;
};

// `load`'s counterpart for a module that exports the transform's product
// directly instead of feeding it to a decorator. Nothing needs stubbing: these
// fixtures import only `typia`, whose runtime helpers the emitted code calls for
// real, which is the point — the assertion is on behavior, not on text.
const loadRaw = (file) => {
  delete require.cache[file];
  return require(file);
};

const assertValidate = (option, validator) => {
  const valid = () => ({ title: "title", count: 1 });
  const extra = () => ({ ...valid(), extra: "x" });
  if (option === "assert") validator.assert(extra());
  else if (option === "is") assert(validator.is(extra()), "is rejected extra");
  else if (option === "validate")
    assert(validator.validate(extra()).success, "validate rejected extra");
  else if (option === "assertEquals")
    assertThrows(() => validator.assert(extra()), "assertEquals accepted extra");
  else if (option === "equals")
    assert(!validator.is(extra()), "equals accepted extra");
  else if (option === "validateEquals")
    assert(!validator.validate(extra()).success, "validateEquals accepted extra");
  else if (option === "assertClone") {
    const input = extra();
    const output = validator.assert(input);
    assert("extra" in input, "assertClone mutated input");
    assert(!("extra" in output), "assertClone kept extra data");
  } else if (option === "validateClone") {
    const input = extra();
    const output = validator.validate(input);
    assert(output.success, "validateClone rejected valid input");
    assert("extra" in input, "validateClone mutated input");
    assert(!("extra" in output.data), "validateClone kept extra data");
  } else if (option === "assertPrune") {
    const input = extra();
    const output = validator.assert(input);
    assert(!("extra" in input), "assertPrune did not prune input");
    assert(!("extra" in output), "assertPrune kept extra data");
  } else if (option === "validatePrune") {
    const input = extra();
    const output = validator.validate(input);
    assert(output.success, "validatePrune rejected valid input");
    assert(!("extra" in input), "validatePrune did not prune input");
    assert(!("extra" in output.data), "validatePrune kept extra data");
  } else throw new Error(`Unknown validate option: ${option}`);
};

const assertThrows = (task, message) => {
  try {
    task();
  } catch {
    return;
  }
  throw new Error(message);
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
