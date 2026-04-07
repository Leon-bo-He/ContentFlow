export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  locale: string;
  timezone: string;
  createdAt: Date;
}
