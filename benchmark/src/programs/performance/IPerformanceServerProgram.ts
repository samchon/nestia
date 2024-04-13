export interface IPerformanceServerProgram<T> {
  open(): Promise<number>;
  close(): Promise<void>;
}
