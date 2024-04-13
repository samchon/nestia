import { createPerformanceBenchmarkProgram } from "../createPerformanceBenchmarkProgram";

createPerformanceBenchmarkProgram(
  __dirname +
    "/../servers/Fastify/benchmark-performance-Fastify-ObjectSimple" +
    __filename.substr(-3),
);
