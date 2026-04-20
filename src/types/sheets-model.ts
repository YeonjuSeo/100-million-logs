/** DB 스키마 (Google Sheets 탭과 동일한 필드명) */

export type Asset = {
  id: string;
  name: string;
  amount: number;
  type: string;
};

/** 자산 분류 (AssetCategories 탭 또는 기본값) */
export type AssetCategory = {
  id: string;
  name: string;
  color: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
};

export type GoalSettings = {
  startAmount: number;
  startDate: string;
  targetAmount: number;
  targetDate: string;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBudget: number;
};

export type MonthlyAssetRow = {
  id: string;
  month: string;
  assets: Asset[];
  totalAmount: number;
};
