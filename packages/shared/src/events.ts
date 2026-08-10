export interface ChurchEvent<Op extends string = string> {
  id: string;
  operation: Op;
  payload: unknown;
  actor: string;
  timestamp: number;
  prevHash: string;
  hash: string;
}

export type ChurchOperation =
  | 'member:create'
  | 'member:update'
  | 'member:delete'
  | 'household:create'
  | 'household:update'
  | 'household:delete'
  | 'giving_batch:create'
  | 'giving_batch:update'
  | 'giving_batch:commit'
  | 'giving_record:create'
  | 'giving_record:delete'
  | 'church:create'
  | 'church:update'
  | 'role:assign'
  | 'role:revoke';

export type ChurchEventTyped = ChurchEvent<ChurchOperation>;
