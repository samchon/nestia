import { tags } from "typia";

export interface IQueryFieldsBusinessListingFilters {
  sellingType?: IQueryFieldsBusinessListingFilters.SellingType[] &
    tags.MinItems<1>;
}

export namespace IQueryFieldsBusinessListingFilters {
  export type SellingType = "COMPANY" | "KENNITALA";
}
