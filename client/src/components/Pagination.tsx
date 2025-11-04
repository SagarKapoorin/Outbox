type Props = {
  page: number;
  size: number;
  total: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
};

export function Pagination({ page, size, total, onPageChange, onSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (size || 1)));
  const isFirst = page <= 0;
  const isLast = (page + 1) >= totalPages;
  return (
    <div className="pagination" role="navigation" aria-label="Email list pagination">
      <div className="pagination-left">
        <button
          className="btn btn-ghost"
          disabled={isFirst}
          onClick={() => onPageChange(0)}
          aria-label="First page"
        >
          First
        </button>
        <button
          className="btn btn-ghost"
          disabled={isFirst}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          aria-label="Previous page"
        >
          Prev
        </button>
        <span className="pagination-status" aria-live="polite">
          Page {Math.min(page + 1, totalPages)} of {totalPages}
        </span>
        <button
          className="btn btn-ghost"
          disabled={isLast}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </button>
        <button
          className="btn btn-ghost"
          disabled={isLast}
          onClick={() => onPageChange(Math.max(0, totalPages - 1))}
          aria-label="Last page"
        >
          Last
        </button>
      </div>

      <div className="pagination-right">
        <label htmlFor="page-size" className="pagination-label">Per page</label>
        <select
          id="page-size"
          className="select pagination-size"
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
}

