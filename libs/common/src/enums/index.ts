export enum Role {
  BANK = 'bank',
  MART = 'mart',
  ADMIN = 'admin',
}

export enum ReceivingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum SettlementStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

export enum CreditGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
}

export enum RiskLevel {
  STABLE = 1,
  CAUTION = 2,
  WARNING = 3,
  DANGER = 4,
}
