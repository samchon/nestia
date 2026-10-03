export interface ISocketStatisticsCalculator {
  mean(...values: number[]): number;
  stdev(...values: number[]): number;
}
