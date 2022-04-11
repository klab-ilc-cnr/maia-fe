import { Language } from "./language";
import { Roles } from "./roles";

export class User {
  id: string | undefined;
  name: string | undefined;
  surname: string | undefined;
  email: string | undefined;
  role: Roles | undefined;
  active: boolean | undefined;
  languages: Language[] | undefined;
}
