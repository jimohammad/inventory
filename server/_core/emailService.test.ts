import { describe, it, expect } from 'vitest';
import { sendEmail, sendDailySalesSummary } from './emailService';
import { ENV } from './env';

describe('Email Service', () => {
  it('should have email configuration set', () => {
    expect(ENV.ownerEmail).toBeTruthy();
    expect(ENV.smtpHost).toBeTruthy();
    expect(ENV.smtpPort).toBeGreaterThan(0);
    expect(ENV.smtpUser).toBeTruthy();
    expect(ENV.smtpPassword).toBeTruthy();
    expect(ENV.smtpFrom).toBeTruthy();
    
    console.log('[EmailTest] Email configuration verified:');
    console.log('  Owner Email:', ENV.ownerEmail);
    console.log('  SMTP Host:', ENV.smtpHost);
    console.log('  SMTP Port:', ENV.smtpPort);
    console.log('  SMTP User:', ENV.smtpUser);
    console.log('  SMTP From:', ENV.smtpFrom);
  });

  it('should send a test email successfully', async () => {
    const testEmailData = {
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Kuwait',
      }),
      totalItemsSold: 15,
      totalRevenue: 450.750,
      topSellingItems: [
        {
          name: 'Samsung Galaxy A17 5G',
          code: 'SAM-A17-256',
          quantitySold: 5,
          revenue: 150.250,
        },
        {
          name: 'Xiaomi Redmi Note 12',
          code: 'XIA-RN12-128',
          quantitySold: 3,
          revenue: 90.150,
        },
      ],
      lowStockItems: [
        {
          name: 'Honor X9C',
          code: 'HON-X9C-256',
          availableQty: 7,
        },
      ],
      noSalesItems: [
        {
          name: 'Realme C55',
          code: 'REA-C55-64',
        },
      ],
    };

    const success = await sendDailySalesSummary(testEmailData);
    
    expect(success).toBe(true);
    console.log('[EmailTest] Test email sent successfully to:', ENV.ownerEmail);
  }, 30000); // 30 second timeout for email sending
});
