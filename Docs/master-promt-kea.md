# **Инструкция для ИИ-Агента: Разработка сервиса "Dynamic AI Talking Avatar"**

**Роль:** Senior Full-Stack Developer & AI Integration Expert.

**Твоя главная задача:** Проанализировать предоставленную документацию, составить профессиональное Техническое Задание (ТЗ / PRD) и разработать веб\-приложение на основе модели Seedance.

## **1\. Контекст и Базовые требования**

Необходимо создать веб\-сервис, который оживляет статичные изображения (аватары/парящие головы), накладывает на них голос (липсинк) и добавляет высокую динамику и эмоции в кадр.

* **Провайдер API:** KIE.ai  
* **Используемая модель:** bytedance/seedance-2-fast (вариант 480p no video input).  
* **Стек технологий:** Выбери оптимальный современный стек (рекомендуется Next.js / React для Frontend и Node.js/Python для Backend, TailwindCSS для стилей).

**Ссылки на документацию (ОБЯЗАТЕЛЬНО К ИЗУЧЕНИЮ):**

1. Базовая документация: https://docs.kie.ai/  
2. Документация модели Fast: https://docs.kie.ai/market/bytedance/seedance-2-fast

## **2\. Функционал пользовательского интерфейса (Frontend)**

Интерфейс должен состоять из панели управления и окна предпросмотра/результата.

### **Блок 1: Входные данные (Inputs)**

* **Image Upload:** Загрузка исходного изображения (статичная голова/персонаж).  
* **Voice/Audio Input (переключатель):**  
  * *Режим A (Text-to-Speech):* Текстовое поле для ввода речи аватара. Модель сама сгенерирует голос на основе текста.  
  * *Режим B (Audio Upload):* Возможность загрузить готовый аудиофайл (mp3/wav) для точного липсинка.

### **Блок 2: Настройка динамики и эмоций (Controls)**

* **Выбор эмоции (Emotion Selector):** Выпадающий список (Neutral, Joyful/Energetic, Deep Thought/Serious, Empathetic, Sarcastic).  
* **Уровень динамики (Dynamism Slider):** Ползунок от 1 до 3 (1 \- Static, 2 \- Smooth Motion, 3 \- High Energy/Cinematic).  
* **Стиль камеры (Camera Style):** Выпадающий список (Static, Dolly Zoom, Arc/Orbit, Handheld Shake).

## **3\. Логика Backend и интеграция с KIE.ai**

Твоя задача — написать "Prompt Builder" (Конструктор промпта), который берет данные из UI и формирует правильный текстовый запрос для API KIE.ai.

### **Архитектура запроса (API Flow)**

1. **Загрузка файлов:** Изображение и аудио (если выбрано) должны быть преобразованы в публичные URL или переданы согласно спецификации KIE.ai.  
2. **Асинхронность:** API KIE.ai работает асинхронно. Нужно реализовать логику создания задачи (POST) и последующего опроса (Polling / GET) до получения статуса success или failed.  
3. **Формирование Payload:** Учитывай, что модель seedance-2-fast мультимодальна.

### **Алгоритм "Prompt Builder" (Секрет динамики)**

API Seedance управляется текстовым промптом. Чтобы аватар не был скучной "говорящей головой", backend должен динамически собирать итоговый prompt по следующей формуле:

\[Image Reference\] \+ \[Audio Reference / Text Quote\] \+ \[Emotion Modifiers\] \+ \[Camera & Dynamism Modifiers\] \+ \[Timeline Prompting\]

**Таблица маппинга параметров (Реализовать в коде):**

* **Если Dynamism \= 3 (High Energy):** Добавлять в промпт: *"highly expressive, dynamic head rotation, rhythmic floating bounce, lively gestures, elastic easing motion"*.  
* **Если Camera \= Dolly Zoom:** Добавлять: *"cinematic dolly zoom effect, dynamic depth of field"*.  
* **Если Emotion \= Joyful:** Добавлять: *"wide bright smile, energetic eye movement, raised eyebrows, empathetic micro-expressions"*.  
* **Timeline Prompting:** Если выбран высокий уровень динамики, скрипт должен автоматически разбивать анимацию по времени. *Пример генерации скриптом:* "\[0s\] The character starts speaking with a subtle smile. \[2s\] Dynamic head tilt to the left. \[4s\] Sudden zoom-in with highly expressive eyes. \[6s\] Smooth rotation back to center."

**Пример идеального сгенерированного промпта для API:**

"https://pixabay.com/ru/ The character says 'Welcome to the future\!' (или https://en.wikipedia.org/wiki/Audio). Animation features highly expressive, dynamic head rotation, rhythmic floating bounce. Cinematic dolly zoom effect. Joyful mood with wide bright smile, energetic eye movement. \[0s\] Subtle smile. \[3s\] Dynamic head tilt. Professional studio lighting, flawless highly polished 3D render style."

## **4\. План действий для ИИ-Агента (Твои шаги)**

Пожалуйста, выполни задачу строго в следующем порядке:

**ШАГ 1: Разработка ТЗ (Technical Design Document)**

* Прочитай предоставленные ссылки на документацию KIE.ai.  
* Напиши подробное ТЗ (Архитектура, стек, структура API-запросов к KIE.ai, структура БД если нужна, флоу пользователя).  
* Предоставь это ТЗ мне на утверждение.

**ШАГ 2: Подготовка инфраструктуры**

* После моего "ОК" на ТЗ, создай структуру проекта.  
* Настрой маршруты API (роуты) на бэкенде для связи с KIE.ai.

**ШАГ 3: Разработка Prompt Builder и API интеграции**

* Напиши утилиту, которая переводит состояние UI (ползунки, списки) в текстовый промпт Seedance, используя логику из раздела 3\.  
* Реализуй механизм Polling (опроса статуса генерации).

**ШАГ 4: Разработка Frontend**

* Создай красивый, современный UI с загрузкой файлов, настройками эмоций/динамики и видеоплеером для результата.

**Жду от тебя первый шаг — готовое Техническое Задание (ТЗ) на основе этих вводных.**