document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['hotkey', 'thankDan', 'queue', 'primaryResource'], (data) => {
        document.getElementById('hotkey').value = data.hotkey;
        document.getElementById('queue').value = data.queue;
        document.getElementById('primaryResource').value = data.primaryResource;
        document.getElementById('thankDan').checked = data.thankDan;
    });

    document.getElementById('save').addEventListener('click', () => {
        const hotkey = document.getElementById('hotkey').value;
        const queue = document.getElementById('queue').value;
        const primaryResource = document.getElementById('primaryResource').value;
        const thankDan = document.getElementById('thankDan').checked;
        chrome.storage.sync.set({
            hotkey,
            primaryResource,
            queue,
            thankDan
        }, () => {
            alert('Settings saved');
        });
    });
});