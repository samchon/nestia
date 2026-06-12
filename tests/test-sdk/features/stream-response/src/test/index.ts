import { DynamicExecutor } from "@nestia/e2e";

import api from "@api";

const main = async (): Promise<void> => {
  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    extension: __filename.substring(__filename.length - 2),
    prefix: "test",
    parameters: () => [
      {
        host: "http://127.0.0.1",
        fetch: async () =>
          new Response(
            new ReadableStream<Uint8Array<ArrayBufferLike>>({
              start: (controller) => {
                controller.enqueue(new Uint8Array([1, 2, 3, 4]));
                controller.close();
              },
            }),
            {
              headers: {
                "Content-Type": "image/png",
              },
              status: 200,
            },
          ),
      } satisfies api.IConnection,
    ],
    location: `${__dirname}/features`,
  });

  const exceptions: Error[] = report.executions
    .filter((exec) => exec.error !== null)
    .map((exec) => exec.error!);
  if (exceptions.length !== 0) {
    for (const exp of exceptions) console.log(exp);
    process.exit(-1);
  }
};
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
