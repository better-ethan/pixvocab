import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTable, type ColumnDef, tableFeatures } from "@tanstack/react-table";
import type { Route } from "./+types/vocab-list";
import { createTrpcClient } from "@/util";
import { useLoaderData } from "react-router";
import { UserAvatar } from "@/components/partial";
import { Text } from "@/components/ui/text";

interface VocabItem {
  id: string;
  title: string;
  thumbnail: string;
  username: string;
  slug: string;
  status: string;
  createdAt: Date;
}

const features = tableFeatures({});

const columns: Array<ColumnDef<typeof features, VocabItem>> = [
  {
    accessorKey: "thumbnail",
    header: "Thumbnail",
    cell: (info) => {
      const imageUrl = info.getValue() as string | undefined;
      return <img src={imageUrl} className="h-12 w-auto" />;
    },
  },
  { accessorKey: "title", header: "Title", cell: (info) => info.getValue() },
  { accessorKey: "username", header: "User", cell: (info) => info.getValue() },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "deletedAt",
    header: "Deleted",
    cell: (info) => {
      const value = info.getValue();
      return value ? "Yes" : "No";
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created at",
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

  const vocabsWithPagination = await trpc.admin.listVocabs.query({});

  return { vocabsWithPagination };
};

export default function Page() {
  const { vocabsWithPagination } = useLoaderData<typeof loader>();

  return (
    <div className="w-full overflow-y-auto p-2">
      <Text as="h1" className="text-xl mb-4">
        Vocab List
      </Text>
      <DataTable columns={columns} data={vocabsWithPagination.data} />
    </div>
  );
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
