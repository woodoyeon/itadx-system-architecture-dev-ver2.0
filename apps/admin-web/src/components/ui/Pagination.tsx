interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500">
        {page} / {totalPages} 페이지
      </p>
      <div className="flex gap-2">
        <button
          className="btn-secondary text-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          이전
        </button>
        <button
          className="btn-secondary text-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          다음
        </button>
      </div>
    </div>
  );
}
