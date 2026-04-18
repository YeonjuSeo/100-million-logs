import { callAppsScript } from "./apps-script-proxy";
import type {
  Asset,
  Category,
  Expense,
  GoalSettings,
  MonthlyAssetRow,
} from "@/types/sheets-model";

export async function fetchGoal(): Promise<GoalSettings | null> {
  const data = await callAppsScript<{ goal: GoalSettings | null }>({
    action: "getGoal",
  });
  return data.goal ?? null;
}

export async function updateGoal(goal: GoalSettings): Promise<void> {
  await callAppsScript({ action: "updateGoal", goal });
}

export async function fetchAssets(): Promise<Asset[]> {
  const data = await callAppsScript<{ assets: Asset[] }>({
    action: "getAssets",
  });
  return data.assets ?? [];
}

export async function appendAsset(asset: Omit<Asset, "id">): Promise<string> {
  const data = await callAppsScript<{ id: string }>({
    action: "appendAsset",
    asset,
  });
  return data.id;
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await callAppsScript<{ categories: Category[] }>({
    action: "getCategories",
  });
  return data.categories ?? [];
}

export async function fetchExpenses(): Promise<Expense[]> {
  const data = await callAppsScript<{ expenses: Expense[] }>({
    action: "getExpenses",
  });
  return data.expenses ?? [];
}

export async function appendExpense(
  row: Omit<Expense, "id">
): Promise<string> {
  const data = await callAppsScript<{ id: string }>({
    action: "appendExpense",
    expense: row,
  });
  return data.id;
}

export async function fetchMonthlyAssets(): Promise<MonthlyAssetRow[]> {
  const data = await callAppsScript<{ monthlyAssets: MonthlyAssetRow[] }>({
    action: "getMonthlyAssets",
  });
  return data.monthlyAssets ?? [];
}

export async function appendMonthlyAssetSnapshot(input: {
  month: string;
  assets: Asset[];
  totalAmount: number;
}): Promise<string> {
  const data = await callAppsScript<{ id: string }>({
    action: "appendMonthlyAsset",
    payload: input,
  });
  return data.id;
}
