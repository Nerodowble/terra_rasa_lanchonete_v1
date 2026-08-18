import React, { useState, useRef } from 'react';
import { useComanda, cabecalhosAdmin } from '../../context/ComandaContext';
import { Product, CategoryId, PreparationStation } from '../../types';
import { formatBRL } from '../../utils/formatters';
import {
  Utensils,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Sparkles,
  Search,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  Flame,
  Wine,
  Leaf,
} from 'lucide-react';

export const MenuManagerView: React.FC = () => {
  const {
    products,
    categories,
    toggleProductAvailability,
    updateProductPrice,
    addProduct,
    updateProduct,
    deleteProduct,
    clearAllProducts,
  } = useComanda();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'lanches' as CategoryId,
    station: 'kitchen' as PreparationStation,
    prepTimeMinutes: '15',
    image: '',
    isVegetarian: false,
    isGlutenFree: false,
    isHighlight: false,
    badgeText: '',
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);

    try {
      const data = new FormData();
      data.append('photo', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: cabecalhosAdmin(false), // sem Content-Type: o FormData define o dele
        body: data,
      });

      if (!response.ok) {
        throw new Error('Falha no upload');
      }

      const result = await response.json();
      if (result.url) {
        setFormData(prev => ({ ...prev, image: result.url }));
      }
    } catch (err) {
      console.error('Erro no upload de foto:', err);
      alert('Não foi possível salvar a imagem. Verifique o arquivo e tente novamente.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: categories[0]?.id || 'lanches',
      station: 'kitchen',
      prepTimeMinutes: '15',
      image: '',
      isVegetarian: false,
      isGlutenFree: false,
      isHighlight: false,
      badgeText: '',
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
      category: product.category as CategoryId,
      station: product.station || 'kitchen',
      prepTimeMinutes: (product.prepTimeMinutes || 15).toString(),
      image: product.image || '',
      isVegetarian: !!product.isVegetarian,
      isGlutenFree: !!product.isGlutenFree,
      isHighlight: !!product.isHighlight,
      badgeText: product.badges?.[0] || '',
    });
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    const badges: string[] = [];
    if (formData.badgeText.trim()) badges.push(formData.badgeText.trim());
    if (formData.isHighlight && !badges.includes('Destaque')) badges.push('Destaque');

    const productPayload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price) || 0,
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      category: formData.category,
      station: formData.station,
      prepTimeMinutes: parseInt(formData.prepTimeMinutes, 10) || 15,
      image: formData.image.trim(),
      isAvailable: editingProduct ? editingProduct.isAvailable : true,
      badges,
      isVegetarian: formData.isVegetarian,
      isGlutenFree: formData.isGlutenFree,
      isHighlight: formData.isHighlight,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }

    setIsAddModalOpen(false);
    setEditingProduct(null);
  };

  const handleStartEditPrice = (product: Product) => {
    setEditingPriceId(product.id);
    setTempPrice(product.price.toString());
  };

  const handleSaveEditPrice = (productId: string) => {
    const val = parseFloat(tempPrice);
    if (!isNaN(val) && val >= 0) {
      updateProductPrice(productId, val);
    }
    setEditingPriceId(null);
  };

  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja apagar TODOS os itens do cardápio? Esta ação não pode ser desfeita.')) {
      clearAllProducts();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900 text-white p-5 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Gestão de Cardápio & Pratos</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                {products.length} {products.length === 1 ? 'item' : 'itens'}
              </span>
            </h1>
            <p className="text-xs text-stone-400">
              Cadastre novos pratos com fotos, ajuste preços, pause itens ou remova pratos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {products.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-rose-950/40 text-stone-300 hover:text-rose-300 border border-stone-700 hover:border-rose-700/50 text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Apagar todos os itens do cardápio"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Cardápio</span>
            </button>
          )}

          <button
            id="btn-add-new-product"
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-stone-950 font-black text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Prato</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar prato por nome ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map(c => {
            const count = products.filter(p => p.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === c.id
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-dashed border-stone-300 text-center space-y-4 max-w-xl mx-auto my-8 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Utensils className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-stone-900">Nenhum prato cadastrado ainda</h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
            O cardápio está limpo e pronto para receber seus itens personalizados com fotos e descrições.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Meu Primeiro Prato</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center space-y-2">
          <p className="text-sm font-bold text-stone-700">Nenhum item encontrado nesta busca.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
            }}
            className="text-xs text-amber-600 hover:underline font-bold"
          >
            Limpar filtros de busca
          </button>
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                product.isAvailable
                  ? 'border-stone-200'
                  : 'border-stone-300 bg-stone-50/80 opacity-80'
              }`}
            >
              <div>
                {/* Top row */}
                <div className="flex items-start gap-3 mb-3">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-stone-200 bg-stone-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl border border-stone-200 bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-black text-sm text-stone-900 leading-tight">
                        {product.name}
                      </h3>
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-1 text-stone-400 hover:text-amber-600 transition-colors cursor-pointer shrink-0"
                        title="Editar prato completo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                        {product.category}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 flex items-center gap-0.5">
                        {product.station === 'kitchen' ? (
                          <>
                            <Flame className="w-2.5 h-2.5 text-amber-500" />
                            Cozinha
                          </>
                        ) : (
                          <>
                            <Wine className="w-2.5 h-2.5 text-purple-500" />
                            Bar
                          </>
                        )}
                      </span>
                      {product.isVegetarian && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                          <Leaf className="w-2.5 h-2.5" /> Veg
                        </span>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer with price and status */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                {/* Price */}
                {editingPriceId === product.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-stone-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      value={tempPrice}
                      onChange={e => setTempPrice(e.target.value)}
                      className="w-20 px-2 py-1 text-xs font-bold border border-amber-400 rounded-lg bg-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEditPrice(product.id)}
                      className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingPriceId(null)}
                      className="p-1 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => handleStartEditPrice(product)}
                    className="flex items-baseline gap-1.5 text-stone-900 font-black text-sm cursor-pointer hover:text-amber-600 group"
                    title="Clique para editar o preço rápido"
                  >
                    <span>{formatBRL(product.price)}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-[10px] text-stone-400 line-through font-normal">
                        {formatBRL(product.originalPrice)}
                      </span>
                    )}
                    <Edit2 className="w-2.5 h-2.5 text-stone-400 opacity-0 group-hover:opacity-100" />
                  </div>
                )}

                {/* Pause / Activate item toggle & delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleProductAvailability(product.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                      product.isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${product.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{product.isAvailable ? 'Ativo' : 'Pausado'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Deseja excluir permanentemente o item "${product.name}"?`)) {
                        deleteProduct(product.id);
                      }
                    }}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-stone-100"
                    title="Excluir prato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-stone-200 max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-400" />
                <span>{editingProduct ? 'Editar Prato' : 'Cadastrar Novo Prato'}</span>
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 sm:p-5 space-y-4 overflow-y-auto text-stone-800 text-xs sm:text-sm">
              {/* Envio de foto */}
              <div className="border border-dashed border-stone-300 rounded-2xl p-3.5 bg-stone-50/50 flex flex-col items-center justify-center text-center space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  Foto do Prato
                </label>

                {formData.image ? (
                  <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border border-stone-300 bg-white shadow-xs">
                    <img
                      src={formData.image}
                      alt="Prévia"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                      title="Remover foto"
                    >
                      <Trash2 className="w-5 h-5 text-rose-400" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl border border-stone-300 bg-stone-100 flex items-center justify-center text-stone-400">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Enviando...' : 'Upload de Imagem'}</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Ou cole o endereço de uma foto da internet..."
                  value={formData.image}
                  onChange={e => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full text-[11px] px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Nome do Prato / Bebida *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Burger Artesanal Bacon & Queijo"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Descrição / Ingredientes</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Pão brioche, hambúrguer 180g na brasa, queijo cheddar fatiado, bacon crocante..."
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    placeholder="34.90"
                    value={formData.price}
                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Preço Original / De (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    placeholder="Ex: 42.00 (Opcional)"
                    value={formData.originalPrice}
                    onChange={e => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as CategoryId }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Estação de Preparo</label>
                  <select
                    value={formData.station}
                    onChange={e => setFormData(prev => ({ ...prev, station: e.target.value as PreparationStation }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="kitchen">Cozinha (Chapa / Fogão)</option>
                    <option value="bar">Bar (Drinks / Bebidas)</option>
                    <option value="dessert">Sobremesas & Doces</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    Tempo Médio (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.prepTimeMinutes}
                    onChange={e => setFormData(prev => ({ ...prev, prepTimeMinutes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Selo / Destaque Texto</label>
                  <input
                    type="text"
                    placeholder="Ex: Mais Vendido"
                    value={formData.badgeText}
                    onChange={e => setFormData(prev => ({ ...prev, badgeText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Badges toggles */}
              <div className="flex items-center gap-4 pt-2 border-t border-stone-100 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={formData.isVegetarian}
                    onChange={e => setFormData(prev => ({ ...prev, isVegetarian: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Vegetariano</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={formData.isGlutenFree}
                    onChange={e => setFormData(prev => ({ ...prev, isGlutenFree: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Sem Glúten</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={formData.isHighlight}
                    onChange={e => setFormData(prev => ({ ...prev, isHighlight: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Destaque no Topo</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-stone-950 font-black rounded-xl text-sm shadow-md transition-all cursor-pointer"
                >
                  {editingProduct ? 'Salvar Alterações do Prato' : 'Cadastrar e Salvar no Cardápio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
