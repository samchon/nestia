export interface IBenchmarkMaster {
  filter: (name: string) => boolean;
  progress: (current: number) => void;
}
