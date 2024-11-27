import { IBenchmarkEvent } from "../IBenchmarkEvent";

export interface IBenchmarkServant {
  execute(props: {
    count: number;
    simultaneous: number;
  }): Promise<IBenchmarkEvent[]>;
}
