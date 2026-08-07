import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { nameKey } from '@/domain/normalize';
import { Category, PantryItem, Recipe, ShoppingEntry, Unit } from '@/domain/types';
import CookScreen from '../(tabs)/cook';
import PantryScreen from '../(tabs)/index';
import ReviewPurchaseScreen from '../shopping/review';

const mockPush = jest.fn();
const mockBack = jest.fn();

let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
    useLocalSearchParams: () => mockSearchParams,
    Link: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    Stack: { Screen: () => null },
  };
});

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { uid: 'me' } }),
}));

const mockAddItem = jest.fn().mockResolvedValue(undefined);
const mockBuyAll = jest.fn().mockResolvedValue(undefined);
const mockAddMissingIngredients = jest.fn().mockResolvedValue(2);

jest.mock('@/data/items', () => ({
  addItem: (...args: unknown[]) => mockAddItem(...args),
  adjustQty: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@/data/shopping', () => ({
  buyAll: (...args: unknown[]) => mockBuyAll(...args),
  addMissingIngredients: (...args: unknown[]) => mockAddMissingIngredients(...args),
}));

let mockHouseholdState: {
  householdId: string | null;
  items: PantryItem[];
  recipes: Recipe[];
  shopping: ShoppingEntry[];
  error: string | null;
};

jest.mock('@/lib/store', () => ({
  useHousehold: () => mockHouseholdState,
}));

function item(
  name: string,
  expiry: string,
  category: Category = 'other',
  qty = 1,
  unit: Unit = 'piece',
): PantryItem {
  return {
    id: `${name}-${expiry}`,
    name,
    nameKey: nameKey(name),
    qty,
    unit,
    category,
    expiry,
    addedAt: 0,
    addedBy: 'me',
  };
}

const TODAY = new Date();
function isoIn(days: number) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = {};
  mockHouseholdState = {
    householdId: 'house-1',
    items: [],
    recipes: [],
    shopping: [],
    error: null,
  };
});

describe('Pantry screen', () => {
  it('groups items by how urgent their expiry is', async () => {
    mockHouseholdState.items = [
      item('Yoghurt', isoIn(-1), 'dairy'),
      item('Spinach', isoIn(1), 'produce'),
      item('Rice', isoIn(200), 'pantry'),
    ];

    await render(<PantryScreen />);

    expect(screen.getByText('Expired')).toBeTruthy();
    expect(screen.getByText('Use within 2 days')).toBeTruthy();
    expect(screen.getByText('Later')).toBeTruthy();
    expect(screen.getByText('3 items')).toBeTruthy();
  });

  it('tells you when there is nothing in the pantry', async () => {
    await render(<PantryScreen />);
    expect(screen.getByText('Your pantry is empty')).toBeTruthy();
  });

  it('adds an item through the form', async () => {
    await render(<PantryScreen />);

    await fireEvent.press(screen.getByText('+ Add item'));
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Milk');
    await fireEvent.press(screen.getByText('Add to pantry'));

    await waitFor(() => expect(mockAddItem).toHaveBeenCalledTimes(1));
    const [householdId, uid, payload] = mockAddItem.mock.calls[0];
    expect(householdId).toBe('house-1');
    expect(uid).toBe('me');
    // The category is guessed from the name, which also drives the expiry default.
    expect(payload).toMatchObject({ name: 'Milk', qty: 1, category: 'dairy' });
  });

  it('refuses an item with no name', async () => {
    await render(<PantryScreen />);

    await fireEvent.press(screen.getByText('+ Add item'));
    await fireEvent.press(screen.getByText('Add to pantry'));

    expect(screen.getByText('Give the item a name.')).toBeTruthy();
    expect(mockAddItem).not.toHaveBeenCalled();
  });
});

