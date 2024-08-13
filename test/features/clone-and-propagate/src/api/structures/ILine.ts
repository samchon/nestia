import type { IPoint } from "./IPoint";

export type ILine = {
  p1: IPoint.o1;
  p2: IPoint.o1;
  width?: null | undefined | number;
  distance?: null | undefined | number;
};
