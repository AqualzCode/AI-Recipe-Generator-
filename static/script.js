document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recipeForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const recipeResult = document.getElementById('recipeResult');
    const recipeContent = document.getElementById('recipeContent');
    const recipeImage = document.getElementById('recipeImage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // get form values
        const cuisine = document.getElementById('cuisine').value;
        const restrictions = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        if (!cuisine) {
            alert('Please select a cuisine');
            return;
        }

        // show loading spinner with animation
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

            const data = await response.json();

            if (data.success) {
                // hide spinner
                loadingSpinner.classList.add('d-none');

                // update recipe content
                recipeContent.innerHTML = data.recipe;

                // create and add image
                recipeImage.innerHTML = `<img src="${data.image_url}" alt="${cuisine} recipe" class="img-fluid">`;

                // show recipe result
                recipeResult.classList.remove('d-none');
                recipeResult.classList.add('animate__animated', 'animate__fadeIn');

                // scroll to result
                recipeResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                throw new Error(data.error || 'Failed to generate recipe');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate recipe. Please try again.');
            loadingSpinner.classList.add('d-none');
        }
    });

    // add hover effect to checkboxes
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
