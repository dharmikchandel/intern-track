import { client } from "./client";
import { type CreateApplicationFormData } from "../lib/schemas";

export interface Application {
    id: string;
    userId: string;
    companyName: string;
    role: string;
    status: "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED";
    appliedDate: string;
    applicationLink?: string;
    notes?: string;
    followUpDate?: string;
    createdAt: string;
    updatedAt: string;
}

interface ListApplicationsParams {
    page?: number;
    limit?: number;
    status?: string;
    sort?: "appliedDate" | "createdAt";
    order?: "asc" | "desc";
}

interface ListApplicationsResponse {
    items: Application[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export async function listApplications(params?: ListApplicationsParams) {
    const res = await client.get<ListApplicationsResponse>("/applications", { params });
    return res.data;
}

export async function getApplication(id: string) {
    const res = await client.get<Application>(`/applications/${id}`);
    return res.data;
}

export async function createApplication(data: CreateApplicationFormData) {
    const res = await client.post<Application>("/applications", data);
    return res.data;
}

export async function updateApplication(id: string, data: Partial<CreateApplicationFormData>) {
    const res = await client.patch<Application>(`/applications/${id}`, data);
    return res.data;
}

export async function deleteApplication(id: string) {
    const res = await client.delete<{ success: true; message: string }>(`/applications/${id}`);
    return res.data;
}
