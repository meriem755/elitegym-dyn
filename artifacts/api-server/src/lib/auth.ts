import jwt from "jsonwebtoken";

const SECRET = process.env["JWT_SECRET"] || "elitegym_secret_key_2026";

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as jwt.JwtPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"] as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Token invalide" });
  }
  req.user = payload;
  next();
}
