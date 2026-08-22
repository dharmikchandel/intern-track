import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoInput } from "../components/ui/NeoInput";
import { NeoButton } from "../components/ui/NeoButton";
import { DotGrid } from "../components/ui/DotGrid";
import { type ResetPasswordFormData, resetPasswordSchema } from "../lib/schemas";
import { confirmPasswordReset } from "../api/auth";
import { getErrorMessage } from "../lib/utils";
import { useState } from "react";

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const mutation = useMutation({
        mutationFn: (data: ResetPasswordFormData) => confirmPasswordReset(token!, data.password),
        onSuccess: () => {
            navigate("/login", { replace: true, state: { passwordReset: true } });
        },
        onError: (error) => {
            setServerError(getErrorMessage(error, "That reset link is invalid or has expired."));
        },
    });

    const onSubmit = (data: ResetPasswordFormData) => {
        setServerError(null);
        mutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neo-bg p-4 relative overflow-hidden">
            <DotGrid />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tighter text-neo-primary drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        TRACKr.
                    </h1>
                    <p className="font-bold text-gray-600">Choose a new password</p>
                </div>

                <NeoCard>
                    <h2 className="text-2xl font-black mb-6 uppercase">Reset Password</h2>

                    {!token ? (
                        <div className="bg-neo-destructive text-white font-bold p-3 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                            This link is missing its reset token. Request a new one from the{" "}
                            <Link to="/forgot-password" className="underline">
                                forgot password page
                            </Link>
                            .
                        </div>
                    ) : (
                        <>
                            {serverError && (
                                <div className="bg-neo-destructive text-white font-bold p-3 mb-4 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                                    {serverError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <NeoInput
                                    label="New Password"
                                    type="password"
                                    placeholder="••••••••"
                                    error={errors.password?.message}
                                    {...register("password")}
                                />
                                <NeoInput
                                    label="Confirm New Password"
                                    type="password"
                                    placeholder="••••••••"
                                    error={errors.confirmPassword?.message}
                                    {...register("confirmPassword")}
                                />

                                <NeoButton
                                    type="submit"
                                    className="w-full mt-2"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? "Updating..." : "Reset Password"}
                                </NeoButton>
                            </form>
                        </>
                    )}

                    <div className="mt-6 text-center text-sm font-bold">
                        <Link to="/login" className="underline hover:text-neo-primary">
                            Back to login
                        </Link>
                    </div>
                </NeoCard>
            </motion.div>
        </div>
    );
}
