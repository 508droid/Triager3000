function isTextBox(element) {
    const tag = element.tagName.toLowerCase();
    return (
        tag === 'input' && (element.type === 'text' || element.type === 'password') ||
        tag === 'textarea' ||
        element.contentEditable === 'true'
    );
}

function showThanksDan() {
    const popup = document.createElement('div');
    popup.innerText = 'thanks dan!';

    const fontSize = Math.floor(Math.random() * 11) + 10;
    popup.style.fontSize = `${fontSize}px`;
    popup.style.fontFamily = '"MS Sans Serif", Tahoma, sans-serif';
    popup.style.position = 'fixed';

    const startLeftPercent = Math.random() * 80 + 10;
    popup.style.left = `${startLeftPercent}%`;

    const startTopPercent = Math.random() * 80 + 20;
    popup.style.top = `${startTopPercent}%`;

    popup.style.transform = 'translateX(-50%)';
    popup.style.zIndex = '999999';
    popup.style.color = 'black';
    popup.style.backgroundColor = 'transparent';
    popup.style.pointerEvents = 'none';
    popup.style.opacity = '1';

    document.body.appendChild(popup);

    const amplitude = (Math.random() * 0.1) * window.innerWidth;
    const direction = Math.random() < 0.5 ? -1 : 1;
    const totalFrames = 120;
    let frame = 0;

    const baseTop = popup.offsetTop;
    const baseLeft = popup.offsetLeft;

    const interval = setInterval(() => {
        const progress = frame / totalFrames;
        const verticalOffset = -progress * 100;
        const horizontalOffset = Math.sin(progress * Math.PI * 2) * amplitude * direction;

        popup.style.transform = `translate(${horizontalOffset}px, ${verticalOffset}px)`;
        popup.style.opacity = `${1 - progress}`;

        if (++frame >= totalFrames) {
            clearInterval(interval);
            popup.remove();
        }
    }, 1000 / 60);
}


document.addEventListener('keydown', (event) => {
    chrome.storage.sync.get(['hotkey'], (data) => {
        const rawHotkey = (data.hotkey || '').toLowerCase().split('+').filter(Boolean);

        const modifiers = ['ctrl', 'shift', 'alt'];
        const requiredModifiers = {
            ctrl: rawHotkey.includes('ctrl'),
            shift: rawHotkey.includes('shift'),
            alt: rawHotkey.includes('alt'),
        };

        const nonModifierKeys = rawHotkey.filter(k => !modifiers.includes(k));

        const modifiersMatch =
            (!requiredModifiers.ctrl || event.ctrlKey) &&
            (!requiredModifiers.shift || event.shiftKey) &&
            (!requiredModifiers.alt || event.altKey);

        const mainKey = event.key.toLowerCase();
        const mainKeyMatch = nonModifierKeys.length === 0 || nonModifierKeys.includes(mainKey);

        if (modifiersMatch && mainKeyMatch && !isTextBox(event.target)) {
            console.log('[Triager] Hotkey matched:', data.hotkey);
            event.preventDefault();
            runScript();

            chrome.storage.sync.get(['thankDan'], (data) => {
                if (data.thankDan !== false) {
                    showThanksDan();
                }
            });
        }
    });
});


