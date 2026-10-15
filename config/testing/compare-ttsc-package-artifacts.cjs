const assert = require("node:assert/strict");
const { execFileSync, spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { performance } = require("node:perf_hooks");

const repository = path.resolve(__dirname, "../..");
const upstream = process.env.TTSC_SOURCE_ROOT;
assert.ok(upstream && path.isAbsolute(upstream), "TTSC_SOURCE_ROOT must be absolute");
assert.equal(process.platform, "win32", "the experiment requires a Windows pack");

const project = path.join(repository, "packages", "sdk");
const compiler = path.join(upstream, "packages", "ttsc", "lib", "launcher", "ttsc.js");
const platform = path.join(upstream, "packages", "ttsc-win32-x64", "bin");
const helper = path.join(platform, "ttsc-cache.exe");
const go = path.join(platform, "go", "bin", "go.exe");
for (const file of [compiler, helper, go]) assert.ok(fs.statSync(file).isFile(), file);

const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-native-artifacts-"));
const records = path.join(root, "records");
const moduleCache = path.join(root, "go-modules");
const snapshots = new Map();
const sourceRoots = [path.join(repository, "packages", "core", "native"), path.join(project, "native")];
const sourceDigest = () => {
  const hash = crypto.createHash("sha256");
  for (const directory of sourceRoots) {
    for (const [name, digest] of [...files(directory)].sort(([a], [b]) => a.localeCompare(b))) {
      hash.update(path.relative(repository, directory)).update("/").update(name).update("\0").update(digest).update("\n");
    }
  }
  return hash.digest("hex");
};
const initialSourceDigest = sourceDigest();
let servedPack;
let requests = 0;
let transferredBytes = 0;

const server = http.createServer((request, response) => {
  requests++;
  const name = new URL(request.url, "http://127.0.0.1").pathname.slice(1);
  if (!/^[a-z0-9-]+-[0-9a-f]{64}\.zip$/.test(name) ||
      servedPack === undefined || name !== path.basename(servedPack)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": "application/zip" });
  const input = fs.createReadStream(servedPack);
  input.on("data", (chunk) => { transferredBytes += chunk.length; });
  input.on("error", (error) => response.destroy(error));
  input.pipe(response);
});

function files(directory, relative = "") {
  const entries = new Map();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [child, digest] of files(location, name)) entries.set(child, digest);
    } else if (entry.isFile()) {
      entries.set(name.replaceAll("\\", "/"), crypto.createHash("sha256").update(fs.readFileSync(location)).digest("hex"));
    }
  }
  return entries;
}

function run(label, additionalEnv) {
  const cache = path.join(root, label, "ttsc");
  const goCache = path.join(cache, "go-build");
  fs.rmSync(path.join(project, "lib"), { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  const env = {
    ...process.env,
    CGO_ENABLED: "0",
    GOFLAGS: "",
    GOCACHEPROG: "",
    GOCACHE: goCache,
    GOMODCACHE: moduleCache,
    TTSC_CACHE_DIR: cache,
    TTSC_GO_CACHE_DIR: goCache,
    TTSC_GO_BINARY: go,
    TTSC_PACKAGE_ARTIFACT_HELPER: helper,
    ...additionalEnv,
  };
  const start = performance.now();
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [compiler, "--cwd", project, "--emit"], {
      cwd: project,
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; process.stdout.write(chunk); });
    child.stderr.on("data", (chunk) => { stderr += chunk; process.stderr.write(chunk); });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      const seconds = (performance.now() - start) / 1000;
      if (code !== 0 || signal !== null) {
        reject(new Error(`${label} failed (${code}, ${signal}) after ${seconds.toFixed(3)}s\n${stderr}`));
        return;
      }
      snapshots.set(label, files(path.join(project, "lib")));
      console.log(`${label}: ${seconds.toFixed(3)}s, ${snapshots.get(label).size} output files`);
      resolve({ seconds, stdout, stderr });
    });
  });
}

