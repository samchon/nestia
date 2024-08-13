import type { IPoint } from "./IPoint";

export type IPolyline = {
  points: IPoint[];
  length?: null | undefined | number;
};
