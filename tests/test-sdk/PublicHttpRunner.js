const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createRequire } = require("node:module");
const { resolveTestEnvironment } = require("../../scripts/run-tests.cjs");

const { preparePublicConsumer } = require("../../scripts/prepare-public-consumer.cjs");
const { compilePublicProgram } = require("./PublicCompiler");
const { validatePublicHttpProfiles } = require("./PublicHttpProfileCoverage");
const { test_public_user_global } = require("./test_public_user_global");
const {
  test_public_transform_envelope,
} = require("./test_public_transform_envelope");
const {
  test_public_disabled_transform,
} = require("./test_public_disabled_transform");
const {
  test_public_no_emit_diagnostics,
} = require("./test_public_no_emit_diagnostics");
const {
  test_public_typia_version_guard,
} = require("./test_public_typia_version_guard");
const { test_public_legacy_plugins } = require("./test_public_legacy_plugins");
const {
  test_public_multipart_schema_inputs,
} = require("./test_public_multipart_schema_inputs");

/**
 * Runs authored and generated HTTP/WebSocket cases through installed programs.
 *
 * The canonical root may supply its freshly validated shared installation.
 * Standalone execution prepares the SDK owner's current graph itself. The
 * parent owns supplied artifact freshness and keeps that graph unchanged until
 * this child settles; ordinary createRequire opens its JavaScript entries.
 *
 * A shared producer compiles controllers with the default native options.
 * Distinct request-validation or response-stringification modes each retain one
 * producer because their malformed-request reports and response behavior differ.
 * Non-listening applications
 * select exact controller graphs for ordinary and clone option generation; one
 * actual listener serves every profile's consumer request. The public WebSocket
 * adaptor upgrades that same HTTP server for the original parameter/query RPC
 * connections; their separate generated drivers and local listener events
 * retain their original connector teardown. One consumer
 * compilation prepares all authored and generated cases; plain JavaScript
 * execution starts no TypeScript loader or native host. Scenario execution
 * policy retains document-only inputs without promoting their generated random
 * calls into transport assertions: those artifacts are still generated and
 * compiled, while authored cases exercise their required connections. The
 * installed compiler's version-rejection and legacy-plugin boundaries are
 * reported separately; their assertion failures do not suppress executable HTTP
 * cases. A no-DOM user-global boundary shares this installation and cache; its
 * conflicting library set requires a separate minimal program, while the native
 * DOM twin reuses the existing consumer. The producer uses the explicit legacy
 * SDK entry with its environment activation off; the consumer uses modern
 * entries and activation. Simulation profiles declare their execution prefixes
 * and retain their actual producer state. All their generated and authored
 * cases receive simulate true; discovered postconditions run after feature
 * settlement and require untouched state and zero actual requests.
 * Postcondition failures join the same final aggregate, without resetting state
 * or repeating preparation.
 *
 * @evidence contracts/common.md#principled-implementation Public installed TtscCompiler emits actual authored controllers in shared strict programs for distinct native serialization options, followed by one shared consumer. Public non-listening Nest graphs select each generation profile while one real listener serves all requests. DynamicExecutor retains authored and originally enabled generated transport assertions; explicit policy preserves original document-only scenarios without dropping their generation or compilation.
 * @evidence contracts/common.md#clear-and-simple-design Installation, independent boundary cases, shared producer, distinct public generation profiles, shared consumer and requests have visible results. First boundary failures remain in the final aggregate while positive cases continue. Legacy SDK registration activates the producer and modern environment activation serves the consumer. The listener and each generation graph have explicit finally-owned release.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All product operations resolve through the ordinary packed installation. The runner patches neither generated JavaScript nor foreign resolvers and copies no previously generated clients or automated cases as input.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies each necessary boundary and its shared lifetime; phase timings, individual failures and discovered counts remain visible.
 * @evidence contracts/portability.md#os-neutral-implementation Native paths locate the assignment-owned fixture. Temporary removal verifies containment before recursive deletion, and the listener uses an OS-assigned loopback port. Public package imports use the consumer's normal Node resolution.
 * @evidence contracts/performance.md#efficient-algorithms Each authored input tree is copied once. Controllers sharing native options compile once per producer program, and all profiles compile in one consumer program. Distinct generation options analyze their exact controller graphs; no individual case repeats installation, native preparation, consumer compilation or listening.
 * @evidence contracts/performance.md#reuse-equivalent-work Controllers have private scenario routes and shared encryption settings. Default assert, validate and validate.log serialization and validate request reports require distinct producer programs because their malformed-input behavior differs. All cases with each setting reuse that program, installed graph, compiled consumer and listener. Simulation state remains the actual unreset producer namespace and is checked after features with a request counter.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One private fixture and one listener belong to the run. Each producer and consumer result map is released after publication. Emitted files stay in the ignored root; the listener closes in finally and generatePublicHttpProfile closes each non-listening graph immediately after its generation or failure.
 */
