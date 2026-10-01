export interface IStatisticsCalculatorWebsocket {
  mean(...values: number[]): number;
  stdev(...values: number[]): number;
}
