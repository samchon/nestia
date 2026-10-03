import { main as migrate } from "./test-migrate/src/index";

const { main: sdk } = require("./test-sdk/start.js");
const {
  preparePublicConsumer,
} = require("../scripts/prepare-public-consumer.cjs");
const { runSharedIntegrations } = require("../scripts/run-integration.cjs");

runSharedIntegrations(
  () => preparePublicConsumer(["tests/test-sdk", "tests/test-migrate"]),
  [
    ["SDK", sdk],
    ["migration", migrate],
  ],
)
  .then((status: number) => {
    process.exitCode = status;
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
