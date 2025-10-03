document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('assessmentForm');
    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const submitBtn = document.querySelector('.submit-btn');

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

        // Show loading state
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
        submitBtn.disabled = true;

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
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            submitBtn.disabled = false;
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
                <p style="margin-bottom: 15px;">
                    <strong>Early detection is key to better mental health outcomes.</strong> This data-driven assessment helps identify potential risks early, 
                    enabling timely intervention and reducing the burden on healthcare systems.
                </p>
                
                <h4 style="margin-top: 15px; margin-bottom: 10px;">📞 Immediate Support Resources:</h4>
                <ul>
                    <li><strong>National Suicide Prevention Lifeline:</strong> Call or text 988</li>
                    <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
                    <li><strong>SAMHSA National Helpline:</strong> 1-800-662-4357 (24/7 Treatment Referral)</li>
                    <li><strong>NAMI Helpline:</strong> 1-800-950-6264 (Mental Health Support)</li>
                </ul>
                
                <p style="margin-top: 15px; font-size: 0.9rem; padding-top: 15px; border-top: 1px solid #cbd5e1;">
                    <strong>📋 Clinical Note:</strong> This ML-powered screening tool analyzes population-level patterns to support early detection. 
                    For accurate diagnosis and personalized treatment planning, please consult with a qualified mental health professional who can 
                    conduct a comprehensive clinical evaluation.
                </p>
            </div>
        `;
    }

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
                return '#10b981';
            case 'moderate':
                return '#f59e0b';
            case 'high':
                return '#ef4444';
            default:
                return '#475569';
        }
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
    });
});

