import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Package, Search, ChevronRight, ChevronLeft, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Category, Fabric, StyleOption } from '../types';
import { GENDER_OPTIONS, OCCASION_OPTIONS } from '../types';
import Modal from '../components/Modal';

const OCCASION_LABELS: Record<string, string> = {
  'social-events-celebrations': 'Social Events & Celebrations',
  casual: 'Casual',
  corporate: 'Corporate',
  burial: 'Burial',
  wedding: 'Wedding',
};

function slugify(t: string) {
  return t.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  base_price: string;
  production_days: string;
  gender: Product['gender'];
  occasion: Product['occasion'];
  selectedCategories: string[];
  selectedFabrics: string[];
  styleOptions: StyleOption[];
  defaultStyle: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  is_active: boolean;
}

const emptyForm: ProductForm = {
  name: '', slug: '', description: '', base_price: '', production_days: '7',
  gender: 'unisex', occasion: 'casual', selectedCategories: [], selectedFabrics: [],
  styleOptions: [], defaultStyle: '', seoTitle: '', seoDescription: '', seoKeywords: '',
  is_active: true,
};

const STEPS = ['Basic Info', 'Attributes', 'Fabrics & Categories', 'Style Options', 'SEO'];

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all ${i < step ? 'bg-[#C8521A] text-white' : i === step ? 'bg-[#1C1916] text-white' : 'bg-[#E5DFD5] text-[#9A8F87]'}`}>
            {i + 1}
          </div>
          {i < total - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-[#C8521A]' : 'bg-[#E5DFD5]'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allFabrics, setAllFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: prods }, { data: cats }, { data: fabs }] = await Promise.all([
      supabase.from('products').select(`*, product_categories(category_id, categories(id, name, slug)), product_fabrics(fabric_id, fabrics(id, color_name, color_code, image_url))`).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('fabrics').select('*').order('color_name'),
    ]);
    const mapped = ((prods as any[]) || []).map(p => ({
      ...p,
      categories: (p.product_categories || []).map((pc: any) => pc.categories).filter(Boolean),
      fabrics: (p.product_fabrics || []).map((pf: any) => pf.fabrics).filter(Boolean),
    })) as Product[];
    setProducts(mapped);
    setAllCategories((cats as Category[]) || []);
    setAllFabrics((fabs as Fabric[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setStep(0);
    setError('');
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description,
      base_price: String(p.base_price),
      production_days: String(p.production_days),
      gender: p.gender,
      occasion: p.occasion,
      selectedCategories: (p.categories || []).map(c => c.id),
      selectedFabrics: (p.fabrics || []).map(f => f.id),
      styleOptions: p.style_options || [],
      defaultStyle: p.default_style || '',
      seoTitle: p.seo_meta?.title || '',
      seoDescription: p.seo_meta?.description || '',
      seoKeywords: (p.seo_meta?.keywords || []).join(', '),
      is_active: p.is_active,
    });
    setStep(0);
    setError('');
    setShowModal(true);
  }

  function setField<K extends keyof ProductForm>(k: K, v: ProductForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function validateStep(): boolean {
    setError('');
    if (step === 0) {
      if (!form.name.trim()) { setError('Product name is required'); return false; }
      if (!form.description.trim()) { setError('Description is required'); return false; }
      if (!form.base_price || Number(form.base_price) < 0) { setError('Valid base price required'); return false; }
      if (!form.production_days || Number(form.production_days) < 1) { setError('Production days must be at least 1'); return false; }
    }
    if (step === 2) {
      if (form.selectedCategories.length === 0) { setError('Select at least one category'); return false; }
    }
    return true;
  }

  function nextStep() {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  function addStyleOption() {
    setForm(f => ({ ...f, styleOptions: [...f.styleOptions, { name: '', options: [] }] }));
  }

  function updateStyleOption(i: number, key: keyof StyleOption, val: string | string[]) {
    setForm(f => {
      const opts = [...f.styleOptions];
      opts[i] = { ...opts[i], [key]: val };
      return { ...f, styleOptions: opts };
    });
  }

  function removeStyleOption(i: number) {
    setForm(f => ({ ...f, styleOptions: f.styleOptions.filter((_, j) => j !== i) }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim(),
      base_price: Number(form.base_price),
      production_days: Number(form.production_days),
      gender: form.gender,
      occasion: form.occasion,
      style_options: form.styleOptions,
      default_style: form.defaultStyle || null,
      seo_meta: {
        title: form.seoTitle || form.name,
        description: form.seoDescription,
        keywords: form.seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
      },
      is_active: form.is_active,
    };

    let productId = editing?.id;

    if (!editing) {
      const { data, error: err } = await supabase.from('products').insert(payload).select('id').single();
      if (err) { setError(err.message); setSaving(false); return; }
      productId = data.id;
    } else {
      const { error: err } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
      await supabase.from('product_categories').delete().eq('product_id', editing.id);
      await supabase.from('product_fabrics').delete().eq('product_id', editing.id);
    }

    if (form.selectedCategories.length > 0) {
      await supabase.from('product_categories').insert(
        form.selectedCategories.map(cid => ({ product_id: productId, category_id: cid }))
      );
    }
    if (form.selectedFabrics.length > 0) {
      await supabase.from('product_fabrics').insert(
        form.selectedFabrics.map(fid => ({ product_id: productId, fabric_id: fid }))
      );
    }

    setSaving(false);
    setShowModal(false);
    load();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await supabase.from('products').delete().eq('id', deleteId);
    setDeleteId(null);
    load();
  }

  async function toggleActive(p: Product) {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id);
    load();
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.gender.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCat = (id: string) => setField('selectedCategories', form.selectedCategories.includes(id) ? form.selectedCategories.filter(c => c !== id) : [...form.selectedCategories, id]);
  const toggleFab = (id: string) => setField('selectedFabrics', form.selectedFabrics.includes(id) ? form.selectedFabrics.filter(f => f !== id) : [...form.selectedFabrics, id]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1C1916]" style={{ fontFamily: "'Georgia', serif" }}>Products</h2>
          <p className="text-sm text-[#6B6460] mt-0.5">{products.length} total · {products.filter(p => p.is_active).length} active</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#C8521A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#b04817] transition-colors self-start sm:self-auto">
          <Plus size={16} />
          New Product
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8F87]" />
        <input type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DFD5] rounded-xl text-sm text-[#1C1916] placeholder-[#9A8F87] focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
      </div>

      <div className="bg-white rounded-2xl border border-[#E5DFD5] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#9A8F87]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Package size={32} className="text-[#E5DFD5] mx-auto mb-3" />
            <p className="text-sm text-[#9A8F87]">No products yet. Create your first product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E5DFD5] bg-[#FAF8F5]">
                  <th className="text-left text-xs font-semibold text-[#6B6460] px-5 py-3">Product</th>
                  <th className="text-left text-xs font-semibold text-[#6B6460] px-5 py-3">Price</th>
                  <th className="text-left text-xs font-semibold text-[#6B6460] px-5 py-3">Gender</th>
                  <th className="text-left text-xs font-semibold text-[#6B6460] px-5 py-3">Occasion</th>
                  <th className="text-left text-xs font-semibold text-[#6B6460] px-5 py-3">Days</th>
                  <th className="text-left text-xs font-semibold text-[#6B6460] px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-[#F7F3EC] last:border-0 hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-5 py-4">
                      <button onClick={() => setViewProduct(p)} className="text-left">
                        <p className="text-sm font-medium text-[#1C1916] hover:text-[#C8521A] transition-colors">{p.name}</p>
                        <p className="text-xs text-[#9A8F87] mt-0.5">{(p.categories || []).map(c => c.name).join(', ') || 'No categories'}</p>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#1C1916]">₦{p.base_price.toLocaleString()}</td>
                    <td className="px-5 py-4"><span className="text-xs bg-[#F7F3EC] text-[#6B6460] px-2 py-1 rounded-md capitalize">{p.gender}</span></td>
                    <td className="px-5 py-4 text-xs text-[#6B6460]">{OCCASION_LABELS[p.occasion] || p.occasion}</td>
                    <td className="px-5 py-4 text-xs text-[#6B6460]">{p.production_days}d</td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActive(p)} className="flex items-center gap-1.5 text-xs font-medium transition-colors">
                        {p.is_active ? <><ToggleRight size={18} className="text-[#C8521A]" /><span className="text-[#C8521A]">Active</span></> : <><ToggleLeft size={18} className="text-[#9A8F87]" /><span className="text-[#9A8F87]">Inactive</span></>}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-[#6B6460] hover:bg-[#F7F3EC] hover:text-[#C8521A] transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-[#6B6460] hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product form modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Product' : 'New Product'} onClose={() => setShowModal(false)} size="xl">
          <StepIndicator step={step} total={STEPS.length} />
          <p className="text-xs font-semibold text-[#C8521A] uppercase tracking-wider mb-4">{STEPS[step]}</p>

          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Product Name <span className="text-[#C8521A]">*</span></label>
                <input type="text" value={form.name} onChange={e => { setField('name', e.target.value); setField('slug', slugify(e.target.value)); }} placeholder="e.g. Classic Agbada Set" className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Slug</label>
                <input type="text" value={form.slug} onChange={e => setField('slug', e.target.value)} placeholder="auto-generated" className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm bg-[#FAF8F5] text-[#6B6460] focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Description <span className="text-[#C8521A]">*</span></label>
                <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={4} placeholder="Describe the product, its features and craftsmanship…" className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Base Price (₦) <span className="text-[#C8521A]">*</span></label>
                  <input type="number" min="0" value={form.base_price} onChange={e => setField('base_price', e.target.value)} placeholder="120000" className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Production Days <span className="text-[#C8521A]">*</span></label>
                  <input type="number" min="1" value={form.production_days} onChange={e => setField('production_days', e.target.value)} className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setField('is_active', e.target.checked)} className="w-4 h-4 accent-[#C8521A]" />
                <label htmlFor="is_active" className="text-sm text-[#1C1916] cursor-pointer">Active (visible to customers)</label>
              </div>
            </div>
          )}

          {/* Step 1: Attributes */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1916] mb-2">Gender <span className="text-[#C8521A]">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GENDER_OPTIONS.map(g => (
                    <button key={g} onClick={() => setField('gender', g)} className={`py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${form.gender === g ? 'bg-[#1C1916] text-white border-[#1C1916]' : 'border-[#E5DFD5] text-[#6B6460] hover:border-[#1C1916]'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1C1916] mb-2">Occasion <span className="text-[#C8521A]">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OCCASION_OPTIONS.map(o => (
                    <button key={o} onClick={() => setField('occasion', o)} className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all text-left ${form.occasion === o ? 'bg-[#C8521A] text-white border-[#C8521A]' : 'border-[#E5DFD5] text-[#6B6460] hover:border-[#C8521A]'}`}>
                      {OCCASION_LABELS[o]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fabrics & Categories */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#1C1916] mb-2">Categories <span className="text-[#C8521A]">*</span> <span className="text-[#9A8F87] font-normal">({form.selectedCategories.length} selected)</span></label>
                {allCategories.length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-xl">No categories found. Please create categories first.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allCategories.map(c => {
                      const sel = form.selectedCategories.includes(c.id);
                      return (
                        <button key={c.id} onClick={() => toggleCat(c.id)} className={`py-2 px-3 rounded-xl text-sm border transition-all text-left ${sel ? 'bg-[#1C1916] text-white border-[#1C1916]' : 'border-[#E5DFD5] text-[#6B6460] hover:border-[#1C1916]'}`}>
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1C1916] mb-2">Fabrics <span className="text-[#9A8F87] font-normal">({form.selectedFabrics.length} selected)</span></label>
                {allFabrics.length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-xl">No fabrics found. Please create fabrics first.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {allFabrics.map(f => {
                      const sel = form.selectedFabrics.includes(f.id);
                      return (
                        <button key={f.id} onClick={() => toggleFab(f.id)} className={`flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm border transition-all text-left ${sel ? 'bg-[#F7F3EC] border-[#C8521A]' : 'border-[#E5DFD5] hover:border-[#C8521A]'}`}>
                          <div className="w-6 h-6 rounded-md flex-shrink-0 border border-[#E5DFD5] bg-[#F7F3EC] overflow-hidden">
                            <img src={f.image_url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                          <span className={`text-xs font-medium truncate ${sel ? 'text-[#C8521A]' : 'text-[#6B6460]'}`}>{f.color_name}</span>
                          {f.color_code && <span className="w-3 h-3 rounded-full flex-shrink-0 ml-auto" style={{ backgroundColor: f.color_code }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Style Options */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#6B6460]">Define style variations customers can choose from.</p>
                <button onClick={addStyleOption} className="flex items-center gap-1.5 text-xs font-semibold text-[#C8521A] hover:underline">
                  <Plus size={14} /> Add Option Group
                </button>
              </div>
              {form.styleOptions.length === 0 ? (
                <div className="border-2 border-dashed border-[#E5DFD5] rounded-xl p-6 text-center text-sm text-[#9A8F87]">
                  No style options yet. Click "Add Option Group" to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.styleOptions.map((so, i) => (
                    <div key={i} className="border border-[#E5DFD5] rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <input type="text" value={so.name} onChange={e => updateStyleOption(i, 'name', e.target.value)} placeholder="Option group name (e.g. Sleeve Style)" className="flex-1 border border-[#E5DFD5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
                        <button onClick={() => removeStyleOption(i)} className="p-1.5 rounded-lg text-[#9A8F87] hover:text-red-600 hover:bg-red-50 transition-colors"><X size={14} /></button>
                      </div>
                      <div>
                        <label className="block text-xs text-[#6B6460] mb-1">Options (comma separated)</label>
                        <input type="text" value={so.options.join(', ')} onChange={e => updateStyleOption(i, 'options', e.target.value.split(',').map(v => v.trim()).filter(Boolean))} placeholder="Short, Long, Three-quarter" className="w-full border border-[#E5DFD5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {form.styleOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Default Style</label>
                  <input type="text" value={form.defaultStyle} onChange={e => setField('defaultStyle', e.target.value)} placeholder="Name of the default style option" className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
                </div>
              )}
            </div>
          )}

          {/* Step 4: SEO */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">SEO Title</label>
                <input type="text" value={form.seoTitle} onChange={e => setField('seoTitle', e.target.value)} placeholder={form.name || 'Product title for search engines'} className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">SEO Description</label>
                <textarea value={form.seoDescription} onChange={e => setField('seoDescription', e.target.value)} rows={3} placeholder="Brief description for search engine results…" className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A] resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1C1916] mb-1.5">Keywords</label>
                <input type="text" value={form.seoKeywords} onChange={e => setField('seoKeywords', e.target.value)} placeholder="agbada, ankara, custom, nigerian fashion (comma separated)" className="w-full border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8521A]/30 focus:border-[#C8521A]" />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

          <div className="flex gap-3 mt-6 pt-4 border-t border-[#F7F3EC]">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 border border-[#E5DFD5] text-[#6B6460] rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#F7F3EC] transition-colors">
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <div className="flex-1" />
            {step < STEPS.length - 1 ? (
              <button onClick={nextStep} className="flex items-center gap-1.5 bg-[#1C1916] text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-[#2E2A27] transition-colors">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving} className="bg-[#C8521A] text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-[#b04817] transition-colors disabled:opacity-60">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Product'}
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* View product detail */}
      {viewProduct && (
        <Modal title={viewProduct.name} onClose={() => setViewProduct(null)} size="lg">
          <div className="space-y-4 text-sm">
            <p className="text-[#6B6460]">{viewProduct.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F7F3EC] rounded-xl p-3">
                <p className="text-xs text-[#9A8F87]">Base Price</p>
                <p className="font-bold text-[#1C1916] text-lg" style={{ fontFamily: "'Georgia', serif" }}>₦{viewProduct.base_price.toLocaleString()}</p>
              </div>
              <div className="bg-[#F7F3EC] rounded-xl p-3">
                <p className="text-xs text-[#9A8F87]">Production Time</p>
                <p className="font-bold text-[#1C1916] text-lg" style={{ fontFamily: "'Georgia', serif" }}>{viewProduct.production_days} days</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#1C1916] text-white text-xs px-2.5 py-1 rounded-full capitalize">{viewProduct.gender}</span>
              <span className="bg-[#C8521A] text-white text-xs px-2.5 py-1 rounded-full">{OCCASION_LABELS[viewProduct.occasion]}</span>
              {viewProduct.is_active ? <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full">Active</span> : <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">Inactive</span>}
            </div>
            {(viewProduct.categories || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#1C1916] mb-1.5">Categories</p>
                <div className="flex flex-wrap gap-1.5">{(viewProduct.categories || []).map(c => <span key={c.id} className="text-xs bg-[#F7F3EC] text-[#6B6460] px-2.5 py-1 rounded-full">{c.name}</span>)}</div>
              </div>
            )}
            {(viewProduct.fabrics || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#1C1916] mb-1.5">Fabrics ({viewProduct.fabrics!.length})</p>
                <div className="flex flex-wrap gap-2">{(viewProduct.fabrics || []).map(f => (
                  <div key={f.id} className="flex items-center gap-1.5 bg-[#F7F3EC] rounded-full px-2.5 py-1">
                    {f.color_code && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color_code }} />}
                    <span className="text-xs text-[#6B6460]">{f.color_name}</span>
                  </div>
                ))}</div>
              </div>
            )}
            {(viewProduct.style_options || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#1C1916] mb-1.5">Style Options</p>
                {viewProduct.style_options.map((so, i) => (
                  <div key={i} className="mb-2">
                    <p className="text-xs text-[#9A8F87]">{so.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">{so.options.map(o => <span key={o} className="text-xs bg-[#F7F3EC] text-[#6B6460] px-2 py-0.5 rounded-md">{o}</span>)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Product" onClose={() => setDeleteId(null)} size="sm">
          <p className="text-sm text-[#6B6460] mb-5">This will permanently delete this product and all its associations.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="flex-1 border border-[#E5DFD5] text-[#6B6460] rounded-xl py-2.5 text-sm font-medium hover:bg-[#F7F3EC] transition-colors">Cancel</button>
            <button onClick={handleDelete} className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 transition-colors">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
