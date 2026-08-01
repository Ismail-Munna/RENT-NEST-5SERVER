import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const createToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: string
) => {
  const token = jwt.sign(payload, secret, {
    expiresIn:expiresIn as any,
  });

  return token;
};

const verifyToken = (token: string, secret: string) => {
  try {
    const verifiedToken = jwt.verify(token, secret);
    return {
      success: true,
      data: verifiedToken,
    };
  } catch (error: any) {
    console.log("Token verification failed:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

export const jwtUtils = {
  createToken,
  verifyToken,
};