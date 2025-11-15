"use server";

import { getClubFinancialsWithYoY, PaginationParams } from "@/lib/data/queries";

export async function getClubFinancialsAction(clubId: number, params?: PaginationParams) {
  // Always return YoY pre-calculated on the server
  return await getClubFinancialsWithYoY(clubId);
}
