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
      const mutasi = json.qris_history.results.map((trx, idx) => {
        return `${idx + 1}. ID: ${trx.id}, Tgl: ${trx.tanggal}, Kredit: Rp${trx.kredit}, Debet: Rp${trx.debet}, Saldo: Rp${trx.saldo_akhir}, Ket: ${trx.keterangan.trim()}, Brand: ${trx.brand.name}`;
      });

      const saldo_utama = `Rp ${json.account.results.balance}`;
      const saldo_qris = `Rp ${json.account.results.qris_balance}`;

      res.json({ success: true, mutasi, saldo_utama, saldo_qris });
    } else {
      res.json({ success: false, message: "Gagal mengambil mutasi QRIS atau tidak ada transaksi." });
    }
  } catch (e) {
    console.error("Error /api/qris:", e);
    res.status(500).json({ success: false, message: e.message });
  }
}
