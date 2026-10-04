const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate a cryptographically random single-use token
 */
const generateToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Generate a QR code PNG as base64 data URL from a token
 * @param {string} token
 * @returns {Promise<string>} base64 data URL
 */
const generateQRCode = async (token) => {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: { dark: '#1f2328', light: '#ffffff' },
  });
};

module.exports = { generateToken, generateQRCode };
