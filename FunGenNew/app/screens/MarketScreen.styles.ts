import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },

  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },

  errorText: {
    fontSize: 18,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 8,
  },

  retryButton: {
    marginTop: 16,
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  /* ======================
     HEADER
     ====================== */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },

  autoRefreshButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  autoRefreshText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },

  /* ======================
     INDEX TOGGLE
     ====================== */
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },

  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },

  toggleActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  toggleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },

  toggleActiveText: {
    color: '#6366F1',
  },

  /* ======================
     SPOT PRICE CARD
     ====================== */
  spotCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },

  spotLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  spotPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
    letterSpacing: -1,
  },

  spotBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  spotBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* ======================
     BIAS CARD
     ====================== */
  biasCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  biasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  biasEmoji: {
    fontSize: 48,
    marginRight: 16,
  },

  biasTextContainer: {
    flex: 1,
  },

  biasText: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },

  confidenceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  scoreContainer: {
    marginTop: 20,
    gap: 12,
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  scoreLabel: {
    width: 40,
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },

  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },

  scoreBar: {
    height: '100%',
    borderRadius: 4,
  },

  bullishBar: {
    backgroundColor: '#10B981',
  },

  bearishBar: {
    backgroundColor: '#EF4444',
  },

  scoreValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  /* ======================
     GRID INDICATORS
     ====================== */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },

  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  gridIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  gridLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  gridValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
    letterSpacing: -0.5,
  },

  gridSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },

  /* ======================
     SECTION HEADERS
     ====================== */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 8,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  sectionIcon: {
    fontSize: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  expandIcon: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },

  /* ======================
     ZONE CARDS
     ====================== */
  zoneContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },

  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },

  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  strikeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  zoneBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  resistanceBadge: {
    backgroundColor: '#FEE2E2',
  },

  zoneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.3,
  },

  zoneRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },

  zoneItem: {
    flex: 1,
  },

  zoneItemLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  zoneItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  /* ======================
     ZONE TOTALS
     ====================== */
  totalsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },

  totalsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  totalItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
  },

  totalLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },

  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  /* ======================
     SIGNALS CARD
     ====================== */
  signalsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FDE047',
  },

  signalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },

  signalsIcon: {
    fontSize: 20,
  },

  signalsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#854D0E',
    letterSpacing: -0.2,
  },

  signalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },

  signalBullet: {
    fontSize: 18,
    color: '#CA8A04',
    marginRight: 8,
    marginTop: -2,
  },

  signalText: {
    flex: 1,
    fontSize: 14,
    color: '#713F12',
    lineHeight: 20,
    fontWeight: '500',
  },

  /* ======================
     TIMESTAMP
     ====================== */
  timestampCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
  },

  timestampIcon: {
    fontSize: 16,
  },

  timestampText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },

  /* ======================
     DISCLAIMER
     ====================== */
  disclaimerCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },

  disclaimerIcon: {
    fontSize: 18,
    marginTop: 2,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
    fontWeight: '500',
  },
});
