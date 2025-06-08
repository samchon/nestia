import type { IPolyline } from "./IPolyline";

export type DiscriminatorpolygonIPolygon = {
  outer: IPolyline;
  inner: IPolyline[];
  type: "polygon";
};
