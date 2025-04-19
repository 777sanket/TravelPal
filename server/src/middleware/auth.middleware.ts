import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Add user to request type
declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
        // Add any other properties from your JWT payload
      };
    }
  }
}

// Define the JWT payload type
interface JwtPayload {
  userId: string;
  // Add any other properties from your JWT payload
}

export const authenticateToken: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(403).json({ message: "Invalid or expired token" });
    return;
  }
};
