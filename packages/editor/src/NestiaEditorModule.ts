import type { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import * as fs from "fs";

export namespace NestiaEditorModule {
  export const setup = async (props: {
    path: string;
    application: INestApplication;
    swagger:
      | string
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument;
    package?: string;
    simulate?: boolean;
    e2e?: boolean;
  }): Promise<void> => {
    const prefix: string =
      "/" +
      [getGlobalPrefix(props.application), props.path]
        .join("/")
        .split("/")
        .filter((str) => str.length !== 0)
        .join("/");
    const adaptor: INestHttpAdaptor = props.application.getHttpAdapter();
    const staticFiles: IStaticFile[] = [
      {
        path: "/index.html",
        type: "text/html",
        content: await getIndex(props),
      },
      {
        path: "/swagger.json",
        type: "application/json",
        content: JSON.stringify(
          typeof props.swagger === "string"
            ? await getSwagger(props.swagger)
            : props.swagger,
          null,
          2,
        ),
      },
      await getJavaScript(),
    ];
    for (const f of staticFiles) {
      adaptor.get(prefix + f.path, (_: any, res: any) => {
        res.type(f.type);
        return res.send(f.content);
      });
    }
    for (const p of ["", "/"])
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
  return content
    .replace(
      `"@ORGANIZATION/PROJECT"`,
      JSON.stringify(props.package ?? "@ORGANIZATION/PROJECT"),
    )
    .replace("window.simulate = false", `window.simulate = ${!!props.simulate}`)
    .replace("window.e2e = false", `window.e2e = ${!!props.e2e}`);
};

const getJavaScript = async (): Promise<IStaticFile> => {
  const directory: string[] = await fs.promises.readdir(
    `${__dirname}/../dist/assets`,
  );
  const path: string | undefined = directory[0];
  if (path === undefined)
    throw new Error("Unreachable code, no JS file exists.");
  return {
    path: `/assets/${path}`,
    type: "application/javascript",
    content: await fs.promises.readFile(
      `${__dirname}/../dist/assets/${path}`,
      "utf8",
    ),
  };
};

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
