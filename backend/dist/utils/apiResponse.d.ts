export declare function success<T>(data: T, message?: string): {
    success: boolean;
    message: string;
    data: T;
};
export declare function failure(message: string, code?: string): {
    success: boolean;
    message: string;
    code: string;
};
//# sourceMappingURL=apiResponse.d.ts.map