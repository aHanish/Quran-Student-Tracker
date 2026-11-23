import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export function ScreenHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  const colors = useColors();

  return (
    <View style={styles.heading}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.headingTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.headingSubtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function SectionTitle({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Surface({ children, style }: { children: ReactNode; style?: object }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'good' | 'muted' | 'warm' | 'bad';
}) {
  const colors = useColors();
  const palette = {
    good: { background: colors.secondary, foreground: colors.primary },
    muted: { background: colors.muted, foreground: colors.mutedForeground },
    warm: { background: colors.accent, foreground: colors.accentForeground },
    bad: { background: colors.muted, foreground: colors.destructive },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.badgeText, { color: palette.foreground }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  icon = 'book-open',
  action,
}: {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  action?: ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={23} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyMessage, { color: colors.mutedForeground }]}>
        {message}
      </Text>
      {action}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  disabled?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: disabled ? colors.muted : colors.primary,
          borderRadius: colors.radius,
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      {icon ? <Feather name={icon} size={17} color={colors.primaryForeground} /> : null}
      <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 5,
    marginBottom: 22,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'right',
  },
  headingTitle: {
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'right',
  },
  headingSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  surface: {
    borderWidth: 1,
    padding: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 42,
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
