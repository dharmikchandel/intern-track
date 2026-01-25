import { z } from "zod";

export const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// Application Schemas
export const createApplicationSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    role: z.string().min(1, "Role is required"),
    status: z.enum(["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"]),
    appliedDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date",
    }),
    applicationLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    notes: z.string().optional(),
    followUpDate: z.string().optional().or(z.literal("")),
});

export type CreateApplicationFormData = z.infer<typeof createApplicationSchema>;
