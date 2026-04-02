import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { Colors } from '../../constants/theme';

interface Option {
  id: string;
  label: string;
}

interface Props {
  options: Option[];
  selectedValue: string;
  onSelect: (val: string) => void;
  placeholder?: string;
  label?: string;
}

export default function DropdownBtn({ options, selectedValue, onSelect, placeholder = '選択', label }: Props) {
  const [visible, setVisible] = useState(false);

  const selectedItem = options.find(o => o.id === selectedValue);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.button} onPress={() => setVisible(true)}>
        <Text style={styles.btnText}>{selectedItem ? selectedItem.label : placeholder}</Text>
        <ChevronDown color={Colors.dark.icon} size={20} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{label || '項目を選択'}</Text>
                  <TouchableOpacity onPress={() => setVisible(false)} style={{ padding: 4 }}>
                    <X color={Colors.dark.icon} size={24} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={options}
                  keyExtractor={item => item.id}
                  style={{ maxHeight: 300 }}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.optionRow, item.id === selectedValue && styles.optionActive]}
                      onPress={() => { onSelect(item.id); setVisible(false); }}
                    >
                      <Text style={[styles.optionText, item.id === selectedValue && styles.optionTextActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 0 },
  label: { fontSize: 11, color: Colors.dark.icon, marginBottom: 2 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  btnText: { color: Colors.dark.text, fontSize: 13, flex: 1 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.dark.background, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: Colors.dark.border },
  modalTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  
  optionRow: { padding: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  optionActive: { backgroundColor: Colors.dark.surface },
  optionText: { color: Colors.dark.text, fontSize: 16 },
  optionTextActive: { color: Colors.dark.primary, fontWeight: 'bold' }
});
