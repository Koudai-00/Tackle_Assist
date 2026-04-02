import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { Colors } from '../../constants/theme';
import { Anchor, Weight, Ruler, ChevronDown, Edit2, List } from 'lucide-react-native';

interface LineData {
  gou: number;
  kg: number;
  lb: number;
  mm: number;
  d?: number;
}

const NYLON_TABLE: LineData[] = [
  { gou: 0.25, kg: 0.454, lb: 1, mm: 0.083 },
  { gou: 0.3, kg: 0.544, lb: 1.2, mm: 0.090 },
  { gou: 0.4, kg: 0.726, lb: 1.6, mm: 0.104 },
  { gou: 0.6, kg: 1.089, lb: 2.4, mm: 0.128 },
  { gou: 0.8, kg: 1.361, lb: 3, mm: 0.148 },
  { gou: 1, kg: 1.814, lb: 4, mm: 0.165 },
  { gou: 1.2, kg: 2.177, lb: 4.8, mm: 0.185 },
  { gou: 1.5, kg: 2.722, lb: 6, mm: 0.205 },
  { gou: 1.75, kg: 3.175, lb: 7, mm: 0.220 },
  { gou: 2, kg: 3.629, lb: 8, mm: 0.235 },
  { gou: 2.25, kg: 4.082, lb: 9, mm: 0.248 },
  { gou: 2.5, kg: 4.536, lb: 10, mm: 0.260 },
  { gou: 2.75, kg: 4.990, lb: 11, mm: 0.274 },
  { gou: 3, kg: 5.443, lb: 12, mm: 0.285 },
  { gou: 3.5, kg: 6.350, lb: 14, mm: 0.310 },
  { gou: 4, kg: 7.257, lb: 16, mm: 0.330 },
  { gou: 5, kg: 9.072, lb: 20, mm: 0.370 },
  { gou: 6, kg: 9.979, lb: 22, mm: 0.405 },
  { gou: 7, kg: 11.340, lb: 25, mm: 0.435 },
  { gou: 8, kg: 12.701, lb: 28, mm: 0.470 },
  { gou: 10, kg: 15.876, lb: 35, mm: 0.520 },
  { gou: 12, kg: 18.144, lb: 40, mm: 0.570 },
  { gou: 14, kg: 20.412, lb: 45, mm: 0.620 },
  { gou: 16, kg: 22.680, lb: 50, mm: 0.660 },
  { gou: 18, kg: 24.948, lb: 55, mm: 0.700 },
  { gou: 20, kg: 27.216, lb: 60, mm: 0.740 },
];

const PE_TABLE: LineData[] = [
  { gou: 0.1, kg: 1.814, lb: 4, mm: 0.054, d: 20 },
  { gou: 0.15, kg: 2.043, lb: 4.5, mm: 0.066, d: 30 },
  { gou: 0.2, kg: 2.270, lb: 5, mm: 0.076, d: 40 },
  { gou: 0.3, kg: 2.722, lb: 6, mm: 0.094, d: 60 },
  { gou: 0.4, kg: 3.629, lb: 8, mm: 0.108, d: 80 },
  { gou: 0.5, kg: 4.536, lb: 10, mm: 0.121, d: 100 },
  { gou: 0.6, kg: 5.443, lb: 12, mm: 0.132, d: 120 },
  { gou: 0.8, kg: 7.257, lb: 16, mm: 0.153, d: 160 },
  { gou: 1, kg: 9.072, lb: 20, mm: 0.171, d: 200 },
  { gou: 1.2, kg: 10.896, lb: 24, mm: 0.191, d: 240 },
  { gou: 1.5, kg: 13.620, lb: 30, mm: 0.209, d: 300 },
  { gou: 1.7, kg: 15.436, lb: 34, mm: 0.219, d: 340 },
  { gou: 2, kg: 18.160, lb: 40, mm: 0.242, d: 400 },
  { gou: 2.5, kg: 22.700, lb: 50, mm: 0.270, d: 500 },
  { gou: 3, kg: 24.970, lb: 55, mm: 0.296, d: 600 },
  { gou: 4, kg: 27.240, lb: 60, mm: 0.342, d: 800 },
  { gou: 5, kg: 36.320, lb: 80, mm: 0.382, d: 1000 },
  { gou: 6, kg: 40.860, lb: 90, mm: 0.418, d: 1200 },
  { gou: 8, kg: 45.400, lb: 100, mm: 0.483, d: 1600 },
  { gou: 10, kg: 59.020, lb: 130, mm: 0.540, d: 2000 },
];

