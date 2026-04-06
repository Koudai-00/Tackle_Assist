import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform, ScrollView } from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useIdentity } from '../../hooks/useIdentity';
import { Backpack, Sparkles, FolderOpen, Plus, Edit3, Trash2, Calendar, CheckCircle2, Info, Bell, Clock, ChevronLeft, ChevronRight, X, Search } from 'lucide-react-native';
import DropdownBtn from '../components/DropdownBtn';
import AdCard from '../components/AdCard';

const SORT_OPTIONS = [
  { id: 'date', label: '新着順' },
  { id: 'name', label: '名前順' },
  { id: 'items', label: 'アイテム数順' },
];

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ========== メインコンポーネント ==========
export default function PackingScreen() {
  const router = useRouter();
  const { uuid } = useIdentity();
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 検索・並び替え
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');

  // 釣行準備開始モーダル用
  const [prepModalVisible, setPrepModalVisible] = useState(false);
  const [targetSet, setTargetSet] = useState<any>(null);
  const [tripName, setTripName] = useState('');
  const [tripDate, setTripDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [alertAt, setAlertAt] = useState(new Date(new Date().setHours(new Date().getHours() + 1, 0, 0, 0)));
  // pickerMode: null=フォーム表示, 'date'=カレンダー, 'time'=時間選択
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [showAlertInfo, setShowAlertInfo] = useState(false);
  const [alertEnabled, setAlertEnabled] = useState(true);
  // カレンダー表示用
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  const fetchSets = async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/sets?userId=${uuid}`);
      const data = await res.json();
      if (data.sets) setSets(data.sets);
    } catch (err) {
      console.warn("API Error (Sets GET)", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchSets(); }, [uuid]));

  const handleDeleteSet = (id: string, name: string) => {
    const doDelete = async () => {
      try {
        const baseUrl = require('@/utils/api').getBaseUrl();
        await fetch(`${baseUrl}/api/sets?id=${id}`, { method: 'DELETE' });
        fetchSets();
      } catch (e) {
        console.error(e);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`「${name}」を削除しますか？`)) doDelete();
    } else {
      Alert.alert('確認', `「${name}」を削除しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const openPrepModal = (set: any) => {
    setTargetSet(set);
    setTripName(`${set.name}での釣行`);
    setPickerMode(null);
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setPrepModalVisible(true);
  };

  const handleStartPrep = async () => {
    if (!tripName.trim() || !targetSet) return;
    setIsCreatingTrip(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uuid,
          setId: targetSet.id,
          name: tripName.trim(),
          tripDate: tripDate,
          alertEnabled: alertEnabled,
          alertAt: alertEnabled ? alertAt.toISOString() : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPrepModalVisible(false);
        router.replace('/(tabs)');
        Alert.alert('完了', 'チェックリストを作成しました。ホーム画面から確認できます。');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', '作成に失敗しました');
    } finally {
      setIsCreatingTrip(false);
    }
  };

  // 日付選択ハンドラ
  const handleDateSelect = (year: number, month: number, day: number) => {
    const newDate = new Date(alertAt);
    newDate.setFullYear(year, month, day);
    setAlertAt(newDate);
    // ローカルタイムゾーンで YYYY-MM-DD を生成（toISOString はUTC変換で日付がずれるため使わない）
    const yyyy = String(year);
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setTripDate(`${yyyy}-${mm}-${dd}`);
    setPickerMode(null);
  };

  // 時間選択ハンドラ
  const handleTimeSelect = (hour: number) => {
    const newDate = new Date(alertAt);
    newDate.setHours(hour, 0, 0, 0);
    setAlertAt(newDate);
    setPickerMode(null);
  };

  // 日本語フォーマット
  const formatDateJP = (d: Date) =>
    `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;

  // カレンダー日付生成
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [viewYear, viewMonth]);

  const goToPrev = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const goToNext = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  // 検索 & 並び替え
  const filteredSets = useMemo(() => {
    let result = [...sets];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
        break;
      case 'items':
        result.sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0));
        break;
      case 'date':
      default:
        // APIの返却順（新着順）をそのまま使う
        break;
    }
    return result;
  }, [sets, searchQuery, sortBy]);

  const renderSet = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FolderOpen color={Colors.dark.primary} size={28} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.setTitle}>{item.name}</Text>
          {item.description ? <Text style={styles.setDesc} numberOfLines={1}>{item.description}</Text> : null}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/set-editor', params: { id: item.id } })} style={styles.iconBtn}>
            <View pointerEvents="none">
              <Edit3 color={Colors.dark.icon} size={20} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteSet(item.id, item.name)} style={styles.iconBtn}>
            <View pointerEvents="none">
              <Trash2 color={Colors.dark.danger} size={20} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity style={styles.prepBtn} onPress={() => openPrepModal(item)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} pointerEvents="none">
          <CheckCircle2 color="#fff" size={18} />
          <Text style={styles.prepBtnText}>このセットで準備を開始</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/set-editor')} style={{ marginRight: 4, padding: 12 }}>
            <View pointerEvents="none">
              <Plus color={Colors.dark.primary} size={28} />
            </View>
          </TouchableOpacity>
        )
      }} />

      <FlatList
        data={filteredSets}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <>
            {index > 0 && index % 5 === 0 && <AdCard />}
            {renderSet({ item })}
          </>
        )}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            {sets.length > 0 && (
              <TouchableOpacity style={styles.aiHero} onPress={() => router.push('/ai-packing')}>
                <View style={styles.aiHeroContent}>
                  <Sparkles color="#fff" size={24} />
                  <View>
                    <Text style={styles.aiHeroTitle}>AIに相談してパッキング</Text>
                    <Text style={styles.aiHeroSub}>持ち物をGeminiが提案します</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* 検索 & 並び替え */}
            {sets.length > 0 && (
              <View style={styles.searchSortRow}>
                <View style={styles.searchBox}>
                  <Search color={Colors.dark.icon} size={18} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="セットを検索…"
                    placeholderTextColor={Colors.dark.icon}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <X color={Colors.dark.icon} size={16} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ width: 120 }}>
                  <DropdownBtn
                    options={SORT_OPTIONS}
                    selectedValue={sortBy}
                    onSelect={setSortBy}
                    label="並び替え"
                  />
                </View>
              </View>
            )}

            {/* 検索結果件数 */}
            {searchQuery.trim().length > 0 && (
              <Text style={styles.resultCount}>{filteredSets.length}件のセット</Text>
            )}
          </>
        }
        ListEmptyComponent={
          sets.length === 0 ? (
            <View style={styles.emptyState}>
              <Backpack color={Colors.dark.icon} size={64} />
              <Text style={styles.emptyTitle}>まだセットがありません</Text>
              <Text style={styles.emptySub}>右上の「＋」からお気に入りの仕掛けセットを作るか、AIに相談してみましょう。</Text>
              <TouchableOpacity style={styles.aiEmptyBtn} onPress={() => router.push('/ai-packing')}>
                <Sparkles color="#fff" size={20} />
                <Text style={styles.aiEmptyBtnText}>AIに相談する</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Search color={Colors.dark.icon} size={48} />
              <Text style={styles.emptyTitle}>該当するセットがありません</Text>
              <Text style={styles.emptySub}>検索キーワードを変更してください。</Text>
            </View>
          )
        }
      />

      {/* 準備開始モーダル */}
      <Modal visible={prepModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>

              {/* ===== フォーム表示 ===== */}
              {pickerMode === null && (
                <>
                  <Text style={styles.modalTitle}>釣行準備の開始</Text>
                  
                  <Text style={styles.label}>釣行名 / タイトル</Text>
                  <TextInput 
                    style={styles.input} 
                    value={tripName} 
                    onChangeText={setTripName}
                    placeholder="例: 4/10 駿河湾ジギング"
                    placeholderTextColor={Colors.dark.icon}
                  />

                  <Text style={styles.label}>予定日</Text>
                  <TouchableOpacity style={styles.dateSelector} onPress={() => { setViewYear(alertAt.getFullYear()); setViewMonth(alertAt.getMonth()); setPickerMode('date'); }}>
                    <Calendar color={Colors.dark.primary} size={18} />
                    <Text style={styles.dateSelectorText}>{tripDate}</Text>
                  </TouchableOpacity>

                  <View style={styles.alertHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Bell color={alertEnabled ? Colors.dark.primary : Colors.dark.icon} size={16} />
                      <Text style={[styles.label, { marginBottom: 0 }]}>アラート設定日時</Text>
                      <TouchableOpacity onPress={() => setShowAlertInfo(true)}>
                        <Info color={Colors.dark.icon} size={16} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => setAlertEnabled(!alertEnabled)} style={styles.toggleBtn}>
                      <Text style={[styles.toggleText, alertEnabled && styles.toggleTextOn]}>
                        {alertEnabled ? 'ON' : 'OFF'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {alertEnabled && (
                    <View style={styles.alertSelectors}>
                      <TouchableOpacity style={[styles.alertDateBtn, { flex: 1.6 }]} onPress={() => { setViewYear(alertAt.getFullYear()); setViewMonth(alertAt.getMonth()); setPickerMode('date'); }}>
                        <Calendar color={Colors.dark.primary} size={16} />
                        <Text style={styles.alertDateText}>{formatDateJP(alertAt)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.alertDateBtn, { flex: 1 }]} onPress={() => setPickerMode('time')}>
                        <Clock color={Colors.dark.primary} size={16} />
                        <Text style={styles.alertDateText}>{String(alertAt.getHours()).padStart(2, '0')}:00</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setPrepModalVisible(false)} disabled={isCreatingTrip}>
                      <Text style={styles.cancelBtnText}>キャンセル</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleStartPrep} disabled={isCreatingTrip}>
                      {isCreatingTrip ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>準備リストを作成</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* ===== カレンダー表示 ===== */}
              {pickerMode === 'date' && (
                <>
                  <View style={dpStyles.header}>
                    <TouchableOpacity onPress={goToPrev} style={dpStyles.navBtn}>
                      <ChevronLeft color={Colors.dark.text} size={22} />
                    </TouchableOpacity>
                    <Text style={dpStyles.headerTitle}>{viewYear}年 {viewMonth + 1}月</Text>
                    <TouchableOpacity onPress={goToNext} style={dpStyles.navBtn}>
                      <ChevronRight color={Colors.dark.text} size={22} />
                    </TouchableOpacity>
                  </View>
                  <View style={dpStyles.weekRow}>
                    {WEEKDAYS.map((d, i) => (
                      <View key={d} style={dpStyles.weekCell}>
                        <Text style={[dpStyles.weekText, i === 0 && { color: '#ef4444' }, i === 6 && { color: '#3b82f6' }]}>{d}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={dpStyles.daysGrid}>
                    {calendarDays.map((day, i) => {
                      const isSelected = day !== null && alertAt.getFullYear() === viewYear && alertAt.getMonth() === viewMonth && alertAt.getDate() === day;
                      const today = new Date();
                      const isToday = day !== null && today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[dpStyles.dayCell, isSelected && dpStyles.dayCellSelected]}
                          onPress={() => day && handleDateSelect(viewYear, viewMonth, day)}
                          disabled={!day}
                          activeOpacity={0.6}
                        >
                          {day ? (
                            <Text style={[
                              dpStyles.dayText,
                              isSelected && dpStyles.dayTextSelected,
                              isToday && !isSelected && { color: Colors.dark.primary },
                              i % 7 === 0 && !isSelected && { color: '#ef4444' },
                              i % 7 === 6 && !isSelected && { color: '#3b82f6' },
                            ]}>{day}</Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity style={dpStyles.closeBtn} onPress={() => setPickerMode(null)}>
                    <Text style={dpStyles.closeBtnText}>戻る</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ===== 時間選択表示 ===== */}
              {pickerMode === 'time' && (
                <>
                  <View style={tpStyles.header}>
                    <Clock color={Colors.dark.primary} size={22} />
                    <Text style={tpStyles.headerTitle}>時間を選択</Text>
                    <TouchableOpacity onPress={() => setPickerMode(null)} style={tpStyles.closeX}>
                      <X color={Colors.dark.icon} size={22} />
                    </TouchableOpacity>
                  </View>
                  <View style={tpStyles.grid}>
                    {HOURS.map(h => (
                      <TouchableOpacity
                        key={h}
                        style={[tpStyles.hourCell, h === alertAt.getHours() && tpStyles.hourCellSelected]}
                        onPress={() => handleTimeSelect(h)}
                        activeOpacity={0.6}
                      >
                        <Text style={[tpStyles.hourText, h === alertAt.getHours() && tpStyles.hourTextSelected]}>
                          {String(h).padStart(2, '0')}:00
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* アラート説明モーダル */}
      <Modal visible={showAlertInfo} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAlertInfo(false)}>
          <View style={styles.infoModal}>
            <View style={styles.infoIconWrapper}>
              <Bell color={Colors.dark.primary} size={32} />
            </View>
            <Text style={styles.infoTitle}>アラート機能について</Text>
            <Text style={styles.infoText}>
              設定した日時に、持ち物のチェック状況を通知します。{"\n\n"}
              <Text style={{ fontWeight: 'bold', color: Colors.dark.accent }}>チェックリストが100%（すべて完了）になっていない時のみ</Text>
              通知が届くので、忘れ物防止に役立ちます。
            </Text>
            <TouchableOpacity style={styles.infoCloseBtn} onPress={() => setShowAlertInfo(false)}>
              <Text style={styles.infoCloseText}>わかった</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ========== メインスタイル ==========
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  listContainer: { padding: 16, paddingBottom: 100 },

  searchSortRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 16 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, color: Colors.dark.text, fontSize: 14, marginLeft: 8, paddingVertical: 0 },
  resultCount: { color: Colors.dark.icon, fontSize: 12, marginBottom: 8, marginLeft: 4 },
  
  aiHero: { backgroundColor: Colors.dark.primary, borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: Colors.dark.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  aiHeroContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  aiHeroTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  aiHeroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },

  card: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.dark.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  setTitle: { fontSize: 18, fontWeight: '600', color: Colors.dark.text },
  setDesc: { fontSize: 14, color: Colors.dark.icon, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 12, margin: -4 },

  prepBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.secondary, paddingVertical: 12, borderRadius: 12, gap: 8 },
  prepBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginTop: 20 },
  emptySub: { fontSize: 14, color: Colors.dark.icon, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  aiEmptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 24, gap: 8 },
  aiEmptyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // 準備モーダル
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: Colors.dark.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.dark.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 24 },
  label: { fontSize: 12, color: Colors.dark.icon, marginBottom: 8 },
  input: { backgroundColor: Colors.dark.background, color: Colors.dark.text, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, fontSize: 16, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.dark.background, borderWidth: 1, borderColor: Colors.dark.border },
  cancelBtnText: { color: Colors.dark.text, fontWeight: '600' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.dark.primary },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },

  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.background, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, gap: 10, marginBottom: 20 },
  dateSelectorText: { color: Colors.dark.text, fontSize: 16 },
  
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  alertSelectors: { flexDirection: 'row', gap: 10, marginBottom: 12 },

  alertDateBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.25)',
    gap: 8,
  },
  alertDateText: { color: Colors.dark.text, fontSize: 14, fontWeight: '600' },

  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  toggleText: { fontSize: 13, fontWeight: 'bold', color: Colors.dark.icon },
  toggleTextOn: { color: Colors.dark.primary },

  infoModal: { backgroundColor: Colors.dark.surface, borderRadius: 24, padding: 24, width: '85%', alignSelf: 'center', borderWidth: 1, borderColor: Colors.dark.border, alignItems: 'center' },
  infoIconWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(14, 165, 233, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  infoTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  infoText: { color: Colors.dark.icon, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  infoCloseBtn: { backgroundColor: Colors.dark.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  infoCloseText: { color: '#fff', fontWeight: 'bold' },
});

// ========== 日付ピッカースタイル ==========
const dpStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 24, padding: 20, width: '100%', maxWidth: 380,
    borderWidth: 1, borderColor: Colors.dark.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  navBtn: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  weekText: { color: Colors.dark.icon, fontSize: 13, fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%', aspectRatio: 1,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 12,
  },
  dayCellSelected: { backgroundColor: Colors.dark.primary },
  dayText: { color: Colors.dark.text, fontSize: 16, fontWeight: '500' },
  dayTextSelected: { color: '#fff', fontWeight: 'bold' },
  closeBtn: { marginTop: 16, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 32, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.dark.border },
  closeBtnText: { color: Colors.dark.text, fontWeight: '600', fontSize: 14 },
});

// ========== 時間ピッカースタイル ==========
const tpStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 24, padding: 20, width: '100%', maxWidth: 380,
    borderWidth: 1, borderColor: Colors.dark.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  headerTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold', flex: 1 },
  closeX: { padding: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hourCell: {
    width: '23%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  hourCellSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  hourText: { color: Colors.dark.text, fontSize: 15, fontWeight: '600' },
  hourTextSelected: { color: '#fff', fontWeight: 'bold' },
});
