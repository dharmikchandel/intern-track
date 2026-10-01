import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoInput } from "../components/ui/NeoInput";
import { NeoButton } from "../components/ui/NeoButton";
import { NeoAlert } from "../components/ui/NeoAlert";
import { type RegisterFormData, registerSchema } from "../lib/schemas";
import { registerUser } from "../api/auth";
import { useAuth } from "../features/auth/useAuth";
import { getErrorMessage } from "../lib/utils";
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
        onError: (error) => {
            setServerError(getErrorMessage(error, "Failed to register. Please try again."));
        },
    });

    const onSubmit = (data: RegisterFormData) => {
        setServerError(null);
        mutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neo-bg p-4 relative overflow-hidden">

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="text-4xl font-black tracking-tighter text-neo-primary drop-shadow-neo-sm">
                        TRACKr.
                    </div>
                    <p className="font-bold text-slate-600">Start tracking your job hunt</p>
                </div>

                <NeoCard>
                    <h1 className="text-2xl font-black mb-6 uppercase">Create account</h1>

                    {serverError && (
                        <NeoAlert className="mb-4">
                            {serverError}
                        </NeoAlert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <NeoInput
                            label="Email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            error={errors.email?.message}
                            {...register("email")}
                        />
                        <NeoInput
                            label="Password"
                            hint="At least 8 characters."
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register("password")}
                        />
                        <NeoInput
                            label="Confirm Password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            error={errors.confirmPassword?.message}
                            {...register("confirmPassword")}
                        />

                        <NeoButton
                            type="submit"
                            className="w-full mt-2"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Creating account..." : "Create account"}
                        </NeoButton>
                    </form>

                    <div className="mt-6 text-center text-sm font-bold">
                        Already have an account?{" "}
                        <Link to="/login" className="underline hover:bg-neo-primary hover:text-black">
                            Sign in
                        </Link>
                    </div>
                </NeoCard>
            </motion.div>
        </div>
    );
}
