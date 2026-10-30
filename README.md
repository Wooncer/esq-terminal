# ESQ Terminal — Gemini

Минималистичный чат с инструментами вашего плагина подбора ESQ, анализом PDF и фотографий. Без витрины оборудования и списка каталогов на главном экране. Чаты и вложения хранятся в IndexedDB браузера; есть профили, экспорт и импорт. При отправке содержание запроса и вложений передаётся Google Gemini.

## Подключённая версия

Сайт: https://esq-terminal.katerisha.chatgpt.site . При ESQ_ALLOW_GUEST=true и публичной политике доступа сайт поддерживает гостевой режим без аккаунта. Вход через ChatGPT остаётся дополнительным; ответы генерирует Google Gemini. На сервере настроен отдельный секрет GEMINI_API_KEY. Ключ не входит в этот архив и не должен попадать в GitHub.

28 октября 2026 в аккаунте проверен Free tier без подключения оплаты. Основная модель Gemini 3.5 Flash-Lite: 15 API-запросов в минуту, 250 000 входных токенов в минуту, 500 API-запросов в сутки. Для более сложных запросов доступна Gemini 3.8 Flash: 5 запросов в минуту, 20 в сутки. Один подбор может требовать нескольких обращений к модели. Лимиты устанавливает Google и может менять. Интерфейс показывает проверенную квоту, а не выдуманный текущий остаток. Расход токенов берётся из ответов API. Локальный бюджет пользователя — ориентир, не биллинговый лимит сервера.

## Что перенесено из ESQ

Оригинальные правила, индексы 55 документов и 1677 страниц, поиск карточек ассортимента, подбор двигателей/редукторов/насосов и проверка остатков. Индекс относится к снимку 8 октября 2026; остатки проверяются онлайн. Исходный установленный плагин не переиздавался: его код и правила включены в отдельный сервер сайта. Автоматической синхронизации будущих изменений исходного плагина нет.

Модель вызывает только разрешённые сервером инструменты. Для визуальной проверки каталогов read_catalog_visual получает оригинальный PDF/изображение из известного каталога и передаёт модели. Не более одного оригинала до 12 МБ на запрос; большие документы нужно разделить на страницы. PDF/фото пользователя передаются как бинарные вложения. Неясные числа, несовместимость, неизвестные артикулы и остатки не должны выдумываться.

Вложения: до 4 файлов, 8 МБ каждый, 16 МБ суммарно; PDF, PNG/JPEG/WebP, TXT, CSV, MD, JSON. DOCX/XLSX предварительно сохраните в PDF/CSV. Старые вложения хранятся в истории, но не переотправляются автоматически — для повторного анализа приложите снова. В контекст идут последние 8 текстовых сообщений. Максимум 7 раундов модели и 12 инструментов. На бесплатном тарифе Google может использовать данные для улучшения своих продуктов. Автоматическое подключение платных сервисов или биллинга не выполняется.

## Проверки

16 автоматических тестов пройдены. Живой вызов Gemini 3.5 Flash-Lite выполнил find_supplier_cards и вернул модель/артикул 01.01.213667 из оригинального индекса ESQ. Отдельный живой тест прочитал PDF и правильно извлёк модель, Q, H и контрольный код. Эти проверки не доказывают инженерную корректность любого будущего подбора: совместимость и графики требуют проверки источников. Полный браузерный тест закрытого сайта может требовать входа владельца.

## Файлы

- web/ — интерфейс и оригинальный движок ESQ.
- server/gemini.mjs — адаптер Gemini с вызовом инструментов и анализом PDF.
- scripts/hosted-runtime.js — серверные маршруты сайта.
- worker/index.js — скомпилированный Worker для размещения.
- server/local.mjs — локальный запуск; поддерживает GEMINI_API_KEY. Старое подключение OpenAI оставлено как необязательный локальный вариант.
- tests/ — тесты без ключей и платных запросов.

## Запуск локально

Установите Node.js 22.9+; создайте .env.local рядом с package.json и задайте GEMINI_API_KEY своего проекта. Затем npm start или START-WINDOWS.cmd. Откройте http://127.0.0.1:1455 . Секреты не передавайте посетителям и не коммитьте.

## Размещение

GitHub Pages размещает только интерфейс web/ — он не запускает сервер нейросети. Включённый workflow публикует интерфейс, но для работающего чата нужен совместимый сервер с /api/status, /api/models и /api/chat. Полный рабочий вариант этого проекта размещён как Worker в Sites. Для другого хостинга надо настроить GEMINI_API_KEY на его сервере и развернуть Worker; имя переменной сохраняется, секрет в исходники не добавляется.

