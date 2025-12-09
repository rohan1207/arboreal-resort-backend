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
      to: 'rohanambhore7@gmail.com',
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
    console.log('Inquiry email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending inquiry email:', error);
    throw error;
  }
};


