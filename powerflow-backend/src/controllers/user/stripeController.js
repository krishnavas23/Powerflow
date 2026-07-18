const Stripe = require('stripe');
const { updateBalanceFromWebhook } = require('./walletController');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// create stripe checkout session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      // Include session id so frontend can show a detailed success page
      success_url: `${process.env.FRONTEND_URL}/wallet/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/wallet/cancel`,
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: { name: 'Wallet Recharge' },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      metadata: { userId: user._id.toString() },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ message: 'Stripe session creation failed', error: error.message });
  }
};

//stripe Webhook to confirm payment and credit wallet
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const amount = session.amount_total / 100;

    console.log(`✅ Stripe payment success for user ${userId}: ₹${amount}`);
    await updateBalanceFromWebhook(userId, amount, session.id);

    // Send confirmation email with receipt attachment
    try {
      const nodemailer = require('nodemailer');
      const PDFDocument = require('pdfkit');
      const User = require('../../models/User');
      const user = await User.findById(userId).lean();
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      // Build PDF in memory
      const chunks = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.on('data', (d) => chunks.push(d));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        await transporter.sendMail({
          from: `Powerflow Support <${process.env.EMAIL_USER}>`,
          to: user?.email || session.customer_email,
          subject: 'Payment Confirmation - Powerflow Wallet Recharge',
          html: `<p>Hi ${user?.name || ''},</p>
                 <p>Your payment of <b>₹${amount.toFixed(2)}</b> was successful.</p>
                 <p>Session: ${session.id}</p>
                 <p>Thank you for using Powerflow.</p>`,
          attachments: [{ filename: `powerflow-receipt-${session.id}.pdf`, content: pdfBuffer }],
        });
      });
      doc.fontSize(18).text('Powerflow Payment Receipt');
      doc.moveDown().fontSize(12).text(`Session: ${session.id}`);
      doc.text(`Amount: ₹${amount.toFixed(2)}`);
      doc.text(`Date: ${new Date().toLocaleString()}`);
      doc.end();
    } catch (e) {
      console.error('Email send failed:', e.message);
    }
  }

  res.json({ received: true });
};

// Idempotent reconciliation: ensure wallet is credited for a paid checkout session
exports.reconcileCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ success: false, message: 'Missing sessionId' });

    // Check if we already have a transaction recorded
    const existing = await Transaction.findOne({ externalRefId: sessionId }).lean();
    if (existing) {
      return res.json({ success: true, message: 'Already credited', already: true });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Session not paid yet' });
    }

    const userId = session.metadata?.userId;
    const amount = (session.amount_total || 0) / 100;
    if (!userId || !amount) {
      return res.status(400).json({ success: false, message: 'Invalid session metadata/amount' });
    }

    const result = await updateBalanceFromWebhook(userId, amount, session.id);
    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Credit failed', error: result.error });
    }

    return res.json({ success: true, message: 'Wallet credited', amount, newBalance: result.newBalance });
  } catch (e) {
    console.error('Reconcile error:', e.message);
    return res.status(500).json({ success: false, message: 'Reconcile failed' });
  }
};
