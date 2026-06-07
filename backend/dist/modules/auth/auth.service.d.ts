export declare function registerUser(email: string, password: string): Promise<{
    user: {
        email: string;
        id: string;
        createdAt: Date;
    };
    accessToken: string;
    refreshToken: string;
}>;
export declare function loginUser(email: string, password: string): Promise<{
    user: {
        id: string;
        email: string;
        createdAt: Date;
    };
    accessToken: string;
    refreshToken: string;
}>;
//# sourceMappingURL=auth.service.d.ts.map