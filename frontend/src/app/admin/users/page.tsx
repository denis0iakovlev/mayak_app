"use client";
import UpDownCollapse from "@/components/ui/custom/UpDownCollaps";
import { AdminUserTable } from "@/features/admin/user/component/AdminUserTable";

export default function AdminUsersPage() {
  return (
    <div className="p-2">
      <p className="text-xl">Игроки</p>
      <AdminUserTable />
    </div>
  );
}