const OMORI_OPTIONS = [0.3, 0.5, 0.8, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 100, 120, 150];
const GAMADAMA_OPTIONS = [
  { label: 'G8', value: 0.07 }, { label: 'G7', value: 0.09 }, { label: 'G6', value: 0.12 }, { label: 'G5', value: 0.16 },
  { label: 'G4', value: 0.20 }, { label: 'G3', value: 0.25 }, { label: 'G2', value: 0.31 }, { label: 'G1', value: 0.40 },
  { label: 'B', value: 0.55 }, { label: '2B', value: 0.75 }, { label: '3B', value: 0.95 }, { label: '4B', value: 1.20 },
  { label: '5B', value: 1.85 }, { label: '6B', value: 2.65 }
];
const WARIBISHI_OPTIONS = [
  { label: '極小', value: 0.2 }, { label: '小', value: 0.35 }, { label: '小々', value: 0.55 },
  { label: '中', value: 0.8 }, { label: '大', value: 1.0 }, { label: '大大', value: 1.5 }
];
const EGI_OPTIONS = [
  { label: '2.0', value: 6 }, { label: '2.5', value: 10 }, { label: '3.0', value: 15 },
  { label: '3.5', value: 20 }, { label: '4.0', value: 25 }, { label: '4.5', value: 33 }
];
const LURE_OZ_OPTIONS = [
  { label: '1/64', value: 0.4 }, { label: '1/32', value: 0.9 }, { label: '1/16', value: 1.8 },
  { label: '3/32', value: 2.7 }, { label: '1/8', value: 3.5 }, { label: '3/16', value: 5.3 },
  { label: '1/4', value: 7 }, { label: '3/8', value: 10.5 }, { label: '1/2', value: 14 },
  { label: '5/8', value: 17.5 }, { label: '3/4', value: 21 }, { label: '1', value: 28 },
  { label: '1.5', value: 42 }, { label: '2', value: 56 }
];
const FT_OPTIONS = Array.from({ length: (13 - 5 + 1) * 12 }, (_, i) => {
  const ft = 5 + Math.floor(i / 12);
  const inch = i % 12;
  return `${ft}.${inch}`;
});

const CATEGORIES = [
  { id: 'line_fluoro', title: 'ライン (ナイロンなど)' },
  { id: 'line_pe', title: 'ライン (PE)' },
  { id: 'weight', title: '重さ・ウエイト' },
  { id: 'length', title: '長さ' }
];

function CustomPicker({ value, options, onSelect, suffix = '', compact = false }: any) {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <>
      <TouchableOpacity 
        style={[styles.pickerButton, compact && styles.pickerButtonCompact]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.pickerButtonText, compact && styles.pickerButtonTextCompact]}>
          {typeof value === 'object' ? value.label : `${value}${suffix}`}
        </Text>
        <ChevronDown color={Colors.dark.icon} size={compact ? 16 : 20} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>サイズを選択</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => typeof item === 'object' ? item.label : String(item)}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem} 
                  onPress={() => { onSelect(item); setModalVisible(false); }}
                >
                  <Text style={styles.modalItemText}>
                    {typeof item === 'object' ? item.label : `${item}${suffix}`}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ResultRow({ label, value, unit, options, onSelect }: { label: string, value: string | number, unit: string, options?: any[], onSelect?: (item: any) => void }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>・{label}</Text>
      <View style={styles.resultValueContainer}>
        {onSelect && options ? (
          <View style={{ width: 100 }}>
            <CustomPicker 
              value={value} 
              options={options} 
              onSelect={onSelect} 
              suffix={` ${unit}`}
              compact
            />
          </View>
        ) : (
          <>
            <Text style={styles.resultValueText}>{value}</Text>
            <Text style={styles.resultUnitText}>{unit}</Text>
          </>
        )}
      </View>
    </View>
  );
}

function LineFluoroSection() {
  const [selectedIdx, setSelectedIdx] = useState(5); // Default to 1号
  const current = NYLON_TABLE[selectedIdx] || NYLON_TABLE[0];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}><Anchor color={Colors.dark.primary} size={24} /><Text style={styles.cardTitle}>ナイロン・フロロ・エステル</Text></View>
      <View style={styles.subCard}>
        <Text style={styles.hintText}>数値をタップして項目を変更できます</Text>
        <View style={styles.resultList}>
          <ResultRow 
            label="号数" 
            value={current.gou} 
            unit="号" 
            options={NYLON_TABLE.map((item, idx) => ({ label: `${item.gou}号`, value: idx }))}
            onSelect={(item) => setSelectedIdx(item.value)}
          />
          <ResultRow 
            label="lb" 
            value={current.lb.toFixed(1)} 
            unit="lb" 
            options={NYLON_TABLE.map((item, idx) => ({ label: `${item.lb.toFixed(1)}lb`, value: idx }))}
            onSelect={(item) => setSelectedIdx(item.value)}
          />
          <ResultRow 
            label="標準直径" 
            value={current.mm.toFixed(3)} 
            unit="mm" 
            options={NYLON_TABLE.map((item, idx) => ({ label: `${item.mm.toFixed(3)}mm`, value: idx }))}
            onSelect={(item) => setSelectedIdx(item.value)}
          />
          <ResultRow 
            label="強度" 
            value={current.kg.toFixed(3)} 
            unit="kg" 
            options={NYLON_TABLE.map((item, idx) => ({ label: `${item.kg.toFixed(3)}kg`, value: idx }))}
            onSelect={(item) => setSelectedIdx(item.value)}
          />
        </View>
      </View>
    </View>
  );
}

