'use client';

import React, { useState } from 'react';
import { invoiceAIService } from '@/lib/ai/instruction-parser';
import { ExtractedInvoiceData } from '@/types/ai';
import { Sparkles, Check, AlertCircle, ArrowRight, X } from 'lucide-react';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ExtractedInvoiceData) => void;
  defaultCurrency?: string;
}

export const AIInstructionModal: React.FC<AIModalProps> = ({
  isOpen,
  onClose,
  onApply,
  defaultCurrency = 'USD'
}) => {
  const [instruction, setInstruction] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!instruction.trim()) return;
    setIsParsing(true);
    try {
      const result = await invoiceAIService.parseInvoiceInstruction(instruction, defaultCurrency);
      setExtractedData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyToInvoice = () => {
    if (extractedData) {
      onApply(extractedData);
      onClose();
    }
  };

  const samplePrompts = [
    "Create an invoice for Almas. Add one bouquet for Rs. 2500 and one bento cake for Rs. 1500. Delivery charges Rs. 400. No payment has been received.",
    "Bill to Apex Ventures for 1 Brand Identity Package at $4500 and 2 Design Sprints at $1200. Add 10% discount.",
    "Create invoice for Elena Rostova. Add 1 Web Application UI at $6200. Deposit of $3000 received."
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6254E8] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171B32]">Natural Language Invoice Creator</h3>
              <p className="text-[11px] text-slate-500">
                Rule-based local parser with transparent field recognition. No external AI keys required.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Input Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Enter your invoice request in plain English:
            </label>
            <textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Create an invoice for Almas. Add one bouquet for Rs. 2500 and one bento cake for Rs. 1500. Delivery charges Rs. 400."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-[#6254E8] focus:ring-1 focus:ring-[#6254E8] outline-hidden text-slate-800 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Quick sample chips */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Try an example:</p>
            <div className="space-y-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInstruction(p)}
                  className="text-left w-full text-[11px] text-slate-600 bg-slate-100 hover:bg-[#D9D4FF]/30 hover:text-[#6254E8] p-2 rounded-lg transition-colors border border-slate-200/60"
                >
                  &quot;{p}&quot;
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleParse}
              disabled={isParsing || !instruction.trim()}
              className="w-full py-2.5 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isParsing ? 'Analyzing Instruction...' : 'Analyze & Extract Fields'}</span>
            </button>
          </div>

          {/* Extracted Results Preview */}
          {extractedData && (
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800">Extraction Results</span>
                <span className="text-[11px] font-bold text-[#6254E8] bg-[#D9D4FF]/40 px-2 py-0.5 rounded-full">
                  Confidence: {Math.round(extractedData.confidenceScore * 100)}%
                </span>
              </div>

              {/* Recognized fields list */}
              {extractedData.recognizedFields.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                    ✓ Confirmed Fields:
                  </p>
                  <ul className="text-xs space-y-1 text-slate-700">
                    {extractedData.recognizedFields.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing or unparsed alerts */}
              {extractedData.missingFields.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-bold">Missing details: </span>
                    <span>{extractedData.missingFields.join(', ')}. You can fill them in the editor.</span>
                  </div>
                </div>
              )}

              {extractedData.unparsedSegments.length > 0 && (
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 text-[11px]">
                  <span className="font-semibold text-slate-700">Unparsed text: </span>
                  <span>{extractedData.unparsedSegments.join('; ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            Next backend phase: Connects to live Gemini / Claude API endpoint.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            {extractedData && (
              <button
                onClick={handleApplyToInvoice}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-xs"
              >
                <span>Apply to Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
