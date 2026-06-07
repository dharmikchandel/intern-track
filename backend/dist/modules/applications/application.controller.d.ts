import type { Request, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
type Params = {
    id: string;
};
export declare function create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getById(req: AuthRequest & Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function update(req: AuthRequest & Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function remove(req: AuthRequest & Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function list(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=application.controller.d.ts.map