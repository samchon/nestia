import { createPerformanceBenchmarkProgram } from "../createPerformanceBenchmarkProgram";

createPerformanceBenchmarkProgram(
  __dirname +
    "/../servers/nestia-express/benchmark-performance-nestia-express-ObjectSimple" +
    __filename.substr(-3),
);
