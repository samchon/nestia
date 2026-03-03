import { DynamicExecutor } from "@nestia/e2e";
import { sleep_for } from "tstl";

import api from "@ORGANIZATION/PROJECT-api";

import { MyConfiguration } from "../../src/MyConfiguration";

export namespace TestAutomation {
  export interface IProps<T> {
    open(options: IOptions): Promise<T>;
    close(backend: T): Promise<void>;
    onComplete(exec: DynamicExecutor.IExecution): void;
    options: IOptions;
  }

  export interface IOptions {
    simultaneous: number;
    include?: string[];
    exclude?: string[];
  }

  export const execute = async <T>(
    props: IProps<T>,
  ): Promise<DynamicExecutor.IReport> => {
    // OPEN BACKEND
    const backend: T = await props.open(props.options);

    // DO TEST
    const connection: api.IConnection = {
      host: `http://127.0.0.1:${MyConfiguration.API_PORT()}`,
    };
    const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
      prefix: "test",
      location: __dirname + "/../features",
      parameters: () => [
        {
          host: connection.host,
          encryption: connection.encryption,
        },
      ],
      filter: (func) =>
        (!props.options.include?.length ||
          (props.options.include ?? []).some((str) => func.includes(str))) &&
        (!props.options.exclude?.length ||
          (props.options.exclude ?? []).every((str) => !func.includes(str))),
      onComplete: props.onComplete,
      simultaneous: props.options.simultaneous,
      extension: __filename.endsWith(".ts") ? "ts" : "js",
    });

    // TERMINATE - WAIT FOR BACKGROUND EVENTS
    await sleep_for(2500);
    await props.close(backend);
    return report;
  };
}
