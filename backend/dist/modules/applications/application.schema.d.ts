import { z } from "zod";
export declare const applicationStatusEnum: z.ZodEnum<{
    APPLIED: "APPLIED";
    OA: "OA";
    INTERVIEW: "INTERVIEW";
    OFFER: "OFFER";
    REJECTED: "REJECTED";
}>;
export declare const createApplicationSchema: z.ZodObject<{
    companyName: z.ZodString;
    role: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<{
        APPLIED: "APPLIED";
        OA: "OA";
        INTERVIEW: "INTERVIEW";
        OFFER: "OFFER";
        REJECTED: "REJECTED";
    }>>;
    appliedDate: z.ZodISODateTime;
    applicationLink: z.ZodOptional<z.ZodURL>;
    notes: z.ZodOptional<z.ZodString>;
    followUpDate: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
export declare const updateApplicationSchema: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        APPLIED: "APPLIED";
        OA: "OA";
        INTERVIEW: "INTERVIEW";
        OFFER: "OFFER";
        REJECTED: "REJECTED";
    }>>;
    appliedDate: z.ZodOptional<z.ZodISODateTime>;
    applicationLink: z.ZodNullable<z.ZodOptional<z.ZodURL>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    followUpDate: z.ZodNullable<z.ZodOptional<z.ZodISODateTime>>;
}, z.core.$strip>;
export declare const listApplicationsQuerySchema: z.ZodPipe<z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        APPLIED: "APPLIED";
        OA: "OA";
        INTERVIEW: "INTERVIEW";
        OFFER: "OFFER";
        REJECTED: "REJECTED";
    }>>;
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    sort: z.ZodOptional<z.ZodEnum<{
        createdAt: "createdAt";
        appliedDate: "appliedDate";
    }>>;
    order: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        APPLIED: "APPLIED";
        OA: "OA";
        INTERVIEW: "INTERVIEW";
        OFFER: "OFFER";
        REJECTED: "REJECTED";
    }>>;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodEnum<{
        createdAt: "createdAt";
        appliedDate: "appliedDate";
    }>>;
    order: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>>;
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
//# sourceMappingURL=application.schema.d.ts.map