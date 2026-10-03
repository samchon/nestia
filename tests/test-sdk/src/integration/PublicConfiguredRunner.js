const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const {
  preparePublicConsumer,
} = require("../../../../scripts/prepare-public-consumer.cjs");
const { resolveTestEnvironment } = require("../../../../scripts/run-tests.cjs");
const { compilePublicProgram } = require("./internal/PublicCompiler.js");

/**
 * Compiles equivalent configured SDK inputs and their consumers once each.
 *
 * Configuration input factories run from emitted JavaScript, so generators
 * inspect real native metadata without compiling each configuration again. Each
 * configuration keeps its options, package defaults and application graph.
 * Existing runtime entries retain their assertions and server settings. The
 * caller subsequently checks generated-source assertions, including owners that
 * have no runtime entry. This runner does not claim shared HTTP servers.
 *
 * @evidence contracts/common.md#principled-implementation Current authored filesystem inputs, exact configuration options and original runtime entries use ordinary packed dependencies. One input program and one consumer program preserve the shared compiler premise; each application retains its distinct route and adapter semantics.
 * @evidence contracts/common.md#clear-and-simple-design Copy, producer, generation, consumer and runtime are explicit sequential phases. Generation and runtime failures remain in the aggregate; failed compilation prevents interpreting incomplete outputs as passing tests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Git inventory, stale generated SDK, foreign loader hook, compiler substitution or retry supplies an oracle. Only configured inputs are copied and the public application generator receives actual emitted controller metadata.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes shared compilation from remaining application lifetimes and identifies the caller's generated-source assertion responsibility. Counts and first failures remain visible.
 * @evidence contracts/portability.md#os-neutral-implementation Native paths validate every member and the owned project before copying or removal. Ordinary createRequire opens installed entries; source aliases are rebased with path.relative and separators for both operating systems.
 * @evidence contracts/performance.md#efficient-algorithms One filesystem copy per member and two native requests replace per-configuration native compilation. Configurations and original cases execute once; output publication is linear in emitted files.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller groups equal compiler configurations without an arbitrary member cap. Every selected member reuses the same installed graph, absolute compiler cache and consumer program; generator flags and genuine application differences remain explicit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Non-listening generation applications close in finally, working directories restore after every owner, and each original runtime entry owns its server teardown. The contained ignored project remains diagnostic evidence until the next invocation replaces that exact project.
 */
