export interface Church {
  id: string;
  name: string;
  type: "local" | "conference" | "union" | "division" | "world";
  parentId?: string;
}

export interface Member {
  id: string;
  churchId: string;
  name: string;
  email?: string;
}
