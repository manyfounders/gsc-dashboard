const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

// URL вашей функции отправки сообщений
const SEND_TG_URL = 'https://us-central1-symmetric-flow-428315-r5.cloudfunctions.net/sendTelegramMessage';

exports.notifyScheduler = async (req, res) => {
  // CORS для ручного теста
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const now = Date.now();
  const snapshot = await db.collection('tg_notifications_settings').get();
  let sent = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (!data.userId || !data.sites || !data.metric || !data.period) continue;

    // Проверка времени
    const last = data.lastNotifiedAt ? data.lastNotifiedAt.toMillis ? data.lastNotifiedAt.toMillis() : data.lastNotifiedAt : 0;
    const periodMs = data.period === 'hourly' ? 60*60*1000 : 24*60*60*1000;
    if (now - last < periodMs) continue;

    // Получаем настройки Telegram
    const tgSnap = await db.collection('telegram_settings').doc(data.userId).get();
    if (!tgSnap.exists) continue;
    const tg = tgSnap.data();
    if (!tg.token || !tg.chat_id) continue;

    // Получаем сайты (названия)
    const sites = Array.isArray(data.sites) ? data.sites : [];
    if (!sites.length) continue;

    // TODO: Получить метрики по сайтам (здесь можно интегрировать с Search Console API)
    // Для примера просто отправим список сайтов и выбранную метрику
    const text = `Топ сайты (${data.metric}):\n` + sites.map((s, i) => `${i+1}. ${s}`).join('\n');

    // Отправляем уведомление
    await fetch(SEND_TG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tg.token, chat_id: tg.chat_id, text })
    });
    // Обновляем lastNotifiedAt
    await db.collection('tg_notifications_settings').doc(data.userId).update({ lastNotifiedAt: new Date() });
    sent++;
  }

  res.status(200).json({ ok: true, sent });
}; 