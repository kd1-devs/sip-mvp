import { db } from "@/lib/db";
import { clubs, financials } from "@/lib/db/schema";
import { eq, and, ilike, asc, count } from "drizzle-orm";

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getClubs(params?: PaginationParams): Promise<PaginatedResult<typeof clubs.$inferSelect>> {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    db.select().from(clubs).orderBy(asc(clubs.name)).limit(limit).offset(offset),
    db.select({ count: count() }).from(clubs),
  ]);

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getClubFinancials(clubId: number, params?: PaginationParams): Promise<PaginatedResult<typeof financials.$inferSelect>> {
  const page = params?.page || 1;
  const limit = params?.limit || 100;
  const offset = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(financials)
      .where(eq(financials.clubId, clubId))
      .orderBy(asc(financials.year))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(financials)
      .where(eq(financials.clubId, clubId)),
  ]);

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getClubFinancialByYear(clubId: number, year: number) {
  const results = await db
    .select()
    .from(financials)
    .where(and(eq(financials.clubId, clubId), eq(financials.year, year)))
    .limit(1);
  
  return results[0] || null;
}

export async function getClubByName(name: string) {
  const results = await db
    .select()
    .from(clubs)
    .where(ilike(clubs.name, name))
    .limit(1);
  
  return results[0] || null;
}

export async function getClubById(id: number) {
  const results = await db
    .select()
    .from(clubs)
    .where(eq(clubs.id, id))
    .limit(1);
  
  return results[0] || null;
}

// =====================================
// HELPER: Get all records (use with caution for large datasets)
// =====================================

export async function getAllClubs() {
  return await db.select().from(clubs).orderBy(asc(clubs.name));
}

export async function getAllClubFinancials(clubId: number) {
  return await db
    .select()
    .from(financials)
    .where(eq(financials.clubId, clubId))
    .orderBy(asc(financials.year));
}

// =====================================
// COMPUTED: Get financials with YoY calculations
// =====================================

export async function getClubFinancialsWithYoY(clubId: number) {
  const { calculateYoY } = await import("@/lib/utils/financials");
  const financials = await getAllClubFinancials(clubId);
  return calculateYoY(financials);
}
