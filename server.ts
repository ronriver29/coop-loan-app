import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { User, Loan, Payment } from './models.ts';
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
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
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

  app.get('/api/users', authenticate, isAdmin, checkDb, async (req, res) => {
    try {
      const users = await User.find({}, '-password').sort({ createdAt: -1 });
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      const { loanType, principalAmount, termMonths } = req.body;
      
      const r = 0.12 / 12; // Monthly rate
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
        loanType,
        principalAmount,
        interestRate: 0.12,
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

  app.get('/api/loans', authenticate, checkDb, async (req: any, res) => {
    try {
      const query = req.user.role === 'Admin' ? {} : { memberId: req.user.memberId };
      const loans = await Loan.find(query).sort({ createdAt: -1 });
      res.json(loans);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/loans/:id', authenticate, checkDb, async (req: any, res) => {
    try {
      const loan = await Loan.findById(req.params.id);
      if (!loan) return res.status(404).json({ error: 'Loan not found' });
      
      if (req.user.role !== 'Admin' && loan.memberId !== req.user.memberId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this loan' });
      }
      
      res.json(loan);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/loans/:id/status', authenticate, isAdmin, async (req: any, res) => {
    try {
      const { status, comment } = req.body;
      const loan: any = await Loan.findById(req.params.id);
      if (!loan) return res.status(404).json({ error: 'Loan not found' });

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
