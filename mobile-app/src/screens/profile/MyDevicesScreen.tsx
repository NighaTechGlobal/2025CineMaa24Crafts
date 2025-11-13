import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../styles/tokens';
import { getMyDevices, revokePushToken } from '../../services/api';
import { logger } from '../../utils/logger';

type DeviceItem = {
  id: string;
  token: string;
  platform: 'ios' | 'android';
  device_name?: string | null;
  app_version?: string | null;
  os_version?: string | null;
  timezone?: string | null;
  last_seen_at?: string | null;
  created_at?: string | null;
  revoked?: boolean;
};

const MyDevicesScreen: React.FC = () => {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyDevices();
      setDevices(Array.isArray(data) ? data : []);
    } catch (e) {
      logger.error('Failed to load devices', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  };

  const handleRevoke = async (token: string) => {
    try {
      await revokePushToken({ token });
      setDevices((prev) => prev.filter((d) => d.token !== token));
    } catch (e) {
      logger.error('Failed to revoke token', e);
    }
  };

  const renderItem = ({ item }: { item: DeviceItem }) => {
    const prettyToken = item.token.length > 16
      ? `${item.token.slice(0, 8)}…${item.token.slice(-6)}`
      : item.token;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.deviceInfo}>
            <Ionicons
              name={item.platform === 'ios' ? 'logo-apple' : 'logo-android'}
              size={20}
              color={colors.accentActive}
            />
            <Text style={styles.deviceName}>{item.device_name || 'Unknown Device'}</Text>
          </View>
          <TouchableOpacity style={styles.revokeButton} onPress={() => handleRevoke(item.token)}>
            <Ionicons name="trash-outline" size={18} color={colors.primaryText} />
            <Text style={styles.revokeText}>Revoke</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Token</Text>
          <Text style={styles.detailValue}>{prettyToken}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>OS</Text>
          <Text style={styles.detailValue}>{item.os_version || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>App</Text>
          <Text style={styles.detailValue}>{item.app_version || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Timezone</Text>
          <Text style={styles.detailValue}>{item.timezone || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Seen</Text>
          <Text style={styles.detailValue}>{item.last_seen_at ? new Date(item.last_seen_at).toLocaleString() : '-'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Devices</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.secondaryText} />
              <Text style={styles.emptyText}>No registered devices yet</Text>
              <Text style={styles.emptySub}>Sign in on a device and allow notifications.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 60,
    backgroundColor: colors.gradStart,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  headerTitle: { fontSize: fontSize.h3, fontWeight: '600', color: colors.primaryText },
  listContent: { padding: spacing.lg },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentInactive,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  deviceName: { fontSize: fontSize.body, color: colors.primaryText, fontWeight: '600' },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  revokeText: { color: colors.primaryText, fontSize: fontSize.caption, fontWeight: '600' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  detailLabel: { color: colors.secondaryText },
  detailValue: { color: colors.primaryText, fontWeight: '500' },
  empty: { marginTop: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyText: { color: colors.secondaryText, fontSize: fontSize.body },
  emptySub: { color: colors.secondaryText, fontSize: fontSize.caption },
});

export default MyDevicesScreen;