История принадлежит браузерному профилю и адресу сайта. Очистка данных браузера удаляет её. Для переноса между адресами используйте экспорт/импорт. Локальные профили не являются защищённой авторизацией. Не редактируйте одну историю одновременно в нескольких вкладках.

Ответы отображаются с безопасным форматированием Markdown: заголовки, выделения, ссылки и таблицы. Сервер самостоятельно проверяет упомянутые в итоге артикулы выбранных карточек через get_component_stock с refresh=true, даже если модель пропустила вызов. Таблица наличия формируется из фактических ответов инструмента. Дата снимка каталога не используется как дата проверки склада. Сбой источника и неизвестный остаток не превращаются в ноль.


Мотор-редукторы NMRW: при неоднозначной OCR-таблице проверяется живой конфигуратор Элком (resultView), сначала точная скорость, затем ±15%. Проверяются отдельные карточки и реальные артикулы, мощность, PAM, передаточное число и монтаж. Для полного структурированного запроса состав и наличие формируются сервером без расхода Gemini. Несовпадение номеров габаритов ГОСТ/IEC не является запретом; явное B5/B14 остаётся несовместимым без подтверждённого адаптера. Артикулы конфигуратора не считаются актуальными без сверки; изменения IM3081/IM2081 не скрываются. Обязательные втулки включаются в состав, при отсутствии карточки комплект не объявляется полностью подтверждённым. Тест NMRW 63 54 0.75 B3 прошёл живой путь prepare_selection → конфигуратор → карточки → конечный ответ 29.10.2026.

## Доступ v1.2.2

Для гостевого режима нужны оба условия: публичная политика Sites и серверная переменная ESQ_ALLOW_GUEST=true. Без переменной сервер сохраняет требование входа. Пароли и ключи посетителям не передаются. История остаётся на устройстве; для переноса используйте экспорт/импорт. Отдельный Google OAuth не настроен: Sites управляет авторизацией ChatGPT. Google на странице ChatGPT, если доступен, не является независимым Google-входом. Firebase не используется. GitHub Pages не заменяет сервер Worker.

## GitHub Pages

Интерфейс: https://wooncer.github.io/esq-terminal/ . Исходники — ветка main. Workflow публикует web/ при каждом push. Сервер Gemini и ESQ остаётся по https://esq-terminal.katerisha.chatgpt.site; интерфейс использует публичный гостевой API с CORS только для https://wooncer.github.io. Ключ хранится исключительно на сервере. GitHub Pages не запускает Worker. Независимый Google OAuth пока не настроен; подбор доступен гостям.


### Optional Google Apps Script transport

Hosted Gemini requests can use `GEMINI_RELAY_URL` (Apps Script `/exec` URL) and
`GEMINI_RELAY_TOKEN`, both stored as server secrets. The private deployment uses
`deploy/google-apps-script.gs` with its token placeholder replaced by a random
64-character secret. Never commit the deployed token. The relay accepts only
Gemini model listing and generation. Catalogue downloads keep their original
transport. A configured relay failure is reported without direct fallback.

This changes Gemini server egress only, not visitors' IP addresses or other
website traffic. Apps Script provides no fixed-country guarantee; the initial
trace test observed US egress. Apps Script and Gemini quotas remain separate.


### Public GitHub frontend, version 1.2.4

The GitHub frontend now calls the standalone Google Apps Script API directly,
using a simple text/plain POST. It no longer needs visitor access to chatgpt.site.
The same equipment engine, catalogues, tool validation and Gemini loop are
built by `node scripts/build-gas.mjs`. Apps Script verifies the SHA-256 digest
of the compressed runtime before executing it. Update the pinned digest when
rebuilding the runtime. Public requests cannot select an arbitrary destination.
The API key and shared quota configuration live only in Script Properties.
The existing Sites server can provision these properties over HTTPS with its
private relay token when ESQ_GOOGLE_BOOTSTRAP=true; the key never enters the
GitHub repository or browser assets. Model responses are buffered by Apps
Script, so the browser displays a completed response rather than streaming
individual tokens. Cancelling a browser request cannot undo server-side work.


Version 1.2.5 fixes the native Apps Script Blob MIME requirement for gzipped
catalogue data. The status endpoint validates both compressed search indexes
before reporting a healthy engine. The regression test reproduces the native
non-null Blob type requirement.
