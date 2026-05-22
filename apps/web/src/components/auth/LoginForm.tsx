"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginData } from "@jhaz-imprints/shared";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser, clearError } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// Import clearCreateError if it exists, otherwise we'll need to add it
// For now, let's use a different approach - directly setting error to null through reducers

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(LoginSchema),
  });
  
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const router = useRouter();

  // Clear error on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = async (data: LoginData) => {
    const resultAction = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(resultAction)) {
      router.push("/");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="flex justify-center mb-8">
        <Link href="/">
          <Image
            src="/logo/jhazImprntLogo.png"
            alt="Jhaz-imprints"
            width={180}
            height={45}
            className="h-12 w-auto"
            priority
          />
        </Link>
      </div>

      <div className="card p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">Welcome Back</h2>
      
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input w-full"
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-error mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input w-full"
            {...register("password")}
          />
          {errors.password && <p className="text-sm text-error mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-2"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      
      <p className="mt-4 text-center text-sm text-muted">
        Don't have an account? <Link href="/auth/register" className="text-primary font-medium hover:underline">Register here</Link>
      </p>
      </div>
    </div>
  );
}
