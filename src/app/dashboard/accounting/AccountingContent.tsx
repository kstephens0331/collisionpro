"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  FileText,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Plus,
  Calendar,
} from "lucide-react";
import JournalEntryForm from "@/components/accounting/JournalEntryForm";
import FinancialReports from "@/components/accounting/FinancialReports";
import {
  Account,
  JournalEntry,
  JournalEntryLine,
  FinancialStatement,
  formatCurrency,
  getAccountTypeColor,
  getJournalStatusColor,
  generateBalanceSheet,
  generateProfitLoss,
} from "@/lib/accounting";

// Mock data for accounts
const mockAccounts: Account[] = [
  {
    id: "acc-1110",
    shopId: "shop-1",
    accountNumber: "1110",
    accountName: "Cash - Checking",
    accountType: "asset",
    accountSubtype: "current-asset",
    normalBalance: "debit",
    isActive: true,
    isSystem: true,
    allowManualEntry: true,
    currentBalance: 45000,
    ytdBalance: 45000,
    level: 3,
  },
  {
    id: "acc-1200",
    shopId: "shop-1",
    accountNumber: "1200",
    accountName: "Accounts Receivable",
    accountType: "asset",
    accountSubtype: "current-asset",
    normalBalance: "debit",
    isActive: true,
    isSystem: true,
    allowManualEntry: false,
    currentBalance: 28500,
    ytdBalance: 28500,
    level: 3,
  },
  {
    id: "acc-1300",
    shopId: "shop-1",
    accountNumber: "1300",
    accountName: "Inventory - Parts",
    accountType: "asset",
    accountSubtype: "current-asset",
    normalBalance: "debit",
    isActive: true,
    isSystem: true,
    allowManualEntry: true,
    currentBalance: 15000,
    ytdBalance: 15000,
    level: 3,
  },
  {
    id: "acc-1510",
    shopId: "shop-1",
    accountNumber: "1510",
    accountName: "Equipment",
    accountType: "asset",
    accountSubtype: "fixed-asset",
    normalBalance: "debit",
    isActive: true,
    isSystem: true,
    allowManualEntry: true,
    currentBalance: 125000,
    ytdBalance: 125000,
    level: 3,
  },
  {
    id: "acc-2110",
    shopId: "shop-1",
    accountNumber: "2110",
    accountName: "Accounts Payable",
    accountType: "liability",
    accountSubtype: "current-liability",
    normalBalance: "credit",
    isActive: true,
    isSystem: true,
    allowManualEntry: false,
    currentBalance: 12000,
    ytdBalance: 12000,
    level: 3,
  },
  {
    id: "acc-2130",
    shopId: "shop-1",
    accountNumber: "2130",
    accountName: "Sales Tax Payable",
    accountType: "liability",
    accountSubtype: "current-liability",
    normalBalance: "credit",
    isActive: true,
    isSystem: true,
    allowManualEntry: true,
    currentBalance: 3200,
    ytdBalance: 3200,
    level: 3,
  },
  {
    id: "acc-3100",
    shopId: "shop-1",
    accountNumber: "3100",
    accountName: "Owner's Equity",
    accountType: "equity",
    accountSubtype: "equity",
    normalBalance: "credit",
    isActive: true,
    isSystem: true,
    allowManualEntry: true,
    currentBalance: 150000,
    ytdBalance: 150000,
    level: 2,
  },
  {
    id: "acc-3300",
    shopId: "shop-1",
    accountNumber: "3300",
    accountName: "Current Year Earnings",
    accountType: "equity",
    accountSubtype: "equity",
    normalBalance: "credit",
    isActive: true,
    isSystem: true,
    allowManualEntry: false,
    currentBalance: 33300,
    ytdBalance: 33300,
    level: 2,
  },
  {
    id: "acc-4100",
    shopId: "shop-1",
    accountNumber: "4100",
    accountName: "Labor Revenue",
    accountType: "revenue",
    accountSubtype: "sales",
    normalBalance: "credit",
    isActive: true,
    isSystem: true,
    allowManualEntry: false,
    currentBalance: 85000,
    ytdBalance: 85000,
    level: 2,
  },
  {
    id: "acc-4200",
    shopId: "shop-1",
    accountNumber: "4200",
    accountName: "Parts Revenue",
    accountType: "revenue",
    accountSubtype: "sales",
    normalBalance: "credit",
    isActive: true,
    isSystem: true,
    allowManualEntry: false,
    currentBalance: 42000,
    ytdBalance: 42000,
    level: 2,
  },
  {
    id: "acc-4300",
    shopId: "shop-1",
    accountNumber: "4300",
    accountName: "Paint & Materials Revenue",
    accountType: "revenue",
    accountSubtype: "sales",
    normalBalance: "credit",
    isActive: true,
    isSystem: true,
    allowManualEntry: false,
    currentBalance: 28000,
    ytdBalance: 28000,
    level: 2,
  },
  {
    id: "acc-5100",
    shopId: "shop-1",
    accountNumber: "5100",
    accountName: "Parts Cost",
    accountType: "expense",
    accountSubtype: "cogs",
    normalBalance: "debit",
    isActive: true,
    isSystem: true,
    allowManualEntry: false,
    currentBalance: 25000,
    ytdBalance: 25000,
    level: 2,
  },
  {
    id: "acc-5200",
    shopId: "shop-1",
    accountNumber: "5200",
    accountName: "Paint & Materials Cost",
    accountType: "expense",
    accountSubtype: "cogs",
    normalBalance: "debit",
    isActive: true,
    isSystem: true,
    allowManualEntry: false,
    currentBalance: 12000,
    ytdBalance: 12000,
    level: 2,
  },
  {
    id: "acc-6100",
    shopId: "shop-1",
    accountNumber: "6100",
    accountName: "Payroll Expenses",
    accountType: "expense",
    accountSubtype: "operating",
    normalBalance: "debit",
    isActive: true,
    isSystem: true,
    allowManualEntry: true,
    currentBalance: 48000,
    ytdBalance: 48000,
    level: 2,
  },
  {
    id: "acc-6200",
    shopId: "shop-1",
    accountNumber: "6200",
    accountName: "Rent/Lease",
    accountType: "expense",
    accountSubtype: "operating",
    normalBalance: "debit",
    isActive: true,
    isSystem: true,
    allowManualEntry: true,
    currentBalance: 24000,
    ytdBalance: 24000,
    level: 2,
  },
  {
    id: "acc-6300",
    shopId: "shop-1",
    accountNumber: "6300",
    accountName: "Utilities",
    accountType: "expense",
    accountSubtype: "operating",
    normalBalance: "debit",
    isActive: true,
    isSystem: true,
    allowManualEntry: true,
    currentBalance: 6700,
    ytdBalance: 6700,
    level: 2,
  },
];

