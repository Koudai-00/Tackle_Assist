import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { Save, Trash2, Calendar as CalendarIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const RECURRING_OPTIONS = [
  { id: 'none', label: '繰り返さない' },
  { id: '1m', label: '1ヶ月ごと' },
  { id: '3m', label: '3ヶ月ごと' },
  { id: '6m', label: '半年ごと' },
  { id: '1y', label: '1年ごと' },
];

export default function MaintenanceEditModal() {
  const router = useRouter();
  const { uuid } = useIdentity();
  const params = useLocalSearchParams();
  
  const [customTitle, setCustomTitle] = useState(String(params.customTitle || ''));
  const [recurringInterval, setRecurringInterval] = useState(String(params.recurringInterval || 'none'));
  
  const initialDateStr = String(params.nextAlertDate || new Date().toISOString());
  const [alertDate, setAlertDate] = useState(new Date(initialDateStr));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      const baseUrl = require('../utils/api').getBaseUrl();
      const formattedDate = alertDate.toISOString().split('T')[0];
      
      const res = await fetch(`${baseUrl}/api/maintenance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uuid,
          id: params.id,
          customTitle,
          recurringInterval,
          nextAlertDate: formattedDate
        })
      });
      
      if (res.ok) {
        router.back();
      } else {
        if (Platform.OS === 'web') alert('更新に失敗しました');
        else Alert.alert('エラー', '更新に失敗しました');
      }
    } catch (error) {
       console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const doDelete = async () => {
      setIsDeleting(true);
      try {
        const baseUrl = require('../utils/api').getBaseUrl();
        const res = await fetch(`${baseUrl}/api/maintenance`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uuid, id: params.id })
        });
        if (res.ok) router.back();
      } finally {
        setIsDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('本当に削除しますか？')) doDelete();
    } else {
      Alert.alert('確認', '記録を削除しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: doDelete }
      ]);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setAlertDate(selectedDate);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>メンテナンス種別</Text>
      <Text style={styles.valueText}>
        {params.maintenanceType === 'line_change' ? 'ライン巻き替え' : 
         params.maintenanceType === 'oiling' ? '注油・グリスアップ' : 
         params.maintenanceType === 'overhaul' ? 'オーバーホール' : '自由入力'}
      </Text>

      {params.maintenanceType === 'custom' && (
        <>
          <Text style={[styles.label, {marginTop: 24}]}>任意タイトル</Text>
          <TextInput
            style={[styles.searchInput, { borderWidth: 1, borderColor: Colors.dark.border, backgroundColor: Colors.dark.surface }]}
            value={customTitle}
            onChangeText={setCustomTitle}
          />
        </>
      )}

      <Text style={[styles.label, {marginTop: 24}]}>アラート設定日</Text>
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
        onPress={handleUpdate}
        disabled={isSubmitting || isDeleting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <><Save color="#fff" size={20} /><Text style={styles.saveButtonText}>変更を保存</Text></>}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={handleDelete}
        disabled={isSubmitting || isDeleting}
      >
        {isDeleting ? <ActivityIndicator color={Colors.dark.danger} /> : <><Trash2 color={Colors.dark.danger} size={20} /><Text style={styles.deleteButtonText}>この記録を削除</Text></>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.dark.icon, marginBottom: 8 },
  valueText: { fontSize: 18, color: Colors.dark.text, fontWeight: 'bold' },
  searchInput: { color: Colors.dark.text, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, borderRadius: 12 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border },
  chipActive: { backgroundColor: Colors.dark.primary, borderColor: Colors.dark.primary },
  chipText: { color: Colors.dark.icon, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, padding: 16, borderRadius: 12, gap: 12, borderWidth: 1, borderColor: Colors.dark.border },
  datePickerText: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.primary, paddingVertical: 16, borderRadius: 16, marginTop: 40, gap: 8 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 16, gap: 8 },
  deleteButtonText: { color: Colors.dark.danger, fontSize: 16, fontWeight: 'bold' }
});
