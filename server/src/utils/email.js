const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a QR code pass email to a student
 * @param {string} to - recipient email
 * @param {string} studentName
 * @param {string} mealLabel - e.g. "Breakfast - 2024-06-15"
 * @param {string} qrBase64 - base64 PNG of QR code
 */
const sendQRPassEmail = async (to, studentName, mealLabel, qrBase64) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `🍽️ Your MessMate Pass — ${mealLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#16a34a;">MessMate</h2>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>Your meal pass for <strong>${mealLabel}</strong> is ready. Show this QR code at the mess counter:</p>
        <div style="text-align:center;margin:24px 0;">
          <img src="cid:qrcode" alt="QR Pass" style="width:220px;height:220px;" />
        </div>
        <p style="color:#57606a;font-size:13px;">This is a single-use token. It will be invalidated once scanned.</p>
        <p>Bon appétit! 🌿</p>
      </div>
    `,
    attachments: [
      {
        filename: 'qr-pass.png',
        content: qrBase64.replace(/^data:image\/png;base64,/, ''),
        encoding: 'base64',
        cid: 'qrcode',
      },
    ],
  });
};

/**
 * Send low-stock alert to admin
 */
const sendLowStockAlert = async (to, items) => {
  const rows = items.map((i) => `<tr><td>${i.itemName}</td><td>${i.quantityInStock} ${i.unit}</td><td>${i.reorderThreshold} ${i.unit}</td></tr>`).join('');
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: '⚠️ MessMate — Low Stock Alert',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;">
        <h2 style="color:#d97706;">⚠️ Low Stock Alert</h2>
        <p>The following items are below reorder threshold:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Item</th><th>In Stock</th><th>Threshold</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;color:#57606a;">Please restock soon to avoid meal disruption.</p>
      </div>
    `,
  });
};

/**
 * Send monthly bill to student
 */
const sendBillEmail = async (to, studentName, month, year, amount) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `📄 MessMate Bill — ${month}/${year}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#16a34a;">MessMate Monthly Bill</h2>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>Your mess bill for <strong>${month}/${year}</strong> has been generated.</p>
        <p style="font-size:24px;font-weight:bold;color:#1f2328;">₹${amount.toFixed(2)}</p>
        <p>Please log in to view your detailed statement and download the PDF.</p>
        <a href="${process.env.CLIENT_URL}/student/billing" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;">View Bill</a>
      </div>
    `,
  });
};

module.exports = { sendQRPassEmail, sendLowStockAlert, sendBillEmail };
