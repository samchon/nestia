import { createPerformanceBenchmarkProgram } from "../createPerformanceBenchmarkProgram";

createPerformanceBenchmarkProgram(
  __dirname +
    "/../servers/nestia-fastify/benchmark-performance-nestia-fastify-ObjectSimple" +
    __filename.substr(-3),
);
