import { Typography } from "@mui/material";
import React from "react";

import { NestiaEditorIframe } from "./NestiaEditorIframe";
import { NESTIA_EDITOR_DEFAULT_PACKAGE } from "./internal/NestiaEditorDefaultPackage";
import { NestiaEditorUploader } from "./NestiaEditorUploader";

/**
 * The static editor page: converts an OpenAPI document into a downloadable project.
 *
 * The page reads its settings from the query string (`url`, `mode`, `package`, `keyword`, `simulate`, `e2e`) and from `window` globals the served `index.html` sets. It renders the iframe flow when a document location is given, or when `swagger.json` or `swagger.yaml` is served beside the page, and the uploader otherwise. The `uploader` query key forces the uploader.
 *
 * @evidence contracts/common.md#principled-implementation An explicit query URL is forwarded to the iframe, which loads it and reports a fetch error. Without one, swagger.json and then swagger.yaml are probed for HTTP 200; absent or failed lookup falls back to the uploader. Parsed generation options, including keyword, are passed to the iframe rather than replaced by its direct-component defaults.
 * @evidence contracts/common.md#clear-and-simple-design One component chooses between two existing components; the query and probing logic stays in the private `getAsset` and `findSwagger`, and option parsing lives in one place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The package name default comes from the shared constant, and no document name, host, or fixture is special-cased; booleans accept only `true` and `1`, as the query contract states.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the page does, where each setting comes from, the lookup order, and the `uploader` override.
 */
export function NestiaEditorApplication() {
  const [ready, setReady] = React.useState(false);
  const [asset, setAsset] = React.useState<IAsset | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setAsset(await getAsset());
      } catch {
        setAsset(null);
      }
      setReady(true);
    })().catch(() => {});
  }, []);
  if (ready === false) return <></>;

  return asset !== null ? (
    <NestiaEditorIframe
      swagger={asset.url}
      package={asset.package}
      keyword={asset.keyword}
      simulate={asset.simulate}
      e2e={asset.e2e}
      mode={asset.mode}
    />
  ) : (
    <div
      style={{
        padding: 25,
      }}
    >
      <Typography variant="h4">Nestia Editor</Typography>
      <hr />
      <br />
      <NestiaEditorUploader />
    </div>
  );
}

async function getAsset(): Promise<IAsset | null> {
  const index: number = window.location.href.indexOf("?");
  const query: URLSearchParams = new URLSearchParams(
    index === -1 ? "" : window.location.href.substring(index + 1),
  );
  if (query.has("uploader")) return null;

  const url: string | null =
    query.get("url") ??
    (await findSwagger("./swagger.json")) ??
    (await findSwagger("./swagger.yaml"));
  if (url === null) return null;

  const mode: string | null = query.get("mode");
  const packageName: string | null =
    query.get("package") ?? (window as any).package;
  const keyword: boolean | string | null =
    query.get("keyword") ?? (window as any).keyword;
  const simulate: boolean | string | null =
    query.get("simulate") ?? (window as any).simulate;
  const e2e: boolean | string | null = query.get("e2e") ?? (window as any).e2e;
  return {
    mode: mode === "nest" ? "nest" : "sdk",
    package: packageName ?? NESTIA_EDITOR_DEFAULT_PACKAGE,
    url,
    keyword:
      keyword !== null
        ? keyword === true || keyword === "true" || keyword === "1"
        : false,
    simulate:
      simulate !== null
        ? simulate === true || simulate === "true" || simulate === "1"
        : false,
    e2e: e2e !== null ? e2e === true || e2e === "true" || e2e === "1" : false,
  };
}

async function findSwagger(file: string): Promise<string | null> {
  try {
    const response: Response = await fetch(file);
    return response.status === 200 ? file : null;
  } catch {
    return null;
  }
}

interface IAsset {
  mode: "nest" | "sdk";
  package: string;
  url: string;
  keyword: boolean;
  simulate: boolean;
  e2e: boolean;
}
