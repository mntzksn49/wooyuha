
/* KT 聊天界面修复：保留原有聊天内容与其他应用 */
(function () {
  const css = `
    .chat-thread {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      background: #aec3d3;
      padding: 14px 12px 30px;
      -webkit-overflow-scrolling: touch;
    }

    .chat-day {
      display: flex;
      justify-content: center;
      margin: 16px 0 22px;
    }

    .chat-day span {
      background: #93aabb;
      color: white;
      border-radius: 20px;
      padding: 5px 13px;
      font-size: 12px;
    }

    .msg-row {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      margin: 9px 0;
    }

    .msg-row.mine {
      justify-content: flex-end;
    }

    .msg-avatar {
      width: 36px;
      height: 36px;
      border-radius: 13px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .msg-main {
      display: flex;
      flex-direction: column;
      max-width: 78%;
      min-width: 0;
    }

    .msg-sender {
      font-size: 12px;
      margin: 0 0 4px 2px;
      color: #48535d;
    }

    .msg-bubble {
      background: #fff;
      color: #202020;
      padding: 10px 12px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.55;
      overflow-wrap: anywhere;
      width: fit-content;
      max-width: 100%;
    }

    .mine .msg-bubble {
      background: #ffeb3b;
      align-self: flex-end;
    }

    .photo-msg {
      padding: 0;
      background: transparent;
      overflow: hidden;
    }

    .chat-inline-photo {
      border: 0;
      padding: 0;
      background: none;
      cursor: pointer;
      display: block;
    }

    .chat-inline-photo img {
      display: block;
      max-width: 190px;
      max-height: 260px;
      border-radius: 12px;
      object-fit: cover;
    }

    .chat-call {
      display: flex;
      justify-content: center;
      margin: 24px 0;
    }

    .chat-call button,
    .chat-call-top {
      cursor: pointer;
    }
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();

/* 聊天翻到底部自动来电 + 接听播放音频 */
(function () {
  const oldRender = render;
  let triggered = false;
  let audio = null;

  render = function () {
    oldRender();

    if (page === "conversation") {
      const chat = document.querySelector(".chat-screens");
      if (!chat || triggered) return;

      let callTimer = null;

const checkBottom = () => {
  if (triggered || page !== "conversation") return;

  const remaining =
    chat.scrollHeight - chat.scrollTop - chat.clientHeight;

  // 必须真正到达聊天记录底部
  if (remaining <= 5) {
    if (callTimer) return;

    callTimer = setTimeout(() => {
      callTimer = null;

      if (triggered || page !== "conversation") return;

      const distance =
        chat.scrollHeight - chat.scrollTop - chat.clientHeight;

      if (distance <= 5) {
        triggered = true;
        go("incoming");
      }
    }, 4000);
  } else {
    // 离开底部就取消倒计时
    clearTimeout(callTimer);
    callTimer = null;
  }
};

chat.addEventListener("scroll", checkBottom);
    }

    if (page === "playing") {
      const notice = document.querySelector(".call-missing");
      if (notice) notice.remove();

      audio = new Audio("10月24日.mp3");
      audio.preload = "auto";

      audio.addEventListener("ended", () => {
  audio = null;
  triggered = true;
  go("conversation");

  setTimeout(() => {
    const chat = document.querySelector(".chat-screens");
    if (chat) chat.scrollTop = chat.scrollHeight;
  }, 100);
});


      audio.play().catch(() => {
        const caller = document.querySelector(".caller");
        if (caller) {
          caller.insertAdjacentHTML(
            "beforeend",
            '<button id="play-call-audio">▶ 播放通话录音</button>'
          );
          document.getElementById("play-call-audio").onclick =
            () => audio.play();
        }
      });
    }
  };

  const oldGo = go;
  go = function (destination) {
    if (audio && page === "playing" && destination !== "playing") {
  audio.pause();
  audio = null;
}

    

    oldGo(destination);

    // 取消原来解锁后12秒自动来电
    if (destination === "home" && incomingTimer) {
      clearTimeout(incomingTimer);
      incomingTimer = null;
    }
  };
})();

/* 将五张 KKT 截图还原为真实聊天消息 */
(function () {
  const days = [
    {
      date: "2026年09月24日 星期四",
      messages: [
        ["L","刚刚跟朋友逛完街回酒店"],
        ["L","姐姐在干什么？"],
        ["R","刚刚下班到家ㅠㅠ"],
        ["R","累...."],
        ["L","辛苦姐姐了"],
        ["L","我很快就回去"],
        ["L","回去抱抱给姐姐充电好吗"],
        ["R","嗯..."],
        ["R","发张自拍过来"],
        ["L","诶？这么突然"],
        ["R","因为想你了"],
        ["L","😳"],
        ["L","@photo1"],
        ["R","可爱呢"],
        ["R","染了红发更像草莓"],
        ["R","想啃"],
        ["L","姐姐的照片呢？"],
        ["L","我也想看看你"],
        ["R","@photo2"],
        ["L","姐姐..."],
        ["R","怎么了？"],
        ["L","是故意的吗"],
        ["L","见不到的时候就发这种照片给我"],
        ["R","才没有"],
        ["R","只是普通的自拍而已呀"],
        ["L","才不普通呢"],
        ["L","现在可以打视频吗？"],
        ["R","嗯 稍微等我一下哦"],
        ["R","📹 02:00:11"]
      ]
    },
    {
      date: "2026年09月29日 星期二",
      messages: [
        ["L","姐姐有什么想吃的吗？我下课了带回去"],
        ["R","你"],
        ["L","嗯？"],
        ["R","想吃你"],
        ["L","..."],
        ["L","不要逗我了"],
        ["L","昨天晚上不是刚做过吗"],
        ["R","ㅋㅋㅋ"],
        ["R","那给我带杯草莓拿铁吧"],
        ["R","还想吃提拉米苏"],
        ["L","好～"],
        ["L","乖乖在家等我吧"]
      ]
    },
    {
      date: "2026年10月04日 星期日",
      messages: [
        ["R","公司安排有事要出差几天"],
        ["R","不用送我啦"],
        ["R","我跟同事一起去机场"],
        ["R","你专心忙论文吧"],
        ["L","啊...好吧"],
        ["L","那回来的时候我去接姐姐"],
        ["R","好"]
      ]
    },
    {
      date: "2026年10月09日 星期五",
      messages: [
        ["R","怎么了不开心吗?"],
        ["L","没有"],
        ["R","那为什么见到我的时候都没笑"],
        ["L","姐姐跟那个同事关系很好吗?"],
        ["R","嗯?"],
        ["R","是同年入职的所以比较熟悉，关系是不错的"],
        ["R","怎么了"],
        ["L","我看到你们两个抱了一下"],
        ["R","...你是小猪吗"],
        ["R","原来在吃醋啊"],
        ["R","是因为她说忙完这个项目打算离职了 要去别的地方发展 所以就拥抱了一下"],
        ["R","只是单纯地拥抱了一下呀 别的什么也没做"],
        ["L","哦......"],
        ["R","崔志宇原来还会吃醋吗?"],
        ["R","好可爱"],
        ["R","这种时候才会感觉出来你比我小哦"],
        ["R","平常像老干部一样正经的很"],
        ["L","那是因为"],
        ["L","刚认识姐姐的时候"],
        ["L","你说你的理想型是稳定可靠的人"],
        ["L","担心我作为年下会让你觉得幼稚"],
        ["L","才这样的"],
        ["R","没有在说你无趣的意思"],
        ["R","现在这样就很好 很可爱"],
        ["R","我很喜欢"],
        ["R","不要不开心了"],
        ["R","回去以后给你亲亲"],
        ["L","不够"],
        ["R","那还想要什么?"],
        ["L","想做..."],
        ["L","出差一个星期没见到姐姐了"],
        ["R","不是一直都有在打视频吗"],
        ["L","那不一样"],
        ["L","我碰不到你"],
        ["R","好吧"],
        ["R","小色鬼"]
      ]
    },
    {
      date: "2026年10月24日 星期六",
      messages: [
        ["R","在哪里?"],
        ["R","为什么还没回来"],
        ["R","已经很晚了"],
        ["R","📞 未接来电"],
        ["R","消息也不读"],
        ["R","📞 未接来电"],
        ["R","崔志宇"],
        ["L","啊对不起姐姐"],
        ["L","昨天晚上跟朋友出去吃饭 喝酒喝太多了"],
        ["L","直接就在她家里睡下了"],
        ["L","早上起来手机也没电了"],
        ["L","现在才充电开机"],
        ["L","对不起对不起"],
        ["L","忘记给你发信息让你着急了真的对不起"],
        ["L","我现在就回家"],
        ["L","姐姐你理理我"],
        ["L","我在路上了 很快到家"],
        ["R","我们是不是约定好如果晚上不回家要跟对方发信息说清楚"],
        ["R","我等了你一晚上"],
        ["R","最后还是跟你朋友发了信息才知道你在哪里在干什么"],
        ["L","我真的睡晕过去之前本来要给姐姐发信息的 但是没发出去"],
        ["L","对不起让你担心我了"],
        ["L","下次肯定不会这样了"],
        ["L","姐姐现在在家里吗"],
        ["L","我到楼下了"],
        ["R","不在家"],
        ["L","那在哪里?"],
        ["L","现在可以接电话吗"],
        ["L","📞 未接来电"],
        ["L","📞 未接来电"],
        ["L","啊接电话吧好不好"],
        ["L","姐姐现在生气不想见我 电话也不愿意接吗"]
      ]
    }
  ];

  const safe = text => String(text).replace(
    /[&<>"']/g,
    c => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[c])
  );

  const css = document.createElement("style");
  css.textContent = `
    .chat-screens {
      display: block !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      background: #aec3d3 !important;
      padding: 12px 10px 30px !important;
      min-height: 0;
      flex: 1;
      overscroll-behavior: contain;
    }
    .chat-screens .real-day {
      text-align: center;
      margin: 18px 0 24px;
    }
    .chat-screens .real-day span {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 30px;
      background: #91a7b8;
      color: white;
      font-size: 11px;
    }
    .chat-screens .real-row {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      margin: 9px 0;
    }
    .chat-screens .real-row.mine {
      justify-content: flex-end;
    }
    .chat-screens .real-avatar {
      width: 34px;
      height: 34px;
      border-radius: 13px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .chat-screens .real-body {
      max-width: 79%;
      min-width: 0;
    }
    .chat-screens .real-name {
      color: #495765;
      font-size: 11px;
      margin: 0 0 4px 2px;
    }
    .chat-screens .real-bubble {
      width: fit-content;
      max-width: 100%;
      background: white;
      padding: 9px 12px;
      border-radius: 13px;
      font-size: 14px;
      line-height: 1.55;
      color: #242424;
      overflow-wrap: anywhere;
      white-space: normal;
    }
    .chat-screens .mine .real-bubble {
      background: #ffe934;
      margin-left: auto;
    }
    .chat-screens .real-photo {
      display: block;
      max-width: 190px;
      max-height: 270px;
      width: auto;
      height: auto;
      object-fit: cover;
      border-radius: 12px;
      cursor: pointer;
    }
    .chat-screens .real-photo-wrap {
      padding: 0;
      background: transparent !important;
      overflow: hidden;
    }
    .chat-screens .real-call-record {
      opacity: .85;
    }
    .chat-screens .chat-call {
      display: none !important;
    }
  `;
  document.head.appendChild(css);

  function buildConversation() {
    const container = document.querySelector(".chat-screens");
    if (!container || page !== "conversation") return;

    container.innerHTML = days.map(day => {
      const date = `<div class="real-day"><span>▦ ${day.date}</span></div>`;

      const messages = day.messages.map(([side, content]) => {
        const mine = side === "R";
        const isPhoto = content.startsWith("@photo");
        const photoFile = content === "@photo1"
          ? "chat-photo-1.jpg"
          : "chat-photo-2.jpg";

        const bubble = isPhoto
          ? `<img class="real-photo"
               src="${photoFile}"
               alt="聊天照片"
               data-real-photo="${photoFile}">`
          : safe(content);

        return `
          <div class="real-row ${mine ? "mine" : ""}">
            ${mine ? "" : `
              <img class="real-avatar" src="chat_avatar.jpg" alt="">
            `}
            <div class="real-body">
              ${mine ? "" : '<div class="real-name">啾💕</div>'}
              <div class="real-bubble ${isPhoto ? "real-photo-wrap" : ""} ${content.includes("未接来电") ? "real-call-record" : ""}">${bubble}</div>
            </div>
          </div>
        `;
      }).join("");

      return date + messages;
    }).join("");

    

    container.addEventListener("click", e => {
      const photo = e.target.closest("[data-real-photo]");
      if (!photo) return;

      e.stopPropagation();
      const lightbox = document.getElementById("lightbox");
      const zoom = document.getElementById("zoomImg");

      if (lightbox && zoom) {
        zoom.src = photo.dataset.realPhoto;
        lightbox.classList.remove("hidden");
      }
    });
  }

  const previousRender = render;

render = function () {
  previousRender();

  if (page === "conversation") {
    buildConversation();
    requestAnimationFrame(() => {
      const chat = document.querySelector(".chat-screens");
      if (chat) chat.scrollTop = 0;
    });
  }
};
})();
/* 修复 KKT 聊天气泡尺寸 */
(function () {
  const style = document.createElement("style");
  style.textContent = `
    .chat-screens .real-row {
      margin: 5px 0 !important;
      gap: 7px !important;
      align-items: flex-start !important;
    }

    .chat-screens .real-body {
      max-width: 78% !important;
      width: auto !important;
      min-width: 0 !important;
      flex: 0 1 auto !important;
    }

    .chat-screens .real-bubble {
      display: block !important;
      width: fit-content !important;
      height: auto !important;
      min-height: 0 !important;
      padding: 8px 11px !important;
      margin: 0 !important;
      border-radius: 13px !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
      text-align: left !important;
      box-sizing: border-box !important;
    }

    .chat-screens .real-row.mine .real-body {
      margin-left: auto !important;
    }

    .chat-screens .real-row.mine .real-bubble {
      margin-left: auto !important;
      background: #ffe934 !important;
    }

    .chat-screens .real-name {
      margin-bottom: 3px !important;
      font-size: 11px !important;
    }

    .chat-screens .real-avatar {
      width: 34px !important;
      height: 34px !important;
    }
  `;
  document.head.appendChild(style);
})();
