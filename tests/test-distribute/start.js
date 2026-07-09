const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const FEATURES = path.join(__dirname, "features");
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const build = () =>
  new Promise((resolve, reject) => {
    const child = cp.spawn(PNPM, ["--filter", "@nestia/sdk", "run", "build"], {
      cwd: ROOT,
      env: {
        ...process.env,
        NODE_OPTIONS: "",
        TTSC_GO_BINARY: process.env.TTSC_GO_BINARY || "go",
        TTSC_CACHE_DIR:
          process.env.TTSC_CACHE_DIR ||
          path.join(ROOT, "node_modules", ".cache", "ttsc"),
      },
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `@nestia/sdk build failed with ${signal ?? `exit code ${code}`}.`,
            ),
          ),
    );
  });

const main = async () => {
  if (process.env.TEST_DISTRIBUTE_SKIP_BUILD !== "1") await build();

  const files = (await fs.promises.readdir(FEATURES))
    .filter((file) => file.endsWith(".js"))
    .sort();
  const failures = [];
  for (const file of files) {
    const name = path.basename(file, ".js");
    const exported = require(path.join(FEATURES, file));
    const functions = Object.keys(exported).filter((key) =>
      key.startsWith("test_"),
    );
    if (functions.length !== 1 || functions[0] !== name)
      throw new Error(
        `Each feature file must export exactly one test function matching ` +
          `its file name; ${file} exports [${functions.join(", ")}].`,
      );
    const started = Date.now();
    try {
      await exported[name]();
      console.log(`  - ${name}: ${(Date.now() - started).toLocaleString()} ms`);
    } catch (error) {
      failures.push(name);
      console.error(`  - ${name}: failed`);
      console.error(error);
    }
  }
  console.log(
    `Total: ${files.length - failures.length} of ${files.length} passed.`,
  );
  if (failures.length !== 0)
    throw new Error(`Failed test-distribute features: ${failures.join(", ")}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
