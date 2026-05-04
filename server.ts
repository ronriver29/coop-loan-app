import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { User, Loan, Payment, LoanType } from './models.ts';
import { sendWelcomeEmail, sendLoanStatusUpdate, sendPasswordResetEmail } from './src/services/emailService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Use a more robust check for MONGODB_URI
const rawUri = (process.env.MONGODB_URI || '').trim().replace(/^["']|["']$/g, '');
const isValidUri = rawUri.startsWith('mongodb://') || rawUri.startsWith('mongodb+srv://');
const MONGODB_URI = isValidUri ? rawUri : 'mongodb://localhost:27017/loan_manager';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1); // Trust the first proxy (Cloud Run)
  app.use(express.json());
  app.use(cookieParser());

  // Connect to MongoDB
  try {
    if (!isValidUri && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  MONGODB_URI is not set or invalid in production environment.');
      console.warn('Please configure MONGODB_URI in the Secrets panel.');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Seed Loan Types if empty
    const count = await LoanType.countDocuments();
    if (count === 0) {
      await LoanType.insertMany([
        { name: 'Emergency', icon: 'Zap', description: 'Medical emergencies, urgent repairs' },
        { name: 'Providential', icon: 'ShieldCheck', description: 'Household needs, appliances' },
        { name: 'Educational', icon: 'GraduationCap', description: 'Tuition fees, school supplies' },
        { name: 'Business', icon: 'Store', description: 'Small business capital, inventory' },
      ]);
      console.log('🌱 Seeded initial loan types');
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }

  // Database readiness middleware
  const checkDb = (req: any, res: any, next: any) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database is currently unavailable. Please ensure MONGODB_URI is configured correctly.' });
    }
    next();
  };

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) {
      console.warn('🔐 Auth Failure: No token found in cookies');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      console.warn('🔐 Auth Failure: Invalid or expired token');
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'System Administrator' && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };

  const isStaff = (req: any, res: any, next: any) => {
    const staffRoles = ['System Administrator', 'Admin', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'];
    if (!staffRoles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  // --- Helpers ---
  const handleMongoError = (err: any, res: any) => {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'account';
      const formattedField = field === 'memberId' ? 'Member ID' : field.charAt(0).toUpperCase() + field.slice(1);
      return res.status(409).json({ error: `Conflicting Record: ${formattedField} already exists in our archives.` });
    }
    return res.status(400).json({ error: err.message });
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/register', authenticate, isAdmin, checkDb, async (req, res) => {
    try {
      const { memberId, name, email, password, role, contactNumber, region, province, city, barangay, streetAddress } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ 
        memberId, 
        name, 
        email, 
        contactNumber,
        password: hashedPassword, 
        role, 
        region, 
        province, 
        city, 
        barangay, 
        streetAddress 
      });
      await user.save();
      
      // Async send email (don't block response)
      sendWelcomeEmail(email, name, password).catch(console.error);

      res.status(201).json({ message: 'User registered' });
    } catch (err: any) {
      handleMongoError(err, res);
    }
  });

  app.post('/api/auth/login', checkDb, async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ 
        id: user._id, 
        role: user.role, 
        memberId: user.memberId, 
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber || '',
        region: user.region || '',
        province: user.province || '',
        city: user.city || '',
        barangay: user.barangay || '',
        streetAddress: user.streetAddress || ''
      }, JWT_SECRET, { expiresIn: '1d' });
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
      res.json({ 
        id: user._id, 
        role: user.role, 
        memberId: user.memberId, 
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber || '',
        region: user.region || '',
        province: user.province || '',
        city: user.city || '',
        barangay: user.barangay || '',
        streetAddress: user.streetAddress || ''
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/forgot-password', checkDb, async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(200).json({ message: 'If an account exists with that email, a reset link has been sent.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      user.resetToken = token;
      user.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      const resetLink = `${appUrl}/reset-password?token=${token}`;
      
      sendPasswordResetEmail(user.email, user.name, resetLink).catch(console.error);

      res.status(200).json({ message: 'If an account exists with that email, a reset link has been sent.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/reset-password', checkDb, async (req, res) => {
    try {
      const { token, password } = req.body;
      const user = await User.findOne({ 
        resetToken: token,
        resetTokenExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
      }

      user.password = await bcrypt.hash(password, 10);
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      await user.save();

      res.status(200).json({ message: 'Password has been successfully reset.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Delinquency Logic ---
  async function checkDelinquentLoans() {
    console.log('⏳ Running delinquency check...');
    const now = new Date();
    const thresholdDate = new Date(now);
    thresholdDate.setDate(now.getDate() - 30); // 30 days grace period

    try {
      const delinquentLoans = await Loan.find({
        status: 'Disbursed',
        'amortizationSchedule': {
          $elemMatch: {
            status: 'Unpaid',
            dueDate: { $lt: thresholdDate }
          }
        }
      });

      for (const loan of delinquentLoans) {
        loan.status = 'Delinquent';
        loan.history.push({
          status: 'Delinquent',
          updatedBy: 'System',
          comment: 'Auto-flagged: At least one installment is overdue by 30+ days.'
        });
        await loan.save();
        console.log(`🚩 Loan ${loan._id} flagged as Delinquent`);
      }
    } catch (err) {
      console.error('❌ Delinquency check error:', err);
    }
  }

  // Run every 6 hours
  setInterval(checkDelinquentLoans, 6 * 60 * 60 * 1000);
  // Run once on startup after 10s
  setTimeout(checkDelinquentLoans, 10000);

  app.post('/api/admin/trigger-delinquency-check', authenticate, isStaff, async (req, res) => {
    await checkDelinquentLoans();
    res.json({ message: 'Delinquency check triggered' });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  });

  app.get('/api/auth/me', authenticate, (req: any, res) => {
    res.json(req.user);
  });

  // Loan Types
  app.get('/api/loan-types', checkDb, async (req, res) => {
    try {
      const types = await LoanType.find().sort({ name: 1 });
      res.json(types);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/loan-types', authenticate, isAdmin, checkDb, async (req, res) => {
    try {
      const type = new LoanType(req.body);
      await type.save();
      res.status(201).json(type);
    } catch (err: any) {
      handleMongoError(err, res);
    }
  });

  app.patch('/api/loan-types/:id', authenticate, isAdmin, checkDb, async (req, res) => {
    try {
      const type = await LoanType.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!type) return res.status(404).json({ error: 'Loan type not found' });
      res.json(type);
    } catch (err: any) {
      handleMongoError(err, res);
    }
  });

  app.delete('/api/loan-types/:id', authenticate, isAdmin, checkDb, async (req, res) => {
    try {
      const type = await LoanType.findByIdAndDelete(req.params.id);
      if (!type) return res.status(404).json({ error: 'Loan type not found' });
      res.json({ message: 'Loan type deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/users', authenticate, isAdmin, checkDb, async (req, res) => {
    try {
      const users = await User.find({}, '-password').sort({ createdAt: -1 });
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/users/:id', authenticate, isAdmin, checkDb, async (req: any, res: any) => {
    try {
      const { name, email, contactNumber, region, province, city, barangay, streetAddress, role, memberId } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (name) user.name = name;
      if (email) user.email = email;
      if (memberId) user.memberId = memberId;
      if (role) user.role = role;
      if (contactNumber !== undefined) user.contactNumber = contactNumber;
      if (region !== undefined) user.region = region;
      if (province !== undefined) user.province = province;
      if (city !== undefined) user.city = city;
      if (barangay !== undefined) user.barangay = barangay;
      if (streetAddress !== undefined) user.streetAddress = streetAddress;

      await user.save();
      res.json(user);
    } catch (err: any) {
      handleMongoError(err, res);
    }
  });

  app.patch('/api/auth/profile', authenticate, checkDb, async (req: any, res) => {
    try {
      const { name, email, password, contactNumber, region, province, city, barangay, streetAddress } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (name) user.name = name;
      if (email) user.email = email;
      if (contactNumber !== undefined) user.contactNumber = contactNumber;
      if (region !== undefined) user.region = region;
      if (province !== undefined) user.province = province;
      if (city !== undefined) user.city = city;
      if (barangay !== undefined) user.barangay = barangay;
      if (streetAddress !== undefined) user.streetAddress = streetAddress;
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      await user.save();

      // Update JWT in cookie with new info
      const token = jwt.sign({ 
        id: user._id, 
        role: user.role, 
        memberId: user.memberId, 
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber || '',
        region: user.region || '',
        province: user.province || '',
        city: user.city || '',
        barangay: user.barangay || '',
        streetAddress: user.streetAddress || ''
      }, JWT_SECRET, { expiresIn: '1d' });
      
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000 
      });

      res.json({ 
        id: user._id, 
        role: user.role, 
        memberId: user.memberId, 
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber || '',
        region: user.region || '',
        province: user.province || '',
        city: user.city || '',
        barangay: user.barangay || '',
        streetAddress: user.streetAddress || ''
      });
    } catch (err: any) {
      handleMongoError(err, res);
    }
  });

  // Loans
  app.post('/api/loans', authenticate, checkDb, async (req: any, res) => {
    try {
      const { loanType: loanTypeName, principalAmount, termMonths } = req.body;
      
      // Basic presence validation
      if (!loanTypeName || !principalAmount || !termMonths) {
        return res.status(400).json({ error: 'Missing required fields: loanType, principalAmount, and termMonths are mandatory.' });
      }

      // Type and range validation
      if (typeof principalAmount !== 'number' || principalAmount < 1000 || principalAmount > 500000) {
        return res.status(400).json({ error: 'Invalid principal amount. Must be a numeric value between ₱1,000 and ₱500,000.' });
      }

      if (typeof termMonths !== 'number' || termMonths <= 0) {
        return res.status(400).json({ error: 'Invalid term duration. Must be a positive numeric value.' });
      }
      
      const type = await LoanType.findOne({ name: loanTypeName, isActive: true });
      if (!type) {
        return res.status(400).json({ error: 'Invalid or inactive loan program selected.' });
      }

      // Allowed terms validation
      if (type.allowedTerms && type.allowedTerms.length > 0 && !type.allowedTerms.includes(termMonths)) {
        return res.status(400).json({ error: `The selected term (${termMonths} months) is not offered for the ${loanTypeName} program. Offereed terms: ${type.allowedTerms.join(', ')} months.` });
      }

      const rate = type.interestRate || 0.12;
      
      const r = rate / 12; // Monthly rate
      const n = termMonths;
      const P = principalAmount;
      const M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      
      const schedule = [];
      let balance = P;
      const now = new Date();
      
      for (let i = 1; i <= n; i++) {
        const interest = balance * r;
        const principal = M - interest;
        balance -= principal;
        
        const dueDate = new Date(now);
        dueDate.setMonth(now.getMonth() + i);
        
        schedule.push({
          period: i,
          dueDate,
          principal: Math.round(principal * 100) / 100,
          interest: Math.round(interest * 100) / 100,
          totalPayment: Math.round(M * 100) / 100,
          remainingBalance: Math.round(Math.max(0, balance) * 100) / 100,
          status: 'Unpaid'
        });
      }

      const loan = new Loan({
        memberId: req.user.memberId,
        name: req.user.name,
        loanType: loanTypeName,
        principalAmount,
        interestRate: rate,
        termMonths,
        amortizationSchedule: schedule,
        history: [{ status: 'Pending', updatedBy: req.user.name, comment: 'Application submitted via interface' }]
      });
      await loan.save();
      console.log(`✅ Loan applied successfully: ${loan._id} by ${req.user.memberId}`);
      res.status(201).json(loan);
    } catch (err: any) {
      console.error('❌ Loan application error:', err);
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/loans', authenticate, checkDb, async (req: any, res: any) => {
    try {
      const staffRoles = ['System Administrator', 'Admin', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'];
      const query = staffRoles.includes(req.user.role) ? {} : { memberId: req.user.memberId };
      const loans = await Loan.find(query).sort({ createdAt: -1 });
      res.json(loans);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/loans/:id', authenticate, checkDb, async (req: any, res: any) => {
    try {
      const loan = await Loan.findById(req.params.id);
      if (!loan) return res.status(404).json({ error: 'Loan not found' });
      
      const staffRoles = ['System Administrator', 'Admin', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'];
      if (!staffRoles.includes(req.user.role) && loan.memberId !== req.user.memberId) {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }
      
      res.json(loan);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/loans/:id/status', authenticate, isStaff, async (req: any, res: any) => {
    try {
      const { status, comment, rejectionReason } = req.body;
      const loan: any = await Loan.findById(req.params.id);
      if (!loan) return res.status(404).json({ error: 'Loan not found' });

      // Workflow Validation
      const role = req.user.role;
      const isAdmin = role === 'System Administrator' || role === 'Admin';
      
      // Define transitions: currentStatus -> targetStatus -> authorizedRoles
      const transitions: Record<string, Record<string, string[]>> = {
        'Pending': {
          'Under Evaluation': ['Evaluator'],
          'Rejected': ['Evaluator']
        },
        'Under Evaluation': {
          'Reviewed': ['Reviewer'],
          'Rejected': ['Reviewer'],
          'Pending': ['Reviewer'] // Allow sending back to pending if info is missing
        },
        'Reviewed': {
          'Approved': ['Approver'],
          'Rejected': ['Approver'],
          'Under Evaluation': ['Approver'] // Allow sending back to evaluation
        },
        'Approved': {
          'Disbursed': ['Disbursement'],
          'Reviewed': ['Disbursement'] // Allow sending back to reviewed
        },
        'Disbursed': {
           // Closed is handled by payment logic usually, but maybe an admin can close it
          'Closed': ['Admin', 'System Administrator'],
          'Delinquent': ['Admin', 'System Administrator']
        },
        'Delinquent': {
          'Disbursed': ['Admin', 'System Administrator'],
          'Closed': ['Admin', 'System Administrator']
        }
      };

      const allowedTransitions = transitions[loan.status];
      if (!allowedTransitions) {
        return res.status(400).json({ error: `Loan is in '${loan.status}' status. No further manual transitions are allowed.` });
      }

      const authorizedRoles = allowedTransitions[status];
      if (!authorizedRoles) {
        return res.status(400).json({ error: `Status '${status}' is not a valid next step from '${loan.status}'` });
      }

      if (!isAdmin && !authorizedRoles.includes(role)) {
        return res.status(403).json({ error: `Role '${role}' is not authorized to move loan from '${loan.status}' to '${status}'` });
      }

      loan.status = status;
      loan.history.push({ 
        status, 
        updatedBy: req.user.name, 
        comment: comment || `Status updated to ${status}`,
        rejectionReason: status === 'Rejected' ? rejectionReason : undefined
      });

      if (status === 'Approved') {
        loan.approvedAt = new Date();
      } else if (status === 'Disbursed' && (!loan.amortizationSchedule || loan.amortizationSchedule.length === 0)) {
        loan.disbursedAt = new Date();
        // Generate Amortization Table
        loan.amortizationSchedule = calculateAmortization(loan.principalAmount, loan.interestRate, loan.termMonths);
      }

      await loan.save();

      // Notify User
      const borrower = await User.findOne({ memberId: loan.memberId });
      if (borrower && borrower.email) {
        sendLoanStatusUpdate(borrower.email, borrower.name, loan._id.toString(), status, comment || '', rejectionReason).catch(console.error);
      }

      res.json(loan);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Amortization Table Calculation
  function calculateAmortization(P: number, annualRate: number, n: number) {
    const r = annualRate / 12;
    const M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    let balance = P;
    const schedule = [];
    const now = new Date();
    
    for (let i = 1; i <= n; i++) {
      const interest = balance * r;
      const principal = M - interest;
      balance -= principal;
      
      schedule.push({
        period: i,
        dueDate: new Date(now.getFullYear(), now.getMonth() + i, 15),
        principal: Number(principal.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        totalPayment: Number(M.toFixed(2)),
        remainingBalance: Number(Math.max(0, balance).toFixed(2)),
        status: 'Unpaid'
      });
    }
    return schedule;
  }

  // Payments
  app.post('/api/payments', authenticate, checkDb, async (req: any, res) => {
    try {
      const { loanId, amountPaid, referenceNumber, method } = req.body;
      const staffRoles = ['System Administrator', 'Admin', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'];
      const isStaff = staffRoles.includes(req.user.role);

      if (!loanId || !amountPaid || !referenceNumber) {
        return res.status(400).json({ error: 'Missing payment details: loanId, amountPaid, and referenceNumber are required.' });
      }

      // 1. Check for duplicate reference number
      const existingPayment = await Payment.findOne({ referenceNumber });
      if (existingPayment) {
        return res.status(400).json({ error: 'Reference number already exists. Please provide a unique payment reference.' });
      }

      // 2. Fetch latest loan details
      const loan = await Loan.findById(loanId);
      if (!loan) return res.status(404).json({ error: 'Loan record not found.' });

      // 3. Authorization check
      if (!isStaff && loan.memberId !== req.user.memberId) {
        return res.status(403).json({ error: 'Forbidden: You can only record payments for your own loans.' });
      }

      if (loan.status !== 'Disbursed' && loan.status !== 'Closed') {
         return res.status(400).json({ error: 'Payments can only be accepted for Disbursed or already Closed loans.' });
      }

      // 4. Verify against outstanding balance
      const outstandingBalance = loan.amortizationSchedule
        .filter(item => item.status === 'Unpaid')
        .reduce((sum, item) => sum + item.totalPayment, 0);

      if (amountPaid <= 0) {
        return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
      }

      // Precision helper
      const round = (num: number) => Math.round(num * 100) / 100;

      if (amountPaid > round(outstandingBalance) + 0.01) {
        return res.status(400).json({ 
          error: `Payment amount (₱${amountPaid.toLocaleString()}) exceeds total outstanding balance (₱${outstandingBalance.toLocaleString()}).` 
        });
      }

      const payment = new Payment({
        loanId,
        memberId: loan.memberId,
        amountPaid,
        referenceNumber,
        method,
        verified: false 
      });
      await payment.save();

      loan.history.push({
        status: loan.status,
        updatedBy: req.user.name,
        comment: `Payment of ₱${amountPaid.toLocaleString()} recorded and awaiting verification (Ref: ${referenceNumber})`
      });

      await loan.save();
      res.status(201).json({ payment, loan });
    } catch (err: any) {
      handleMongoError(err, res);
    }
  });

  app.patch('/api/payments/:id/verify', authenticate, isStaff, checkDb, async (req: any, res: any) => {
    try {
      const { role } = req.user;
      if (role !== 'System Administrator' && role !== 'Disbursement') {
        return res.status(403).json({ error: 'Forbidden: Only System Administrators and Disbursement staff can verify payments.' });
      }

      const payment = await Payment.findById(req.params.id);
      if (!payment) return res.status(404).json({ error: 'Payment record not found.' });
      if (payment.verified) return res.status(400).json({ error: 'Payment is already verified.' });

      const loan = await Loan.findById(payment.loanId);
      if (!loan) return res.status(404).json({ error: 'Associated loan record not found.' });

      // Verification Logic (Moved from POST /api/payments)
      const amountPaid = payment.amountPaid;
      
      // Precision helper
      const round = (num: number) => Math.round(num * 100) / 100;

      // 5. Update Amortization Schedule
      let remainingPayment = amountPaid;
      for (let item of loan.amortizationSchedule) {
        if (item.status === 'Unpaid' && remainingPayment > 0) {
          if (remainingPayment >= item.totalPayment - 0.01) {
            item.status = 'Paid';
            remainingPayment -= item.totalPayment;
          } else {
            // Partial payments not allowed for verification step current logic, 
            // but we consume what we can. Usually we'd want to handle partials better.
            break;
          }
        }
      }

      // 6. Check if all installments are Paid
      const allPaid = loan.amortizationSchedule.every(item => item.status === 'Paid');
      if (allPaid && loan.status !== 'Closed') {
        loan.status = 'Closed';
        loan.history.push({ 
          status: 'Closed', 
          updatedBy: 'System', 
          comment: `Loan fully paid and verified via payment ref ${payment.referenceNumber}.` 
        });
      }

      loan.history.push({
        status: loan.status,
        updatedBy: req.user.name,
        comment: `Verification confirmed for payment ₱${amountPaid.toLocaleString()} (Ref: ${payment.referenceNumber})`
      });

      payment.verified = true;
      await payment.save();
      await loan.save();

      res.json({ payment, loan });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/payments', authenticate, async (req: any, res) => {
    try {
      const { loanId } = req.query;
      const staffRoles = ['System Administrator', 'Admin', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'];
      const isStaff = staffRoles.includes(req.user.role);

      let query: any = isStaff ? {} : { memberId: req.user.memberId };
      if (loanId) {
        query.loanId = loanId;
      }

      const payments = await Payment.find(query).sort({ datePaid: -1 });
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite / Static ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // API 404 handler for all methods
    app.all('/api/*', (req, res) => {
      res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
    });
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
