const fetch = require('node-fetch');

// --- sendTelegramMessage ---
exports.sendTelegramMessage = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const { token, chat_id, text } = req.body;
  if (!token || !chat_id || !text) {
    return res.status(400).json({ error: 'token, chat_id и text обязательны' });
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const tgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text }),
    });
    const data = await tgRes.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка отправки сообщения', details: e.message });
  }
};

// --- notifyScheduler ---
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { google } = require('googleapis');
let adminInitialized = false;

exports.notifyScheduler = async (req, res) => {
  if (!adminInitialized) {
    initializeApp({ credential: applicationDefault() });
    adminInitialized = true;
  }
  const db = getFirestore();
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const SEND_TG_URL = 'https://us-central1-symmetric-flow-428315-r5.cloudfunctions.net/sendTelegramMessage';
  const now = Date.now();
  const snapshot = await db.collection('tg_notifications_settings').get();
  let sent = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (!data.userId || !data.sites || !data.metric || !data.period) continue;
    const last = data.lastNotifiedAt ? data.lastNotifiedAt.toMillis ? data.lastNotifiedAt.toMillis() : data.lastNotifiedAt : 0;
    const periodMs = data.period === 'hourly' ? 60*60*1000 : 24*60*60*1000;
    if (now - last < periodMs) continue;
    const tgSnap = await db.collection('telegram_settings').doc(data.userId).get();
    if (!tgSnap.exists) continue;
    const tg = tgSnap.data();
    if (!tg.token || !tg.chat_id) continue;
    const sites = Array.isArray(data.sites) ? data.sites : [];
    if (!sites.length) continue;
    // Получаем реальные метрики из коллекции website_metrics
    let metricsText = '';
    for (const siteUrl of sites) {
      const metricSnap = await db.collection('website_metrics').doc(siteUrl).get();
      if (!metricSnap.exists) {
        metricsText += `\n${siteUrl}: нет данных`;
        continue;
      }
      const m = metricSnap.data();
      let value = '';
      if (data.metric === 'clicks') value = `Клики: ${m.totalClicks ?? '-'}`;
      else if (data.metric === 'impressions') value = `Показы: ${m.totalImpressions ?? '-'}`;
      else if (data.metric === 'position') value = `Позиция: ${m.averagePosition ?? '-'}`;
      else value = '-';
      metricsText += `\n${siteUrl}: ${value}`;
    }
    const text = `Топ сайты (${data.metric}):${metricsText}`;
    await fetch(SEND_TG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tg.token, chat_id: tg.chat_id, text })
    });
    await db.collection('tg_notifications_settings').doc(data.userId).update({ lastNotifiedAt: new Date() });
    sent++;
  }
  res.status(200).json({ ok: true, sent });
};

exports.updateWebsiteMetrics = async (req, res) => {
  if (!adminInitialized) {
    initializeApp({ credential: applicationDefault() });
    adminInitialized = true;
  }
  const db = getFirestore();
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  // Получаем всех пользователей с tg_notifications_settings
  const notifySnap = await db.collection('tg_notifications_settings').get();
  let updated = 0;
  for (const docSnap of notifySnap.docs) {
    const data = docSnap.data();
    if (!data.userId || !data.sites) continue;
    // Получаем токен пользователя (Google API)
    const userSnap = await db.collection('users').doc(data.userId).get();
    if (!userSnap.exists) continue;
    const user = userSnap.data();
    if (!user.apiKey) continue;
    // Для каждого сайта собираем метрики
    for (const siteUrl of data.sites) {
      try {
        const metrics = await getSiteMetricsFromSearchConsole(siteUrl, user.apiKey);
        await db.collection('website_metrics').doc(siteUrl).set(metrics);
        updated++;
      } catch (e) {
        // Пропускаем ошибку по сайту
      }
    }
  }
  res.status(200).json({ ok: true, updated });
};

exports.oauthExchange = async (req, res) => {
  if (!adminInitialized) {
    initializeApp({ credential: applicationDefault() });
    adminInitialized = true;
  }
  const db = getFirestore();
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  try {
    const { code, userId } = req.body;
    if (!code || !userId) return res.status(400).json({ ok: false, error: 'code and userId required' });
    // Обмениваем code на токены
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', process.env.GOOGLE_CLIENT_ID);
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET);
    params.append('redirect_uri', 'postmessage');
    params.append('grant_type', 'authorization_code');
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) return res.status(400).json({ ok: false, error: 'No access_token' });
    // Получаем email пользователя
    const userInfoResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const userInfo = await userInfoResp.json();
    // Сохраняем токены и профиль в Firestore
    await db.collection('users').doc(userId).set({
      email: userInfo.email,
      displayName: userInfo.name,
      avatar: userInfo.picture,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      updatedAt: new Date()
    }, { merge: true });
    res.status(200).json({ ok: true, user: {
      email: userInfo.email,
      displayName: userInfo.name,
      avatar: userInfo.picture,
      access_token: tokenData.access_token
    }});
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

