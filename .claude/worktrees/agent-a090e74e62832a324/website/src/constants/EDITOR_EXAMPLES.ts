export const EDITOR_EXAMPLES: IAsset[] = [
  {
    title: "BBS (Bullet-in Board System)",
    package: "@samchon/bbs",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/test/examples/v3.1/bbs.json",
  },
  {
    title: "Shopping Mall",
    package: "@samchon/shopping",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/test/examples/v3.1/shopping.json",
  },
  {
    title: "Clickhouse",
    package: "clickhouse",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/test/examples/v3.0/clickhouse.json",
  },
  {
    title: "Fireblocks",
    package: "fireblocks",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/test/examples/v3.0/fireblocks.json",
  },
  {
    title: "Uber",
    package: "uber",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/test/examples/v2.0/uber.json",
  },
  {
    title: "OpenAI",
    package: "openai",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/test/examples/v3.0/openai.json",
  },
];
interface IAsset {
  title: string;
  package: string;
  swagger: string;
}
