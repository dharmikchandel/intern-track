import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoInput } from "../components/ui/NeoInput";
import { NeoButton } from "../components/ui/NeoButton";
import { type LoginFormData, loginSchema } from "../lib/schemas";
import { loginUser } from "../api/auth";
import { useAuth } from "../features/auth/AuthContext";
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
        onError: (error: any) => {
            setServerError(
                error.response?.data?.error || "Failed to login. Please try again."
            );
        },
    });

    const onSubmit = (data: LoginFormData) => {
        setServerError(null);
        mutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neo-bg p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tighter text-neo-primary drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        TRACKr.
                    </h1>
                    <p className="font-bold text-gray-600">Job Application Tracker</p>
                </div>

                <NeoCard>
                    <h2 className="text-2xl font-black mb-6 uppercase">Login</h2>

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

                        <NeoButton
                            type="submit"
                            className="w-full mt-2"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Logging in..." : "Login"}
                        </NeoButton>
                    </form>

                    <div className="mt-6 text-center text-sm font-bold">
                        Don't have an account?{" "}
                        <Link to="/register" className="underline hover:text-neo-secondary">
                            Register here
                        </Link>
                    </div>
                </NeoCard>
            </div>
        </div>
    );
}
