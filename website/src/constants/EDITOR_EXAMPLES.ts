export const EDITOR_EXAMPLES: IAsset[] = [
  {
    title: "BBS (Bullet-in Board System)",
    swagger: "/swaggers/bbs.json",
  },
  {
    title: "Shopping Mall",
    swagger: "/swaggers/shopping.json",
  },
  {
    title: "Clickhouse",
    swagger: "/swaggers/clickhouse.json",
  },
  {
    title: "Fireblocks",
    swagger: "/swaggers/fireblocks.json",
  },
  {
    title: "Uber",
    swagger: "/swaggers/uber.json",
  },
  {
    title: "아임포트",
    swagger: "/swaggers/iamport.json",
  },
  {
    title: "토스페이먼츠",
    swagger: "/swaggers/toss-payments.json",
  },
];
interface IAsset {
  title: string;
  swagger: string;
}
