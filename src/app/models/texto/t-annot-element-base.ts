import { TStatus } from "./t-status";

export class TAnnotElementBase {
  id: number | undefined;
  status: TStatus | undefined;
  time: string | undefined;
  name: string | undefined;
  description: string | undefined;
}
