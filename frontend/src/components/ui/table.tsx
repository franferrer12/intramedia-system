import { FC, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface TableProps extends HTMLAttributes<HTMLTableElement> {}
interface TableSectionProps extends HTMLAttributes<HTMLTableSectionElement> {}
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {}
interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {}

export const Table: FC<TableProps> = ({ className, ...props }) => {
  return (
    <div className="relative w-full overflow-auto">
      <table className={clsx('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
};

export const TableHeader: FC<TableSectionProps> = ({ className, ...props }) => {
  return <thead className={clsx('[&_tr]:border-b', className)} {...props} />;
};

export const TableBody: FC<TableSectionProps> = ({ className, ...props}) => {
  return <tbody className={clsx('[&_tr:last-child]:border-0', className)} {...props} />;
};

export const TableFooter: FC<TableSectionProps> = ({ className, ...props }) => {
  return (
    <tfoot
      className={clsx('border-t bg-gray-100/50 font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  );
};

export const TableRow: FC<TableRowProps> = ({ className, ...props }) => {
  return (
    <tr
      className={clsx(
        'border-b transition-colors hover:bg-gray-100/50 data-[state=selected]:bg-gray-100',
        className
      )}
      {...props}
    />
  );
};

export const TableHead: FC<TableCellProps> = ({ className, ...props }) => {
  return (
    <th
      className={clsx(
        'h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
};

export const TableCell: FC<TableCellProps> = ({ className, ...props }) => {
  return (
    <td
      className={clsx('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  );
};

export const TableCaption: FC<HTMLAttributes<HTMLElement>> = ({ className, ...props }) => {
  return (
    <caption
      className={clsx('mt-4 text-sm text-gray-500', className)}
      {...props}
    />
  );
};
