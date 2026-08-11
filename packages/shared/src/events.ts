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
  | 'member:state-change'
  | 'household:create'
  | 'household:update'
  | 'household:delete'
  | 'giving_batch:create'
  | 'giving_batch:update'
  | 'giving_batch:commit'
  | 'giving_batch:deposit'
  | 'giving_batch:counter2-confirm'
  | 'giving_batch:reconcile'
  | 'giving_record:create'
  | 'giving_record:delete'
  | 'church:create'
  | 'church:update'
  | 'role:assign'
  | 'role:revoke'
  | 'transfer:initiate'
  | 'transfer:accept'
  | 'transfer:reject'
  | 'household:suggestions'
  | 'contact:update-request'
  | 'contact:approve'
  | 'contact:reject'
  | 'visitor:follow-up';

export type ChurchEventTyped = ChurchEvent<ChurchOperation>;

export interface MemberStateChangePayload {
  memberId: string;
  prevState: string;
  newState: string;
  reason?: string;
}

export interface TransferPayload {
  memberId: string;
  fromChurchId: string;
  toChurchId: string;
  reason?: string;
}

export interface VisitorFollowUpPayload {
  churchId: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
}
