export interface IStatisticsCalculator {
  mean(...values: number[]): number;
  stdev(...values: number[]): number;
}
