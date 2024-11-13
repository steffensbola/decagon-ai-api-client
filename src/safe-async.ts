export type SafeAsyncResult<Data, E extends Error = Error> = 
    | { error: null; data: Data }
    | { error: E; data: null };

export async function safeAsync<D, E extends Error = Error>(
    callback: () => Promise<D>,
): Promise<SafeAsyncResult<D, E>> {
    try {
        const data = await callback();
        return { error: null, data };
    } catch (error) {
        return { error: error as E, data: null };
    }
}