// Mock journal entries
const mockJournalEntries: JournalEntry[] = [
  {
    id: "je-1",
    shopId: "shop-1",
    entryNumber: "JE-2025-001",
    entryDate: new Date("2025-11-01"),
    entryType: "general",
    source: "estimate",
    sourceId: "est-1",
    description: "Revenue from estimate EST-001",
    status: "posted",
    isRecurring: false,
    totalDebit: 5500,
    totalCredit: 5500,
    isBalanced: true,
    lines: [
      {
        id: "jel-1",
        journalEntryId: "je-1",
        accountId: "acc-1200",
        accountNumber: "1200",
        accountName: "Accounts Receivable",
        lineNumber: 1,
        description: "Revenue from estimate",
        debitAmount: 5500,
        creditAmount: 0,
        estimateId: "est-1",
      },
      {
        id: "jel-2",
        journalEntryId: "je-1",
        accountId: "acc-4100",
        accountNumber: "4100",
        accountName: "Labor Revenue",
        lineNumber: 2,
        description: "Labor revenue",
        debitAmount: 0,
        creditAmount: 3200,
        estimateId: "est-1",
      },
      {
        id: "jel-3",
        journalEntryId: "je-1",
        accountId: "acc-4200",
        accountNumber: "4200",
        accountName: "Parts Revenue",
        lineNumber: 3,
        description: "Parts revenue",
        debitAmount: 0,
        creditAmount: 2300,
        estimateId: "est-1",
      },
    ],
  },
  {
    id: "je-2",
    shopId: "shop-1",
    entryNumber: "JE-2025-002",
    entryDate: new Date("2025-11-05"),
    entryType: "general",
    source: "payment",
    sourceId: "pay-1",
    description: "Payment received - check",
    status: "posted",
    isRecurring: false,
    totalDebit: 2500,
    totalCredit: 2500,
    isBalanced: true,
    lines: [
      {
        id: "jel-4",
        journalEntryId: "je-2",
        accountId: "acc-1110",
        accountNumber: "1110",
        accountName: "Cash - Checking",
        lineNumber: 1,
        description: "Payment received via check",
        debitAmount: 2500,
        creditAmount: 0,
      },
      {
        id: "jel-5",
        journalEntryId: "je-2",
        accountId: "acc-1200",
        accountNumber: "1200",
        accountName: "Accounts Receivable",
        lineNumber: 2,
        description: "Payment applied to AR",
        debitAmount: 0,
        creditAmount: 2500,
      },
    ],
  },
  {
    id: "je-3",
    shopId: "shop-1",
    entryNumber: "JE-2025-003",
    entryDate: new Date("2025-11-15"),
    entryType: "general",
    source: "manual",
    description: "Purchase inventory - parts",
    status: "draft",
    isRecurring: false,
    totalDebit: 3500,
    totalCredit: 3500,
    isBalanced: true,
    lines: [
      {
        id: "jel-6",
        journalEntryId: "je-3",
        accountId: "acc-1300",
        accountNumber: "1300",
        accountName: "Inventory - Parts",
        lineNumber: 1,
        description: "Parts purchase",
        debitAmount: 3500,
        creditAmount: 0,
      },
      {
        id: "jel-7",
        journalEntryId: "je-3",
        accountId: "acc-2110",
        accountNumber: "2110",
        accountName: "Accounts Payable",
        lineNumber: 2,
        description: "AP - Parts supplier",
        debitAmount: 0,
        creditAmount: 3500,
      },
    ],
  },
];

