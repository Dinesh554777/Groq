document.addEventListener("DOMContentLoaded", () => {
    // UI Selectors
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const chatForm = document.getElementById("chat-form");
    const chatHistory = document.getElementById("chat-history");
    const messagesList = document.getElementById("messages-list");
    const welcomeContainer = document.getElementById("welcome-container");
    const typingIndicator = document.getElementById("typing-indicator");
    const errorBanner = document.getElementById("error-banner");
    const errorMessage = document.getElementById("error-message");
    const closeErrorBtn = document.getElementById("close-error-btn");
    const newChatBtn = document.getElementById("new-chat-btn");
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const historyList = document.getElementById("history-list");
    const suggestionChips = document.querySelectorAll(".suggestion-chip");

    // Initialize: load persisted server history
    loadSessionHistory();

    // ----------------------------------------------------
    // EVENT LISTENERS
    // ----------------------------------------------------

    // Close error banner on demand
    closeErrorBtn.addEventListener("click", hideErrorAlert);

    // New Session button - resets UI state to clean board
    newChatBtn.addEventListener("click", triggerNewSession);

    // Sidebar Mobile Toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }

    // Dynamic Textarea Auto-Height
    userInput.addEventListener("input", () => {
        userInput.style.height = "auto";
        userInput.style.height = `${userInput.scrollHeight}px`;
        
        // Disable button if input is whitespace only
        sendBtn.disabled = userInput.value.trim() === "";
    });

    // Populate input from welcome chips
    suggestionChips.forEach(chip => {
        chip.addEventListener("click", () => {
            const query = chip.getAttribute("data-text");
            if (query) {
                userInput.value = query;
                userInput.dispatchEvent(new Event("input"));
                userInput.focus();
            }
        });
    });

    // Handle form transmission
    chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        const messageText = userInput.value.trim();
        if (!messageText) return;

        // Reset input fields immediately
        userInput.value = "";
        userInput.style.height = "auto";
        sendBtn.disabled = true;

        // Render message instantly in UI log
        displayMessage(messageText, "user");
        hideWelcomePanel();
        
        // Activate loader typing states
        showLoader();
        scrollToHistoryBottom();

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: messageText })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Server returned error status ${response.status}`);
            }

            // Render AI Response
            displayMessage(data.response, "assistant");
            
            // Reload sidebar history to include this conversation
            loadSessionHistory(false);

        } catch (error) {
            showErrorAlert(error.message);
        } finally {
            hideLoader();
            scrollToHistoryBottom();
        }
    });

    // ----------------------------------------------------
    // CORE LOGIC & ACTIONS
    // ----------------------------------------------------

    function displayMessage(text, sender) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `message ${sender}`;

        const labelDiv = document.createElement("div");
        labelDiv.className = "message-label";
        labelDiv.textContent = sender === "user" ? "You" : "Llama 4 Scout";

        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";
        contentDiv.innerHTML = formatRichText(text);

        msgDiv.appendChild(labelDiv);
        msgDiv.appendChild(contentDiv);
        messagesList.appendChild(msgDiv);
        
        scrollToHistoryBottom();
    }

    function formatRichText(text) {
        if (!text) return "";

        // Escape dangerous HTML entities
        let parsed = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Format code blocks ```language ... ```
        parsed = parsed.replace(/```([\s\S]+?)```/g, (match, block) => {
            return `<pre><code>${block.trim()}</code></pre>`;
        });

        // Format inline variables `var`
        parsed = parsed.replace(/`([^`\n]+?)`/g, "<code>$1</code>");

        // Translate line breaks into HTML paragraphs/breaks
        return parsed.replace(/\n/g, "<br>");
    }

    async function loadSessionHistory(renderFullTimeline = true) {
        try {
            const response = await fetch("/chat/history");
            if (!response.ok) throw new Error("Could not sync conversation logs.");
            
            const history = await response.json();
            
            // Render history in sidebar
            renderSidebarLogs(history);

            // Reconstruct active conversation log on first load
            if (renderFullTimeline && history && history.length > 0) {
                hideWelcomePanel();
                messagesList.innerHTML = "";
                history.forEach(item => {
                    displayMessage(item.user, "user");
                    displayMessage(item.assistant, "assistant");
                });
                scrollToHistoryBottom();
            }
        } catch (error) {
            console.warn("History Load Failure:", error);
        }
    }

    function renderSidebarLogs(history) {
        historyList.innerHTML = "";
        
        if (!history || history.length === 0) {
            const emptyLabel = document.createElement("div");
            emptyLabel.className = "history-item";
            emptyLabel.style.color = "var(--text-muted)";
            emptyLabel.style.cursor = "default";
            emptyLabel.textContent = "No saved logs";
            historyList.appendChild(emptyLabel);
            return;
        }

        // Show recent unique questions in sidebar list (reversed chronological order)
        const recentLogs = [...history].reverse();
        const maxLogs = 8;
        
        recentLogs.slice(0, maxLogs).forEach(item => {
            const logButton = document.createElement("div");
            logButton.className = "history-item";
            logButton.title = item.user;
            
            logButton.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span style="overflow:hidden; text-overflow:ellipsis;">${item.user}</span>
            `;
            
            logButton.addEventListener("click", () => {
                // Set text box value and click
                userInput.value = item.user;
                userInput.dispatchEvent(new Event("input"));
                userInput.focus();
                
                // Active highlight
                document.querySelectorAll(".history-item").forEach(el => el.classList.remove("active"));
                logButton.classList.add("active");
            });

            historyList.appendChild(logButton);
        });
    }

    function triggerNewSession() {
        messagesList.innerHTML = "";
        showWelcomePanel();
        userInput.value = "";
        userInput.dispatchEvent(new Event("input"));
        hideErrorAlert();
        
        // Auto-close sidebar on mobile after hitting reset
        if (window.innerWidth <= 768) {
            sidebar.classList.remove("open");
        }
    }

    function showWelcomePanel() {
        welcomeContainer.style.display = "block";
    }

    function hideWelcomePanel() {
        welcomeContainer.style.display = "none";
    }

    function showLoader() {
        typingIndicator.classList.remove("hidden");
    }

    function hideLoader() {
        typingIndicator.classList.add("hidden");
    }

    function showErrorAlert(message) {
        errorMessage.textContent = message;
        errorBanner.classList.remove("hidden");
        // Scroll banner into focus
        errorBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function hideErrorAlert() {
        errorBanner.classList.add("hidden");
    }

    function scrollToHistoryBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
});
