import type { IPoint } from "./IPoint";

export type ICircle = {
  centroid?: undefined | IPoint.o1;
  radius: number;
  area?: null | undefined | number;
};
