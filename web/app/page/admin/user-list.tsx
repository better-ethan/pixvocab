import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useTable,
  type ColumnDef,
  tableFeatures,
  rowPaginationFeature,
} from "@tanstack/react-table";
import type { Route } from "./+types/user-list";
import { createTrpcClient } from "@/util";
import { Form, useLoaderData, useSearchParams } from "react-router";
import { PaginationBlock, UserAvatar } from "@/components/partial";
import { Text } from "@/components/ui/text";
import { Field, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
}

const features = tableFeatures({ rowPaginationFeature });

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

  const searchParams = new URL(request.url).searchParams;

  const page = parseInt(searchParams.get("page") || "1", 10);
  const email = searchParams.get("email") || undefined;
  const name = searchParams.get("name") || undefined;
  const bannedString = searchParams.get("banned") || undefined;
  let banned: boolean | undefined = undefined;
  if (bannedString === "false") {
    banned = false;
  } else if (bannedString === "true") {
    banned = true;
  } else {
    banned = undefined;
  }

  const usersWithPagination = await trpc.admin.listUsers.query({
    email,
    name,
    banned,
    page,
  });

  return { usersWithPagination };
};

export default function Page() {
  const { usersWithPagination } = useLoaderData<typeof loader>();

  const [searchParams, setSearchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [name, setName] = useState(searchParams.get("name") || "");
  const [banned, setBanned] = useState(searchParams.get("banned") || "all");

  const handleClear = () => {
    setEmail("");
    setName("");
    setBanned("all");
    setSearchParams({});
  };

  return (
    <div>
      <Text className="text-2xl font-bold mb-4">User List</Text>
      <Form method="get" className="w-full mb-4 flex gap-4">
        <FieldSet className="w-full flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <Field>
            <Input
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow-sm max-w-xs py-1"
              placeholder="Search by email..."
            />
          </Field>
          <Field>
            <Input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="shadow-sm max-w-xs py-1"
              placeholder="Search by name..."
            />
          </Field>
          <Field>
            <Select
              name="banned"
              value={banned}
              onValueChange={(value) => setBanned(value)}
            >
              <SelectTrigger className="shadow-sm max-w-20">
                Banned
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectGroup>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="horizontal" className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="shadow-sm md:max-w-16"
            >
              Clear
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="shadow-sm md:max-w-16"
            >
              Search
            </Button>
          </Field>
        </FieldSet>
      </Form>
      <DataTable
        columns={columns}
        data={usersWithPagination.data}
        rowCount={usersWithPagination.total}
        pageCount={usersWithPagination.pageCount}
        pageSize={usersWithPagination.pageSize}
      />
    </div>
  );
}

function DataTable({
  columns,
  data,
  rowCount,
  pageSize,
  pageCount,
}: {
  columns: any;
  data: any;
  rowCount: number;
  pageSize: number;
  pageCount: number;
}) {
  const table = useTable({
    features,
    columns,
    data,
    manualPagination: true,
    rowCount,
    pageCount,
    state: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
  });

  return (
    <>
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
      <PaginationBlock
        total={rowCount}
        pageCount={pageCount}
        currentPageSize={data.length}
      />
    </>
  );
}
