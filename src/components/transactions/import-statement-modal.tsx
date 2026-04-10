"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileCheck,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  Tag,
} from "lucide-react";
import { parseBankStatement, ParsedTransaction, ParseResult } from "@/lib/statement-parser";
import { transactionApi } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";

interface ImportStatementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  ledgers: Array<{ id: string; name: string }>;
}

export function ImportStatementModal({
  open,
  onOpenChange,
  onSuccess,
  ledgers,
}: ImportStatementModalProps) {
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [selectedLedger, setSelectedLedger] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'credit' | 'cash'>('bank');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParseResult(null);
      setStep('upload');
    }
  };

  const handleParseFile = async () => {
    if (!file) return;

    setIsParsing(true);
    try {
      const result = await parseBankStatement(file);
      setParseResult(result);
      
      if (result.success && result.transactions.length > 0) {
        setStep('preview');
        toast({
          title: "File parsed successfully! ✅",
          description: `Found ${result.transactions.length} transactions. Review and confirm to import.`,
          className: "bg-green-50 border-green-200 text-green-900",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Parsing failed",
          description: result.errors[0] || "Could not parse the file",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to parse file",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parseResult || !parseResult.transactions.length) return;

    setIsImporting(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const tx of parseResult.transactions) {
        try {
          await transactionApi.create({
            description: tx.description,
            amount: tx.amount,
            date: tx.date,
            type: tx.type,
            category: tx.category,
            paymentMethod: paymentMethod,
            ledgerId: selectedLedger || undefined,
          });
          successCount++;
        } catch (error) {
          console.error('Failed to import transaction:', tx, error);
          failCount++;
        }
      }

      setStep('complete');
      
      toast({
        title: "Import Complete! 🎉",
        description: `Successfully imported ${successCount} transactions${failCount > 0 ? `. ${failCount} failed.` : '.'}`,
        className: "bg-green-50 border-green-200 text-green-900",
      });

      // Call success callback to refresh transactions list
      onSuccess();

      // Close modal after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message || "Could not import transactions",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setStep('upload');
    setSelectedLedger("");
    setPaymentMethod('bank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-indigo-600" />
            Import Bank Statement
          </DialogTitle>
          <DialogDescription>
            Upload your CSV or PDF bank statement to automatically import transactions
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload Statement</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    accept=".csv,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV or PDF (Max 10MB)</p>
                  </label>
                </div>
                
                {file && (
                  <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium flex-1">{file.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                )}
              </div>

              {/* Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ledger (Optional)</Label>
                  <Select value={selectedLedger} onValueChange={setSelectedLedger}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ledger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {ledgers.map((ledger) => (
                        <SelectItem key={ledger.id} value={ledger.id}>
                          {ledger.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Supported Formats */}
              <Card className="bg-blue-50/50 border-blue-100">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800 space-y-1">
                      <p className="font-medium">Supported formats:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li><strong>CSV:</strong> Automatically detects date, description, debit, credit columns</li>
                        <li><strong>PDF:</strong> Basic text extraction (works best with text-based PDFs)</li>
                      </ul>
                      <p className="mt-2">For best results, use CSV format from your bank's portal.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleParseFile}
                disabled={!file || isParsing}
                className="w-full"
                size="lg"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing file...
                  </>
                ) : (
                  <>
                    <FileCheck className="mr-2 h-4 w-4" />
                    Parse & Preview
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'preview' && parseResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {parseResult.summary.totalRows}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total Rows</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {parseResult.summary.successfulImports}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Valid</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {parseResult.summary.failedRows}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Failed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 mb-2">
                          {parseResult.errors.length} Error(s) Found
                        </p>
                        <ScrollArea className="h-20">
                          <ul className="text-xs text-red-800 space-y-1">
                            {parseResult.errors.slice(0, 10).map((error, idx) => (
                              <li key={idx}>• {error}</li>
                            ))}
                            {parseResult.errors.length > 10 && (
                              <li className="font-medium">...and {parseResult.errors.length - 10} more</li>
                            )}
                          </ul>
                        </ScrollArea>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transaction Preview */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Transaction Preview ({parseResult.transactions.length})
                </h3>
                <ScrollArea className="h-96 border rounded-lg">
                  <div className="space-y-2 p-4">
                    {parseResult.transactions.slice(0, 50).map((tx, idx) => (
                      <Card key={idx} className="hover:bg-gray-50 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {tx.type === 'income' ? (
                                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                                )}
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {tx.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {tx.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {tx.category}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${
                                tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                              </p>
                              <Badge
                                variant={tx.type === 'income' ? 'default' : 'secondary'}
                                className="text-[10px] mt-1"
                              >
                                {tx.type}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {parseResult.transactions.length > 50 && (
                      <p className="text-xs text-center text-gray-500 py-2">
                        Showing first 50 of {parseResult.transactions.length} transactions
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('upload')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isImporting || parseResult.transactions.length === 0}
                  className="flex-1"
                  size="lg"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm & Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Import Successful!
                </h3>
                <p className="text-sm text-gray-500">
                  {parseResult?.summary.successfulImports} transactions have been imported
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
