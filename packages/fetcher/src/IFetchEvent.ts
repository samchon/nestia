// import { IConnection } from "./IConnection";
import { IFetchRoute } from "./IFetchRoute";

export interface IFetchEvent {
  route: IFetchRoute<"DELETE" | "GET" | "HEAD" | "PATCH" | "POST" | "PUT">;
  path: string;
  status: number | null;
  input: any;
  output: any;
  started_at: Date;
  respond_at: Date | null;
  completed_at: Date;
}
// export namespace IFetchEvent {
//   export interface IFunction {
//     (connection: IConnection, ...args: any[]): Promise<any>;
//     METADATA: {
//       method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
//       path: string;
//       request: null | {
//         type: string;
//         encrypted: boolean;
//       };
//       response: null | {
//         type: string;
//         encrypted: boolean;
//       };
//     };
//     status: null | number;
//   }
// }
