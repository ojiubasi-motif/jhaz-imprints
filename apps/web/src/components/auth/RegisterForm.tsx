"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, type RegisterData } from "@jhaz-imprints/shared";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerUser } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(RegisterSchema),
  });
  
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const onSubmit = async (data: RegisterData) => {
    const resultAction = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(resultAction)) {
      router.push("/");
    }
  };

  return (
    <div className="card max-w-md w-full mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Create an Account</h2>
      
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              className="input w-full"
              {...register("firstName")}
            />
            {errors.firstName && <p className="text-sm text-error mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              className="input w-full"
              {...register("lastName")}
            />
            {errors.lastName && <p className="text-sm text-error mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

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
          {isLoading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
      
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account? <Link href="/auth/login" className="text-primary font-medium hover:underline">Log in</Link>
      </p>
    </div>
  );
}
