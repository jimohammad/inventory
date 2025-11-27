import nodemailer from 'nodemailer';
import { ENV } from './env';

/**
 * Email service for sending automated emails
 * Uses SMTP configuration from environment variables
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create email transporter with SMTP configuration
 */
function createTransporter() {
  // For development/testing, use ethereal email (fake SMTP)
  // For production, use real SMTP credentials from environment variables
  
  if (ENV.smtpHost && ENV.smtpPort && ENV.smtpUser && ENV.smtpPassword) {
    return nodemailer.createTransport({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: ENV.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPassword,
      },
    });
  }
  
  // Fallback: log email to console if no SMTP configured
  console.warn('[EmailService] No SMTP configuration found. Emails will be logged to console only.');
  return null;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('[EmailService] Email would be sent:');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('HTML:', options.html.substring(0, 200) + '...');
      return true; // Return true for development
    }
    
    const info = await transporter.sendMail({
      from: ENV.smtpFrom || ENV.smtpUser,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    
    console.log('[EmailService] Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error);
    return false;
  }
}

/**
 * Send daily sales summary email to owner
 */
export async function sendDailySalesSummary(summaryData: {
  date: string;
  totalItemsSold: number;
  totalRevenue: number;
  topSellingItems: Array<{
    name: string;
    code: string;
    quantitySold: number;
    revenue: number;
  }>;
  lowStockItems: Array<{
    name: string;
    code: string;
    availableQty: number;
  }>;
  noSalesItems: Array<{
    name: string;
    code: string;
  }>;
}): Promise<boolean> {
  const ownerEmail = ENV.ownerEmail;
  
  if (!ownerEmail) {
    console.warn('[EmailService] Owner email not configured. Cannot send daily sales summary.');
    return false;
  }
  
  const html = generateSalesSummaryHTML(summaryData);
  
  return sendEmail({
    to: ownerEmail,
    subject: `Daily Sales Summary - ${summaryData.date}`,
    html,
    text: `Daily Sales Summary for ${summaryData.date}\n\nTotal Items Sold: ${summaryData.totalItemsSold}\nTotal Revenue: KWD ${summaryData.totalRevenue.toFixed(3)}`,
  });
}

/**
 * Generate HTML email template for sales summary
 */
function generateSalesSummaryHTML(data: {
  date: string;
  totalItemsSold: number;
  totalRevenue: number;
  topSellingItems: Array<{
    name: string;
    code: string;
    quantitySold: number;
    revenue: number;
  }>;
  lowStockItems: Array<{
    name: string;
    code: string;
    availableQty: number;
  }>;
  noSalesItems: Array<{
    name: string;
    code: string;
  }>;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Sales Summary</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #10b981;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 10px 0 0 0;
      font-size: 16px;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-card.revenue {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    .stat-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .stat-card p {
      margin: 0;
      font-size: 32px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #333;
      font-size: 20px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .item-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .item-list li {
      padding: 12px;
      margin-bottom: 8px;
      background-color: #f9fafb;
      border-radius: 6px;
      border-left: 4px solid #10b981;
    }
    .item-list li.warning {
      border-left-color: #f59e0b;
      background-color: #fffbeb;
    }
    .item-list li.danger {
      border-left-color: #ef4444;
      background-color: #fef2f2;
    }
    .item-name {
      font-weight: 600;
      color: #111827;
    }
    .item-code {
      color: #6b7280;
      font-size: 14px;
    }
    .item-stats {
      float: right;
      font-weight: 600;
      color: #10b981;
    }
    .item-stats.warning {
      color: #f59e0b;
    }
    .item-stats.danger {
      color: #ef4444;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .empty-state {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Sales Summary</h1>
      <p>${data.date}</p>
    </div>
    
    <div class="summary-stats">
      <div class="stat-card">
        <h3>Total Items Sold</h3>
        <p>${data.totalItemsSold}</p>
      </div>
      <div class="stat-card revenue">
        <h3>Total Revenue</h3>
        <p>KWD ${data.totalRevenue.toFixed(3)}</p>
      </div>
    </div>
    
    ${data.topSellingItems.length > 0 ? `
    <div class="section">
      <h2>🏆 Top Selling Items</h2>
      <ul class="item-list">
        ${data.topSellingItems.map(item => `
          <li>
            <span class="item-stats">${item.quantitySold} sold • KWD ${item.revenue.toFixed(3)}</span>
            <div class="item-name">${item.name}</div>
            <div class="item-code">${item.code}</div>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : `
    <div class="section">
      <h2>🏆 Top Selling Items</h2>
      <div class="empty-state">No sales recorded today</div>
    </div>
    `}
    
    ${data.lowStockItems.length > 0 ? `
    <div class="section">
      <h2>⚠️ Low Stock Alerts</h2>
      <ul class="item-list">
        ${data.lowStockItems.map(item => `
          <li class="${item.availableQty < 10 ? 'danger' : 'warning'}">
            <span class="item-stats ${item.availableQty < 10 ? 'danger' : 'warning'}">${item.availableQty} left</span>
            <div class="item-name">${item.name}</div>
            <div class="item-code">${item.code}</div>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${data.noSalesItems.length > 0 && data.noSalesItems.length <= 10 ? `
    <div class="section">
      <h2>📉 No Sales Today</h2>
      <ul class="item-list">
        ${data.noSalesItems.slice(0, 10).map(item => `
          <li class="warning">
            <div class="item-name">${item.name}</div>
            <div class="item-code">${item.code}</div>
          </li>
        `).join('')}
      </ul>
      ${data.noSalesItems.length > 10 ? `<p style="text-align: center; color: #6b7280;">...and ${data.noSalesItems.length - 10} more items</p>` : ''}
    </div>
    ` : ''}
    
    <div class="footer">
      <p>This is an automated daily sales summary from your Purchase Order Manager.</p>
      <p>Generated at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuwait' })} Kuwait Time</p>
    </div>
  </div>
</body>
</html>
  `;
}
