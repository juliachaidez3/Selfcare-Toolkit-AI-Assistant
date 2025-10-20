document.getElementById("toolkit-form").addEventListener("submit", async (e) => {
	e.preventDefault();
	
	try {
		const struggle = document.getElementById("struggle").value;
		const mood = document.getElementById("mood").value;
		const focus = document.getElementById("focus").value;
		const energyLevel = document.getElementById("energy").value;
	  
		const preferences = [...document.querySelectorAll("#preferences input:checked")]
		  .map(p => p.value);
	  
		const res = await fetch("/api/toolkit", {
		  method: "POST",
		  headers: { "Content-Type": "application/json" },
		  body: JSON.stringify({ struggle, mood, focus, copingPreferences: preferences, energyLevel })
		});
	  
		if (!res.ok) {
		  throw new Error(`HTTP error! status: ${res.status}`);
		}
	  
		const data = await res.json();
		const resultsDiv = document.getElementById("results");
		resultsDiv.innerHTML = "";
	  
		if (data.status === "crisis") {
		  resultsDiv.innerHTML = `<div class="alert">Safety first: ${data.message}</div>`;
		  return;
		}
	  
		if (data.error) {
		  resultsDiv.innerHTML = `<div class="alert">Error: ${data.error}</div>`;
		} else if (data.items) {
		  data.items.forEach(item => {
			const card = document.createElement("div");
			card.className = "card";
			card.innerHTML = `
			  <h3>${item.title}</h3>
			  <p><em>Why it helps:</em> ${item.why_it_helps}</p>
			  <ul>${item.steps.map(s => `<li>${s}</li>`).join("")}</ul>
			  <p class="meta">${item.time_estimate} • ${item.difficulty}</p>
			`;
			resultsDiv.appendChild(card);
		  });
		} else {
		  resultsDiv.innerHTML = `<div class="alert">No recommendations generated. Please try again.</div>`;
		}
	} catch (error) {
		console.error("Error:", error);
		document.getElementById("results").innerHTML = `<div class="alert">Error: ${error.message}</div>`;
	}
});
  