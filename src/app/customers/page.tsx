'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { customerRepo } from '@/repositories/customer.repo';
import { invoiceRepo } from '@/repositories/invoice.repo';
import { workspaceRepo } from '@/repositories/workspace.repo';
import { formatCurrency } from '@/lib/calculations/engine';
import { Customer } from '@/types/customer';
import { Invoice } from '@/types/invoice';
import { Workspace } from '@/types/workspace';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  Trash2,
  Edit2,
  X,
  FileText,
  DollarSign
} from 'lucide-react';

export default function CustomersPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    const ws = await workspaceRepo.getActiveWorkspace();
    if (ws) {
      setWorkspace(ws);
      const [cList, iList] = await Promise.all([
        customerRepo.getCustomers(ws.id),
        invoiceRepo.getInvoices(ws.id)
      ]);
      setCustomers(cList);
      setInvoices(iList);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currency = workspace?.currency || 'USD';

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setCompanyName('');
    setPhone('');
    setTaxId('');
    setLine1('');
    setCity('');
    setCountry('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setEmail(c.email);
    setCompanyName(c.companyName || '');
    setPhone(c.phone || '');
    setTaxId(c.taxId || '');
    setLine1(c.address.line1 || '');
    setCity(c.address.city || '');
    setCountry(c.address.country || '');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspace) return;

    if (editingCustomer) {
      await customerRepo.saveCustomer({
        ...editingCustomer,
        name,
        email,
        companyName,
        phone,
        taxId,
        address: {
          ...editingCustomer.address,
          line1,
          city,
          country
        },
        notes
      });
    } else {
      await customerRepo.createCustomer({
        workspaceId: workspace.id,
        name,
        email,
        companyName,
        phone,
        taxId,
        address: {
          line1,
          city,
          country
        },
        notes
      });
    }

    setIsModalOpen(false);
    await loadData();
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (confirm(`Delete customer ${customerName}? Existing invoices will retain their historical records.`)) {
      await customerRepo.deleteCustomer(id);
      await loadData();
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#E6E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#171B32] tracking-tight">Customers Directory</h1>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {customers.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage client billing profiles, contact details, and view outstanding balances.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#6254E8]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-[#E6E8F0] shadow-xs">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-[#6254E8]"
            />
          </div>
        </div>

        {/* Customer Cards Grid */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E6E8F0] p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No customers found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add client profiles to quickly autofill addresses, emails, and payment terms during invoice creation.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 bg-[#6254E8] text-white text-xs font-semibold px-4 py-2 rounded-xl mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((c) => {
              const custInvoices = invoices.filter((i) => i.customerId === c.id || i.customer.email === c.email);
              const totalBilled = custInvoices.reduce((acc, i) => acc + i.total, 0);
              const totalDue = custInvoices.reduce((acc, i) => acc + i.balanceDue, 0);

              return (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-2xl border border-[#E6E8F0] shadow-xs hover:border-[#6254E8]/50 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                        {c.companyName && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{c.companyName}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-400 hover:text-[#6254E8] rounded-lg hover:bg-slate-50"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      {c.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.address?.city && (
                        <p className="text-[11px] text-slate-400 pl-5">
                          {[c.address.line1, c.address.city, c.address.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total Invoiced</span>
                      <p className="font-bold text-slate-800">{formatCurrency(totalBilled, currency)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Balance Due</span>
                      <p className="font-bold" style={{ color: totalDue > 0 ? '#6254E8' : '#10B981' }}>
                        {formatCurrency(totalDue, currency)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Add/Edit Customer */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer / Contact Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Almas Rahman"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Company / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Ventures"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="client@apex.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      placeholder="100 Montgomery St"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">City / Country</label>
                    <input
                      type="text"
                      placeholder="San Francisco, US"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tax Registration / VAT ID</label>
                  <input
                    type="text"
                    placeholder="e.g. US-EIN-88-2938102"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                  />
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
                    {editingCustomer ? 'Save Changes' : 'Create Customer'}
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
