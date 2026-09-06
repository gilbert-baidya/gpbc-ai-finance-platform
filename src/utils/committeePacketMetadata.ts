import { MonthlyCommitteeApprovalRecord } from '../api/committeeApi';

export interface CommitteePacketDocumentMetadata {
  documentType: 'Committee Approval Packet';
  relatedEntityType: 'MONTHLY_COMMITTEE_APPROVAL';
  relatedEntityId: string;
  periodKey: string;
  packetVersion: number;
  packetHash: string;
}

export function buildCommitteePacketDocumentMetadata(
  approval: MonthlyCommitteeApprovalRecord
): CommitteePacketDocumentMetadata {
  return {
    documentType: 'Committee Approval Packet',
    relatedEntityType: 'MONTHLY_COMMITTEE_APPROVAL',
    relatedEntityId: approval.approvalId,
    periodKey: approval.periodKey,
    packetVersion: approval.packetVersion,
    packetHash: approval.packetHash
  };
}
