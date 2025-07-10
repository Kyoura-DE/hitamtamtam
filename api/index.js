export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password, otp } = req.body;
  console.log("Received Request:", { username, password, otp }); // ✅ DEBUG

  const data = new URLSearchParams({
    password: otp && otp.trim() !== "" ? otp : password,
    app_reg_id: "",
    phone_android_version: "13",
    app_version_code: "250327",
    phone_uuid: "",
    app_version_name: "25.03.27",
    ui_mode: "dark",
    phone_model: "itel A666LN",
    username: username
  });

  try {
    const response = await fetch("https://app.orderkuota.com/api/v2/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "okhttp/4.12.0",
        "Accept-Encoding": "gzip"
      },
      body: data
    });

    const text = await response.text();
    console.log("Raw Response from OrderKuota:", text); // ✅ DEBUG

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error:", e); // ✅ DEBUG
      return res.status(500).json({ success: false, message: "Gagal parse JSON dari OrderKuota", raw: text });
    }

    if (json.success) {
      if (json.results.otp && !otp) {
        console.log("OTP needed, sending back to client."); // ✅ DEBUG
        res.json({
          need_otp: true,
          message: json.results.otp_value
        });
      } else {
        const token = json.results.token;
        const merchant_id = token.split(":")[0];
        console.log("Login success, sending token to client."); // ✅ DEBUG
        res.json({
          success: true,
          token,
          merchant_id,
          name: json.results.name,
          username: json.results.username,
          balance: json.results.balance
        });
      }
    } else {
      console.log("Login failed, sending fail message."); // ✅ DEBUG
      res.json({
        success: false,
        message: "Login gagal, periksa data."
      });
    }
  } catch (e) {
    console.error("Fetch Error:", e); // ✅ DEBUG
    res.status(500).json({ success: false, message: e.message });
  }
}
