"use strict";

let observer = null;
let skipNowObserver = null;

/**
 * @param {Object} mutationList
 */
function observerCallback(mutationList) {
    for (const mutation of mutationList) {
        if (mutation.target.tagName === 'DIV' && mutation.target.className.includes('video-ads')) {
            if (
                mutation.target.innerHTML.includes('ytp-ad-player-overlay-layout') ||
                mutation.target.innerHTML.includes('ytp-ad-preview-container')
            ) {
                const videos = document.getElementsByTagName('video');

                for (let i = 0; i < videos.length; i++) {
                    if (videos[i].attributes.getNamedItem('src') !== null && videos[i].volume > 0) {
                        console.debug('dropping volume, reducing blur and opacity');

                        videos[i].volume = 0;

                        const vidContainer = document.getElementById('movie_player');

                        vidContainer.style.opacity = 0;

                        break;
                    }
                }
            }

            // Original element. Might not apply anymore.
            if (mutation.target.innerHTML.includes('ytp-ad-skip-button-container')) {
                const skipNowOld = document.getElementsByClassName('ytp-ad-skip-button-container');

                if (skipNowOld.length > 0) {
                    console.debug('skipping');

                    skipNowOld[0].click();
                }
            }


            if (mutation.target.innerHTML.includes('ytp-skip-ad-button')) {
                const skipNow = document.getElementsByClassName('ytp-skip-ad-button');

                if (skipNow.length > 0) {
                    if (skipNow[0].style.display === "none") {
                        if (skipNowObserver === null) {
                            skipNowObserver = new MutationObserver(skipNowObserverCallback);
                        }

                        skipNowObserver.observe(skipNow[0], { attributes: true, childList: false, subtree: false, attributeFilter: ['style'] });
                    }

                    if (skipNow[0].style.display !== "none") {
                        console.debug('skipping');

                        if (skipNowObserver !== null) {
                            skipNowObserver = null;
                        }

                        skipNow[0].click();
                    }
                }
            }

            if (mutation.target.innerHTML.includes('ytp-ad-overlay-close-container')) {
                const closeButtonContainer = document.getElementsByClassName('ytp-ad-overlay-close-container');

                for (let i = 0; i < closeButtonContainer.length; i++) {
                    console.debug('closing');

                    closeButtonContainer[i].click();
                }
            }

            if (mutation.target.childElementCount === 0) {
                console.debug('restoring blur and opacity');

                const vidContainer = document.getElementById('movie_player');

                vidContainer.style.removeProperty('filter');
                vidContainer.style.opacity = 1;
            }
        }
    }
}

/**
 * @param {Object} mutationList
 */
function skipNowObserverCallback(mutationList) {
    for (const mutation of mutationList) {
        if (mutation.target.tagName === 'BUTTON' && mutation.target.className.includes('ytp-skip-ad-button')) {

            const skipNow = document.getElementsByClassName('ytp-skip-ad-button');

            if (skipNow.length > 0 && skipNow[0].style.display !== "none") {
                const vidContainer = document.getElementById('movie_player');

                vidContainer.style.opacity = 1;
                vidContainer.style.filter = 'blur(10px) sepia(1)';

                if (skipNowObserver !== null) {
                    skipNowObserver.disconnect();
                }
            }
        }
    }
}

function startObserver() {
    const component = document.getElementById('movie_player');

    if (component === null) {
        console.debug("didn't find the movie player");
    } else {
        console.debug('starting');

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
        console.debug('stopping');

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
