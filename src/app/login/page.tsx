"use client";

import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const data = await api.post<any>("/Auth/login", values);
      login(data.token);

      toast({
        title: "Welcome back! 👋",
        description: "You have successfully logged in.",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
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
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="flex min-h-screen sm:min-h-[100dvh] items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-4 py-8 overflow-y-auto">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
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
              <Wallet className="w-full h-full text-white" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-600 tracking-tight">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base text-gray-500 mt-2">
                Enter your credentials to access your account
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <motion.div variants={itemVariants} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign in
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="pb-8 flex flex-col gap-2">
            <motion.p variants={itemVariants} className="text-sm text-center w-full text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-700 hover:underline font-semibold transition-colors">
                Sign up
              </Link>
            </motion.p>
            <motion.p variants={itemVariants} className="text-sm text-center w-full text-gray-500">
              Need to activate?{" "}
              <Link href="/activate" className="text-indigo-600 hover:text-indigo-700 hover:underline font-semibold transition-colors">
                Verify Email
              </Link>
            </motion.p>
          </CardFooter>
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
/* aria-label */
