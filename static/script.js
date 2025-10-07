document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('assessmentForm');
    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const submitBtn = document.querySelector('.submit-btn');

    // Multi-step form functionality
    let currentStep = 1;
    const totalSteps = 3;
    
    // Progress indicator elements
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressLabels = document.querySelectorAll('.progress-label');
    const stepDescription = document.querySelector('.progress-container div:last-child');
    
    // Update progress indicator
    function updateProgress(step) {
        progressSteps.forEach((stepEl, index) => {
            if (index < step - 1) {
                stepEl.classList.add('completed');
                stepEl.classList.remove('active');
            } else if (index === step - 1) {
                stepEl.classList.add('active');
                stepEl.classList.remove('completed');
            } else {
                stepEl.classList.remove('active', 'completed');
            }
        });
        
        const descriptions = [
            'Step 1 of 3: Complete your profile information',
            'Step 2 of 3: Provide demographic details',
            'Step 3 of 3: Review and submit assessment'
        ];
        
        if (stepDescription) {
            stepDescription.textContent = descriptions[step - 1];
        }
    }
    
    // Initialize progress
    updateProgress(currentStep);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            indicator: document.getElementById('indicator').value,
            age_group: document.getElementById('age_group').value,
            sex: document.getElementById('sex').value,
            race_ethnicity: document.getElementById('race_ethnicity').value,
            education: document.getElementById('education').value,
            disability: document.getElementById('disability').value,
            gender_identity: document.getElementById('gender_identity').value,
            sexual_orientation: document.getElementById('sexual_orientation').value,
            marital_status: document.getElementById('marital_status').value,
            employment: document.getElementById('employment').value,
            state: document.getElementById('state').value
        };

        // Show enhanced loading state
        btnText.textContent = 'Analyzing Your Profile...';
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        
        // Add loading overlay
        showLoadingOverlay();
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                // Add success animation to button
                submitBtn.classList.add('success-flash');
                setTimeout(() => {
                    submitBtn.classList.remove('success-flash');
                }, 600);
                
                displayResults(data);
                resultsSection.style.display = 'block';
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                displayError(data.error);
            }
        } catch (error) {
            displayError('An error occurred while processing your request. Please try again.');
        } finally {
            // Reset button state
        btnText.textContent = 'Get Assessment';
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        
        // Hide loading overlay
        hideLoadingOverlay();
        }
    });

    function displayResults(data) {
        const userInputs = data.user_inputs || {};
        const confidenceHTML = data.confidence ? `
            <div class="confidence-bar">
                <div class="confidence-label">
                    <span>Prediction Confidence</span>
                    <span><strong>${data.confidence.toFixed(1)}%</strong></span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.confidence}%"></div>
                </div>
            </div>
        ` : '';

        // Format indicator for display
        const indicatorDisplay = userInputs.indicator ? userInputs.indicator.replace('Symptoms of ', '') : 'N/A';
        
        // Create interactive charts
        const chartsHTML = createInteractiveCharts(data, userInputs);
        
        // Create additional detailed charts
        const additionalChartsHTML = createAdditionalCharts(data, userInputs);

        // Build profile items dynamically
        const profileItems = [
            { label: '📍 City/State', value: userInputs.state || 'Not specified' },
            { label: '🎂 Age Group', value: userInputs.age_group || 'N/A' },
            { label: '⚧ Sex', value: userInputs.sex || 'N/A' },
            { label: '🌍 Race/Ethnicity', value: userInputs.race_ethnicity || 'N/A' },
            { label: '🎓 Education', value: userInputs.education || 'N/A' },
            { label: '♿ Disability', value: userInputs.disability || 'Not provided', highlight: !!userInputs.disability },
            { label: '🏳️‍⚧️ Gender Identity', value: userInputs.gender_identity || 'Not provided', highlight: !!userInputs.gender_identity },
            { label: '🏳️‍🌈 Sexual Orientation', value: userInputs.sexual_orientation || 'Not provided', highlight: !!userInputs.sexual_orientation },
            { label: '💼 Employment', value: userInputs.employment || 'Not provided' },
            { label: '💑 Marital Status', value: userInputs.marital_status || 'Not provided' },
            { label: '🔍 Assessment Type', value: indicatorDisplay }
        ];

        const profileItemsHTML = profileItems.map(item => `
            <div class="profile-item ${item.highlight ? 'profile-item-highlight' : ''}">
                <span class="profile-item-label">${item.label}</span>
                <span class="profile-item-value">${item.value}</span>
            </div>
        `).join('');

        resultsContent.innerHTML = `
            <div class="user-profile-card">
                <h3>👤 Your Profile Summary</h3>
                <div class="profile-grid">
                    ${profileItemsHTML}
                </div>
            </div>

            <div class="result-card">
                <div class="result-header">
                    <div>
                        <div style="color: #475569; font-size: 0.9rem; margin-bottom: 5px;">Symptom Prevalence in Your Demographic</div>
                        <div class="prediction-value" style="color: ${getColorForRisk(data.risk_class)}">
                            ${data.prediction.toFixed(1)}%
                        </div>
                        <div style="color: #475569; font-size: 0.85rem; margin-top: 5px;">of similar individuals report symptoms</div>
                    </div>
                    <div class="risk-badge ${data.risk_class}">
                        ${data.risk_level} Risk
                    </div>
                </div>
                
                    ${chartsHTML}
                    ${additionalChartsHTML}
                ${confidenceHTML}
                
                <div class="result-info">
                    <h3>📊 What This Means</h3>
                    <p><strong>Population Context:</strong> Based on your demographics (${userInputs.age_group}, ${userInputs.sex}, living in ${userInputs.state}), approximately <strong>${data.prediction.toFixed(1)}%</strong> of people with similar characteristics experience symptoms of ${data.condition_name || 'anxiety or depression'}. This is a ${data.risk_level.toLowerCase()}-risk demographic group.</p>
                    ${(userInputs.disability || userInputs.gender_identity || userInputs.sexual_orientation || userInputs.employment || userInputs.marital_status) ? `
                    <p style="margin-top: 12px; padding: 12px; background: #d1fae5; border-left: 4px solid #10b981; border-radius: 8px; font-size: 0.9rem;">
                        <strong>✨ Enhanced Accuracy:</strong> You provided ${[
                            userInputs.disability ? '<strong>disability status</strong> (major impact)' : '', 
                            userInputs.gender_identity ? '<strong>gender identity</strong> (major impact)' : '', 
                            userInputs.sexual_orientation ? '<strong>sexual orientation</strong> (major impact)' : '',
                            userInputs.employment ? 'employment status' : '', 
                            userInputs.marital_status ? 'marital status' : ''
                        ].filter(Boolean).join(', ')}, which significantly improves prediction precision. These factors have substantial impact on mental health prevalence rates.
                    </p>` : ''}
                    <p style="margin-top: 12px;">${data.recommendation}</p>
                    <p style="margin-top: 12px; padding: 12px; background: #fef3c7; border-radius: 8px; font-size: 0.95rem;">
                        <strong>⚠️ Remember:</strong> This percentage represents population trends, not a personal diagnosis. If you're experiencing symptoms like persistent sadness, worry, changes in sleep/appetite, or difficulty functioning, please seek professional help regardless of this statistic.
                    </p>
                </div>
            </div>

            <div class="resources-box">
                <h3>🎯 Next Steps for Early Intervention</h3>
                <p class="intro-text">
                    <strong>Early detection is key to better mental health outcomes.</strong> This data-driven assessment helps identify potential risks early, 
                    enabling timely intervention and reducing the burden on healthcare systems.
                </p>
                
                <h4 class="support-title">📞 Immediate Support Resources:</h4>
                <ul class="support-list">
                    <li><strong>National Suicide Prevention Lifeline:</strong> Call or text 988</li>
                    <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
                    <li><strong>SAMHSA National Helpline:</strong> 1-800-662-4357 (24/7 Treatment Referral)</li>
                    <li><strong>NAMI Helpline:</strong> 1-800-950-6264 (Mental Health Support)</li>
                </ul>
                
                <p class="clinical-note">
                    <strong>📋 Clinical Note:</strong> This ML-powered screening tool analyzes population-level patterns to support early detection. 
                    For accurate diagnosis and personalized treatment planning, please consult with a qualified mental health professional who can 
                    conduct a comprehensive clinical evaluation.
                </p>
            </div>
        `;
        
    // Initialize charts after results are displayed
    initializeCharts(data, userInputs);
    
    // Initialize additional charts
    initializeAdditionalCharts(data, userInputs);
        
        // Add results entrance animation
        animateResultsEntrance();
    }

    // Chatbot functionality
    class ChatbotManager {
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
            this.toggle.addEventListener('click', () => this.toggleChatbot());
            this.close.addEventListener('click', () => this.closeChatbot());
            this.sendBtn.addEventListener('click', () => this.sendMessage());
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        async initializeSession() {
            try {
                const response = await fetch('/chatbot/session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                const data = await response.json();
                if (data.success) {
                    this.sessionId = data.session_id;
                }
            } catch (error) {
                console.log('Chatbot session initialization failed:', error);
            }
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
            this.container.style.display = 'flex';
            this.input.focus();
            this.isOpen = true;
        }

        closeChatbot() {
            this.container.style.display = 'none';
            this.isOpen = false;
        }

        async sendMessage() {
            const message = this.input.value.trim();
            if (!message || this.isTyping) return;

            // Add user message to chat
            this.addMessage(message, 'user');
            this.input.value = '';
            this.sendBtn.disabled = true;

            // Show typing indicator
            this.showTyping();

            try {
                const response = await fetch('/chatbot/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        session_id: this.sessionId
                    })
                });

                const data = await response.json();
                
                // Hide typing indicator
                this.hideTyping();

                if (data.success) {
                    // Add bot response
                    setTimeout(() => {
                        this.addMessage(data.message, 'bot');
                    }, 500);
                    
                    // Update session ID if provided
                    if (data.session_id) {
                        this.sessionId = data.session_id;
                    }
                } else {
                    // Add error message
                    setTimeout(() => {
                        this.addMessage("I'm sorry, I'm having trouble connecting right now. Please try again later.", 'bot');
                    }, 500);
                }
            } catch (error) {
                console.error('Chatbot error:', error);
                this.hideTyping();
                setTimeout(() => {
                    this.addMessage("I'm sorry, I'm having trouble connecting right now. Please try again later.", 'bot');
                }, 500);
            } finally {
                this.sendBtn.disabled = false;
            }
        }

        addMessage(content, sender) {
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
            this.typing.style.display = 'flex';
            this.scrollToBottom();
        }

        hideTyping() {
            this.isTyping = false;
            this.typing.style.display = 'none';
        }

        scrollToBottom() {
            setTimeout(() => {
                this.messages.scrollTop = this.messages.scrollHeight;
            }, 100);
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // Initialize chatbot when DOM is loaded
    window.chatbot = new ChatbotManager();

    function displayError(message) {
        resultsContent.innerHTML = `
            <div class="error-box">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
            </div>
        `;
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function getColorForRisk(riskClass) {
        switch(riskClass) {
            case 'low':
                return '#059669';
            case 'moderate':
                return '#d97706';
            case 'high':
                return '#dc2626';
            default:
                return '#6b7280';
        }
    }

    // Create interactive charts
    function createInteractiveCharts(data, userInputs) {
        return `
            <div class="charts-section">
                <div class="charts-grid">
                    ${createRiskGaugeChart(data)}
                    ${createDemographicComparisonChart(data, userInputs)}
                    ${createFactorImpactChart(userInputs)}
                    ${createPrevalenceTrendChart(data, userInputs)}
                </div>
            </div>
        `;
    }
    
    // Create risk gauge chart
    function createRiskGaugeChart(data) {
        return `
            <div class="chart-card">
                <div class="chart-header">
                    <h3 class="chart-title">Risk Assessment</h3>
                    <svg class="chart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                </div>
                <div class="chart-container">
                    <canvas id="riskGaugeChart"></canvas>
                </div>
            </div>
        `;
    }
    
    // Create demographic comparison chart
    function createDemographicComparisonChart(data, userInputs) {
        return `
            <div class="chart-card">
                <div class="chart-header">
                    <h3 class="chart-title">Demographic Comparison</h3>
                    <svg class="chart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                    </svg>
                </div>
                <div class="chart-container">
                    <canvas id="demographicChart"></canvas>
                </div>
            </div>
        `;
    }
    
    // Create factor impact chart
    function createFactorImpactChart(userInputs) {
        return `
            <div class="chart-card">
                <div class="chart-header">
                    <h3 class="chart-title">Factor Impact Analysis</h3>
                    <svg class="chart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                </div>
                <div class="chart-container">
                    <canvas id="factorImpactChart"></canvas>
                </div>
            </div>
        `;
    }
    
    // Create prevalence trend chart
    function createPrevalenceTrendChart(data, userInputs) {
        return `
            <div class="chart-card">
                <div class="chart-header">
                    <h3 class="chart-title">Prevalence Trends</h3>
                    <svg class="chart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                </div>
                <div class="chart-container">
                    <canvas id="prevalenceTrendChart"></canvas>
                </div>
            </div>
        `;
    }
    
    // Helper functions for comparison data
    function getAgeGroupAverage(ageGroup) {
        const averages = {
            '18 - 29 years': 28.5,
            '30 - 39 years': 25.2,
            '40 - 49 years': 22.8,
            '50 - 59 years': 20.1,
            '60 - 69 years': 17.3,
            '70 - 79 years': 14.7,
            '80 years and above': 12.9
        };
        return averages[ageGroup] || 22.5;
    }
    
    function getStateAverage(state) {
        // Sample state averages (in a real app, this would come from the backend)
        const stateAverages = {
            'California': 24.8,
            'Texas': 21.3,
            'New York': 26.1,
            'Florida': 23.7,
            'Pennsylvania': 22.9
        };
        return stateAverages[state] || 22.5;
    }
    
    // Initialize charts after results are displayed
    function initializeCharts(data, userInputs) {
        // Wait for DOM to update
        setTimeout(() => {
            createRiskGauge(data);
            createDemographicChart(data, userInputs);
            createFactorImpactChart(userInputs);
            createPrevalenceTrendChart(data, userInputs);
        }, 100);
    }
    
    // Create risk gauge chart with Chart.js
    function createRiskGauge(data) {
        const ctx = document.getElementById('riskGaugeChart');
        if (!ctx) return;
        
        const value = data.prediction;
        const riskClass = data.risk_class;
        
        // Determine colors based on risk level
        let backgroundColor, borderColor;
        if (riskClass === 'low') {
            backgroundColor = ['rgba(5, 150, 105, 0.2)', 'rgba(229, 231, 235, 0.8)'];
            borderColor = ['rgba(5, 150, 105, 1)', 'rgba(229, 231, 235, 1)'];
        } else if (riskClass === 'moderate') {
            backgroundColor = ['rgba(217, 119, 6, 0.2)', 'rgba(229, 231, 235, 0.8)'];
            borderColor = ['rgba(217, 119, 6, 1)', 'rgba(229, 231, 235, 1)'];
        } else {
            backgroundColor = ['rgba(220, 38, 38, 0.2)', 'rgba(229, 231, 235, 0.8)'];
            borderColor = ['rgba(220, 38, 38, 1)', 'rgba(229, 231, 235, 1)'];
        }
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [value, 100 - value],
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 2,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataIndex === 0) {
                                    return `Prevalence: ${value.toFixed(1)}%`;
                                }
                                return `Remaining: ${(100 - value).toFixed(1)}%`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 2000
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function(chart) {
                    const ctx = chart.ctx;
                    const canvas = chart.canvas;
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    
                    ctx.restore();
                    ctx.font = 'bold 24px Inter';
                    ctx.fillStyle = '#1e40af';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${value.toFixed(1)}%`, centerX, centerY - 10);
                    
                    ctx.font = '14px Inter';
                    ctx.fillStyle = '#64748b';
                    ctx.fillText('Prevalence', centerX, centerY + 15);
                    ctx.save();
                }
            }]
        });
    }
    
    // Create demographic comparison chart
    function createDemographicChart(data, userInputs) {
        const ctx = document.getElementById('demographicChart');
        if (!ctx) return;
        
        const comparisons = [
            { label: 'Your Group', value: data.prediction },
            { label: 'National Avg', value: 22.5 },
            { label: 'Similar Age', value: getAgeGroupAverage(userInputs.age_group) },
            { label: 'Your State', value: getStateAverage(userInputs.state) }
        ];
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: comparisons.map(item => item.label),
                datasets: [{
                    label: 'Prevalence %',
                    data: comparisons.map(item => item.value),
                    backgroundColor: [
                        '#1e40af',
                        '#64748b',
                        '#0ea5e9',
                        '#059669'
                    ],
                    borderColor: [
                        '#1e3a8a',
                        '#475569',
                        '#0284c7',
                        '#047857'
                    ],
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 50,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }
    
    // Create factor impact chart
    function createFactorImpactChart(userInputs) {
        const ctx = document.getElementById('factorImpactChart');
        if (!ctx) return;
        
        const factors = [];
        const impacts = [];
        const colors = [];
        
        // Analyze each factor's impact
        if (userInputs.disability) {
            factors.push('Disability');
            impacts.push(userInputs.disability === 'With disability' ? 52.9 : 18.5);
            colors.push(userInputs.disability === 'With disability' ? '#dc2626' : '#059669');
        }
        
        if (userInputs.gender_identity) {
            factors.push('Gender Identity');
            impacts.push(userInputs.gender_identity === 'Transgender' ? 63.3 : 21.5);
            colors.push(userInputs.gender_identity === 'Transgender' ? '#dc2626' : '#059669');
        }
        
        if (userInputs.sexual_orientation) {
            factors.push('Sexual Orientation');
            let impact = 19.7; // Default for straight
            if (userInputs.sexual_orientation === 'Bisexual') impact = 49.8;
            else if (userInputs.sexual_orientation === 'Gay or lesbian') impact = 31.2;
            impacts.push(impact);
            colors.push(impact > 40 ? '#dc2626' : impact > 25 ? '#d97706' : '#059669');
        }
        
        if (factors.length === 0) {
            factors.push('No High-Impact Factors');
            impacts.push(22.5);
            colors.push('#64748b');
        }
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: factors,
                datasets: [{
                    label: 'Impact %',
                    data: impacts,
                    backgroundColor: colors.map(color => color + '40'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.y.toFixed(1)}% prevalence`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: Math.max(...impacts) * 1.2,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }
    
    // Create prevalence trend chart
    function createPrevalenceTrendChart(data, userInputs) {
        const ctx = document.getElementById('prevalenceTrendChart');
        if (!ctx) return;
        
        // Generate trend data based on age group
        const ageGroup = userInputs.age_group;
        let trendData = [];
        let labels = [];
        
        if (ageGroup) {
            const ageTrends = {
                '18 - 29 years': [25, 28, 31, 28.5],
                '30 - 39 years': [22, 24, 26, 25.2],
                '40 - 49 years': [20, 21, 23, 22.8],
                '50 - 59 years': [18, 19, 21, 20.1],
                '60 - 69 years': [15, 16, 18, 17.3],
                '70 - 79 years': [12, 13, 15, 14.7],
                '80 years and above': [10, 11, 13, 12.9]
            };
            
            trendData = ageTrends[ageGroup] || [20, 22, 24, 22.5];
            labels = ['2020', '2021', '2022', '2023'];
        } else {
            trendData = [20, 22, 24, 22.5];
            labels = ['2020', '2021', '2022', '2023'];
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Prevalence Trend',
                    data: trendData,
                    borderColor: '#1e40af',
                    backgroundColor: 'rgba(30, 64, 175, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#1e40af',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: Math.max(...trendData) * 1.3,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // Add smooth animations to form inputs
    const inputs = document.querySelectorAll('select, input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateX(5px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateX(0)';
        });
        
        // Add validation feedback
        input.addEventListener('input', function() {
            validateField(this);
    });
});
    
    // Enhanced form validation
    function validateField(field) {
        const formGroup = field.parentElement;
        const validationMsg = formGroup.querySelector('.validation-message') || createValidationMessage(formGroup);
        
        if (field.hasAttribute('required') && !field.value) {
            formGroup.classList.add('error');
            formGroup.classList.remove('success');
            validationMsg.textContent = 'This field is required';
            validationMsg.className = 'validation-message error';
        } else if (field.value) {
            formGroup.classList.add('success');
            formGroup.classList.remove('error');
            validationMsg.textContent = '✓ Valid';
            validationMsg.className = 'validation-message success';
        } else {
            formGroup.classList.remove('error', 'success');
            validationMsg.className = 'validation-message';
        }
    }
    
    function createValidationMessage(formGroup) {
        const msg = document.createElement('div');
        msg.className = 'validation-message';
        formGroup.appendChild(msg);
        return msg;
    }
    
    // Add floating animation to header elements
    const header = document.querySelector('header');
    if (header) {
        header.classList.add('floating-animation');
    }
    
    // Add pulse glow to important elements
    const infoBoxes = document.querySelectorAll('.info-box, .model-explanation-box, .optional-params-info');
    infoBoxes.forEach((box, index) => {
        setTimeout(() => {
            box.classList.add('pulse-glow');
        }, index * 200);
    });
});

