function renderDistractorBanner(activeProblem) {
  const banner = document.getElementById("distractor-banner");
  if (!banner) return;

  const allCompleted = activeProblem.solution.every(s => s.isAnswered);

  if (allCompleted && activeProblem.distractors && activeProblem.distractors.length > 0) {
    const list = activeProblem.distractors.map(v => {
      const meta = resolveMeta(v, activeProblem.varsDb);
      return `<strong>${meta.name} ($${meta.symbol}$)</strong>`;
    }).join(", ");
    banner.style.display = "block";
    banner.innerHTML = `<strong>Exam Tip (Distractor Variable Detected):</strong> Notice that ${list} was given in the specifications but was not needed in the solution path. Exams often supply extra parameters to test whether you choose the correct relations.`;

    // Render KaTeX for math symbols inside the banner
    if (window.renderMathInElement) {
      window.renderMathInElement(banner, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        output: "html",
        strict: false,
        throwOnError: false
      });
    }
  } else {
    banner.style.display = "none";
  }
}