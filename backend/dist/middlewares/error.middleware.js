import { AppError } from "../utils/AppError.js";
export function errorHandler(err, _req, res, _next) {
    console.error("❌ ERROR:", err);
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
        });
    }
    return res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "INTERNAL_ERROR",
    });
}
//# sourceMappingURL=error.middleware.js.map