import React, { useState, useEffect } from 'react';
import { useComanda } from '../../context/ComandaContext';
import { SelectedOption } from '../../types';
import { formatBRL } from '../../utils/formatters';
import {
  X,
  Plus,
  Minus,
  Check,
  Clock,
  Utensils,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const {
    isProductModalOpen,
    closeProductModal,
    selectedProductForModal: product,
    addToCart,
  } = useComanda();

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Reset and pre-select defaults when modal opens with a new product
  useEffect(() => {
    if (!product) return;

    setQuantity(1);
    setRemovedIngredients([]);
    setNotes('');

    // Preselect first option for required single-select option groups
    if (product.optionGroups) {
      const initial: SelectedOption[] = product.optionGroups.map(group => {
        if (group.type === 'single' && group.required && group.options.length > 0) {
          const firstOpt = group.options[0];
          return {
            groupId: group.id,
            groupName: group.name,
            selectedItems: [{ id: firstOpt.id, name: firstOpt.name, price: firstOpt.price }],
          };
        }
        return {
          groupId: group.id,
          groupName: group.name,
          selectedItems: [],
        };
      });
      setSelectedOptions(initial);
    } else {
      setSelectedOptions([]);
    }
  }, [product]);

  if (!isProductModalOpen || !product) return null;

  // Option handlers
  const handleSingleSelect = (groupId: string, groupName: string, item: { id: string; name: string; price: number }) => {
    setSelectedOptions(prev => {
      const exists = prev.find(g => g.groupId === groupId);
      if (exists) {
        return prev.map(g => (g.groupId === groupId ? { ...g, selectedItems: [item] } : g));
      }
      return [...prev, { groupId, groupName, selectedItems: [item] }];
    });
  };

  const handleMultipleToggle = (groupId: string, groupName: string, item: { id: string; name: string; price: number }, maxSelections?: number) => {
    setSelectedOptions(prev => {
      const group = prev.find(g => g.groupId === groupId) || { groupId, groupName, selectedItems: [] };
      const isSelected = group.selectedItems.some(i => i.id === item.id);

      let newItems = [];
      if (isSelected) {
        newItems = group.selectedItems.filter(i => i.id !== item.id);
      } else {
        if (maxSelections && group.selectedItems.length >= maxSelections) {
          return prev; // Reached limit
        }
        newItems = [...group.selectedItems, item];
      }

      const others = prev.filter(g => g.groupId !== groupId);
      return [...others, { groupId, groupName, selectedItems: newItems }];
    });
  };

  const toggleRemoveIngredient = (ingredient: string) => {
    setRemovedIngredients(prev =>
      prev.includes(ingredient) ? prev.filter(i => i !== ingredient) : [...prev, ingredient]
    );
  };

  // Calculate dynamic unit price
  const extraOptionsPrice = selectedOptions.reduce((acc, g) => {
    return acc + g.selectedItems.reduce((sum, item) => sum + item.price, 0);
  }, 0);

  const unitPrice = product.price + extraOptionsPrice;
  const totalPrice = unitPrice * quantity;

  // Validation
  const canAddToCart = () => {
    if (!product.optionGroups) return true;
    for (const g of product.optionGroups) {
      if (g.required) {
        const found = selectedOptions.find(o => o.groupId === g.id);
        if (!found || found.selectedItems.length === 0) return false;
      }
    }
    return true;
  };

  const handleConfirmAddToCart = () => {
    if (!canAddToCart()) return;

    addToCart({
      product,
      quantity,
      selectedOptions: selectedOptions.filter(g => g.selectedItems.length > 0),
      removedIngredients,
      notes: notes.trim(),
      unitPrice,
    });

    closeProductModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-product-detail"
        className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-stone-200 relative"
      >
        {/* Header with compact image & prominent title/info */}
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50 flex items-start gap-3.5 sm:gap-4 relative shrink-0">
          {/* Compact Image */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-stone-200 shrink-0 border border-stone-200 shadow-xs relative">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Header Info */}
          <div className="flex-1 min-w-0 pr-8">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {product.badges?.map((b, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-stone-950"
                >
                  {b}
                </span>
              ))}
              <span className="flex items-center gap-1 text-[11px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                <Clock className="w-3 h-3 text-amber-600" /> ~{product.prepTimeMinutes} min
              </span>
            </div>

            <h2 className="text-base sm:text-xl font-black text-stone-900 leading-snug">
              {product.name}
            </h2>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black text-emerald-700">
                {formatBRL(product.price)}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                Preço base
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            id="btn-close-product-modal"
            onClick={closeProductModal}
            className="absolute top-3.5 right-3.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable body with maximum space for customization */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 text-stone-800">
          {/* Description */}
          {product.description && (
            <div className="bg-stone-50 p-3.5 sm:p-4 rounded-2xl border border-stone-200/80">
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Option Groups */}
          {product.optionGroups?.map(group => {
            const currentSelected = selectedOptions.find(g => g.groupId === group.id)?.selectedItems || [];

            return (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-stone-900">{group.name}</span>
                    {group.required && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  {group.type === 'multiple' && group.maxSelections && (
                    <span className="text-xs font-medium text-stone-500">
                      Até {group.maxSelections} {group.maxSelections === 1 ? 'opção' : 'opções'}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {group.options.map(opt => {
                    const isSelected = currentSelected.some(i => i.id === opt.id);

                    return (
                      <label
                        key={opt.id}
                        id={`opt-${group.id}-${opt.id}`}
                        onClick={() => {
                          if (group.type === 'single') {
                            handleSingleSelect(group.id, group.name, opt);
                          } else {
                            handleMultipleToggle(group.id, group.name, opt, group.maxSelections);
                          }
                        }}
                        className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/60 text-stone-950 shadow-xs ring-1 ring-amber-500/30'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700 hover:bg-stone-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center border-2 transition-colors ${
                              isSelected
                                ? 'border-amber-600 bg-amber-500 text-stone-950'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-sm sm:text-base font-semibold">{opt.name}</span>
                        </div>
                        {opt.price > 0 && (
                          <span className="text-xs sm:text-sm font-black text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg">
                            +{formatBRL(opt.price)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Removable Ingredients */}
          {product.removableIngredients && product.removableIngredients.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm sm:text-base text-stone-900">Remover Ingredientes</span>
                <span className="text-xs font-medium text-stone-500">Toque para retirar</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.removableIngredients.map(ing => {
                  const isRemoved = removedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => toggleRemoveIngredient(ing)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isRemoved
                          ? 'bg-rose-50 border-rose-300 text-rose-700 line-through decoration-rose-500 shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {isRemoved && <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                      <span>{ing}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen Notes */}
          <div className="space-y-2">
            <span className="font-bold text-sm sm:text-base text-stone-900">Observações para a Cozinha</span>
            <textarea
              id="input-product-notes"
              rows={2}
              placeholder="Ex: Ponto da carne ao ponto, molho à parte, pão bem tostado..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-stone-200 text-xs sm:text-sm bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* Modal Sticky Bottom Action */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center bg-white border border-stone-200 rounded-2xl p-1 shadow-xs">
            <button
              id="btn-qty-minus"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-30 cursor-pointer transition-colors"
              aria-label="Diminuir quantidade"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-9 text-center font-black text-sm sm:text-base text-stone-900">
              {quantity}
            </span>
            <button
              id="btn-qty-plus"
              onClick={() => setQuantity(q => q + 1)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors"
              aria-label="Aumentar quantidade"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Button with calculated total */}
          <button
            id="btn-confirm-add-cart"
            onClick={handleConfirmAddToCart}
            disabled={!canAddToCart()}
            className="flex-1 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-200 disabled:text-stone-400 text-stone-950 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Adicionar ao Pedido</span>
            </div>
            <span className="font-black text-sm sm:text-base">{formatBRL(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
