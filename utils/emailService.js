import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Your email
    pass: process.env.SMTP_PASS, // Your app password
  },
});

/**
 * Send inquiry notification email
 */
export const sendInquiryEmail = async (inquiryData) => {
  try {
    const { name, phone, email, checkIn, checkOut, rooms, adults, children } = inquiryData;
    
    // Format dates
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Calculate nights
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));

    const mailOptions = {
      from: `"The Arboreal Resort" <${process.env.SMTP_USER}>`,
      to: 'reservations@thearborealresort.com',
      // to: 'rohanambhore721@gmail.com',
      subject: `New Inquiry from ${name} - ${formatDate(checkIn)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2a2a2a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
            .info-row { margin: 15px 0; padding: 10px; background-color: white; border-left: 4px solid #2a2a2a; }
            .label { font-weight: bold; color: #2a2a2a; }
            .footer { margin-top: 20px; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Website Inquiry</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>A new inquiry has been received from your website. Please find the details below:</p>
              
              <div class="info-row">
                <span class="label">Guest Name:</span> ${name}
              </div>
              
              <div class="info-row">
                <span class="label">Contact Number:</span> ${phone}
              </div>
              
              ${email ? `
              <div class="info-row">
                <span class="label">Email:</span> ${email}
              </div>
              ` : ''}
              
              <div class="info-row">
                <span class="label">Check-in Date:</span> ${formatDate(checkIn)}
              </div>
              
              <div class="info-row">
                <span class="label">Check-out Date:</span> ${formatDate(checkOut)}
              </div>
              
              <div class="info-row">
                <span class="label">Number of Nights:</span> ${nights}
              </div>
              
              <div class="info-row">
                <span class="label">Rooms:</span> ${rooms}
              </div>
              
              <div class="info-row">
                <span class="label">Adults:</span> ${adults}
              </div>
              
              <div class="info-row">
                <span class="label">Children:</span> ${children || 0}
              </div>
              
              <p style="margin-top: 30px;">
                <strong>Action Required:</strong> Please contact the guest at your earliest convenience to assist with their booking.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email from The Arboreal Resort booking system.</p>
              <p>Generated on: ${new Date().toLocaleString('en-US')}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        New Website Inquiry
        
        Guest Name: ${name}
        Contact Number: ${phone}
        ${email ? `Email: ${email}` : ''}
        Check-in Date: ${formatDate(checkIn)}
        Check-out Date: ${formatDate(checkOut)}
        Number of Nights: ${nights}
        Rooms: ${rooms}
        Adults: ${adults}
        Children: ${children || 0}
        
        Please contact the guest at your earliest convenience.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending inquiry email:', error);
    throw error;
  }
};

/**
 * Send refund notification email to reservation team (Compact & Nice Design)
 */
export const sendRefundNotificationEmail = async (refundData) => {
  try {
    const { 
      paymentId, 
      refundId, 
      amount, 
      reason, 
      guestName, 
      guestEmail, 
      guestPhone,
      bookingDetails 
    } = refundData;
    
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const refundAmount = amount ? (amount / 100).toFixed(2) : '0.00';
    const isManualRefund = !refundId;

    const mailOptions = {
      from: `"The Arboreal Resort" <${process.env.SMTP_USER}>`,
      to: 'reservations@thearborealresort.com',
      subject: `⚠️ ${isManualRefund ? 'REFUND REQUIRED' : 'REFUND INITIATED'} - Payment ID: ${paymentId?.substring(0, 12)}...`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 24px 20px; text-align: center; }
            .header h2 { margin: 0; font-size: 20px; font-weight: 600; }
            .content { padding: 24px 20px; }
            .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px; }
            .alert-box strong { color: #92400e; font-size: 14px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
            .info-item { background-color: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
            .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
            .info-value { font-size: 14px; color: #111827; font-weight: 500; word-break: break-word; }
            .section-title { font-size: 14px; font-weight: 600; color: #111827; margin: 20px 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
            .action-box { background-color: #eff6ff; border: 1px solid #3b82f6; padding: 16px; border-radius: 6px; margin-top: 20px; }
            .action-box strong { color: #1e40af; font-size: 13px; }
            .footer { background-color: #f9fafb; padding: 16px 20px; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; }
            @media only screen and (max-width: 600px) {
              .info-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⚠️ ${isManualRefund ? 'REFUND REQUIRED' : 'REFUND INITIATED'}</h2>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>⚠️ ${isManualRefund ? 'ACTION REQUIRED:' : 'IMPORTANT:'}</strong> ${isManualRefund ? 'A refund needs to be processed manually. Please initiate the refund via Razorpay dashboard.' : 'A refund has been automatically initiated due to booking failure.'}
              </div>
              
              <div class="section-title">Payment & Refund Details</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Payment ID</div>
                  <div class="info-value">${paymentId || 'N/A'}</div>
                </div>
                ${refundId ? `
                <div class="info-item">
                  <div class="info-label">Refund ID</div>
                  <div class="info-value">${refundId}</div>
                </div>
                ` : ''}
                <div class="info-item">
                  <div class="info-label">Amount</div>
                  <div class="info-value">₹${refundAmount}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Status</div>
                  <div class="info-value">${isManualRefund ? 'Pending Manual Refund' : 'Refund Initiated'}</div>
                </div>
              </div>

              <div class="section-title">Reason</div>
              <div class="info-item" style="grid-column: 1 / -1;">
                <div class="info-value">${reason || 'Not specified'}</div>
              </div>
              
              <div class="section-title">Guest Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Name</div>
                  <div class="info-value">${guestName || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${guestEmail || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone</div>
                  <div class="info-value">${guestPhone || 'N/A'}</div>
                </div>
              </div>
              
              ${bookingDetails ? `
              <div class="section-title">Booking Details</div>
              <div class="info-grid">
                ${bookingDetails.reservationNo ? `
                <div class="info-item">
                  <div class="info-label">Reservation No</div>
                  <div class="info-value">${bookingDetails.reservationNo}</div>
                </div>
                ` : ''}
                <div class="info-item">
                  <div class="info-label">Check-in</div>
                  <div class="info-value">${formatDate(bookingDetails.checkIn)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Check-out</div>
                  <div class="info-value">${formatDate(bookingDetails.checkOut)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Rooms</div>
                  <div class="info-value">${bookingDetails.rooms || 'N/A'}</div>
                </div>
              </div>
              ` : ''}
              
              <div class="action-box">
                <strong>Action Required:</strong> ${isManualRefund ? 'Please initiate the refund via Razorpay dashboard using Payment ID above. Contact the guest after processing the refund.' : 'Please verify the refund status in Razorpay dashboard and contact the guest if needed.'}
              </div>
            </div>
            <div class="footer">
              <p>This is an automated email from The Arboreal Resort booking system.</p>
              <p>Generated on: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ${isManualRefund ? 'REFUND REQUIRED' : 'REFUND INITIATED'}
        
        Payment ID: ${paymentId}
        ${refundId ? `Refund ID: ${refundId}` : 'Status: Pending Manual Refund'}
        Amount: ₹${refundAmount}
        Reason: ${reason || 'Not specified'}
        
        Guest: ${guestName || 'N/A'} | ${guestEmail || 'N/A'} | ${guestPhone || 'N/A'}
        ${bookingDetails ? `Booking: ${formatDate(bookingDetails.checkIn)} to ${formatDate(bookingDetails.checkOut)} | ${bookingDetails.rooms || 'N/A'} Rooms` : ''}
        
        ${isManualRefund ? 'ACTION REQUIRED: Please initiate refund via Razorpay dashboard.' : 'Please verify refund status in Razorpay dashboard.'}
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending refund notification email:', error);
    throw error;
  }
};





