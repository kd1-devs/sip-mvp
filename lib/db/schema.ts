import {
  pgTable,
  bigint,
  text,
  integer,
  numeric,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =====================================
// TABLE: clubs
// =====================================
export const clubs = pgTable("clubs", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  companyOverview: text("company_overview"),
  website: text("website"),
  country: text("country"),
  league: text("league"),
  yearFounded: integer("year_founded"),
  location: text("location"),
  owners: text("owners"),
  ownerLocation: text("owner_location"),
  ceo: text("ceo"),
  chairman: text("chairman"),
  profile: text("profile"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// =====================================
// TABLE: financials
// =====================================
export const financials = pgTable(
  "financials",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    clubId: bigint("club_id", { mode: "number" })
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),

    revenue: numeric("revenue"),
    revenueYoy: numeric("revenue_yoy"),
    ebitda: numeric("ebitda"),

    wages: numeric("wages"),
    amortization: numeric("amortization"),
    otherExpenses: numeric("other_expenses"),

    matchdayRevenue: numeric("matchday_revenue"),
    commercialRevenue: numeric("commercial_revenue"),
    broadcastingRevenue: numeric("broadcasting_revenue"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.clubId, table.year)]
);

// =====================================
// TABLE: financial_ratios
// =====================================
export const financialRatios = pgTable(
  "financial_ratios",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    clubId: bigint("club_id", { mode: "number" })
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),

    wageToRevenue: numeric("wage_to_revenue"),
    wagesAmortToRevenue: numeric("wages_amort_to_revenue"),
    otherExpensesToRevenue: numeric("other_expenses_to_revenue"),
    ebitdaMargin: numeric("ebitda_margin"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.clubId, table.year)]
);

// =====================================
// TABLE: media_assets
// =====================================
export const mediaAssets = pgTable("media_assets", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  clubId: bigint("club_id", { mode: "number" })
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  assetType: text("asset_type"),
  url: text("url"),
  altText: text("alt_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// =====================================
// TABLE: valuations
// =====================================
export const valuations = pgTable(
  "valuations",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    clubId: bigint("club_id", { mode: "number" })
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    valuation: numeric("valuation"),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.clubId, table.year)]
);

// =====================================
// RELATIONS
// =====================================
export const clubsRelations = relations(clubs, ({ many }) => ({
  financials: many(financials),
  financialRatios: many(financialRatios),
  mediaAssets: many(mediaAssets),
  valuations: many(valuations),
}));

export const financialsRelations = relations(financials, ({ one }) => ({
  club: one(clubs, {
    fields: [financials.clubId],
    references: [clubs.id],
  }),
}));

export const financialRatiosRelations = relations(
  financialRatios,
  ({ one }) => ({
    club: one(clubs, {
      fields: [financialRatios.clubId],
      references: [clubs.id],
    }),
  })
);

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  club: one(clubs, {
    fields: [mediaAssets.clubId],
    references: [clubs.id],
  }),
}));

export const valuationsRelations = relations(valuations, ({ one }) => ({
  club: one(clubs, {
    fields: [valuations.clubId],
    references: [clubs.id],
  }),
}));

// =====================================
// TYPESCRIPT TYPES
// =====================================
export type Club = typeof clubs.$inferSelect;
export type NewClub = typeof clubs.$inferInsert;

export type Financial = typeof financials.$inferSelect;
export type NewFinancial = typeof financials.$inferInsert;

export type FinancialRatio = typeof financialRatios.$inferSelect;
export type NewFinancialRatio = typeof financialRatios.$inferInsert;

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;

export type Valuation = typeof valuations.$inferSelect;
export type NewValuation = typeof valuations.$inferInsert;