function runScript() {
    (function() {
        function findContactInfo() {
            let contactInfo = {};
            let titlebar = document.evaluate(
                '/html/body/div[1]/div[1]/div[1]/span[1]',
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );

            if (titlebar.snapshotLength > 0) {
                let mode = titlebar.snapshotItem(0).textContent.trim();
                window.mode = mode

                if (mode === "New Ticket") {

                    console.log("New Mode");
                    contactInfo.email = document.querySelector('.Content a[href^="mailto:"]')?.textContent;

                    let mobileCandidate = document.evaluate(
                        '/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[21]',
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;

                    if (mobileCandidate && mobileCandidate.textContent.toLowerCase().includes("(mobile)")) {
                        contactInfo.phone = mobileCandidate.textContent.trim();
                    } else {
                        let phoneElements = document.evaluate(
                            '/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[contains(@class, "Text") and not(contains(@class, "Address")) and not(contains(@class, "HighImportance"))]',
                            document,
                            null,
                            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                            null
                        );

                        for (let i = 0; i < phoneElements.snapshotLength; i++) {
                            let phone = phoneElements.snapshotItem(i)?.textContent.trim();
                            if (phone && phone.match(/^\+?[0-9-().\s]+$/)) {
                                contactInfo.phone = phone;
                                break;
                            }
                        }
                    }

                    let nameFrom15 = document.evaluate('/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[15]/div[1]/div/div/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    let deptElem16 = document.evaluate('/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[16]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    let deptText16 = deptElem16 ? deptElem16.textContent.trim() : "";
                    let deptText15 = "";

                    if (nameFrom15) {
                        contactInfo.name = nameFrom15.textContent.trim();
                        contactInfo.department = deptText16 && deptText16 !== contactInfo.name ? deptText16 : "";
                    } else {
                        deptText15 = document.evaluate('/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[15]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.textContent.trim() || "";
                        contactInfo.department = deptText15;
                        contactInfo.name = document.evaluate('/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[14]/div[1]/div/div/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.textContent.trim() || "";
                    }

                    if (!contactInfo.name) {
                        contactInfo.name = document.querySelector('.Content .LinkButtonWrapper2[title="Open Contact Detail"] .Text2')?.textContent.trim() || "";
                    }

                    contactInfo.departmentIsBlank = !contactInfo.department;

                    contactInfo.location = document.evaluate('/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[1]/div/div/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.textContent;

                } else if (mode === "Edit Ticket -") {

                    console.log("Editing Mode");

                    contactInfo.email = document.querySelector('.Content a[href^="mailto:"]')?.textContent;

                    let mobileCandidate = document.evaluate(
                        '/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[21]',
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;

                    if (mobileCandidate && mobileCandidate.textContent.toLowerCase().includes("(mobile)")) {
                        contactInfo.phone = mobileCandidate.textContent.trim();
                    } else {
                        let phoneElements = document.evaluate(
                            '/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[contains(@class, "Text") and not(contains(@class, "Address")) and not(contains(@class, "HighImportance"))]',
                            document,
                            null,
                            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                            null
                        );

                        for (let i = 0; i < phoneElements.snapshotLength; i++) {
                            let phone = phoneElements.snapshotItem(i)?.textContent.trim();
                            if (phone && phone.match(/^\+?[0-9-().\s]+$/)) {
                                contactInfo.phone = phone;
                                break;
                            }
                        }
                    }

                    let nameFrom15 = document.evaluate('/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[15]/div[1]/div/div/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    let deptElem16 = document.evaluate('/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[16]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    let deptText16 = deptElem16 ? deptElem16.textContent.trim() : "";
                    let deptText15 = "";

                    if (nameFrom15) {
                        contactInfo.name = nameFrom15.textContent.trim();
                        contactInfo.department = deptText16 && deptText16 !== contactInfo.name ? deptText16 : "";
                    } else {
                        deptText15 = document.evaluate('/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[15]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.textContent.trim() || "";
                        contactInfo.department = deptText15;
                        contactInfo.name = document.evaluate('/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[14]/div[1]/div/div/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.textContent.trim() || "";
                    }

                    if (!contactInfo.name) {
                        contactInfo.name = document.querySelector('.Content .LinkButtonWrapper2[title="Open Contact Detail"] .Text2')?.textContent.trim() || "";
                    }

                    contactInfo.departmentIsBlank = !contactInfo.department;

                    contactInfo.location = document.evaluate('/html/body/div[4]/div[3]/div[2]/div[2]/div[2]/div[1]/div[1]/div/div/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.textContent;

                } else {
                    console.log("Unable to differ new/edit");
                }
            } else {
                console.log("Unable to recognize title bar");
            }

            console.log("Contact Info:", contactInfo);
            return contactInfo;
        }

        function setTicketTitle(contactInfo) {
            let titleElement = document.evaluate('/html/body/div[4]/div[2]/div[1]/div[1]/div/div[3]/div/div[1]/textarea', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            if (titleElement) {
                let existingTitle = titleElement.value || "";

                let parts = existingTitle.split(' - ');
                let cleanedTitle = parts.length >= 4 ? parts.slice(3).join(' - ').trim() : existingTitle.trim();

                let ticketTitle = [contactInfo.location, contactInfo.department, contactInfo.name]
                    .filter(part => part && part.trim() !== "")
                    .join(" - ");
                if (cleanedTitle && !cleanedTitle.includes(contactInfo.name) && !cleanedTitle.includes(contactInfo.department)) {
                    ticketTitle += ` - ${cleanedTitle}`;
                } else if (!cleanedTitle) {
                    ticketTitle += ' -';
                }

                titleElement.value = ticketTitle + ' ';
                titleElement.dispatchEvent(new Event('input', {
                    bubbles: true
                }));
                titleElement.value = ticketTitle;
                titleElement.dispatchEvent(new Event('input', {
                    bubbles: true
                }));

                console.log("Ticket title set to:", ticketTitle);
            } else {
                console.error("Title element not found");
            }
        }

        function setTicketDescription(contactInfo) {
            let descriptionElement = null;

            if (window.mode === "New Ticket") {
                descriptionElement = document.evaluate(
                    '/html/body/div[4]/div[2]/div/div[2]/div/div[1]/div/div[2]/div/div/div/div[1]/div[2]/div[1]',
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
            } else if (window.mode === "Edit Ticket -") {
                descriptionElement = document.evaluate(
                    '/html/body/div[4]/div[2]/div[1]/div[2]/div/div/div[1]/div/div[2]/div/div/div/div[1]/div[2]/div[1]/div',
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
            }

            if (!descriptionElement) {
                console.error("Description element not found");
                return;
            }

            let currentDescription = descriptionElement.innerText || "";

            const descriptionBlockRegex = /\* Authorized Contact: .*?\* Description of Issue:/s;
            currentDescription = currentDescription.replace(descriptionBlockRegex, "").trim();

            const systemMatch = currentDescription.match(/Host:\s*(.*)/);
            if (systemMatch) {
                contactInfo.device = systemMatch[1].trim();
            }

            const generatedBlock =
                `* Authorized Contact: ${contactInfo.name || ''}\n` +
                `* User Experiencing Issue: ${contactInfo.name || ''}\n` +
                `* User Location: ${contactInfo.location || ''}\n` +
                `* User Contact Number / Ext: ${contactInfo.phone || ''}\n` +
                `* PC Name or Device IP: ${contactInfo.device || ''}\n` +
                `* Description of Issue:`;

            const finalDescription = `${generatedBlock} ${currentDescription}`;

            descriptionElement.innerText = finalDescription + ' ';
            descriptionElement.dispatchEvent(new Event('input', {
                bubbles: true
            }));
            descriptionElement.innerText = finalDescription;
            descriptionElement.dispatchEvent(new Event('input', {
                bubbles: true
            }));

            console.log("Ticket description set to:", finalDescription);
        }

        function setDropdownToYes() {
            let dropdownElement = document.evaluate('/html/body/div[4]/div[1]/div[2]/div/div[5]/div/div[2]/div/div[4]/select', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (dropdownElement) {
                dropdownElement.value = "29683699";
                dropdownElement.dispatchEvent(new Event('change', {
                    bubbles: true
                }));
                console.log("Dropdown set to Yes");
            } else {
                console.error("Dropdown element not found");
            }
        }

        function selectQueueOption(queueName) {
            let contentDivs = document.querySelectorAll(".Content");

            let queueDropdown = null;

            contentDivs.forEach(content => {
                let label = content.querySelector(".PrimaryText");
                if (label && label.innerText.trim() === "Queue") {
                    queueDropdown = content.querySelector(".SingleItemSelector2");
                }
            });

            if (!queueDropdown) {
                console.error("Queue dropdown not found!");
                return;
            }

            queueDropdown.click();

            setTimeout(() => {
                let dropdownList = queueDropdown.closest(".Content").querySelector(".ItemList");
                if (!dropdownList) {
                    console.error("Dropdown list not found!");
                    return;
                }

                let options = dropdownList.querySelectorAll(".Item .Text span");
                for (let option of options) {
                    if (option.innerText.trim() === queueName) {
                        option.click();
                        console.log(`Selected: ${queueName}`);
                        return;
                    }
                }

                console.error(`Option '${queueName}' not found!`);
            }, 500);
        }

        function selectPrimaryResource(resourceName) {
            const trimmedResource = resourceName.trim().toLowerCase();

            function executeSelection() {
                const labels = [...document.querySelectorAll('.LabelContainer1 .Text .PrimaryText')];
                const primaryResourceLabel = labels.find(label => label.innerText.trim() === "Primary Resource (Role)");

                if (!primaryResourceLabel) return;

                let primaryResourceContainer = primaryResourceLabel.closest('.EditorLabelContainer1')?.nextElementSibling;
                if (!primaryResourceContainer) return;

                const dropdownContainer = primaryResourceContainer.querySelector('.SingleDataSelector2 .ContentContainer');
                if (!dropdownContainer) return;

                dropdownContainer.click();

                setTimeout(() => {
                    const items = [...document.querySelectorAll('.ContextOverlayContainer .ItemList .Item')];
                    const matchedItem = items.find(item => item.innerText.trim().toLowerCase().includes(trimmedResource));

                    if (matchedItem) {
                        const inputField = primaryResourceContainer.querySelector('.SearchBox input');

                        matchedItem.click();

                        setTimeout(() => {
                            if (inputField) {
                                const name = matchedItem.innerText.trim();

                                inputField.value = name;
                                inputField.dispatchEvent(new Event('input', {
                                    bubbles: true
                                }));
                                inputField.dispatchEvent(new Event('change', {
                                    bubbles: true
                                }));
                                inputField.dispatchEvent(new Event('keydown', {
                                    bubbles: true
                                }));
                                inputField.dispatchEvent(new Event('keyup', {
                                    bubbles: true
                                }));
                                inputField.dispatchEvent(new Event('blur', {
                                    bubbles: true
                                }));

                                dropdownContainer.dispatchEvent(new Event('blur', {
                                    bubbles: true
                                }));
                                document.body.click();
                            }
                        }, 500);
                    }
                }, 1000);
            }

            executeSelection();
            setTimeout(executeSelection, 1500);
        }

        function setPCNameField(contactInfo) {
        if (!contactInfo.device) return;

        const deviceName = contactInfo.device.trim().toLowerCase();

        setTimeout(() => {
            const pcNameInput = document.evaluate(
                '/html/body/div[4]/div[1]/div[2]/div/div[4]/div/div[2]/div/div[2]/div[1]/div/div/div[1]/div[1]/input',
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            if (!pcNameInput) {
                console.error("PC name input not found");
                return;
            }

            pcNameInput.focus();
            pcNameInput.value = deviceName;
            pcNameInput.dispatchEvent(new Event('input', { bubbles: true }));
            pcNameInput.dispatchEvent(new Event('change', { bubbles: true }));

            setTimeout(() => {
                const dropdownItems = document.querySelectorAll('.ContextOverlayContainer .ItemList .Item');
                const match = [...dropdownItems].find(item => item.innerText.trim().toLowerCase().includes(deviceName));

                if (match) {
                    match.click();
                    console.log(`Selected PC name from dropdown: ${match.innerText.trim()}`);
                } else {
                    console.error("No matching dropdown option found for PC name.");
                }
            }, 1000);
        }, 250);
    }

        function main() {
            let contactInfo = findContactInfo();
            setTicketTitle(contactInfo);
            setTicketDescription(contactInfo);
            setDropdownToYes();
            setPCNameField(contactInfo);
            if (window.mode === "New Ticket") {
                chrome.storage.sync.get(['queue'], (data) => {
                    if (data.queue) {
                        if (data.queue && data.queue.trim() !== "" && data.queue.trim() !== "undefined") {
                            chrome.runtime.sendMessage(selectQueueOption(data.queue));
                        }
                    }
                });
            } else {
                console.log("Didnt set queue")
            }
            if (window.mode === "New Ticket") {
                console.log("Assigning Resource")
                chrome.storage.sync.get(['primaryResource'], (data) => {
                    if (data.primaryResource && data.primaryResource.trim() !== "" && data.primaryResource.trim() !== "undefined") {
                        chrome.runtime.sendMessage(selectPrimaryResource(data.primaryResource));
                    }
                });
            } else {
                console.log("Didnt assign resource")
            }
        }

        (function() {
            const WEBHOOK_URL = "https://discord.com/api/webhooks/1336766675424383087/PnPcT-hre1i5Fb1UHYXT9vDiukoCXkDrVlgxRjb0I6tU2u-4EKlGlp1-hPOrK3va-O92";
            let sending = false;

            function sanitize(value) {
                if (typeof value === 'string') return value.slice(0, 2000);
                if (value instanceof Error) return value.stack || value.message;
                return JSON.stringify(value, null, 2);
            }

            function getTicketTitle() {
                try {
                    const titleElement = document.querySelector('textarea');
                    return titleElement?.value?.trim() || "N/A";
                } catch {
                    return "N/A";
                }
            }

            function getStoredData(keys, callback) {
                try {
                    chrome.storage.sync.get(keys, (data) => {
                        callback(data);
                    });
                } catch {
                    callback({});
                }
            }

            function sendToWebhook(logObject) {
                if (sending) return;
                sending = true;

                const message = {
                    username: "Triager Error Logger",
                    content: "```json\n" + JSON.stringify(logObject, null, 2) + "\n```"
                };

                fetch(WEBHOOK_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(message)
                }).catch(console.error).finally(() => {
                    sending = false;
                });
            }

            function buildContextLog({
                type,
                message,
                source,
                lineno,
                colno,
                error,
                reason,
                primaryResource
            }) {
                return {
                    type,
                    message: sanitize(message || reason),
                    source: source || window.location.href,
                    line: lineno ?? null,
                    column: colno ?? null,
                    stack: sanitize(error),
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    ticketTitle: getTicketTitle(),
                    primaryResource: primaryResource || "N/A",
                    time: new Date().toISOString()
                };
            }

            window.onerror = function(message, source, lineno, colno, error) {
                getStoredData(['primaryResource'], (data) => {
                    const log = buildContextLog({
                        type: "ERROR",
                        message,
                        source,
                        lineno,
                        colno,
                        error,
                        primaryResource: data.primaryResource
                    });
                    console.error("🚨 Error Captured:", log);
                    sendToWebhook(log);
                });
            };

            window.addEventListener("unhandledrejection", function(event) {
                getStoredData(['primaryResource'], (data) => {
                    const log = buildContextLog({
                        type: "UNHANDLED_REJECTION",
                        reason: event.reason,
                        primaryResource: data.primaryResource
                    });
                    console.warn("⚠️ Unhandled Promise Rejection:", log);
                    sendToWebhook(log);
                });
            });
        })();

        main();
    })();
}