describe('Cook-now screen', () => {
  const carbonara: Recipe = {
    id: 'r1',
    title: 'Carbonara',
    servings: 2,
    steps: [],
    source: 'user',
    addedAt: 0,
    ingredients: [
      { name: 'egg', nameKey: 'egg', qty: 2, unit: 'piece' },
      { name: 'bacon', nameKey: 'bacon', qty: 100, unit: 'g' },
    ],
  };

  it('adds a recipe\'s missing ingredients to the shopping list', async () => {
    mockHouseholdState.items = [item('Eggs', isoIn(5), 'dairy', 6)];
    mockHouseholdState.recipes = [carbonara];

    await render(<CookScreen />);

    expect(screen.getByText(/Missing: bacon/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Add missing to shopping list'));

    await waitFor(() => expect(mockAddMissingIngredients).toHaveBeenCalledTimes(1));
    expect(mockAddMissingIngredients.mock.calls[0][2]).toEqual([
      { name: 'bacon', nameKey: 'bacon', qty: 100, unit: 'g' },
    ]);
    expect(await screen.findByText('Added 2 items to the shopping list.')).toBeTruthy();
  });

  it('groups recipes into sections by how cookable they are', async () => {
    mockHouseholdState.items = [item('Eggs', isoIn(5), 'dairy', 6)];
    mockHouseholdState.recipes = [
      carbonara,
      {
        ...carbonara,
        id: 'r2',
        title: 'Boiled eggs',
        source: 'spoonacular',
        ingredients: [{ name: 'egg', nameKey: 'egg', qty: 2, unit: 'piece' }],
      },
    ];

    await render(<CookScreen />);

    // The imported recipe lands in Cook now and the hand-written one in Almost
    // there, decided by the pantry alone. Ordering itself is covered in the
    // rankRecipes tests, which can assert it directly.
    expect(screen.getByText(/^Cook now · 1/)).toBeTruthy();
    expect(screen.getByText(/^Almost there · 1/)).toBeTruthy();
    expect(screen.getByText('Boiled eggs')).toBeTruthy();
    expect(screen.getByText(/Missing: bacon/)).toBeTruthy();
  });
});

describe('Bought-all review screen', () => {
  const entry = (name: string, category: Category): ShoppingEntry => ({
    id: `e-${name}`,
    name,
    nameKey: nameKey(name),
    qty: 1,
    unit: 'piece',
    category,
    addedAt: 0,
  });

  it('moves the reviewed items into the pantry', async () => {
    mockHouseholdState.shopping = [entry('Bacon', 'meat'), entry('Bread', 'bakery')];

    await render(<ReviewPurchaseScreen />);
    await fireEvent.press(screen.getByText('Move 2 items to pantry'));

    await waitFor(() => expect(mockBuyAll).toHaveBeenCalledTimes(1));
    const purchased = mockBuyAll.mock.calls[0][2];
    expect(purchased).toHaveLength(2);
    // Meat gets a much shorter suggested shelf life than bread.
    expect(purchased[0].expiry < purchased[1].expiry).toBe(true);
  });

  it('keeps items you did not actually buy off the pantry write', async () => {
    mockHouseholdState.shopping = [entry('Bacon', 'meat'), entry('Bread', 'bakery')];

    await render(<ReviewPurchaseScreen />);
    await fireEvent.press(screen.getAllByText("Didn't buy this")[0]);
    await fireEvent.press(screen.getByText('Move 1 item to pantry'));

    await waitFor(() => expect(mockBuyAll).toHaveBeenCalledTimes(1));
    expect(mockBuyAll.mock.calls[0][2].map((p: { name: string }) => p.name)).toEqual(['Bread']);
  });

  it('moves only the named entry when one item is marked bought', async () => {
    mockHouseholdState.shopping = [entry('Bacon', 'meat'), entry('Bread', 'bakery')];
    mockSearchParams = { entryId: 'e-Bacon' };

    await render(<ReviewPurchaseScreen />);
    await fireEvent.press(screen.getByText('Move to pantry'));

    await waitFor(() => expect(mockBuyAll).toHaveBeenCalledTimes(1));
    const purchased = mockBuyAll.mock.calls[0][2];
    expect(purchased.map((p: { name: string }) => p.name)).toEqual(['Bacon']);
    expect(purchased[0].entryId).toBe('e-Bacon');
  });

  it('says so when the single entry has already left the list', async () => {
    mockHouseholdState.shopping = [entry('Bread', 'bakery')];
    mockSearchParams = { entryId: 'e-Bacon' };

    await render(<ReviewPurchaseScreen />);

    expect(screen.getByText('That item is no longer on the list.')).toBeTruthy();
  });
});

