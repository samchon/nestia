import { DynamicExecutor } from "@nestia/e2e";
import cp from "child_process";
import { sleep_for } from "tstl";

import { MyConfiguration } from "../src/MyConfiguration";
import { MyGlobal } from "../src/MyGlobal";
import { TestAutomation } from "./helpers/TestAutomation";
import { TestAutomationStdio } from "./helpers/TestAutomationStdio";

const wait = async (): Promise<void> => {
  while (true)
    try {
      await fetch(`http://localhost:${MyConfiguration.API_PORT()}/dsafdsafsd`);
      return;
    } catch (exp) {
      await sleep_for(100);
    }
};

const main = async (): Promise<void> => {
  MyGlobal.testing = true;

  const report: DynamicExecutor.IReport = await TestAutomation.execute({
    open: async () => {
      const backend: cp.ChildProcess = cp.fork(
        `${MyConfiguration.ROOT}/dist/server.js`,
        {
          cwd: `${MyConfiguration.ROOT}/dist`,
        },
      );
      await wait();
      return backend;
    },
    close: async (backend) => {
      backend.kill();
    },
    options: await TestAutomationStdio.getOptions(),
    onComplete: TestAutomationStdio.onComplete,
  });
  TestAutomationStdio.report(report);
};
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