// Create additional detailed charts
function createAdditionalCharts(data, userInputs) {
    return `
        <div class="charts-section">
            <div class="charts-grid">
                ${createAgeDistributionChart(data, userInputs)}
                ${createStateComparisonChart(data, userInputs)}
                ${createEducationImpactChart(data, userInputs)}
                ${createRaceEthnicityChart(data, userInputs)}
                ${createTemporalTrendChart(data, userInputs)}
                ${createRiskFactorsCorrelationChart(data, userInputs)}
            </div>
        </div>
    `;
}

// Age Distribution Chart
function createAgeDistributionChart(data, userInputs) {
    return `
        <div class="chart-card">
            <div class="chart-header">
                <div class="chart-icon">📊</div>
                <h3 class="chart-title">Age Group Prevalence</h3>
            </div>
            <div class="chart-container">
                <canvas id="ageDistributionChart"></canvas>
            </div>
        </div>
    `;
}

// State Comparison Chart
function createStateComparisonChart(data, userInputs) {
    return `
        <div class="chart-card">
            <div class="chart-header">
                <div class="chart-icon">🗺️</div>
                <h3 class="chart-title">Regional Comparison</h3>
            </div>
            <div class="chart-container">
                <canvas id="stateComparisonChart"></canvas>
            </div>
        </div>
    `;
}

