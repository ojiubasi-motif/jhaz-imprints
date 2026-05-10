import { LoginForm } from "@/components/auth/LoginForm";
import { useAppSelector } from "@/store/hooks";
import { Navigate } from "react-router-dom";

export function LoginPage() {
  const { token } = useAppSelector((state) => state.auth);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}
