"use client";

import React from 'react';

interface Column<T = any> {
  header: React.ReactNode;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
}

const Table = <T,>({ columns, data }: TableProps<T>) => {
  return (
    <table className="table-container">
    <thead>
        <tr>
        {columns.map((col, i) => (
            <th key={i}>{col.header}</th>
        ))}
        </tr>
    </thead>
    <tbody>
        {data.map((row, rowIndex) => (
        <tr key={rowIndex}>
            {columns.map((col, colIndex) => {
            const value = typeof col.accessor === 'function'
                ? col.accessor(row)
                : row[col.accessor] as React.ReactNode;
            
            return <td key={colIndex}>{value}</td>;
            })}
        </tr>
        ))}
    </tbody>
    </table>

  );
};

export default Table;