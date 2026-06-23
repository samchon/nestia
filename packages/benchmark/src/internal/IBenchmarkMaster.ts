export interface IBenchmarkMaster {
  filter: (file: string) => boolean;
  progress: (current: number) => void;
}
