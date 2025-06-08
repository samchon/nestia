import type { IPoint } from "./IPoint";

export type IRectangle = {
  p1: IPoint.o1;
  p2: IPoint.o1;
  p3: IPoint.o1;
  p4: IPoint.o1;
  width?: null | undefined | number;
  height?: null | undefined | number;
  area?: null | undefined | number;
};
