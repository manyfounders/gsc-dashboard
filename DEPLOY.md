# 🚀 Развертывание Search Console CRM на Netlify

## 📋 Быстрый старт

### 1. Подготовка проекта
```bash
# Сборка проекта
npm install
npm run build

# Проверка что сборка прошла успешно
ls -la dist/
```

### 2. Деплой через Netlify UI

#### Метод A: Drag & Drop
1. Откройте [Netlify](https://app.netlify.com/)
2. Перетащите папку `dist/` в область "Deploy your site"
3. Ваш сайт будет развернут через 30-60 секунд

#### Метод B: GitHub Integration
1. Загрузите код в GitHub репозиторий
2. Подключите репозиторий в Netlify
3. Настройки будут подхвачены автоматически из `netlify.toml`

### 3. Деплой через Netlify CLI

```bash
# Установите Netlify CLI
npm install -g netlify-cli

# Авторизуйтесь
netlify login

# Разверните проект
netlify deploy --prod --dir=dist
```

## ⚙️ Конфигурация

### Файлы конфигурации
- `netlify.toml` - основная конфигурация Netlify
- `public/_redirects` - правила переадресации для SPA
- `dist/` - папка со скомпилированными файлами

### Переменные окружения
Если нужны переменные окружения:
1. В Netlify панели: Site settings → Environment variables
2. Добавьте нужные переменные
3. Пересоберите сайт

## 🔧 Особенности конфигурации

### SPA Routing
Настроена переадресация всех запросов на `index.html` для корректной работы React Router.

### Performance
- Включена минификация CSS/JS
- Настроено кэширование статических ресурсов
- Оптимизированы заголовки безопасности

### Google Search Console API
Убедитесь что в Google Cloud Console:
1. Добавлен домен Netlify в "Authorized JavaScript origins"
2. Добавлен домен в "Authorized redirect URIs"

## 🛠️ Команды для деплоя

```bash
# Полная пересборка и деплой
npm run build && netlify deploy --prod --dir=dist

# Только деплой (если уже собрано)
netlify deploy --prod --dir=dist

# Предварительный деплой для тестирования
netlify deploy --dir=dist
```

## 🚨 Возможные проблемы

### 1. 404 ошибки при переходах
**Решение:** Проверьте что файл `public/_redirects` корректный

### 2. Google API не работает
**Решение:** 
- Проверьте настройки OAuth в Google Cloud Console
- Убедитесь что домен добавлен в разрешенные

### 3. Сборка падает
**Решение:**
```bash
# Очистите кэш и пересоберите
rm -rf node_modules dist
npm install
npm run build
```

## 📊 Мониторинг

После деплоя доступно:
- **Analytics** - статистика посещений
- **Functions** - если используете serverless функции  
- **Forms** - если есть формы на сайте
- **Identity** - если нужна авторизация пользователей

## 🔄 Автоматический деплой

### Через Git Integration
1. Подключите GitHub/GitLab репозиторий
2. Каждый push в main ветку = автоматический деплой
3. Pull requests = preview deployments

### Webhook деплой
```bash
# Получите webhook URL в Netlify
curl -X POST https://api.netlify.com/build_hooks/YOUR_HOOK_ID
```

## 💡 Полезные команды

```bash
# Просмотр логов последнего деплоя
netlify logs

# Открыть сайт в браузере
netlify open:site

# Открыть админку
netlify open:admin

# Статус сайта
netlify status
```

## 🌐 Custom Domain

### Добавление своего домена
1. Site settings → Domain management
2. Add custom domain
3. Настройте DNS записи:
   ```
   A record: 75.2.60.5
   CNAME: your-site.netlify.app
   ```

### SSL сертификат
Автоматически выдается Let's Encrypt сертификат.

---

## ✅ Checklist перед деплоем

- [ ] `npm run build` выполняется без ошибок
- [ ] Папка `dist/` содержит все файлы
- [ ] `netlify.toml` настроен
- [ ] `public/_redirects` создан
- [ ] Google API настроен для нового домена
- [ ] Переменные окружения добавлены (если нужны)

🎉 **Готово!** Ваш Search Console CRM готов к использованию! 