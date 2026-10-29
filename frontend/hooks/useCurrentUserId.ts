import { useEffect, useState } from "react";
import { UserService } from "@/services/user.service";

export function useCurrentUserId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    UserService.getMyId()
      .then((value) => !cancelled && setId(value))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return id;
}
