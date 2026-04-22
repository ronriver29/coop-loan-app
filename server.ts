import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { User, Loan, Payment, LoanType } from './models.ts';
import { sendWelcomeEmail, sendLoanStatusUpdate } from './src/services/emailService.ts';

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
      const { status, comment } = req.body;
      const loan: any = await Loan.findById(req.params.id);
      if (!loan) return res.status(404).json({ error: 'Loan not found' });

      // Workflow Validation
      const role = req.user.role;
      const workflow: Record<string, { role: string[], next: string[] }> = {
        'Pending': { 
          role: ['Evaluator', 'System Administrator'], 
          next: ['Under Evaluation', 'Rejected'] 
        },
        'Under Evaluation': { 
          role: ['Reviewer', 'System Administrator'], 
          next: ['Reviewed', 'Rejected'] 
        },
        'Reviewed': { 
          role: ['Approver', 'System Administrator'], 
          next: ['Approved', 'Rejected'] 
        },
        'Approved': { 
          role: ['Disbursement', 'System Administrator'], 
          next: ['Disbursed'] 
        }
      };

      const currentStep = workflow[loan.status];
      if (!currentStep) {
        return res.status(400).json({ error: `No transitions allowed from status: ${loan.status}` });
      }

      if (!currentStep.role.includes(role)) {
        return res.status(403).json({ error: `Role '${role}' is not authorized to transition from '${loan.status}'` });
      }

      if (!currentStep.next.includes(status)) {
        return res.status(400).json({ error: `Invalid transition to '${status}' from '${loan.status}'` });
      }

      loan.status = status;
      loan.history.push({ status, updatedBy: req.user.name, comment });

      if (status === 'Approved') {
        loan.approvedAt = new Date();
      } else if (status === 'Disbursed') {
        loan.disbursedAt = new Date();
        // Generate Amortization Table
        loan.amortizationSchedule = calculateAmortization(loan.principalAmount, loan.interestRate, loan.termMonths);
      }

      await loan.save();

      // Notify User
      const borrower = await User.findOne({ memberId: loan.memberId });
      if (borrower && borrower.email) {
        sendLoanStatusUpdate(borrower.email, borrower.name, loan._id.toString(), status, comment || '').catch(console.error);
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
  app.post('/api/payments', authenticate, async (req: any, res) => {
    try {
      const { loanId, amountPaid, referenceNumber, method } = req.body;
      const payment = new Payment({
        loanId,
        memberId: req.user.memberId,
        amountPaid,
        referenceNumber,
        method
      });
      await payment.save();
      res.status(201).json(payment);
    } catch (err: any) {
      handleMongoError(err, res);
    }
  });

  app.get('/api/payments', authenticate, async (req: any, res) => {
    try {
      const query = req.user.role === 'Admin' ? {} : { memberId: req.user.memberId };
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
