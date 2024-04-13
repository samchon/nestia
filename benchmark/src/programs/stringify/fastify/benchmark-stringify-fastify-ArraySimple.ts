import { createStringifyBenchmarkProgram } from "../createStringifyBenchmarkProgram";

createStringifyBenchmarkProgram(
  __dirname +
    "/../servers/fastify/benchmark-stringify-fastify-ArraySimple" +
    __filename.substr(-3),
);
