export type UserRole = 'Member' | 'Admin';

export interface User {
  id: string;
  memberId: string;
  name: string;
  role: UserRole;
}

export interface Amortization {
  period: number;
  dueDate: string;
  principal: number;
  interest: number;
  totalPayment: number;
  remainingBalance: number;
  status: 'Unpaid' | 'Paid';
}

export interface LoanHistory {
  status: string;
  updatedBy: string;
  timestamp: string;
  comment?: string;
}

export interface Loan {
  _id: string;
  memberId: string;
  name: string;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  status: 'Pending' | 'Under Evaluation' | 'Approved' | 'Disbursed' | 'Rejected';
  createdAt: string;
  approvedAt?: string;
  disbursedAt?: string;
  amortizationSchedule: Amortization[];
  history: LoanHistory[];
}

export interface Payment {
  _id: string;
  loanId: string;
  memberId: string;
  amountPaid: number;
  datePaid: string;
  referenceNumber: string;
  method: string;
  verified: boolean;
}
