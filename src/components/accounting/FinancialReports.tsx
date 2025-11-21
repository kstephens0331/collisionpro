"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Printer,
} from "lucide-react";
import {
  FinancialStatement,
  AccountBalance,
  formatCurrency,
  formatPercentage,
  calculateFinancialRatios,
} from "@/lib/accounting";

interface FinancialReportsProps {
  statement: FinancialStatement;
  reportType: "balance-sheet" | "profit-loss";
}

export default function FinancialReports({
  statement,
  reportType,
}: FinancialReportsProps) {
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  const toggleDetails = (accountId: string) => {
    setShowDetails((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  const ratios = calculateFinancialRatios(statement);

  const renderAccountLine = (account: AccountBalance, indent: number = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = showDetails[account.accountId];

    return (
      <div key={account.accountId}>
        <div
          className={`flex items-center justify-between py-2 px-4 hover:bg-gray-50 ${
            indent > 0 ? "border-l-2 border-gray-200" : ""
          }`}
          style={{ paddingLeft: `${indent * 24 + 16}px` }}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => toggleDetails(account.accountId)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? "−" : "+"}
              </button>
            )}
            <span className="text-sm text-gray-600">
              {account.accountNumber}
            </span>
            <span className={`${indent === 0 ? "font-semibold" : ""}`}>
              {account.accountName}
            </span>
          </div>
          <span
            className={`font-mono ${
              account.balance < 0 ? "text-red-600" : ""
            } ${indent === 0 ? "font-semibold" : ""}`}
          >
            {formatCurrency(Math.abs(account.balance))}
            {account.balance < 0 && " CR"}
          </span>
        </div>

        {hasChildren && isExpanded && account.children && (
          <div>
            {account.children.map((child) => renderAccountLine(child, indent + 1))}
          </div>
        )}
      </div>
    );
  };

  if (reportType === "balance-sheet") {
    const assets = statement.accounts.filter((a) => a.accountType === "asset");
    const liabilities = statement.accounts.filter(
      (a) => a.accountType === "liability"
    );
    const equity = statement.accounts.filter((a) => a.accountType === "equity");

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Balance Sheet</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  As of {statement.statementDate.toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Assets */}
            <div className="mb-6">
              <div className="bg-blue-50 p-3 rounded-t-lg border-b-2 border-blue-500">
                <h3 className="font-bold text-lg">ASSETS</h3>
              </div>
              <div className="border-x border-b rounded-b-lg">
                {assets.map((account) => renderAccountLine(account))}
                <div className="flex items-center justify-between py-3 px-4 bg-blue-100 font-bold border-t-2">
                  <span>Total Assets</span>
                  <span className="font-mono">
                    {formatCurrency(statement.totals.totalAssets)}
                  </span>
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div className="mb-6">
              <div className="bg-red-50 p-3 rounded-t-lg border-b-2 border-red-500">
                <h3 className="font-bold text-lg">LIABILITIES</h3>
              </div>
              <div className="border-x border-b rounded-b-lg">
                {liabilities.map((account) => renderAccountLine(account))}
                <div className="flex items-center justify-between py-3 px-4 bg-red-100 font-bold border-t-2">
                  <span>Total Liabilities</span>
                  <span className="font-mono">
                    {formatCurrency(statement.totals.totalLiabilities)}
                  </span>
                </div>
              </div>
            </div>

            {/* Equity */}
            <div className="mb-6">
              <div className="bg-purple-50 p-3 rounded-t-lg border-b-2 border-purple-500">
                <h3 className="font-bold text-lg">EQUITY</h3>
              </div>
              <div className="border-x border-b rounded-b-lg">
                {equity.map((account) => renderAccountLine(account))}
                <div className="flex items-center justify-between py-3 px-4 bg-purple-100 font-bold border-t-2">
                  <span>Total Equity</span>
                  <span className="font-mono">
                    {formatCurrency(statement.totals.totalEquity)}
                  </span>
                </div>
              </div>
            </div>

            {/* Balance Check */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Assets = Liabilities + Equity</span>
                <span className="font-mono">
                  {formatCurrency(statement.totals.totalAssets)} ={" "}
                  {formatCurrency(
                    statement.totals.totalLiabilities + statement.totals.totalEquity
                  )}
                </span>
              </div>
              {Math.abs(
                statement.totals.totalAssets -
                  (statement.totals.totalLiabilities + statement.totals.totalEquity)
              ) < 0.01 ? (
                <p className="text-sm text-green-600 mt-2">✓ Balance sheet is balanced</p>
              ) : (
                <p className="text-sm text-red-600 mt-2">
                  ⚠ Balance sheet is out of balance
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Ratios */}
        <Card>
          <CardHeader>
            <CardTitle>Key Financial Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ratios.currentRatio && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Current Ratio</p>
                  <p className="text-2xl font-bold">
                    {ratios.currentRatio.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ratios.currentRatio >= 2
                      ? "Excellent"
                      : ratios.currentRatio >= 1
                      ? "Good"
                      : "Needs Attention"}
                  </p>
                </div>
              )}

              {ratios.debtToEquity !== undefined && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Debt-to-Equity</p>
                  <p className="text-2xl font-bold">
                    {ratios.debtToEquity.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ratios.debtToEquity < 1 ? "Low Risk" : "High Leverage"}
                  </p>
                </div>
              )}

              {ratios.returnOnAssets !== undefined && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Return on Assets</p>
                  <p className="text-2xl font-bold">
                    {formatPercentage(ratios.returnOnAssets)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">ROA</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Profit & Loss Statement
  const revenue = statement.accounts.filter((a) => a.accountType === "revenue");
  const expenses = statement.accounts.filter((a) => a.accountType === "expense");
  const netIncome = statement.totals.netIncome;
  const profitMargin = ratios.profitMargin || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Profit & Loss Statement</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {statement.periodStart.toLocaleDateString()} -{" "}
                {statement.periodEnd.toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Revenue */}
          <div className="mb-6">
            <div className="bg-green-50 p-3 rounded-t-lg border-b-2 border-green-500">
              <h3 className="font-bold text-lg">REVENUE</h3>
            </div>
            <div className="border-x border-b rounded-b-lg">
              {revenue.map((account) => renderAccountLine(account))}
              <div className="flex items-center justify-between py-3 px-4 bg-green-100 font-bold border-t-2">
                <span>Total Revenue</span>
                <span className="font-mono">
                  {formatCurrency(statement.totals.totalRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="mb-6">
            <div className="bg-orange-50 p-3 rounded-t-lg border-b-2 border-orange-500">
              <h3 className="font-bold text-lg">EXPENSES</h3>
            </div>
            <div className="border-x border-b rounded-b-lg">
              {expenses.map((account) => renderAccountLine(account))}
              <div className="flex items-center justify-between py-3 px-4 bg-orange-100 font-bold border-t-2">
                <span>Total Expenses</span>
                <span className="font-mono">
                  {formatCurrency(statement.totals.totalExpenses)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div
            className={`p-4 rounded-lg ${
              netIncome >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            } border-2`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {netIncome >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
                <span className="font-bold text-xl">NET INCOME</span>
              </div>
              <span
                className={`font-mono font-bold text-2xl ${
                  netIncome >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(netIncome))}
                {netIncome < 0 && " LOSS"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Profit Margin:</span>
                <span className="ml-2 font-semibold">
                  {formatPercentage(profitMargin)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Calculation:</span>
                <span className="ml-2 font-mono text-xs">
                  {formatCurrency(statement.totals.totalRevenue)} -{" "}
                  {formatCurrency(statement.totals.totalExpenses)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold">
                  {formatCurrency(statement.totals.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-xl font-bold">
                  {formatCurrency(statement.totals.totalExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-lg ${
                  netIncome >= 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {netIncome >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Income</p>
                <p
                  className={`text-xl font-bold ${
                    netIncome >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(Math.abs(netIncome))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
