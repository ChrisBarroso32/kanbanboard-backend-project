import { Prisma } from '../../generated/prisma/client';

// Reindexing reads then writes sibling rows; Serializable makes concurrent
// moves fail (P2034) instead of leaving duplicated or missing indexes.
// maxWait/timeout are above Prisma's defaults (2s/5s): with a remote database,
// opening a new TLS connection can exceed 2s and fail with P2028.
export const TX_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 10_000,
  timeout: 15_000,
};
