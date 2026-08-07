import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { parseISODate, toISODate } from '@/domain/expiry';
import { colors, radius, spacing } from './theme';

/**
 * Date entry that works on both targets: a plain typed field on web (where the
 * native picker is a no-op) and the platform picker on iOS/Android.
 */
export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [draft, setDraft] = useState(value);

  // Keep the typed draft in step when the parent re-suggests a date, e.g. after
  // switching category.
  useEffect(() => setDraft(value), [value]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          value={draft}
          onChangeText={(text) => {
            setDraft(text);
            if (/^\d{4}-\d{2}-\d{2}$/.test(text)) onChange(text);
          }}
          onBlur={() => setDraft(value)}
          placeholder="yyyy-mm-dd"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          style={styles.input}
        />
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={() => setShowPicker(true)}
        style={styles.input}
      >
        <Text style={styles.value}>{value}</Text>
      </Pressable>
      {showPicker ? (
        <DateTimePicker
          value={parseISODate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, date) => {
            setShowPicker(Platform.OS === 'ios' && event.type !== 'dismissed');
            if (date) onChange(toISODate(date));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    justifyContent: 'center',
    minHeight: 48,
  },
  value: { fontSize: 16, color: colors.text },
});
