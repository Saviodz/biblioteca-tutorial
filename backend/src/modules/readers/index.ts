export { prepareReaders } from "./infrastructure/schema";
export type { ReaderHistory } from "./domain/ReaderHistory";
export { normalizeCpf, parseReaderInput, type Reader, type ReaderInput } from "./domain/Reader";
export { invalidateReaderSearch } from "./infrastructure/searchCache";
