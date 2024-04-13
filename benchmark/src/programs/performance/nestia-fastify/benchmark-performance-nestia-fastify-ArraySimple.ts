import { createPerformanceBenchmarkProgram } from "../createPerformanceBenchmarkProgram";

createPerformanceBenchmarkProgram(
  __dirname +
    "/../servers/nestia-fastify/benchmark-performance-nestia-fastify-ArraySimple" +
    __filename.substr(-3),
);
