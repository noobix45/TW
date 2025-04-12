// document.addEventListener('DOMContentLoaded', () => {
//     const menu = document.querySelector('.meniu');
//     const menuOffset = menu.offsetTop; // Get the initial position of the menu relative to the page

//     window.addEventListener('scroll', () => {
//         console.log(window.scrollY); // Optional: Check the scroll position for debugging
//         if (window.scrollY >= menuOffset) {
//             // If we've scrolled past the menu's position, add the sticky class
//             menu.classList.add('sticky');
//         } else {
//             // If we're above the menu's initial position, remove the sticky class
//             menu.classList.remove('sticky');
//         }
//     });
// });

window.addEventListener("resize", function () {
    if (window.innerWidth <= 700) {
        document.getElementById("menu-toggle").checked = false;
    }
});

// document.addEventListener("DOMContentLoaded", function () {
//     let slides = document.querySelectorAll(".slide");
//     let currentIndex = 0;

//     function showSlide(index) {
//         slides.forEach((slide, i) => {
//             slide.classList.toggle("active", i === index);
//         });
//     }

//     function nextSlide() {
//         currentIndex = (currentIndex + 1) % slides.length;
//         showSlide(currentIndex);
//     }

//     // Ensure the first slide is visible on page load
//     showSlide(currentIndex);

//     setTimeout(() => {
//         setInterval(nextSlide, 8000);
//     }, 2000); // Delay for first transition
// });
