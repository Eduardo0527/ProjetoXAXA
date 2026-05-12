export interface User {
  id: string | number;
  username: string;
  email?: string; 
}

export interface LoginDto {
  username: string
  password: string
}

