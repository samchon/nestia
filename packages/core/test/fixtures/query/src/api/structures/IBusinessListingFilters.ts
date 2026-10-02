import { tags } from "typia";

export interface IBusinessListingFilters {
  sellingType?: IBusinessListingFilters.SellingType[] & tags.MinItems<1>;
}

export namespace IBusinessListingFilters {
  export type SellingType = "COMPANY" | "KENNITALA";
}