async function runConfiguredProgram(plan, consumerRoot) {
  const root = path.resolve(__dirname, "../../../..");
  Object.assign(process.env, resolveTestEnvironment(root, process.env));
  assert(/^configured-program-\d+$/.test(plan.name));
  assert(plan.members.length > 0);
  assert.equal(new Set(plan.members).size, plan.members.length);
  for (const member of plan.members)
    assert(
      member && path.basename(member) === member && !member.startsWith("."),
    );
  const consumer = consumerRoot
    ? { root: path.resolve(consumerRoot) }
    : await preparePublicConsumer("tests/test-sdk");
  const requirePublic = createRequire(path.join(consumer.root, "package.json"));
  const project = path.join(consumer.root, "projects", plan.name);
  const relative = path.relative(consumer.root, project);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  fs.rmSync(project, { recursive: true, force: true });
  const inputs = [];
  for (const member of plan.members) {
    const source = path.join(__dirname, "../../features", member);
    const destination = path.join(project, "src", member);
    fs.cpSync(source, destination, {
      recursive: true,
      filter: (file) =>
        isAuthoredConfiguredInput(path.relative(source, file)) &&
        (fs.statSync(file).isDirectory() || /\.(?:[cm]?tsx?|json)$/.test(file)),
    });
    const pending = [destination];
    while (pending.length) {
      const directory = pending.pop();
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) pending.push(file);
        else if (/\.[cm]?tsx?$/.test(file)) {
          const text = fs
            .readFileSync(file, "utf8")
            .replace(
              /(["'])@api(?:\/lib\/([^"']+))?\1/g,
              (_match, quote, suffix) => {
                const target = path.join(destination, "src/api", suffix ?? "");
                const address = path
                  .relative(path.dirname(file), target)
                  .split(path.sep)
                  .join("/");
                return (
                  quote +
                  (address.startsWith(".") ? address : "./" + address) +
                  quote
                );
              },
            );
          fs.writeFileSync(file, text);
          const local = path
            .relative(destination, file)
            .split(path.sep)
            .join("/");
          if (!local.startsWith("src/test/"))
            inputs.push(path.relative(project, file));
        }
      }
    }
  }
  const options = { ...plan.compilerOptions };
  delete options.paths;
  const producerConfig = {
    extends: path.join(root, "tests/config/tsconfig.json"),
    compilerOptions: {
      ...options,
      rootDir: "src",
      outDir: "producer",
      noEmit: false,
      plugins: [
        { transform: "typia/lib/transform" },
        { transform: "@nestia/core/native/transform.cjs" },
        { transform: "@nestia/sdk/lib/transform" },
      ],
    },
    files: inputs,
  };
  fs.writeFileSync(
    path.join(project, "tsconfig.json"),
    JSON.stringify(producerConfig),
  );
  const { TtscCompiler } = requirePublic("ttsc");
  const cache = process.env.TTSC_CACHE_DIR;
  console.log(
    `${plan.name}: ${plan.members.length} configured owners; ${inputs.length} producer inputs`,
  );
  await compilePublicProgram(
    TtscCompiler,
    project,
    "tsconfig.json",
    cache,
    "producer",
    { NESTIA_SDK_TRANSFORM: "" },
  );
  const core = requirePublic("@nestia/core");
  const { NestFactory } = requirePublic("@nestjs/core");
  const { NestiaSdkApplication } = requirePublic("@nestia/sdk");
  const failures = [];
  for (const member of plan.members) {
    const owner = path.join(project, "src", member);
    const produced = path.join(project, "producer", member);
    const exports = require(path.join(produced, "nestia.config.js"));
    const configs = [].concat(
      exports.default ??
        Object.values(exports).find(
          (value) => value && typeof value === "object",
        ),
    );
    fs.mkdirSync(path.join(owner, "src/api"), { recursive: true });
    fs.mkdirSync(path.join(owner, "src/test"), { recursive: true });
    for (const [index, config] of configs.entries()) {
      let application;
      const previous = process.cwd();
      try {
        assert(config && config.input, `${member}: missing generator input`);
        process.chdir(owner);
        if (typeof config.input === "function")
          application = await config.input();
        else {
          const move = (location) =>
            path.join(produced, location.replace(/\.([cm]?)ts\b/g, ".$1js"));
          const input = Array.isArray(config.input)
            ? config.input.map(move)
            : typeof config.input === "string"
              ? move(config.input)
              : {
                  include: config.input.include.map(move),
                  exclude: config.input.exclude?.map(move),
                };
          application = await NestFactory.create(
            await core.EncryptedModule.dynamic(input, {
              key: "A".repeat(32),
              iv: "B".repeat(16),
            }),
            { logger: false },
          );
        }
        await new NestiaSdkApplication({
          ...config,
          input: () => application,
          output: config.output && path.join(owner, config.output),
          e2e: config.e2e && path.join(owner, config.e2e),
          swagger: config.swagger && {
            ...config.swagger,
            output:
              config.swagger.output && path.join(owner, config.swagger.output),
          },
        }).all();
      } catch (error) {
        failures.push(`${member}[${index}]: generation`);
        console.error(`${member}[${index}] first generation failure:`, error);
      } finally {
        try {
          if (application) await application.close();
        } finally {
          process.chdir(previous);
        }
      }
    }
  }
  const consumerConfig = {
    ...producerConfig,
    compilerOptions: {
      ...producerConfig.compilerOptions,
      outDir: "consumer",
      plugins: [{ transform: "@nestia/core/native/transform.cjs" }],
    },
    include: ["src"],
  };
  delete consumerConfig.files;
  fs.writeFileSync(
    path.join(project, "tsconfig.consumer.json"),
    JSON.stringify(consumerConfig),
  );
  await compilePublicProgram(
    TtscCompiler,
    project,
    "tsconfig.consumer.json",
    cache,
    "consumer",
    { NESTIA_SDK_TRANSFORM: "1" },
  );
  for (const [index, member] of plan.members.entries()) {
    const source = path.join(project, "src", member);
    const emitted = path.join(project, "consumer", member);
    for (const filename of fs.readdirSync(source))
      if (filename.endsWith(".json"))
        fs.copyFileSync(
          path.join(source, filename),
          path.join(emitted, filename),
        );
    const api = path.join(source, "src/api");
    if (fs.existsSync(api))
      fs.cpSync(api, path.join(emitted, "src/api"), {
        recursive: true,
        filter: (file) =>
          fs.statSync(file).isDirectory() || /\.[cm]?ts$/.test(file),
      });
    const entry = path.join(emitted, "src/test/index.js");
    if (!fs.existsSync(entry)) {
      console.log(
        `${member}: compiled; generated-source assertions belong to caller`,
      );
      continue;
    }
    const previous = process.cwd();
    const previousPort = process.env.TEST_SDK_PORT;
    try {
      process.env.TEST_SDK_PORT = String(plan.port + 100 * (index + 1));
      process.chdir(emitted);
      const runtime = require(entry);
      assert.equal(
        typeof runtime.main,
        "function",
        `${member}: missing runtime main`,
      );
      await runtime.main();
    } catch (error) {
      failures.push(`${member}: runtime`);
      console.error(`${member} first runtime failure:`, error);
    } finally {
      process.chdir(previous);
      if (previousPort === undefined) delete process.env.TEST_SDK_PORT;
      else process.env.TEST_SDK_PORT = previousPort;
    }
  }
  assert.equal(
    failures.length,
    0,
    `Failed configured owners: ${failures.join(", ")}`,
  );
}

