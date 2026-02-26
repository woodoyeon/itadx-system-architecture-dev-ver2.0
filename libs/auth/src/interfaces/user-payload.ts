export interface UserPayload {
  sub: string;
  email: string;
  role: 'bank' | 'mart' | 'admin';
  martId: string | null;
}

export interface JwtPayload extends UserPayload {
  iat: number;
  exp: number;
}
