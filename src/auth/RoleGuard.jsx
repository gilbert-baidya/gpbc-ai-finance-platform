import { useAuth } from "./AuthContext";

export default function RoleGuard({ roles = [], children, fallback = null }) {

  const { user } = useAuth();

  if (!user) return fallback;

  if (!roles.includes(user.role)) {
    return fallback;
  }

  return children;
}
