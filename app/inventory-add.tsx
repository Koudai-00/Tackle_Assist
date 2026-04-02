import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { Save, Camera, Image as ImageIcon, ScanBarcode, X, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import DropdownBtn from './components/DropdownBtn';

const CATEGORIES = [
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
  { id: 'tool', label: 'プライヤー/ツール' },
  { id: 'other', label: 'その他' },
];

export default function InventoryAddModal() {
  const router = useRouter();
  const { uuid } = useIdentity();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('lure');
  const [quantity, setQuantity] = useState('1');
  const [locationTag, setLocationTag] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');
  
  const [locationTagsList, setLocationTagsList] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isApiLoading, setIsApiLoading] = useState(false);

  useEffect(() => {
    async function fetchLocTags() {
      if (!uuid) return;
      try {
        const baseUrl = require('../utils/api').getBaseUrl();
        const res = await fetch(`${baseUrl}/api/locations?userId=${uuid}`);
        const data = await res.json();
        if (data.tags) setLocationTagsList(data.tags);
      } catch (e) {
        console.warn("LocTags API Error", e);
      }
    }
    fetchLocTags();
  }, [uuid]);

  const pickImage = async (useCamera: boolean = false) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3, // 低画質にしてDB容量を節約
      base64: true, // DBに直接文字列として保存するため
    };

    if (useCamera) {
      if (!permission?.granted) await requestPermission();
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0].base64) {
      setImageUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleBarcodeScanned = async ({ type, data }: { type: string, data: string }) => {
    setIsScanning(false);
    setBarcode(data);
    setIsApiLoading(true);
    try {
      const baseUrl = require('../utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/barcode?jan=${data}`);
      const apiData = await res.json();

      if (apiData.success) {
        if (apiData.name) setName(apiData.name);
        if (apiData.imageUrl && !imageUrl) setImageUrl(apiData.imageUrl); // Yahooからの画像をセット
      } else {
        Alert.alert('通知', '商品情報は見つかりませんでしたが、バーコードは登録されました');
      }
    } catch (e) {
      console.warn('Barcode API failed', e);
    } finally {
      setIsApiLoading(false);
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('エラー', 'カメラへのアクセスが拒否されています');
        return;
      }
    }
    setIsScanning(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') alert('釣具の名前を入力してください');
      else Alert.alert('エラー', '釣具の名前を入力してください');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const baseUrl = require('../utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uuid,
          name,
          category,
          quantity: parseInt(quantity) || 1,
          locationTag,
          imageUrl,
          barcode
        })
      });
      
      if (res.ok) {
        router.back();
      } else {
        if (Platform.OS === 'web') alert('エラーが発生しました');
        else Alert.alert('登録失敗', 'エラーが発生しました');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* 写真エリア */}
      <View style={styles.imageSection}>
        {imageUrl ? (
          <View>
            <Image source={{ uri: imageUrl }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUrl(null)}>
              <X color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <ImageIcon color={Colors.dark.icon} size={48} />
            <Text style={{ color: Colors.dark.icon, marginTop: 8 }}>写真を登録</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={styles.imageBtn} onPress={() => pickImage(true)}>
                <Camera color="#fff" size={20} />
                <Text style={styles.imageBtnText}>カメラ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageBtn} onPress={() => pickImage(false)}>
                <ImageIcon color="#fff" size={20} />
                <Text style={styles.imageBtnText}>アルバム</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.label}>釣具名 (必須)</Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="例：サイレントアサシン 129F"
          placeholderTextColor={Colors.dark.icon}
          value={name}
          onChangeText={setName}
        />
        <TouchableOpacity style={styles.scanBtn} onPress={openScanner} disabled={isApiLoading}>
          {isApiLoading ? <ActivityIndicator color="#fff" /> : <ScanBarcode color="#fff" size={24} />}
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, {marginTop: 20}]}>カテゴリ</Text>
      <DropdownBtn options={CATEGORIES} selectedValue={category} onSelect={setCategory} placeholder="選択してください" />

      <View style={{ marginTop: 24 }}>
        <Text style={styles.label}>個数</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={quantity}
          onChangeText={setQuantity}
        />
      </View>
      
      <View style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={[styles.label, { marginBottom: 0, marginTop: 0 }]}>保管場所タグ</Text>
          <TouchableOpacity 
            style={{ marginLeft: 8 }} 
            onPress={() => Alert.alert('案内', '保管場所タグは在庫管理画面の右上のアイコン（設定アイコン）から追加・管理できます。')}
          >
            <AlertCircle color={Colors.dark.primary} size={20} />
          </TouchableOpacity>
        </View>
        <DropdownBtn 
          options={[{ id: '', label: '指定なし' }, ...locationTagsList.map(t => ({ id: t.name, label: t.name }))]} 
          selectedValue={locationTag} 
          onSelect={setLocationTag} 
          placeholder="保管場所を選択" 
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <><Save color="#fff" size={20} /><Text style={styles.saveButtonText}>登録する</Text></>
        )}
      </TouchableOpacity>

      {/* バーコードスキャナーモーダル */}
      <Modal visible={isScanning} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>バーコードをスキャン</Text>
            <TouchableOpacity onPress={() => setIsScanning(false)} style={{ padding: 8 }}>
              <X color="#fff" size={28} />
            </TouchableOpacity>
          </View>
          <CameraView 
            style={styles.camera} 
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr'] }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerBox} />
              <Text style={{ color: '#fff', marginTop: 24, textAlign: 'center' }}>商品のバーコード（JAN）を{'\n'}枠内に映してください</Text>
            </View>
          </CameraView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: 20, paddingBottom: 60 },
  
  imageSection: { alignItems: 'center', marginBottom: 24 },
  imagePlaceholder: { width: '100%', height: 200, backgroundColor: Colors.dark.surface, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark.border, borderStyle: 'dashed' },
  previewImage: { width: 200, height: 200, borderRadius: 16, backgroundColor: Colors.dark.surface },
  removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: Colors.dark.danger, padding: 8, borderRadius: 20 },
  imageBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  imageBtnText: { color: '#fff', fontWeight: 'bold' },

  label: { fontSize: 14, fontWeight: '600', color: Colors.dark.icon, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.dark.surface, color: Colors.dark.text, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, fontSize: 16 },
  scanBtn: { backgroundColor: Colors.dark.secondary, padding: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border },
  chipActive: { backgroundColor: Colors.dark.primary, borderColor: Colors.dark.primary },
  chipText: { color: Colors.dark.icon, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  
  row: { flexDirection: 'row' },
  
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.primary, paddingVertical: 16, borderRadius: 16, marginTop: 40, gap: 8 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, backgroundColor: 'rgba(0,0,0,0.8)' },
  camera: { flex: 1 },
  scannerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scannerBox: { width: 250, height: 100, borderWidth: 2, borderColor: '#0ea5e9', backgroundColor: 'transparent' }
});
