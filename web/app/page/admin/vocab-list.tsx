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
  columnFilteringFeature,
} from "@tanstack/react-table";
import type { Route } from "./+types/vocab-list";
import { createTrpcClient } from "@/util";
import {
  Form,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router";
import { PaginationBlock, UserAvatar } from "@/components/partial";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useState } from "react";

interface VocabItem {
  id: string;
  title: string;
  thumbnail: string;
  username: string;
  slug: string;
  status: string;
  createdAt: Date;
}

const features = tableFeatures({
  rowPaginationFeature,
  columnFilteringFeature,
});

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
  const title = searchParams.get("title") || undefined;
  let status = searchParams.get("status") || undefined;
  if (status === "all") {
    status = undefined;
  } else if (status !== "draft" && status !== "published") {
    status = undefined;
  }

  const vocabsWithPagination = await trpc.admin.listVocabs.query({
    title,
    status,
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
    manualFiltering: true,
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const [title, setTitle] = useState(searchParams.get("title") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");

  const handleClear = () => {
    setTitle("");
    setStatus("all");
    setSearchParams({});
  };

  return (
    <>
      <Form method="get" className="w-full mb-4 flex gap-4">
        <FieldSet className="w-full flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <Field>
            <Input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow-sm max-w-xs py-1"
              placeholder="Search by title..."
            />
          </Field>
          <Field>
            <Select
              name="status"
              value={status}
              onValueChange={(value) => setStatus(value)}
            >
              <SelectTrigger className="shadow-sm max-w-20">
                Status
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectGroup>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
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
