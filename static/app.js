// Quiz state management
let currentQuestion = 1;
const totalQuestions = 5;

// Initialize the quiz
document.addEventListener('DOMContentLoaded', function() {
  // Start quiz button
  document.getElementById('start-quiz').addEventListener('click', function() {
    showQuiz();
  });
  
  // Add Enter key support for text inputs
  document.getElementById('struggle').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      nextQuestion();
    }
  });
  
  document.getElementById('mood').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      nextQuestion();
    }
  });
});

function showQuiz() {
  document.getElementById('welcome-page').classList.remove('active');
  document.getElementById('quiz-container').classList.add('active');
  updateProgress();
}

function nextQuestion() {
  if (!validateCurrentQuestion()) {
    return;
  }
  
  if (currentQuestion < totalQuestions) {
    // Hide current question
    document.querySelector(`[data-question="${currentQuestion}"]`).classList.remove('active');
    
    // Show next question
    currentQuestion++;
    document.querySelector(`[data-question="${currentQuestion}"]`).classList.add('active');
    
    updateProgress();
  }
}

function prevQuestion() {
  if (currentQuestion > 1) {
    // Hide current question
    document.querySelector(`[data-question="${currentQuestion}"]`).classList.remove('active');
    
    // Show previous question
    currentQuestion--;
    document.querySelector(`[data-question="${currentQuestion}"]`).classList.add('active');
    
    updateProgress();
  }
}

function updateProgress() {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  
  const progressPercentage = (currentQuestion / totalQuestions) * 100;
  progressFill.style.width = `${progressPercentage}%`;
  progressText.textContent = `Question ${currentQuestion} of ${totalQuestions}`;
}

function validateCurrentQuestion() {
  const currentPage = document.querySelector(`[data-question="${currentQuestion}"]`);
  
  // Check text inputs
  const textInput = currentPage.querySelector('input[type="text"]');
  if (textInput && !textInput.value.trim()) {
    alert('Please answer the question before continuing.');
    textInput.focus();
    return false;
  }
  
  // Check radio buttons
  const radioGroup = currentPage.querySelector('input[type="radio"]');
  if (radioGroup) {
    const checkedRadio = currentPage.querySelector('input[type="radio"]:checked');
    if (!checkedRadio) {
      alert('Please select an option before continuing.');
      return false;
    }
  }
  
  // Check checkboxes (at least one should be selected)
  const checkboxes = currentPage.querySelectorAll('input[type="checkbox"]');
  if (checkboxes.length > 0) {
    const checkedBoxes = currentPage.querySelectorAll('input[type="checkbox"]:checked');
    if (checkedBoxes.length === 0) {
      alert('Please select at least one option before continuing.');
      return false;
    }
  }
  
  return true;
}

async function generateToolkit() {
  if (!validateCurrentQuestion()) {
    return;
  }
  
  // Get form elements
  const loadingDiv = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');
  const quizContainer = document.getElementById('quiz-container');
  
  // Show loading state
  loadingDiv.style.display = "block";
  resultsDiv.innerHTML = "";
  
  // Hide quiz and show loading
  quizContainer.style.display = "none";
  
  try {
    // Collect all form data
    const struggle = document.getElementById("struggle").value;
    const mood = document.getElementById("mood").value;
    
    // Get focus selection
    const focusRadio = document.querySelector('input[name="focus"]:checked');
    const focus = focusRadio ? focusRadio.value : '';
    
    // Get coping preferences
    const preferences = [...document.querySelectorAll('input[type="checkbox"]:checked')]
      .map(cb => cb.value);
    
    // Get energy level
    const energyRadio = document.querySelector('input[name="energy"]:checked');
    const energyLevel = energyRadio ? energyRadio.value : '';
    
    const res = await fetch("/api/toolkit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        struggle, 
        mood, 
        focus, 
        copingPreferences: preferences, 
        energyLevel 
      })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Debug: log the response
    console.log("API Response:", data);
    
    if (data.status === "crisis") {
      resultsDiv.innerHTML = `<div class="alert">Safety first: ${data.message}</div>`;
      addRestartButton(resultsDiv);
      return;
    }
    
    if (data.error) {
      resultsDiv.innerHTML = `<div class="alert">Error: ${data.error}</div>`;
      addRestartButton(resultsDiv);
    } else if ((data.items && data.items.length > 0) || (data.payload && data.payload.length > 0)) {
      resultsDiv.innerHTML = '<h2>🎉 Your Personalized Self-Care Toolkit</h2>';
      
      // Create results container
      const resultsContainer = document.createElement("div");
      resultsContainer.className = "results-container";
      
      // Handle different response formats
      const recommendations = data.items || data.payload || [];
      
      recommendations.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${item.title}</h3>
          <p><em>Why it helps:</em> ${item.why_it_helps}</p>
          <ul>${item.steps.map(s => `<li>${s}</li>`).join("")}</ul>
          <p class="meta">${item.time_estimate} • ${item.difficulty}</p>
        `;
        resultsContainer.appendChild(card);
      });
      
      resultsDiv.appendChild(resultsContainer);
      addRestartButton(resultsDiv);
      
    } else {
      resultsDiv.innerHTML = `
        <div class="alert">
          <h3>No recommendations generated</h3>
          <p>Debug info: ${JSON.stringify(data, null, 2)}</p>
          <p>Please try again or check the console for more details.</p>
        </div>
      `;
      addRestartButton(resultsDiv);
    }
    
  } catch (error) {
    console.error("Error:", error);
    resultsDiv.innerHTML = `<div class="alert">Error: ${error.message}</div>`;
    addRestartButton(resultsDiv);
  } finally {
    // Hide loading state
    loadingDiv.style.display = "none";
  }
}

function addRestartButton(resultsDiv) {
  // Add restart button
  const restartButton = document.createElement("button");
  restartButton.className = "primary-button";
  restartButton.style.marginTop = "30px";
  restartButton.textContent = "Start Over";
  restartButton.onclick = restartQuiz;
  resultsDiv.appendChild(restartButton);
}

function restartQuiz() {
  // Reset form
  document.getElementById("struggle").value = "";
  document.getElementById("mood").value = "";
  document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
  
  // Reset quiz state
  currentQuestion = 1;
  
  // Show quiz container (not welcome page)
  document.getElementById('welcome-page').classList.remove('active');
  document.getElementById('quiz-container').classList.add('active');
  document.getElementById('quiz-container').style.display = "block";
  
  // Reset question visibility
  document.querySelectorAll('.question-page').forEach(page => {
    page.classList.remove('active');
  });
  document.querySelector('[data-question="1"]').classList.add('active');
  
  // Update progress bar
  updateProgress();
  
  // Clear results
  document.getElementById('results').innerHTML = "";
}
  