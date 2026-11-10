import { useAccount } from "@/components/plan-provider";

export function useAuth() {
  const { user, ready } = useAccount();
  return { user, ready };
}
