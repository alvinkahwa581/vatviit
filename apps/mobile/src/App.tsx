import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Tab = 'Home' | 'Markets' | 'Portfolio' | 'Account';

const tabs: Tab[] = ['Home', 'Markets', 'Portfolio', 'Account'];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>VaTViT</Text>
          <Text style={styles.status}>EARLY PREVIEW</Text>
        </View>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>A clearer view of your trading</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Your trading workspace, in your pocket.
          </Text>
          <Text style={styles.body}>
            VaTViT is in development. Market feeds and account connections are
            not available in this preview.
          </Text>
        </View>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {activeTab}
        </Text>
        {activeTab === 'Home' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Built in stages</Text>
            <Text style={styles.body}>
              This preview contains no connected accounts, live quotes, or order
              execution.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{activeTab} are in development</Text>
            <Text style={styles.body}>
              This area will remain unavailable until its data sources,
              permissions, and safety requirements are verified.
            </Text>
          </View>
        )}
      </ScrollView>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {tabs.map((tab) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={styles.tab}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTab]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0e15' },
  content: { flexGrow: 1, padding: 24, paddingTop: 64, gap: 28 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: { color: '#ffd700', fontSize: 24, fontWeight: '700' },
  status: { color: '#00ff88', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  hero: { gap: 14, paddingVertical: 28 },
  eyebrow: { color: '#ffd700', fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  title: {
    color: '#f4f1e8',
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 46,
    maxWidth: 420,
  },
  body: { color: '#c4c8ce', fontSize: 16, lineHeight: 24 },
  sectionTitle: { color: '#f4f1e8', fontSize: 24, fontWeight: '700' },
  card: {
    backgroundColor: '#141a24',
    borderColor: '#39424f',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  cardTitle: { color: '#f4f1e8', fontSize: 18, fontWeight: '700' },
  tabs: {
    backgroundColor: '#0f1419',
    borderTopColor: '#283341',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 24,
    paddingTop: 12,
  },
  tab: { alignItems: 'center', flex: 1, minHeight: 44, justifyContent: 'center' },
  tabLabel: { color: '#c4c8ce', fontSize: 12, fontWeight: '600' },
  activeTab: { color: '#ffd700' },
});

export default App;