function LinePeSection() {
  const [selectedIdx, setSelectedIdx] = useState(8); // Default to 1号
  const current = PE_TABLE[selectedIdx] || PE_TABLE[0];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}><Anchor color={Colors.dark.primary} size={24} /><Text style={styles.cardTitle}>PEライン</Text></View>
      <View style={styles.subCard}>
        <Text style={styles.hintText}>数値をタップして項目を変更できます</Text>
        <View style={styles.resultList}>
          <ResultRow 
            label="号数" 
            value={current.gou} 
            unit="号" 
            options={PE_TABLE.map((item, idx) => ({ label: `${item.gou}号`, value: idx }))}
            onSelect={(item) => setSelectedIdx(item.value)}
          />
          <ResultRow 
            label="lb" 
            value={current.lb.toFixed(1)} 
            unit="lb" 
            options={PE_TABLE.map((item, idx) => ({ label: `${item.lb.toFixed(1)}lb`, value: idx }))}
            onSelect={(item) => setSelectedIdx(item.value)}
          />
          <ResultRow 
            label="標準直径" 
            value={current.mm.toFixed(3)} 
            unit="mm" 
            options={PE_TABLE.map((item, idx) => ({ label: `${item.mm.toFixed(3)}mm`, value: idx }))}
            onSelect={(item) => setSelectedIdx(item.value)}
          />
          <ResultRow 
            label="強度" 
            value={current.kg.toFixed(3)} 
            unit="kg" 
            options={PE_TABLE.map((item, idx) => ({ label: `${item.kg.toFixed(3)}kg`, value: idx }))}
            onSelect={(item) => setSelectedIdx(item.value)}
          />
          <ResultRow 
            label="デニール" 
            value={current.d || 0} 
            unit="d" 
            options={PE_TABLE.map((item, idx) => ({ label: `${item.d}d`, value: idx }))}
            onSelect={(item) => setSelectedIdx(item.value)}
          />
        </View>
      </View>
    </View>
  );
}

function WeightConverter({ title, options, modeChangeable, toGrams, suffix = '', defaultVal }: any) {
  const [isInputMode, setIsInputMode] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(defaultVal);
  const [inputText, setInputText] = useState('1');
  const gValue = isInputMode ? toGrams({ value: parseFloat(inputText) || 0 }) : toGrams(selectedOpt);

  return (
    <View style={styles.subCard}>
      <View style={styles.row}>
        <Text style={styles.subCardTitle}>{title}</Text>
        {modeChangeable && (
          <TouchableOpacity onPress={() => setIsInputMode(!isInputMode)} style={styles.modeToggle}>
            {isInputMode ? <List color={Colors.dark.icon} size={18} /> : <Edit2 color={Colors.dark.icon} size={18} />}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.row}>
        {!isInputMode ? (
          <View style={{ flex: 1 }}><CustomPicker value={selectedOpt} options={options} onSelect={setSelectedOpt} suffix={suffix} /></View>
        ) : (
          <TextInput style={styles.textInput} keyboardType="decimal-pad" value={inputText} onChangeText={setInputText} placeholder="数値を入力" placeholderTextColor={Colors.dark.icon} />
        )}
        <View style={styles.equals}><Text style={{ color: Colors.dark.icon }}>＝</Text></View>
        <View style={styles.targetBox}><Text style={styles.targetValue}>{gValue.toFixed(2)} <Text style={{ fontSize: 12 }}>g</Text></Text></View>
      </View>
    </View>
  );
}

function WeightsSection() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}><Weight color={Colors.dark.primary} size={24} /><Text style={styles.cardTitle}>重さ・ウェイト</Text></View>
      <WeightConverter title="オンス (oz)" options={LURE_OZ_OPTIONS} modeChangeable defaultVal={LURE_OZ_OPTIONS[7]} toGrams={(val: any) => (val.value || val) * 28.3495} suffix=" oz" />
      <WeightConverter title="オモリ (号)" options={OMORI_OPTIONS} modeChangeable defaultVal={1} toGrams={(val: any) => (val.value || val) * 3.75} suffix=" 号" />
      <WeightConverter title="ガン玉 (G/B)" options={GAMADAMA_OPTIONS} modeChangeable={false} defaultVal={GAMADAMA_OPTIONS[8]} toGrams={(val: any) => val.value} />
      <WeightConverter title="エギ (号)" options={EGI_OPTIONS} modeChangeable defaultVal={EGI_OPTIONS[2]} toGrams={(val: any) => val.value} suffix=" 号" />
      <WeightConverter title="割ビシ" options={WARIBISHI_OPTIONS} modeChangeable={false} defaultVal={WARIBISHI_OPTIONS[3]} toGrams={(val: any) => val.value} />
    </View>
  );
}

