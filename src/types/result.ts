export interface TaxBreakdown {
  incomeTax: number; // 所得税からの控除額
  residentBasic: number; // 住民税・基本分の控除額
  residentSpecial: number; // 住民税・特例分の控除額
  total: number; // 合計控除額（上3つの合計）
}

export type LimitReason = "Income40" | "Resident20" | "None";

export interface LimitResult {
  maxDonation: number; // 自己負担2000円で収まる理論上限寄付額（年間合計）
  alreadyDonated: number; // すでに寄付済みの金額
  donationRemaining: number; // これから追加できる寄付額（maxDonation - alreadyDonated）
  limitReason: LimitReason; // 上限の理由（所得控除40% or 住民税20% or どちらにも未達）
}

export interface FurusatoResult {
  totalDonation: number; // 寄付合計額（donatedAlready + donateNow）
  actualCost: number; // 実質負担額（totalDonation - tax.total）

  tax: TaxBreakdown; // 通常（確定申告をした場合）の控除内訳
  oneStopTax?: TaxBreakdown; // ワンストップ特例を使った場合の控除内訳（必要なら別計算）

  limit: LimitResult; // 上限寄付額と残余額
}
