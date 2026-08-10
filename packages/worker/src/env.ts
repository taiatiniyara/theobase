import { ChurchDO } from './church-do';

export interface Env {
  CHURCH_DO: DurableObjectNamespace<ChurchDO>;
}
