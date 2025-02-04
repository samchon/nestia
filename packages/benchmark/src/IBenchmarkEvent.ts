import { IFetchRoute } from "@nestia/fetcher";

export interface IBenchmarkEvent {
  metadata: IFetchRoute<any>;
  status: number | null;
  started_at: string;
  respond_at: string | null;
  completed_at: string;
  success: boolean;
}
