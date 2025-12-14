import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
  },
  retryText: {
    marginTop: 10,
    color: '#1976D2',
    fontWeight: '600',
  },
  moodCard: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  moodEmoji: {
    fontSize: 48,
  },
  moodText: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flex: 1,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    color: '#777',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
  },
  timestamp: {
    marginTop: 14,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  disclaimer: {
    marginTop: 6,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default styles;
