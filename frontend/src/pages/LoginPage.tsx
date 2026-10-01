import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoInput } from "../components/ui/NeoInput";
import { NeoButton } from "../components/ui/NeoButton";
import { NeoAlert } from "../components/ui/NeoAlert";
import { type LoginFormData, loginSchema } from "../lib/schemas";
import { loginUser } from "../api/auth";
import { useAuth } from "../features/auth/useAuth";
import { getErrorMessage } from "../lib/utils";
import { useState } from "react";

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [serverError, setServerError] = useState<string | null>(null);

    const from = location.state?.from?.pathname || "/dashboard";

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            login(data.accessToken, data.user);
            navigate(from, { replace: true });
        },
        onError: (error) => {
            setServerError(getErrorMessage(error, "Failed to login. Please try again."));
        },
    });

    const onSubmit = (data: LoginFormData) => {
        setServerError(null);
        mutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neo-bg p-4 relative overflow-hidden">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="text-4xl font-black tracking-tighter text-neo-primary drop-shadow-neo-sm">
                        TRACKr.
                    </div>
                    <p className="font-bold text-slate-600">Job Application Tracker</p>
                </div>

                <NeoCard>
                    <h1 className="text-2xl font-black mb-6 uppercase">Sign in</h1>

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
                        <div>
                            <NeoInput
                                label="Password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                error={errors.password?.message}
                                {...register("password")}
                            />
                            <div className="text-right mt-1">
                                <Link to="/forgot-password" className="inline-flex items-center min-h-11 text-sm font-bold ui-link">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <NeoButton
                            type="submit"
                            className="w-full mt-2"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Signing in..." : "Sign in"}
                        </NeoButton>
                    </form>

                    <div className="mt-6 text-center text-sm font-bold">
                        Don't have an account?{" "}
                        <Link to="/register" className="ui-link">
                            Create one
                        </Link>
                    </div>
                </NeoCard>
            </motion.div>
        </div>
    );
}
