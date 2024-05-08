declare module "get-function-location" {
  export default function (func: any): Promise<{
    source: string;
    line: number;
    column: number;
  }>;
}
