import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * Serves one actual packed dependency to a distribution's ordinary npm install.
 *
 * A release candidate need not exist on npm yet. A project-scoped registry
 * supplies its current public tarball while unrelated scopes keep their normal
 * registry. The caller's real generator and installer remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation The shared consumer's content-addressed file dependency supplies the tarball and its installed manifest. npm receives the real manifest version, tarball bytes and SHA-512 integrity through its supported scoped registry protocol; unavailable versions return404.
 * @evidence contracts/common.md#clear-and-simple-design One callback lifetime owns one loopback listener and one exclusively created project npmrc. The caller retains its existing generation and compilation operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No package-manager method, product resolver or installed artifact is replaced. Normal npm requests install the current built public package even before publication, and successful setup requires an actual metadata request.
 * @evidence contracts/common.md#meaningful-documentation The comment states the unpublished-version premise, scoped registry boundary and unchanged real installation path.
 * @evidence contracts/portability.md#os-neutral-implementation Native paths resolve the consumer's existing file dependency. Node's HTTP server binds an ephemeral IPv4 loopback port; npmrc uses a URL and the package's actual scope on every platform.
 * @evidence contracts/performance.md#efficient-algorithms The tarball is read and hashed once. Each metadata request serializes one small manifest; artifact responses use the same immutable tarball buffer. The helper adds no packing, compiler build or package installation.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing shared consumer supplies this invocation's exact packed artifact; no registry result or success stamp survives another invocation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The callback owns the listener, buffers and new npmrc. Every exit attempts npmrc removal and listener closure independently, preserves original and cleanup failures, and destroys remaining owned HTTP connections.
 */
export async function withPublicPackageRegistry(
  props: { consumerRoot: string; directory: string; name: string },
  task: () => Promise<void>,
): Promise<void> {
  const requirePublic = createRequire(
    path.join(props.consumerRoot, "package.json"),
  );
  const consumer = JSON.parse(
    await fs.readFile(path.join(props.consumerRoot, "package.json"), "utf8"),
  );
  const specifier = consumer.dependencies?.[props.name];
  assert(typeof specifier === "string" && specifier.startsWith("file:"));
  const archive = path.resolve(props.consumerRoot, specifier.slice(5));
  const relative = path.relative(props.consumerRoot, archive);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  const manifest = requirePublic(props.name + "/package.json");
  assert.equal(manifest.name, props.name);
  assert(typeof manifest.version === "string");
  const scope = props.name.split("/")[0]!;
  assert(scope.startsWith("@"));
  const tarball = await fs.readFile(archive);
  const integrity =
    "sha512-" + crypto.createHash("sha512").update(tarball).digest("base64");
  const packagePath = "/" + props.name;
  const tarballPath = packagePath + "/-/package.tgz";
  let origin = "";
  let manifests = 0;
  const errors: unknown[] = [];
  const server = http.createServer((request, response) => {
    let pathname: string;
    try {
      pathname = decodeURIComponent(
        new URL(request.url ?? "/", "http://localhost").pathname,
      );
    } catch {
      response.writeHead(400).end();
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405).end();
      return;
    }
    if (pathname === tarballPath) {
      response.writeHead(200, {
        "content-type": "application/octet-stream",
        "content-length": tarball.length,
      });
      response.end(request.method === "HEAD" ? undefined : tarball);
    } else if (
      pathname === packagePath ||
      pathname === packagePath + "/" + manifest.version
    ) {
      manifests++;
      const version = {
        ...manifest,
        dist: { tarball: origin + tarballPath, integrity },
      };
      const metadata =
        pathname === packagePath
          ? {
              name: props.name,
              "dist-tags": { latest: manifest.version },
              versions: { [manifest.version]: version },
            }
          : version;
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        request.method === "HEAD" ? undefined : JSON.stringify(metadata),
      );
    } else response.writeHead(404).end();
  });
  const config = path.join(props.directory, ".npmrc");
  let written = false;
  let configFile: Awaited<ReturnType<typeof fs.open>> | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        server.off("error", reject);
        resolve();
      });
    });
    server.on("error", (error) => errors.push(error));
    const address = server.address();
    assert(address && typeof address !== "string");
    origin = "http://127.0.0.1:" + address.port;
    await fs.mkdir(props.directory, { recursive: true });
    configFile = await fs.open(config, "wx");
    written = true;
    await configFile.writeFile(scope + ":registry=" + origin + "\n");
    await configFile.close();
    configFile = undefined;
    await task();
    assert(
      manifests > 0,
      "The distribution did not resolve its built dependency from the scoped registry.",
    );
  } catch (error) {
    errors.push(error);
  } finally {
    if (configFile)
      try {
        await configFile.close();
      } catch (error) {
        errors.push(error);
      }
    if (written)
      try {
        await fs.unlink(config);
      } catch (error) {
        errors.push(error);
      }
    if (server.listening) {
      server.closeAllConnections();
      try {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      } catch (error) {
        errors.push(error);
      }
    }
  }
  if (errors.length)
    throw new AggregateError(errors, "Public package registry failed.");
}
