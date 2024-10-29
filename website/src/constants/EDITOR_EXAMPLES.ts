export const EDITOR_EXAMPLES: IAsset[] = [
  {
    title: "BBS (Bullet-in Board System)",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/examples/v3.1/bbs.json",
  },
  {
    title: "Shopping Mall",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/examples/v3.1/shopping.json",
  },
  {
    title: "Clickhouse",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/examples/v3.0/clickhouse.json",
  },
  {
    title: "Fireblocks",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/examples/v3.0/fireblocks.json",
  },
  {
    title: "Uber",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/examples/v2.0/uber.json",
  },
  {
    title: "OpenAI",
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/examples/v3.0/openai.json",
  },
];
interface IAsset {
  title: string;
  swagger: string;
}
