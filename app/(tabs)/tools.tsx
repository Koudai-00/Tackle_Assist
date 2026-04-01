import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../constants/theme';
import { Wrench } from 'lucide-react-native';

export default function ToolsScreen() {
  return (
    <View style={styles.container}>
      <Wrench color={Colors.dark.primary} size={48} />
      <Text style={styles.title}>単位変換＆ツール</Text>
      <Text style={styles.subtitle}>近日実装予定</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: Colors.dark.background 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: Colors.dark.text,
    marginTop: 16,
  },
  subtitle: {
    color: Colors.dark.icon,
    marginTop: 8,
  }
});
