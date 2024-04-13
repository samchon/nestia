import { createPerformanceBenchmarkProgram } from "../createPerformanceBenchmarkProgram";

createPerformanceBenchmarkProgram(
  __dirname +
    "/../servers/Fastify/benchmark-performance-Fastify-ObjectUnionExplicit" +
    __filename.substr(-3),
);
