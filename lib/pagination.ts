export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function getPaginationParams(query: any): Required<PaginationParams> {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  const sortBy = (query.sortBy as string) || 'createdAt';
  const sortOrder = (query.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  return { page, limit, sortBy, sortOrder };
}

export function calculatePagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore,
  };
}

export function applyPagination<T>(
  data: T[],
  page: number,
  limit: number
): PaginatedResult<T> {
  const total = data.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: calculatePagination(page, limit, total),
  };
}

export function buildPrismaOrderBy(sortBy: string, sortOrder: 'asc' | 'desc') {
  return { [sortBy]: sortOrder };
}

export function buildPrismaSkipTake(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}
