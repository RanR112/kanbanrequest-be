const nodemailer = require("nodemailer");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

exports.sendNotification = async (user, request, message) => {
    console.log(`Notify ${user.name} (${user.email}, ${user.no_hp}): ${message}`);

    // === Email ===
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: "PC Department <pcdept@gmail.com>",
        to: user.email,
        subject: "Ada Request Kanban",
        html: `<p>Hai ${user.name},</p><p>${message}</p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("✅ Email berhasil dikirim ke", user.email);
    } catch (err) {
        console.error("❌ Gagal mengirim email:", err.message);
    }

    // === WhatsApp via Fonnte ===
    const waMessage = `Halo ${user.name},\n\n${message}`;

    if (!user.no_hp || !waMessage.trim()) {
        console.error("❌ Nomor HP atau pesan kosong!");
        return;
    }

    try {
            const form = new FormData();
            form.append("target", user.no_hp);
            form.append("message", waMessage);
            form.append("delay", "1");
            form.append("countryCode", "62");
    
            const response = await axios.post("https://api.fonnte.com/send", form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: process.env.FONNTE_API_KEY,
                },
            });
    
            console.log("Response:", response.data);
        } catch (err) {
            console.error("Error:", err.response?.data || err.message);
        }
};
