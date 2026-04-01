import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../constants/theme';
import { Backpack } from 'lucide-react-native';

export default function PackingScreen() {
  return (
    <View style={styles.container}>
      <Backpack color={Colors.dark.primary} size={48} />
      <Text style={styles.title}>AI パッキング提案</Text>
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
