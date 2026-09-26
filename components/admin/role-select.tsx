"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";
import { api, errorMessage } from "@/lib/api/client";
import type { UserRole } from "@/types/user";

export function RoleSelect({ userId, role, disabled }: { userId: string; role: UserRole; disabled?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <NativeSelect
        aria-label="Role"
        value={value}
        disabled={disabled || pending}
        className="w-36"
        onChange={(event) => {
          const next = event.target.value as UserRole;
          const previous = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            try {
              await api(`/api/admin/users/${userId}`, { method: "PATCH", body: { role: next } });
              router.refresh();
            } catch (e) {
              setValue(previous);
              setError(errorMessage(e));
            }
          });
        }}
      >
        <option value="student">Student</option>
        <option value="instructor">Instructor</option>
        <option value="admin">Admin</option>
      </NativeSelect>
      {error && <p className="max-w-36 text-xs text-destructive">{error}</p>}
    </div>
  );
}
