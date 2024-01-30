import type { DiscriminatorcircleICircle } from "./DiscriminatorcircleICircle";
import type { DiscriminatorlineILine } from "./DiscriminatorlineILine";
import type { DiscriminatorpointIPoint } from "./DiscriminatorpointIPoint";
import type { DiscriminatorpolygonIPolygon } from "./DiscriminatorpolygonIPolygon";
import type { DiscriminatorpolylineIPolyline } from "./DiscriminatorpolylineIPolyline";
import type { DiscriminatorrectangleIRectangle } from "./DiscriminatorrectangleIRectangle";
import type { DiscriminatortriangleITriangle } from "./DiscriminatortriangleITriangle";

export type ObjectUnionExplicit = (
  | DiscriminatorpointIPoint
  | DiscriminatorlineILine
  | DiscriminatortriangleITriangle
  | DiscriminatorrectangleIRectangle
  | DiscriminatorpolylineIPolyline
  | DiscriminatorpolygonIPolygon
  | DiscriminatorcircleICircle
)[];
