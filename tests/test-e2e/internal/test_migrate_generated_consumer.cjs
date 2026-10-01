const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const migrationDocument = (swagger) => {
  const paths = Object.fromEntries(Object.entries(swagger.paths ?? {}).filter(([key]) =>
    /^\/(articles|orders|uploads)(\/|$)/.test(key),
  ));
  const schemas = {};
  const pending = [];
  const visit = (value) => {
    if (value === null || typeof value !== "object") return;
    if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/schemas/"))
      pending.push(value.$ref.slice("#/components/schemas/".length));
    for (const child of Object.values(value)) visit(child);
  };
  visit(paths);
  while (pending.length) {
    const name = pending.pop();
    if (Object.hasOwn(schemas, name)) continue;
    const schema = swagger.components?.schemas?.[name];
    assert.ok(schema, "Unresolved migration schema: " + name);
    schemas[name] = schema;
    visit(schema);
  }
  const document = {
    ...swagger, paths, components: { ...swagger.components, schemas },
  };
  const text = JSON.stringify(document);
  const methods = new Set(["get", "put", "post", "delete", "patch", "head", "options", "trace"]);
  const operations = Object.values(paths).reduce((count, item) =>
    count + Object.keys(item).filter((method) => methods.has(method)).length, 0);
  assert.equal(document.openapi, "3.1.0");
  assert.ok(Object.keys(paths).length >= 7, "Migration fixture must retain >=7 paths.");
  assert.ok(operations >= 10, "Migration fixture must retain >=10 operations.");
  assert.ok(Object.keys(schemas).length >= 20, "Migration fixture must retain >=20 schemas.");
  assert.ok(text.includes('"oneOf"'), "Migration fixture must retain union schemas.");
  assert.ok(text.includes("multipart/form-data"));
  assert.ok(text.includes("text/plain"));
  assert.ok(document.components.securitySchemes.bearer);
  assert.ok(document.components.securitySchemes.apiKey);
  return document;
};

/**
 * Verifies real Swagger can generate the complete migration compile corpus.
 *
 * Both NestJS modes and both SDK modes join one generated consumer program.
 * Their package aliases isolate template imports without modifying loaders.
 *
 * 1. Select authored migration routes and their reachable Swagger schemas.
 * 2. Preserve richness and examples while archiving all five variants.
 * 3. Return package mappings for the shared installed consumer compiler.
 *
 * @evidence contracts/testing.md#behavioral-verification Installed SDK Swagger feeds installed migration; the common compiler checks every API, backend and test source. Original richness thresholds reject degraded metadata.
 * @evidence contracts/testing.md#independent-expectations Original thresholds and minimal/published literals come from authored controllers/DTOs. Generated examples must carry values without Example Object wrappers.
 * @evidence contracts/testing.md#distinguishing-cases Nest and SDK keyword/positional retain simulate/e2e true; zero-operation SDK retains full starter compilation. Body/response examples contrast wrapper handling.
 * @evidence contracts/testing.md#execution-ownership The common start invokes this after shared Swagger generation and before one consumer compile; returned options enroll all subtrees in that context.
 * @evidence contracts/e2e.md#necessary-boundary Actual reflected Swagger and generated source connect through installed native compilation; writer strings alone cannot prove imports and native rewrites connect.
 * @evidence contracts/e2e.md#shared-execution Five differing generation inputs introduce no compiler contexts, installs or hosts. The existing producer and one consumer serve all five.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Fresh mode contexts and distinct package/source namespaces isolate outputs. All archives remain in the unique caller-owned sandbox; caller teardown removes emitted files.
 * @evidence contracts/e2e.md#preserved-coverage Original richness, examples, five variants' source/test compilation and simulator controls remain mapped in 1775-migrate-assertions.md. Original corpus stays pending execution.
 */
const test_migrate_generated_consumer = async ({ installation, sandbox, swagger }) => {
  if (typeof swagger === "string") swagger = JSON.parse(fs.readFileSync(swagger, "utf8"));
  const document = migrationDocument(swagger);
  const { NestiaMigrateApplication, NestiaMigrateFileArchiver } = require(
    require.resolve("@nestia/migrate", { paths: [installation.directory] }),
  );
  const validation = NestiaMigrateApplication.validate(document);
  assert.equal(validation.success, true, JSON.stringify(validation));
  const app = validation.data;
  const compilerPaths = {};
  for (const [name, mode, keyword, input] of [
    ["nest-keyword", "nest", true, app],
    ["nest-positional", "nest", false, app],
    ["sdk-keyword", "sdk", true, app],
    ["sdk-positional", "sdk", false, app],
    ["empty-sdk", "sdk", true, NestiaMigrateApplication.assert({
      openapi: "3.1.0", info: { title: "Empty Paths", version: "1.0.0" }, paths: {},
    })],
  ]) {
    const slug = "migration-" + name;
    const files = input[mode]({ keyword, simulate: true, e2e: true, package: slug });
    if (mode === "nest") {
      const controller = files["packages/backend/src/controllers/articles/ArticlesController.ts"];
      assert.equal(typeof controller, "string");
      const compact = controller.replace(/\s+/g, "");
      assert.ok(compact.includes('SwaggerExample.Parameter("minimal",{title:"minimal",'));
      assert.ok(compact.includes('SwaggerExample.Response("published",{id:"00000000-0000-0000-0000-000000000001",'));
      assert.ok(!compact.includes("value:"), "Named example retained its Example Object wrapper.");
    }
    const directory = path.join(sandbox, "consumer/src/migration", name);
    for (const file of Object.keys(files)) {
      assert.ok(!file.startsWith("/") && !file.startsWith("./") && !file.includes("//"));
      const relative = path.relative(directory, path.resolve(directory, file));
      assert.ok(relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative));
    }
    // Preserve exactly the original source/test compiler populations. Lint
    // configs outside those roots were never part of the old compile check.
    const compileFiles = Object.fromEntries(Object.entries(files).filter(([file]) =>
      mode === "nest"
        ? /^(packages\/api\/src\/|packages\/backend\/src\/|packages\/backend\/test\/)/.test(file)
        : /^(src\/|test\/)/.test(file) || file === "swagger.json",
    ));
    fs.mkdirSync(directory, { recursive: true });
    await NestiaMigrateFileArchiver.archive({
      mkdir: fs.promises.mkdir,
      writeFile: (file, content) => fs.promises.writeFile(file, content, "utf8"),
      root: directory, files: compileFiles,
    });
    const apiRoot = mode === "nest" ? path.join(directory, "packages/api/src") : path.join(directory, "src");
    compilerPaths[slug + "-api"] = [path.join(apiRoot, "index.ts")];
    compilerPaths[slug + "-api/lib/*"] = [path.join(apiRoot, "*")];
  }
  return { paths: compilerPaths, resolveJsonModule: true };
};

module.exports = { test_migrate_generated_consumer };
