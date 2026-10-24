
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

      const checkBottom = () => {
        if (triggered || page !== "conversation") return;

        const remaining =
          chat.scrollHeight - chat.scrollTop - chat.clientHeight;

        if (remaining <= 35) {
          triggered = true;
          setTimeout(() => {
            if (page === "conversation") go("incoming");
          }, 1200);
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
        go("home");
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

    if (destination === "conversation") triggered = false;

    oldGo(destination);

    // 取消原来解锁后12秒自动来电
    if (destination === "home" && incomingTimer) {
      clearTimeout(incomingTimer);
      incomingTimer = null;
    }
  };
})();
