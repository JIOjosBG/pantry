import { User } from 'firebase/auth';
import { get, onValue, push, ref, remove, set, update } from 'firebase/database';
import { db } from './firebase';

/** Unambiguous alphabet: no O/0 or I/1 to confuse people typing a code. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function randomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Watch which household the signed-in user belongs to, if any.
 *
 * onError matters more than it looks: a rejected read calls only the error
 * callback, so without one the caller waits on a value that never arrives.
 */
export function subscribeHouseholdId(
  uid: string,
  onChange: (id: string | null) => void,
  onError: (error: Error) => void,
) {
  return onValue(
    ref(db(), `users/${uid}/householdId`),
    (snapshot) => {
      onChange(snapshot.exists() ? (snapshot.val() as string) : null);
    },
    onError,
  );
}

export function subscribeInviteCode(householdId: string, onChange: (code: string | null) => void) {
  return onValue(ref(db(), `households/${householdId}/inviteCode`), (snapshot) => {
    onChange(snapshot.exists() ? (snapshot.val() as string) : null);
  });
}

export function subscribeMembers(
  householdId: string,
  onChange: (members: { uid: string; email: string; displayName: string }[]) => void,
) {
  return onValue(ref(db(), `households/${householdId}/memberProfiles`), (snapshot) => {
    const value = (snapshot.val() ?? {}) as Record<
      string,
      { email?: string; displayName?: string }
    >;
    onChange(
      Object.entries(value).map(([uid, profile]) => ({
        uid,
        email: profile.email ?? '',
        displayName: profile.displayName ?? profile.email ?? uid,
      })),
    );
  });
}

function profileFor(user: User) {
  return {
    email: user.email ?? '',
    displayName: user.displayName ?? user.email ?? 'Member',
  };
}

/** Create a household with a fresh invite code and put the user in it. */
export async function createHousehold(user: User): Promise<string> {
  const householdId = push(ref(db(), 'households')).key!;

  // Retry on the (very unlikely) chance the generated code is already taken.
  let code = randomCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await get(ref(db(), `householdCodes/${code}`));
    if (!existing.exists()) break;
    code = randomCode();
  }

  await update(ref(db()), {
    [`households/${householdId}/inviteCode`]: code,
    [`households/${householdId}/createdAt`]: Date.now(),
    [`households/${householdId}/members/${user.uid}`]: true,
    [`households/${householdId}/memberProfiles/${user.uid}`]: profileFor(user),
    [`householdCodes/${code}`]: householdId,
    [`users/${user.uid}`]: { ...profileFor(user), householdId },
  });

  return householdId;
}

export class HouseholdError extends Error {}

/** Join an existing household by its invite code. */
export async function joinHousehold(user: User, rawCode: string): Promise<string> {
  const code = normalizeCode(rawCode);
  if (code.length !== CODE_LENGTH) {
    throw new HouseholdError(`Invite codes are ${CODE_LENGTH} characters long.`);
  }

  const snapshot = await get(ref(db(), `householdCodes/${code}`));
  if (!snapshot.exists()) {
    throw new HouseholdError("That invite code doesn't match a household.");
  }
  const householdId = snapshot.val() as string;

  await update(ref(db()), {
    [`households/${householdId}/members/${user.uid}`]: true,
    [`households/${householdId}/memberProfiles/${user.uid}`]: profileFor(user),
    [`users/${user.uid}`]: { ...profileFor(user), householdId },
  });

  return householdId;
}

/** Leave the household, keeping the shared data intact for the other member. */
export async function leaveHousehold(user: User, householdId: string): Promise<void> {
  await update(ref(db()), {
    [`households/${householdId}/members/${user.uid}`]: null,
    [`households/${householdId}/memberProfiles/${user.uid}`]: null,
    [`users/${user.uid}/householdId`]: null,
  });
}

/** Issue a new invite code, retiring the old one. */
export async function rotateInviteCode(householdId: string): Promise<string> {
  const previous = await get(ref(db(), `households/${householdId}/inviteCode`));
  const code = randomCode();
  await set(ref(db(), `households/${householdId}/inviteCode`), code);
  await set(ref(db(), `householdCodes/${code}`), householdId);
  if (previous.exists()) {
    await remove(ref(db(), `householdCodes/${previous.val() as string}`));
  }
  return code;
}
