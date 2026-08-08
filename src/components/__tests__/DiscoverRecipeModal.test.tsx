import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ComponentProps } from 'react';
import { nameKey } from '@/domain/normalize';
import { Category, PantryItem, ShoppingEntry, Unit } from '@/domain/types';
import { DiscoverRecipeModal } from '../DiscoverRecipeModal';

function pantryItem(name: string, qty: number, unit: Unit): PantryItem {
  return {
    id: `item-${name}`,
    name,
    nameKey: nameKey(name),
    qty,
    unit,
    category: 'other' as Category,
    expiry: '2099-01-01',
    addedAt: 0,
    addedBy: 'me',
  };
}

function listed(name: string): ShoppingEntry {
  return {
    id: `entry-${name}`,
    name,
    nameKey: nameKey(name),
    qty: 1,
    unit: 'piece',
    category: 'other',
    addedAt: 0,
  };
}

const carbonara = {
  title: 'Carbonara',
  servings: 2,
  steps: ['Boil the pasta.'],
  ingredients: [
    { name: 'spaghetti', qty: 200, unit: 'g' as Unit },
    { name: 'bacon', qty: 100, unit: 'g' as Unit },
    { name: 'egg', qty: 2, unit: 'piece' as Unit },
  ],
};

async function renderModal(overrides: Partial<ComponentProps<typeof DiscoverRecipeModal>> = {}) {
  const onAddToCart = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  await render(
    <DiscoverRecipeModal
      recipe={carbonara}
      items={[pantryItem('spaghetti', 500, 'g')]}
      shopping={[]}
      onAddToCart={onAddToCart}
      onClose={onClose}
      {...overrides}
    />,
  );
  return { onAddToCart, onClose };
}

describe('Discover recipe modal', () => {
  it('splits the ingredients into what the pantry covers and what it does not', async () => {
    await renderModal();

    expect(await screen.findByText('In your pantry (1)')).toBeTruthy();
    expect(screen.getByText("You don't have (2)")).toBeTruthy();
    expect(screen.getByText('200 g spaghetti')).toBeTruthy();
    expect(screen.getByText('100 g bacon')).toBeTruthy();
    expect(screen.getByText('2 piece egg')).toBeTruthy();
    // One button per missing ingredient, and none for what you already have.
    expect(screen.getAllByText('Add to cart')).toHaveLength(2);
  });

  it('adds a missing ingredient to the shopping list', async () => {
    const { onAddToCart } = await renderModal();

    await fireEvent.press((await screen.findAllByText('Add to cart'))[0]);

    await waitFor(() => expect(onAddToCart).toHaveBeenCalledTimes(1));
    expect(onAddToCart.mock.calls[0][0]).toMatchObject({
      name: 'bacon',
      nameKey: 'bacon',
      qty: 100,
      unit: 'g',
    });
  });

  it('says so instead of offering to add something already on the list', async () => {
    await renderModal({ shopping: [listed('bacon')] });

    expect(await screen.findByText('On the list')).toBeTruthy();
    expect(screen.getAllByText('Add to cart')).toHaveLength(1);
  });

  it('renders nothing until a recipe is opened', async () => {
    await renderModal({ recipe: null });
    expect(screen.queryByText('In your pantry (1)')).toBeNull();
  });
});
