'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { productRepo } from '@/repositories/product.repo';
import { workspaceRepo } from '@/repositories/workspace.repo';
import { formatCurrency } from '@/lib/calculations/engine';
import { Product } from '@/types/product';
import { Workspace } from '@/types/workspace';
import {
  Package,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  X,
  FileText,
  DollarSign
} from 'lucide-react';

export default function ProductsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [taxRate, setTaxRate] = useState<number>(0);

  const loadData = async () => {
    const ws = await workspaceRepo.getActiveWorkspace();
    if (ws) {
      setWorkspace(ws);
      const list = await productRepo.getProducts(ws.id);
      setProducts(list);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currency = workspace?.currency || 'USD';

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setUnitPrice(0);
    setCategory('Services');
    setSku('');
    setTaxRate(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setUnitPrice(p.unitPrice);
    setCategory(p.category || 'Services');
    setSku(p.sku || '');
    setTaxRate(p.taxRate || 0);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspace) return;

    if (editingProduct) {
      await productRepo.saveProduct({
        ...editingProduct,
        name,
        description,
        unitPrice,
        category,
        sku,
        taxRate,
        currency
      });
    } else {
      await productRepo.createProduct({
        workspaceId: workspace.id,
        name,
        description,
        unitPrice,
        category,
        sku,
        taxRate,
        currency
      });
    }

    setIsModalOpen(false);
    await loadData();
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (confirm(`Remove ${prodName} from catalog? Existing invoices will not be modified.`)) {
      await productRepo.deleteProduct(id);
      await loadData();
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#E6E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#171B32] tracking-tight">Products & Services</h1>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {products.length} Items
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Standardize your billable offerings, default pricing, descriptions, and tax rates.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#6254E8]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item / Service</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-[#E6E8F0] shadow-xs">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-[#6254E8]"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-[#E6E8F0] shadow-xs overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No products or services saved</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Save commonly invoiced items, hourly rates, or packages to add them with one click in the invoice editor.
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 bg-[#6254E8] text-white text-xs font-semibold px-4 py-2 rounded-xl mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#F8F9FC] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-5">Name & Description</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5">SKU / Code</th>
                    <th className="py-3.5 px-5">Default Rate</th>
                    <th className="py-3.5 px-5">Tax Rate</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        {p.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{p.description}</p>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {p.category && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span>{p.category}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-mono text-[11px]">
                        {p.sku || '—'}
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-900">
                        {formatCurrency(p.unitPrice, p.currency || currency)}
                      </td>
                      <td className="py-4 px-5 text-slate-600">
                        {p.taxRate ? `${p.taxRate}%` : '0%'}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-[#6254E8] rounded-lg hover:bg-slate-100"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add/Edit Product */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingProduct ? 'Edit Catalog Item' : 'Add Item to Catalog'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Item / Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js Web App Design Sprint"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Detailed Description</label>
                  <textarea
                    rows={2}
                    placeholder="Summary of deliverables, specifications, or milestone scope..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit Price ({currency}) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Default Tax Rate (%)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Design Services, Development"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">SKU / Service Code</label>
                    <input
                      type="text"
                      placeholder="e.g. SRV-DES-01"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#6254E8] hover:bg-[#5244d4] text-white font-bold rounded-xl shadow-xs"
                  >
                    {editingProduct ? 'Save Changes' : 'Create Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
