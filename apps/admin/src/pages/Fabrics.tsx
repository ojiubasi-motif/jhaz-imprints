import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Scissors, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Fabric } from '../types';
import { UNIT_OPTIONS } from '../types';
import Modal from '../components/Modal';

type FabricForm = Omit<Fabric, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: FabricForm = {
  color_name: '',
  color_code: '',
  image_url: '',
  unit: 'yard',
  yards_per_unit: 1,
  price_modifier: 0,
  in_stock: true,
  stock_level: null,
  is_active: true,
};

export default function Fabrics() {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Fabric | null>(null);
  const [form, setForm] = useState<FabricForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('fabrics').select('*').order('color_name');
    setFabrics((data as Fabric[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setError('');
    setModal('create');
  }

  function openEdit(f: Fabric) {
    setEditing(f);
    setForm({
      color_name: f.color_name,
      color_code: f.color_code || '',
      image_url: f.image_url,
      unit: f.unit,
      yards_per_unit: f.yards_per_unit,
      price_modifier: f.price_modifier,
      in_stock: f.in_stock,
      stock_level: f.stock_level,
      is_active: f.is_active,
    });
    setError('');
    setModal('edit');
  }

  function setField<K extends keyof FabricForm>(key: K, val: FabricForm[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!form.color_name.trim()) { setError('Color name is required'); return; }
    if (!form.image_url.trim()) { setError('Image URL is required'); return; }
    if (form.color_code && !/^#[0-9A-Fa-f]{6}$/.test(form.color_code)) {
      setError('Color code must be a valid hex e.g. #4169E1');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      color_name: form.color_name.trim(),
      color_code: form.color_code || null,
      image_url: form.image_url.trim(),
      unit: form.unit,
      yards_per_unit: Number(form.yards_per_unit),
      price_modifier: Number(form.price_modifier),
      in_stock: form.in_stock,
      stock_level: form.stock_level !== null ? Number(form.stock_level) : null,
      is_active: form.is_active,
    };
    if (modal === 'create') {
      const { error: err } = await supabase.from('fabrics').insert(payload);
      if (err) { setError(err.message); setSaving(false); return; }
    } else if (editing) {
      const { error: err } = await supabase.from('fabrics').update(payload).eq('id', editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
    }
    setSaving(false);
    setModal(null);
    load();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await supabase.from('fabrics').delete().eq('id', deleteId);
    setDeleteId(null);
    load();
  }

  async function toggleActive(f: Fabric) {
    await supabase.from('fabrics').update({ is_active: !f.is_active }).eq('id', f.id);
    load();
  }

  const filtered = fabrics.filter(f =>
    f.color_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1C1916]" style={{ fontFamily: "'Georgia', serif" }}>Fabrics</h2>
          <p className="text-sm text-[#6B6460] mt-0.5">{fabrics.length} total · {fabrics.filter(f => f.is_active).length} active</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#C8521A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#b04817] transition-colors self-start sm:self-auto"
        >
          <Plus size={16} />
          New Fabric
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8F87]" />
        <input
          type="text"
          placeholder="Search fabrics…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DFD5] rounded-xl text-sm text-[#1C1916] placeholder-[#9A8F87] focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]"
        />
      </div>

      <div className="bg-white rounded-2xl border border-[#E5DFD5] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#9A8F87]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Scissors size={32} className="text-[#E5DFD5] mx-auto mb-3" />
            <p className="text-sm text-[#9A8F87]">No fabrics found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E5DFD5] bg-[#FAF8F5]">
                  <th className="text-left text-xs font-semibold text-[#6B6460] px-5 py-3">Fabric</th>
                  <th className="text-left text-xs font-semibold text-[#6B6460] px-5 py-3">Unit</th>
                  <th className="text-left text-xs font-semibold text-[#6B6460] px-5 py-3">Price Modifier</th>
                  <th className="text-left text-xs font-semibold text-[#6B6460] px-5 py-3">Stock</th>
                  <th className="text-left text-xs font-semibold text-[#6B6460] px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id} className="border-b border-[#F7F3EC] last:border-0 hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#E5DFD5] flex-shrink-0 bg-[#F7F3EC]">
                          <img src={f.image_url} alt={f.color_name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          {f.color_code && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-tl-md border-t border-l border-[#E5DFD5]" style={{ backgroundColor: f.color_code }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1C1916]">{f.color_name}</p>
                          {f.color_code && <p className="text-xs text-[#9A8F87]">{f.color_code}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-[#F7F3EC] text-[#6B6460] px-2 py-1 rounded-md">{f.unit}</span>
                      <p className="text-xs text-[#9A8F87] mt-0.5">{f.yards_per_unit} per unit</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-[#1C1916]">
                      {f.price_modifier > 0 ? `+₦${f.price_modifier.toLocaleString()}` : '₦0'}
                    </td>
                    <td className="px-5 py-4">
                      {f.stock_level !== null ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.stock_level < 10 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                          {f.stock_level} {f.unit}
                        </span>
                      ) : (
                        <span className="text-xs text-[#9A8F87]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActive(f)} className="flex items-center gap-1.5 text-xs font-medium transition-colors">
                        {f.is_active ? (
                          <><ToggleRight size={18} className="text-[#C8521A]" /><span className="text-[#C8521A]">Active</span></>
                        ) : (
                          <><ToggleLeft size={18} className="text-[#9A8F87]" /><span className="text-[#9A8F87]">Inactive</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg text-[#6B6460] hover:bg-[#F7F3EC] hover:text-[#C8521A] transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(f.id)} className="p-1.5 rounded-lg text-[#6B6460] hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'New Fabric' : 'Edit Fabric'} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Color Name <span className="text-[#C8521A]">*</span></label>
              <input type="text" value={form.color_name} onChange={e => setField('color_name', e.target.value)} placeholder="e.g. Royal Blue Ankara" className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Color Code</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.color_code || '#ffffff'}
                  onChange={e => setField('color_code', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-[#E5DFD5] cursor-pointer p-0.5"
                />
                <input type="text" value={form.color_code || ''} onChange={e => setField('color_code', e.target.value)} placeholder="#4169E1" className="flex-1 border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Unit <span className="text-[#C8521A]">*</span></label>
              <select value={form.unit} onChange={e => setField('unit', e.target.value as Fabric['unit'])} className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]">
                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Image URL <span className="text-[#C8521A]">*</span></label>
              <input type="url" value={form.image_url} onChange={e => setField('image_url', e.target.value)} placeholder="https://images.pexels.com/…" className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Yards Per Unit</label>
              <input type="number" min="0.1" step="0.1" value={form.yards_per_unit} onChange={e => setField('yards_per_unit', Number(e.target.value))} className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Price Modifier (₦)</label>
              <input type="number" min="0" value={form.price_modifier} onChange={e => setField('price_modifier', Number(e.target.value))} className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Stock Level</label>
              <input type="number" min="0" value={form.stock_level ?? ''} onChange={e => setField('stock_level', e.target.value === '' ? null : Number(e.target.value))} placeholder="Leave blank if not tracked" className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
            </div>

            <div className="flex flex-col gap-3">
              <label className="block text-xs font-semibold text-[#1C1916]">Flags</label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.in_stock} onChange={e => setField('in_stock', e.target.checked)} className="w-4 h-4 accent-[#C8521A]" />
                <span className="text-sm text-[#1C1916]">In Stock</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setField('is_active', e.target.checked)} className="w-4 h-4 accent-[#C8521A]" />
                <span className="text-sm text-[#1C1916]">Active</span>
              </label>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 border border-[#E5DFD5] text-[#6B6460] rounded-xl py-2.5 text-sm font-medium hover:bg-[#F7F3EC] transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#C8521A] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#b04817] transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : modal === 'create' ? 'Create Fabric' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Fabric" onClose={() => setDeleteId(null)} size="sm">
          <p className="text-sm text-[#6B6460] mb-5">This will permanently delete this fabric. Products linked to it will lose the association.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="flex-1 border border-[#E5DFD5] text-[#6B6460] rounded-xl py-2.5 text-sm font-medium hover:bg-[#F7F3EC] transition-colors">Cancel</button>
            <button onClick={handleDelete} className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 transition-colors">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