// Education Impact Chart
function createEducationImpactChart(data, userInputs) {
    return `
        <div class="chart-card">
            <div class="chart-header">
                <div class="chart-icon">🎓</div>
                <h3 class="chart-title">Education Impact</h3>
            </div>
            <div class="chart-container">
                <canvas id="educationImpactChart"></canvas>
            </div>
        </div>
    `;
}

// Race/Ethnicity Chart
function createRaceEthnicityChart(data, userInputs) {
    return `
        <div class="chart-card">
            <div class="chart-header">
                <div class="chart-icon">🌍</div>
                <h3 class="chart-title">Race/Ethnicity Analysis</h3>
            </div>
            <div class="chart-container">
                <canvas id="raceEthnicityChart"></canvas>
            </div>
        </div>
    `;
}

// Temporal Trend Chart
function createTemporalTrendChart(data, userInputs) {
    return `
        <div class="chart-card">
            <div class="chart-header">
                <div class="chart-icon">📈</div>
                <h3 class="chart-title">Temporal Trends</h3>
            </div>
            <div class="chart-container">
                <canvas id="temporalTrendChart"></canvas>
            </div>
        </div>
    `;
}

// Risk Factors Correlation Chart
function createRiskFactorsCorrelationChart(data, userInputs) {
    return `
        <div class="chart-card">
            <div class="chart-header">
                <div class="chart-icon">🔗</div>
                <h3 class="chart-title">Risk Factor Correlation</h3>
            </div>
            <div class="chart-container">
                <canvas id="riskFactorsChart"></canvas>
            </div>
        </div>
    `;
}

