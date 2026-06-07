import type { Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
export declare function statusCounts(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function funnel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=analytics.controller.d.ts.map