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
    if (!isValidUri) {
      console.error('The provided MONGODB_URI does not start with "mongodb://" or "mongodb+srv://".');
    }
  }

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { memberId, name, email, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ memberId, name, email, password: hashedPassword, role });
      await user.save();
      res.status(201).json({ message: 'User registered' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user._id, role: user.role, memberId: user.memberId, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.json({ id: user._id, role: user.role, memberId: user.memberId, name: user.name });
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

  // Loans
  app.post('/api/loans', authenticate, async (req: any, res) => {
    try {
      const { loanType, principalAmount, termMonths } = req.body;
      const loan = new Loan({
        memberId: req.user.memberId,
        name: req.user.name,
        loanType,
        principalAmount,
        interestRate: 0.12, // Default 12%
        termMonths,
        history: [{ status: 'Pending', updatedBy: req.user.name, comment: 'Application submitted' }]
      });
      await loan.save();
      res.status(201).json(loan);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/loans', authenticate, async (req: any, res) => {
    try {
      const query = req.user.role === 'Admin' ? {} : { memberId: req.user.memberId };
      const loans = await Loan.find(query).sort({ createdAt: -1 });
      res.json(loans);
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
      res.status(400).json({ error: err.message });
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
