import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { Box, Pencil, Trash2, X } from 'lucide-react-native';

const CATEGORIES: Record<string, string> = {
  rod: 'ロッド', reel: 'リール', lure: 'ルアー', worm: 'ワーム',
  hook: 'フック', sinker: 'シンカー', line: 'ライン', rig: '仕掛け',
  bait: 'エサ', wear: 'ウェア', bag: 'バッグ/収納', tool: 'プライヤー/ツール',
  other: 'その他',
};

export default function InventoryDetailModal() {
  const router = useRouter();
  const { uuid } = useIdentity();
  const params = useLocalSearchParams<{
    id: string; name: string; category: string; quantity: string;
    locationTag: string; imageUrl: string; barcode: string;
  }>();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    const doDelete = async () => {
      setIsDeleting(true);
      try {
        const baseUrl = require('../utils/api').getBaseUrl();
        const res = await fetch(`${baseUrl}/api/inventory`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: params.id, userId: uuid }),
        });
        if (res.ok) {
          router.back();
        } else {
          Alert.alert('エラー', '削除に失敗しました');
        }
      } catch (e) {
        console.error(e);
        Alert.alert('エラー', '通信に失敗しました');
      } finally {
        setIsDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`「${params.name}」を削除しますか？`)) doDelete();
    } else {
      Alert.alert('確認', `「${params.name}」を削除しますか？\nこの操作は元に戻せません。`, [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除する', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/inventory-add',
      params: {
        editId: params.id,
        editName: params.name,
        editCategory: params.category,
        editQuantity: params.quantity,
        editLocationTag: params.locationTag || '',
        editImageUrl: params.imageUrl || '',
        editBarcode: params.barcode || '',
      },
    });
  };

  const qty = parseInt(params.quantity || '0');
  const isOutOfStock = qty === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 写真エリア */}
      {params.imageUrl ? (
        <Image source={{ uri: params.imageUrl }} style={styles.heroImage} resizeMode="cover" />
      ) : (
        <View style={styles.heroPlaceholder}>
          <Box color={Colors.dark.icon} size={64} />
          <Text style={styles.placeholderText}>写真なし</Text>
        </View>
      )}

      {/* 情報カード */}
      <View style={styles.infoCard}>
        <Text style={styles.itemName}>{params.name}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>カテゴリ</Text>
          <Text style={styles.infoValue}>{CATEGORIES[params.category] || params.category}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>在庫数</Text>
          <Text style={[styles.infoValue, isOutOfStock && { color: Colors.dark.danger }]}>
            {isOutOfStock ? '在庫切れ' : `${qty} 個`}
          </Text>
        </View>

        {params.locationTag ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>保管場所</Text>
            <Text style={styles.infoValue}>{params.locationTag}</Text>
          </View>
        ) : null}

        {params.barcode ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>バーコード</Text>
            <Text style={styles.infoValue}>{params.barcode}</Text>
          </View>
        ) : null}
      </View>

      {/* アクションボタン */}
      <View style={styles.actionArea}>
        <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
          <Pencil color="#fff" size={20} />
          <Text style={styles.editBtnText}>編集する</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={isDeleting}>
          {isDeleting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Trash2 color="#fff" size={20} />
              <Text style={styles.deleteBtnText}>削除する</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scrollContent: { paddingBottom: 40 },

  heroImage: { width: '100%', height: 280, backgroundColor: '#000' },
  heroPlaceholder: { width: '100%', height: 200, backgroundColor: Colors.dark.surface, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: Colors.dark.icon, marginTop: 12, fontSize: 14 },

  infoCard: { margin: 16, padding: 20, backgroundColor: Colors.dark.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border },
  itemName: { fontSize: 22, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  infoLabel: { fontSize: 14, color: Colors.dark.icon },
  infoValue: { fontSize: 16, color: Colors.dark.text, fontWeight: '600' },

  actionArea: { paddingHorizontal: 16, gap: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.dark.primary, paddingVertical: 16, borderRadius: 14 },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.dark.danger, paddingVertical: 16, borderRadius: 14 },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
