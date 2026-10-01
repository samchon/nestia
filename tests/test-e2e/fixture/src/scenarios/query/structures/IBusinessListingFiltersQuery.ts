import { tags } from "typia";

export interface IBusinessListingFiltersQuery {
  sellingType?: IBusinessListingFiltersQuery.SellingTypeQuery[] &
    tags.MinItems<1>;
}

export namespace IBusinessListingFiltersQuery {
  export type SellingTypeQuery = "COMPANY" | "KENNITALA";
}
