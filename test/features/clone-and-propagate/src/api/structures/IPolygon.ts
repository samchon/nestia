import type { IPolyline } from "./IPolyline";

export type IPolygon = {
  outer: IPolyline.o1;
  inner?: undefined | IPolyline.o1[];
  area?: null | undefined | number;
};
