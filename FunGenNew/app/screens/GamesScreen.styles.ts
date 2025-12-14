import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECEFF1',
  },
  waiting: {
    backgroundColor: '#FFEB3B',
  },
  ready: {
    backgroundColor: '#4CAF50',
  },
  text: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  best: {
    fontSize: 16,
    color: '#555',
  },
  tapAgain: {
    marginTop: 16,
    fontSize: 14,
    color: '#333',
  },
});

export default styles;
