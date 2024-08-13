import type { IPoint } from "./IPoint";

export type ILine = {
  p1: IPoint;
  p2: IPoint;
  width?: null | undefined | number;
  distance?: null | undefined | number;
};
