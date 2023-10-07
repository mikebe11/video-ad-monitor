"use strict";

let observer = null;

/**
 * @param {Object} mutationList
 */
function observerCallback(mutationList) {
    for (const mutation of mutationList) {
        if (mutation.target.tagName === 'DIV' && mutation.target.className.includes('video-ads')) {
            if (mutation.target.innerHTML.includes('ytp-ad-preview-container')) {
                const videos = document.getElementsByTagName('video');

                for (let i = 0; i < videos.length; i++) {
                    if (videos[i].attributes.getNamedItem('src') !== null && videos[i].volume > 0) {
                        console.log('dropping volume and reducing opacity');

                        videos[i].volume = 0;

                        const vidContainer = document.getElementById('movie_player');

                        vidContainer.style.opacity = 0.05;

                        break;
                    }
                }
            }

            if (mutation.target.innerHTML.includes('ytp-ad-skip-button-container')) {
                const skipNow = document.getElementsByClassName('ytp-ad-skip-button-container');

                if (skipNow.length > 0) {
                    console.log('skipping');

                    skipNow[0].click();
                }
            }

            if (mutation.target.innerHTML.includes('ytp-ad-overlay-close-container')) {
                const closeButtonContainer = document.getElementsByClassName('ytp-ad-overlay-close-container');

                for (let i = 0; i < closeButtonContainer.length; i++) {
                    console.log('closing');

                    closeButtonContainer[i].click();
                }
            }

            if (mutation.target.childElementCount === 0) {
                console.log('restoring opacity');

                const vidContainer = document.getElementById('movie_player');

                vidContainer.style.opacity = 1;
            }
        }
    }
}

function startObserver() {
    const component = document.getElementById('movie_player');

    if (component === null) {
        console.error("didn't find the movie player");
    } else {
        console.log('starting');

        observer = new MutationObserver(observerCallback);

        observer.observe(component, { attributes: true, childList: true, subtree: true });

        const popup = document.getElementsByTagName('ytd-popup-container');

        if (popup.length === 1) {
            popup[0].style.display = 'none';
        }
    }
}

browser.runtime.onMessage.addListener((request) => {
    if (request.state) {
        if (observer === null) {
            startObserver();

            browser.runtime.sendMessage({m:'starting observer', tid:request.tabID});
        }
    } else if (observer !== null) {
        console.log('stopping');

        observer.disconnect();

        observer = null;

        const popup = document.getElementsByTagName('ytd-popup-container');

        if (popup.length === 1) {
            popup[0].style.display = null;
        }

        browser.runtime.sendMessage({m:'disconnecting observer', tid:request.tabID});
    }

    return true;
});