function LengthSection() {
  const [selectedFt, setSelectedFt] = useState('5.0');
  const parts = selectedFt.split('.');
  const ftPart = parseInt(parts[0], 10);
  const inchPart = parseInt(parts[1], 10);
  const cmValue = (ftPart * 30.48) + (inchPart * 2.54);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}><Ruler color={Colors.dark.primary} size={24} /><Text style={styles.cardTitle}>長さ (フィート)</Text></View>
      <View style={styles.subCard}>
        <Text style={styles.hintText}>5.11は「5ft 11in」の意味です。(12進法に完全対応)</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><CustomPicker value={selectedFt} options={FT_OPTIONS} onSelect={setSelectedFt} suffix=" ft" /></View>
          <View style={styles.equals}><Text style={{ color: Colors.dark.icon }}>＝</Text></View>
          <View style={styles.targetBox}><Text style={styles.targetValue}>{(cmValue / 100).toFixed(2)} <Text style={{ fontSize: 12 }}>m</Text></Text></View>
        </View>
      </View>
    </View>
  );
}


export default function ToolsScreen() {
  const [activeMenu, setActiveMenu] = useState('line_fluoro');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.tab, activeMenu === cat.id && styles.tabActive]}
              onPress={() => setActiveMenu(cat.id)}
            >
              <Text style={[styles.tabText, activeMenu === cat.id && styles.tabTextActive]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeMenu === 'line_fluoro' && <LineFluoroSection />}
        {activeMenu === 'line_pe' && <LinePeSection />}
        {activeMenu === 'weight' && <WeightsSection />}
        {activeMenu === 'length' && <LengthSection />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  tabsContainer: { padding: 16, gap: 8 },
  tab: { paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.dark.border },
  tabActive: { backgroundColor: Colors.dark.primary, borderColor: Colors.dark.primary },
  tabText: { color: Colors.dark.icon, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  card: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.dark.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text },
  subCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, marginBottom: 12 },
  subCardTitle: { color: Colors.dark.secondary, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  resultList: { marginTop: 16, backgroundColor: Colors.dark.background, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.dark.border },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  resultLabel: { color: Colors.dark.text, fontSize: 16, fontWeight: '500' },
  resultValueContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  resultValueText: { color: Colors.dark.primary, fontSize: 20, fontWeight: 'bold' },
  resultUnitText: { color: Colors.dark.icon, fontSize: 14 },
  resultBox: { width: '48%', backgroundColor: Colors.dark.background, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border },
  resultValue: { color: Colors.dark.primary, fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  resultUnit: { color: Colors.dark.icon, fontSize: 12 },
  pickerButton: { flexDirection: 'row', backgroundColor: Colors.dark.background, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: 8, padding: 12, alignItems: 'center', justifyContent: 'space-between' },
  pickerButtonCompact: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  pickerButtonText: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  pickerButtonTextCompact: { fontSize: 14, color: Colors.dark.primary },
  modeToggle: { padding: 8 },
  textInput: { flex: 1, backgroundColor: Colors.dark.background, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: 8, color: Colors.dark.text, fontSize: 16, paddingHorizontal: 12, paddingVertical: 10, textAlign: 'center' },
  equals: { paddingHorizontal: 12 },
  targetBox: { flex: 1, backgroundColor: 'rgba(14, 165, 233, 0.1)', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  targetValue: { color: Colors.dark.primary, fontSize: 18, fontWeight: 'bold' },
  hintText: { fontSize: 13, color: Colors.dark.icon, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.dark.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '60%' },
  modalTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  modalItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  modalItemText: { color: Colors.dark.text, fontSize: 18 },
  modalCloseBtn: { padding: 20, alignItems: 'center', backgroundColor: Colors.dark.border, marginTop: 16 },
  modalCloseText: { color: Colors.dark.text, fontWeight: 'bold', fontSize: 16 }
});