export default function AccountingContent() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "accounts" | "journal" | "reports"
  >("dashboard");
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [reportType, setReportType] = useState<
    "balance-sheet" | "profit-loss"
  >("profit-loss");

  const handleSaveJournal = (entry: Partial<JournalEntry>) => {
    console.log("Saving journal entry:", entry);
    // In production, this would call API
    setShowJournalForm(false);
    setSelectedEntry(null);
  };

  // Calculate quick stats
  const totalAssets = mockAccounts
    .filter((a) => a.accountType === "asset")
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalRevenue = mockAccounts
    .filter((a) => a.accountType === "revenue")
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalExpenses = mockAccounts
    .filter((a) => a.accountType === "expense")
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const netIncome = totalRevenue - totalExpenses;

  const cash = mockAccounts.find((a) => a.id === "acc-1110")?.currentBalance || 0;
  const ar = mockAccounts.find((a) => a.id === "acc-1200")?.currentBalance || 0;
  const ap = mockAccounts.find((a) => a.id === "acc-2110")?.currentBalance || 0;

  const draftEntries = mockJournalEntries.filter((e) => e.status === "draft");
  const recentEntries = mockJournalEntries
    .filter((e) => e.status === "posted")
    .slice(-5)
    .reverse();

  // Generate financial statements
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const balanceSheet = generateBalanceSheet(mockAccounts, today);
  const profitLoss = generateProfitLoss(mockAccounts, startOfYear, today);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Accounting</h2>
            <p className="text-sm text-gray-600 mt-1">
              Full double-entry accounting with financial reports
            </p>
          </div>
          <Button onClick={() => setShowJournalForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Journal Entry
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b">
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "dashboard"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "accounts"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("accounts")}
          >
            Chart of Accounts
          </button>
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "journal"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("journal")}
          >
            Journal Entries
          </button>
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "reports"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("reports")}
          >
            Financial Reports
          </button>
        </div>

        {/* Journal Entry Form Modal */}
        {showJournalForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-6xl w-full mx-4 mb-8">
              <JournalEntryForm
                entry={selectedEntry || undefined}
                accounts={mockAccounts}
                onSave={handleSaveJournal}
                onCancel={() => {
                  setShowJournalForm(false);
                  setSelectedEntry(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cash Balance</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(cash)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">A/R Balance</p>
                      <p className="text-2xl font-bold">{formatCurrency(ar)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">A/P Balance</p>
                      <p className="text-2xl font-bold">{formatCurrency(ap)}</p>
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
                      <TrendingUp
                        className={`h-6 w-6 ${
                          netIncome >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Income (YTD)</p>
                      <p
                        className={`text-2xl font-bold ${
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

            {/* Alerts */}
            {draftEntries.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">
                        {draftEntries.length} Draft Journal{" "}
                        {draftEntries.length === 1 ? "Entry" : "Entries"}
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Review and post draft entries to update account balances
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Journal Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentEntries.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No recent journal entries
                    </p>
                  ) : (
                    recentEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowJournalForm(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{entry.description}</p>
                            <p className="text-sm text-gray-600">
                              {entry.entryNumber} •{" "}
                              {entry.entryDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getJournalStatusColor(entry.status)}>
                            {entry.status}
                          </Badge>
                          <span className="font-mono font-semibold">
                            {formatCurrency(entry.totalDebit)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {formatCurrency(totalAssets)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(totalRevenue)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(totalExpenses)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Chart of Accounts Tab */}
        {activeTab === "accounts" && (
          <div className="space-y-6">
            {["asset", "liability", "equity", "revenue", "expense"].map(
              (type) => {
                const accounts = mockAccounts.filter(
                  (a) => a.accountType === type && a.isActive
                );
                const total = accounts.reduce(
                  (sum, a) => sum + a.currentBalance,
                  0
                );

                return (
                  <Card key={type}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="capitalize">{type}s</CardTitle>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Balance</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(total)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {accounts.map((account) => (
                          <div
                            key={account.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <Badge className={getAccountTypeColor(type)}>
                                {account.accountNumber}
                              </Badge>
                              <div>
                                <p className="font-medium">
                                  {account.accountName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Normal: {account.normalBalance} •{" "}
                                  {account.allowManualEntry
                                    ? "Manual entry allowed"
                                    : "System only"}
                                </p>
                              </div>
                            </div>
                            <span className="font-mono font-semibold">
                              {formatCurrency(account.currentBalance)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            )}
          </div>
        )}

        {/* Journal Entries Tab */}
        {activeTab === "journal" && (
          <div className="space-y-4">
            {mockJournalEntries.map((entry) => (
              <Card
                key={entry.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedEntry(entry);
                  setShowJournalForm(true);
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {entry.entryNumber}
                        </h3>
                        <Badge className={getJournalStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{entry.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {entry.entryDate.toLocaleDateString()} •{" "}
                        {entry.lines?.length || 0} lines
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(entry.totalDebit)}
                      </p>
                    </div>
                  </div>

                  {/* Entry Lines Preview */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 p-2 bg-gray-50 text-xs font-semibold border-b">
                      <div className="col-span-1">#</div>
                      <div className="col-span-5">Account</div>
                      <div className="col-span-3 text-right">Debit</div>
                      <div className="col-span-3 text-right">Credit</div>
                    </div>
                    {entry.lines?.map((line) => (
                      <div
                        key={line.id}
                        className="grid grid-cols-12 gap-2 p-2 text-sm border-b last:border-b-0"
                      >
                        <div className="col-span-1 text-gray-600">
                          {line.lineNumber}
                        </div>
                        <div className="col-span-5">
                          {line.accountNumber} - {line.accountName}
                        </div>
                        <div className="col-span-3 text-right font-mono">
                          {line.debitAmount > 0
                            ? formatCurrency(line.debitAmount)
                            : "-"}
                        </div>
                        <div className="col-span-3 text-right font-mono">
                          {line.creditAmount > 0
                            ? formatCurrency(line.creditAmount)
                            : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Financial Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Report Type Selector */}
            <div className="flex gap-2">
              <Button
                variant={reportType === "profit-loss" ? "default" : "outline"}
                onClick={() => setReportType("profit-loss")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Profit & Loss
              </Button>
              <Button
                variant={reportType === "balance-sheet" ? "default" : "outline"}
                onClick={() => setReportType("balance-sheet")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Balance Sheet
              </Button>
            </div>

            {/* Render Report */}
            <FinancialReports
              statement={
                reportType === "balance-sheet" ? balanceSheet : profitLoss
              }
              reportType={reportType}
            />
          </div>
        )}
      </div>
    </div>
  );
}
