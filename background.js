"use strict";

let currentState = false;

/**
 * @param {boolean} state
 * @return {Promise}
 */
function setTabState(state) {
    return browser.tabs.query({
        url: 'https://www.youtube.com/watch?v=*'
    })
    .then((tabs) => {
        tabs.forEach((t) => {
            browser.tabs.sendMessage(t.id, {
                tabID: t.id,
                active: t.active,
                state
            })
            .catch((err) => {
                throw err;
            });
        });

        return true;
    })
    .catch((err) => {
        console.error(err);

        return false;
    });
}

async function buttonClick() {
    currentState = !currentState;

    let result = await setTabState(currentState);

    if (result === false) { return; }

    const icon = (currentState === true) ? 'on.png' : 'off.png';

    result = browser.browserAction.setIcon({
        path: {
            48: icon
        }
    })
    .then(() => {
        browser.browserAction.setTitle({
            title: currentState ? 'on' : 'off'
        });
    })
    .catch((err) => {
        console.error(err);
    });
}

browser.browserAction.onClicked.addListener(buttonClick);

browser.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
    if (currentState === true && changeInfo.status === 'complete') {
        setTimeout(() => {
            setTabState(true);
        }, 500);
    }
}, {
    urls: ['*://www.youtube.com/watch?v=*'],
    properties: ['status', 'url']
});

browser.runtime.onMessage.addListener((observer) => {
    console.log(observer);
});
