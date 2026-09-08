import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTable, type ColumnDef, tableFeatures } from "@tanstack/react-table";
import type { Route } from "./+types/user-list";
import { createTrpcClient } from "@/util";
import { useLoaderData } from "react-router";
import { UserAvatar } from "@/components/partial";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
}

const features = tableFeatures({});

const columns: Array<ColumnDef<typeof features, User>> = [
  {
    accessorKey: "image",
    header: "Avatar",
    cell: (info) => {
      const imageUrl = info.getValue() as string | undefined;
      return <UserAvatar src={imageUrl} />;
    },
  },
  { accessorKey: "email", header: "Email", cell: (info) => info.getValue() },
  { accessorKey: "name", header: "Name", cell: (info) => info.getValue() },
  { accessorKey: "role", header: "Role", cell: (info) => info.getValue() },
  {
    accessorKey: "banned",
    header: "Banned",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  },
  {
    accessorKey: "banReason",
    header: "Ban Reason",
    cell: (info) => info.getValue() || "-",
  },
  {
    accessorKey: "banExpires",
    header: "Ban Expires",
    cell: (info) => {
      const value = info.getValue();
      return value && (typeof value === "string" || typeof value === "number")
        ? new Date(value).toLocaleString()
        : "-";
    },
  },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const trpc = createTrpcClient(request);

  const usersWithPagination = await trpc.admin.listUsers.query({});

  return { usersWithPagination };
};

export default function Page() {
  const { usersWithPagination } = useLoaderData<typeof loader>();

  return <DataTable columns={columns} data={usersWithPagination.users} />;
}

function DataTable({ columns, data }: { columns: any; data: any }) {
  const table = useTable({ features, columns, data });
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