async function main() {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const baseline = await run("baseline", {});
  fs.rmSync(path.join(root, "baseline"), { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  const publisher = await run("publisher", {
    TTSC_PACKAGE_ARTIFACT_RECORD_DIR: records,
    TTSC_PACKAGE_ARTIFACT_SOURCE_COMMIT: process.env.GITHUB_SHA || "a".repeat(40),
    TTSC_PACKAGE_ARTIFACT_PACK_URL_BASE: url,
    TTSC_PACKAGE_ARTIFACT_PACK_NAME: "nestia-sdk",
  });
  assert.deepEqual(snapshots.get("publisher"), snapshots.get("baseline"), "publisher changed output bytes");
  const entries = fs.readdirSync(records);
  assert.equal(entries.length, 1, "expected one native host recording");
  const sealed = path.join(records, entries[0], "sealed");
  const manifestPath = path.join(sealed, "manifest.json");
  const manifestBytes = fs.readFileSync(manifestPath);
  const manifestSHA256 = crypto.createHash("sha256").update(manifestBytes).digest("hex");
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  assert.equal(manifest.packs.length, 1, "expected one sealed package pack");
  assert.ok(manifest.actions.length > 0, "publisher recorded no Go actions");
  servedPack = path.join(sealed, `nestia-sdk-${manifest.packs[0].sha256}.zip`);
  assert.equal(fs.statSync(servedPack).size, manifest.packs[0].length);
  fs.rmSync(path.join(root, "publisher", "ttsc"), { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  const artifact = await run("artifact", {
    TTSC_PACKAGE_ARTIFACTS: "1",
    TTSC_PACKAGE_ARTIFACT_MANIFEST: manifestPath,
    TTSC_PACKAGE_ARTIFACT_SHA256: manifestSHA256,
  });
  assert.deepEqual(snapshots.get("artifact"), snapshots.get("baseline"), "artifact changed output bytes");
  assert.match(artifact.stderr, /package artifacts prepared 1 pack\(s\), 1 downloaded/);
  const hits = /package artifacts: (\d+) publisher hits, (\d+) local hits, (\d+) misses, (\d+) puts/.exec(artifact.stderr);
  assert.ok(hits, "missing Go helper usage receipt");
  assert.ok(Number(hits[1]) > 0, "no approved publisher action was reused");
  assert.equal(requests, 1, "consumer must fetch exactly one pack");
  assert.equal(transferredBytes, manifest.packs[0].length, "incomplete HTTP transfer");
  assert.equal(sourceDigest(), initialSourceDigest, "native source changed during comparison");
  const savingsSeconds = baseline.seconds - artifact.seconds;
  const savingsPercent = 100 * savingsSeconds / baseline.seconds;
  const result = {
    source: "@nestia/sdk",
    ttscCommit: execFileSync("git", ["-C", upstream, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    nestiaCommit: process.env.GITHUB_SHA || null,
    host: `${os.type()} ${os.release()} ${os.arch()}; ${os.cpus()[0]?.model}; ${os.cpus().length} logical CPUs; ${(os.totalmem() / 2 ** 30).toFixed(1)} GiB RAM`,
    nodeVersion: process.version,
    goVersion: execFileSync(go, ["version"], { encoding: "utf8" }).trim(),
    baselineSeconds: baseline.seconds,
    publisherSeconds: publisher.seconds,
    artifactSeconds: artifact.seconds,
    savingsSeconds,
    savingsPercent,
    publisherHits: Number(hits[1]),
    localHits: Number(hits[2]),
    misses: Number(hits[3]),
    puts: Number(hits[4]),
    requests,
    transferredBytes,
    manifestSHA256,
    nativeSourceSHA256: initialSourceDigest,
    outputFiles: snapshots.get("artifact").size,
    measurementScope: "compiler process only; artifact duration includes loopback transfer and preparation",
  };
  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
      "## Nestia SDK package-artifact comparison",
      "",
      `Pinned ttsc source: \`${result.ttscCommit}\`; ${result.goVersion}; Node ${result.nodeVersion}.`,
      "",
      "| First source build | Wall time |",
      "| --- | ---: |",
      `| Ordinary Go cache | ${baseline.seconds.toFixed(3)} s |`,
      `| Downloaded package artifacts | ${artifact.seconds.toFixed(3)} s |`,
      `| Savings | ${savingsSeconds.toFixed(3)} s (${savingsPercent.toFixed(1)}%) |`,
      "",
      `${result.publisherHits} approved publisher hits, ${result.misses} misses, ${transferredBytes} HTTP bytes in ${requests} request(s); ${result.outputFiles} output files and native source bytes matched.`,
      "",
      "Wall time starts with the compiler process and includes artifact transfer and preparation. Dependency installation, prerequisite package build, and publisher pack creation are outside the comparison.",
      "",
    ].join("\n"));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});
