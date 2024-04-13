import { createStringifyBenchmarkProgram } from "../createStringifyBenchmarkProgram";

createStringifyBenchmarkProgram(
  __dirname +
    "/../servers/fastify/benchmark-stringify-fastify-ObjectHierarchical" +
    __filename.substr(-3),
);
