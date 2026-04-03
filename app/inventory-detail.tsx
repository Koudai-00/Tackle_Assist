import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { Box, Pencil, Trash2, X, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { getBaseUrl } from '../utils/api';

const CATEGORIES: Record<string, string> = {
  rod: 'ロッド', reel: 'リール', lure: 'ルアー', worm: 'ワーム',
  hook: 'フック', sinker: 'シンカー', line: 'ライン', rig: '仕掛け',
  bait: 'エサ', wear: 'ウェア', bag: 'バッグ/収納', tool: 'プライヤー/ツール',
  other: 'その他',
};

const MAINTENANCE_TYPES: Record<string, string> = {
  line_change: 'ライン巻き替え',
  oiling: 'オイル/グリス',
  custom: 'カスタム',
};

interface RelatedData {
  sets: { setId: string; setName: string }[];
  checklists: { checklistId: string; checklistName: string; tripDate: string }[];
  shopping: { id: string; itemName: string; quantity: number }[];
  maintenance: { id: string; customTitle: string | null; maintenanceType: string; createdAt: string }[];
}

export default function InventoryDetailModal() {
  const router = useRouter();
  const { uuid } = useIdentity();
  const params = useLocalSearchParams<{
    id: string; name: string; category: string; quantity: string;
    locationTag: string; imageUrl: string; barcode: string;
  }>();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [relatedData, setRelatedData] = useState<RelatedData | null>(null);

  const fetchRelatedData = async () => {
    setIsLoadingRelated(true);
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/inventory/related?itemId=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setRelatedData(data);
      } else {
        setRelatedData({ sets: [], checklists: [], shopping: [], maintenance: [] });
      }
    } catch {
      setRelatedData({ sets: [], checklists: [], shopping: [], maintenance: [] });
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const handleDeletePress = async () => {
    await fetchRelatedData();
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/inventory`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, userId: uuid }),
      });
      if (res.ok) {
        setShowDeleteModal(false);
        router.back();
      } else {
        if (Platform.OS === 'web') {
          window.alert('削除に失敗しました');
        } else {
          Alert.alert('エラー', '削除に失敗しました');
        }
      }
    } catch {
      if (Platform.OS === 'web') {
        window.alert('通信に失敗しました');
      } else {
        Alert.alert('エラー', '通信に失敗しました');
      }
    } finally {
      setIsDeleting(false);
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

  const hasRelated = relatedData && (
    relatedData.sets.length > 0 ||
    relatedData.checklists.length > 0 ||
    relatedData.shopping.length > 0 ||
    relatedData.maintenance.length > 0
  );

  const totalRelatedCount = relatedData
    ? relatedData.sets.length + relatedData.checklists.length + relatedData.shopping.length + relatedData.maintenance.length
    : 0;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {params.imageUrl ? (
          <Image source={{ uri: params.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Box color={Colors.dark.icon} size={64} />
            <Text style={styles.placeholderText}>写真なし</Text>
          </View>
        )}

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

        <View style={styles.actionArea}>
          <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
            <Pencil color="#fff" size={20} />
            <Text style={styles.editBtnText}>編集する</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePress} disabled={isDeleting || isLoadingRelated}>
            {isLoadingRelated ? (
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

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AlertTriangle color={Colors.dark.danger} size={28} />
              <Text style={styles.modalTitle}>削除の確認</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={styles.modalClose}>
                <X color={Colors.dark.icon} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} bounces={false}>
              <Text style={styles.modalItemName}>「{params.name}」を削除しますか？</Text>

              {hasRelated ? (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    この釣具に紐づく以下のデータ（計{totalRelatedCount}件）も同時に削除されます：
                  </Text>

                  {relatedData!.sets.length > 0 && (
                    <View style={styles.relatedSection}>
                      <Text style={styles.relatedLabel}>セット構成（{relatedData!.sets.length}件）</Text>
                      {relatedData!.sets.map((s) => (
                        <Text key={s.setId} style={styles.relatedItem}>・ {s.setName} からこのアイテムが除外されます</Text>
                      ))}
                    </View>
                  )}

                  {relatedData!.checklists.length > 0 && (
                    <View style={styles.relatedSection}>
                      <Text style={styles.relatedLabel}>チェックリスト（{relatedData!.checklists.length}件）</Text>
                      {relatedData!.checklists.map((c) => (
                        <Text key={c.checklistId} style={styles.relatedItem}>・ {c.checklistName}（{c.tripDate}）</Text>
                      ))}
                    </View>
                  )}

                  {relatedData!.maintenance.length > 0 && (
                    <View style={styles.relatedSection}>
                      <Text style={styles.relatedLabel}>メンテナンス履歴（{relatedData!.maintenance.length}件）</Text>
                      {relatedData!.maintenance.map((m) => (
                        <Text key={m.id} style={styles.relatedItem}>
                          ・ {m.customTitle || MAINTENANCE_TYPES[m.maintenanceType] || m.maintenanceType}
                        </Text>
                      ))}
                    </View>
                  )}

                  {relatedData!.shopping.length > 0 && (
                    <View style={styles.relatedSection}>
                      <Text style={styles.relatedLabel}>買い物リスト（{relatedData!.shopping.length}件）</Text>
                      {relatedData!.shopping.map((s) => (
                        <Text key={s.id} style={styles.relatedItem}>・ 「{s.itemName}」の購入予定（{s.quantity}個）</Text>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}

              <Text style={styles.irreversibleText}>この操作は元に戻せません。</Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelBtnText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={executeDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>削除する</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalItemName: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '600',
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: Colors.dark.danger,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 12,
  },
  relatedSection: {
    marginBottom: 12,
  },
  relatedLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.dark.accent,
    marginBottom: 4,
  },
  relatedItem: {
    fontSize: 13,
    color: Colors.dark.text,
    lineHeight: 20,
    paddingLeft: 4,
  },
  irreversibleText: {
    fontSize: 13,
    color: Colors.dark.icon,
    marginTop: 4,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.danger,
    alignItems: 'center',
  },
  confirmDeleteBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
