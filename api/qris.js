export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { token, merchant_id, username } = req.body;

  const url = "https://app.orderkuota.com/api/v2/get";
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept-Encoding": "gzip",
    "User-Agent": "okhttp/4.12.0"
  };

  try {
    // === 1️⃣ STEP 1: Kirim request qris_menu + account dulu ===
    const payload_step1 = new URLSearchParams({
      "app_reg_id": "",
      "phone_android_version": "13",
      "app_version_code": "250327",
      "phone_uuid": "",
      "auth_username": username,
      "requests[0]": "account",
      "requests[1]": "qris_menu",
      "auth_token": token,
      "app_version_name": "25.03.27",
      "ui_mode": "dark",
      "phone_model": "itel A666LN"
    });

    const response_step1 = await fetch(url, {
      method: "POST",
      headers,
      body: payload_step1
    });

    const result_step1 = await response_step1.json();
    console.log("STEP 1 (qris_menu) completed.");

    // === 2️⃣ STEP 2: Kirim request cek mutasi qris_history ===
    const payload_step2 = new URLSearchParams({
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

    const response_step2 = await fetch(url, {
      method: "POST",
      headers,
      body: payload_step2
    });

    const data = await response_step2.json();
    console.log("STEP 2 (qris_history) completed.");

    if (data.success && data.qris_history && data.qris_history.success) {
      const results = data.qris_history.results;
      const total_mutasi = results.length;

      const account = data.account.results;
      const nama_akun = account.name || "-";
      const username_res = account.username || "-";
      const saldo_utama = account.balance_str || "-";
      const saldo_qris = account.qris_balance_str || "-";

      let output = `✅ Total Mutasi QRIS: ${total_mutasi} transaksi\n\n`;
      output += `👤 Info Akun:\n`;
      output += `   Nama Akun    : ${nama_akun}\n`;
      output += `   Username     : ${username_res}\n`;
      output += `   Saldo Utama  : ${saldo_utama}\n`;
      output += `   Saldo QRIS   : ${saldo_qris}\n`;

      if (total_mutasi > 0) {
        output += `\n📄 Daftar Mutasi QRIS:\n`;
        results.forEach((item, idx) => {
          const id_transaksi = item.id || "-";
          const tanggal = item.tanggal || "-";
          const jumlah = item.kredit || "0";
          const bank = item.brand?.name || "-";
          output += `   ${idx + 1}. ID: ${id_transaksi} | Tanggal: ${tanggal} | Jumlah: Rp ${jumlah} | Bank: ${bank}\n`;
        });
      }

      return res.status(200).json({ success: true, mutasi: output });
    } else {
      return res.status(200).json({ success: false, message: "Gagal mengambil mutasi QRIS atau tidak ada transaksi." });
    }
  } catch (e) {
    console.error("Error /api/qris:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}
