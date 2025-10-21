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
  
  // Show the first question
  document.querySelector(`[data-question="1"]`).classList.add('active');
  
  updateProgress();
}

function nextQuestion() {
  if (!validateCurrentQuestion()) {
    return;
  }
  
  if (currentQuestion < totalQuestions) {
    // Hide current question - be very explicit
    const currentPage = document.querySelector(`[data-question="${currentQuestion}"]`);
    if (currentPage) {
      currentPage.classList.remove('active');
      currentPage.style.display = 'none'; // Force hide
    }
    
    // Show next question
    currentQuestion++;
    const nextPage = document.querySelector(`[data-question="${currentQuestion}"]`);
    if (nextPage) {
      nextPage.classList.add('active');
      nextPage.style.display = 'block'; // Force show
      nextPage.style.visibility = 'visible';
    }
    
    updateProgress();
  }
}

function prevQuestion() {
  if (currentQuestion > 1) {
    // Hide current question - be very explicit
    const currentPage = document.querySelector(`[data-question="${currentQuestion}"]`);
    if (currentPage) {
      currentPage.classList.remove('active');
      currentPage.style.display = 'none'; // Force hide
    }
    
    // Show previous question
    currentQuestion--;
    const prevPage = document.querySelector(`[data-question="${currentQuestion}"]`);
    if (prevPage) {
      prevPage.classList.add('active');
      prevPage.style.display = 'block'; // Force show
      prevPage.style.visibility = 'visible';
    }
    
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
    } else {
      // Smart data extraction - find any array in the response
      let recommendations = [];
      
      // Check if data is already an array
      if (Array.isArray(data)) {
        recommendations = data;
      } else if (typeof data === 'object' && data !== null) {
        // Look for any property that contains an array
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            recommendations = data[key];
            break;
          }
        }
      }
      
      if (recommendations.length > 0) {
        resultsDiv.innerHTML = '<h2>Your Personalized Self-Care Toolkit:</h2>';
        
        // Create results container
        const resultsContainer = document.createElement("div");
        resultsContainer.className = "results-container";
        
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
  // Create button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";
  
  // Add start over button
  const restartButton = document.createElement("button");
  restartButton.className = "primary-button start-over-button";
  restartButton.textContent = "Start Over";
  restartButton.onclick = restartQuiz;
  buttonContainer.appendChild(restartButton);
  
  // Add back to home button
  const homeButton = document.createElement("button");
  homeButton.className = "primary-button back-to-home-button";
  homeButton.textContent = "Back to Home";
  homeButton.onclick = goToHome;
  buttonContainer.appendChild(homeButton);
  
  resultsDiv.appendChild(buttonContainer);
}

function goToHome() {
  console.log("Going back to home screen");
  
  // Reset form completely
  document.getElementById("struggle").value = "";
  document.getElementById("mood").value = "";
  document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
  
  // Reset quiz state
  currentQuestion = 1;
  
  // Clear results first
  document.getElementById('results').innerHTML = "";
  
  // Add a small delay to ensure DOM updates
  setTimeout(() => {
    // Show welcome page and hide quiz container
    const welcomePage = document.getElementById('welcome-page');
    const quizContainer = document.getElementById('quiz-container');
    
    welcomePage.classList.add('active');
    quizContainer.classList.remove('active');
    document.getElementById('loading').style.display = "none";
    
    console.log("Welcome page should now be visible");
    
    // Check welcome page visibility
    const welcomeComputedStyle = window.getComputedStyle(welcomePage);
    console.log("Welcome page display:", welcomeComputedStyle.display);
    console.log("Welcome page visibility:", welcomeComputedStyle.visibility);
    
    // Force welcome page visibility
    welcomePage.style.display = 'block';
    welcomePage.style.visibility = 'visible';
    
    // Hide all questions
    document.querySelectorAll('.question-page').forEach(page => {
      page.classList.remove('active');
      page.style.display = 'none';
    });
    
    // Scroll to top of page
    window.scrollTo(0, 0);
    
  console.log("Back to home complete");
  }, 100);
}

function restartQuiz() {
  console.log("Restarting quiz - going to first question");
  
  // Reset form completely
  document.getElementById("struggle").value = "";
  document.getElementById("mood").value = "";
  document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
  
  // Reset quiz state
  currentQuestion = 1;
  console.log("Reset currentQuestion to:", currentQuestion);
  
  // Hide welcome page and show quiz container
  document.getElementById('welcome-page').classList.remove('active');
  document.getElementById('quiz-container').classList.add('active');
  document.getElementById('loading').style.display = "none";
  
  console.log("Quiz container should now be visible");
  
  // Check quiz container visibility
  const quizContainer = document.getElementById('quiz-container');
  const quizComputedStyle = window.getComputedStyle(quizContainer);
  console.log("Quiz container display:", quizComputedStyle.display);
  console.log("Quiz container visibility:", quizComputedStyle.visibility);
  
  // Force quiz container visibility
  quizContainer.style.display = 'block';
  quizContainer.style.visibility = 'visible';
  
  // Add a small delay to ensure DOM updates
  setTimeout(() => {
    // Reset question visibility - hide ALL questions first
    document.querySelectorAll('.question-page').forEach(page => {
      page.classList.remove('active');
      page.style.display = 'none'; // Force hide with inline style
    });
    
    // Show ONLY the first question
    const firstQuestion = document.querySelector(`[data-question="1"]`);
    if (firstQuestion) {
      firstQuestion.classList.add('active');
      firstQuestion.style.display = 'block'; // Force show with inline style
      firstQuestion.style.visibility = 'visible';
      console.log("Question 1 classes:", firstQuestion.className);
      console.log("Question 1 should now be visible");
      
      // Check computed styles
      const computedStyle = window.getComputedStyle(firstQuestion);
      console.log("Question 1 display:", computedStyle.display);
      console.log("Question 1 visibility:", computedStyle.visibility);
      
    } else {
      console.error("Could not find question 1 element");
    }
  }, 100);
  
  // Clear results
  document.getElementById('results').innerHTML = "";
  
  // Update progress
  updateProgress();
  
  // Scroll to top of page
  window.scrollTo(0, 0);
  
  console.log("Quiz restart complete");
}

  