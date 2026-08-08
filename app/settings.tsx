import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, spacing } from '@/components/theme';
import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { leaveHousehold, rotateInviteCode, subscribeMembers } from '@/lib/household';
import { useHousehold } from '@/lib/store';
import { useTheme, useThemedStyles } from '@/lib/theme';

export default function SettingsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { theme, followsSystem, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { householdId, inviteCode, items, recipes, shopping } = useHousehold();
  const [members, setMembers] = useState<{ uid: string; email: string; displayName: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    return subscribeMembers(householdId, setMembers);
  }, [householdId]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Invite code</Text>
          <Text style={styles.code}>{inviteCode ?? '——————'}</Text>
          <Text style={styles.hint}>
            Share this with your flatmate — they enter it after signing in to see the same pantry.
          </Text>
          <Button
            title="Generate a new code"
            variant="secondary"
            loading={busy}
            onPress={async () => {
              if (!householdId) return;
              setBusy(true);
              try {
                await rotateInviteCode(householdId);
              } finally {
                setBusy(false);
              }
            }}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>Members</Text>
          {members.length === 0 ? (
            <Text style={styles.hint}>Just you so far.</Text>
          ) : (
            members.map((member) => (
              <View key={member.uid} style={styles.member}>
                <Text style={styles.memberName}>{member.displayName}</Text>
                <Text style={styles.hint}>{member.email}</Text>
              </View>
            ))
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>Appearance</Text>
          <Text style={styles.hint}>
            {followsSystem
              ? `Following your device — currently ${theme}.`
              : `Using the ${theme} theme on this device.`}
          </Text>
          <Button
            title={theme === 'dark' ? '☀️  Switch to light theme' : '🌙  Switch to dark theme'}
            variant="secondary"
            onPress={toggleTheme}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>This household</Text>
          <Text style={styles.hint}>
            {items.length} pantry items · {recipes.length} recipes · {shopping.length} on the
            shopping list
          </Text>
        </Card>

        <Button
          title="Leave household"
          variant="secondary"
          onPress={async () => {
            if (user && householdId) await leaveHousehold(user, householdId);
          }}
        />
        <Button title="Sign out" variant="danger" onPress={signOut} />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
      maxWidth: 520,
      width: '100%',
      alignSelf: 'center',
    },
    card: { gap: spacing.sm },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    code: { fontSize: 32, fontWeight: '700', letterSpacing: 6, color: colors.primary },
    hint: { fontSize: 14, color: colors.textMuted },
    member: { paddingVertical: spacing.xs },
    memberName: { fontSize: 15, color: colors.text, fontWeight: '600' },
  });
