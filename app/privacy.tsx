import React from 'react';
import { StyleSheet, ScrollView, Text, View, Platform, Linking, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const openLink = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'プライバシーポリシー', headerBackTitle: '戻る' }} />
      
      <Text style={styles.title}>プライバシーポリシー</Text>
      <Text style={styles.date}>【最終更新日：2026年4月】</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 情報の取得について</Text>
        <Text style={styles.text}>
          本アプリ（Fishing Agent）は、サービスの提供および利便性の向上のため、以下の情報を取得・利用します。
        </Text>
        <Text style={styles.bullet}>・カメラおよび写真ライブラリへのアクセス</Text>
        <Text style={styles.text}>
          釣具アイテムの画像を登録するため、デバイスのカメラおよびカメラロール（写真アルバム）にアクセスします。取得した画像データはご本人の端末内、およびお客様のデータを同期するためのデータベースにのみ保存され、開発者を含む第三者が他の目的で閲覧・利用することはありません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 広告の配信について</Text>
        <Text style={styles.text}>
          本アプリでは、第三者配信の広告ツール（Google AdMob）を利用しています。
          広告配信事業者は、ユーザーの興味に応じた広告を表示するために、Cookieや広告ID（Advertising ID / IDFA）等のデータを使用することがあります。
          これらの情報の取り扱いについては、下記のGoogleのポリシーをご参照ください。
        </Text>
        <Text 
          style={styles.link} 
          onPress={() => openLink('https://policies.google.com/technologies/ads?hl=ja')}
        >
          Google ポリシーと規約（広告）
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 解析ツールについて</Text>
        <Text style={styles.text}>
          本アプリの利用状況を把握し機能改善に役立てるため、アプリ内でトラブルが発生した際のエラーログ情報等を取得する場合があります。これらは匿名で収集されており、個人を特定するものではありません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 第三者への情報提供</Text>
        <Text style={styles.text}>
          本アプリは、法令等の定めに基づく場合を除き、取得した個人を特定できる情報をユーザーの同意なしに第三者へ提供することはありません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. 免責事項</Text>
        <Text style={styles.text}>
          本アプリが提供する機能や情報を用いて生じた損害について、開発者は一切の責任を負いません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. プライバシーポリシーの変更について</Text>
        <Text style={styles.text}>
          本アプリは、必要に応じて本プライバシーポリシーを変更することがあります。変更後のプライバシーポリシーは、本ページ内に掲示された時点から効力を生じるものとします。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. お問い合わせ先</Text>
        <Text style={styles.text}>
          本アプリに関するお問い合わせや、プライバシーポリシーに関するご質問は、以下の「お問い合わせフォーム」よりお願いいたします。
        </Text>
        
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => router.push('/inquiry')}
        >
          <Text style={styles.actionBtnText}>お問い合わせフォームを開く</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: Colors.dark.icon,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: Colors.dark.text,
    lineHeight: 24,
  },
  bullet: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  link: {
    fontSize: 15,
    color: Colors.dark.primary,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
  actionBtn: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  actionBtnText: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
    fontSize: 15,
  }
});
