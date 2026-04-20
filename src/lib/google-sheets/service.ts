import { callAppsScript } from "./apps-script-proxy";
import type {
  Asset,
  AssetCategory,
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

export async function updateAsset(asset: Asset): Promise<void> {
  await callAppsScript({ action: "updateAsset", asset });
}

export async function fetchAssetCategories(): Promise<AssetCategory[]> {
  const data = await callAppsScript<{ assetCategories: AssetCategory[] }>({
    action: "getAssetCategories",
  });
  return data.assetCategories ?? [];
}

export async function appendAssetCategory(
  row: Omit<AssetCategory, "id">
): Promise<string> {
  const data = await callAppsScript<{ id: string }>({
    action: "appendAssetCategory",
    category: row,
  });
  return data.id;
}

export async function setAssetMonthAmount(input: {
  assetId: string;
  month: string;
  amount: number;
}): Promise<void> {
  await callAppsScript({
    action: "setAssetMonthAmount",
    assetId: input.assetId,
    month: input.month,
    amount: input.amount,
  });
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
