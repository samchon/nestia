const cp = require("child_process");
const fs = require("fs");
const Module = require("module");
const path = require("path");
const vm = require("vm");
const { TtscCompiler } = require("ttsc");
const { prepare } = require("../test-sdk/consumer.cjs");

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

/**
 * Verifies the installed ttsc wrapper and shared generated-validator runtime.
 *
 * Native rule-only diagnostics live in Go unit tests. This entry retains the
 * wrapper seams that those direct calls cannot exercise.
 *
 * 1. Emit and evaluate the complete option runtime batch once.
 * 2. Verify version rejection, disabled/noEmit handling, fallback HTTP,
 *    programmatic dependency envelopes and the supported v11 plugin list.
 *
 * @evidence contracts/testing.md#behavioral-verification Named cases assert real compiler rejection reasons, disabled decorator arguments, noEmit LLM diagnostics, manual fallback HTTP behavior, transformed dependency envelopes and the v11 list's single metadata attachment. The Go boundary supplies all generated option runtime checks.
 * @evidence contracts/testing.md#independent-expectations Supported compiler options, authored DTOs/dependency edges and decorator runtime protocols establish the assertions; version rejection uses the actual installed wrapper and fixture manifest. The verifier's literal mode table and authored values independently judge generated helpers.
 * @evidence contracts/testing.md#distinguishing-cases Version mismatch, disabled host, noEmit invalid return, manual fallback, related/unrelated declaration edges and the legacy list retain named failure identities. Strict rule variants execute in TestBuildLlmStrictDiagnosticCases rather than additional wrapper launches.
 * @evidence contracts/testing.md#execution-ownership The workspace start command invokes this exported JavaScript main. The native E2E module emits nineteen fixtures in one Go test process and calls the separately exported verifyOptions once; private named callbacks remain reviewed through this selected entry.
 * @evidence contracts/e2e.md#necessary-boundary Wrapper resolution/filtering, installed plugin version checks, noEmit reporting, fallback server transport and programmatic compiler side channels require their actual components; direct native rule calls cannot establish these wrapper/HTTP connections.
 * @evidence contracts/e2e.md#shared-execution Ten validator modes, six serializers, aliases and two native-identity fixtures share one compiled Go process and one Node verifier. Distinct wrapper plugin/version/noEmit states still require separate actual compiler requests; these remaining requests are an explicit preparation cost.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each compiler request has named project/output files, native batch outputs belong to its temporary directory, and the local VM decorator probe resolves real helpers without changing the global loader. Fallback HTTP runs plain Node against freshly packed, installed packages without workspace resolution hooks and finally removes that owned installation; its server closes its socket. Version checks author isolated fixture manifests and finally remove their external temporary root without editing installed package state.
 * @evidence contracts/e2e.md#preserved-coverage Validator-family, equality/clone/prune, valid/malformed body, header/param/query argument, serializer, alias and Blob assertions remain in verifyOptions. Pure strict LLM rules retain exact diagnostic/positive controls in Go; actual disabled and noEmit wrapper assertions remain here.
 */
