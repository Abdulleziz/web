"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination?: boolean;
  inputFilter?: string;
  columnFilter?: [
    {
      columnToFilter: string;
      options: {
        label: string;
        value: string;
      }[];
    }
  ];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination = false,
  inputFilter,
  columnFilter,
}: DataTableProps<TData, TValue>) {
  const [pageSize, setPageSize] = useState(10);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });
  const pageIndex = table.getState().pagination.pageIndex;
  const pages: number[] = useMemo(
    () => new Array<number>(Math.ceil(data.length / pageSize)).fill(0),
    [data.length, pageSize]
  );

  const onPageUp = () => {
    table.setPageIndex(pageIndex + 1);
  };
  const onPageDown = () => {
    table.setPageIndex(pageIndex - 1);
  };

  return (
    <div className="min-w-max rounded-md border">
      <div className=" flex flex-row items-start justify-start gap-3 p-3">
        {inputFilter && (
          <Input
            placeholder={`Filter for ${inputFilter}`}
            value={
              (table.getColumn(inputFilter)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) => {
              table.getColumn(inputFilter)?.setFilterValue(event.target.value);
            }}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {pagination && (
        <div className=" flex items-center justify-between p-3">
          <div className="flex flex-row items-center justify-start gap-2">
            <Label>Items per Page</Label>
            <Select
              onValueChange={(value: string) => {
                table.setPageSize(Number(value));
                setPageSize(Number(value));
              }}
              defaultValue="10"
            >
              <SelectTrigger className="max-w-min">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{`${
              Math.min(pageIndex + 1, pageIndex) * pageSize + 1
            }-${Math.min(
              Math.min(pageIndex + 1, pageIndex) * pageSize + pageSize,
              data.length
            )} of ${data.length} items`}</Label>
          </div>
          <div className="flex flex-row items-center justify-center gap-1">
            <Select
              onValueChange={(value: string) => {
                table.setPageIndex(Number(value));
              }}
              defaultValue="1"
              value={String(pageIndex)}
            >
              <SelectTrigger className="max-w-min">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pages.map((_, i) => {
                  return (
                    <SelectItem key={i} value={String(i)}>
                      {i + 1}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Label>{`of ${pages.length} pages`}</Label>
            <Button
              variant={"ghost"}
              onClick={onPageDown}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant={"ghost"}
              onClick={onPageUp}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
