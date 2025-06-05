import type { IPoint3D } from "./IPoint3D";

export type IBox3D = {
  scale: IPoint3D;
  position: IPoint3D;
  rotate: IPoint3D;
  pivot: IPoint3D;
};