// Функция для обновления токенов
exports.refreshToken = async (req, res) => {
  if (!adminInitialized) {
    initializeApp({ credential: applicationDefault() });
    adminInitialized = true;
  }
  const db = getFirestore();
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ ok: false, error: 'userId required' });
    
    // Получаем данные пользователя из Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(400).json({ ok: false, error: 'User not found' });
    }
    
    const userData = userDoc.data();
    if (!userData.refresh_token) {
      return res.status(400).json({ ok: false, error: 'No refresh token found' });
    }
    
    // Обновляем токен
    const params = new URLSearchParams();
    params.append('refresh_token', userData.refresh_token);
    params.append('client_id', process.env.GOOGLE_CLIENT_ID);
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');
    
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    
    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ ok: false, error: 'Failed to refresh token' });
    }
    
    // Обновляем токен в Firestore
    await db.collection('users').doc(userId).update({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      updatedAt: new Date()
    });
    
    res.status(200).json({ 
      ok: true, 
      user: {
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        access_token: tokenData.access_token
      }
    });
    
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

// --- Google Indexing API Functions ---
exports.submitUrlForIndexing = async (req, res) => {
  if (!adminInitialized) {
    initializeApp({ credential: applicationDefault() });
    adminInitialized = true;
  }
  const db = getFirestore();
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const { url, userId } = req.body;
    if (!url || !userId) {
      return res.status(400).json({ ok: false, error: 'url and userId required' });
    }

    // Получаем access_token пользователя
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      return res.status(400).json({ ok: false, error: 'User not found' });
    }
    const user = userSnap.data();
    if (!user.access_token) {
      return res.status(400).json({ ok: false, error: 'No access token found' });
    }

    // Создаем OAuth2 клиент
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: user.access_token });

    // Отправляем URL для индексации
    const indexingApi = google.indexing('v3');
    const response = await indexingApi.urlNotifications.publish({
      auth,
      requestBody: {
        url: url,
        type: 'URL_UPDATED' // или 'URL_DELETED' для удаления
      }
    });

    // Сохраняем запрос в Firestore
    await db.collection('indexing_requests').add({
      userId,
      url,
      notificationMetadata: response.data.notificationMetadata,
      submittedAt: new Date(),
      status: 'submitted'
    });

    res.status(200).json({ 
      ok: true, 
      message: 'URL submitted for indexing',
      notificationMetadata: response.data.notificationMetadata
    });
  } catch (e) {
    console.error('Indexing API error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
};

exports.checkIndexingStatus = async (req, res) => {
  if (!adminInitialized) {
    initializeApp({ credential: applicationDefault() });
    adminInitialized = true;
  }
  const db = getFirestore();
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const { url, userId } = req.body;
    if (!url || !userId) {
      return res.status(400).json({ ok: false, error: 'url and userId required' });
    }

    // Получаем access_token пользователя
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      return res.status(400).json({ ok: false, error: 'User not found' });
    }
    const user = userSnap.data();
    if (!user.access_token) {
      return res.status(400).json({ ok: false, error: 'No access token found' });
    }

    // Создаем OAuth2 клиент
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: user.access_token });

    // Проверяем статус индексации через Search Console API
    const searchconsole = google.searchconsole('v1');
    const response = await searchconsole.urlInspection.index.inspect({
      auth,
      requestBody: {
        inspectionUrl: url,
        siteUrl: extractDomain(url)
      }
    });

    const inspectionResult = response.data.inspectionResult;
    
    // Сохраняем результат проверки
    await db.collection('indexing_checks').add({
      userId,
      url,
      inspectionResult,
      checkedAt: new Date()
    });

    res.status(200).json({ 
      ok: true, 
      result: inspectionResult
    });
  } catch (e) {
    console.error('Indexing status check error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
};

// Вспомогательная функция для извлечения домена
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch (e) {
    return url;
  }
}

// Вспомогательная функция для получения метрик сайта через Search Console API
async function getSiteMetricsFromSearchConsole(siteUrl, accessToken) {
  const searchconsole = google.searchconsole('v1');
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  const start = new Date(now.getTime() - 28*24*60*60*1000);
  const startDate = start.toISOString().split('T')[0];
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  // Получаем общие метрики
  const resp = await searchconsole.searchanalytics.query({
    siteUrl,
    auth,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 1000
    }
  });
  const rows = resp.data.rows || [];
  let totalClicks = 0, totalImpressions = 0, sumPosition = 0, count = 0;
  for (const row of rows) {
    totalClicks += row.clicks;
    totalImpressions += row.impressions;
    sumPosition += row.position;
    count++;
  }
  return {
    totalClicks,
    totalImpressions,
    averagePosition: count ? sumPosition / count : null,
    updatedAt: new Date()
  };
}
