import type {
  OpenApiV3,
  OpenApiV3_1,
  OpenApiV3_2,
  SwaggerV2,
} from "@typia/interface";
import * as fs from "fs";
import path from "path";

import { NESTIA_EDITOR_DEFAULT_PACKAGE } from "./internal/NestiaEditorDefaultPackage";

/**
 * Serves the editor from a NestJS application.
 *
 * Call {@link setup} before `listen()` to expose the editor page, its bundle,
 * and the OpenAPI document under a path of the application.
 *
 * @evidence contracts/common.md#principled-implementation The module registers static routes on the application's own HTTP adapter, so the editor needs no second server.
 * @evidence contracts/common.md#clear-and-simple-design One namespace with one entry point; asset reading and location resolution stay in module-private helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The routes use the adapter's public `get` method, and the one read of NestJS internals is the global prefix, described at `setup`.
 * @evidence contracts/common.md#meaningful-documentation The comment states the entry point and that it must run before `listen()`.
 * @evidence contracts/performance.md#efficient-algorithms Setup reads each page-referenced JavaScript asset once and stores strings in registered route closures. Work scales with page and referenced asset bytes plus serialized document size, rather than HTTP request count.
 * @evidence contracts/performance.md#reuse-equivalent-work Every registered static route shares its setup-read string. One application route shares the successfully fetched serialized Swagger document and its in-flight producer; a failure clears the pending promise so a later request may retry. The location and document are fixed for that setup registration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The application adapter owns registered closures and their asset/document strings for its route lifetime. Only one document producer is retained at a time and settles before pending is cleared; setup creates no process-global history. Fetch cancellation is not supplied by this API, so an unresolved producer remains pending until its transport settles.
 * @evidence contracts/portability.md#os-neutral-implementation Built assets are read through Node fs and path from the installed module directory; page asset URL spelling is validated independently from native paths. Swagger locations use URL resolution and application.getUrl rather than native path joining.
 */
export namespace NestiaEditorModule {
  /**
   * Registers the editor routes on a NestJS application.
   *
   * The routes are `<prefix>/index.html`, the bundle under `<prefix>/assets/`,
   * `<prefix>/swagger.json`, and redirects from `<prefix>` and `<prefix>/` to
   * the page, where the prefix joins the application's global prefix and
   * `path`. A document given as an object is served as is. A document given by
   * location is fetched on the first request, after `listen()`, because a path
   * is resolved against the address the application listens on, and the fetched
   * document is cached; a failed fetch answers 502 and is not cached.
   *
   * @evidence contracts/common.md#principled-implementation The prefix is built by joining the global prefix and the path and dropping empty segments, so slashes never double; the static files are read once at setup, and the swagger route is lazy for a location because the listening address, which relative locations need, does not exist before `listen()`.
   * @evidence contracts/common.md#clear-and-simple-design One function performs the registration; reading the built page and bundle, reading the global prefix, and resolving a location are separate module-private helpers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts NestJS exposes no public getter for the global prefix, so `getGlobalPrefix` reads the internal `config.globalPrefix` and falls back to an empty prefix when it is absent; this is the single foreign-internal read, kept as a stated limitation rather than replaced by a shadow copy of the prefix.
   * @evidence contracts/common.md#meaningful-documentation The comment lists the routes, the prefix rule, and when a location is fetched and cached.
   * @evidence contracts/performance.md#efficient-algorithms Setup reads each page-referenced JavaScript asset once and stores strings in registered route closures. Work scales with page and referenced asset bytes plus serialized document size, rather than HTTP request count.
   * @evidence contracts/performance.md#reuse-equivalent-work Every registered static route shares its setup-read string. One application route shares the successfully fetched serialized Swagger document and its in-flight producer; a failure clears the pending promise so a later request may retry. The location and document are fixed for that setup registration.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The application adapter owns registered closures and their asset/document strings for its route lifetime. Only one document producer is retained at a time and settles before pending is cleared; setup creates no process-global history. Fetch cancellation is not supplied by this API, so an unresolved producer remains pending until its transport settles.
   * @evidence contracts/portability.md#os-neutral-implementation Built assets are read through Node fs and path from the installed module directory; page asset URL spelling is validated independently from native paths. Swagger locations use URL resolution and application.getUrl rather than native path joining.
   */
  export const setup = async (props: {
    path: string;
    application: INestApplication;
    swagger:
      | string
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApiV3_2.IDocument;
    package?: string;
    simulate?: boolean;
    e2e?: boolean;
  }): Promise<void> => {
    const prefix: string = [getGlobalPrefix(props.application), props.path]
      .join("/")
      .split("/")
      .filter((str) => str.length !== 0)
      .map((str) => "/" + str)
      .join("");
    const adaptor: INestHttpAdaptor = props.application.getHttpAdapter();
    const index: string = await getIndex(props);
    const staticFiles: IStaticFile[] = [
      {
        path: "/index.html",
        type: "text/html",
        content: index,
      },
      ...(await getJavaScripts(index)),
    ];
    for (const f of staticFiles) {
      adaptor.get(prefix + f.path, (_: any, res: any) => {
        res.type(f.type);
        return res.send(f.content);
      });
    }

    // A document given by location is read when the editor asks for it, not
    // here: `setup()` runs before `listen()`, so the application's own path,
    // such as `@nestjs/swagger`'s "/api-json", serves nothing yet, and a path
    // is resolved against the address the application listens on.
    let document: string | null =
      typeof props.swagger === "string"
        ? null
        : JSON.stringify(props.swagger, null, 2);
    let pending: Promise<string> | null = null;
    adaptor.get(prefix + "/swagger.json", async (_: any, res: any) => {
      try {
        if (document === null) {
          pending ??= (async () =>
            JSON.stringify(
              await getSwagger(
                await resolveLocation(
                  props.application,
                  props.swagger as string,
                ),
              ),
              null,
              2,
            ))().finally(() => {
            pending = null;
          });
          document = await pending;
        }
      } catch (error) {
        res.status(502);
        res.type("text/plain");
        return res.send(error instanceof Error ? error.message : String(error));
      }
      res.type("application/json");
      return res.send(document);
    });
    for (const p of prefix.length === 0 ? ["/"] : ["", "/"])
      adaptor.get(prefix + p, (_: any, res: any) => {
        return res.redirect(prefix + "/index.html");
      });
  };

