import { verifyAccessToken } from "../utils/jwt.js";
export function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing token" });
    }
    const token = auth.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    try {
        const decoded = verifyAccessToken(token);
        req.userId = decoded.userId;
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid/expired token" });
    }
}
//# sourceMappingURL=auth.middleware.js.map