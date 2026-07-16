export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: Date;
  createdAt: Date;
}
