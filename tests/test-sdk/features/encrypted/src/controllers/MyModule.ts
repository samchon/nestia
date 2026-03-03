import { EncryptedModule } from "@nestia/core";

import { MonitorModule } from "./monitors/MonitorModule";
import { SellerModule } from "./sellers/SellerModule";

@EncryptedModule(
  {
    imports: [MonitorModule, SellerModule],
  },
  () => ({
    key: "A".repeat(32),
    iv: "B".repeat(16),
  }),
)
export class MyModule {}
