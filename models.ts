import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  memberId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNumber: { type: String, default: '' },
  region: { type: String, default: '' },
  province: { type: String, default: '' },
  city: { type: String, default: '' },
  barangay: { type: String, default: '' },
  streetAddress: { type: String, default: '' },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: [
      'Regular Member', 
      'Associate Member', 
      'System Administrator', 
      'Evaluator', 
      'Reviewer', 
      'Approver', 
      'Disbursement'
    ], 
    default: 'Regular Member' 
  },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', UserSchema);

const LoanTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String, default: 'Info' },
  description: { type: String, default: '' },
  interestRate: { type: Number, default: 0.12 }, // Annual rate
  allowedTerms: { type: [Number], default: [6, 12, 18, 24] }, // Months
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const LoanType = mongoose.model('LoanType', LoanTypeSchema);

const AmortizationSchema = new mongoose.Schema({
  period: Number,
  dueDate: Date,
  principal: Number,
  interest: Number,
  totalPayment: Number,
  remainingBalance: Number,
  status: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
});

const LoanSchema = new mongoose.Schema({
  memberId: { type: String, required: true },
  name: { type: String, required: true }, // Denormalized for scannability
  loanType: { type: String, required: true },
  principalAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true }, // Annual rate (e.g., 0.12 for 12%)
  termMonths: { type: Number, required: true },
  status: { 
    type: String, 
    enum: [
      'Pending', 
      'Under Evaluation', 
      'Reviewed', 
      'Approved', 
      'Disbursed', 
      'Rejected'
    ], 
    default: 'Pending' 
  },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  disbursedAt: { type: Date },
  amortizationSchedule: [AmortizationSchema],
  history: [{
    status: String,
    updatedBy: String,
    timestamp: { type: Date, default: Date.now },
    comment: String
  }]
});

export const Loan = mongoose.model('Loan', LoanSchema);

const PaymentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  memberId: { type: String, required: true },
  amountPaid: { type: Number, required: true },
  datePaid: { type: Date, default: Date.now },
  referenceNumber: { type: String, required: true, unique: true },
  method: { type: String, enum: ['Cash', 'Bank Transfer', 'Salary Deduction'], default: 'Cash' },
  verified: { type: Boolean, default: false }
});

export const Payment = mongoose.model('Payment', PaymentSchema);
