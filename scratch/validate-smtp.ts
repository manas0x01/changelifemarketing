import nodemailer from "nodemailer";

const smtpHost = "smtp.hostinger.com";
const smtpPort = 465;
const smtpUser = "admin@changelifemarketing.com";
const smtpPass = "Ajay@25763577";
const smtpFrom = "admin@changelifemarketing.com";

async function testSMTP() {
  console.log("Starting SMTP connection test...");
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Timeout settings to fail fast if blocked or wrong host
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    console.log("Verifying connection settings...");
    await transporter.verify();
    console.log("✅ SMTP Verification successful!");

    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: `"Change Life Marketing Test" <${smtpFrom}>`,
      to: smtpUser, // Send to self
      subject: "SMTP configuration validation test",
      text: "Hello! This is a test email validating your Hostinger SMTP configuration settings.",
      html: "<p>Hello! This is a test email validating your Hostinger SMTP configuration settings.</p>",
    });

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ SMTP Validation failed:");
    console.error(error);
  }
}

testSMTP();
