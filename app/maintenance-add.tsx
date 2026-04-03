import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { Save, Search, Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const MAINT_TYPES = [
  { id: 'line_change', label: 'ライン巻き替え' },
  { id: 'oiling', label: '注油・グリスアップ' },
  { id: 'overhaul', label: 'オーバーホール' },
  { id: 'custom', label: '自由入力' },
];

const RECURRING_OPTIONS = [
  { id: 'none', label: '繰り返さない' },
  { id: '1m', label: '1ヶ月ごと' },
  { id: '3m', label: '3ヶ月ごと' },
  { id: '6m', label: '半年ごと' },
  { id: '1y', label: '1年ごと' },
];

const INVENTORY_CATEGORIES = [
  { id: 'all', label: 'すべて' },
  { id: 'rod', label: 'ロッド' },
  { id: 'reel', label: 'リール' },
  { id: 'lure', label: 'ルアー' },
  { id: 'worm', label: 'ワーム' },
  { id: 'hook', label: 'フック' },
  { id: 'sinker', label: 'シンカー' },
  { id: 'line', label: 'ライン' },
  { id: 'rig', label: '仕掛け' },
  { id: 'bait', label: 'エサ' },
  { id: 'wear', label: 'ウェア' },
  { id: 'bag', label: 'バッグ/収納' },
  { id: 'tool', label: 'ツール' },
  { id: 'other', label: 'その他' },
];

export default function MaintenanceAddModal() {
  const router = useRouter();
  const { uuid } = useIdentity();
  
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [maintType, setMaintType] = useState('line_change');
  const [customTitle, setCustomTitle] = useState('');
  const [lineType, setLineType] = useState('pe'); 
  const [recurringInterval, setRecurringInterval] = useState('none');
  
  const [alertDate, setAlertDate] = useState(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchInventory() {
      if (!uuid) return;
      try {
        const baseUrl = require('../utils/api').getBaseUrl();
        const res = await fetch(`${baseUrl}/api/inventory?userId=${uuid}`);
        const data = await res.json();
        setItems(data.items || []);
      } catch (e) {}
    }
    fetchInventory();
  }, [uuid]);

  const filteredItems = items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || it.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const displayLimit = (searchQuery || selectedCategory !== 'all') ? 30 : 10;

  const handleSave = async () => {
    if (maintType === 'custom' && !customTitle.trim()) {
      if (Platform.OS === 'web') alert('メンテナンス内容を入力してください');
      else Alert.alert('エラー', 'メンテナンス内容を入力してください');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const baseUrl = require('../utils/api').getBaseUrl();
      const formattedDate = alertDate.toISOString().split('T')[0];
      
      const res = await fetch(`${baseUrl}/api/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uuid,
          itemId: selectedItemId,
          maintenanceType: maintType,
          customTitle: maintType === 'custom' ? customTitle : null,
          lineType: maintType === 'line_change' ? lineType : null,
          recurringInterval,
          alertDateStr: formattedDate
        })
      });
      
      if (res.ok) {
        router.back();
      } else {
        if (Platform.OS === 'web') alert('登録に失敗しました');
        else Alert.alert('エラー', '登録に失敗しました');
      }
    } catch (error) {
       console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setAlertDate(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>対象のタックル (任意)</Text>
      <View style={styles.searchContainer}>
        <Search color={Colors.dark.icon} size={20} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="タックルを検索" 
          placeholderTextColor={Colors.dark.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {INVENTORY_CATEGORIES.map(cat => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.chipContainer}>
        <TouchableOpacity 
          style={[styles.chip, selectedItemId === null && styles.chipActive]}
          onPress={() => setSelectedItemId(null)}
        >
          <Text style={[styles.chipText, selectedItemId === null && styles.chipTextActive]}>対象指定なし</Text>
        </TouchableOpacity>
        {filteredItems.slice(0, displayLimit).map((it) => (
          <TouchableOpacity 
            key={it.id} 
            style={[styles.chip, selectedItemId === it.id && styles.chipActive]}
            onPress={() => setSelectedItemId(it.id)}
          >
            <Text style={[styles.chipText, selectedItemId === it.id && styles.chipTextActive]}>
              {it.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, {marginTop: 24}]}>メンテナンス内容</Text>
      <View style={styles.chipContainer}>
        {MAINT_TYPES.map((type) => (
          <TouchableOpacity 
            key={type.id} 
            style={[styles.chip, maintType === type.id && styles.chipActive]}
            onPress={() => setMaintType(type.id)}
          >
            <Text style={[styles.chipText, maintType === type.id && styles.chipTextActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {maintType === 'custom' && (
        <TextInput
          style={[styles.searchInput, { marginTop: 12, borderWidth: 1, borderColor: Colors.dark.border, backgroundColor: Colors.dark.surface }]}
          placeholder="例：スプールエッジ研磨"
          placeholderTextColor={Colors.dark.icon}
          value={customTitle}
          onChangeText={setCustomTitle}
        />
      )}

      {maintType === 'line_change' && (
        <>
          <Text style={[styles.label, {marginTop: 24}]}>ラインの種類</Text>
          <View style={styles.chipContainer}>
            <TouchableOpacity style={[styles.chip, lineType === 'pe' && styles.chipActive]} onPress={() => setLineType('pe')}>
              <Text style={[styles.chipText, lineType === 'pe' && styles.chipTextActive]}>PEライン</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, lineType === 'fluoro' && styles.chipActive]} onPress={() => setLineType('fluoro')}>
              <Text style={[styles.chipText, lineType === 'fluoro' && styles.chipTextActive]}>フロロ / ナイロン</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={[styles.label, {marginTop: 24}]}>アラート設定日 (手動設定)</Text>
      <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
        <CalendarIcon color={Colors.dark.primary} size={20} />
        <Text style={styles.datePickerText}>
          {alertDate.getFullYear()}年{alertDate.getMonth() + 1}月{alertDate.getDate()}日
        </Text>
      </TouchableOpacity>
      
      {showDatePicker && (
        <View style={{backgroundColor: '#fff', borderRadius: 8, marginTop: 8}}>
          <DateTimePicker
            value={alertDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            textColor="#000"
            locale="ja-JP"
          />
        </View>
      )}

      <Text style={[styles.label, {marginTop: 24}]}>繰り返し頻度</Text>
      <View style={styles.chipContainer}>
        {RECURRING_OPTIONS.map((opt) => (
          <TouchableOpacity 
            key={opt.id} 
            style={[styles.chip, recurringInterval === opt.id && styles.chipActive]}
            onPress={() => setRecurringInterval(opt.id)}
          >
            <Text style={[styles.chipText, recurringInterval === opt.id && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <><Save color="#fff" size={20} /><Text style={styles.saveButtonText}>記録してアラートを設定</Text></>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.dark.icon, marginBottom: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border },
  searchInput: { flex: 1, color: Colors.dark.text, paddingVertical: 12, marginLeft: 8, fontSize: 16 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border },
  chipActive: { backgroundColor: Colors.dark.primary, borderColor: Colors.dark.primary },
  chipText: { color: Colors.dark.icon, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  filterScroll: { marginBottom: 12, marginHorizontal: -20 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.dark.border },
  filterChipActive: { backgroundColor: 'rgba(14, 165, 233, 0.15)', borderColor: Colors.dark.primary },
  filterChipText: { color: Colors.dark.icon, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: Colors.dark.primary },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, padding: 16, borderRadius: 12, gap: 12, borderWidth: 1, borderColor: Colors.dark.border },
  datePickerText: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.primary, paddingVertical: 16, borderRadius: 16, marginTop: 40, gap: 8 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
