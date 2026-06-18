import { SignJWT, jwtVerify } from 'jose';
import { HonoContext } from '../types/hono';
import { HTTPException } from 'hono/http-exception';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const signJwt = async (payload: object, expiresIn: string = '1d'): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
};

export const verifyJwt = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid or expired token.' });
  }
};

export const decodeJwt = async (c: HonoContext) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Authorization header missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];
  return await verifyJwt(token);
};