import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect, useRouter, Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useIdentity } from '../../hooks/useIdentity';
import { ShieldAlert, Plus, ShieldCheck, Calendar as CalendarIcon, List as ListIcon } from 'lucide-react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// 日本語化設定
LocaleConfig.locales['ja'] = {
  monthNames: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  monthNamesShort: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  dayNames: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
  dayNamesShort: ['日','月','火','水','木','金','土'],
  today: '今日'
};
LocaleConfig.defaultLocale = 'ja';

export default function DashboardScreen() {
  const router = useRouter();
  const { uuid } = useIdentity();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchLogs = async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/maintenance?userId=${uuid}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.warn("API Error (Maintenance GET)", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [uuid])
  );

  const getMaintenanceTitle = (item: any) => {
    if (item.maintenanceType === 'line_change') return `ライン巻き替え (${item.lineType || '未指定'})`;
    if (item.maintenanceType === 'oiling') return '注油・グリスアップ';
    if (item.maintenanceType === 'overhaul') return 'オーバーホール';
    if (item.maintenanceType === 'custom') return item.customTitle;
    return item.maintenanceType;
  };

  const handlePressItem = (item: any) => {
    router.push({
      pathname: '/maintenance-edit',
      params: { 
        id: item.id,
        maintenanceType: item.maintenanceType,
        customTitle: item.customTitle || '',
        recurringInterval: item.recurringInterval || 'none',
        nextAlertDate: item.nextAlertDate
      }
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const nextAlert = new Date(item.nextAlertDate);
    const today = new Date();
    const diffTime = nextAlert.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 14日以内なら警告表示
    const isWarning = diffDays <= 14;

    return (
      <TouchableOpacity style={[styles.card, isWarning && styles.cardWarning]} onPress={() => handlePressItem(item)}>
        <View style={styles.cardIcon}>
          {isWarning ? <ShieldAlert color={Colors.dark.danger} size={32} /> : <ShieldCheck color={Colors.dark.secondary} size={32} />}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.itemName}>{item.itemName || '対象タックル指定なし'}</Text>
          <Text style={styles.maintType}>
            {getMaintenanceTitle(item)}
          </Text>
          <Text style={[styles.dateText, isWarning && styles.dateTextWarning]}>
            次回推奨日: {item.nextAlertDate} 
            {isWarning ? ` (残り${Math.max(0, diffDays)}日)` : ` (あと${diffDays}日)`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // カレンダー用マーカーデータ生成
  const markedDates: any = {};
  logs.forEach(log => {
    const date = log.nextAlertDate;
    if (date) {
      markedDates[date] = { marked: true, dotColor: Colors.dark.primary };
    }
  });

  // カレンダー指定日のログ
  const selectedDateLogs = logs.filter(l => l.nextAlertDate === selectedDateStr);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Tabs.Screen 
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => setViewMode(v => v === 'list' ? 'calendar' : 'list')} style={{ paddingRight: 16 }}>
              {viewMode === 'list' ? <CalendarIcon color={Colors.dark.primary} size={24} /> : <ListIcon color={Colors.dark.primary} size={24} />}
            </TouchableOpacity>
          ),
          title: viewMode === 'list' ? "ホーム・アラート一覧" : "カレンダー"
        }} 
      />

      {viewMode === 'list' ? (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ShieldCheck color={Colors.dark.icon} size={48} />
              <Text style={styles.emptyTitle}>アラートはありません</Text>
              <Text style={styles.emptySub}>右下の＋ボタンからラインの巻き替えや注油記録を追加しましょう</Text>
            </View>
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          <Calendar
            current={selectedDateStr}
            onDayPress={(day: any) => setSelectedDateStr(day.dateString)}
            markedDates={{
              ...markedDates,
              [selectedDateStr]: { ...markedDates[selectedDateStr], selected: true, selectedColor: Colors.dark.primary }
            }}
            theme={{
              backgroundColor: Colors.dark.background,
              calendarBackground: Colors.dark.background,
              textSectionTitleColor: '#b6c1cd',
              dayTextColor: Colors.dark.text,
              todayTextColor: Colors.dark.primary,
              selectedDayTextColor: '#ffffff',
              monthTextColor: Colors.dark.text,
              arrowColor: Colors.dark.primary,
            }}
          />
          <FlatList
            data={selectedDateLogs}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={<Text style={{ color: Colors.dark.icon, marginBottom: 16, fontWeight: 'bold' }}>{selectedDateStr} の予定</Text>}
            ListEmptyComponent={<Text style={{ color: Colors.dark.icon, textAlign: 'center', marginTop: 20 }}>この日の予定はありません</Text>}
          />
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/maintenance-add')}>
        <Plus color="#ffffff" size={32} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.background },
  container: { flex: 1, backgroundColor: Colors.dark.background },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border },
  cardWarning: { borderColor: Colors.dark.danger, backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  cardIcon: { marginRight: 16 },
  cardContent: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: '600', color: Colors.dark.text, marginBottom: 4 },
  maintType: { fontSize: 14, color: Colors.dark.primary, marginBottom: 4 },
  dateText: { fontSize: 14, color: Colors.dark.icon },
  dateTextWarning: { color: Colors.dark.danger, fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.dark.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.dark.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.dark.icon, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
