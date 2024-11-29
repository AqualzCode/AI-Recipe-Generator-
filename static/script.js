document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recipeForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const recipeResult = document.getElementById('recipeResult');
    const recipeContent = document.getElementById('recipeContent');
    const recipeImage = document.getElementById('recipeImage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form values
        const cuisine = document.getElementById('cuisine').value;
        const restrictions = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        if (!cuisine) {
            alert('Please select a cuisine');
            return;
        }

        // Show loading spinner with animation
        loadingSpinner.classList.remove('d-none');
        loadingSpinner.classList.add('animate__animated', 'animate__fadeIn');
        recipeResult.classList.add('d-none');

        try {
            const response = await fetch('/generate_recipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cuisine,
                    restrictions
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('JSON Parse Error:', jsonError);
                throw new Error('Failed to parse server response');
            }

            if (data.success) {
                // Hide loading spinner
                loadingSpinner.classList.add('d-none');

                // Update recipe content
                recipeContent.innerHTML = data.recipe || '<p>No recipe content received</p>';

                // Handle image if available
                if (data.image_url) {
                    recipeImage.innerHTML = `<img src="${data.image_url}" alt="${cuisine} recipe" class="img-fluid" onerror="this.onerror=null; this.src=''; this.alt='Image failed to load'; this.parentElement.innerHTML='<div class=\\'text-center p-4\\'><p>Image failed to load</p></div>';">`;
                } else {
                    recipeImage.innerHTML = '<div class="text-center p-4"><p>Image generation failed. Recipe is still available below.</p></div>';
                }

                // Show warning if present
                if (data.warning) {
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'alert alert-warning mt-3';
                    warningDiv.textContent = data.warning;
                    recipeContent.insertBefore(warningDiv, recipeContent.firstChild);
                }

                // Show recipe result with animation
                recipeResult.classList.remove('d-none');
                recipeResult.classList.add('animate__animated', 'animate__fadeIn');

                // Scroll to result
                recipeResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                throw new Error(data.error || 'Failed to generate recipe');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Failed to generate recipe. Please try again.');
            loadingSpinner.classList.add('d-none');
        }
    });

    // Add hover effect to checkboxes
    const checkboxes = document.querySelectorAll('.custom-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('mouseenter', () => {
            checkbox.style.transform = 'translateY(-2px)';
            checkbox.style.transition = 'transform 0.3s ease';
        });

        checkbox.addEventListener('mouseleave', () => {
            checkbox.style.transform = 'translateY(0)';
        });
    });
});
