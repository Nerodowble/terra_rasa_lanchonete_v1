import React, { useState } from 'react';
import { Product, CategoryId } from '../../types';
import { useComanda } from '../../context/ComandaContext';
import { formatBRL } from '../../utils/formatters';
import {
  Plus,
  Clock,
  SlidersHorizontal,
  Search,
  Check,
  AlertCircle,
} from 'lucide-react';

interface MenuGridProps {
  selectedCategory: CategoryId | 'all';
}

export const MenuGrid: React.FC<MenuGridProps> = ({ selectedCategory }) => {
  const { products, openProductModal, addToCart, config } = useComanda();
  const [searchQuery, setSearchQuery] = useState('');
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    // If product has required option groups or removable ingredients, open modal
    const hasRequiredOptions = product.optionGroups?.some(g => g.required);
    if (hasRequiredOptions) {
      openProductModal(product);
      return;
    }

    addToCart({
      product,
      quantity: 1,
      selectedOptions: [],
      removedIngredients: [],
      notes: '',
      unitPrice: product.price,
    });

    setAddedFeedbackId(product.id);
    setTimeout(() => setAddedFeedbackId(null), 1500);
  };

  const isStoreOpen = config.isOpen !== false;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
      {/* Offline / Closed Alert Banner */}
      {!isStoreOpen && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-rose-900">
                Estabelecimento Fechado no Momento (Offline)
              </p>
              <p className="text-[11px] sm:text-xs text-rose-700">
                Você pode explorar o cardápio e montar seu pedido, mas os envios só serão liberados quando o restaurante estiver Aberto (Live).
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-rose-200/80 text-rose-900 px-2.5 py-1 rounded-xl shrink-0 hidden sm:inline">
            Horário de Funcionamento
          </span>
        </div>
      )}

      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-2">
        <div className="w-full sm:max-w-md relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-menu"
            type="text"
            placeholder="Buscar por prato, ingrediente, bebida..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg cursor-pointer transition-colors"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="text-xs text-stone-500 font-medium px-1 flex items-center justify-between sm:justify-end">
          <span>{filteredProducts.length} {filteredProducts.length === 1 ? 'item disponível' : 'pratos disponíveis'}</span>
        </div>
      </div>

      {/* Grid of Dishes */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-8 sm:p-14 text-center max-w-lg mx-auto my-6 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="font-black text-stone-900 text-base sm:text-lg mb-1">Cardápio em atualização</h3>
          <p className="text-stone-500 text-xs sm:text-sm mb-4">
            Ainda não há itens cadastrados neste cardápio. Acesse o painel de Gestão para cadastrar pratos com fotos e preços.
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-800 text-base mb-1">Nenhum prato encontrado</h3>
          <p className="text-stone-500 text-xs sm:text-sm mb-4">
            Não encontramos itens com o termo &quot;{searchQuery}&quot;. Tente buscar por outra palavra-chave.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 cursor-pointer"
          >
            Ver Todo o Cardápio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {filteredProducts.map(product => {
            const hasOptions = (product.optionGroups && product.optionGroups.length > 0) || (product.removableIngredients && product.removableIngredients.length > 0);
            const isAdded = addedFeedbackId === product.id;

            return (
              <div
                key={product.id}
                id={`card-product-${product.id}`}
                onClick={() => openProductModal(product)}
                className={`group bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-amber-400/60 transition-all cursor-pointer relative ${
                  !product.isAvailable ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <div>
                  {/* Image container with badges */}
                  <div className="relative aspect-16/10 overflow-hidden bg-stone-100 flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400 font-bold text-xs">
                        {product.name}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-linear-to-t from-stone-900/40 via-transparent to-transparent" />

                    {/* Prep time badge */}
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>~{product.prepTimeMinutes} min</span>
                    </div>

                    {/* Tags / Badges */}
                    {product.badges && product.badges.length > 0 && (
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                        {product.badges.map((b, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-stone-950 shadow-xs"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-stone-900 text-base leading-snug group-hover:text-amber-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-stone-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Footer price & action */}
                <div className="px-4 pb-4 pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-stone-400 block font-medium">A partir de</span>
                    <span className="text-lg font-black text-stone-900">
                      {formatBRL(product.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasOptions ? (
                      <button
                        id={`btn-customize-${product.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openProductModal(product);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-amber-500 hover:text-stone-950 text-stone-800 text-xs font-bold transition-all cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Personalizar</span>
                      </button>
                    ) : (
                      <button
                        id={`btn-add-${product.id}`}
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-xs'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Adicionado!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
