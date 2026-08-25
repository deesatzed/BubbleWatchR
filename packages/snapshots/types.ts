export const CSV_COLUMNS = [
  "as_of",
  "portfolio_name",
  "asset_id",
  "symbol_or_name",
  "quantity",
  "price",
  "market_value",
  "ai_exposure_fraction",
  "account_group",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

export type SnapshotSource = "manual" | "csv";

export type SnapshotPosition = {
  assetId: string;
  symbolOrName: string;
  quantity: number;
  price: number | null;
  marketValue: number;
  marketValueProvided: boolean;
  aiExposureFraction: number | null;
  accountGroup: string;
};

export type PortfolioSnapshot = {
  id: string;
  asOf: string;
  portfolioName: string;
  source: SnapshotSource;
  sourceReference: string | null;
  createdAt: string;
  positions: SnapshotPosition[];
};

export type SnapshotInput = {
  asOf: string;
  portfolioName: string;
  source: SnapshotSource;
  sourceReference?: string | null;
  positions: unknown[];
};

export type SnapshotValidationError = {
  row: number | null;
  column: string | null;
  code: string;
  message: string;
};

export type SnapshotValidationResult =
  | { ok: true; value: SnapshotInput & { positions: SnapshotPosition[] } }
  | { ok: false; errors: SnapshotValidationError[] };

export type CsvImportResult =
  | { ok: true; snapshot: PortfolioSnapshot; attemptId: string }
  | { ok: false; errors: SnapshotValidationError[]; attemptId: string };
