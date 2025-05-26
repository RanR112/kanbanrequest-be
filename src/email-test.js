const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

(async () => {
    try {
        const form = new FormData();
        form.append("target", "81255802706"); // ganti nomor tujuan (angka saja)
        form.append("message", "Tes pesan dari Fonnte API");
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
})();
