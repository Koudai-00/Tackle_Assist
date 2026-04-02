import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { Plus, Minus, Trash2, Search, Check, ChevronRight } from 'lucide-react-native';

export default function SetEditorScreen() {
  const router = useRouter();
  const { uuid } = useIdentity();
  const { id } = useLocalSearchParams<{ id?: string }>();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]); // {itemId, name, requiredQuantity}
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  
  // アイテムピッカー用
  const [pickerVisible, setPickerVisible] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSetDetail = async () => {
    if (!id || !uuid) return;
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/sets?userId=${uuid}&id=${id}`);
      const data = await res.json();
      if (data.set) {
        setName(data.set.name);
        setDescription(data.set.description || '');
        setSelectedItems(data.items.map((i: any) => ({
          itemId: i.itemId,
          name: i.name,
          requiredQuantity: i.requiredQuantity
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventory = async () => {
    if (!uuid) return;
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/inventory?userId=${uuid}`);
      const data = await res.json();
      if (data.items) setInventory(data.items);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (id) fetchSetDetail();
    fetchInventory();
  }, [id, uuid]);

  const toggleItemSelection = (item: any) => {
    const exists = selectedItems.find(i => i.itemId === item.id);
    if (exists) {
      setSelectedItems(prev => prev.filter(i => i.itemId !== item.id));
    } else {
      setSelectedItems(prev => [...prev, { itemId: item.id, name: item.name, requiredQuantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setSelectedItems(prev => prev.map(i => {
      if (i.itemId === itemId) {
        return { ...i, requiredQuantity: Math.max(1, i.requiredQuantity + delta) };
      }
      return i;
    }));
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(i => i.itemId !== itemId));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('エラー', 'セット名を入力してください');
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert('エラー', 'アイテムを1つ以上選択してください');
      return;
    }

    setIsSaving(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const method = id ? 'PATCH' : 'POST';
      const body = {
        userId: uuid,
        id, // PATCH用
        name: name.trim(),
        description: description.trim(),
        items: selectedItems
      };

      const res = await fetch(`${baseUrl}/api/sets`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        router.back();
      } else {
        throw new Error('Save failed');
      }
    } catch (e) {
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.dark.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: id ? 'セットを編集' : 'セットを新規作成' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>セット名</Text>
        <TextInput 
          style={styles.input} 
          placeholder="例: 春のエギングセット" 
          placeholderTextColor={Colors.dark.icon}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>説明（任意）</Text>
        <TextInput 
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
          placeholder="このセットの用途など" 
          placeholderTextColor={Colors.dark.icon}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.label}>中身のアイテム ({selectedItems.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setPickerVisible(true)}>
            <Plus color="#fff" size={16} />
            <Text style={styles.addBtnText}>追加</Text>
          </TouchableOpacity>
        </View>

        {selectedItems.map((item) => (
          <View key={item.itemId} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity onPress={() => updateQuantity(item.itemId, -1)} style={styles.qtyBtn}>
                <Minus color={Colors.dark.primary} size={16} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.requiredQuantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.itemId, 1)} style={styles.qtyBtn}>
                <Plus color={Colors.dark.primary} size={16} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeItem(item.itemId)} style={styles.deleteBtn}>
                <Trash2 color={Colors.dark.danger} size={18} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {selectedItems.length === 0 && (
          <Text style={styles.emptyItemsText}>アイテムが選ばれていません</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>保存する</Text>}
        </TouchableOpacity>
      </View>

      {/* アイテム選択モーダル */}
      <Modal visible={pickerVisible} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>追加したいアイテムを選択</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <Text style={{ color: Colors.dark.primary, fontSize: 16 }}>完了</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchBar}>
            <Search color={Colors.dark.icon} size={20} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="在庫内を検索" 
              placeholderTextColor={Colors.dark.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredInventory}
            keyExtractor={it => it.id}
            renderItem={({ item }) => {
              const isSelected = !!selectedItems.find(i => i.itemId === item.id);
              return (
                <TouchableOpacity 
                  style={[styles.pickerItem, isSelected && styles.pickerItemActive]} 
                  onPress={() => toggleItemSelection(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerItemName}>{item.name}</Text>
                    <Text style={styles.pickerItemSub}>{item.category} ・ 残り {item.quantity}</Text>
                  </View>
                  {isSelected && <Check color={Colors.dark.primary} size={24} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  label: { fontSize: 14, color: Colors.dark.icon, marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: Colors.dark.surface, color: Colors.dark.text, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, fontSize: 16, marginBottom: 20 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.dark.border },
  itemName: { flex: 1, color: Colors.dark.text, fontSize: 16, fontWeight: '500' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.primary, justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  deleteBtn: { marginLeft: 8, padding: 4 },
  emptyItemsText: { color: Colors.dark.icon, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: Colors.dark.background, borderTopWidth: 1, borderColor: Colors.dark.border },
  saveBtn: { backgroundColor: Colors.dark.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  modalBg: { flex: 1, backgroundColor: Colors.dark.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: Colors.dark.border },
  modalTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, margin: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, gap: 12, borderWidth: 1, borderColor: Colors.dark.border },
  searchInput: { flex: 1, color: Colors.dark.text, fontSize: 16 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: Colors.dark.border },
  pickerItemActive: { backgroundColor: 'rgba(14, 165, 233, 0.05)' },
  pickerItemName: { color: Colors.dark.text, fontSize: 16, fontWeight: '500' },
  pickerItemSub: { color: Colors.dark.icon, fontSize: 12, marginTop: 4 }
});
