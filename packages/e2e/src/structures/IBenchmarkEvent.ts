import { IFetchRoute } from "@nestia/fetcher";

export interface IBenchmarkEvent {
  metadata: IFetchRoute<any>;
  status: number | null;
  started_at: string;
  repond_at: string | null;
  completed_at: string;
  success: boolean;
}
