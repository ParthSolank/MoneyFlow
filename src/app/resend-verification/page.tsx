"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const resendSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
});

function ResendVerificationForm() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");

    const form = useForm<z.infer<typeof resendSchema>>({
        resolver: zodResolver(resendSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(values: z.infer<typeof resendSchema>) {
        setIsLoading(true);
        try {
            await api.post<{ message: string }>("/auth/resend-activation-email", values);

            setSuccess(true);
            setSubmittedEmail(values.email);
            toast({
                title: "Email Sent! 📧",
                description: "Check your email for the activation link.",
                className: "bg-green-50 border-green-200 text-green-900",
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to send email",
                description: error.message || "Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    if (success) {
        return (
            <div className="flex min-h-screen sm:min-h-[100dvh] items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-4 py-8">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="w-full max-w-md"
                >
                    <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-xl bg-white/80 relative z-10 ring-1 ring-gray-100">
                        <CardHeader className="space-y-2 text-center pb-8 pt-8">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 mx-auto p-3.5 rounded-2xl shadow-lg mb-4 flex items-center justify-center"
                            >
                                <CheckCircle className="w-full h-full text-white" />
                            </motion.div>
                            <CardTitle className="text-3xl font-bold text-green-600">Check Your Email</CardTitle>
                            <CardDescription className="text-base text-gray-500 mt-2">
                                We sent an activation link to:
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <p className="text-sm font-medium text-gray-900 break-all">{submittedEmail}</p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm text-gray-600 text-center">
                                    Click the link in the email to activate your account. If you don't see it, check your spam folder.
                                </p>

                                <div className="pt-4 space-y-3">
                                    <Link href="/activate" className="block">
                                        <Button
                                            variant="outline"
                                            className="w-full h-11 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                        >
                                            Have an activation key?
                                        </Button>
                                    </Link>

                                    <Link href="/login" className="block">
                                        <Button
                                            className="w-full h-11 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white"
                                        >
                                            Go to Login
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen sm:min-h-[100dvh] items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-4 py-8 overflow-y-auto">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-md relative"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-500 rounded-2xl blur-3xl opacity-20 transform scale-105" />

                <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-xl bg-white/80 relative z-10 ring-1 ring-gray-100">
                    <CardHeader className="space-y-2 text-center pb-8 pt-8">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                            className="bg-gradient-to-br from-indigo-500 to-emerald-600 w-16 h-16 mx-auto p-3.5 rounded-2xl shadow-lg mb-4 flex items-center justify-center"
                        >
                            <Mail className="w-full h-full text-white" />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-600 tracking-tight">
                                Resend Activation
                            </CardTitle>
                            <CardDescription className="text-base text-gray-500 mt-2">
                                We'll send you a new activation link.
                            </CardDescription>
                        </motion.div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <motion.div variants={itemVariants}>
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="name@example.com"
                                                        className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
                                                        aria-label="Email address for resending activation"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </motion.div>

                                <motion.div variants={itemVariants} className="pt-2 space-y-3">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-11 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-medium text-base shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="w-5 h-5 mr-2" />
                                                Send Activation Link
                                            </>
                                        )}
                                    </Button>

                                    <Link href="/activate">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full h-11 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Have an activation key?
                                        </Button>
                                    </Link>
                                </motion.div>
                            </form>
                        </Form>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">or</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{" "}
                                <Link
                                    href="/register"
                                    className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                >
                                    Sign up here
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Floating Watermark */}
            <div className="fixed bottom-6 right-6 pointer-events-none z-50 opacity-20 hover:opacity-100 transition-opacity duration-500 hidden sm:block">
                <div className="bg-white/40 shadow-sm backdrop-blur-[2px] border border-gray-200/50 px-3 py-1.5 rounded-full flex items-center gap-2 ring-1 ring-black/5">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-600 flex items-center justify-center text-[8px] text-white font-black shadow-sm">
                        P
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">
                        Crafted By <span className="text-indigo-600/50">Parth Solanki</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function ResendVerificationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
            <ResendVerificationForm />
        </Suspense>
    );
}
