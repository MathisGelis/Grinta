export function createListCache<T>(fetcher: () => Promise<T[]>) {
  let data: T[] | null = null;

  return {
    peek: (): T[] | null => data,
    set: (next: T[]) => {
      data = next;
    },
    async load(): Promise<T[]> {
      const fresh = await fetcher();
      if (data && JSON.stringify(data) === JSON.stringify(fresh)) return data;
      data = fresh;
      return fresh;
    },
  };
}
