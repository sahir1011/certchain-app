const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendCertificateEmail = async (email, studentName, courseName, certificateUrl, attachmentBuffer) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Certificate Issued: ${courseName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Congratulations, ${studentName}!</h2>
                    <p>We are pleased to inform you that your certificate for <strong>${courseName}</strong> has been issued.</p>
                    <p>You can view and verify your certificate using the link below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${certificateUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Certificate</a>
                    </div>
                    <p>Your certificate is attached to this email.</p>
                    <p>If you have any questions, please contact the administration.</p>
                    <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                        <p>This is an automated email. Please do not reply directly to this message.</p>
                    </div>
                </div>
            `,
            attachments: attachmentBuffer ? [
                {
                    filename: 'certificate.png',
                    content: attachmentBuffer
                }
            ] : []
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendCertificateEmail };
