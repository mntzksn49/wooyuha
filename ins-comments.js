
(() => {
  const posts = {
    post1: {
      comments: [
        {user: 'jiwooberry', text: '🥰'}
      ]
    },
    post2: {
      comments: [
        {
          user: 'jiwooberry',
          text: '为什么我只看到了一张',
          reply: {
            user: 'haram7',
            text: '现在不是都看到了吗'
          }
        }
      ]
    },
    post4: {
      comments: [
        {
          user: 'jiwooberry',
          text: '这两张放在一起看我真的很像小孩子啊',
          reply: {
            user: 'haram7',
            text: '你本来就是小宝宝'
          }
        }
      ]
    }
  };

  const key = 'wooyuha_ins_likes';
  let likes = {};
  try {
    likes = JSON.parse(localStorage.getItem(key) || '{}');
  } catch (_) {}

  const style = document.createElement('style');
  style.textContent = `
    .ins-extra {
      padding: 12px 15px 5px;
      background: white;
      color: #171717;
    }
    .ins-actions {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .ins-action {
      background: none;
      border: 0;
      padding: 0;
      cursor: pointer;
      font-size: 27px;
      line-height: 1.2;
      color: #171717;
    }
    .ins-action.is-liked {
      color: #ff3040;
    }
    .ins-count {
      font-size: 13px;
      font-weight: 600;
      margin: 9px 0;
    }
    .ins-comments {
      padding: 4px 15px 25px;
      background: white;
      font-size: 13px;
      line-height: 1.6;
    }
    .ins-comment {
      margin: 9px 0;
      overflow-wrap: anywhere;
    }
    .ins-comment b {
      margin-right: 7px;
    }
    .ins-reply {
      margin: 8px 0 0 17px;
      padding-left: 11px;
      border-left: 2px solid #e9e9e9;
    }
  `;
  document.head.appendChild(style);

  function addInstagramExtras() {
    if (page !== 'post') return;

    const id = window.currentPost || 'post1';
    const data = posts[id];
    if (!data) return;

    if (document.querySelector('.ins-extra')) return;

    const anchor =
      document.querySelector('.post-caption') ||
      document.querySelector('.post-photos');

    if (!anchor) return;

    const extra = document.createElement('div');
    extra.className = 'ins-extra';

    extra.innerHTML = `
      <div class="ins-actions">
        <button class="ins-action ${likes[id] ? 'is-liked' : ''}"
          data-ins-like="${id}"
          aria-label="点赞">
          ${likes[id] ? '♥' : '♡'}
        </button>
        <button class="ins-action"
          data-ins-comment="${id}"
          aria-label="查看评论">♧</button>
      </div>
      <div class="ins-count" data-ins-count="${id}">
        ${likes[id] ? 1 : 0} 次赞
      </div>
    `;

    const comments = document.createElement('div');
    comments.className = 'ins-comments';
    comments.id = 'ins-comments-' + id;

    comments.innerHTML = data.comments.map(c => `
      <div class="ins-comment">
        <b>${c.user}</b>${c.text}
        ${c.reply ? `
          <div class="ins-reply">
            <b>${c.reply.user}</b>${c.reply.text}
          </div>
        ` : ''}
      </div>
    `).join('');

    anchor.after(extra);
    extra.after(comments);
  }

  const previousRender = render;

  render = function (...args) {
    const result = previousRender.apply(this, args);
    addInstagramExtras();
    return result;
  };

  document.addEventListener('click', e => {
    const like = e.target.closest('[data-ins-like]');

    if (like) {
      const id = like.dataset.insLike;
      likes[id] = !likes[id];

      localStorage.setItem(key, JSON.stringify(likes));

      like.textContent = likes[id] ? '♥' : '♡';
      like.classList.toggle('is-liked', !!likes[id]);

      const count = document.querySelector(
        `[data-ins-count="${id}"]`
      );

      if (count) {
        count.textContent = (likes[id] ? 1 : 0) + ' 次赞';
      }
      return;
    }

    const comment = e.target.closest('[data-ins-comment]');
    if (comment) {
      document.getElementById(
        'ins-comments-' + comment.dataset.insComment
      )?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  });

  addInstagramExtras();
})();
