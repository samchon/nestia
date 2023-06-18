import { createPerformanceBenchmarkProgram } from "../createPerformanceBenchmarkProgram";

createPerformanceBenchmarkProgram(
    __dirname + "/../servers/fastify/benchmark-performance-fastify-ObjectSimple" + __filename.substr(-3)
);