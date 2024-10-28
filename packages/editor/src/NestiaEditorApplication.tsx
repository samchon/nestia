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
      simulate={asset.simulate}
      e2e={asset.e2e}
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
  const url: string | null = query.get("url") ?? (await findSwagger());
  if (url === null) return null;

  const simulate: string | null = query.get("simulate");
  const e2e: string | null = query.get("e2e");
  const mode: string | null = query.get("mode");
  return {
    url,
    simulate:
      simulate !== null ? simulate === "true" || simulate === "1" : true,
    e2e: e2e !== null ? e2e === "true" || e2e === "1" : true,
    mode: mode === "nest" ? "nest" : "sdk",
  };
}

async function findSwagger(): Promise<string | null> {
  const response: Response = await fetch("./swagger.json");
  console.log("swagger", response.status);
  return response.status === 200 ? "./swagger.json" : null;
}

interface IAsset {
  url: string;
  simulate: boolean;
  e2e: boolean;
  mode: "nest" | "sdk";
}
