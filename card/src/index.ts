import './e-vaskeri-card';
import './editor';
import { makeTranslate } from './localize';

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'e-vaskeri-card')) {
  window.customCards.push({
    type: 'e-vaskeri-card',
    name: 'E-Vaskeri',
    description: makeTranslate('en')('cardDescription'),
    preview: true,
  });
}

export { EVaskeriCard } from './e-vaskeri-card';
