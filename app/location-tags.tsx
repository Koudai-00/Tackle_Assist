import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { useFocusEffect } from 'expo-router';
import { Plus, Trash2, Tag } from 'lucide-react-native';

export default function LocationTagsModal() {
  const router = useRouter();
  const { uuid } = useIdentity();
  
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTags = async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const baseUrl = require('../utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/locations?userId=${uuid}`);
      const data = await res.json();
      if (data.tags) {
        setTags(data.tags);
      }
    } catch (e) {
      console.warn("API Error", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTags();
    }, [uuid])
  );

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    setIsSubmitting(true);
    try {
      const baseUrl = require('../utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uuid, name: newTag.trim() })
      });
      if (res.ok) {
        setNewTag('');
        fetchTags();
      } else {
        if (Platform.OS === 'web') alert('エラーが発生しました');
        else Alert.alert('エラー', 'タグの追加に失敗しました');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    const doDelete = async () => {
      try {
        const baseUrl = require('../utils/api').getBaseUrl();
        const res = await fetch(`${baseUrl}/api/locations`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uuid, id })
        });
        if (res.ok) {
          fetchTags();
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`「${name}」を削除しますか？\n(過去にこの場所で登録した釣具のデータはそのまま残ります)`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        '確認', 
        `「${name}」を削除しますか？\n(過去にこの場所で登録した釣具のデータはそのまま残ります)`, 
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '削除', style: 'destructive', onPress: doDelete }
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.tagRow}>
      <View style={styles.tagInfo}>
        <Tag color={Colors.dark.primary} size={20} />
        <Text style={styles.tagName}>{item.name}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDeleteTag(item.id, item.name)} style={styles.deleteBtn}>
        <View pointerEvents="none"><Trash2 color={Colors.dark.danger} size={20} /></View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.addSection}>
        <Text style={styles.label}>新しい保管場所を追加</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="例：ガレージA、メイホウBOX"
            placeholderTextColor={Colors.dark.icon}
            value={newTag}
            onChangeText={setNewTag}
          />
          <TouchableOpacity 
            style={[styles.addBtn, (!newTag.trim() || isSubmitting) && styles.addBtnDisabled]} 
            onPress={handleAddTag}
            disabled={!newTag.trim() || isSubmitting}
          >
            <View pointerEvents="none">
              {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Plus color="#fff" size={24} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.label, { marginHorizontal: 20, marginTop: 24, marginBottom: 8 }]}>設定済みの保管場所一覧</Text>
      
      {loading ? (
        <ActivityIndicator color={Colors.dark.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={tags}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>まだ保管場所が設定されていません</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  addSection: { padding: 20, backgroundColor: Colors.dark.surface, borderBottomWidth: 1, borderColor: Colors.dark.border },
  label: { fontSize: 14, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 12 },
  input: { flex: 1, backgroundColor: Colors.dark.background, color: Colors.dark.text, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, fontSize: 16 },
  addBtn: { width: 50, height: 50, backgroundColor: Colors.dark.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled: { opacity: 0.5 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.dark.surface, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.dark.border },
  tagInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tagName: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  deleteBtn: { padding: 8 },
  emptyText: { color: Colors.dark.icon, textAlign: 'center', marginTop: 40 }
});
