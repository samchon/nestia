import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";
import { createRequire } from "module";

/**
 * Verifies a migrated NestJS route writes each literal character the router
 * reserves escaped, so it matches its own URL alone, and its controller's
 * directory holds no character a Windows file name cannot.
 *
 * `NestiaMigrateControllerAnalyzer.routePath()` joined the document's literal
 * text as is, so an AIP custom method `/items:batchGet` read as a parameter
 * `batchGet` matching `/itemsANYTHING`, `/items/{id}:cancel` and `/a(b/c` threw
 * at route registration, and the directory took `items:batchGet` (#1713).
 *
 * 1. Migrate a document holding those paths, and `*`, `+`, `!` beside a parameter,
 *    in NestJS mode.
 * 2. Match each route, controller and method paths joined, with the path-to-regexp
 *    NestJS 11's Express router uses: the document's URL matches with the
 *    parameters it names, and a neighbor does not.
 * 3. Assert no controller directory holds `:`, `*`, `?`, or a backslash.
 * 4. Assert the SDK's path functions write the URL unescaped.
 */
export const test_migrate_route_reserved = (): void => {
  const { match } = createRequire(require.resolve("@nestjs/core"))(
    "path-to-regexp",
  ) as {
    match: (
      path: string,
    ) => (url: string) => false | { params: Record<string, string> };
  };
  const cases: Array<{
    route: string;
    url: string;
    params: Record<string, string>;
    neighbor: string;
  }> = [
    {
      route: "POST /items:batchGet",
      url: "/items:batchGet",
      params: {},
      neighbor: "/itemsANYTHING",
    },
    {
      route: "POST /items/:id:cancel",
      url: "/items/7:cancel",
      params: { id: "7" },
      neighbor: "/items/7:other",
    },
    {
      route: "GET /a(b/c",
      url: "/a(b/c",
      params: {},
      neighbor: "/ab/c",
    },
    {
      route: "GET /files/:name*+!",
      url: "/files/x*+!",
      params: { name: "x" },
      neighbor: "/files/x",
    },
  ];

  const files: Record<string, string> = NestiaMigrateApplication.assert(
    DOCUMENT,
  ).nest({
    keyword: false,
    simulate: false,
    e2e: false,
    package: "fixture",
  });
  const routes: Map<string, string> = new Map(
    Object.entries(files)
      .filter(([key]) => key.endsWith("Controller.ts"))
      .flatMap(([, content]) => collect(content)),
  );
  for (const c of cases) {
    const escaped: string | undefined = routes.get(c.route);
    if (escaped === undefined)
      throw new Error(
        `no migrated route for ${c.route}: ${JSON.stringify([...routes])}`,
      );
    const matched = match(escaped)(c.url);
    if (
      matched === false ||
      JSON.stringify(matched.params) !== JSON.stringify(c.params)
    )
      throw new Error(
        `${escaped} does not match ${c.url} with ${JSON.stringify(c.params)}: ${JSON.stringify(matched)}`,
      );
    if (match(escaped)(c.neighbor) !== false)
      throw new Error(`${escaped} also matches ${c.neighbor}`);
  }

  for (const key of Object.keys(files))
    if (key.includes("/controllers/")) {
      const directory: string = key.slice(0, key.lastIndexOf("/"));
      if (/[:*?\\]/.test(directory))
        throw new Error(`a controller directory is no file name: ${key}`);
    }

  const functional: string = Object.entries(files)
    .filter(([key]) => key.includes("/functional/"))
    // without whitespace or the trailing commas a formatter adds
    .map(([, content]) => content.replace(/\s+/g, "").replace(/,\)/g, ")"))
    .join("\n");
  for (const url of [
    '"/items:batchGet"',
    '`/items/${PathParameter.encode("id",id)}:cancel`',
  ])
    if (functional.includes(url) === false)
      throw new Error(`no SDK path function writes ${url}`);
};

/** `METHOD /path` of each handler, joined as NestJS's router joins them. */
const collect = (content: string): Array<[string, string]> => {
  const controller: RegExpMatchArray | null = content.match(
    /@Controller\(\s*"((?:[^"\\]|\\.)*)"\s*\)/,
  );
  if (controller === null) return [];
  const output: Array<[string, string]> = [];
  const decorator: RegExp =
    /@(?:[A-Za-z_$][\w$]*\.)*(Get|Post|Put|Patch|Delete|Head)\(\s*(?:"((?:[^"\\]|\\.)*)")?\s*\)/g;
  for (const m of content.matchAll(decorator)) {
    const escaped: string =
      "/" +
      [controller[1]!, m[2] ?? ""]
        .map((str) => JSON.parse(`"${str}"`) as string)
        .join("/")
        .split("/")
        .filter((segment) => segment.length !== 0)
        .join("/");
    output.push([
      `${m[1]!.toUpperCase()} ${escaped.replace(/\\/g, "")}`,
      escaped,
    ]);
  }
  return output;
};

const parameter = (name: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
});

const ok = {
  200: {
    description: "ok",
    content: { "application/json": { schema: { type: "string" } } },
  },
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: { title: "Router-reserved literals", version: "1.0.0" },
  paths: {
    "/items:batchGet": { post: { responses: ok } },
    "/items/{id}:cancel": {
      post: { parameters: [parameter("id")], responses: ok },
    },
    "/a(b/c": { get: { responses: ok } },
    "/files/{name}*+!": {
      get: { parameters: [parameter("name")], responses: ok },
    },
  },
  components: {},
} as unknown as OpenApiV3_1.IDocument;
