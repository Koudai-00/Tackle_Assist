import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useFocusEffect, useRouter, Tabs, Link } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useIdentity } from '../../hooks/useIdentity';
import { ShieldAlert, Plus, ShieldCheck, Calendar as CalendarIcon, List as ListIcon, Backpack, CircleCheck as CheckCircle2, ChevronRight, Info, Settings, User, MoreVertical, Edit3, Trash2, Bell, Clock, Square, CheckSquare, ChevronUp, ChevronDown } from 'lucide-react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import AdCard from '../components/AdCard';

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
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [completeTripsExpanded, setCompleteTripsExpanded] = useState(false);
  const [activeMaintLogs, setActiveMaintLogs] = useState<any[]>([]);
  const [completedMaintLogs, setCompletedMaintLogs] = useState<any[]>([]);
  const [completeMaintExpanded, setCompleteMaintExpanded] = useState(false);
  const [maintLogs, setMaintLogs] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  // 編集モーダル用
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [targetTrip, setTargetTrip] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editAlertAt, setEditAlertAt] = useState(new Date());
  const [editAlertEnabled, setEditAlertEnabled] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();

      const [mRes, tRes] = await Promise.all([
        fetch(`${baseUrl}/api/maintenance?userId=${uuid}`),
        fetch(`${baseUrl}/api/trips?userId=${uuid}`)
      ]);

      const mText = await mRes.text();
      const tText = await tRes.text();

      try {
        const mData = JSON.parse(mText);
        if (mData.activeLogs) setActiveMaintLogs(mData.activeLogs || []);
        if (mData.completedLogs) setCompletedMaintLogs(mData.completedLogs || []);
        if (mData.logs) setMaintLogs(mData.logs || []);
      } catch {
        console.warn("Maintenance response is not JSON:", mText.substring(0, 200));
      }

      try {
        const tData = JSON.parse(tText);
        if (tData.activeTrips) setActiveTrips(tData.activeTrips || []);
        if (tData.completedTrips) setCompletedTrips(tData.completedTrips || []);
        if (tData.trips) setTrips(tData.trips || []);
      } catch {
        console.warn("Trips response is not JSON:", tText.substring(0, 200));
      }
    } catch (err) {
      console.warn("Dashboard Fetch Error", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [uuid]));

  const toggleMaintStatus = async (item: any) => {
    const isNowCompleting = !item.isCompleted;
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/maintenance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          userId: uuid,
          isCompleted: isNowCompleting
        })
      });
      if (res.ok) {
        if (isNowCompleting && item.recurringInterval !== 'none') {
          Alert.alert('完了', 'メンテナンスを記録しました。次回のアラートを自動作成しました。');
        }
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearCompletedMaint = async () => {
    const doClear = async () => {
      try {
        const baseUrl = require('@/utils/api').getBaseUrl();
        const res = await fetch(`${baseUrl}/api/maintenance`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uuid, clearCompleted: true })
        });
        if (res.ok) fetchData();
      } catch (e) { console.error(e); }
    };

    if (Platform.OS === 'web') {
      if (confirm('完了済みのアラートをすべて削除しますか？')) doClear();
    } else {
      Alert.alert('確認', '完了済みのアラートをすべて削除しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: doClear }
      ]);
    }
  };

  const clearCompletedTrips = async () => {
    const doClear = async () => {
      try {
        const baseUrl = require('@/utils/api').getBaseUrl();
        const res = await fetch(`${baseUrl}/api/trips`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uuid, clearCompleted: true })
        });
        if (res.ok) fetchData();
      } catch (e) { console.error(e); }
    };

    if (Platform.OS === 'web') {
      if (confirm('完了済みの釣行準備をすべて削除しますか？')) doClear();
    } else {
      Alert.alert('確認', '完了済みの釣行準備をすべて削除しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: doClear }
      ]);
    }
  };

  const renderMaintItem = (item: any) => {
    if (!item.nextAlertDate) return null;
    const nextAlert = new Date(item.nextAlertDate);
    const today = new Date();
    const diffDays = Math.ceil((nextAlert.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isDanger = diffDays <= 0;
    const isWarning = diffDays <= 14 && diffDays > 0;

    return (
      <View key={item.id} style={[
        styles.card, 
        isDanger && !item.isCompleted && styles.cardDanger,
        isWarning && !item.isCompleted && styles.cardWarning, 
        item.isCompleted && styles.cardCompleted
      ]}>
        <TouchableOpacity onPress={() => toggleMaintStatus(item)} style={styles.checkArea}>
          <View pointerEvents="none">
            {item.isCompleted ? (
              <CheckSquare color={Colors.dark.secondary} size={24} />
            ) : (
              <Square color={Colors.dark.icon} size={24} />
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cardContent} onPress={() => router.push({ pathname: '/maintenance-edit', params: { id: item.id, ...item } })}>
          <Text style={[styles.itemName, item.isCompleted && styles.itemNameCompleted]}>{item.itemName || 'タックル指定なし'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.maintType}>{item.maintenanceType === 'line_change' ? 'ライン巻き替え' : 'メンテナンス'}</Text>
            {item.recurringInterval !== 'none' && !item.isCompleted && (
              <View style={styles.recurringBadge}><Clock size={10} color={Colors.dark.primary} /><Text style={styles.recurringBadgeText}>{item.recurringInterval}</Text></View>
            )}
          </View>
          <Text style={[
            styles.dateText, 
            isDanger && !item.isCompleted && styles.dateTextDanger,
            isWarning && !item.isCompleted && styles.dateTextWarning
          ]}>アラート日: {item.nextAlertDate}</Text>
        </TouchableOpacity>
        <ChevronRight color={Colors.dark.icon} size={20} />
      </View>
    );
  };

  const renderTripItem = (item: any) => {
    const progress = item.totalItems > 0 ? (item.packedItems / item.totalItems) : 0;
    const isToday = item.tripDate === new Date().toISOString().split('T')[0];

    return (
      <TouchableOpacity key={item.id} style={[styles.card, styles.cardTrip, isToday && styles.cardTripToday]} onPress={() => router.push({ pathname: '/trip-packing', params: { id: item.id } })}>
        <View style={styles.cardIcon}>
          <Backpack color={Colors.dark.primary} size={28} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.tripDateLabel}>釣行日: {item.tripDate}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{item.packedItems} / {item.totalItems}</Text>
          </View>
        </View>
        <TouchableOpacity style={{ padding: 12, margin: -4 }} onPress={(e) => { e.stopPropagation(); openEditModal(item); }}>
          <View pointerEvents="none">
            <MoreVertical color={Colors.dark.icon} size={24} />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const openEditModal = (trip: any) => {
    setTargetTrip(trip);
    setEditName(trip.name);
    setEditDate(new Date(trip.tripDate));
    setEditAlertAt(trip.alertAt ? new Date(trip.alertAt) : new Date(new Date().setHours(new Date().getHours() + 1, 0, 0, 0)));
    setEditAlertEnabled(trip.alertEnabled);
    setEditModalVisible(true);
  };

  const handleUpdateTrip = async () => {
    if (!editName.trim() || !targetTrip) return;
    setIsUpdating(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/trips`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: targetTrip.id,
          name: editName.trim(),
          tripDate: editDate.toISOString().split('T')[0],
          alertEnabled: editAlertEnabled,
          alertAt: editAlertEnabled ? editAlertAt.toISOString() : null
        })
      });
      if (res.ok) {
        setEditModalVisible(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!targetTrip) return;
    
    const doDelete = async () => {
      try {
        const baseUrl = require('@/utils/api').getBaseUrl();
        const res = await fetch(`${baseUrl}/api/trips?id=${targetTrip.id}`, { method: 'DELETE' });
        if (res.ok) {
          setEditModalVisible(false);
          fetchData();
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('チェックリストを削除しますか？')) doDelete();
    } else {
      Alert.alert('確認', 'チェックリストを削除しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: doDelete }
      ]);
    }
  };

  // カレンダーマーカー
  const markedDates: any = {};
  maintLogs.forEach(log => {
    if (log.nextAlertDate) markedDates[log.nextAlertDate] = { marked: true, dotColor: Colors.dark.secondary };
  });
  trips.forEach(trip => {
    if (trip.tripDate) {
      const existing = markedDates[trip.tripDate] || {};
      markedDates[trip.tripDate] = { 
        ...existing, 
        marked: true, 
        dotColor: Colors.dark.primary, // 釣行予定はプライマリ色（青）
        customStyles: { container: { borderWidth: existing.marked ? 2 : 0, borderColor: Colors.dark.secondary } } 
      };
    }
  });

  const selectedMaint = maintLogs.filter(l => l.nextAlertDate === selectedDateStr);
  const selectedTrips = trips.filter(t => t.tripDate === selectedDateStr);

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color={Colors.dark.primary} /></View>;

  return (
    <View style={styles.container}>
      <Tabs.Screen options={{
        headerLeft: () => (
          <Link href="/transfer" asChild>
            <TouchableOpacity style={{ marginLeft: 4, padding: 12 }}>
              <View pointerEvents="none">
                <User color={Colors.dark.text} size={28} />
              </View>
            </TouchableOpacity>
          </Link>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 4 }}>
            <TouchableOpacity onPress={() => setViewMode(v => v === 'list' ? 'calendar' : 'list')} style={{ padding: 12 }}>
              <View pointerEvents="none">
                {viewMode === 'list' ? <CalendarIcon color={Colors.dark.primary} size={24} /> : <ListIcon color={Colors.dark.primary} size={24} />}
              </View>
            </TouchableOpacity>
          </View>
        ),
        title: viewMode === 'list' ? "ダッシュボード" : "スケジュール"
      }} />

      {viewMode === 'list' ? (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {/* アクティブな釣行予定 */}
          {activeTrips.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>釣行パッキング</Text>
              {activeTrips.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && index % 5 === 0 && <AdCard />}
                  {renderTripItem(item)}
                </React.Fragment>
              ))}
            </View>
          )}

          {/* 完了済みの釣行 */}
          {completedTrips.length > 0 && (
            <View style={styles.completedSection}>
              <TouchableOpacity style={styles.completedHeader} onPress={() => setCompleteTripsExpanded(!completeTripsExpanded)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} pointerEvents="none">
                  {completeTripsExpanded ? <ChevronUp color={Colors.dark.icon} size={20} /> : <ChevronDown color={Colors.dark.icon} size={20} />}
                  <Text style={styles.completedTitle}>完了済みの釣行 ({completedTrips.length})</Text>
                </View>
                <TouchableOpacity onPress={clearCompletedTrips} style={styles.clearBtn}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} pointerEvents="none">
                    <Trash2 color={Colors.dark.danger} size={16} />
                    <Text style={styles.clearBtnText}>整理</Text>
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
              {completeTripsExpanded && completedTrips.map(renderTripItem)}
            </View>
          )}

          {/* メンテナンスアラート */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>メンテナンスアラート</Text>
            {activeMaintLogs.length > 0 ? activeMaintLogs.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && index % 5 === 0 && <AdCard />}
                {renderMaintItem(item)}
              </React.Fragment>
            )) : (
              <View style={styles.emptyCard}>
                <ShieldCheck color={Colors.dark.icon} size={40} />
                <Text style={styles.emptyText}>アラートはありません</Text>
              </View>
            )}
          </View>

          {/* 完了済みセクション */}
          {completedMaintLogs.length > 0 && (
            <View style={styles.completedSection}>
              <TouchableOpacity style={styles.completedHeader} onPress={() => setCompleteMaintExpanded(!completeMaintExpanded)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} pointerEvents="none">
                  {completeMaintExpanded ? <ChevronUp color={Colors.dark.icon} size={20} /> : <ChevronDown color={Colors.dark.icon} size={20} />}
                  <Text style={styles.completedTitle}>完了済み ({completedMaintLogs.length})</Text>
                </View>
                <TouchableOpacity onPress={clearCompletedMaint} style={styles.clearBtn}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} pointerEvents="none">
                    <Trash2 color={Colors.dark.danger} size={16} />
                    <Text style={styles.clearBtnText}>整理</Text>
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
              {completeMaintExpanded && completedMaintLogs.map(renderMaintItem)}
            </View>
          )}
        </ScrollView>
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
          <ScrollView contentContainerStyle={styles.listContainer}>
            <Text style={styles.selectedDateTitle}>{selectedDateStr} の予定</Text>
            {selectedTrips.map(renderTripItem)}
            {selectedMaint.map(renderMaintItem)}
            {selectedTrips.length === 0 && selectedMaint.length === 0 && (
              <Text style={styles.noPlanText}>予定はありません</Text>
            )}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/maintenance-add')}>
        <View pointerEvents="none">
          <Plus color="#ffffff" size={32} />
        </View>
      </TouchableOpacity>

      {/* 編集モーダル */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>準備リストの編集</Text>
              <TouchableOpacity onPress={() => handleDeleteTrip()} style={{ padding: 8, margin: -8 }}>
                <View pointerEvents="none">
                  <Trash2 color={Colors.dark.danger} size={20} />
                </View>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>釣行名 / タイトル</Text>
            <TextInput 
              style={styles.input} 
              value={editName} 
              onChangeText={setEditName}
              placeholder="タイトル"
              placeholderTextColor={Colors.dark.icon}
            />

            <Text style={styles.label}>予定日</Text>
            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
              <CalendarIcon color={Colors.dark.primary} size={18} />
              <Text style={styles.dateSelectorText}>{editDate.toISOString().split('T')[0]}</Text>
            </TouchableOpacity>

            <View style={styles.alertToggleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bell color={editAlertEnabled ? Colors.dark.primary : Colors.dark.icon} size={16} />
                <Text style={styles.label}>アラート設定</Text>
              </View>
              <TouchableOpacity onPress={() => setEditAlertEnabled(!editAlertEnabled)}>
                <Text style={{ color: editAlertEnabled ? Colors.dark.primary : Colors.dark.icon, fontWeight: 'bold' }}>
                  {editAlertEnabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            {editAlertEnabled && (
              <View style={styles.alertSelectors}>
                <TouchableOpacity style={[styles.dateSelector, { flex: 1.5, marginBottom: 0 }]} onPress={() => setShowDatePicker(true)}>
                  <CalendarIcon color={Colors.dark.icon} size={16} />
                  <Text style={styles.dateSelectorText}>{editAlertAt.toLocaleDateString('ja-JP')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dateSelector, { flex: 1, marginBottom: 0 }]} onPress={() => setShowTimePicker(true)}>
                  <Clock color={Colors.dark.icon} size={16} />
                  <Text style={styles.dateSelectorText}>{editAlertAt.getHours()}:00</Text>
                </TouchableOpacity>
              </View>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={editAlertAt}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) {
                    const newDate = new Date(editAlertAt);
                    newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                    setEditAlertAt(newDate);
                    setEditDate(newDate);
                  }
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={editAlertAt}
                mode="time"
                display="spinner"
                is24Hour={true}
                minuteInterval={60}
                onChange={(event, date) => {
                  setShowTimePicker(false);
                  if (date) {
                    const newDate = new Date(editAlertAt);
                    newDate.setHours(date.getHours(), 0, 0, 0);
                    setEditAlertAt(newDate);
                  }
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)} disabled={isUpdating}>
                <Text style={styles.cancelBtnText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleUpdateTrip} disabled={isUpdating}>
                {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>更新する</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.background },
  container: { flex: 1, backgroundColor: Colors.dark.background },
  listContainer: { padding: 16, paddingBottom: 100 },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.dark.icon, marginBottom: 12, marginLeft: 4 },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.dark.border },
  cardDanger: { borderColor: Colors.dark.danger, backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  cardWarning: { borderColor: Colors.dark.accent, backgroundColor: 'rgba(245, 158, 11, 0.05)' },
  cardTrip: { borderColor: Colors.dark.primary + '44' },
  cardTripToday: { borderColor: Colors.dark.primary, borderWidth: 1.5 },
  
  cardIcon: { marginRight: 16 },
  cardContent: { flex: 1 },
  itemName: { fontSize: 17, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 2 },
  maintType: { fontSize: 13, color: Colors.dark.primary, marginBottom: 4 },
  dateText: { fontSize: 13, color: Colors.dark.icon },
  dateTextDanger: { color: Colors.dark.danger, fontWeight: 'bold' },
  dateTextWarning: { color: Colors.dark.accent, fontWeight: 'bold' },

  tripDateLabel: { fontSize: 13, color: Colors.dark.icon, marginBottom: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressContainer: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.dark.primary },
  progressText: { fontSize: 12, color: Colors.dark.text, fontWeight: 'bold' },

  emptyCard: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 30, alignItems: 'center', gap: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.dark.border },
  emptyText: { color: Colors.dark.icon, fontSize: 14 },

  selectedDateTitle: { color: Colors.dark.icon, fontWeight: 'bold', marginBottom: 16 },
  noPlanText: { color: Colors.dark.icon, textAlign: 'center', marginTop: 30 },
  
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.dark.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, zIndex: 999 },

  checkArea: { padding: 12, marginLeft: -8, marginRight: 0 },
  cardCompleted: { opacity: 0.5, backgroundColor: 'rgba(0,0,0,0.1)' },
  itemNameCompleted: { color: Colors.dark.icon, textDecorationLine: 'line-through' },
  recurringBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(14, 165, 233, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  recurringBadgeText: { color: Colors.dark.primary, fontSize: 10, fontWeight: 'bold' },

  completedSection: { marginTop: 8, marginBottom: 32 },
  completedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  completedTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.dark.icon },
  clearBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, padding: 8 },
  clearBtnText: { color: Colors.dark.danger, fontSize: 12, fontWeight: 'bold' },

  // モーダル
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.dark.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.dark.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.dark.text },
  label: { fontSize: 12, color: Colors.dark.icon, marginBottom: 8 },
  input: { backgroundColor: Colors.dark.background, color: Colors.dark.text, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, fontSize: 16, marginBottom: 20 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.background, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, gap: 10, marginBottom: 20 },
  dateSelectorText: { color: Colors.dark.text, fontSize: 16 },
  alertToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  alertSelectors: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.dark.background, borderWidth: 1, borderColor: Colors.dark.border },
  cancelBtnText: { color: Colors.dark.text, fontWeight: '600' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.dark.primary },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' }
});
