import type { IPolyline } from "./IPolyline";

export type IPolygon = {
  outer: IPolyline;
  inner?: undefined | IPolyline[];
  area?: null | undefined | number;
};
