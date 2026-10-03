const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const { preparePublicConsumer } = require("./PublicConsumer");
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

/**
 * Runs authored and freshly generated HTTP cases through one installed program.
 *
 * One producer compiles the authored controllers. Non-listening applications
 * select exact controller graphs for ordinary and clone option generation; one
 * actual listener serves every profile's consumer request. One consumer
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
 * entries and activation.
 *
 * @evidence contracts/common.md#principled-implementation Public installed TtscCompiler emits all actual authored controller and consumer inputs in two shared strict programs. Public non-listening Nest graphs select each generation profile while one real listener serves all requests. DynamicExecutor retains authored and originally enabled generated transport assertions; explicit policy preserves original document-only scenarios without dropping their generation or compilation.
 * @evidence contracts/common.md#clear-and-simple-design Installation, independent boundary cases, shared producer, distinct public generation profiles, shared consumer and requests have visible results. First boundary failures remain in the final aggregate while positive cases continue. Legacy SDK registration activates the producer and modern environment activation serves the consumer. The listener and each generation graph have explicit finally-owned release.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All product operations resolve through the ordinary packed installation. The runner patches neither generated JavaScript nor foreign resolvers and copies no previously generated clients or automated cases as input.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies each necessary boundary and its shared lifetime; phase timings, individual failures and discovered counts remain visible.
 * @evidence contracts/portability.md#os-neutral-implementation Native paths locate the assignment-owned fixture. Temporary removal verifies containment before recursive deletion, and the listener uses an OS-assigned loopback port. Public package imports use the consumer's normal Node resolution.
 * @evidence contracts/performance.md#efficient-algorithms Each authored input tree is copied once and the producer and consumer programs are each compiled once. Distinct generation options analyze their exact controller graphs; no profile or case repeats installation, native compilation or consumer compilation.
 * @evidence contracts/performance.md#reuse-equivalent-work Stateless controllers have separate scenario routes and common compiler/encryption settings. All profiles share the same compiled modules and listener, while different clone/keyword/propagate options and documented DTO inputs use separate generation outputs. Identical controller source is represented once; conflicting private DTO identities remain distinct.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One private fixture, two result maps and one listener belong to the run. Emitted files stay in its ignored root; the listener closes in finally and generatePublicHttpProfile closes each non-listening graph immediately after its generation or failure.
 */
async function runPublicHttp() {
  const consumer = await preparePublicConsumer();
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
  const documentOnlyPrefixes = execution.generatedCases
    .filter((policy) => policy.execute === false)
    .map((policy) => `test_api_${policy.accessorPrefix.join("_")}_`);
  for (const directory of ["controllers", "structures"])
    await fs.cp(
      path.join(source, directory),
      path.join(fixture, "src", directory),
      { recursive: true },
    );
  const authoredFeatures = path.join(source, "test/features");
  await fs.cp(authoredFeatures, path.join(fixture, "src/test/features"), {
    recursive: true,
    filter: (file) =>
      path
        .relative(authoredFeatures, file)
        .split(path.sep)
        .every((component) => component !== "automated"),
  });
  const root = path.resolve(__dirname, "../..");
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
    include: ["src/controllers"],
  };
  await fs.writeFile(
    path.join(fixture, "tsconfig.json"),
    JSON.stringify(config, null, 2),
  );
  const { TtscCompiler } = consumer.requirePublic("ttsc");
  const cache = path.resolve(
    __dirname,
    process.env.TTSC_CACHE_DIR ?? path.join(root, "node_modules/.cache/ttsc"),
  );
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
      path.join(fixture, "producer/controllers"),
      {
        key: "A".repeat(32),
        iv: "B".repeat(16),
      },
    ),
    { logger: false },
  );
  const traffic = { active: false, inFlight: 0, peak: 0 };
  try {
    app.use((_request, response, next) => {
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
        exclude: [path.join(fixture, "producer/controllers/clone")],
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
          path.join(fixture, "producer/controllers", directory),
        ),
        {
          output: path.join(
            fixture,
            "src/test/features/profiles",
            profile.name,
            "api",
          ),
          e2e: path.join(
            fixture,
            "src/test/features/profiles",
            profile.name,
            "test",
          ),
          clone: profile.clone,
          keyword: profile.keyword,
          propagate: profile.propagate,
          simulate: true,
          swagger: {
            output: path.join(
              fixture,
              "profiles",
              profile.name,
              "swagger.json",
            ),
            security: { bearer: { type: "apiKey" } },
            beautify: true,
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
      include: ["src/test/features", "src/benchmark"],
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
    await app.listen(0, "127.0.0.1");
    const host = await app.getUrl();
    const report = await DynamicExecutor.validate({
      location: path.join(fixture, "consumer/test/features"),
      prefix: "test",
      extension: "js",
      simultaneous: 1,
      filter: (file) =>
        !documentOnlyPrefixes.some((prefix) => file.startsWith(prefix)),
      parameters: () => [
        { host, encryption: { key: "A".repeat(32), iv: "B".repeat(16) } },
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
 * all profiles reuse one native producer, consumer and actual HTTP listener.
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
if (require.main === module)
  runPublicHttp().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
