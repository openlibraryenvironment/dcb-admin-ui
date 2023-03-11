export interface Resource<T> {
  content: T[];
  meta?: {
    size?: number;
    number?: number;
    sort?: any;
  };
  totalSize: number;
}

export const newResource = <T>(
  content: T[],
  pageable: any,
  totalSize: number,
): Resource<T> => ({
    content: content,
    meta:{
      from:1, 
      to: totalSize, 
      total: totalSize, 
      per_page: pageable.size, 
      last_page: Math.floor ( ( totalSize / pageable.size ) + 1 ),
      current_page: 1, // (pageable.number)+1,
    },
    totalSize: totalSize,
  })
