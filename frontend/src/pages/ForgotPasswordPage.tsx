import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoInput } from "../components/ui/NeoInput";
import { NeoButton } from "../components/ui/NeoButton";
import { DotGrid } from "../components/ui/DotGrid";
import { type ForgotPasswordFormData, forgotPasswordSchema } from "../lib/schemas";
import { requestPasswordReset } from "../api/auth";
import { getErrorMessage } from "../lib/utils";
import { useState } from "react";

export function ForgotPasswordPage() {
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const mutation = useMutation({
        mutationFn: (data: ForgotPasswordFormData) => requestPasswordReset(data.email),
        onError: (error) => {
            setServerError(getErrorMessage(error, "Something went wrong. Please try again."));
        },
    });

    const onSubmit = (data: ForgotPasswordFormData) => {
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
                    <p className="font-bold text-gray-600">Reset your password</p>
                </div>

                <NeoCard>
                    <h2 className="text-2xl font-black mb-6 uppercase">Forgot Password</h2>

                    {serverError && (
                        <div className="bg-neo-destructive text-white font-bold p-3 mb-4 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                            {serverError}
                        </div>
                    )}

                    {mutation.isSuccess ? (
                        <div className="bg-green-100 border-2 border-black p-4 font-bold text-slate-800">
                            If that email is registered, a reset link is on its way. Check your inbox.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <p className="text-sm font-bold text-gray-600">
                                Enter the email on your account and we'll send you a link to reset your password.
                            </p>
                            <NeoInput
                                label="Email"
                                type="email"
                                placeholder="you@example.com"
                                error={errors.email?.message}
                                {...register("email")}
                            />

                            <NeoButton
                                type="submit"
                                className="w-full mt-2"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? "Sending..." : "Send Reset Link"}
                            </NeoButton>
                        </form>
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