/**
 * Selects authored SDK fixture paths without accepting prior generated inputs.
 *
 * These configured fixtures keep authored DTOs in src/api/structures; the
 * remaining API tree and automated cases are generator-owned. Nested output
 * directories, package installs and compiler outputs likewise never define
 * producer inputs. This structural policy includes newly authored files and
 * works independently of Git or previous execution.
 *
 * @evidence contracts/common.md#principled-implementation The audited configured fixtures own their DTOs under src/api/structures and generator outputs under the remaining API tree, generated, lib and automated directories. Source paths outside those output boundaries remain authored inputs.
 * @evidence contracts/common.md#clear-and-simple-design One relative-path predicate supplies the copy boundary; the caller still validates containment and filesystem file types. No per-fixture names or manifests duplicate this policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prior generated files are excluded structurally rather than by a Git snapshot or individual fixture exception. The predicate cannot supply or alter expected outputs.
 * @evidence contracts/common.md#meaningful-documentation The comment states the author/generator ownership contract and why input discovery must ignore prior runs.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The predicate only splits a caller-supplied relative path with the native separator; the caller owns actual filesystem discovery, identity and containment.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This bounded path predicate chooses no compiler or traversal strategy; runConfiguredProgram owns the copy and native requests.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This stateless predicate stores or coordinates no completed work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This predicate retains no handles, tasks or historical input state.
 */
function isAuthoredConfiguredInput(relative) {
  const parts = relative.split(path.sep);
  if (
    parts.some(
      (part) =>
        part.startsWith(".") ||
        ["node_modules", "lib", "generated", "automated"].includes(part),
    )
  )
    return false;
  if (
    parts[0] === "src" &&
    parts[1] === "api" &&
    parts.length > 2 &&
    parts[2] !== "structures"
  )
    return false;
  return relative !== "swagger.json" && !relative.endsWith(".swagger.json");
}

module.exports = { runConfiguredProgram, isAuthoredConfiguredInput };
if (require.main === module)
  runConfiguredProgram(JSON.parse(process.argv[2]), process.argv[3]).then(
    () => process.exit(0),
    (error) => {
      console.error(error);
      process.exit(1);
    },
  );
