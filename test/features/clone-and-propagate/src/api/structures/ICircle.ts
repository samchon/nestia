import type { IPoint } from "./IPoint";

export type ICircle = {
  centroid?: undefined | IPoint;
  radius: number;
  area?: null | undefined | number;
};
