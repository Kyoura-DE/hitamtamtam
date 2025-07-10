export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password, otp } = req.body;

  const url = "https://app.orderkuota.com/api/v2/login";
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "okhttp/4.12.0",
    "Accept-Encoding": "gzip"
  };

  const payload = new URLSearchParams({
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
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: payload
    });

    const json = await response.json();
    console.log("Response from OrderKuota Login:", json);

    if (json.success) {
      if (json.results.otp && !otp) {
        return res.json({
          need_otp: true,
          message: json.results.otp_value
        });
      } else {
        const token = json.results.token;
        const merchant_id = token.split(":")[0];
        return res.json({
          success: true,
          token,
          merchant_id,
          name: json.results.name,
          username: json.results.username,
          balance: json.results.balance
        });
      }
    } else {
      return res.json({
        success: false,
        message: "Login gagal, periksa data."
      });
    }
  } catch (e) {
    console.error("Error /api:", e);
    res.status(500).json({ success: false, message: e.message });
  }
}
