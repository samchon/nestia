const cp = require("child_process");
const fs = require("fs");
const Module = require("module");
const path = require("path");

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

const compile = (props) => {
  const project = writeProject(props);
  const result = cp.spawnSync(
    NODE,
    [TTSC, "--cache-dir", CACHE, "-p", project],
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
        include: [`../src/${props.source}.ts`],
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
