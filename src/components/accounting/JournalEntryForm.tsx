"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, AlertCircle, CheckCircle, Save } from "lucide-react";
import {
  JournalEntry,
  JournalEntryLine,
  Account,
  validateJournalBalance,
  formatCurrency,
  getJournalStatusColor,
} from "@/lib/accounting";

interface JournalEntryFormProps {
  entry?: JournalEntry;
  accounts: Account[];
  onSave: (entry: Partial<JournalEntry>) => void;
  onCancel: () => void;
}

export default function JournalEntryForm({
  entry,
  accounts,
  onSave,
  onCancel,
}: JournalEntryFormProps) {
  const [entryDate, setEntryDate] = useState<string>(
    entry?.entryDate
      ? new Date(entry.entryDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(entry?.description || "");
  const [memo, setMemo] = useState(entry?.memo || "");
  const [lines, setLines] = useState<Partial<JournalEntryLine>[]>(
    entry?.lines || [
      { lineNumber: 1, debitAmount: 0, creditAmount: 0, accountId: "" },
      { lineNumber: 2, debitAmount: 0, creditAmount: 0, accountId: "" },
    ]
  );

  const addLine = () => {
    setLines([
      ...lines,
      {
        lineNumber: lines.length + 1,
        debitAmount: 0,
        creditAmount: 0,
        accountId: "",
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return; // Must have at least 2 lines
    const newLines = lines.filter((_, i) => i !== index);
    setLines(
      newLines.map((line, idx) => ({ ...line, lineNumber: idx + 1 }))
    );
  };

  const updateLine = (
    index: number,
    field: keyof JournalEntryLine,
    value: any
  ) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Auto-clear opposite field when entering debit/credit
    if (field === "debitAmount" && value > 0) {
      newLines[index].creditAmount = 0;
    } else if (field === "creditAmount" && value > 0) {
      newLines[index].debitAmount = 0;
    }

    setLines(newLines);
  };

  const totalDebits = lines.reduce(
    (sum, line) => sum + (line.debitAmount || 0),
    0
  );
  const totalCredits = lines.reduce(
    (sum, line) => sum + (line.creditAmount || 0),
    0
  );
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
  const difference = totalDebits - totalCredits;

  const handleSave = (status: "draft" | "posted") => {
    const journalEntry: Partial<JournalEntry> = {
      entryDate: new Date(entryDate),
      description,
      memo,
      status,
      totalDebit: totalDebits,
      totalCredit: totalCredits,
      isBalanced,
      lines: lines as JournalEntryLine[],
      entryType: "general",
      source: "manual",
      isRecurring: false,
    };

    const validation = validateJournalBalance(journalEntry as JournalEntry);
    if (!validation.isValid) {
      alert("Entry validation failed:\n" + validation.errors.join("\n"));
      return;
    }

    onSave(journalEntry);
  };

  const getAccountDisplay = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.accountNumber} - ${account.accountName}` : "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{entry ? "Edit" : "New"} Journal Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Entry Date
              </label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Entry Number
              </label>
              <Input
                disabled
                value={entry?.entryNumber || "Auto-generated"}
                className="bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Description *
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this entry"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Memo</label>
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Additional notes (optional)"
            />
          </div>

          {/* Journal Lines */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Journal Entry Lines</h3>
                <Button size="sm" variant="outline" onClick={addLine}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-gray-100 font-semibold text-sm border-b">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Account</div>
              <div className="col-span-2 text-right">Debit</div>
              <div className="col-span-2 text-right">Credit</div>
              <div className="col-span-2">Description</div>
              <div className="col-span-1"></div>
            </div>

            {/* Lines */}
            <div className="divide-y">
              {lines.map((line, index) => {
                const account = accounts.find((a) => a.id === line.accountId);
                return (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-gray-50"
                  >
                    <div className="col-span-1 text-sm text-gray-600">
                      {line.lineNumber}
                    </div>

                    <div className="col-span-5">
                      <Select
                        value={line.accountId}
                        onValueChange={(value) =>
                          updateLine(index, "accountId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account..." />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter((a) => a.isActive && a.allowManualEntry)
                            .sort(
                              (a, b) =>
                                parseInt(a.accountNumber) -
                                parseInt(b.accountNumber)
                            )
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.accountNumber} - {account.accountName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {account && (
                        <p className="text-xs text-gray-500 mt-1">
                          Type: {account.accountType} • Normal:{" "}
                          {account.normalBalance}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.debitAmount || ""}
                        onChange={(e) =>
                          updateLine(
                            index,
                            "debitAmount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="text-right"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.creditAmount || ""}
                        onChange={(e) =>
                          updateLine(
                            index,
                            "creditAmount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="text-right"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="col-span-1">
                      <Input
                        value={line.description || ""}
                        onChange={(e) =>
                          updateLine(index, "description", e.target.value)
                        }
                        placeholder="Note"
                        className="text-sm"
                      />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      {lines.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="bg-gray-50 p-3 border-t">
              <div className="grid grid-cols-12 gap-2 font-semibold">
                <div className="col-span-6 text-right">TOTALS:</div>
                <div className="col-span-2 text-right font-mono">
                  {formatCurrency(totalDebits)}
                </div>
                <div className="col-span-2 text-right font-mono">
                  {formatCurrency(totalCredits)}
                </div>
                <div className="col-span-2"></div>
              </div>

              {/* Balance Check */}
              <div className="mt-3 pt-3 border-t">
                {isBalanced ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Entry is balanced</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">
                      Entry is out of balance by{" "}
                      {formatCurrency(Math.abs(difference))}
                      {difference > 0 ? " (Debit heavy)" : " (Credit heavy)"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave("draft")}
                disabled={!description || lines.some((l) => !l.accountId)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave("posted")}
                disabled={
                  !isBalanced ||
                  !description ||
                  lines.some((l) => !l.accountId)
                }
              >
                Post Entry
              </Button>
            </div>
          </div>

          {/* Warnings */}
          {!description && (
            <p className="text-sm text-amber-600">
              ⚠ Description is required
            </p>
          )}
          {lines.some((l) => !l.accountId) && (
            <p className="text-sm text-amber-600">
              ⚠ All lines must have an account selected
            </p>
          )}
          {!isBalanced && (
            <p className="text-sm text-red-600">
              ⚠ Entry cannot be posted until debits equal credits
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