async function runPublicHttp(preparedConsumer) {
  const root = path.resolve(__dirname, "../..");
  Object.assign(process.env, resolveTestEnvironment(root, process.env));
  const consumer = preparedConsumer ?? await preparePublicConsumer("tests/test-sdk");
  const fixture = path.join(consumer.root, "projects/http-rich");
  const relative = path.relative(consumer.root, fixture);
  assert(
    relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    "Fixture must belong to the public consumer.",
  );
  await fs.rm(fixture, { recursive: true, force: true });
  const source = path.join(__dirname, "features/http-rich/src");
  const execution = JSON.parse(
    await fs.readFile(path.join(source, "../execution.json"), "utf8"),
  );
  const profiles = JSON.parse(
    await fs.readFile(path.join(source, "../profiles.json"), "utf8"),
  );
  const producers = JSON.parse(
    await fs.readFile(path.join(source, "../producers.json"), "utf8"),
  );
  const documentOnlyPrefixes = execution.generatedCases
    .filter((policy) => policy.execute === false)
    .map((policy) => `test_api_${policy.accessorPrefix.join("_")}_`);
  const simulationProfiles = profiles.filter(
    (profile) => profile.execution?.simulate,
  );
  const simulationRequests = new Map(
    simulationProfiles.map((profile) => [profile.name, 0]),
  );
  for (const directory of ["controllers", "structures", "providers"])
    await fs.cp(
      path.join(source, directory),
      path.join(fixture, "src", directory),
      { recursive: true },
    );
  for (const producer of producers) {
    for (const value of [producer.source, producer.output])
      assert(
        typeof value === "string" && /^[a-z][a-z0-9-]*$/.test(value),
        "A producer must name a contained source and output directory.",
      );
    await fs.cp(
      path.join(source, producer.source),
      path.join(fixture, "src", producer.source),
      { recursive: true },
    );
  }
  const authoredFeatures = path.join(source, "test/features");
  await fs.cp(authoredFeatures, path.join(fixture, "src/test/features"), {
    recursive: true,
    filter: (file) =>
      path
        .relative(authoredFeatures, file)
        .split(path.sep)
        .every((component) => component !== "automated"),
  });
  await fs.cp(
    path.join(source, "test/postconditions"),
    path.join(fixture, "src/test/postconditions"),
    { recursive: true },
  );
  await fs.cp(
    path.join(source, "test/compile"),
    path.join(fixture, "src/test/compile"),
    { recursive: true },
  );
  await fs.cp(
    path.join(source, "benchmark"),
    path.join(fixture, "src/benchmark"),
    {
      recursive: true,
    },
  );
  const config = {
    extends: path.join(root, "tests/config/tsconfig.json"),
    compilerOptions: {
      rootDir: "src",
      outDir: "producer",
      noEmit: false,
      plugins: [
        { transform: "typia/lib/transform" },
        {
          transform: "@nestia/core/lib/transform",
          validate: "assert",
          stringify: "assert",
        },
        { transform: "@nestia/sdk/lib/transform" },
      ],
    },
    include: ["src/controllers", "src/test/compile"],
  };
  await fs.writeFile(
    path.join(fixture, "tsconfig.json"),
    JSON.stringify(config, null, 2),
  );
  const { TtscCompiler } = consumer.requirePublic("ttsc");
  const cache = process.env.TTSC_CACHE_DIR;
  const boundaryFailures = [];
  const boundaryStarted = Date.now();
  try {
    test_public_typia_version_guard(consumer, cache);
    console.log(
      `Public compiler boundary: test_public_typia_version_guard passed; ${Date.now() - boundaryStarted} ms`,
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_typia_version_guard", error });
    console.error(
      "Public compiler boundary: test_public_typia_version_guard failed",
      error,
    );
  }
  const disabledStarted = Date.now();
  try {
    await test_public_disabled_transform(consumer, cache);
    console.log(
      `Public compiler boundary: test_public_disabled_transform passed; ${Date.now() - disabledStarted} ms`,
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_disabled_transform", error });
    console.error(
      "Public compiler boundary: test_public_disabled_transform failed",
      error,
    );
  }
  const envelopeStarted = Date.now();
  try {
    test_public_transform_envelope(consumer, cache);
    console.log(
      `Public compiler boundary: test_public_transform_envelope passed; ${Date.now() - envelopeStarted} ms`,
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_transform_envelope", error });
    console.error(
      "Public compiler boundary: test_public_transform_envelope failed",
      error,
    );
  }
  const noEmitStarted = Date.now();
  try {
    test_public_no_emit_diagnostics(consumer, cache);
    console.log(
      `Public compiler boundary: test_public_no_emit_diagnostics passed; ${Date.now() - noEmitStarted} ms`,
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_no_emit_diagnostics", error });
    console.error(
      "Public compiler boundary: test_public_no_emit_diagnostics failed",
      error,
    );
  }
  const provenanceStarted = Date.now();
  try {
    await test_public_user_global(consumer, cache);
    console.log(
      `Public compiler boundary: test_public_user_global passed; ${Date.now() - provenanceStarted} ms`,
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_user_global", error });
    console.error(
      "Public compiler boundary: test_public_user_global failed",
      error,
    );
  }
  await compilePublicProgram(
    TtscCompiler,
    fixture,
    "tsconfig.json",
    cache,
    "producer",
    { NESTIA_SDK_TRANSFORM: "" },
  );
  // A genuinely different native option requires a distinct program. Cases
  // with the same option share this program and every other preparation.
  for (const producer of producers) {
    const producerConfig = {
      ...config,
      compilerOptions: {
        ...config.compilerOptions,
        rootDir: `src/${producer.source}`,
        outDir: producer.output,
        plugins: config.compilerOptions.plugins.map((plugin) =>
          plugin.transform === "@nestia/core/lib/transform"
            ? {
                ...plugin,
                validate: producer.validate ?? plugin.validate,
                stringify: producer.stringify ?? plugin.stringify,
              }
            : plugin,
        ),
      },
      include: [
        `src/${producer.source}/controllers`,
        `src/${producer.source}/structures`,
      ],
    };
    const tsconfig = `tsconfig.${producer.output}.json`;
    await fs.writeFile(
      path.join(fixture, tsconfig),
      JSON.stringify(producerConfig, null, 2),
    );
    await compilePublicProgram(
      TtscCompiler,
      fixture,
      tsconfig,
      cache,
      producer.output,
      { NESTIA_SDK_TRANSFORM: "" },
    );
  }
  try {
    test_public_multipart_schema_inputs(consumer, fixture);
    console.log(
      "Public compiler boundary: test_public_multipart_schema_inputs passed",
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_multipart_schema_inputs", error });
    console.error(
      "Public compiler boundary: test_public_multipart_schema_inputs failed",
      error,
    );
  }
  try {
    test_public_legacy_plugins(fixture);
    console.log("Public compiler boundary: test_public_legacy_plugins passed");
  } catch (error) {
    boundaryFailures.push({ name: "test_public_legacy_plugins", error });
    console.error(
      "Public compiler boundary: test_public_legacy_plugins failed",
      error,
    );
  }
  const core = consumer.requirePublic("@nestia/core");
  const { NestFactory } = consumer.requirePublic("@nestjs/core");
  const { DynamicExecutor } = consumer.requirePublic("@nestia/e2e");
  const app = await NestFactory.create(
    await core.EncryptedModule.dynamic(
      [
        path.join(fixture, "producer/controllers"),
        ...producers.map((producer) =>
          path.join(fixture, producer.output, "controllers"),
        ),
      ],
      {
        key: "A".repeat(32),
        iv: "B".repeat(16),
      },
    ),
    { logger: false },
  );
  const traffic = { active: false, inFlight: 0, peak: 0 };
  try {
    app.use((request, response, next) => {
      for (const profile of simulationProfiles)
        if (request.originalUrl.startsWith(profile.execution.requestPrefix))
          simulationRequests.set(
            profile.name,
            simulationRequests.get(profile.name) + 1,
          );
      if (!traffic.active) return next();
      traffic.peak = Math.max(traffic.peak, ++traffic.inFlight);
      response.once("close", () => --traffic.inFlight);
      setTimeout(next, 20);
    });
    await app.init();
    const generation = Date.now();
    await generatePublicHttpProfile(
      consumer,
      {
        include: [path.join(fixture, "producer/controllers")],
        exclude: [
          path.join(fixture, "producer/controllers/clone"),
          path.join(fixture, "producer/controllers/options"),
        ],
      },
      {
        output: path.join(fixture, "src/api"),
        simulate: true,
        e2e: path.join(fixture, "src/test"),
        swagger: {
          output: path.join(fixture, "swagger.json"),
          security: {
            basic: { type: "http", scheme: "basic" },
            bearer: { type: "http", scheme: "bearer" },
            custom: { type: "apiKey", in: "header", name: "Authorization" },
            tagsOAuth2: {
              type: "oauth2",
              flows: {
                implicit: {
                  authorizationUrl: "https://example.com/api/oauth/dialog",
                  refreshUrl: "https://example.com/api/oauth/refresh",
                  scopes: {
                    read: "read authority",
                    write: "write authority",
                  },
                },
              },
            },
            oauth2: {
              type: "oauth2",
              flows: {
                implicit: {
                  authorizationUrl: "https://example.com/api/oauth/dialog",
                  refreshUrl: "https://example.com/api/oauth/refresh",
                  scopes: {
                    "write:pets": "modify pets in your account",
                    "read:pets": "read your pets",
                  },
                },
              },
            },
            security: {
              type: "oauth2",
              flows: {
                clientCredentials: {
                  tokenUrl: "https://example.com/api/oauth/dialog",
                  refreshUrl: "https://example.com/api/oauth/refresh",
                  scopes: { x1: "x1", x2: "x2" },
                },
              },
            },
          },
          decompose: true,
          operationId: (props) => `${props.class}.${props.function}`,
        },
      },
    );
    console.log(`Public HTTP generation: ${Date.now() - generation} ms`);
    for (const profile of profiles) {
      const started = Date.now();
      await generatePublicHttpProfile(
        consumer,
        profile.controllers.map((directory) =>
          path.join(fixture, profile.producer ?? "producer", "controllers", directory),
        ),
        {
          output:
            profile.generateSdk === false
              ? undefined
              : path.join(
                  fixture,
                  "src/test/features/profiles",
                  profile.name,
                  "api",
                ),
          e2e:
            profile.generateE2e === false
              ? undefined
              : path.join(
                  fixture,
                  "src/test/features/profiles",
                  profile.name,
                  "test",
                ),
          clone: profile.clone,
          keyword: profile.keyword,
          propagate: profile.propagate,
          primitive: profile.primitive,
          json: profile.json,
          simulate: profile.simulate,
          swagger:
            profile.generateSwagger === false
              ? undefined
              : {
                  output: path.join(
                    fixture,
                    "profiles",
                    profile.name,
                    "swagger.json",
                  ),
                  security: profile.swagger?.security ?? {
                    bearer: { type: "apiKey" },
                  },
                  beautify: profile.swagger?.beautify,
                  decompose: profile.swagger?.decompose,
                  openapi: profile.swagger?.openapi,
                  info: profile.swagger?.info,
                  servers: profile.swagger?.servers,
                  operationId: profile.operationId
                    ? (props) => `${props.class}.${props.function}`
                    : undefined,
                },
        },
      );
      console.log(
        `Public HTTP profile ${profile.name}: ${Date.now() - started} ms`,
      );
    }
    const runtimeConfig = {
      ...config,
      compilerOptions: {
        ...config.compilerOptions,
        outDir: "consumer",
        plugins: [
          { transform: "typia/lib/transform", enabled: false },
          { transform: "@nestia/core/native/transform.cjs" },
        ],
      },
      include: [
        "src/test/features",
        "src/test/postconditions",
        "src/benchmark",
      ],
    };
    await fs.writeFile(
      path.join(fixture, "tsconfig.consumer.json"),
      JSON.stringify(runtimeConfig, null, 2),
    );
    await compilePublicProgram(
      TtscCompiler,
      fixture,
      "tsconfig.consumer.json",
      cache,
      "consumer",
    );
    await core.WebSocketAdaptor.upgrade(app);
    await app.listen(0, "127.0.0.1");
    const host = await app.getUrl();
    const report = await DynamicExecutor.validate({
      location: path.join(fixture, "consumer/test/features"),
      prefix: "test",
      extension: "js",
      simultaneous: 1,
      filter: (file) =>
        !documentOnlyPrefixes.some((prefix) => file.startsWith(prefix)),
      parameters: (name) => [
        {
          host,
          encryption: { key: "A".repeat(32), iv: "B".repeat(16) },
          simulate: simulationProfiles.some((profile) =>
            profile.execution.functionPrefixes.some((prefix) =>
              name.startsWith(prefix),
            ),
          )
            ? true
            : undefined,
        },
        traffic,
      ],
      onComplete: (execution) => {
        console.log(
          ` - ${path.relative(path.join(fixture, "consumer"), execution.location)}: ${execution.name}: ${execution.error ? "failed" : "passed"}`,
        );
        if (execution.error) console.error(execution.error);
      },
    });
    if (report.executions.length === 0)
      throw new Error("No public HTTP integration cases were discovered.");
    console.log(
      `Public HTTP runtime: ${report.executions.length} cases; ${report.time} ms`,
    );
    const failures = report.executions.filter((execution) => execution.error);
    try {
      const postconditions = await DynamicExecutor.validate({
        location: path.join(fixture, "consumer/test/postconditions"),
        prefix: "test",
        extension: "js",
        simultaneous: 1,
        parameters: (name) => {
          const profile = simulationProfiles.find(
            (profile) => profile.execution.postcondition === name,
          );
          assert(profile, `Unknown HTTP postcondition: ${name}`);
          const statePath = path.join(
            fixture,
            "producer",
            profile.execution.stateModule,
          );
          const relative = path.relative(
            path.join(fixture, "producer"),
            statePath,
          );
          assert(
            relative &&
              relative !== ".." &&
              !relative.startsWith(`..${path.sep}`) &&
              !path.isAbsolute(relative),
            "Simulation state must belong to the actual producer.",
          );
          return [
            require(statePath)[profile.execution.stateExport],
            simulationRequests.get(profile.name),
          ];
        },
        onComplete: (execution) => {
          console.log(
            ` - HTTP postcondition ${execution.name}: ${execution.error ? "failed" : "passed"}`,
          );
          if (execution.error) console.error(execution.error);
        },
      });
      assert.deepEqual(
        postconditions.executions.map((execution) => execution.name).sort(),
        simulationProfiles
          .map((profile) => profile.execution.postcondition)
          .sort(),
        "Every simulation profile must execute its postcondition exactly once.",
      );
      failures.push(
        ...postconditions.executions.filter((execution) => execution.error),
      );
    } catch (error) {
      boundaryFailures.push({ name: "HTTP postconditions", error });
    }
    try {
      validatePublicHttpProfiles(
        profiles,
        path.join(fixture, "consumer/test/features/profiles"),
        report.executions,
      );
    } catch (error) {
      boundaryFailures.push({ name: "profile execution coverage", error });
    }
    if (failures.length || boundaryFailures.length)
      throw new AggregateError(
        [
          ...boundaryFailures.map((failure) => failure.error),
          ...failures.map((execution) => execution.error),
        ],
        `Public HTTP failed: ${[
          ...boundaryFailures.map((failure) => failure.name),
          ...failures.map(
            (execution) => `${execution.location}: ${execution.name}`,
          ),
        ].join(", ")}`,
      );
  } finally {
    await app.close();
  }
}

/**
 * Generates one distinct SDK profile from the shared compiled controllers.
 *
 * Clone-only private DTOs cannot enter the ordinary non-clone input graph.
 * Public non-listening Nest applications select each exact controller graph;
 * Profiles reuse the compiled producer for their native options, one consumer
 * and one actual HTTP listener.
 *
 * @evidence contracts/common.md#principled-implementation Public EncryptedModule selection and Nest application input preserve each profile's compiled controller graph and generation options without compiling or altering source again.
 * @evidence contracts/common.md#clear-and-simple-design One temporary application owns reflection for one distinct profile; the caller supplies controller paths and public generation options while the shared listener owns transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary installed public APIs create and analyze the actual application. No private container is filtered or patched, no generated output is rewritten and no dedicated SDK transform host is added.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why controller input graphs differ despite shared programs, and why the temporary applications have no listening ports.
 * @evidence contracts/portability.md#os-neutral-implementation The caller constructs native paths with node:path; public EncryptedModule owns platform-neutral controller discovery. This application never selects a port or launches a shell.
 * @evidence contracts/performance.md#efficient-algorithms Each distinct profile requires one public analysis/generation pass over its selected controllers. All source compilation and consumer compilation remain shared across profiles.
 * @evidence contracts/performance.md#reuse-equivalent-work Each input graph reuses the exact already compiled classes from one installed artifact graph. Only changed clone/keyword/propagate options and genuinely different documented DTO/decorator inputs require separate generation outputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This function owns one non-listening application and closes it in finally after initialization or generation failure. It retains no profile state after returning; the caller owns output lifetime.
 */
async function generatePublicHttpProfile(consumer, controllers, options) {
  const core = consumer.requirePublic("@nestia/core");
  const { NestFactory } = consumer.requirePublic("@nestjs/core");
  const { NestiaSdkApplication } = consumer.requirePublic("@nestia/sdk");
  const app = await NestFactory.create(
    await core.EncryptedModule.dynamic(controllers, {
      key: "A".repeat(32),
      iv: "B".repeat(16),
    }),
    { logger: false },
  );
  try {
    await app.init();
    await new NestiaSdkApplication({ ...options, input: () => app }).all();
  } finally {
    await app.close();
  }
}

module.exports = { runPublicHttp, generatePublicHttpProfile };
if (require.main === module) {
  const index = process.argv.indexOf("--consumer-root");
  const root = index === -1 ? undefined : path.resolve(process.argv[index + 1]);
  runPublicHttp(root === undefined ? undefined : {
    root,
    requirePublic: createRequire(path.join(root, "package.json")),
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
