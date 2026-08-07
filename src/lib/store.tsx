import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeItems } from '@/data/items';
import { subscribeRecipes } from '@/data/recipes';
import { subscribeShopping } from '@/data/shopping';
import { PantryItem, Recipe, ShoppingEntry } from '@/domain/types';
import { useAuth } from './auth';
import { subscribeHouseholdId, subscribeInviteCode } from './household';

type HouseholdContextValue = {
  householdId: string | null;
  inviteCode: string | null;
  /** True until we know whether the user belongs to a household. */
  loading: boolean;
  items: PantryItem[];
  recipes: Recipe[];
  shopping: ShoppingEntry[];
  error: string | null;
};

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shopping, setShopping] = useState<ShoppingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setHouseholdId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    return subscribeHouseholdId(
      user.uid,
      (id) => {
        setHouseholdId(id);
        setLoading(false);
      },
      (err) => {
        // Usually a rules rejection. Stop loading either way: a spinner the user
        // can't get out of is worse than a message saying what went wrong.
        setError(err.message);
        setHouseholdId(null);
        setLoading(false);
      },
    );
  }, [user]);

  useEffect(() => {
    if (!householdId) {
      setItems([]);
      setRecipes([]);
      setShopping([]);
      setInviteCode(null);
      return;
    }

    setError(null);
    // Firebase reports permission problems per listener; one message is enough.
    const onError = (err: Error) => setError(err.message);
    const unsubscribers = [
      subscribeItems(householdId, setItems, onError),
      subscribeRecipes(householdId, setRecipes, onError),
      subscribeShopping(householdId, setShopping, onError),
      subscribeInviteCode(householdId, setInviteCode),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [householdId]);

  const value = useMemo<HouseholdContextValue>(
    () => ({ householdId, inviteCode, loading, items, recipes, shopping, error }),
    [householdId, inviteCode, loading, items, recipes, shopping, error],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold(): HouseholdContextValue {
  const context = useContext(HouseholdContext);
  if (!context) throw new Error('useHousehold must be used inside a HouseholdProvider');
  return context;
}
