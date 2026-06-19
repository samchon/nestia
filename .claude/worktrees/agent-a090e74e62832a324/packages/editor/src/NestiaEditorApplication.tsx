import { Typography } from "@mui/material";
import React from "react";

import { NestiaEditorIframe } from "./NestiaEditorIframe";
import { NestiaEditorUploader } from "./NestiaEditorUploader";

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
    package: packageName ?? "@ORGANIZATION/PROJECT",
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
  const response: Response = await fetch(file);
  return response.status === 200 ? file : null;
}

interface IAsset {
  mode: "nest" | "sdk";
  package: string;
  url: string;
  keyword: boolean;
  simulate: boolean;
  e2e: boolean;
}
