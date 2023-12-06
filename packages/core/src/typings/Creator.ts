export type Creator<T extends object> = {
  new (...args: any[]): T;
};
