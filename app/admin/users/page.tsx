import { Search, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DisableUserButton } from "@/components/admin/disable-user-button";
import { RoleSelect } from "@/components/admin/role-select";
import { Pagination } from "@/components/layout/pagination";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { parsePage } from "@/lib/api/response";
import { requirePageRole } from "@/lib/auth/requireRole";
import { disabledUserIds, listUsers } from "@/lib/data/admin";
import { adminConfigured } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";
import type { UserRole } from "@/types/user";

export const metadata = { title: "Users · Admin" };

const roles: UserRole[] = ["student", "instructor", "admin"];

export default async function AdminUsersPage(props: PageProps<"/admin/users">) {
  const { supabase, profile } = await requirePageRole("admin");
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.slice(0, 80) : undefined;
  const role = roles.find((r) => r === searchParams.role);
  const range = parsePage(searchParams, 20);
  const { rows, total } = await listUsers(supabase, { q, role }, range);
  const canDisable = adminConfigured();
  const disabled = canDisable ? await disabledUserIds(rows.map((user) => user.id)) : new Set<string>();

  return (
    <>
      <PageHeader eyebrow="Admin" title="Users" />
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
        Change a role to make someone an instructor or admin. Disabling an account stops that person signing in; their data stays.
      </p>

      <form action="/admin/users" className="mt-6 mb-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" type="search" defaultValue={q} placeholder="Search name or email" aria-label="Search users" className="h-10 pl-9" />
        </div>
        <NativeSelect name="role" defaultValue={role ?? ""} aria-label="Filter by role" className="sm:w-40">
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r} value={r} className="capitalize">
              {r[0].toUpperCase() + r.slice(1)}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline" className="h-10 px-4">
          Filter
        </Button>
      </form>

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                {canDisable && <th className="px-4 py-2.5 text-right font-medium">Account</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.full_name ?? user.email} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {user.full_name ?? "—"} {user.id === profile.id && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                          {disabled.has(user.id) && (
                            <span className="ml-2 rounded-full bg-red-100 px-1.5 py-px text-[11px] font-medium text-red-900 dark:bg-red-950 dark:text-red-200">
                              Disabled
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <RoleSelect userId={user.id} role={user.role} disabled={user.id === profile.id} />
                  </td>
                  {canDisable && (
                    <td className="px-4 py-3 text-right">
                      {user.id !== profile.id && <DisableUserButton userId={user.id} disabled={disabled.has(user.id)} />}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Users} title="No users found">
          Try a different search.
        </EmptyState>
      )}

      <Pagination meta={{ page: range.page, per_page: range.perPage, total }} basePath="/admin/users" params={{ q, role }} />
    </>
  );
}