const main = async () => {
  const failures = [];
  const runCase = async (name, task) => {
    const started = Date.now();
    try {
      await task();
    } catch (error) {
      failures.push(name);
      console.error(name, error);
    } finally {
      console.log(`${name}: ${(Date.now() - started).toLocaleString()} ms`);
    }
  };
  fs.rmSync(LIB, { recursive: true, force: true });
  fs.mkdirSync(LIB, { recursive: true });

  await runCase("option runtime batch", () => {
    const result = cp.spawnSync(
      process.env.TTSC_GO_BINARY ?? "go",
      ["test", "-count=1", "-v", "./..."],
      {
        cwd: path.join(__dirname, "native"),
        encoding: "utf8",
        env: { ...process.env, NESTIA_OPTIONS_NODE: NODE },
      },
    );
    if (result.error !== undefined) throw result.error;
    assert(
      result.status === 0,
      `option runtime batch failed (exit ${result.status})\n${result.stdout}\n${result.stderr}`,
    );
    process.stdout.write(result.stdout ?? "");
  });

  await runCase("typia version guard", typiaVersionGuard);

  // enabled is resolved by ttsc before constructing the native payload, so
  // disabling the host must retain a real wrapper connection test.
  await runCase("disabled transform", () => {
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

  // Strict rule semantics are owned by TestBuildLlmStrictDiagnosticCases.
  // Retain one real ttsc noEmit connection rather than one host per rule.
  await runCase("llm route no-emit diagnostics", () => {
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

  await runCase("no-transform fallbacks", noTransformFallbacks);

  // The transform envelope, read through ttsc's own programmatic API rather
  // than the CLI. Every other case here reads the *emitted JavaScript*, so none
  // of them can see the envelope's side channels at all: `graph` never reaches a
  // .js file, it reaches the bundler adapter that asked for the transform.
  //
  // What it pins is a correctness property, not a performance one. A bundler
  // erases `import type` from its own module graph, so without `graph` nothing
  // connects `controller.ts`'s generated validator to the DTO in `dto.ts`, and a
  // kept filesystem cache replays the stale module after that type changes.
  await runCase("transform envelope graph", () => {
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
  // The three plugin entries nestia v11 documented. `@nestia/core/lib/transform`
  // resolves to the native descriptor, so ttsc deduplicates it with the entry
  // the package manifest registers and composes typia into one host; with a
  // descriptor of its own it built a second native host and ttsc refused the
  // emit (#1690). The options still apply, and the SDK entry still attaches its
  // metadata once per route, as v11 did.
  await runCase("v11 plugin list", () => {
    const file = compile({
      name: "v11-plugins",
      source: "validate",
      plugins: [
        { transform: "typia/lib/transform" },
        {
          transform: "@nestia/core/lib/transform",
          validate: "assert",
          stringify: "assert",
        },
        { transform: "@nestia/sdk/lib/transform" },
      ],
    });
    const captured = load(file);
    assert(
      first(captured.TypedBody)?.[0]?.type === "assert",
      "the v11 plugin list lost its validate option",
    );
    assert(
      first(captured["TypedRoute.Post"])?.[1]?.type === "assert",
      "the v11 plugin list lost its stringify option",
    );
    const metadata =
      fs.readFileSync(file, "utf8").match(/\.OperationMetadata\(/g)?.length ??
      0;
    assert(
      metadata ===
        captured["TypedRoute.Post"].length + captured["TypedRoute.Get"].length,
      `the v11 plugin list attached ${metadata} SDK metadata decorators`,
    );
  });
  if (failures.length !== 0)
    throw new Error(
      `Failed transform wrapper boundaries: ${failures.join(", ")}`,
    );
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

// The @nestia/core descriptor refuses a project whose typia differs from the
// one its Go plugin links, naming both versions, because the transform is
// built from nestia's pinned typia source while the emitted code calls the
// installed runtime (#1663). The descriptor is checked directly for a matching,
// a missing, and a mismatched typia, and a whole ttsc build of a project
// resolving another typia must fail with the same message.
const typiaVersionGuard = () => {
  const descriptor = require(
    path.join(ROOT, "packages/core/native/transform.cjs"),
  );
  const expected = JSON.parse(
    fs.readFileSync(
      require.resolve("typia/package.json", {
        paths: [path.join(ROOT, "packages/core/native")],
      }),
      "utf8",
    ),
  ).version;
  const other = `${expected.split(".")[0]}.99.0`;
  const project = (name, version) => {
    const root = path.join(LIB, name);
    if (version !== null) {
      const typia = path.join(root, "node_modules", "typia");
      fs.mkdirSync(typia, { recursive: true });
      fs.writeFileSync(
        path.join(typia, "package.json"),
        JSON.stringify({ name: "typia", version }),
        "utf8",
      );
    } else fs.mkdirSync(root, { recursive: true });
    return root;
  };

  const matching = project("typia-matching", expected);
  const plugin = descriptor({ projectRoot: matching });
  assert(
    plugin.hostInputs.some((file) => file.startsWith(matching)),
    "typia guard: the project's typia manifest is not watched",
  );
  const temporaryParent = path.resolve(require("os").tmpdir());
  const externalRoot = fs.mkdtempSync(
    path.join(temporaryParent, "nestia-typia-"),
  );
  try {
    descriptor({ projectRoot: externalRoot });
  } finally {
    if (path.dirname(path.resolve(externalRoot)) !== temporaryParent)
      throw new Error("Version fixture escaped its temporary parent.");
    fs.rmSync(externalRoot, { recursive: true, force: true });
  }
  const mismatched = project("typia-mismatch", other);
  let message = "";
  try {
    descriptor({ projectRoot: mismatched });
  } catch (error) {
    message = error.message;
  }
  assert(
    message.includes(`typia ${expected} transform`) &&
      message.includes(`typia ${other}`),
    `typia guard: the mismatch was not reported with both versions (${message})`,
  );

  fs.writeFileSync(
    path.join(mismatched, "tsconfig.json"),
    JSON.stringify({
      extends: "../../tsconfig.base.json",
      compilerOptions: {
        outDir: "./out",
        rootDir: "../../src",
        plugins: [
          { transform: "typia/lib/transform", enabled: false },
          { transform: "@nestia/core/native/transform.cjs" },
        ],
      },
      include: ["../../src/validate.ts"],
    }),
    "utf8",
  );
  const result = cp.spawnSync(
    NODE,
    [TTSC, "--cache-dir", CACHE, "-p", path.join(mismatched, "tsconfig.json")],
    {
      cwd: __dirname,
      encoding: "utf8",
      env: { ...process.env, TTSC_CACHE_DIR: CACHE },
    },
  );
  if (result.error !== undefined) throw result.error;
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  assert(
    result.status !== 0 &&
      output.includes(`typia ${expected} transform`) &&
      output.includes(`typia ${other}`),
    `typia guard: the build of a mismatched project did not fail naming both versions (exit ${result.status})\n${output}`,
  );
  assert(
    fs.existsSync(path.join(mismatched, "out")) === false,
    "typia guard: the mismatched build emitted output",
  );
};

// With the transform off and `doNotThrowTransformError(false)`, a request
// decorator hands the handler the request value as it arrived (#1666): the
// headers object, the query and form-urlencoded body with repeated keys as
// arrays, and the multipart fields and files. The headers used to arrive as an
// array of entries, and the urlencoded and multipart bodies threw.
const noTransformFallbacks = async () => {
  const file = compile({
    name: "fallbacks",
    source: "fallbacks",
    plugin: { enabled: false },
  });
  // Plain Node resolves the actual installed tarballs and their dependencies.
  const consumer = await prepare();
  let result;
  try {
    const entry = path.join(consumer.directory, "fallbacks.cjs");
    fs.copyFileSync(file, entry);
    result = cp.spawnSync(NODE, [entry], {
      cwd: consumer.directory,
      encoding: "utf8",
      windowsHide: true,
      env: { ...process.env, NODE_PATH: "" },
    });
  } finally {
    consumer.close();
  }
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
  // Evaluate the generated fixture with an explicit local decorator probe.
  // Its validator helper imports use Node's real resolver; no global loader
  // or dependency object is replaced. Real decorator/HTTP assembly is owned
  // by the fallback and SDK boundary tests, not this generator probe.
  const resolve = Module.createRequire(file);
  const fixture = { exports: {} };
  const wrapper = new vm.Script(Module.wrap(fs.readFileSync(file, "utf8")), {
    filename: file,
  }).runInThisContext();
  wrapper(
    fixture.exports,
    (request) => modules[request] ?? resolve(request),
    fixture,
    file,
    path.dirname(file),
  );
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
  const invalid = () => ({ title: "title", count: "wrong" });
  if (option === "is" || option === "equals") {
    assert(validator.is(valid()), `${option}: rejected valid input`);
    assert(!validator.is(invalid()), `${option}: accepted wrong property type`);
  } else if (option.startsWith("validate")) {
    assert(
      validator.validate(valid()).success,
      `${option}: rejected valid input`,
    );
    assert(
      !validator.validate(invalid()).success,
      `${option}: accepted wrong property type`,
    );
  } else {
    validator.assert(valid());
    assertThrows(
      () => validator.assert(invalid()),
      `${option}: accepted wrong property type`,
    );
  }
  if (option === "assert") validator.assert(extra());
  else if (option === "is") assert(validator.is(extra()), "is rejected extra");
  else if (option === "validate")
    assert(validator.validate(extra()).success, "validate rejected extra");
  else if (option === "assertEquals")
    assertThrows(
      () => validator.assert(extra()),
      "assertEquals accepted extra",
    );
  else if (option === "equals")
    assert(!validator.is(extra()), "equals accepted extra");
  else if (option === "validateEquals")
    assert(
      !validator.validate(extra()).success,
      "validateEquals accepted extra",
    );
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

/**
 * Verifies the nineteen generated runtime fixtures in one Node process.
 *
 * A local decorator probe captures emitted arguments while resolving actual
 * installed typia helpers. Native identity cases execute their real exports.
 *
 * 1. Validate mode arguments and body acceptance, rejection and mutation.
 * 2. Compare serializer/alias arguments and structural versus native Blob values.
 * 3. Aggregate every named failure so later modes still execute.
 *
 * @evidence contracts/testing.md#behavioral-verification The verifier executes generated body validators against valid, malformed and extra-field values, checks equality/clone/prune effects and every decorator-family discriminator/flag, and evaluates structural/native Blob predicates. Serializer cases inspect generated arguments rather than asserting all serializer internals.
 * @evidence contracts/testing.md#independent-expectations The literal supported-mode table, authored body DTO and submitted object identities establish expected results. User Blob requires its customField while DOM Blob requires an actual instance; expected values are not generated from transformer output.
 * @evidence contracts/testing.md#distinguishing-cases Ten validator modes contrast ordinary/equality/clone/prune behavior, malformed versus valid values and headers/query/parameter mode routing; six serializer states include null. Aliased imports and the same Blob name under user/DOM provenance pin adjacent identity controls.
 * @evidence contracts/testing.md#execution-ownership The single native E2E test invokes this exported verifier through --verify-options after emitting its fixtures; main delegates that boundary once. Per-mode runCase retains failure names and catches assertion failures while unrelated modes continue.
 * @evidence contracts/e2e.md#necessary-boundary This connects native emitted JavaScript with installed typia runtime helpers and Node native constructors; text-only unit transform assertions cannot detect incompatible helper execution or lost native identity.
 * @evidence contracts/e2e.md#shared-execution Every generated option, alias and identity fixture is evaluated in this one process after the single native Go batch. No compiler, installation or server is started by the verifier.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each mode loads its own generated output into a module-local VM probe, creates fresh asserted objects and retains no global loader override; temporary outputs are owned and removed by the Go batch. Native identity controls load separate real exports.
 * @evidence contracts/e2e.md#preserved-coverage All original mode arguments and body equality/clone/prune distinctions remain, with added valid/malformed body controls, alias checks and both Blob identities. Wrapper disabled/noEmit/version and HTTP fallback assertions retain their main-entry owners.
 */
const verifyOptions = (output) => {
  const failures = [];
  const runCase = (name, task) => {
    try {
      task();
    } catch (error) {
      failures.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  measure("validate options", () => {
    for (const [option, expectedType] of VALIDATE_CASES) {
      runCase(`validate-${option}`, () => {
        const file = path.join(output, `validate-${option}`, "validate.js");
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
      });
    }
  });

  measure("stringify options", () => {
    for (const [option, expectedType] of STRINGIFY_CASES) {
      runCase(`stringify-${option ?? "null"}`, () => {
        const file = path.join(
          output,
          `stringify-${option ?? "null"}`,
          "stringify.js",
        );
        const captured = load(file);
        const route = first(captured["TypedRoute.Get"])?.[0];
        if (expectedType === null)
          assert(route === null, "null stringify failed");
        else
          assert(
            route?.type === expectedType,
            `${option}: wrong response stringifier`,
          );
      });
    }
  });

  runCase("user-authored global keeps its members", () => {
    const user = loadRaw(
      path.join(output, "native-global-user", "native-global/user.js"),
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
      path.join(output, "native-global-runtime", "native-global/runtime.js"),
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

  runCase("aliased core imports", () => {
    const file = path.join(output, "aliases", "aliases.js");
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
  if (failures.length !== 0)
    throw new Error(`Generated runtime cases failed:\n${failures.join("\n")}`);
};
module.exports = { main, verifyOptions };
if (require.main === module) {
  if (process.argv[2] === "--verify-options") verifyOptions(process.argv[3]);
  else
    main().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
