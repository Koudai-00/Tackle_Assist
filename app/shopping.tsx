import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { CheckSquare, Square, ShoppingCart, Plus, Trash2, ChevronDown, ChevronUp, Edit3, Minus, Info, X } from 'lucide-react-native';

export default function ShoppingListScreen() {
  const { uuid } = useIdentity();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [isAdding, setIsAdding] = useState(false);
  const [purchasedExpanded, setPurchasedExpanded] = useState(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editMemo, setEditMemo] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Replenish Modal State
  const [replenishModalVisible, setReplenishModalVisible] = useState(false);
  const [targetItem, setTargetItem] = useState<any>(null);
  const [replenishCount, setReplenishCount] = useState(1);
  const [isReplenishing, setIsReplenishing] = useState(false);

  const fetchShoppingList = async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/shopping?userId=${uuid}`);
      const data = await res.json();
      if (data.items) setItems(data.items);
    } catch (err) {
      console.warn("API Error (Shopping GET)", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchShoppingList();
    }, [uuid])
  );

  const unpurchasedItems = useMemo(() => items.filter(i => !i.isPurchased), [items]);
  const purchasedItems = useMemo(() => items.filter(i => i.isPurchased), [items]);

  const togglePurchased = async (item: any) => {
    const id = item.id;
    const currentStatus = item.isPurchased;
    const isAutoItem = !!item.itemId;

    // もし未購入から購入済みにする場合で、かつ在庫連携アイテムなら補充モーダルを出す
    if (!currentStatus && isAutoItem) {
      setTargetItem(item);
      setReplenishCount(item.quantity || 1);
      setReplenishModalVisible(true);
      return;
    }

    // 通常のトグル処理
    updateItemStatus(id, !currentStatus);
  };

  const updateItemStatus = async (id: string, newStatus: boolean) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, isPurchased: newStatus } : item));
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      await fetch(`${baseUrl}/api/shopping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPurchased: newStatus })
      });
    } catch (error) {
      fetchShoppingList();
    }
  };

  const handleReplenishConfirm = async (shouldReplenish: boolean) => {
    if (!targetItem) return;
    setIsReplenishing(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      
      // 1. 在庫補充APIを叩く
      if (shouldReplenish) {
        await fetch(`${baseUrl}/api/inventory/replenish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: uuid, 
            itemId: targetItem.itemId, 
            amount: replenishCount 
          })
        });
      }

      // 2. 買い物リストを購入済みにする
      await fetch(`${baseUrl}/api/shopping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetItem.id, isPurchased: true })
      });

      setReplenishModalVisible(false);
      fetchShoppingList();
      if (shouldReplenish) {
        Alert.alert('完了', '在庫を補充し、購入済みに移動しました');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', '処理に失敗しました');
    } finally {
      setIsReplenishing(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    setIsAdding(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/shopping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uuid, itemName: newItemName.trim(), quantity: parseInt(newItemQuantity, 10) || 1 })
      });
      if (res.ok) {
        setNewItemName('');
        setNewItemQuantity('1');
        fetchShoppingList();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditName(item.itemName);
    setEditQuantity(String(item.quantity || 1));
    setEditMemo(item.memo || '');
    setEditModalVisible(true);
  };

  const handleUpdateItem = async () => {
    if (!editName.trim() || !editingItem) return;
    setIsUpdating(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/shopping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          itemName: editName.trim(),
          quantity: parseInt(editQuantity, 10) || 1,
          memo: editMemo.trim()
        })
      });
      if (res.ok) {
        setEditModalVisible(false);
        fetchShoppingList();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    const doDelete = async () => {
      setItems(prev => prev.filter(i => i.id !== id));
      try {
        const baseUrl = require('@/utils/api').getBaseUrl();
        await fetch(`${baseUrl}/api/shopping`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
      } catch (e) {
        fetchShoppingList();
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

  const handleClearPurchased = () => {
    const doClear = async () => {
      setItems(prev => prev.filter(i => !i.isPurchased));
      try {
        const baseUrl = require('@/utils/api').getBaseUrl();
        await fetch(`${baseUrl}/api/shopping`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uuid, clearPurchased: true })
        });
      } catch (e) {
        fetchShoppingList();
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('購入済みリストをすべてクリアしますか？')) doClear();
    } else {
      Alert.alert('確認', '購入済みリストをすべてクリアしますか？', [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'クリア', style: 'destructive', onPress: doClear },
      ]);
    }
  };

  const renderShoppingItem = (item: any) => (
    <View key={item.id} style={[styles.card, item.isPurchased && styles.cardPurchased]}>
      <TouchableOpacity onPress={() => togglePurchased(item)} style={styles.checkArea}>
        <View pointerEvents="none">
          {item.isPurchased ? (
            <CheckSquare color={Colors.dark.secondary} size={24} />
          ) : (
            <Square color={Colors.dark.icon} size={24} />
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.itemInfo} onPress={() => openEditModal(item)}>
        <View style={styles.itemTitleRow}>
          <Text style={[styles.itemName, item.isPurchased && styles.itemNamePurchased, { flexShrink: 1 }]} numberOfLines={1}>
            {item.itemName}
          </Text>
          {item.itemId ? (
            <View style={styles.autoLabel}><Text style={styles.autoLabelText}>自動補充</Text></View>
          ) : (
            <View style={styles.manualLabel}><Text style={styles.manualLabelText}>手動</Text></View>
          )}
        </View>
        <View style={styles.itemMetaRow}>
          <Text style={styles.itemQuantity}>{item.quantity || 1} 個</Text>
          {item.memo ? <Text style={styles.itemMemo} numberOfLines={1}>・{item.memo}</Text> : null}
        </View>
      </TouchableOpacity>

      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
          <View pointerEvents="none"><Edit3 color={Colors.dark.icon} size={18} /></View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteItem(item.id, item.itemName)} style={styles.iconBtn}>
          <View pointerEvents="none"><Trash2 color={Colors.dark.icon} size={18} /></View>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 新規追加エリア */}
      <View style={styles.addSection}>
        <TextInput
          style={styles.addInput}
          placeholder="新しい買い物メモを追加"
          placeholderTextColor={Colors.dark.icon}
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <View style={styles.addQtyPicker}>
          <TouchableOpacity onPress={() => setNewItemQuantity(String(Math.max(1, parseInt(newItemQuantity, 10) - 1)))} style={styles.addQtyBtn}>
            <View pointerEvents="none"><Minus color={Colors.dark.primary} size={16} /></View>
          </TouchableOpacity>
          <Text style={styles.addQtyText}>{newItemQuantity}</Text>
          <TouchableOpacity onPress={() => setNewItemQuantity(String(parseInt(newItemQuantity, 10) + 1))} style={styles.addQtyBtn}>
            <View pointerEvents="none"><Plus color={Colors.dark.primary} size={16} /></View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, (!newItemName.trim() || isAdding) && { opacity: 0.4 }]}
          onPress={handleAddItem}
          disabled={!newItemName.trim() || isAdding}
        >
          <View pointerEvents="none">
            {isAdding ? <ActivityIndicator color="#fff" size="small" /> : <Plus color="#fff" size={22} />}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {unpurchasedItems.length === 0 && purchasedItems.length === 0 && (
          <View style={styles.emptyState}>
            <ShoppingCart color={Colors.dark.icon} size={64} />
            <Text style={styles.emptyTitle}>リストは空です</Text>
            <Text style={styles.emptySub}>上の入力欄からメモを追加するか、在庫管理で個数を0にすると自動的に追加されます。</Text>
          </View>
        )}

        {unpurchasedItems.map(renderShoppingItem)}

        {purchasedItems.length > 0 && (
          <View style={styles.purchasedSection}>
            <TouchableOpacity style={styles.purchasedHeader} onPress={() => setPurchasedExpanded(!purchasedExpanded)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {purchasedExpanded ? <ChevronUp color={Colors.dark.icon} size={20} /> : <ChevronDown color={Colors.dark.icon} size={20} />}
                <Text style={styles.purchasedTitle}>購入済み ({purchasedItems.length})</Text>
              </View>
              <TouchableOpacity onPress={handleClearPurchased} style={styles.clearBtn}>
                <Trash2 color={Colors.dark.danger} size={16} />
                <Text style={styles.clearBtnText}>一括削除</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {purchasedExpanded && purchasedItems.map(renderShoppingItem)}
          </View>
        )}
      </ScrollView>

      {/* 編集モーダル */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>買い物の詳細編集</Text>
            
            <Text style={styles.inputLabel}>品名</Text>
            <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} />
            
            <View style={styles.qtyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>買う数</Text>
                <View style={styles.qtyPicker}>
                  <TouchableOpacity onPress={() => setEditQuantity(String(Math.max(1, parseInt(editQuantity, 10) - 1)))} style={styles.qtyBtn}>
                    <View pointerEvents="none"><Minus color={Colors.dark.primary} size={20} /></View>
                  </TouchableOpacity>
                  <TextInput 
                    style={styles.qtyInput} 
                    keyboardType="number-pad" 
                    value={editQuantity} 
                    onChangeText={setEditQuantity} 
                  />
                  <TouchableOpacity onPress={() => setEditQuantity(String(parseInt(editQuantity, 10) + 1))} style={styles.qtyBtn}>
                    <View pointerEvents="none"><Plus color={Colors.dark.primary} size={20} /></View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>メモ</Text>
            <TextInput 
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} 
              placeholder="備考など"
              placeholderTextColor={Colors.dark.icon}
              multiline
              value={editMemo} 
              onChangeText={setEditMemo} 
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)} disabled={isUpdating}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleUpdateItem} disabled={isUpdating}>
                {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmText}>保存する</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 在庫補充確認モーダル */}
      <Modal visible={replenishModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.replenishHeader}>
              <TouchableOpacity
                onPress={() => setReplenishModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X color={Colors.dark.icon} size={24} />
              </TouchableOpacity>
              <Info color={Colors.dark.primary} size={32} />
              <Text style={styles.replenishTitle}>在庫に補充しますか？</Text>
            </View>
            
            <Text style={styles.replenishText}>
              「{targetItem?.itemName}」を購入済みにします。このアイテムは在庫管理と連携しています。
            </Text>

            <View style={styles.replenishCounter}>
              <Text style={styles.inputLabel}>補充する数</Text>
              <View style={styles.qtyPicker}>
                <TouchableOpacity onPress={() => setReplenishCount(Math.max(1, replenishCount - 1))} style={styles.qtyBtn}>
                  <Minus color={Colors.dark.primary} size={20} />
                </TouchableOpacity>
                <TextInput 
                  style={styles.qtyInput} 
                  keyboardType="number-pad" 
                  value={String(replenishCount)} 
                  onChangeText={(v) => setReplenishCount(parseInt(v, 10) || 1)} 
                />
                <TouchableOpacity onPress={() => setReplenishCount(replenishCount + 1)} style={styles.qtyBtn}>
                  <Plus color={Colors.dark.primary} size={20} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => handleReplenishConfirm(false)} 
                disabled={isReplenishing}
              >
                <Text style={styles.modalCancelText}>補充せず完了</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmBtn} 
                onPress={() => handleReplenishConfirm(true)} 
                disabled={isReplenishing}
              >
                {isReplenishing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmText}>在庫を増やして完了</Text>}
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

  addSection: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderColor: Colors.dark.border },
  addInput: { flex: 1, backgroundColor: Colors.dark.surface, color: Colors.dark.text, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, fontSize: 16 },
  addQtyPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border },
  addQtyBtn: { padding: 12 },
  addQtyText: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  addBtn: { width: 48, height: 48, backgroundColor: Colors.dark.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  listContainer: { padding: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, borderWidth: 1, borderColor: Colors.dark.border },
  cardPurchased: { opacity: 0.5 },
  
  checkArea: { padding: 6, marginRight: 4 },
  itemInfo: { flex: 1, paddingVertical: 4 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: Colors.dark.text },
  itemNamePurchased: { color: Colors.dark.icon, textDecorationLine: 'line-through' },
  
  autoLabel: { backgroundColor: 'rgba(14, 165, 233, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  autoLabelText: { color: Colors.dark.primary, fontSize: 10, fontWeight: 'bold' },
  manualLabel: { backgroundColor: 'rgba(156, 163, 175, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  manualLabelText: { color: Colors.dark.icon, fontSize: 10, fontWeight: 'bold' },

  itemMetaRow: { flexDirection: 'row', alignItems: 'center' },
  itemQuantity: { fontSize: 12, color: Colors.dark.primary, fontWeight: 'bold' },
  itemMemo: { fontSize: 12, color: Colors.dark.icon, marginLeft: 6, flex: 1 },

  itemActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },

  purchasedSection: { marginTop: 20 },
  purchasedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, marginBottom: 8 },
  purchasedTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.dark.icon },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 },
  clearBtnText: { color: Colors.dark.danger, fontSize: 12, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.dark.icon, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },

  // モーダル関連
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.dark.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.dark.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 20 },
  inputLabel: { fontSize: 12, color: Colors.dark.icon, marginBottom: 6 },
  modalInput: { backgroundColor: Colors.dark.background, color: Colors.dark.text, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, fontSize: 16, marginBottom: 16 },
  
  qtyRow: { marginBottom: 16 },
  qtyPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, overflow: 'hidden' },
  qtyBtn: { padding: 12, backgroundColor: 'rgba(14, 165, 233, 0.1)' },
  qtyInput: { flex: 1, color: Colors.dark.text, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },

  modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.dark.background, borderWidth: 1, borderColor: Colors.dark.border },
  modalCancelText: { color: Colors.dark.text, fontWeight: '600' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.dark.primary },
  modalConfirmText: { color: '#fff', fontWeight: 'bold' },

  // 補充確認用
  replenishHeader: { alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative' },
  replenishTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.dark.text },
  replenishText: { fontSize: 14, color: Colors.dark.text, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  replenishCounter: { marginBottom: 24 },
  modalCloseBtn: { position: 'absolute', right: -10, top: -10, padding: 8 }
});
