export interface IAssertServerProgram<T> {
  open(): Promise<number>;
  close(): Promise<void>;
}
