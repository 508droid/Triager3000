chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        hotkey: 'Ctrl+Shift+Y',
        thankDan: true
    }, () => {
        console.log('Default settings saved');
    });
});

if (chrome.commands) {
    chrome.commands.onCommand.addListener((command) => {
        if (command === 'run_script') {
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, (tabs) => {
                if (tabs.length === 0) return;
                chrome.scripting.executeScript({
                    target: {
                        tabId: tabs[0].id
                    },
                    files: ['content.js']
                });
            });
        }
    });
}