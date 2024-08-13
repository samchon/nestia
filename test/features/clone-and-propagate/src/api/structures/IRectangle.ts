import type { IPoint } from "./IPoint";

export type IRectangle = {
  p1: IPoint;
  p2: IPoint;
  p3: IPoint;
  p4: IPoint;
  width?: null | undefined | number;
  height?: null | undefined | number;
  area?: null | undefined | number;
};
