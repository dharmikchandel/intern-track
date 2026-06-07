export declare function createApplication(userId: string, data: any): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    companyName: string;
    role: string;
    status: import("@prisma/client").$Enums.ApplicationStatus;
    appliedDate: Date;
    applicationLink: string | null;
    notes: string | null;
    followUpDate: Date | null;
}>;
export declare function getApplicationById(userId: string, id: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    companyName: string;
    role: string;
    status: import("@prisma/client").$Enums.ApplicationStatus;
    appliedDate: Date;
    applicationLink: string | null;
    notes: string | null;
    followUpDate: Date | null;
}>;
export declare function updateApplication(userId: string, id: string, data: any): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    companyName: string;
    role: string;
    status: import("@prisma/client").$Enums.ApplicationStatus;
    appliedDate: Date;
    applicationLink: string | null;
    notes: string | null;
    followUpDate: Date | null;
}>;
export declare function deleteApplication(userId: string, id: string): Promise<{
    success: boolean;
}>;
export declare function listApplications(userId: string, query: {
    status?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    order?: string | undefined;
}): Promise<{
    items: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyName: string;
        role: string;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        appliedDate: Date;
        applicationLink: string | null;
        notes: string | null;
        followUpDate: Date | null;
    }[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}>;
//# sourceMappingURL=application.service.d.ts.map