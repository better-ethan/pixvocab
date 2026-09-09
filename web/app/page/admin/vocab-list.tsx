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
import type { Route } from "./+types/vocab-list";
import { createTrpcClient } from "@/util";
import { useLoaderData, useLocation, useSearchParams } from "react-router";
import { PaginationBlock, UserAvatar } from "@/components/partial";
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

const features = tableFeatures({ rowPaginationFeature });

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

  const searchParams = new URL(request.url).searchParams;

  const page = parseInt(searchParams.get("page") || "1", 10);

  const vocabsWithPagination = await trpc.admin.listVocabs.query({
    page,
  });

  return { vocabsWithPagination };
};

export default function Page() {
  const { vocabsWithPagination } = useLoaderData<typeof loader>();

  return (
    <div className="w-full p-2">
      <Text className="text-2xl font-bold mb-4">Vocab List</Text>
      <DataTable
        columns={columns}
        data={vocabsWithPagination.data}
        rowCount={vocabsWithPagination.total}
        pageSize={vocabsWithPagination.pageSize}
        pageCount={vocabsWithPagination.pageCount}
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
      <Table className="overflow-y-auto">
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
