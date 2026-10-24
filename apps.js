
/* iPhone 风格应用：独立于 KKT 聊天与通话 */
(() => {
  'use strict';

  const KEY = 'wooyuha_apps_v1';
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch (_) {}

  const state = {
    calendarOffset: 0,
    selectedDate: '',
    clockTab: 'world',
    swStart: 0,
    swElapsed: 0,
    swRunning: false,
    timerEnd: 0,
    timerLeft: 300,
    timerRunning: false,
    notesIndex: -1,
    settings: saved.settings || {},
    musicIndex: 0,
    musicAudio: null,
    musicPlaying: false,
    cameraStream: null,
    photoUrl: null,
    filesFolder: 'root',
    mapQuery: '서울특별시',
    browserQuery: '',
    clockTicker: null
  };

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        notes: saved.notes || [],
        events: saved.events || {},
        alarms: saved.alarms || [],
        settings: state.settings,
        files: saved.files || []
      }));
    } catch (_) {}
  };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  const pad = n => String(n).padStart(2, '0');
  const localDate = d =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const appPages = new Set([
    'calendar', 'weather', 'browser', 'clock', 'notes',
    'settings', 'music', 'files', 'map', 'camera'
  ]);

  const titles = {
    calendar: '日历',
    weather: '天气',
    browser: 'Safari',
    clock: '时钟',
    notes: '备忘录',
    settings: '设置',
    music: '音乐',
    files: '文件',
    map: '地图',
    camera: '相机'
  };

  const css = document.createElement('style');

  css.textContent = `
    .ios-app {
      height: calc(100% - 91px);
      overflow: auto;
      background: #f2f2f7;
      color: #17171b;
      padding: 12px 16px 95px;
      font-family: -apple-system, BlinkMacSystemFont,
        "Helvetica Neue", Arial, sans-serif;
      scrollbar-width: thin;
    }

    .ios-app h1 {
      font-size: 31px;
      letter-spacing: -.8px;
      margin: 15px 0 20px;
    }

    .ios-app h2 {
      font-size: 20px;
      margin: 16px 0 10px;
    }

    .ios-app h3 {
      font-size: 16px;
      margin: 0 0 10px;
    }

    .ios-app p {
      line-height: 1.5;
    }

    .ios-group {
      background: white;
      border-radius: 13px;
      overflow: hidden;
      margin: 12px 0 22px;
    }

    .ios-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 13px 15px;
      background: white;
      border: 0;
      border-bottom: 1px solid #ececf0;
      text-align: left;
      color: #18181c;
      font-size: 15px;
      min-height: 47px;
    }

    .ios-item:last-child {
      border-bottom: 0;
    }

    .ios-item span:first-child {
      flex: 1;
    }

    .ios-muted {
      color: #85858c;
      font-size: 13px;
    }

    .ios-blue { color: #007aff; }
    .ios-red { color: #ff3b30; }

    .ios-action {
      border: 0;
      background: #007aff;
      color: white;
      border-radius: 11px;
      padding: 11px 16px;
      font-size: 15px;
      font-weight: 600;
    }

    .ios-secondary {
      border: 0;
      background: #e5e5eb;
      color: #007aff;
      border-radius: 10px;
      padding: 9px 13px;
    }

    .ios-input,
    .ios-textarea,
    .ios-select {
      width: 100%;
      border: 0;
      background: #fff;
      border-radius: 11px;
      padding: 13px;
      font: inherit;
      color: #17171b;
      outline-color: #007aff;
    }

    .ios-textarea {
      min-height: 190px;
      resize: vertical;
      line-height: 1.6;
    }

    .ios-label {
      font-size: 12px;
      color: #85858c;
      margin: 18px 5px 7px;
      display: block;
      text-transform: uppercase;
    }

    .ios-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .ios-row > * {
      min-width: 0;
    }

    .ios-row .ios-grow {
      flex: 1;
    }

    .ios-cal-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 5px;
      text-align: center;
    }

    .ios-cal-grid .weekday {
      color: #8e8e93;
      font-size: 11px;
      padding: 9px 0;
    }

    .ios-cal-grid button {
      aspect-ratio: 1;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: #222;
      font-size: 14px;
    }

    .ios-cal-grid button.today {
      background: #ff3b30;
      color: #fff;
    }

    .ios-cal-grid button.selected {
      outline: 2px solid #007aff;
      outline-offset: -2px;
    }

    .ios-cal-grid button.has-event:not(.today):after {
      content: '·';
      display: block;
      color: #007aff;
      line-height: 0;
      font-size: 20px;
    }

    .ios-card {
      border-radius: 17px;
      padding: 18px;
      background: #fff;
      margin: 12px 0;
    }

    .ios-tabs {
      display: flex;
      gap: 5px;
      background: #dedee4;
      border-radius: 10px;
      padding: 4px;
      margin-bottom: 15px;
    }

    .ios-tabs button {
      flex: 1;
      border: 0;
      background: transparent;
      border-radius: 8px;
      padding: 9px 2px;
      font-size: 12px;
    }

    .ios-tabs button.active {
      background: white;
      box-shadow: 0 1px 4px #0002;
    }

    .ios-weather {
      background: linear-gradient(
        165deg, #4d84b7, #86a9d0 55%, #c2d1e0
      );
      color: white;
      border-radius: 22px;
      padding: 26px 20px;
      min-height: 280px;
      text-align: center;
    }

    .ios-weather .temp {
      font-size: 83px;
      font-weight: 200;
      line-height: 1.15;
    }

    .ios-weather .city {
      font-size: 29px;
    }

    .ios-weather .forecast {
      display: flex;
      justify-content: space-between;
      margin-top: 38px;
      gap: 8px;
      font-size: 12px;
    }

    .ios-clock-big {
      font-size: 53px;
      font-weight: 250;
      text-align: center;
      font-variant-numeric: tabular-nums;
      margin: 26px 0;
    }

    .ios-note {
      font-size: 12px;
      color: #8e8e93;
    }

    .ios-note-preview {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ios-toggle {
      accent-color: #34c759;
      width: 22px;
      height: 22px;
    }

    .ios-cover {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 16px;
      background: linear-gradient(135deg, #e76c8b, #7752b9);
      display: grid;
      place-items: center;
      color: white;
      font-size: 70px;
      margin: 15px auto 25px;
      max-width: 290px;
    }

    .ios-range {
      width: 100%;
      accent-color: #007aff;
    }

    .ios-camera {
      position: relative;
      background: #101010;
      border-radius: 17px;
      min-height: 300px;
      overflow: hidden;
      display: grid;
      place-items: center;
      color: white;
    }

    .ios-camera video,
    .ios-camera img {
      width: 100%;
      max-height: 410px;
      object-fit: contain;
    }

    .ios-map {
      background: #e6e9df;
      border-radius: 15px;
      min-height: 170px;
      display: grid;
      place-items: center;
      text-align: center;
      color: #53655e;
      padding: 25px;
    }
  `;

  document.head.appendChild(css);

  const top = p =>
    `<div class="page">${status()}${nav(titles[p])}<div class="ios-app" data-ios-page="${p}">`;

  const end = `</div>${bar}</div>`;

  const btn = (label, action, extra = '') =>
    `<button class="ios-action" data-ios="${action}" ${extra}>${label}</button>`;

  const weekday = ['日', '一', '二', '三', '四', '五', '六'];
  
  /* 第 2 部分：日历 */
  function calendarHTML() {
    const today = new Date();
    const first = new Date(
      today.getFullYear(),
      today.getMonth() + state.calendarOffset, 1
    );
    const year = first.getFullYear();
    const month = first.getMonth();
    const count = new Date(year, month + 1, 0).getDate();
    const startDay = first.getDay();
    const events = saved.events || {};

    if (!state.selectedDate) {
      state.selectedDate = localDate(today);
    }

    const days = Array.from({length: startDay}, () =>
      '<span></span>'
    ).join('') + Array.from({length: count}, (_, i) => {
      const date = localDate(new Date(year, month, i + 1));
      const classes = [
        date === localDate(today) ? 'today' : '',
        date === state.selectedDate ? 'selected' : '',
        (events[date] || []).length ? 'has-event' : ''
      ].join(' ');

      return `<button class="${classes}"
        data-ios="select-date" data-date="${date}">
        ${i + 1}
      </button>`;
    }).join('');

    const list = events[state.selectedDate] || [];

    return top('calendar') + `
      <h1>日历</h1>
      <div class="ios-row" style="justify-content:space-between">
        <button class="ios-secondary" data-ios="prev-month">‹</button>
        <strong>${year}年${month + 1}月</strong>
        <button class="ios-secondary" data-ios="next-month">›</button>
      </div>
      <div class="ios-card">
        <div class="ios-cal-grid">
          ${weekday.map(x =>
            `<span class="weekday">${x}</span>`
          ).join('')}
          ${days}
        </div>
      </div>
      <div class="ios-row" style="justify-content:space-between">
        <h2>${esc(state.selectedDate)} 的日程</h2>
        <button class="ios-secondary" data-ios="calendar-today">
          今天
        </button>
      </div>
      <div class="ios-group">
        ${list.length ? list.map((event, i) => `
          <div class="ios-item">
            <span>${esc(event)}</span>
            <button class="ios-secondary"
              data-ios="delete-event" data-index="${i}">
              删除
            </button>
          </div>
        `).join('') : `
          <div class="ios-item ios-muted">暂无日程</div>
        `}
      </div>
      <label class="ios-label">新日程</label>
      <input id="ios-event-input" class="ios-input"
        placeholder="例如：下午三点见朋友">
      <div style="margin-top:12px">
        ${btn('＋ 添加日程', 'add-event')}
      </div>
    ` + end;
  }

  /* 首尔天气：固定城市，不请求手机定位 */
  let seoulWeather = null;
  let weatherError = '';

  const weatherLabel = code => {
    if (code === 0) return ['晴朗', '☀️'];
    if ([1, 2].includes(code)) return ['晴间多云', '🌤️'];
    if (code === 3) return ['多云', '☁️'];
    if ([45, 48].includes(code)) return ['有雾', '🌫️'];
    if ([51, 53, 55, 56, 57].includes(code))
      return ['毛毛雨', '🌦️'];
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
      return ['下雨', '🌧️'];
    if ([71, 73, 75, 77, 85, 86].includes(code))
      return ['下雪', '❄️'];
    if ([95, 96, 99].includes(code))
      return ['雷雨', '⛈️'];
    return ['天气变化', '🌥️'];
  };

  async function fetchSeoulWeather() {
    weatherError = '';
    try {
      const url =
        'https://api.open-meteo.com/v1/forecast' +
        '?latitude=37.5665&longitude=126.9780' +
        '&current=temperature_2m,apparent_temperature,' +
        'relative_humidity_2m,weather_code,wind_speed_10m' +
        '&daily=weather_code,temperature_2m_max,' +
        'temperature_2m_min' +
        '&timezone=Asia%2FSeoul&forecast_days=5';

      const response = await fetch(url);
      if (!response.ok) throw new Error('天气请求失败');

      seoulWeather = await response.json();
    } catch (err) {
      weatherError = '天气暂时无法加载，请检查网络。';
    }

    if (page === 'weather') render();
  }

  function weatherHTML() {
    const current = seoulWeather?.current;
    const daily = seoulWeather?.daily;
    const label = current
      ? weatherLabel(current.weather_code)
      : ['正在加载', '🌤️'];

    return top('weather') + `
      <h1>天气</h1>
      <div class="ios-weather">
        <div class="city">首尔</div>
        <div style="font-size:13px;opacity:.85">
          韩国 · Seoul
        </div>
        <div class="temp">
          ${current ? Math.round(current.temperature_2m) + '°' : '—'}
        </div>
        <div style="font-size:18px">
          ${label[1]} ${label[0]}
        </div>
        <div style="font-size:13px;margin-top:8px">
          ${current
            ? '体感 ' + Math.round(current.apparent_temperature) + '°'
            : weatherError || '正在获取首尔天气…'}
        </div>
        <div class="forecast">
          ${daily ? daily.time.map((date, i) => `
            <div>
              <div>${date.slice(5)}</div>
              <div style="font-size:22px;margin:8px 0">
                ${weatherLabel(daily.weather_code[i])[1]}
              </div>
              <div>
                ${Math.round(daily.temperature_2m_max[i])}°
              </div>
              <div style="opacity:.7">
                ${Math.round(daily.temperature_2m_min[i])}°
              </div>
            </div>
          `).join('') : ''}
        </div>
      </div>
      <div class="ios-group">
        <div class="ios-item">
          <span>位置</span><span>首尔特别市</span>
        </div>
        <div class="ios-item">
          <span>湿度</span>
          <span>${current ? current.relative_humidity_2m + '%' : '—'}</span>
        </div>
        <div class="ios-item">
          <span>风速</span>
          <span>${current ? current.wind_speed_10m + ' km/h' : '—'}</span>
        </div>
      </div>
      ${btn('刷新首尔天气', 'refresh-weather')}
    ` + end;
  }

  /* Safari：搜索及打开网站 */
  function browserHTML() {
    return top('browser') + `
      <h1>Safari</h1>
      <div class="ios-card">
        <h2>搜索或输入网址</h2>
        <form id="ios-browser-form">
          <input id="ios-browser-input" class="ios-input"
            placeholder="搜索网页或输入网址"
            value="${esc(state.browserQuery)}">
          <div style="margin-top:12px">
            <button class="ios-action" type="submit">前往</button>
          </div>
        </form>
      </div>
      <h2>个人收藏</h2>
      <div class="ios-group">
        <button class="ios-item" data-ios="open-link"
          data-url="https://www.google.com">
          <span>🌐 Google</span><span>›</span>
        </button>
        <button class="ios-item" data-ios="open-link"
          data-url="https://www.naver.com">
          <span>🟢 NAVER</span><span>›</span>
        </button>
        <button class="ios-item" data-ios="open-link"
          data-url="https://www.youtube.com">
          <span>▶️ YouTube</span><span>›</span>
        </button>
      </div>
      <p class="ios-note">
        网页将在新标签页打开，避免其他网站的安全限制。
      </p>
    ` + end;
  }

  /* 时钟：世界时间、闹钟、秒表、计时器 */
  function clockHTML() {
    const tabs = [
      ['world', '世界时钟'],
      ['alarm', '闹钟'],
      ['stopwatch', '秒表'],
      ['timer', '计时器']
    ];

    const tabHTML = `
      <div class="ios-tabs">
        ${tabs.map(([key, name]) => `
          <button data-ios="clock-tab" data-tab="${key}"
            class="${state.clockTab === key ? 'active' : ''}">
            ${name}
          </button>
        `).join('')}
      </div>`;

    let body = '';

    if (state.clockTab === 'world') {
      const now = new Date();
      const time = zone => now.toLocaleTimeString('zh-CN', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      body = `
        <div class="ios-group">
          ${[
            ['首尔', 'Asia/Seoul'],
            ['墨尔本', 'Australia/Melbourne'],
            ['北京', 'Asia/Shanghai'],
            ['纽约', 'America/New_York'],
            ['伦敦', 'Europe/London']
          ].map(([city, zone]) => `
            <div class="ios-item">
              <span>${city}</span>
              <strong>${time(zone)}</strong>
            </div>
          `).join('')}
        </div>`;
    }

    if (state.clockTab === 'alarm') {
      const alarms = saved.alarms || [];
      body = `
        <h2>我的闹钟</h2>
        <div class="ios-group">
          ${alarms.length ? alarms.map((a, i) => `
            <div class="ios-item">
              <span style="font-size:25px">${esc(a.time)}</span>
              <input type="checkbox" class="ios-toggle"
                data-ios-alarm="${i}" ${a.enabled ? 'checked' : ''}>
              <button class="ios-secondary"
                data-ios="delete-alarm" data-index="${i}">
                删除
              </button>
            </div>
          `).join('') : `
            <div class="ios-item ios-muted">暂无闹钟</div>
          `}
        </div>
        <input id="ios-alarm-time" class="ios-input"
          type="time" value="08:00">
        <div style="margin-top:12px">
          ${btn('＋ 添加闹钟', 'add-alarm')}
        </div>
        <p class="ios-note">
          网页闹钟仅在页面保持打开时提醒。
        </p>`;
    }

    if (state.clockTab === 'stopwatch') {
      const elapsed = state.swElapsed +
        (state.swRunning ? Date.now() - state.swStart : 0);
      const ms = Math.max(0, elapsed);
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor(ms / 1000) % 60;
      const hundredths = Math.floor(ms / 10) % 100;

      body = `
        <div class="ios-clock-big" id="ios-stopwatch-display">
          ${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}
        </div>
        <div class="ios-row" style="justify-content:center">
          ${btn(state.swRunning ? '暂停' : '开始', 'toggle-stopwatch')}
          <button class="ios-secondary"
            data-ios="reset-stopwatch">重置</button>
        </div>`;
    }

    if (state.clockTab === 'timer') {
      const left = state.timerRunning
        ? Math.max(0, Math.ceil((state.timerEnd - Date.now()) / 1000))
        : state.timerLeft;

      body = `
        <div class="ios-clock-big" id="ios-timer-display">
          ${pad(Math.floor(left / 60))}:${pad(left % 60)}
        </div>
        <label class="ios-label">分钟</label>
        <input id="ios-timer-minutes" class="ios-input"
          type="number" min="1" max="999"
          value="${Math.max(1, Math.ceil(state.timerLeft / 60))}">
        <div class="ios-row" style="margin-top:15px">
          ${btn(state.timerRunning ? '暂停' : '开始', 'toggle-timer')}
          <button class="ios-secondary" data-ios="reset-timer">
            重置
          </button>
        </div>`;
    }

    return top('clock') + `
      <h1>时钟</h1>
      ${tabHTML}
      ${body}
    ` + end;
  }

  /* 备忘录：创建、编辑、删除 */
  function notesHTML() {
    const notes = saved.notes || [];

    if (state.notesIndex >= 0) {
      const note = notes[state.notesIndex];
      if (!note) state.notesIndex = -1;
      else return top('notes') + `
        <div class="ios-row" style="justify-content:space-between">
          <button class="ios-secondary" data-ios="notes-back">
            ‹ 备忘录
          </button>
          <button class="ios-secondary ios-red"
            data-ios="delete-note">删除</button>
        </div>
        <h2>编辑备忘录</h2>
        <input id="ios-note-title" class="ios-input"
          placeholder="标题" value="${esc(note.title)}">
        <textarea id="ios-note-body" class="ios-textarea"
          style="margin-top:12px"
          placeholder="开始输入…">${esc(note.body)}</textarea>
        <div style="margin-top:12px">
          ${btn('完成并保存', 'save-note')}
        </div>
      ` + end;
    }

    return top('notes') + `
      <h1>备忘录</h1>
      <div class="ios-group">
        ${notes.length ? notes.map((note, i) => `
          <button class="ios-item" data-ios="open-note"
            data-index="${i}">
            <span>
              <strong>${esc(note.title || '新备忘录')}</strong>
              <div class="ios-note-preview ios-muted">
                ${esc(note.body || '暂无内容')}
              </div>
            </span>
            <span>›</span>
          </button>
        `).join('') : `
          <div class="ios-item ios-muted">还没有备忘录</div>
        `}
      </div>
      ${btn('✎ 新建备忘录', 'new-note')}
    ` + end;
  }

  /* 第 3 部分：设置 */
  function settingsHTML() {
    const s = state.settings;
    const brightness = Number(s.brightness ?? 100);

    return top('settings') + `
      <h1>设置</h1>
      <div class="ios-group">
        <div class="ios-item">
          <span>✈️ 飞行模式</span>
          <input type="checkbox" class="ios-toggle"
            data-ios-setting="airplane"
            ${s.airplane ? 'checked' : ''}>
        </div>
        <div class="ios-item">
          <span>📶 Wi-Fi</span>
          <input type="checkbox" class="ios-toggle"
            data-ios-setting="wifi"
            ${s.wifi !== false ? 'checked' : ''}>
        </div>
        <div class="ios-item">
          <span>🔵 蓝牙</span>
          <input type="checkbox" class="ios-toggle"
            data-ios-setting="bluetooth"
            ${s.bluetooth ? 'checked' : ''}>
        </div>
      </div>
      <span class="ios-label">显示与亮度</span>
      <div class="ios-group">
        <div class="ios-item">
          <span>亮度</span>
          <span id="ios-brightness-value">${brightness}%</span>
        </div>
        <div style="padding:8px 15px 18px">
          <input class="ios-range" type="range"
            id="ios-brightness" min="25" max="100"
            value="${brightness}">
        </div>
        <div class="ios-item">
          <span>深色外观</span>
          <input type="checkbox" class="ios-toggle"
            data-ios-setting="dark"
            ${s.dark ? 'checked' : ''}>
        </div>
      </div>
      <span class="ios-label">关于本机</span>
      <div class="ios-group">
        <div class="ios-item">
          <span>名称</span><span class="ios-muted">我的 iPhone</span>
        </div>
        <div class="ios-item">
          <span>系统</span><span class="ios-muted">iOS 风格网页</span>
        </div>
        <div class="ios-item">
          <span>储存空间</span>
          <span class="ios-muted">浏览器本地储存</span>
        </div>
      </div>
      <p class="ios-note">
        飞行模式、Wi-Fi 和蓝牙是模拟设置，不会改变真实设备。
        亮度和深色外观只影响此网页。
      </p>
    ` + end;
  }

  /* 音乐：播放网站内已有音频 */
  const songs = [
    {
      title: '10月24日',
      artist: '私人录音',
      src: '10月24日.mp3'
    }
  ];

  function musicHTML() {
    const song = songs[state.musicIndex] || songs[0];

    return top('music') + `
      <h1>音乐</h1>
      <div class="ios-cover">♫</div>
      <div style="text-align:center">
        <h2>${esc(song.title)}</h2>
        <p class="ios-muted">${esc(song.artist)}</p>
      </div>
      <input type="range" class="ios-range"
        id="ios-music-progress" min="0" max="100" value="0">
      <div class="ios-row" style="justify-content:space-between">
        <span class="ios-note" id="ios-music-current">0:00</span>
        <span class="ios-note" id="ios-music-duration">0:00</span>
      </div>
      <div class="ios-row"
        style="justify-content:center;margin:24px 0;gap:20px">
        <button class="ios-secondary" data-ios="music-prev">⏮</button>
        ${btn(state.musicPlaying ? '❚❚ 暂停' : '▶ 播放',
          'music-toggle')}
        <button class="ios-secondary" data-ios="music-next">⏭</button>
      </div>
      <h2>歌曲列表</h2>
      <div class="ios-group">
        ${songs.map((s, i) => `
          <button class="ios-item" data-ios="music-select"
            data-index="${i}">
            <span>♫ ${esc(s.title)}</span>
            <span class="ios-muted">${esc(s.artist)}</span>
          </button>
        `).join('')}
      </div>
    ` + end;
  }

  /* 文件：网站内部的文件空间 */
  function filesHTML() {
    const files = saved.files || [];

    return top('files') + `
      <h1>文件</h1>
      <div class="ios-row" style="justify-content:space-between">
        <h2>我的 iPhone</h2>
        <button class="ios-secondary" data-ios="new-file">
          ＋ 新建文本
        </button>
      </div>
      <div class="ios-group">
        ${files.length ? files.map((file, i) => `
          <div class="ios-item">
            <button style="border:0;background:none;flex:1;
              text-align:left;color:inherit"
              data-ios="open-file" data-index="${i}">
              📄 ${esc(file.name)}
            </button>
            <button class="ios-secondary" data-ios="delete-file"
              data-index="${i}">删除</button>
          </div>
        `).join('') : `
          <div class="ios-item ios-muted">
            这里还没有文件。可以新建文本文件。
          </div>
        `}
      </div>
      <p class="ios-note">
        文件储存在当前浏览器中，不会访问真实 iPhone 文件。
      </p>
    ` + end;
  }

  /* 地图：搜索地点与导航 */
  function mapHTML() {
    return top('map') + `
      <h1>地图</h1>
      <div class="ios-card">
        <label class="ios-label">搜索地点</label>
        <input id="ios-map-input" class="ios-input"
          value="${esc(state.mapQuery)}"
          placeholder="输入城市、地址或地点">
        <div class="ios-row" style="margin-top:12px">
          ${btn('搜索地点', 'map-search')}
          <button class="ios-secondary" data-ios="map-directions">
            导航
          </button>
        </div>
      </div>
      <div class="ios-map">
        <div>
          <div style="font-size:44px">📍</div>
          <strong>${esc(state.mapQuery)}</strong>
          <p style="font-size:12px">
            点击搜索，可在地图服务中查看地点。
          </p>
        </div>
      </div>
      <h2>常用地点</h2>
      <div class="ios-group">
        ${[
          ['🇰🇷 首尔', 'Seoul South Korea'],
          ['🏙️ 江南', 'Gangnam Seoul'],
          ['🛍️ 弘大', 'Hongdae Seoul'],
          ['🌳 首尔林', 'Seoul Forest']
        ].map(([label, query]) => `
          <button class="ios-item" data-ios="map-place"
            data-query="${esc(query)}">
            <span>${label}</span><span>›</span>
          </button>
        `).join('')}
      </div>
    ` + end;
  }

  /* 相机：调用浏览器摄像头 */
  function cameraHTML() {
    return top('camera') + `
      <h1>相机</h1>
      <div class="ios-camera">
        <video id="ios-camera-video" autoplay
          muted playsinline></video>
        <div id="ios-camera-message"
          style="position:absolute;text-align:center;padding:20px">
          点击下方按钮开启相机
        </div>
      </div>
      <div class="ios-row"
        style="justify-content:center;margin:20px 0">
        ${btn('开启相机', 'camera-start')}
        <button class="ios-secondary" data-ios="camera-snap">
          ◉ 拍照
        </button>
        <button class="ios-secondary" data-ios="camera-stop">
          关闭
        </button>
      </div>
      <canvas id="ios-camera-canvas"
        style="display:none"></canvas>
      <div id="ios-camera-result"></div>
      <p class="ios-note">
        摄像头需要浏览器授权。照片可保存到设备，
        不会自动上传到服务器。
      </p>
    ` + end;
  }

  /* 第 4 部分：应用启动和交互 */

  const appRenderers = {
    calendar: calendarHTML,
    weather: weatherHTML,
    browser: browserHTML,
    clock: clockHTML,
    notes: notesHTML,
    settings: settingsHTML,
    music: musicHTML,
    files: filesHTML,
    map: mapHTML,
    camera: cameraHTML
  };

  const originalRender = render;

  render = function () {
    if (appPages.has(page)) {
      screen.innerHTML = appRenderers[page]();

      if (page === 'weather' && !seoulWeather && !weatherError) {
        fetchSeoulWeather();
      }

      if (page === 'camera' && state.cameraStream) {
        const video = document.getElementById('ios-camera-video');
        if (video) video.srcObject = state.cameraStream;
        const msg = document.getElementById('ios-camera-message');
        if (msg) msg.style.display = 'none';
      }
      return;
    }

    originalRender();
  };

  const originalGo = go;

  go = function (destination) {
    if (page === 'camera' && destination !== 'camera') {
      stopCamera();
    }
    originalGo(destination);
  };

  const $ = id => document.getElementById(id);

  const getValue = id => ($(id)?.value || '').trim();

  function stopCamera() {
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach(track => track.stop());
      state.cameraStream = null;
    }
  }

  function openExternal(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function openSearch(query, directions = false) {
    const q = encodeURIComponent(query);
    const url = directions
      ? 'https://www.google.com/maps/dir/?api=1&destination=' + q
      : 'https://www.google.com/maps/search/?api=1&query=' + q;
    openExternal(url);
  }

  function formatDuration(seconds) {
    const n = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(n / 60)}:${pad(n % 60)}`;
  }

  function getMusicAudio() {
    if (!state.musicAudio) {
      state.musicAudio = new Audio(songs[state.musicIndex].src);

      state.musicAudio.addEventListener('ended', () => {
        state.musicPlaying = false;
        if (page === 'music') render();
      });

      state.musicAudio.addEventListener('timeupdate', () => {
        const audio = state.musicAudio;
        const progress = $('ios-music-progress');
        const current = $('ios-music-current');
        const duration = $('ios-music-duration');

        if (progress && audio.duration) {
          progress.value = audio.currentTime / audio.duration * 100;
        }
        if (current) {
          current.textContent = formatDuration(audio.currentTime);
        }
        if (duration) {
          duration.textContent = formatDuration(audio.duration);
        }
      });
    }
    return state.musicAudio;
  }

  function refreshMusic() {
    if (state.musicAudio) {
      state.musicAudio.pause();
      state.musicAudio = null;
    }
    state.musicPlaying = false;
    render();
  }

  document.addEventListener('click', async e => {
    const button = e.target.closest('[data-ios]');
    if (!button) return;

    const action = button.dataset.ios;
    const index = Number(button.dataset.index);

    /* 日历 */
    if (action === 'prev-month' || action === 'next-month') {
      state.calendarOffset += action === 'next-month' ? 1 : -1;
      const now = new Date();
      state.selectedDate = localDate(new Date(
        now.getFullYear(),
        now.getMonth() + state.calendarOffset, 1
      ));
      render();
    }

    if (action === 'calendar-today') {
      state.calendarOffset = 0;
      state.selectedDate = localDate(new Date());
      render();
    }

    if (action === 'select-date') {
      state.selectedDate = button.dataset.date;
      render();
    }

    if (action === 'add-event') {
      const value = getValue('ios-event-input');
      if (!value) return;
      saved.events ||= {};
      saved.events[state.selectedDate] ||= [];
      saved.events[state.selectedDate].push(value);
      save();
      render();
    }

    if (action === 'delete-event') {
      saved.events[state.selectedDate].splice(index, 1);
      save();
      render();
    }

    /* 首尔天气 */
    if (action === 'refresh-weather') {
      seoulWeather = null;
      weatherError = '';
      fetchSeoulWeather();
    }

    /* 时钟 */
    if (action === 'clock-tab') {
      state.clockTab = button.dataset.tab;
      render();
    }

    if (action === 'add-alarm') {
      const time = getValue('ios-alarm-time');
      if (!time) return;
      saved.alarms ||= [];
      saved.alarms.push({time, enabled: true});
      save();
      render();
    }

    if (action === 'delete-alarm') {
      saved.alarms.splice(index, 1);
      save();
      render();
    }

    if (action === 'toggle-stopwatch') {
      if (state.swRunning) {
        state.swElapsed += Date.now() - state.swStart;
        state.swRunning = false;
      } else {
        state.swStart = Date.now();
        state.swRunning = true;
      }
      render();
    }

    if (action === 'reset-stopwatch') {
      state.swRunning = false;
      state.swElapsed = 0;
      render();
    }

    if (action === 'toggle-timer') {
      if (state.timerRunning) {
        state.timerLeft = Math.max(
          0, Math.ceil((state.timerEnd - Date.now()) / 1000)
        );
        state.timerRunning = false;
      } else {
        const minutes = Number(getValue('ios-timer-minutes'));
        if (Number.isFinite(minutes) && minutes > 0) {
          state.timerLeft = Math.round(minutes * 60);
        }
        state.timerEnd = Date.now() + state.timerLeft * 1000;
        state.timerRunning = true;
      }
      render();
    }

    if (action === 'reset-timer') {
      state.timerRunning = false;
      state.timerLeft = 300;
      render();
    }

    /* 备忘录 */
    if (action === 'new-note') {
      saved.notes ||= [];
      saved.notes.unshift({title: '', body: ''});
      state.notesIndex = 0;
      save();
      render();
    }

    if (action === 'open-note') {
      state.notesIndex = index;
      render();
    }

    if (action === 'save-note') {
      const note = saved.notes[state.notesIndex];
      if (!note) return;
      note.title = getValue('ios-note-title');
      note.body = $('ios-note-body')?.value || '';
      save();
      state.notesIndex = -1;
      render();
    }

    if (action === 'notes-back') {
      state.notesIndex = -1;
      render();
    }

    if (action === 'delete-note') {
      if (!confirm('确定删除这条备忘录吗？')) return;
      saved.notes.splice(state.notesIndex, 1);
      state.notesIndex = -1;
      save();
      render();
    }

    /* 音乐 */
    if (action === 'music-toggle') {
      const audio = getMusicAudio();
      if (state.musicPlaying) {
        audio.pause();
        state.musicPlaying = false;
      } else {
        try {
          await audio.play();
          state.musicPlaying = true;
        } catch (_) {
          alert('音频无法播放，请确认文件已经上传。');
        }
      }
      render();
    }

    if (action === 'music-select') {
      state.musicIndex = index;
      refreshMusic();
    }

    if (action === 'music-next' || action === 'music-prev') {
      const step = action === 'music-next' ? 1 : -1;
      state.musicIndex =
        (state.musicIndex + step + songs.length) % songs.length;
      refreshMusic();
    }

    /* 文件 */
    if (action === 'new-file') {
      const name = prompt('请输入文件名', '新建文本.txt');
      if (!name) return;
      const content = prompt('请输入文件内容', '') ?? '';
      saved.files ||= [];
      saved.files.push({name, content});
      save();
      render();
    }

    if (action === 'open-file') {
      const file = saved.files[index];
      if (!file) return;
      const content = prompt(
        '编辑 ' + file.name,
        file.content
      );
      if (content !== null) {
        file.content = content;
        save();
        render();
      }
    }

    if (action === 'delete-file') {
      if (!confirm('确定删除这个文件吗？')) return;
      saved.files.splice(index, 1);
      save();
      render();
    }

    /* 地图 */
    if (action === 'map-search' || action === 'map-directions') {
      const query = getValue('ios-map-input');
      if (!query) return;
      state.mapQuery = query;
      openSearch(query, action === 'map-directions');
      render();
    }

    if (action === 'map-place') {
      state.mapQuery = button.dataset.query;
      openSearch(state.mapQuery);
      render();
    }

    /* 浏览器收藏 */
    if (action === 'open-link') {
      openExternal(button.dataset.url);
    }

    /* 相机 */
    if (action === 'camera-start') {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('当前浏览器不支持摄像头。');
        return;
      }

      try {
        stopCamera();
        state.cameraStream =
          await navigator.mediaDevices.getUserMedia({
            video: {facingMode: 'environment'},
            audio: false
          });

        const video = $('ios-camera-video');
        if (video) {
          video.srcObject = state.cameraStream;
          await video.play();
        }
        const msg = $('ios-camera-message');
        if (msg) msg.style.display = 'none';
      } catch (_) {
        alert('无法打开相机，请检查浏览器摄像头权限。');
      }
    }

    if (action === 'camera-snap') {
      const video = $('ios-camera-video');
      const canvas = $('ios-camera-canvas');
      if (!video || !canvas || !video.videoWidth) {
        alert('请先开启相机。');
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      const data = canvas.toDataURL('image/png');
      const result = $('ios-camera-result');

      if (result) {
        result.innerHTML = `
          <img src="${data}"
            style="width:100%;border-radius:12px">
          <a href="${data}" download="iphone-photo.png"
            style="display:block;margin:12px 0;color:#007aff">
            保存照片
          </a>`;
      }
    }

    if (action === 'camera-stop') {
      stopCamera();
      render();
    }
  });

  /* Safari 地址栏提交 */
  document.addEventListener('submit', e => {
    if (e.target.id !== 'ios-browser-form') return;
    e.preventDefault();

    const value = getValue('ios-browser-input');
    if (!value) return;

    state.browserQuery = value;
    const url = /^https?:\/\//i.test(value)
      ? value
      : /^[^\s]+\.[^\s]+/.test(value)
        ? 'https://' + value
        : 'https://www.google.com/search?q=' +
          encodeURIComponent(value);

    openExternal(url);
  });

  /* 设置、闹钟及音乐进度 */
  document.addEventListener('change', e => {
    const setting = e.target.dataset.iosSetting;

    if (setting) {
      state.settings[setting] = e.target.checked;
      save();
      if (setting === 'dark') render();
    }

    const alarmIndex = e.target.dataset.iosAlarm;
    if (alarmIndex !== undefined) {
      const alarm = saved.alarms?.[Number(alarmIndex)];
      if (alarm) {
        alarm.enabled = e.target.checked;
        save();
      }
    }

    if (e.target.id === 'ios-music-progress') {
      const audio = getMusicAudio();
      if (audio.duration) {
        audio.currentTime =
          Number(e.target.value) / 100 * audio.duration;
      }
    }
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'ios-brightness') {
      state.settings.brightness = Number(e.target.value);
      const label = $('ios-brightness-value');
      if (label) label.textContent = e.target.value + '%';
      save();
    }
  });

  /* 实时更新秒表、计时器、世界时钟 */
  setInterval(() => {
    if (page !== 'clock') return;

    if (state.clockTab === 'stopwatch') {
      const el = $('ios-stopwatch-display');
      if (el) {
        const ms = state.swElapsed +
          (state.swRunning ? Date.now() - state.swStart : 0);
        const n = Math.max(0, ms);
        el.textContent =
          pad(Math.floor(n / 60000)) + ':' +
          pad(Math.floor(n / 1000) % 60) + '.' +
          pad(Math.floor(n / 10) % 100);
      }
    }

    if (state.clockTab === 'timer' && state.timerRunning) {
      const left = Math.max(
        0, Math.ceil((state.timerEnd - Date.now()) / 1000)
      );
      const el = $('ios-timer-display');
      if (el) {
        el.textContent =
          pad(Math.floor(left / 60)) + ':' + pad(left % 60);
      }
      if (left === 0) {
        state.timerRunning = false;
        state.timerLeft = 0;
        alert('计时结束！');
      }
    }
  }, 100);

  /* 闹钟提醒：页面打开期间有效 */
  let lastAlarmMinute = '';

  setInterval(() => {
    const now = new Date();
    const current = pad(now.getHours()) + ':' + pad(now.getMinutes());
    const minuteKey = localDate(now) + ' ' + current;

    if (minuteKey === lastAlarmMinute) return;
    lastAlarmMinute = minuteKey;

    for (const alarm of saved.alarms || []) {
      if (alarm.enabled && alarm.time === current) {
        alert('⏰ 闹钟响了：' + current);
      }
    }
  }, 1000);

  /* 初次安装后重新渲染当前页面 */
  render();

})();
