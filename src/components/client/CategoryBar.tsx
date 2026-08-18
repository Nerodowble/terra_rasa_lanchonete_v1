import React from 'react';
import { CategoryId } from '../../types';
import { useComanda } from '../../context/ComandaContext';
import {
  Sparkles,
  Utensils,
  Flame,
  Layers,
  Wine,
  Heart,
} from 'lucide-react';

interface CategoryBarProps {
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (categoryId: CategoryId | 'all') => void;
}

const CATEGORY_ICONS: Record<CategoryId, React.ReactNode> = {
  combos: <Sparkles className="w-4 h-4" />,
  burgers: <Utensils className="w-4 h-4" />,
  pizzas: <Flame className="w-4 h-4" />,
  porcoes: <Layers className="w-4 h-4" />,
  bebidas: <Wine className="w-4 h-4" />,
  sobremesas: <Heart className="w-4 h-4" />,
};

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { categories, products } = useComanda();

  return (
    <div className="bg-white border-b border-stone-200 sticky top-[84px] sm:top-[97px] z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 overflow-x-auto no-scrollbar scroll-smooth snap-x touch-pan-x flex items-center gap-1.5 sm:gap-2">
        {/* 'Todos' pill */}
        <button
          id="btn-cat-all"
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 snap-start transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <span>Todos os Pratos</span>
          <span
            className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
              selectedCategory === 'all'
                ? 'bg-stone-700 text-amber-300'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            {products.filter(p => p.isAvailable).length}
          </span>
        </button>

        {/* Dynamic categories */}
        {categories.map(cat => {
          const count = products.filter(p => p.category === cat.id && p.isAvailable).length;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              id={`btn-cat-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 snap-start transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <span className={isSelected ? 'text-stone-950' : 'text-amber-600'}>
                {CATEGORY_ICONS[cat.id]}
              </span>
              <span>{cat.name}</span>
              <span
                className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
                  isSelected
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
