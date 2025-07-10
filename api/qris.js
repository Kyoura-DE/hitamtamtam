export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { token, merchant_id, username } = req.body;

  const url = "https://app.orderkuota.com/api/v2/get";
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "okhttp/4.12.0",
    "Accept-Encoding": "gzip"
  };

  const payload = new URLSearchParams({
    "app_reg_id": "",
    "phone_uuid": "",
    "requests[qris_history][jenis]": "kredit",
    "phone_model": "itel A666LN",
    "requests[qris_history][keterangan]": "",
    "requests[qris_history][jumlah]": "",
    "phone_android_version": "13",
    "app_version_code": "250327",
    "auth_username": username,
    "requests[qris_history][page]": "1",
    "auth_token": token,
    "app_version_name": "25.03.27",
    "ui_mode": "dark",
    "requests[qris_history][dari_tanggal]": "",
    "requests[0]": "account",
    "requests[qris_history][ke_tanggal]": ""
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: payload
    });

    const json = await response.json();
    console.log("Response from OrderKuota QRIS:", json);

    if (json.success && json.qris_history && json.qris_history.success) {
      const qris = json.qris_history.results;
      let output = `✅ Total Mutasi QRIS: ${qris.length} transaksi\n\n`;

      qris.forEach((trx, idx) => {
        const status = trx.status === "IN" ? "Success" : trx.status;
        output +=
`${idx + 1}. ID Mutasi: ${trx.id}
   Tanggal      : ${trx.tanggal}
   Kredit       : Rp ${trx.kredit}
   Debet        : Rp ${trx.debet}
   Saldo Akhir  : Rp ${trx.saldo_akhir}
   Keterangan   : ${trx.keterangan.trim()}
   Status       : ${status}
   Brand        : ${trx.brand.name}
--------------------------------------------------
`;
      });

      const acc = json.account.results;
      output += `
👤 Info Akun:
   Nama Akun    : ${acc.name}
   Username     : ${acc.username}
   Saldo Utama  : Rp ${acc.balance}
   Saldo QRIS   : Rp ${acc.qris_balance}
`;

      res.json({ success: true, mutasi: output });
    } else {
      res.json({ success: false, message: "Gagal mengambil mutasi QRIS atau tidak ada transaksi." });
    }
  } catch (e) {
    console.error("Error /api/qris:", e);
    res.status(500).json({ success: false, message: e.message });
  }
}
