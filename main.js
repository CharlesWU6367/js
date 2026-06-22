// ==================== 設定區 ====================
const N8N_WEBHOOK_URL = 'https://residents-victorian-kiss-sponsorship.trycloudflare.com/webhook/event1'; 

// 取得event ID
const currentScript = document.currentScript;
const eventValue = currentScript.dataset.event;
// console.log(eventValue);

let UID = '';
try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlUid = urlParams.get('UID') || urlParams.get('uid');
    if (urlUid) { UID = urlUid; } else { UID = 'Mirafeel_' + Date.now(); }
} catch (e) {
    console.error('解析 URL UID 失敗，使用預設值', e);
    UID = 'Test_Cha_';
}
// ===============================================

function getTaipeiISOString() {
    const now = new Date();
    const taipeiTime = new Date(now.getTime() + 28800000); 
    return taipeiTime.toISOString().replace('Z', '+08:00');
}

const ENTRY_TIME = getTaipeiISOString();

function sendTrackingData(actionText) {
    const payload = {
        "uid": UID,
		"event": eventValue,
        "entry_time": ENTRY_TIME, 
        "actions": [
            {
                "time": getTaipeiISOString(), 
                "action": actionText
            }
        ]
    };

    const dataString = JSON.stringify(payload);

    if (actionText === '離開網頁' || actionText.startsWith('C元件:')) {
        fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: dataString,
            keepalive: true,
            credentials: 'omit'
        }).catch(() => {});
    } else {
        fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: dataString,
            credentials: 'omit'
        }).catch(err => console.error('Tracking Error:', err));
    }
}

// 開啟網頁
document.addEventListener('DOMContentLoaded', () => {
    sendTrackingData('開啟網頁');
});

// 偵測 離開網頁 與 回來網頁
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        sendTrackingData('離開網頁');
    } else if (document.visibilityState === 'visible') {
        sendTrackingData('回來網頁');
    }
});

window.addEventListener('pagehide', () => {
    sendTrackingData('離開網頁');
});

// ------------------------------------------------
// 需求 3：每次點擊（終極精準白名單版）
// ------------------------------------------------
document.addEventListener('click', (event) => {
    const target = event.target.closest('button, a, [data-track]');
    
    if (target) {
        // 1. 解析元件名稱
        let elementIdentifier = '';
        const trackAttr = target.getAttribute('data-track'); // 獨立抓出 data-track 的值
        
        if (trackAttr) {
            elementIdentifier = trackAttr;
        } else if (target.id) {
            elementIdentifier = `#${target.id}`;
        } else if (target.className) {
            const firstClass = target.className.split(' ')[0];
            elementIdentifier = `.${firstClass}`;
        } else {
            const text = target.innerText ? `[${target.innerText.trim().substring(0, 10)}]` : '';
            elementIdentifier = `${target.tagName.toLowerCase()}${text}`;
        }
        
        // 2. 先送出「C元件點擊」資料
        const actionText = `C元件: ${elementIdentifier}`;
        sendTrackingData(actionText);

        // 3. 只有以下這兩個指定的 data-track 需要被攔截罰站！
        if (trackAttr === '前往選購' || trackAttr === '返回首頁') {
            
            // 獲取跳轉網址
            const targetUrl = target.getAttribute('href') || target.getAttribute('data-href');
            
            if (targetUrl) {
                // 沒收立刻跳轉行為
                event.preventDefault(); 
                
                // 顯示「請稍候」遮罩
                const overlay = document.getElementById('loading-overlay');
                if (overlay) overlay.style.display = 'flex';
                
                // 原地罰站 800 毫秒後跳轉
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 800); 
            }
        }
        // 只要不是「前往選購」或「返回首頁」，一律當沒這回事，一般按鈕不會跳遮罩或被卡住！
    }
});

// 隱私權告知浮動框 顯示控制開關
document.getElementById('privacyClose').addEventListener('click', function () {
    document.getElementById('privacyNotice').style.display = 'none';
});