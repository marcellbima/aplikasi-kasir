// src/utils/invoice.utils.js
const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = now.getTime().toString().slice(-6);
  return `EK-${year}${month}${day}-${time}`;
};

module.exports = { generateInvoiceNumber };
