import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoInput } from "../components/ui/NeoInput";
import { NeoButton } from "../components/ui/NeoButton";
import { DotGrid } from "../components/ui/DotGrid";
import { type RegisterFormData, registerSchema } from "../lib/schemas";
import { registerUser } from "../api/auth";
import { useAuth } from "../features/auth/AuthContext";
import { useState } from "react";

export function RegisterPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const mutation = useMutation({
        mutationFn: registerUser,
        onSuccess: (data) => {
            login(data.accessToken, data.user);
            navigate("/dashboard");
        },
        onError: (error: any) => {
            setServerError(
                error.response?.data?.error || "Failed to register. Please try again."
            );
        },
    });

    const onSubmit = (data: RegisterFormData) => {
        setServerError(null);
        mutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neo-bg p-4 relative overflow-hidden">
            <DotGrid />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tighter text-neo-secondary drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        TRACKr.
                    </h1>
                    <p className="font-bold text-gray-600">Join the revolution</p>
                </div>

                <NeoCard>
                    <h2 className="text-2xl font-black mb-6 uppercase">Register</h2>

                    {serverError && (
                        <div className="bg-neo-destructive text-white font-bold p-3 mb-4 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <NeoInput
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            error={errors.email?.message}
                            {...register("email")}
                        />
                        <NeoInput
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register("password")}
                        />
                        <NeoInput
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            error={errors.confirmPassword?.message}
                            {...register("confirmPassword")}
                        />

                        <NeoButton
                            type="submit"
                            variant="secondary"
                            className="w-full mt-2"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Creating Account..." : "Register"}
                        </NeoButton>
                    </form>

                    <div className="mt-6 text-center text-sm font-bold">
                        Already have an account?{" "}
                        <Link to="/login" className="underline hover:text-neo-primary">
                            Login here
                        </Link>
                    </div>
                </NeoCard>
            </motion.div>
        </div>
    );
}
