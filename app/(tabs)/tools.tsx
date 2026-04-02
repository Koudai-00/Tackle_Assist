import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { Colors } from '../../constants/theme';
import { Anchor, Weight, Ruler, ChevronDown, Edit2, List } from 'lucide-react-native';

const NYLON_OPTIONS = [0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 1.75, 2, 2.25, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20];
const PE_OPTIONS = [0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
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

const NYLON_LB_MAP: Record<number, number> = {
  0.25: 1, 0.3: 1.2, 0.4: 1.5, 0.5: 2, 0.6: 2.5, 0.8: 3, 1: 4, 1.2: 5, 1.5: 6, 1.75: 7, 2: 8, 2.25: 9, 2.5: 10,
  3: 12, 3.5: 14, 4: 16, 5: 20, 6: 25, 7: 30, 8: 35, 10: 40, 12: 50, 14: 60, 16: 70, 18: 80, 20: 90
};
const PE_LB_MAP: Record<number, number> = {
  0.1: 2, 0.15: 3, 0.2: 4, 0.3: 6, 0.4: 8, 0.5: 10, 0.6: 12, 0.8: 16, 1: 20, 1.2: 24, 1.5: 30, 
  2: 40, 2.5: 50, 3: 60, 4: 80, 5: 100, 6: 120, 8: 150, 10: 200
};

const CATEGORIES = [
  { id: 'line_fluoro', title: 'ライン (ナイロンなど)' },
  { id: 'line_pe', title: 'ライン (PE)' },
  { id: 'weight', title: '重さ・ウエイト' },
  { id: 'length', title: '長さ' }
];

function CustomPicker({ value, options, onSelect, suffix = '' }: any) {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.pickerButtonText}>
          {typeof value === 'object' ? value.label : value}{suffix}
        </Text>
        <ChevronDown color={Colors.dark.icon} size={20} />
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
                    {typeof item === 'object' ? item.label : item}{suffix}
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

function LineFluoroSection() {
  const [gou, setGou] = useState(1);
  const lb = NYLON_LB_MAP[gou] || gou * 4;
  const kg = lb * 0.453592;
  const mm = Math.sqrt(gou) * 0.165;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}><Anchor color={Colors.dark.primary} size={24} /><Text style={styles.cardTitle}>ナイロン・フロロ・エステル</Text></View>
      <View style={styles.subCard}>
        <View style={styles.row}>
          <Text style={styles.label}>号数</Text>
          <View style={{ width: 140 }}><CustomPicker value={gou} options={NYLON_OPTIONS} onSelect={setGou} suffix=" 号" /></View>
        </View>
        <View style={styles.resultGrid}>
          <View style={styles.resultBox}><Text style={styles.resultValue}>{lb.toFixed(1)}</Text><Text style={styles.resultUnit}>lb (ポンド)</Text></View>
          <View style={styles.resultBox}><Text style={styles.resultValue}>{kg.toFixed(2)}</Text><Text style={styles.resultUnit}>kg</Text></View>
          <View style={styles.resultBox}><Text style={styles.resultValue}>{mm.toFixed(3)}</Text><Text style={styles.resultUnit}>mm</Text></View>
        </View>
      </View>
    </View>
  );
}

function LinePeSection() {
  const [gou, setGou] = useState(0.8);
  const lb = PE_LB_MAP[gou] || gou * 20;
  const kg = lb * 0.453592;
  const mm = Math.sqrt(gou) * 0.17;
  const d = Math.round(gou * 200);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}><Anchor color={Colors.dark.primary} size={24} /><Text style={styles.cardTitle}>PEライン</Text></View>
      <View style={styles.subCard}>
        <View style={styles.row}>
          <Text style={styles.label}>号数</Text>
          <View style={{ width: 140 }}><CustomPicker value={gou} options={PE_OPTIONS} onSelect={setGou} suffix=" 号" /></View>
        </View>
        <View style={styles.resultGrid}>
          <View style={styles.resultBox}><Text style={styles.resultValue}>{lb.toFixed(1)}</Text><Text style={styles.resultUnit}>lb (ポンド)</Text></View>
          <View style={styles.resultBox}><Text style={styles.resultValue}>{kg.toFixed(2)}</Text><Text style={styles.resultUnit}>kg</Text></View>
          <View style={styles.resultBox}><Text style={styles.resultValue}>{mm.toFixed(3)}</Text><Text style={styles.resultUnit}>mm (太さ)</Text></View>
          <View style={styles.resultBox}><Text style={styles.resultValue}>{d}</Text><Text style={styles.resultUnit}>d (デニール)</Text></View>
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
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  resultBox: { width: '48%', backgroundColor: Colors.dark.background, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border },
  resultValue: { color: Colors.dark.primary, fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  resultUnit: { color: Colors.dark.icon, fontSize: 12 },
  pickerButton: { flexDirection: 'row', backgroundColor: Colors.dark.background, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: 8, padding: 12, alignItems: 'center', justifyContent: 'space-between' },
  pickerButtonText: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
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
