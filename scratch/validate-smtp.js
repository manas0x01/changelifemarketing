const nodemailer = require("nodemailer");

async function testSMTP() {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true, 
      auth: {
        user: "admin@changelifemarketing.com",
        pass: "ps7d-tlim-7bsa-7f4q",
      },
    });

    console.log("Verifying connection settings...");
    await transporter.verify();
    console.log("✅ SMTP Verification successful!");
    
    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: `"Change Life Marketing Test" <admin@changelifemarketing.com>`,
      to: "ajaykumaraj2476@gmail.com", 
      subject: "Hostinger App Password Test",
      text: "Testing Hostinger App Password delivery to Gmail",
    });

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    
  } catch (error) {
    console.error("❌ SMTP Validation failed:");
    console.error(error);
  }
}

testSMTP();
