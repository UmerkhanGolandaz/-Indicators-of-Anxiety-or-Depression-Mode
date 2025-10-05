// Static version for GitHub Pages - Client-side prediction logic
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('assessmentForm');
    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    // Client-side prediction logic (simplified version)
    function predictMentalHealthRisk(userInputs) {
        let riskScore = 15; // Base score

        // Age group adjustments
        const ageScores = {
            '18 - 29 years': 25,
            '30 - 39 years': 23,
            '40 - 49 years': 20,
            '50 - 59 years': 18,
            '60 - 69 years': 16,
            '70 - 79 years': 14,
            '80 years and above': 12
        };
        riskScore = ageScores[userInputs.age_group] || riskScore;

        // Sex adjustments
        if (userInputs.sex === 'Female') {
            riskScore += 3;
        }

        // Race/ethnicity adjustments
        const raceScores = {
            'Non-Hispanic White, single race': 0,
            'Non-Hispanic Black, single race': 2,
            'Hispanic or Latino': 1,
            'Non-Hispanic Asian, single race': -2,
            'Non-Hispanic, other races and multiple races': 1
        };
        riskScore += raceScores[userInputs.race_ethnicity] || 0;

        // Education adjustments
        const educationScores = {
            'Less than a high school diploma': 4,
            'High school diploma or GED': 2,
            'Some college/Associate\'s degree': 1,
            'Bachelor\'s degree or higher': 0
        };
        riskScore += educationScores[userInputs.education] || 0;

        // Optional parameters with major impact
        if (userInputs.disability === 'With disability') {
            riskScore += 15;
        } else if (userInputs.disability === 'Without disability') {
            riskScore -= 5;
        }

        if (userInputs.gender_identity === 'Transgender') {
            riskScore += 12;
        }

        if (userInputs.sexual_orientation === 'Bisexual') {
            riskScore += 8;
        } else if (userInputs.sexual_orientation === 'Gay or lesbian') {
            riskScore += 4;
        }

        // Marital status
        if (userInputs.marital_status === 'Widowed/Divorced/Separated') {
            riskScore += 3;
        } else if (userInputs.marital_status === 'Never married') {
            riskScore += 2;
        }

        // Employment
        if (userInputs.employment === 'Unemployed') {
            riskScore += 4;
        }

        // Ensure score is within reasonable bounds
        riskScore = Math.max(5, Math.min(45, riskScore));

        return riskScore;
    }

    function getRiskLevel(score) {
        if (score < 15) return { level: 'Low', class: 'low', color: '#10b981' };
        if (score < 25) return { level: 'Moderate', class: 'moderate', color: '#f59e0b' };
        return { level: 'High', class: 'high', color: '#ef4444' };
    }

    function getRecommendation(score, conditionName) {
        if (score < 15) {
            return `Your demographic group shows relatively lower prevalence of ${conditionName} symptoms compared to the general population. However, continue monitoring your mental health and practice good self-care.`;
        } else if (score < 25) {
            return `Your demographic group shows moderate prevalence of ${conditionName} symptoms. If you're experiencing any concerning symptoms, we encourage you to speak with a healthcare professional for personalized guidance.`;
        } else {
            return `Your demographic group shows higher prevalence of ${conditionName} symptoms. This means a significant portion of people with similar demographics experience these conditions. If you have any symptoms or concerns, we strongly recommend consulting with a mental health professional.`;
        }
    }

    function displayResults(data) {
        const riskInfo = getRiskLevel(data.prediction);
        const conditionName = data.condition_name;
        const conditionDisplay = data.condition_display;

        resultsContent.innerHTML = `
            <div class="result-card">
                <div class="result-header">
                    <h3>📊 Assessment Results</h3>
                    <div class="prediction-value" style="color: ${riskInfo.color}">
                        ${data.prediction.toFixed(1)}%
                    </div>
                </div>
                
                <div class="risk-badge ${riskInfo.class}">
                    ${riskInfo.level} Risk
                </div>
                
                <div class="result-info">
                    <p><strong>Assessment Type:</strong> ${data.user_inputs.indicator}</p>
                    <p><strong>Demographic Group:</strong> ${data.user_inputs.age_group}, ${data.user_inputs.sex}, ${data.user_inputs.race_ethnicity}</p>
                    <p><strong>Education:</strong> ${data.user_inputs.education}</p>
                    <p><strong>Location:</strong> ${data.user_inputs.state}</p>
                    
                    <div class="recommendation">
                        <h4>💡 Recommendation</h4>
                        <p>${data.recommendation}</p>
                    </div>
                    
                    <div class="disclaimer">
                        <p><strong>⚠️ Important:</strong> This assessment provides population-level statistics for your demographic group, not individual diagnosis. If you're experiencing mental health symptoms, please consult with a qualified mental health professional.</p>
                    </div>
                </div>
            </div>
            
            <div class="resources-box">
                <h4>🆘 Mental Health Resources</h4>
                <ul>
                    <li><strong>National Suicide Prevention Lifeline:</strong> 988 (24/7)</li>
                    <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
                    <li><strong>National Helpline:</strong> 1-800-662-4357</li>
                    <li><strong>Find a Therapist:</strong> <a href="https://www.psychologytoday.com/us/therapists" target="_blank">Psychology Today</a></li>
                </ul>
            </div>
        `;

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading state
        btnText.textContent = 'Analyzing...';
        btnLoader.style.display = 'inline-block';
        submitBtn.disabled = true;

        // Collect form data
        const formData = new FormData(form);
        const userInputs = {
            indicator: formData.get('indicator'),
            age_group: formData.get('age_group'),
            sex: formData.get('sex'),
            race_ethnicity: formData.get('race_ethnicity'),
            education: formData.get('education'),
            disability: formData.get('disability'),
            gender_identity: formData.get('gender_identity'),
            sexual_orientation: formData.get('sexual_orientation'),
            marital_status: formData.get('marital_status'),
            employment: formData.get('employment'),
            state: formData.get('state')
        };

        // Simulate processing time
        setTimeout(() => {
            // Make prediction
            const prediction = predictMentalHealthRisk(userInputs);
            
            // Determine condition name
            let conditionName, conditionDisplay;
            if (userInputs.indicator.includes("Depressive Disorder") && !userInputs.indicator.includes("Anxiety")) {
                conditionName = "depression";
                conditionDisplay = "depressive disorder";
            } else if (userInputs.indicator.includes("Anxiety Disorder") && !userInputs.indicator.includes("Depressive")) {
                conditionName = "anxiety";
                conditionDisplay = "anxiety disorder";
            } else {
                conditionName = "anxiety or depression";
                conditionDisplay = "anxiety or depressive disorder";
            }

            const resultData = {
                prediction: prediction,
                confidence: 85, // Mock confidence
                recommendation: getRecommendation(prediction, conditionName),
                condition_name: conditionName,
                condition_display: conditionDisplay,
                user_inputs: userInputs
            };

            // Display results
            displayResults(resultData);

            // Reset button
            btnText.textContent = 'Get Assessment';
            btnLoader.style.display = 'none';
            submitBtn.disabled = false;
        }, 2000);
    });

    // Chatbot functionality for static version
    class StaticChatbotManager {
        constructor() {
            this.sessionId = null;
            this.isOpen = false;
            this.isTyping = false;
            this.initializeElements();
            this.attachEventListeners();
            this.initializeSession();
        }

        initializeElements() {
            this.toggle = document.getElementById('chatbot-toggle');
            this.container = document.getElementById('chatbot-container');
            this.close = document.getElementById('chatbot-close');
            this.messages = document.getElementById('chatbot-messages');
            this.input = document.getElementById('chatbot-input');
            this.sendBtn = document.getElementById('chatbot-send');
            this.typing = document.getElementById('chatbot-typing');
        }

        attachEventListeners() {
            if (this.toggle) {
                this.toggle.addEventListener('click', () => this.toggleChatbot());
            }
            if (this.close) {
                this.close.addEventListener('click', () => this.closeChatbot());
            }
            if (this.sendBtn) {
                this.sendBtn.addEventListener('click', () => this.sendMessage());
            }
            if (this.input) {
                this.input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
            }
        }

        initializeSession() {
            this.sessionId = `static_session_${Date.now()}`;
        }

        toggleChatbot() {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.openChatbot();
            } else {
                this.closeChatbot();
            }
        }

        openChatbot() {
            if (this.container) {
                this.container.style.display = 'flex';
                if (this.input) this.input.focus();
            }
            this.isOpen = true;
        }

        closeChatbot() {
            if (this.container) {
                this.container.style.display = 'none';
            }
            this.isOpen = false;
        }

        sendMessage() {
            const message = this.input ? this.input.value.trim() : '';
            if (!message || this.isTyping) return;

            // Add user message to chat
            this.addMessage(message, 'user');
            if (this.input) this.input.value = '';
            if (this.sendBtn) this.sendBtn.disabled = true;

            // Show typing indicator
            this.showTyping();

            // Simulate bot response
            setTimeout(() => {
                this.hideTyping();
                const botResponse = this.getBotResponse(message);
                this.addMessage(botResponse, 'bot');
                if (this.sendBtn) this.sendBtn.disabled = false;
            }, 1000 + Math.random() * 1000);
        }

        getBotResponse(message) {
            const responses = {
                'hello': "Hello! I'm your AI mental health assistant. I can help answer questions about mental health, explain assessment results, or provide general support. How can I help you today?",
                'hi': "Hi there! I'm here to support you with mental health questions. What would you like to know?",
                'help': "I can help you with:\n• Understanding your assessment results\n• General mental health information\n• Coping strategies\n• When to seek professional help\n• Mental health resources\n\nWhat specific area would you like to explore?",
                'anxiety': "Anxiety is a normal emotion, but when it becomes persistent and overwhelming, it may indicate an anxiety disorder. Common symptoms include:\n\n• Excessive worry\n• Restlessness\n• Fatigue\n• Difficulty concentrating\n• Irritability\n• Sleep problems\n• Physical symptoms (racing heart, sweating)\n\nIf you're experiencing these symptoms frequently, consider speaking with a mental health professional.",
                'depression': "Depression is a mood disorder that affects how you feel, think, and handle daily activities. Common symptoms include:\n\n• Persistent sadness or hopelessness\n• Loss of interest in activities\n• Changes in appetite or weight\n• Sleep disturbances\n• Fatigue or low energy\n• Difficulty concentrating\n• Feelings of worthlessness\n\nIf you're experiencing several of these symptoms for two weeks or more, please consider reaching out to a mental health professional.",
                'stress': "Stress is a natural response to challenges, but chronic stress can impact mental health. Here are some coping strategies:\n\n• Practice deep breathing exercises\n• Engage in regular physical activity\n• Maintain a healthy sleep schedule\n• Practice mindfulness or meditation\n• Connect with supportive people\n• Set realistic goals and priorities\n• Take breaks and practice self-care\n\nRemember, it's okay to seek professional help if stress becomes overwhelming.",
                'crisis': "If you're in immediate crisis or having thoughts of self-harm, please reach out for help right away:\n\n• National Suicide Prevention Lifeline: 988\n• Crisis Text Line: Text HOME to 741741\n• Emergency Services: 911\n• National Helpline: 1-800-662-4357\n\nYou're not alone, and help is available 24/7.",
                'thank': "You're welcome! I'm here whenever you need support or have questions about mental health. Remember, seeking help is a sign of strength, not weakness.",
                'bye': "Take care! Remember that mental health is important, and it's okay to reach out for support when you need it. Have a great day!",
                'goodbye': "Goodbye! Take care of yourself and remember that seeking help for mental health is always a positive step."
            };
            
            const lowerMessage = message.toLowerCase();
            for (const [keyword, response] of Object.entries(responses)) {
                if (lowerMessage.includes(keyword)) {
                    return response;
                }
            }
            
            return "I'm here to help with mental health questions. I can assist with information about anxiety, depression, stress, coping strategies, or help you understand your assessment results. What would you like to know more about?";
        }

        addMessage(content, sender) {
            if (!this.messages) return;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `chatbot-message ${sender}-message`;
            
            const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p>${this.escapeHtml(content)}</p>
                </div>
                <div class="message-time">${currentTime}</div>
            `;

            this.messages.appendChild(messageDiv);
            this.scrollToBottom();
        }

        showTyping() {
            this.isTyping = true;
            if (this.typing) {
                this.typing.style.display = 'flex';
            }
            this.scrollToBottom();
        }

        hideTyping() {
            this.isTyping = false;
            if (this.typing) {
                this.typing.style.display = 'none';
            }
        }

        scrollToBottom() {
            if (this.messages) {
                setTimeout(() => {
                    this.messages.scrollTop = this.messages.scrollHeight;
                }, 100);
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // Initialize static chatbot
    window.chatbot = new StaticChatbotManager();
});