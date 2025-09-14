import React from 'react';
import { DollarSign } from 'lucide-react';
import { FilterPopover } from './FilterPopover';
import { usePopoverManager } from '../../hooks/usePopoverManager';

interface BudgetFilterProps {
  selectedBudget?: number;
  onBudgetChange: (budget?: number) => void;
  className?: string;
}

export function BudgetFilter({ 
  selectedBudget, 
  onBudgetChange, 
  className = '' 
}: BudgetFilterProps) {
  const { isOpen, toggle, close, popoverRef, buttonRef } = usePopoverManager();

  const handleBudgetSelect = (level: number) => {
    onBudgetChange(level);
    close();
  };

  const hasSelection = selectedBudget !== undefined;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={`inline-flex items-center justify-center p-1.5 hover:text-white transition-colors ${
          hasSelection || isOpen ? 'text-emerald-400' : ''
        } ${className}`}
        title="Add budget"
        aria-label="Add budget"
        onClick={toggle}
      >
        <DollarSign className="w-4 h-4" />
      </button>

      <FilterPopover isOpen={isOpen} popoverRef={popoverRef} className="left-12">
        <div className="w-[200px] rounded-2xl bg-gray-900 ring-1 ring-white/10 shadow-xl text-gray-100 p-3">
          <div className="text-xs text-gray-300 mb-2">Budget</div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                type="button"
                onClick={() => handleBudgetSelect(level)}
                className="p-1"
                aria-label={`Budget ${level} of 5`}
              >
                <DollarSign 
                  className={`w-5 h-5 ${
                    selectedBudget && level <= selectedBudget 
                      ? 'text-emerald-400' 
                      : 'text-gray-400'
                  } hover:text-white transition-colors`} 
                />
              </button>
            ))}
            <span className="ml-2 text-[11px] text-gray-400">
              {selectedBudget ? `${selectedBudget}/5` : '—/5'}
            </span>
          </div>
        </div>
      </FilterPopover>
    </div>
  );
}
