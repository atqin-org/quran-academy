import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** club id → allowed category ids; `null` means every category of that club */
export type AccessMap = Record<string | number, number[] | null>

/**
 * Keep only the categories the current user may use inside the selected club.
 * With no club selected (or no access map), every category is returned.
 */
export function categoriesForClub<T extends { id: number }>(
  categories: T[],
  accessMap: AccessMap | undefined,
  clubId: string | number | null | undefined
): T[] {
  if (!accessMap || clubId === null || clubId === undefined || clubId === "") {
    return categories
  }

  const allowed = accessMap[clubId]
  if (allowed === undefined) {
    return []
  }

  return allowed === null ? categories : categories.filter((category) => allowed.includes(category.id))
}