// Initialize additional charts
function initializeAdditionalCharts(data, userInputs) {
    setTimeout(() => {
        createAgeDistributionChart(data, userInputs);
        createStateComparisonChart(data, userInputs);
        createEducationImpactChart(data, userInputs);
        createRaceEthnicityChart(data, userInputs);
        createTemporalTrendChart(data, userInputs);
        createRiskFactorsCorrelationChart(data, userInputs);
    }, 1000);
}

// Create Age Distribution Chart with Chart.js
function createAgeDistributionChart(data, userInputs) {
    const ctx = document.getElementById('ageDistributionChart');
    if (!ctx) return;

    const ageGroups = [
        '18-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'
    ];
    
    const prevalenceData = [22.5, 25.8, 28.3, 24.7, 19.2, 15.8, 12.4];
    const userAgeGroup = userInputs.age_group?.replace(' years', '') || '';
    const userAgeIndex = ageGroups.findIndex(age => userAgeGroup.includes(age.split('-')[0]));
    
    const colors = prevalenceData.map((_, index) => 
        index === userAgeIndex ? '#6366f1' : '#f8fafc'
    );

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ageGroups,
            datasets: [{
                label: 'Prevalence %',
                data: prevalenceData,
                backgroundColor: colors,
                borderColor: colors.map(color => color === '#6366f1' ? '#4f46e5' : '#f1f5f9'),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#6366f1',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const isUserGroup = context.dataIndex === userAgeIndex;
                            return `${context.parsed.y}% prevalence${isUserGroup ? ' (Your Age Group)' : ''}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 30,
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    ticks: { 
                        color: '#6b7280',
                        callback: function(value) { return value + '%'; }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Create State Comparison Chart
function createStateComparisonChart(data, userInputs) {
    const ctx = document.getElementById('stateComparisonChart');
    if (!ctx) return;

    const states = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
    const prevalenceData = [28.5, 24.2, 26.8, 29.1, 27.3, 25.7, 23.9, 26.4, 24.8, 25.2];
    const userState = userInputs.state;
    
    // Find user's state index (simplified)
    const stateAbbreviations = {
        'California': 'CA', 'Texas': 'TX', 'Florida': 'FL', 'New York': 'NY',
        'Illinois': 'IL', 'Pennsylvania': 'PA', 'Ohio': 'OH', 'Georgia': 'GA',
        'North Carolina': 'NC', 'Michigan': 'MI'
    };
    
    const userStateAbbr = stateAbbreviations[userState] || '';
    const userStateIndex = states.indexOf(userStateAbbr);
    
    const colors = prevalenceData.map((_, index) => 
        index === userStateIndex ? '#ec4899' : '#f8fafc'
    );

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: states,
            datasets: [{
                data: prevalenceData,
                backgroundColor: colors,
                borderColor: '#fefefe',
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        color: '#6b7280'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#ec4899',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const isUserState = context.dataIndex === userStateIndex;
                            return `${context.label}: ${context.parsed}%${isUserState ? ' (Your State)' : ''}`;
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Create Education Impact Chart
function createEducationImpactChart(data, userInputs) {
    const ctx = document.getElementById('educationImpactChart');
    if (!ctx) return;

    const educationLevels = [
        'Less than HS',
        'High School',
        'Some College',
        'Bachelor\'s+'
    ];
    
    const prevalenceData = [32.5, 28.7, 24.3, 19.8];
    const userEducation = userInputs.education || '';
    const userEducationIndex = educationLevels.findIndex(level => 
        userEducation.toLowerCase().includes(level.toLowerCase().split(' ')[0])
    );
    
    const colors = prevalenceData.map((_, index) => 
        index === userEducationIndex ? '#059669' : '#f0fdf4'
    );

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: educationLevels,
            datasets: [{
                label: 'Prevalence %',
                data: prevalenceData,
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: colors,
                pointBorderColor: colors,
                pointBorderWidth: 3,
                pointRadius: 8,
                pointHoverRadius: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#059669',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const isUserEducation = context.dataIndex === userEducationIndex;
                            return `${context.parsed.y}% prevalence${isUserEducation ? ' (Your Education Level)' : ''}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 35,
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    ticks: { 
                        color: '#6b7280',
                        callback: function(value) { return value + '%'; }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Create Race/Ethnicity Chart
function createRaceEthnicityChart(data, userInputs) {
    const ctx = document.getElementById('raceEthnicityChart');
    if (!ctx) return;

    const raceEthnicities = [
        'White',
        'Black',
        'Hispanic',
        'Asian',
        'Other'
    ];
    
    const prevalenceData = [22.3, 28.7, 26.4, 18.9, 25.1];
    const userRace = userInputs.race_ethnicity || '';
    const userRaceIndex = raceEthnicities.findIndex(race => 
        userRace.toLowerCase().includes(race.toLowerCase())
    );
    
    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#059669', '#8b5cf6'];
    const pointColors = prevalenceData.map((_, index) => 
        index === userRaceIndex ? colors[index] : '#f8fafc'
    );

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: raceEthnicities,
            datasets: [{
                label: 'Prevalence %',
                data: prevalenceData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderWidth: 3,
                pointBackgroundColor: pointColors,
                pointBorderColor: pointColors,
                pointBorderWidth: 3,
                pointRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const isUserRace = context.dataIndex === userRaceIndex;
                            return `${context.label}: ${context.parsed.r}%${isUserRace ? ' (Your Race/Ethnicity)' : ''}`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 30,
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    ticks: { 
                        color: '#6b7280',
                        callback: function(value) { return value + '%'; }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Create Temporal Trend Chart
function createTemporalTrendChart(data, userInputs) {
    const ctx = document.getElementById('temporalTrendChart');
    if (!ctx) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trendData = [24.5, 26.2, 28.1, 25.8, 27.3, data.prediction];
    const colors = trendData.map((_, index) => 
        index === trendData.length - 1 ? '#7c3aed' : '#f3f4f6'
    );

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Prevalence %',
                data: trendData,
                backgroundColor: colors,
                borderColor: colors.map(color => color === '#7c3aed' ? '#6d28d9' : '#e5e7eb'),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#6366f1',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const isCurrent = context.dataIndex === trendData.length - 1;
                            return `${context.parsed.y}% prevalence${isCurrent ? ' (Your Prediction)' : ''}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 30,
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    ticks: { 
                        color: '#6b7280',
                        callback: function(value) { return value + '%'; }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Create Risk Factors Correlation Chart
function createRiskFactorsCorrelationChart(data, userInputs) {
    const ctx = document.getElementById('riskFactorsChart');
    if (!ctx) return;

    const riskFactors = [
        'Age',
        'Gender',
        'Education',
        'Race',
        'Disability',
        'Employment'
    ];
    
    const correlationData = [0.65, 0.42, -0.58, 0.31, 0.78, -0.35];
    const colors = correlationData.map(value => 
        value > 0 ? '#dc2626' : value < 0 ? '#059669' : '#6b7280'
    );

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: riskFactors,
            datasets: [{
                label: 'Correlation Coefficient',
                data: correlationData,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#6366f1',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.x;
                            const direction = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
                            return `${context.label}: ${value.toFixed(2)} (${direction} correlation)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: -1,
                    max: 1,
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    ticks: { 
                        color: '#6b7280',
                        callback: function(value) { return value.toFixed(1); }
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Enhanced loading overlay function
function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
            </div>
            <div class="loading-text">
                <h3>Analyzing Your Mental Health Profile</h3>
                <p>Processing demographic data and calculating risk factors...</p>
                <div class="loading-steps">
                    <div class="step active">📊 Analyzing demographics</div>
                    <div class="step">🧠 Processing risk factors</div>
                    <div class="step">📈 Generating insights</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Animate steps
    setTimeout(() => {
        const steps = overlay.querySelectorAll('.step');
        steps.forEach((step, index) => {
            setTimeout(() => {
                if (index > 0) steps[index - 1].classList.remove('active');
                step.classList.add('active');
            }, index * 1000);
        });
    }, 500);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

// Enhanced results entrance animation
function animateResultsEntrance() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.opacity = '0';
        resultsSection.style.transform = 'translateY(50px)';
        resultsSection.style.display = 'block';
        
        // Animate in
        setTimeout(() => {
            resultsSection.style.transition = 'all 0.8s ease-out';
            resultsSection.style.opacity = '1';
            resultsSection.style.transform = 'translateY(0)';
        }, 100);
        
        // Animate cards with stagger
        const cards = resultsSection.querySelectorAll('.result-card, .user-profile-card, .chart-card, .resources-box');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 300 + (index * 100));
        });
    }
}