  const getGlobalPrefix = (app: INestApplication): string =>
    typeof (app as any).config?.globalPrefix === "string"
      ? (app as any).config.globalPrefix
      : "";
}

interface INestApplication {
  use(...args: any[]): this;
  getUrl(): Promise<string>;
  getHttpAdapter(): INestHttpAdaptor;
  setGlobalPrefix(prefix: string, options?: any): this;
}
interface INestHttpAdaptor {
  getType(): string;
  close(): any;
  init?(): Promise<void>;
  get: Function;
  post: Function;
  put: Function;
  patch: Function;
  delete: Function;
  head: Function;
  all: Function;
}
interface IStaticFile {
  path: string;
  type: string;
  content: string;
}

const getIndex = async (props: {
  package?: string;
  simulate?: boolean;
  e2e?: boolean;
}): Promise<string> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../dist/index.html`,
    "utf8",
  );
  // Replacement functions, because a replacement string would read its dollar
  // patterns, which a package name may legitimately contain.
  return content
    .replace(JSON.stringify(NESTIA_EDITOR_DEFAULT_PACKAGE), () =>
      JSON.stringify(props.package ?? NESTIA_EDITOR_DEFAULT_PACKAGE),
    )
    .replace(
      "window.simulate = false",
      () => `window.simulate = ${!!props.simulate}`,
    )
    .replace("window.e2e = false", () => `window.e2e = ${!!props.e2e}`);
};

const getJavaScripts = async (index: string): Promise<IStaticFile[]> => {
  const scripts: Set<string> = new Set();
  for (const match of index.matchAll(
    /<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*>/gi,
  )) {
    const url = new URL(match[2]!, "https://nestia.invalid/");
    if (
      url.origin !== "https://nestia.invalid" ||
      url.pathname.startsWith("/assets/") === false ||
      url.pathname.endsWith(".js") === false ||
      url.search.length !== 0 ||
      url.hash.length !== 0
    )
      throw new Error(`Unsupported editor script asset: ${match[2]}`);
    scripts.add(url.pathname);
  }
  if (scripts.size === 0)
    throw new Error("The editor page references no JavaScript asset.");
  return Promise.all(
    [...scripts].map(async (asset) => ({
      path: asset,
      type: "application/javascript",
      content: await fs.promises.readFile(
        path.join(__dirname, "../dist", asset.slice(1)),
        "utf8",
      ),
    })),
  );
};

/** An absolute URL as is; a path of the application at its own address. */
const resolveLocation = async (
  application: INestApplication,
  location: string,
): Promise<string> =>
  /^[a-z][a-z\d+\-.]*:/i.test(location)
    ? location
    : new URL(location, await application.getUrl()).href;

const getSwagger = async (
  url: string,
): Promise<
  SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument
> => {
  const response: Response = await fetch(url);
  if (response.status !== 200)
    throw new Error(`Failed to fetch Swagger document from ${url}`);
  return response.json();
};
